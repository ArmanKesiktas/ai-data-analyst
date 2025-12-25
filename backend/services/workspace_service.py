"""
Workspace Service
CRUD operations for workspaces with security enforcement
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from uuid import UUID
import secrets
from datetime import datetime, timedelta

from middleware.workspace_auth import (
    WorkspaceRole, 
    verify_workspace_access,
    set_rls_context,
    WorkspaceAccessError
)


class WorkspaceService:
    """
    Service for workspace management with security enforcement.
    """
    
    def __init__(self, db: Session, user_id: str):
        self.db = db
        self.user_id = user_id
        # Set RLS context for all operations
        set_rls_context(db, user_id)
    
    # ==========================================
    # WORKSPACE CRUD
    # ==========================================
    
    def list_workspaces(self) -> List[dict]:
        """
        List all workspaces the user has access to.
        RLS automatically filters to member workspaces.
        """
        result = self.db.execute(
            text("""
                SELECT 
                    w.id,
                    w.name,
                    w.slug,
                    w.type,
                    w.created_at,
                    wm.role,
                    (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count,
                    (SELECT COUNT(*) FROM tables_metadata WHERE workspace_id = w.id) as table_count
                FROM workspaces w
                JOIN workspace_members wm ON w.id = wm.workspace_id
                WHERE wm.user_id = :user_id
                ORDER BY w.type = 'personal' DESC, w.name ASC
            """),
            {"user_id": self.user_id}
        ).fetchall()
        
        return [
            {
                "id": str(row.id),
                "name": row.name,
                "slug": row.slug,
                "type": row.type,
                "role": row.role,
                "member_count": row.member_count,
                "table_count": row.table_count,
                "created_at": row.created_at.isoformat()
            }
            for row in result
        ]
    
    def get_workspace(self, workspace_id: str) -> Optional[dict]:
        """
        Get workspace details.
        RLS ensures user has access.
        """
        result = self.db.execute(
            text("""
                SELECT 
                    w.id,
                    w.name,
                    w.slug,
                    w.type,
                    w.description,
                    w.settings,
                    w.owner_id,
                    w.created_at,
                    wm.role as user_role
                FROM workspaces w
                JOIN workspace_members wm ON w.id = wm.workspace_id
                WHERE w.id = :workspace_id
                AND wm.user_id = :user_id
            """),
            {"workspace_id": workspace_id, "user_id": self.user_id}
        ).fetchone()
        
        if not result:
            return None
        
        return {
            "id": str(result.id),
            "name": result.name,
            "slug": result.slug,
            "type": result.type,
            "description": result.description,
            "settings": result.settings,
            "owner_id": str(result.owner_id),
            "user_role": result.user_role,
            "created_at": result.created_at.isoformat()
        }
    
    def create_workspace(self, name: str, description: str = None) -> dict:
        """
        Create a new team workspace.
        User automatically becomes owner.
        """
        # Generate unique slug
        slug = self._generate_slug(name)
        
        # Create workspace
        result = self.db.execute(
            text("""
                INSERT INTO workspaces (name, slug, type, owner_id, description)
                VALUES (:name, :slug, 'team', :owner_id, :description)
                RETURNING id, name, slug, type, created_at
            """),
            {
                "name": name,
                "slug": slug,
                "owner_id": self.user_id,
                "description": description
            }
        ).fetchone()
        
        workspace_id = str(result.id)
        
        # Add creator as owner member
        self.db.execute(
            text("""
                INSERT INTO workspace_members (workspace_id, user_id, role)
                VALUES (:workspace_id, :user_id, 'owner')
            """),
            {"workspace_id": workspace_id, "user_id": self.user_id}
        )
        
        self.db.commit()
        
        return {
            "id": workspace_id,
            "name": result.name,
            "slug": result.slug,
            "type": result.type,
            "role": "owner",
            "created_at": result.created_at.isoformat()
        }
    
    def update_workspace(self, workspace_id: str, name: str = None, description: str = None) -> dict:
        """
        Update workspace details.
        Only owner can update.
        """
        # Verify owner access
        access = self.db.execute(
            text("""
                SELECT role FROM workspace_members
                WHERE workspace_id = :workspace_id AND user_id = :user_id
            """),
            {"workspace_id": workspace_id, "user_id": self.user_id}
        ).fetchone()
        
        if not access or access.role != 'owner':
            raise WorkspaceAccessError("Only workspace owners can update workspace settings")
        
        # Build update query
        updates = []
        params = {"workspace_id": workspace_id}
        
        if name:
            updates.append("name = :name")
            params["name"] = name
        if description is not None:
            updates.append("description = :description")
            params["description"] = description
        
        if updates:
            self.db.execute(
                text(f"""
                    UPDATE workspaces
                    SET {', '.join(updates)}, updated_at = NOW()
                    WHERE id = :workspace_id
                """),
                params
            )
            self.db.commit()
        
        return self.get_workspace(workspace_id)
    
    def delete_workspace(self, workspace_id: str) -> bool:
        """
        Delete a workspace.
        Only owner can delete, cannot delete personal workspace.
        """
        # Verify it's not a personal workspace
        workspace = self.get_workspace(workspace_id)
        if not workspace:
            raise WorkspaceAccessError("Workspace not found")
        
        if workspace["type"] == "personal":
            raise WorkspaceAccessError("Cannot delete personal workspace")
        
        if workspace["user_role"] != "owner":
            raise WorkspaceAccessError("Only workspace owners can delete workspaces")
        
        self.db.execute(
            text("DELETE FROM workspaces WHERE id = :workspace_id"),
            {"workspace_id": workspace_id}
        )
        self.db.commit()
        
        return True
    
    # ==========================================
    # MEMBER MANAGEMENT
    # ==========================================
    
    def list_members(self, workspace_id: str) -> List[dict]:
        """
        List all members of a workspace.
        """
        result = self.db.execute(
            text("""
                SELECT 
                    u.id,
                    u.email,
                    u.full_name,
                    u.avatar_url,
                    wm.role,
                    wm.joined_at
                FROM workspace_members wm
                JOIN users u ON u.id = wm.user_id
                WHERE wm.workspace_id = :workspace_id
                ORDER BY 
                    wm.role = 'owner' DESC,
                    wm.role = 'editor' DESC,
                    wm.joined_at ASC
            """),
            {"workspace_id": workspace_id}
        ).fetchall()
        
        return [
            {
                "id": str(row.id),
                "email": row.email,
                "full_name": row.full_name,
                "avatar_url": row.avatar_url,
                "role": row.role,
                "joined_at": row.joined_at.isoformat()
            }
            for row in result
        ]
    
    def invite_member(self, workspace_id: str, email: str, role: str = "viewer") -> dict:
        """
        Invite a user to workspace by email.
        Only owner can invite.
        """
        # Verify owner access
        access = self._verify_owner(workspace_id)
        
        # Generate invitation token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        result = self.db.execute(
            text("""
                INSERT INTO workspace_invitations 
                (workspace_id, email, role, token, invited_by, expires_at)
                VALUES (:workspace_id, :email, :role, :token, :invited_by, :expires_at)
                RETURNING id, token, expires_at
            """),
            {
                "workspace_id": workspace_id,
                "email": email.lower(),
                "role": role,
                "token": token,
                "invited_by": self.user_id,
                "expires_at": expires_at
            }
        ).fetchone()
        
        self.db.commit()
        
        return {
            "id": str(result.id),
            "email": email,
            "role": role,
            "token": result.token,
            "expires_at": result.expires_at.isoformat()
        }
    
    def update_member_role(self, workspace_id: str, member_id: str, new_role: str) -> dict:
        """
        Update a member's role.
        Only owner can change roles.
        """
        self._verify_owner(workspace_id)
        
        # Cannot demote yourself as owner
        if member_id == self.user_id:
            raise WorkspaceAccessError("Cannot change your own role")
        
        # Cannot promote to owner (transfer ownership is separate)
        if new_role == "owner":
            raise WorkspaceAccessError("Use transfer_ownership to change workspace owner")
        
        self.db.execute(
            text("""
                UPDATE workspace_members
                SET role = :role
                WHERE workspace_id = :workspace_id AND user_id = :member_id
            """),
            {"workspace_id": workspace_id, "member_id": member_id, "role": new_role}
        )
        self.db.commit()
        
        return {"member_id": member_id, "role": new_role}
    
    def remove_member(self, workspace_id: str, member_id: str) -> bool:
        """
        Remove a member from workspace.
        Owner can remove anyone except themselves.
        """
        self._verify_owner(workspace_id)
        
        if member_id == self.user_id:
            raise WorkspaceAccessError("Cannot remove yourself from workspace")
        
        self.db.execute(
            text("""
                DELETE FROM workspace_members
                WHERE workspace_id = :workspace_id AND user_id = :member_id
            """),
            {"workspace_id": workspace_id, "member_id": member_id}
        )
        self.db.commit()
        
        return True
    
    # ==========================================
    # HELPER METHODS
    # ==========================================
    
    def _verify_owner(self, workspace_id: str) -> dict:
        """Verify current user is workspace owner"""
        access = self.db.execute(
            text("""
                SELECT role FROM workspace_members
                WHERE workspace_id = :workspace_id AND user_id = :user_id
            """),
            {"workspace_id": workspace_id, "user_id": self.user_id}
        ).fetchone()
        
        if not access:
            raise WorkspaceAccessError("Not a member of this workspace")
        
        if access.role != 'owner':
            raise WorkspaceAccessError("Only workspace owners can perform this action")
        
        return {"role": access.role}
    
    def _generate_slug(self, name: str) -> str:
        """Generate unique slug from name"""
        import re
        # Convert to lowercase, replace spaces with hyphens
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        
        # Add random suffix for uniqueness
        suffix = secrets.token_hex(4)
        return f"{slug}-{suffix}"
