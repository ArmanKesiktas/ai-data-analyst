# Quanty.studio Security Quick Reference Card

**For Developers**: Pin this to your desk! 📌

---

## 🚨 Security Rules (NEVER VIOLATE)

### Rule #1: ALWAYS Use Workspace Authorization

```python
# ✅ CORRECT
@app.get("/api/workspaces/{workspace_id}/tables")
async def list_tables(
    workspace_id: str,
    ctx: WorkspaceContext = Depends(require_workspace_access()),  # ← REQUIRED!
    db: Session = Depends(get_db)
):
    ...

# ❌ WRONG - No workspace check
@app.get("/api/tables")
async def list_tables(db: Session = Depends(get_db)):
    return db.query(TablesMetadata).all()  # Leaks all tables!
```

### Rule #2: ALWAYS Set RLS Context

```python
# ✅ CORRECT
set_rls_context(db, user_id)  # ← REQUIRED before queries
result = db.execute(text("SELECT * FROM tables_metadata WHERE ..."))

# ❌ WRONG - RLS not set
result = db.execute(text("SELECT * FROM tables_metadata WHERE ..."))
```

### Rule #3: NEVER Use String Interpolation in SQL

```python
# ✅ CORRECT - Parameterized query
db.execute(
    text("SELECT * FROM tables WHERE workspace_id = :ws_id"),
    {"ws_id": workspace_id}  # ← Safe parameter binding
)

# ❌ WRONG - SQL injection risk
db.execute(text(f"SELECT * FROM tables WHERE workspace_id = '{workspace_id}'"))
```

### Rule #4: ALWAYS Validate Input with Pydantic

```python
# ✅ CORRECT
class CreateTableRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

    @validator('name')
    def validate_name(cls, v):
        if not v.replace('_', '').isalnum():
            raise ValueError("Invalid table name")
        return v

@app.post("/api/tables")
async def create_table(request: CreateTableRequest):  # ← Validated!
    ...

# ❌ WRONG - No validation
@app.post("/api/tables")
async def create_table(name: str):  # Accepts any string!
    ...
```

### Rule #5: NEVER Expose Sensitive Info in Errors

```python
# ✅ CORRECT
raise HTTPException(status_code=404, detail="Resource not found")

# ❌ WRONG - Leaks information
raise HTTPException(
    status_code=404,
    detail=f"Workspace {workspace_id} not found for user {user_id}"
)
```

---

## 📋 Security Checklist for New Endpoints

Before committing new API endpoint code:

- [ ] Uses `require_workspace_access()` dependency
- [ ] Sets RLS context via `set_rls_context(db, user_id)`
- [ ] Uses parameterized queries (no f-strings in SQL)
- [ ] Validates input with Pydantic models
- [ ] Checks role permissions (if needed)
- [ ] Returns generic error messages
- [ ] Logs security events (access violations)
- [ ] Has corresponding unit tests
- [ ] Tested with security test suite

---

## 🔐 Common Security Patterns

### Pattern 1: List Resources (Any Member)

```python
@app.get("/api/workspaces/{workspace_id}/tables")
async def list_tables(
    workspace_id: str,
    ctx: WorkspaceContext = Depends(require_workspace_access()),
    db: Session = Depends(get_db)
):
    """List all tables. Accessible by: owner, editor, viewer."""
    # RLS already set via require_workspace_access()

    tables = db.execute(
        text("""
            SELECT id, name, created_at
            FROM tables_metadata
            WHERE workspace_id = :workspace_id
            ORDER BY created_at DESC
        """),
        {"workspace_id": workspace_id}
    ).fetchall()

    return {"tables": [dict(row) for row in tables]}
```

### Pattern 2: Create Resource (Editor+)

```python
@app.post("/api/workspaces/{workspace_id}/tables")
async def create_table(
    workspace_id: str,
    request: CreateTableRequest,
    ctx: WorkspaceContext = Depends(
        require_workspace_access(required_role=WorkspaceRole.EDITOR)  # ← Enforces role
    ),
    db: Session = Depends(get_db)
):
    """Create table. Accessible by: owner, editor."""
    # RLS INSERT policy also enforces can_edit_workspace()

    result = db.execute(
        text("""
            INSERT INTO tables_metadata
            (workspace_id, name, created_by)
            VALUES (:workspace_id, :name, :user_id)
            RETURNING id
        """),
        {
            "workspace_id": workspace_id,
            "name": request.name,
            "user_id": ctx.user_id
        }
    )

    db.commit()
    return {"id": str(result.scalar())}
```

