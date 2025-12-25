"""
Quanty.studio Secure API Patterns
==================================

This file demonstrates production-grade security patterns for multi-tenant APIs.
All examples enforce workspace isolation via RLS and role-based access control.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, Field, validator
import json
from datetime import datetime

from database import get_db
from auth import get_current_user_id
from middleware.workspace_auth import (
    require_workspace_access,
    WorkspaceContext,
    WorkspaceRole,
    set_rls_context
)


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class CreateWorkspaceRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)

    @validator('name')
    def validate_name(cls, v):
        """Sanitize workspace name."""
        if not v.strip():
            raise ValueError("Name cannot be empty")
        # Remove potentially dangerous characters
        sanitized = ''.join(c for c in v if c.isalnum() or c in ' -_')
        return sanitized[:255]


class InviteMemberRequest(BaseModel):
    email: str = Field(..., regex=r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
    role: WorkspaceRole = Field(default=WorkspaceRole.VIEWER)


class UpdateMemberRoleRequest(BaseModel):
    role: WorkspaceRole


class CreateTableRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    display_name: Optional[str] = Field(None, max_length=255)
    schema_definition: List[dict] = Field(..., min_items=1)

    @validator('name')
    def validate_table_name(cls, v):
        """Ensure table name is safe for SQL."""
        # Only allow alphanumeric and underscores
        if not v.replace('_', '').isalnum():
            raise ValueError("Table name must be alphanumeric with underscores")
        if v[0].isdigit():
            raise ValueError("Table name cannot start with a digit")
        # Check against SQL reserved words
        RESERVED_WORDS = {
            'select', 'insert', 'update', 'delete', 'drop', 'create',
            'alter', 'table', 'index', 'view', 'user', 'users', 'admin'
        }
        if v.lower() in RESERVED_WORDS:
            raise ValueError(f"'{v}' is a reserved word")
        return v.lower()


class TableQueryRequest(BaseModel):
    filters: Optional[dict] = Field(default_factory=dict)
    limit: int = Field(default=100, ge=1, le=10000)
    offset: int = Field(default=0, ge=0)


# ============================================
# WORKSPACE MANAGEMENT ENDPOINTS
# ============================================

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


@router.get("")
async def list_user_workspaces(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    List all workspaces the current user has access to.

    Security:
    - Requires: Valid JWT token
    - Returns: Only workspaces where user is a member
    - RLS: Automatically enforced
    """
    # Set RLS context
    set_rls_context(db, user_id)

    # Query with explicit JOIN (more performant than relying solely on RLS)
    workspaces = db.execute(
        text("""
            SELECT
                w.id,
                w.name,
                w.slug,
                w.type,
                w.description,
                wm.role,
                w.created_at,
                (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count,
                (SELECT COUNT(*) FROM tables_metadata WHERE workspace_id = w.id) as table_count
            FROM workspaces w
            JOIN workspace_members wm ON wm.workspace_id = w.id
            WHERE wm.user_id = :user_id
            ORDER BY w.created_at DESC
        """),
        {"user_id": user_id}
    ).fetchall()

    return {
        "workspaces": [
            {
                "id": str(row.id),
                "name": row.name,
                "slug": row.slug,
                "type": row.type,
                "description": row.description,
                "role": row.role,
                "member_count": row.member_count,
                "table_count": row.table_count,
                "created_at": row.created_at.isoformat()
            }
            for row in workspaces
        ]
    }


