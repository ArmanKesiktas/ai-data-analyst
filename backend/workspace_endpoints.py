"""
Workspace API Endpoints
Separate file for workspace-related endpoints to keep main.py manageable
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from auth import get_current_user_id
from workspace_service import WorkspaceService
from models import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceMemberResponse,
    WorkspaceInviteCreate,
    WorkspaceInvitationResponse,
    AcceptInvitationRequest
)
from typing import List

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=WorkspaceResponse)
async def create_workspace(
    workspace: WorkspaceCreate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new workspace"""
    ws = WorkspaceService.create_workspace(
        db=db,
        name=workspace.name,
        owner_id=current_user_id,
        description=workspace.description
    )

    return {
        "id": ws.id,
        "name": ws.name,
        "description": ws.description,
        "role": "owner",
        "is_owner": True,
        "member_count": 1,
        "created_at": ws.created_at.isoformat(),
        "updated_at": ws.updated_at.isoformat()
    }


@router.get("", response_model=List[WorkspaceResponse])
async def list_workspaces(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """List all workspaces user has access to"""
    workspaces = WorkspaceService.list_user_workspaces(db, current_user_id)
    return workspaces


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get workspace details"""
    ws = WorkspaceService.get_workspace(db, workspace_id, current_user_id)

    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found or access denied")

    # Get user's role
    from database import WorkspaceMember
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user_id
    ).first()

    member_count = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).count()

    return {
        "id": ws.id,
        "name": ws.name,
        "description": ws.description,
        "role": member.role if member else "viewer",
        "is_owner": ws.owner_id == current_user_id,
        "member_count": member_count,
        "created_at": ws.created_at.isoformat(),
        "updated_at": ws.updated_at.isoformat()
    }


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: int,
    update_data: WorkspaceUpdate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update workspace (owner only)"""
    ws = WorkspaceService.update_workspace(
        db=db,
        workspace_id=workspace_id,
        user_id=current_user_id,
        name=update_data.name,
        description=update_data.description
    )

    if not ws:
        raise HTTPException(
            status_code=403,
            detail="Workspace not found or you don't have permission"
        )

    from database import WorkspaceMember
    member_count = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).count()

    return {
        "id": ws.id,
        "name": ws.name,
        "description": ws.description,
        "role": "owner",
        "is_owner": True,
        "member_count": member_count,
        "created_at": ws.created_at.isoformat(),
        "updated_at": ws.updated_at.isoformat()
    }


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete workspace (owner only)"""
    success = WorkspaceService.delete_workspace(db, workspace_id, current_user_id)

    if not success:
        raise HTTPException(
            status_code=403,
            detail="Workspace not found or you don't have permission"
        )

    return {"success": True, "message": "Workspace deleted"}


@router.get("/{workspace_id}/members", response_model=List[WorkspaceMemberResponse])
async def list_members(
    workspace_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """List all members of a workspace"""
    members = WorkspaceService.list_members(db, workspace_id, current_user_id)

    if not members:
        raise HTTPException(
            status_code=403,
            detail="Workspace not found or access denied"
        )

    return members


@router.delete("/{workspace_id}/members/{member_id}")
async def remove_member(
    workspace_id: int,
    member_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Remove a member from workspace (owner only)"""
    success = WorkspaceService.remove_member(
        db, workspace_id, current_user_id, member_id
    )

    if not success:
        raise HTTPException(
            status_code=403,
            detail="Cannot remove member (insufficient permission or trying to remove yourself)"
        )

    return {"success": True, "message": "Member removed"}


@router.post("/{workspace_id}/invitations", response_model=WorkspaceInvitationResponse)
async def create_invitation(
    workspace_id: int,
    invite_data: WorkspaceInviteCreate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a workspace invitation"""
    invitation = WorkspaceService.create_invitation(
        db=db,
        workspace_id=workspace_id,
        user_id=current_user_id,
        email=invite_data.email,
        role=invite_data.role
    )

    if not invitation:
        raise HTTPException(
            status_code=403,
            detail="Cannot create invitation (insufficient permission or already invited)"
        )

    from database import User
    inviter = db.query(User).filter(User.id == current_user_id).first()

    return {
        "id": invitation.id,
        "email": invitation.email,
        "role": invitation.role,
        "invited_by": inviter.full_name if inviter else "Unknown",
        "created_at": invitation.created_at.isoformat(),
        "expires_at": invitation.expires_at.isoformat()
    }


@router.get("/{workspace_id}/invitations", response_model=List[WorkspaceInvitationResponse])
async def list_invitations(
    workspace_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """List pending invitations"""
    invitations = WorkspaceService.list_pending_invitations(
        db, workspace_id, current_user_id
    )

    return invitations


@router.post("/invitations/accept")
async def accept_invitation(
    request: AcceptInvitationRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Accept a workspace invitation"""
    member = WorkspaceService.accept_invitation(
        db=db,
        token=request.token,
        user_id=current_user_id
    )

    if not member:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired invitation token"
        )

    return {
        "success": True,
        "message": "Invitation accepted",
        "workspace_id": member.workspace_id,
        "role": member.role
    }
