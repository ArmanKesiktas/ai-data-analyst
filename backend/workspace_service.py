"""
Workspace management service
Handles workspace CRUD operations, member management, and invitations
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from database import Workspace, WorkspaceMember, WorkspaceInvitation, User
from datetime import datetime, timedelta
from typing import List, Optional, Dict
import json


class WorkspaceService:
    """Service for workspace operations"""

    @staticmethod
    def create_workspace(db: Session, name: str, owner_id: int, description: str = None) -> Workspace:
        """
        Create a new workspace

        Args:
            db: Database session
            name: Workspace name
            owner_id: User ID of the owner
            description: Optional description

        Returns:
            Created workspace
        """
        workspace = Workspace(
            name=name,
            description=description,
            owner_id=owner_id
        )
        db.add(workspace)
        db.commit()
        db.refresh(workspace)

        # Add owner as a member with owner role
        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=owner_id,
            role="owner"
        )
        db.add(member)
        db.commit()

        return workspace

    @staticmethod
    def get_workspace(db: Session, workspace_id: int, user_id: int) -> Optional[Workspace]:
        """
        Get workspace by ID (with access check)

        Args:
            db: Database session
            workspace_id: Workspace ID
            user_id: Current user ID

        Returns:
            Workspace if user has access, None otherwise
        """
        # Check if user is a member or owner
        workspace = db.query(Workspace).filter(
            Workspace.id == workspace_id,
            Workspace.is_active == True
        ).first()

        if not workspace:
            return None

        # Verify user has access
        is_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id
        ).first()

        if not is_member:
            return None

        return workspace

    @staticmethod
    def list_user_workspaces(db: Session, user_id: int) -> List[Dict]:
        """
        List all workspaces user has access to

        Args:
            db: Database session
            user_id: Current user ID

        Returns:
            List of workspaces with membership info
        """
        # Get all workspace memberships
        memberships = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == user_id
        ).all()

        workspaces = []
        for membership in memberships:
            workspace = db.query(Workspace).filter(
                Workspace.id == membership.workspace_id,
                Workspace.is_active == True
            ).first()

            if workspace:
                # Get member count
                member_count = db.query(WorkspaceMember).filter(
                    WorkspaceMember.workspace_id == workspace.id
                ).count()

                workspaces.append({
                    "id": workspace.id,
                    "name": workspace.name,
                    "description": workspace.description,
                    "role": membership.role,
                    "is_owner": workspace.owner_id == user_id,
                    "member_count": member_count,
                    "created_at": workspace.created_at.isoformat(),
                    "updated_at": workspace.updated_at.isoformat()
                })

        return workspaces

    @staticmethod
    def update_workspace(
        db: Session,
        workspace_id: int,
        user_id: int,
        name: str = None,
        description: str = None
    ) -> Optional[Workspace]:
        """
        Update workspace (owner only)

        Args:
            db: Database session
            workspace_id: Workspace ID
            user_id: Current user ID
            name: New name
            description: New description

        Returns:
            Updated workspace or None if unauthorized
        """
        workspace = db.query(Workspace).filter(
            Workspace.id == workspace_id,
            Workspace.owner_id == user_id  # Only owner can update
        ).first()

        if not workspace:
            return None

        if name:
            workspace.name = name
        if description is not None:
            workspace.description = description

        workspace.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(workspace)

        return workspace

    @staticmethod
    def delete_workspace(db: Session, workspace_id: int, user_id: int) -> bool:
        """
        Delete workspace (soft delete, owner only)

        Args:
            db: Database session
            workspace_id: Workspace ID
            user_id: Current user ID

        Returns:
            True if deleted, False if unauthorized
        """
        workspace = db.query(Workspace).filter(
            Workspace.id == workspace_id,
            Workspace.owner_id == user_id
        ).first()

        if not workspace:
            return False

        # Soft delete
        workspace.is_active = False
        workspace.updated_at = datetime.utcnow()
        db.commit()

        return True

    @staticmethod
    def add_member(
        db: Session,
        workspace_id: int,
        user_id: int,
        new_member_email: str,
        role: str = "viewer"
    ) -> Optional[WorkspaceMember]:
        """
        Add a member to workspace (must already be invited and accepted)

        Args:
            db: Database session
            workspace_id: Workspace ID
            user_id: Current user ID (must be owner/editor)
            new_member_email: Email of new member
            role: Role to assign

        Returns:
            WorkspaceMember or None
        """
        # Check if current user has permission (owner or editor)
        current_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
            or_(WorkspaceMember.role == "owner", WorkspaceMember.role == "editor")
        ).first()

        if not current_member:
            return None

        # Find new member by email
        new_user = db.query(User).filter(User.email == new_member_email).first()
        if not new_user:
            return None

        # Check if already a member
        existing = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == new_user.id
        ).first()

        if existing:
            return None

        # Add member
        member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=new_user.id,
            role=role
        )
        db.add(member)
        db.commit()
        db.refresh(member)

        return member

    @staticmethod
    def remove_member(
        db: Session,
        workspace_id: int,
        user_id: int,
        member_id: int
    ) -> bool:
        """
        Remove a member from workspace (owner only, can't remove self)

        Args:
            db: Database session
            workspace_id: Workspace ID
            user_id: Current user ID (must be owner)
            member_id: ID of member to remove

        Returns:
            True if removed, False otherwise
        """
        # Check if current user is owner
        workspace = db.query(Workspace).filter(
            Workspace.id == workspace_id,
            Workspace.owner_id == user_id
        ).first()

        if not workspace:
            return False

        # Can't remove yourself
        if member_id == user_id:
            return False

        # Remove member
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == member_id
        ).first()

        if member:
            db.delete(member)
            db.commit()
            return True

        return False

    @staticmethod
    def list_members(db: Session, workspace_id: int, user_id: int) -> List[Dict]:
        """
        List all members of a workspace

        Args:
            db: Database session
            workspace_id: Workspace ID
            user_id: Current user ID (must be a member)

        Returns:
            List of members with details
        """
        # Check if user has access
        member_check = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id
        ).first()

        if not member_check:
            return []

        # Get all members
        members = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id
        ).all()

        result = []
        for member in members:
            user = db.query(User).filter(User.id == member.user_id).first()
            if user:
                result.append({
                    "id": member.id,
                    "user_id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": member.role,
                    "joined_at": member.joined_at.isoformat()
                })

        return result

    @staticmethod
    def create_invitation(
        db: Session,
        workspace_id: int,
        user_id: int,
        email: str,
        role: str = "viewer"
    ) -> Optional[WorkspaceInvitation]:
        """
        Create a workspace invitation

        Args:
            db: Database session
            workspace_id: Workspace ID
            user_id: Current user ID (inviter)
            email: Email to invite
            role: Role to assign

        Returns:
            WorkspaceInvitation or None
        """
        # Check if user has permission
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
            or_(WorkspaceMember.role == "owner", WorkspaceMember.role == "editor")
        ).first()

        if not member:
            return None

        # Check if already invited (and not accepted)
        existing = db.query(WorkspaceInvitation).filter(
            WorkspaceInvitation.workspace_id == workspace_id,
            WorkspaceInvitation.email == email,
            WorkspaceInvitation.is_active == True,
            WorkspaceInvitation.accepted_at == None
        ).first()

        if existing:
            return None

        # Create invitation
        invitation = WorkspaceInvitation(
            workspace_id=workspace_id,
            email=email,
            role=role,
            token=WorkspaceInvitation.generate_token(),
            invited_by=user_id,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(invitation)
        db.commit()
        db.refresh(invitation)

        return invitation

    @staticmethod
    def accept_invitation(
        db: Session,
        token: str,
        user_id: int
    ) -> Optional[WorkspaceMember]:
        """
        Accept a workspace invitation

        Args:
            db: Database session
            token: Invitation token
            user_id: User accepting the invitation

        Returns:
            WorkspaceMember or None
        """
        # Find invitation
        invitation = db.query(WorkspaceInvitation).filter(
            WorkspaceInvitation.token == token,
            WorkspaceInvitation.is_active == True,
            WorkspaceInvitation.accepted_at == None,
            WorkspaceInvitation.expires_at > datetime.utcnow()
        ).first()

        if not invitation:
            return None

        # Verify email matches user
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.email != invitation.email:
            return None

        # Check if already a member
        existing = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == invitation.workspace_id,
            WorkspaceMember.user_id == user_id
        ).first()

        if existing:
            return existing

        # Add member
        member = WorkspaceMember(
            workspace_id=invitation.workspace_id,
            user_id=user_id,
            role=invitation.role
        )
        db.add(member)

        # Mark invitation as accepted
        invitation.accepted_at = datetime.utcnow()
        invitation.is_active = False

        db.commit()
        db.refresh(member)

        return member

    @staticmethod
    def list_pending_invitations(
        db: Session,
        workspace_id: int,
        user_id: int
    ) -> List[Dict]:
        """
        List pending invitations for a workspace

        Args:
            db: Database session
            workspace_id: Workspace ID
            user_id: Current user ID (must be owner/editor)

        Returns:
            List of pending invitations
        """
        # Check permission
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
            or_(WorkspaceMember.role == "owner", WorkspaceMember.role == "editor")
        ).first()

        if not member:
            return []

        invitations = db.query(WorkspaceInvitation).filter(
            WorkspaceInvitation.workspace_id == workspace_id,
            WorkspaceInvitation.is_active == True,
            WorkspaceInvitation.accepted_at == None,
            WorkspaceInvitation.expires_at > datetime.utcnow()
        ).all()

        result = []
        for inv in invitations:
            inviter = db.query(User).filter(User.id == inv.invited_by).first()
            result.append({
                "id": inv.id,
                "email": inv.email,
                "role": inv.role,
                "invited_by": inviter.full_name if inviter else "Unknown",
                "created_at": inv.created_at.isoformat(),
                "expires_at": inv.expires_at.isoformat()
            })

        return result