@router.post("")
async def create_workspace(
    request: CreateWorkspaceRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a new team workspace.

    Security:
    - Requires: Valid JWT token
    - Creator becomes owner automatically
    - Personal workspaces created automatically on signup (cannot create via API)
    """
    # Set RLS context
    set_rls_context(db, user_id)

    # Generate unique slug
    import re
    base_slug = re.sub(r'[^a-z0-9]+', '-', request.name.lower()).strip('-')
    slug = base_slug
    counter = 1

    while True:
        existing = db.execute(
            text("SELECT id FROM workspaces WHERE slug = :slug"),
            {"slug": slug}
        ).fetchone()

        if not existing:
            break

        slug = f"{base_slug}-{counter}"
        counter += 1

    # Create workspace
    result = db.execute(
        text("""
            INSERT INTO workspaces (name, slug, type, owner_id, description)
            VALUES (:name, :slug, 'team', :owner_id, :description)
            RETURNING id, created_at
        """),
        {
            "name": request.name,
            "slug": slug,
            "owner_id": user_id,
            "description": request.description
        }
    )

    row = result.fetchone()
    workspace_id = str(row.id)

    # Add creator as owner member
    db.execute(
        text("""
            INSERT INTO workspace_members (workspace_id, user_id, role)
            VALUES (:workspace_id, :user_id, 'owner')
        """),
        {"workspace_id": workspace_id, "user_id": user_id}
    )

    db.commit()

    return {
        "id": workspace_id,
        "name": request.name,
        "slug": slug,
        "type": "team",
        "role": "owner",
        "created_at": row.created_at.isoformat()
    }


@router.get("/{workspace_id}")
async def get_workspace(
    workspace_id: str,
    ctx: WorkspaceContext = Depends(require_workspace_access()),
    db: Session = Depends(get_db)
):
    """
    Get detailed workspace information.

    Security:
    - Requires: Workspace membership (any role)
    - RLS: Automatically enforced
    """
    workspace = db.execute(
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
                u.email as owner_email,
                u.full_name as owner_name
            FROM workspaces w
            JOIN users u ON u.id = w.owner_id
            WHERE w.id = :workspace_id
        """),
        {"workspace_id": workspace_id}
    ).fetchone()

    if not workspace:
        # Should not happen due to RLS, but defensive check
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Get member statistics
    stats = db.execute(
        text("""
            SELECT
                (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = :ws_id) as member_count,
                (SELECT COUNT(*) FROM tables_metadata WHERE workspace_id = :ws_id) as table_count,
                (SELECT COUNT(*) FROM dashboards WHERE workspace_id = :ws_id) as dashboard_count
        """),
        {"ws_id": workspace_id}
    ).fetchone()

    return {
        "id": str(workspace.id),
        "name": workspace.name,
        "slug": workspace.slug,
        "type": workspace.type,
        "description": workspace.description,
        "settings": workspace.settings,
        "owner": {
            "id": str(workspace.owner_id),
            "email": workspace.owner_email,
            "name": workspace.owner_name
        },
        "stats": {
            "members": stats.member_count,
            "tables": stats.table_count,
            "dashboards": stats.dashboard_count
        },
        "current_user_role": ctx.role.value,
        "is_owner": ctx.is_owner,
        "created_at": workspace.created_at.isoformat()
    }


@router.patch("/{workspace_id}")
async def update_workspace(
    workspace_id: str,
    request: CreateWorkspaceRequest,
    ctx: WorkspaceContext = Depends(
        require_workspace_access(required_role=WorkspaceRole.OWNER)
    ),
    db: Session = Depends(get_db)
):
    """
    Update workspace settings.

    Security:
    - Requires: Owner role only
    - RLS: UPDATE policy enforces ownership
    """
    result = db.execute(
        text("""
            UPDATE workspaces
            SET name = :name, description = :description
            WHERE id = :workspace_id
            RETURNING id
        """),
        {
            "workspace_id": workspace_id,
            "name": request.name,
            "description": request.description
        }
    )

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Workspace not found")

    db.commit()

    return {"message": "Workspace updated successfully"}


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    ctx: WorkspaceContext = Depends(
        require_workspace_access(required_role=WorkspaceRole.OWNER)
    ),
    db: Session = Depends(get_db)
):
    """
    Delete a workspace.

    Security:
    - Requires: Owner role only
    - RLS: DELETE policy prevents deletion of personal workspaces
    - Cascading: All tables, members, etc. are automatically deleted
    """
    # Verify not deleting personal workspace (RLS also enforces this)
    workspace = db.execute(
        text("SELECT type FROM workspaces WHERE id = :workspace_id"),
        {"workspace_id": workspace_id}
    ).fetchone()

    if workspace and workspace.type == 'personal':
        raise HTTPException(
            status_code=400,
            detail="Cannot delete personal workspace"
        )

    result = db.execute(
        text("DELETE FROM workspaces WHERE id = :workspace_id"),
        {"workspace_id": workspace_id}
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found or already deleted"
        )

    db.commit()

    return {"message": "Workspace deleted successfully"}


# ============================================
# MEMBER MANAGEMENT ENDPOINTS
# ============================================

@router.get("/{workspace_id}/members")
async def list_workspace_members(
    workspace_id: str,
    ctx: WorkspaceContext = Depends(require_workspace_access()),
    db: Session = Depends(get_db)
):
    """
    List all members of a workspace.

    Security:
    - Requires: Workspace membership (any role)
    - RLS: Automatically filters to authorized workspace
    """
    members = db.execute(
        text("""
            SELECT
                wm.id,
                wm.user_id,
                wm.role,
                wm.joined_at,
                u.email,
                u.full_name,
                u.avatar_url
            FROM workspace_members wm
            JOIN users u ON u.id = wm.user_id
            WHERE wm.workspace_id = :workspace_id
            ORDER BY wm.joined_at ASC
        """),
        {"workspace_id": workspace_id}
    ).fetchall()

    return {
        "members": [
            {
                "id": str(row.id),
                "user_id": str(row.user_id),
                "role": row.role,
                "email": row.email,
                "full_name": row.full_name,
                "avatar_url": row.avatar_url,
                "joined_at": row.joined_at.isoformat()
            }
            for row in members
        ]
    }