### Pattern 3: Delete Resource (Owner Only)

```python
@app.delete("/api/workspaces/{workspace_id}/tables/{table_id}")
async def delete_table(
    workspace_id: str,
    table_id: str,
    ctx: WorkspaceContext = Depends(
        require_workspace_access(required_role=WorkspaceRole.OWNER)  # ← Owner only
    ),
    db: Session = Depends(get_db)
):
    """Delete table. Accessible by: owner only."""
    # RLS DELETE policy also enforces is_workspace_owner()

    result = db.execute(
        text("""
            DELETE FROM tables_metadata
            WHERE id = :table_id
            AND workspace_id = :workspace_id
        """),
        {"table_id": table_id, "workspace_id": workspace_id}
    )

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Table not found")

    db.commit()
    return {"message": "Table deleted"}
```

### Pattern 4: Shared Resource Access

```python
@app.post("/api/workspaces/{workspace_id}/members/invite")
async def invite_member(
    workspace_id: str,
    request: InviteMemberRequest,
    ctx: WorkspaceContext = Depends(
        require_workspace_access(required_role=WorkspaceRole.OWNER)
    ),
    db: Session = Depends(get_db)
):
    """Invite member. Accessible by: owner only."""
    # Check if already a member
    existing = db.execute(
        text("""
            SELECT 1 FROM workspace_members wm
            JOIN users u ON u.id = wm.user_id
            WHERE wm.workspace_id = :workspace_id
            AND u.email = :email
        """),
        {"workspace_id": workspace_id, "email": request.email}
    ).fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="User already a member")

    # Create invitation token
    import secrets
    token = secrets.token_urlsafe(32)

    db.execute(
        text("""
            INSERT INTO workspace_invitations
            (workspace_id, email, role, token, invited_by)
            VALUES (:workspace_id, :email, :role, :token, :invited_by)
        """),
        {
            "workspace_id": workspace_id,
            "email": request.email,
            "role": request.role.value,
            "token": token,
            "invited_by": ctx.user_id
        }
    )

    db.commit()
    # TODO: Send invitation email

    return {"message": "Invitation sent", "token": token}
```

---

## 🧪 Testing Your Endpoint

### Unit Test Template

```python
def test_endpoint_security(db, test_users, test_workspaces):
    """Test that endpoint enforces workspace isolation."""
    user_a = test_users[0]
    user_b = test_users[1]
    workspace_a = test_workspaces[0]["team"]

    # User A creates resource in their workspace
    set_rls_context(db, user_a)
    resource_id = create_resource(db, workspace_a, "test_resource")

    # User B tries to access User A's resource
    set_rls_context(db, user_b)
    result = db.execute(
        text("SELECT * FROM resources WHERE id = :resource_id"),
        {"resource_id": resource_id}
    ).fetchall()

    # Assert: User B cannot see User A's resource
    assert len(result) == 0, "User B should not see User A's resource"
```

### Integration Test Template

```python
def test_api_endpoint_security(client):
    """Test API endpoint enforces authorization."""
    # Login as User B
    response = client.post(
        "/api/auth/login",
        json={"email": "userb@example.com", "password": "password"}
    )
    token_b = response.json()["access_token"]

    # Try to access User A's workspace
    response = client.get(
        f"/api/workspaces/{workspace_a_id}/tables",
        headers={"Authorization": f"Bearer {token_b}"}
    )

    # Assert: Should return 403 Forbidden
    assert response.status_code == 403
    assert "not a member" in response.json()["detail"].lower()
```

---

## 🐛 Common Security Bugs to Avoid

### Bug #1: Forgetting workspace_id Check

```python
# ❌ BAD - No workspace filtering
@app.get("/api/tables")
async def list_all_tables(db: Session = Depends(get_db)):
    return db.query(TablesMetadata).all()  # Returns ALL tables from ALL workspaces!

# ✅ GOOD - Workspace-scoped
@app.get("/api/workspaces/{workspace_id}/tables")
async def list_tables(
    workspace_id: str,
    ctx: WorkspaceContext = Depends(require_workspace_access()),
    db: Session = Depends(get_db)
):
    return db.execute(
        text("SELECT * FROM tables_metadata WHERE workspace_id = :ws_id"),
        {"ws_id": workspace_id}
    ).fetchall()
```

