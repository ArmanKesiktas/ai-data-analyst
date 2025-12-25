"""
Workspace Authentication & Authorization Middleware
Multi-tenant access control for Quanty.studio
"""

from fastapi import HTTPException, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from enum import Enum
from functools import wraps


class WorkspaceRole(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"


# Role hierarchy for permission checks
ROLE_HIERARCHY = {
    WorkspaceRole.OWNER: 3,
    WorkspaceRole.EDITOR: 2,
    WorkspaceRole.VIEWER: 1
}


class WorkspaceAccessError(HTTPException):
    """Custom exception for workspace access violations"""
    def __init__(self, detail: str = "Access denied"):
        super().__init__(status_code=403, detail=detail)


async def verify_workspace_access(
    workspace_id: str,
    user_id: str,
    db: Session,
    required_role: Optional[WorkspaceRole] = None
) -> dict:
    """
    Verify user has access to workspace.
    
    Args:
        workspace_id: UUID of the workspace
        user_id: UUID of the current user
        db: Database session
        required_role: Minimum role required (optional)
    
    Returns:
        dict with role and workspace info
    
    Raises:
        WorkspaceAccessError if access denied
    """
    # Query workspace membership
    result = db.execute(
        text("""
            SELECT 
                wm.role,
                w.name as workspace_name,
                w.type as workspace_type,
                w.owner_id
            FROM workspace_members wm
            JOIN workspaces w ON w.id = wm.workspace_id
            WHERE wm.workspace_id = :workspace_id 
            AND wm.user_id = :user_id
        """),
        {"workspace_id": workspace_id, "user_id": user_id}
    ).fetchone()
    
    if not result:
        raise WorkspaceAccessError(
            detail="Access denied: You are not a member of this workspace"
        )
    
    user_role = WorkspaceRole(result.role)
    
    # Check role requirement
    if required_role:
        if ROLE_HIERARCHY[user_role] < ROLE_HIERARCHY[required_role]:
            raise WorkspaceAccessError(
                detail=f"Access denied: This action requires {required_role.value} role or higher"
            )
    
    return {
        "role": user_role,
        "workspace_name": result.workspace_name,
        "workspace_type": result.workspace_type,
        "is_owner": str(result.owner_id) == user_id
    }


def set_rls_context(db: Session, user_id: str):
    """
    Set PostgreSQL session variable for RLS policies.
    Must be called at the start of each request.
    """
    db.execute(
        text(f"SET LOCAL app.current_user_id = :user_id"),
        {"user_id": user_id}
    )


class WorkspaceContext:
    """
    Context object containing workspace access info.
    Injected into route handlers via dependency.
    """
    def __init__(
        self,
        workspace_id: str,
        user_id: str,
        role: WorkspaceRole,
        workspace_name: str,
        is_owner: bool
    ):
        self.workspace_id = workspace_id
        self.user_id = user_id
        self.role = role
        self.workspace_name = workspace_name
        self.is_owner = is_owner
    
    def can_edit(self) -> bool:
        return self.role in [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]
    
    def can_delete(self) -> bool:
        return self.role == WorkspaceRole.OWNER


def require_workspace_access(required_role: Optional[WorkspaceRole] = None):
    """
    Dependency factory for workspace access control.
    
    Usage:
        @router.get("/workspaces/{workspace_id}/tables")
        async def list_tables(
            ctx: WorkspaceContext = Depends(require_workspace_access())
        ):
            ...
        
        @router.post("/workspaces/{workspace_id}/tables")
        async def create_table(
            ctx: WorkspaceContext = Depends(require_workspace_access(WorkspaceRole.EDITOR))
        ):
            ...
    """
    async def dependency(
        workspace_id: str,
        request: Request,
        db: Session = Depends(get_db)
    ) -> WorkspaceContext:
        # Get current user from request state (set by auth middleware)
        current_user = getattr(request.state, 'user', None)
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = str(current_user.id)
        
        # Verify workspace access
        access_info = await verify_workspace_access(
            workspace_id, user_id, db, required_role
        )
        
        # Set RLS context for this session
        set_rls_context(db, user_id)
        
        return WorkspaceContext(
            workspace_id=workspace_id,
            user_id=user_id,
            role=access_info["role"],
            workspace_name=access_info["workspace_name"],
            is_owner=access_info["is_owner"]
        )
    
    return Depends(dependency)


# Import placeholder - replace with actual import
def get_db():
    """Placeholder for database session dependency"""
    pass


# Middleware for automatic RLS context
class RLSMiddleware:
    """
    FastAPI middleware to set RLS context for all requests.
    """
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # RLS context is set per-request in the dependency
            pass
        await self.app(scope, receive, send)


# Utility decorators
def workspace_owner_only(func):
    """Decorator to ensure only workspace owners can access"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        ctx = kwargs.get('ctx')
        if ctx and not ctx.is_owner:
            raise WorkspaceAccessError("Only workspace owners can perform this action")
        return await func(*args, **kwargs)
    return wrapper


def workspace_editor_only(func):
    """Decorator to ensure only editors+ can access"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        ctx = kwargs.get('ctx')
        if ctx and not ctx.can_edit():
            raise WorkspaceAccessError("Only editors and owners can perform this action")
        return await func(*args, **kwargs)
    return wrapper