@router.post("/{workspace_id}/members/invite")
async def invite_workspace_member(
    workspace_id: str,
    request: InviteMemberRequest,
    ctx: WorkspaceContext = Depends(
        require_workspace_access(required_role=WorkspaceRole.OWNER)
    ),
    db: Session = Depends(get_db)
):
    """
    Invite a user to the workspace.

    Security:
    - Requires: Owner role only
    - Creates invitation token
    - Email sent to invitee (implementation not shown)
    """
    import secrets
    from datetime import timedelta

    # Check if user already exists and is a member
    existing = db.execute(
        text("""
            SELECT wm.id
            FROM workspace_members wm
            JOIN users u ON u.id = wm.user_id
            WHERE wm.workspace_id = :workspace_id
            AND u.email = :email
        """),
        {"workspace_id": workspace_id, "email": request.email}
    ).fetchone()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="User is already a member of this workspace"
        )

    # Check for pending invitation
    pending = db.execute(
        text("""
            SELECT id FROM workspace_invitations
            WHERE workspace_id = :workspace_id
            AND email = :email
            AND accepted_at IS NULL
            AND expires_at > NOW()
        """),
        {"workspace_id": workspace_id, "email": request.email}
    ).fetchone()

    if pending:
        raise HTTPException(
            status_code=400,
            detail="Invitation already sent to this email"
        )

    # Create invitation
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)

    result = db.execute(
        text("""
            INSERT INTO workspace_invitations
            (workspace_id, email, role, token, invited_by, expires_at)
            VALUES (:workspace_id, :email, :role, :token, :invited_by, :expires_at)
            RETURNING id
        """),
        {
            "workspace_id": workspace_id,
            "email": request.email,
            "role": request.role.value,
            "token": token,
            "invited_by": ctx.user_id,
            "expires_at": expires_at
        }
    )

    invitation_id = str(result.scalar())
    db.commit()

    # TODO: Send invitation email
    # send_invitation_email(request.email, token, ctx.workspace_name)

    return {
        "invitation_id": invitation_id,
        "email": request.email,
        "role": request.role.value,
        "expires_at": expires_at.isoformat()
    }


@router.patch("/{workspace_id}/members/{member_id}")
async def update_member_role(
    workspace_id: str,
    member_id: str,
    request: UpdateMemberRoleRequest,
    ctx: WorkspaceContext = Depends(
        require_workspace_access(required_role=WorkspaceRole.OWNER)
    ),
    db: Session = Depends(get_db)
):
    """
    Update a member's role.

    Security:
    - Requires: Owner role only
    - Cannot demote yourself if you're the only owner
    - RLS: UPDATE policy enforces ownership
    """
    # Check if this is the last owner
    if request.role != WorkspaceRole.OWNER:
        owner_count = db.execute(
            text("""
                SELECT COUNT(*) as count
                FROM workspace_members
                WHERE workspace_id = :workspace_id
                AND role = 'owner'
            """),
            {"workspace_id": workspace_id}
        ).scalar()

        member = db.execute(
            text("SELECT user_id, role FROM workspace_members WHERE id = :member_id"),
            {"member_id": member_id}
        ).fetchone()

        if member and member.role == 'owner' and owner_count == 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot demote the last owner. Promote another member first."
            )

    result = db.execute(
        text("""
            UPDATE workspace_members
            SET role = :role
            WHERE id = :member_id
            AND workspace_id = :workspace_id
        """),
        {
            "member_id": member_id,
            "workspace_id": workspace_id,
            "role": request.role.value
        }
    )

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Member not found")

    db.commit()

    return {"message": "Member role updated successfully"}


@router.delete("/{workspace_id}/members/{member_id}")
async def remove_workspace_member(
    workspace_id: str,
    member_id: str,
    ctx: WorkspaceContext = Depends(
        require_workspace_access(required_role=WorkspaceRole.OWNER)
    ),
    db: Session = Depends(get_db)
):
    """
    Remove a member from the workspace.

    Security:
    - Requires: Owner role only
    - Cannot remove yourself if you're owner
    - RLS: DELETE policy enforces ownership and self-removal protection
    """
    # Get member info
    member = db.execute(
        text("""
            SELECT user_id, role
            FROM workspace_members
            WHERE id = :member_id
            AND workspace_id = :workspace_id
        """),
        {"member_id": member_id, "workspace_id": workspace_id}
    ).fetchone()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Cannot remove yourself if owner (RLS also enforces this)
    if str(member.user_id) == ctx.user_id and member.role == 'owner':
        raise HTTPException(
            status_code=400,
            detail="Cannot remove yourself as owner. Transfer ownership first."
        )

    result = db.execute(
        text("""
            DELETE FROM workspace_members
            WHERE id = :member_id
            AND workspace_id = :workspace_id
        """),
        {"member_id": member_id, "workspace_id": workspace_id}
    )

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Member not found")

    db.commit()

    return {"message": "Member removed successfully"}