### Bug #2: Using User ID Instead of Workspace ID

```python
# ❌ BAD - User-scoped (wrong isolation model)
@app.get("/api/my/tables")
async def my_tables(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # This returns tables from ALL workspaces user is in (mixing data!)
    return db.execute(
        text("SELECT * FROM tables_metadata WHERE created_by = :user_id"),
        {"user_id": user_id}
    ).fetchall()

# ✅ GOOD - Workspace-scoped
@app.get("/api/workspaces/{workspace_id}/tables")
async def workspace_tables(workspace_id: str, ctx: WorkspaceContext = Depends(require_workspace_access()), ...):
    # Returns tables from ONE workspace only
    ...
```

### Bug #3: Not Checking Role for Destructive Operations

```python
# ❌ BAD - Any member can delete
@app.delete("/api/tables/{table_id}")
async def delete_table(
    table_id: str,
    user_id: str = Depends(get_current_user_id),  # No role check!
    db: Session = Depends(get_db)
):
    db.execute(text("DELETE FROM tables_metadata WHERE id = :id"), {"id": table_id})

# ✅ GOOD - Only owner can delete
@app.delete("/api/workspaces/{workspace_id}/tables/{table_id}")
async def delete_table(
    workspace_id: str,
    table_id: str,
    ctx: WorkspaceContext = Depends(
        require_workspace_access(required_role=WorkspaceRole.OWNER)  # ← Enforces owner
    ),
    db: Session = Depends(get_db)
):
    ...
```

---

## 🔍 Debugging Security Issues

### Check 1: Is RLS Enabled?

```sql
-- Run in psql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- rowsecurity should be TRUE for all tables
```

### Check 2: Are RLS Policies Active?

```sql
-- Run in psql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should see policies for SELECT, INSERT, UPDATE, DELETE
```

### Check 3: Is RLS Context Set?

```python
# In your endpoint, add debug log
import logging
logger = logging.getLogger(__name__)

@app.get("/api/workspaces/{workspace_id}/tables")
async def list_tables(ctx: WorkspaceContext, db: Session):
    # Debug: Check RLS context
    result = db.execute(text("SELECT current_setting('app.current_user_id', true)")).scalar()
    logger.info(f"RLS context user_id: {result}")  # Should match ctx.user_id

    if result != ctx.user_id:
        logger.error("RLS context mismatch!")
```

### Check 4: Test RLS Directly

```sql
-- Run in psql
BEGIN;

-- Set RLS context as User A
SET LOCAL app.current_user_id = 'user_a_uuid';

-- Try to query User B's workspace
SELECT * FROM tables_metadata WHERE workspace_id = 'user_b_workspace_uuid';

-- Should return empty (RLS blocks access)

ROLLBACK;
```

---

## 📞 When in Doubt

**Ask yourself**:
1. ✅ Did I use `require_workspace_access()`?
2. ✅ Did I set RLS context?
3. ✅ Did I use parameterized queries?
4. ✅ Did I validate input?
5. ✅ Did I check role permissions?

**If ANY answer is NO**: Your endpoint is likely insecure. Review this guide!

**Need help?**
- Check: [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)
- Examples: [backend/examples/secure_api_patterns.py](./backend/examples/secure_api_patterns.py)
- Ask: #security channel on Slack/Discord

---

## 🎓 Security Training Resources

1. **Read First**: [SECURITY_IMPLEMENTATION_SUMMARY.md](./SECURITY_IMPLEMENTATION_SUMMARY.md) (15 min)
2. **Code Review**: [backend/examples/secure_api_patterns.py](./backend/examples/secure_api_patterns.py) (30 min)
3. **Deep Dive**: [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md) sections 1-5 (1 hour)
4. **Practice**: Implement a new endpoint using patterns above
5. **Test**: Write security tests for your endpoint

---

**Remember**: Security is EVERYONE's responsibility! 🛡️

**Version**: 1.0
**Last Updated**: 2025-12-25