# ============================================
# TABLE MANAGEMENT ENDPOINTS
# ============================================

@router.get("/{workspace_id}/tables")
async def list_workspace_tables(
    workspace_id: str,
    ctx: WorkspaceContext = Depends(require_workspace_access()),
    db: Session = Depends(get_db)
):
    """
    List all tables in a workspace.

    Security:
    - Requires: Workspace membership (any role)
    - RLS: Automatically filters to authorized workspace
    """
    tables = db.execute(
        text("""
            SELECT
                t.id,
                t.name,
                t.display_name,
                t.row_count,
                t.schema_definition,
                t.created_at,
                u.email as created_by_email,
                u.full_name as created_by_name
            FROM tables_metadata t
            JOIN users u ON u.id = t.created_by
            WHERE t.workspace_id = :workspace_id
            ORDER BY t.created_at DESC
        """),
        {"workspace_id": workspace_id}
    ).fetchall()

    return {
        "tables": [
            {
                "id": str(row.id),
                "name": row.name,
                "display_name": row.display_name,
                "row_count": row.row_count,
                "columns": len(row.schema_definition) if row.schema_definition else 0,
                "created_by": {
                    "email": row.created_by_email,
                    "name": row.created_by_name
                },
                "created_at": row.created_at.isoformat()
            }
            for row in tables
        ]
    }


@router.post("/{workspace_id}/tables")
async def create_workspace_table(
    workspace_id: str,
    request: CreateTableRequest,
    ctx: WorkspaceContext = Depends(
        require_workspace_access(required_role=WorkspaceRole.EDITOR)
    ),
    db: Session = Depends(get_db)
):
    """
    Create a new table in the workspace.

    Security:
    - Requires: Editor or Owner role
    - RLS: INSERT policy enforces edit permissions
    - Table name validated to prevent SQL injection
    """
    # Check if table already exists
    existing = db.execute(
        text("""
            SELECT id FROM tables_metadata
            WHERE workspace_id = :workspace_id
            AND name = :name
        """),
        {"workspace_id": workspace_id, "name": request.name}
    ).fetchone()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Table '{request.name}' already exists in this workspace"
        )

    # Create table metadata
    result = db.execute(
        text("""
            INSERT INTO tables_metadata
            (workspace_id, name, display_name, schema_definition, created_by)
            VALUES (:workspace_id, :name, :display_name, :schema, :created_by)
            RETURNING id
        """),
        {
            "workspace_id": workspace_id,
            "name": request.name,
            "display_name": request.display_name or request.name,
            "schema": json.dumps(request.schema_definition),
            "created_by": ctx.user_id
        }
    )

    table_id = str(result.scalar())

    # Create actual data table with workspace_id column for isolation
    columns_sql = ", ".join([
        f'"{col["name"]}" {col["type"]}'
        for col in request.schema_definition
    ])

    db.execute(text(f"""
        CREATE TABLE IF NOT EXISTS "{request.name}" (
            rowid SERIAL PRIMARY KEY,
            workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            {columns_sql}
        )
    """))

    # Create index on workspace_id for performance
    db.execute(text(f"""
        CREATE INDEX idx_{request.name}_workspace
        ON "{request.name}"(workspace_id)
    """))

    db.commit()

    return {
        "id": table_id,
        "name": request.name,
        "display_name": request.display_name or request.name,
        "message": "Table created successfully"
    }


@router.delete("/{workspace_id}/tables/{table_id}")
async def delete_workspace_table(
    workspace_id: str,
    table_id: str,
    ctx: WorkspaceContext = Depends(
        require_workspace_access(required_role=WorkspaceRole.OWNER)
    ),
    db: Session = Depends(get_db)
):
    """
    Delete a table from the workspace.

    Security:
    - Requires: Owner role only
    - RLS: DELETE policy enforces ownership
    - Drops both metadata and actual data table
    """
    # Get table name before deletion
    table = db.execute(
        text("""
            SELECT name FROM tables_metadata
            WHERE id = :table_id
            AND workspace_id = :workspace_id
        """),
        {"table_id": table_id, "workspace_id": workspace_id}
    ).fetchone()

    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    # Delete metadata (RLS enforces ownership)
    result = db.execute(
        text("""
            DELETE FROM tables_metadata
            WHERE id = :table_id
            AND workspace_id = :workspace_id
        """),
        {"table_id": table_id, "workspace_id": workspace_id}
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="Table not found or access denied"
        )

    # Drop actual data table
    db.execute(text(f'DROP TABLE IF EXISTS "{table.name}" CASCADE'))

    db.commit()

    return {"message": f"Table '{table.name}' deleted successfully"}


# Export router
__all__ = ['router']
