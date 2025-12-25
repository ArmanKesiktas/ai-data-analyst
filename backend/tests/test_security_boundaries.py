"""
Quanty.studio Security Boundary Tests
======================================

Comprehensive test suite for verifying multi-tenant isolation.
These tests simulate attack scenarios to ensure security guarantees.
"""

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
import uuid
from datetime import datetime, timedelta
import secrets

from database import get_db, engine
from main import app
from middleware.workspace_auth import set_rls_context


# ============================================
# TEST FIXTURES
# ============================================

@pytest.fixture
def db():
    """Create a test database session."""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def test_users(db: Session):
    """Create test users."""
    users = []

    for i in range(3):
        user_id = str(uuid.uuid4())
        db.execute(
            text("""
                INSERT INTO users (id, email, password_hash, full_name)
                VALUES (:id, :email, :password_hash, :full_name)
            """),
            {
                "id": user_id,
                "email": f"user{i}@example.com",
                "password_hash": "$2b$12$dummy_hash",  # Not real bcrypt
                "full_name": f"User {i}"
            }
        )
        users.append(user_id)

    db.commit()
    return users


@pytest.fixture
def test_workspaces(db: Session, test_users):
    """Create test workspaces with different ownership."""
    workspaces = []

    for i, user_id in enumerate(test_users):
        # Each user gets a personal workspace (auto-created via trigger)
        personal_ws = db.execute(
            text("""
                SELECT id FROM workspaces
                WHERE owner_id = :user_id
                AND type = 'personal'
            """),
            {"user_id": user_id}
        ).fetchone()

        # Create a team workspace
        team_ws_id = str(uuid.uuid4())
        db.execute(
            text("""
                INSERT INTO workspaces (id, name, slug, type, owner_id)
                VALUES (:id, :name, :slug, 'team', :owner_id)
            """),
            {
                "id": team_ws_id,
                "name": f"Team Workspace {i}",
                "slug": f"team-ws-{i}",
                "owner_id": user_id
            }
        )

        # Add owner as member
        db.execute(
            text("""
                INSERT INTO workspace_members (workspace_id, user_id, role)
                VALUES (:workspace_id, :user_id, 'owner')
            """),
            {"workspace_id": team_ws_id, "user_id": user_id}
        )

        workspaces.append({
            "personal": str(personal_ws.id),
            "team": team_ws_id,
            "owner": user_id
        })

    db.commit()
    return workspaces


# ============================================
# RLS POLICY TESTS
# ============================================

class TestWorkspaceIsolation:
    """Test that users cannot access other users' workspaces."""

    def test_cannot_see_other_users_workspaces(self, db, test_users, test_workspaces):
        """User A should not see User B's workspaces."""
        user_a = test_users[0]
        user_b = test_users[1]

        # Set RLS context as User A
        set_rls_context(db, user_a)

        # Try to query User B's workspace
        result = db.execute(
            text("SELECT * FROM workspaces WHERE id = :workspace_id"),
            {"workspace_id": test_workspaces[1]["team"]}
        ).fetchall()

        # Should return empty (RLS blocks access)
        assert len(result) == 0, "User A should not see User B's workspace"

    def test_cannot_see_other_users_tables(self, db, test_users, test_workspaces):
        """User A should not see tables from User B's workspace."""
        user_a = test_users[0]
        user_b = test_users[1]
        workspace_b = test_workspaces[1]["team"]

        # User B creates a table
        set_rls_context(db, user_b)
        table_id = str(uuid.uuid4())

        db.execute(
            text("""
                INSERT INTO tables_metadata
                (id, workspace_id, name, schema_definition, created_by)
                VALUES (:id, :workspace_id, :name, '[]', :created_by)
            """),
            {
                "id": table_id,
                "workspace_id": workspace_b,
                "name": "secret_data",
                "created_by": user_b
            }
        )
        db.commit()

        # User A tries to access the table
        set_rls_context(db, user_a)

        result = db.execute(
            text("SELECT * FROM tables_metadata WHERE id = :table_id"),
            {"table_id": table_id}
        ).fetchall()

        # Should return empty (RLS blocks access)
        assert len(result) == 0, "User A should not see User B's table"

    def test_can_see_own_workspaces(self, db, test_users, test_workspaces):
        """User should see their own workspaces."""
        user_a = test_users[0]

        set_rls_context(db, user_a)

        result = db.execute(
            text("""
                SELECT id FROM workspaces
                WHERE id IN (:personal, :team)
            """),
            {
                "personal": test_workspaces[0]["personal"],
                "team": test_workspaces[0]["team"]
            }
        ).fetchall()

        # Should see both workspaces
        assert len(result) == 2, "User should see their own workspaces"

    def test_shared_workspace_access(self, db, test_users, test_workspaces):
        """User B can see User A's workspace if invited."""
        user_a = test_users[0]
        user_b = test_users[1]
        workspace_a = test_workspaces[0]["team"]

        # User A invites User B as editor
        set_rls_context(db, user_a)

        db.execute(
            text("""
                INSERT INTO workspace_members (workspace_id, user_id, role)
                VALUES (:workspace_id, :user_id, 'editor')
            """),
            {"workspace_id": workspace_a, "user_id": user_b}
        )
        db.commit()

        # User B should now see the workspace
        set_rls_context(db, user_b)

        result = db.execute(
            text("SELECT id FROM workspaces WHERE id = :workspace_id"),
            {"workspace_id": workspace_a}
        ).fetchall()

        assert len(result) == 1, "Invited user should see shared workspace"


class TestRoleBasedPermissions:
    """Test that role-based access control is enforced."""

    def test_viewer_cannot_create_table(self, db, test_users, test_workspaces):
        """Viewer role should not be able to create tables."""
        owner = test_users[0]
        viewer = test_users[1]
        workspace = test_workspaces[0]["team"]

        # Add viewer to workspace
        set_rls_context(db, owner)
        db.execute(
            text("""
                INSERT INTO workspace_members (workspace_id, user_id, role)
                VALUES (:workspace_id, :user_id, 'viewer')
            """),
            {"workspace_id": workspace, "user_id": viewer}
        )
        db.commit()

        # Viewer tries to create table
        set_rls_context(db, viewer)

        with pytest.raises(Exception) as exc_info:
            db.execute(
                text("""
                    INSERT INTO tables_metadata
                    (workspace_id, name, schema_definition, created_by)
                    VALUES (:workspace_id, :name, '[]', :created_by)
                """),
                {
                    "workspace_id": workspace,
                    "name": "unauthorized_table",
                    "created_by": viewer
                }
            )
            db.commit()

        # Should raise RLS policy violation
        assert "row-level security policy" in str(exc_info.value).lower()

    def test_editor_can_create_but_not_delete_table(self, db, test_users, test_workspaces):
        """Editor can create tables but not delete them."""
        owner = test_users[0]
        editor = test_users[1]
        workspace = test_workspaces[0]["team"]

        # Add editor to workspace
        set_rls_context(db, owner)
        db.execute(
            text("""
                INSERT INTO workspace_members (workspace_id, user_id, role)
                VALUES (:workspace_id, :user_id, 'editor')
            """),
            {"workspace_id": workspace, "user_id": editor}
        )
        db.commit()

        # Editor creates table (should succeed)
        set_rls_context(db, editor)
        table_id = str(uuid.uuid4())

        db.execute(
            text("""
                INSERT INTO tables_metadata
                (id, workspace_id, name, schema_definition, created_by)
                VALUES (:id, :workspace_id, :name, '[]', :created_by)
            """),
            {
                "id": table_id,
                "workspace_id": workspace,
                "name": "editor_table",
                "created_by": editor
            }
        )
        db.commit()

        # Verify table was created
        result = db.execute(
            text("SELECT id FROM tables_metadata WHERE id = :table_id"),
            {"table_id": table_id}
        ).fetchone()
        assert result is not None, "Editor should be able to create table"

        # Editor tries to delete table (should fail)
        result = db.execute(
            text("DELETE FROM tables_metadata WHERE id = :table_id"),
            {"table_id": table_id}
        )

        # RLS blocks deletion (only owner can delete)
        assert result.rowcount == 0, "Editor should not be able to delete table"

    def test_owner_can_delete_table(self, db, test_users, test_workspaces):
        """Owner can delete tables."""
        owner = test_users[0]
        workspace = test_workspaces[0]["team"]

        set_rls_context(db, owner)

        # Create table
        table_id = str(uuid.uuid4())
        db.execute(
            text("""
                INSERT INTO tables_metadata
                (id, workspace_id, name, schema_definition, created_by)
                VALUES (:id, :workspace_id, :name, '[]', :created_by)
            """),
            {
                "id": table_id,
                "workspace_id": workspace,
                "name": "owner_table",
                "created_by": owner
            }
        )
        db.commit()

        # Delete table (should succeed)
        result = db.execute(
            text("DELETE FROM tables_metadata WHERE id = :table_id"),
            {"table_id": table_id}
        )

        assert result.rowcount == 1, "Owner should be able to delete table"


class TestDataLeakageProtection:
    """Test protection against data leakage attacks."""

    def test_cannot_access_via_direct_workspace_id_manipulation(
        self, db, test_users, test_workspaces
    ):
        """Attacker cannot access data by guessing workspace_id."""
        user_a = test_users[0]
        user_b = test_users[1]
        workspace_b = test_workspaces[1]["team"]

        # User B creates sensitive table
        set_rls_context(db, user_b)
        table_id = str(uuid.uuid4())

        db.execute(
            text("""
                INSERT INTO tables_metadata
                (id, workspace_id, name, display_name, schema_definition, created_by)
                VALUES (:id, :workspace_id, :name, :display_name, '[]', :created_by)
            """),
            {
                "id": table_id,
                "workspace_id": workspace_b,
                "name": "financial_data",
                "display_name": "Confidential Financial Records",
                "created_by": user_b
            }
        )
        db.commit()

        # Attacker (User A) knows the workspace_id and tries to query
        set_rls_context(db, user_a)

        # Try direct query with workspace_id
        result = db.execute(
            text("""
                SELECT * FROM tables_metadata
                WHERE workspace_id = :workspace_id
            """),
            {"workspace_id": workspace_b}
        ).fetchall()

        # RLS should block access
        assert len(result) == 0, "RLS should prevent access via workspace_id manipulation"

        # Try querying by table name
        result = db.execute(
            text("""
                SELECT * FROM tables_metadata
                WHERE name = :name
            """),
            {"name": "financial_data"}
        ).fetchall()

        # RLS should still block access
        assert len(result) == 0, "RLS should prevent access via table name search"

    def test_query_history_isolation(self, db, test_users, test_workspaces):
        """Users should only see query history from their workspaces."""
        user_a = test_users[0]
        user_b = test_users[1]
        workspace_a = test_workspaces[0]["team"]
        workspace_b = test_workspaces[1]["team"]

        # User A creates query history entry
        set_rls_context(db, user_a)
        db.execute(
            text("""
                INSERT INTO query_history
                (workspace_id, user_id, question, sql_query)
                VALUES (:workspace_id, :user_id, :question, :sql_query)
            """),
            {
                "workspace_id": workspace_a,
                "user_id": user_a,
                "question": "What are our secret sales figures?",
                "sql_query": "SELECT * FROM secret_sales"
            }
        )
        db.commit()

        # User B tries to see all query history
        set_rls_context(db, user_b)
        result = db.execute(
            text("SELECT * FROM query_history")
        ).fetchall()

        # Should only see their own queries (none in this case)
        for row in result:
            assert row.workspace_id != workspace_a, \
                "User B should not see User A's query history"

    def test_dashboard_isolation(self, db, test_users, test_workspaces):
        """Users should only see dashboards from their workspaces."""
        user_a = test_users[0]
        user_b = test_users[1]
        workspace_a = test_workspaces[0]["team"]

        # User A creates dashboard
        set_rls_context(db, user_a)
        dashboard_id = str(uuid.uuid4())

        db.execute(
            text("""
                INSERT INTO dashboards
                (id, workspace_id, name, config, created_by)
                VALUES (:id, :workspace_id, :name, :config, :created_by)
            """),
            {
                "id": dashboard_id,
                "workspace_id": workspace_a,
                "name": "Executive Dashboard",
                "config": '{"widgets": []}',
                "created_by": user_a
            }
        )
        db.commit()

        # User B tries to access dashboard
        set_rls_context(db, user_b)
        result = db.execute(
            text("SELECT * FROM dashboards WHERE id = :dashboard_id"),
            {"dashboard_id": dashboard_id}
        ).fetchall()

        # RLS should block access
        assert len(result) == 0, "User B should not see User A's dashboard"


class TestPersonalWorkspaceProtection:
    """Test that personal workspaces are protected."""

    def test_cannot_delete_personal_workspace(self, db, test_users, test_workspaces):
        """Personal workspaces cannot be deleted."""
        user_a = test_users[0]
        personal_workspace = test_workspaces[0]["personal"]

        set_rls_context(db, user_a)

        # Try to delete personal workspace
        result = db.execute(
            text("DELETE FROM workspaces WHERE id = :workspace_id"),
            {"workspace_id": personal_workspace}
        )

        # RLS DELETE policy blocks deletion (type != 'personal')
        assert result.rowcount == 0, "Personal workspace should not be deletable"

    def test_can_delete_team_workspace(self, db, test_users, test_workspaces):
        """Team workspaces can be deleted by owner."""
        user_a = test_users[0]
        team_workspace = test_workspaces[0]["team"]

        set_rls_context(db, user_a)

        # Delete team workspace (should succeed)
        result = db.execute(
            text("DELETE FROM workspaces WHERE id = :workspace_id"),
            {"workspace_id": team_workspace}
        )

        assert result.rowcount == 1, "Owner should be able to delete team workspace"


class TestMemberManagementSecurity:
    """Test security of member management operations."""

    def test_cannot_add_member_to_unowned_workspace(self, db, test_users, test_workspaces):
        """Non-owners cannot add members to workspaces."""
        owner = test_users[0]
        attacker = test_users[1]
        victim = test_users[2]
        workspace = test_workspaces[0]["team"]

        # Attacker tries to add victim to owner's workspace
        set_rls_context(db, attacker)

        with pytest.raises(Exception) as exc_info:
            db.execute(
                text("""
                    INSERT INTO workspace_members (workspace_id, user_id, role)
                    VALUES (:workspace_id, :user_id, 'editor')
                """),
                {"workspace_id": workspace, "user_id": victim}
            )
            db.commit()

        # RLS INSERT policy blocks unauthorized member addition
        assert "row-level security policy" in str(exc_info.value).lower()

    def test_cannot_escalate_own_privileges(self, db, test_users, test_workspaces):
        """Users cannot escalate their own role."""
        owner = test_users[0]
        viewer = test_users[1]
        workspace = test_workspaces[0]["team"]

        # Add viewer to workspace
        set_rls_context(db, owner)
        db.execute(
            text("""
                INSERT INTO workspace_members (workspace_id, user_id, role)
                VALUES (:workspace_id, :user_id, 'viewer')
            """),
            {"workspace_id": workspace, "user_id": viewer}
        )
        db.commit()

        # Viewer tries to escalate to owner
        set_rls_context(db, viewer)

        with pytest.raises(Exception) as exc_info:
            db.execute(
                text("""
                    UPDATE workspace_members
                    SET role = 'owner'
                    WHERE workspace_id = :workspace_id
                    AND user_id = :user_id
                """),
                {"workspace_id": workspace, "user_id": viewer}
            )
            db.commit()

        # RLS UPDATE policy blocks privilege escalation
        assert "row-level security policy" in str(exc_info.value).lower()

    def test_owner_cannot_remove_self(self, db, test_users, test_workspaces):
        """Workspace owner cannot remove themselves."""
        owner = test_users[0]
        workspace = test_workspaces[0]["team"]

        set_rls_context(db, owner)

        # Try to remove self
        result = db.execute(
            text("""
                DELETE FROM workspace_members
                WHERE workspace_id = :workspace_id
                AND user_id = :user_id
            """),
            {"workspace_id": workspace, "user_id": owner}
        )

        # RLS DELETE policy blocks self-removal for owners
        assert result.rowcount == 0, "Owner should not be able to remove themselves"


# ============================================
# API ENDPOINT SECURITY TESTS
# ============================================

class TestAPIEndpointSecurity:
    """Test API-level security enforcement."""

    def test_unauthorized_workspace_access_returns_403(self, client, test_users, test_workspaces):
        """Accessing another user's workspace returns 403."""
        # Login as User B
        response = client.post(
            "/api/auth/login",
            json={"email": "user1@example.com", "password": "password"}
        )
        token_b = response.json()["access_token"]

        # Try to access User A's workspace
        workspace_a = test_workspaces[0]["team"]

        response = client.get(
            f"/api/workspaces/{workspace_a}/tables",
            headers={"Authorization": f"Bearer {token_b}"}
        )

        assert response.status_code == 403
        assert "not a member" in response.json()["detail"].lower()

    def test_insufficient_role_returns_403(self, client, db, test_users, test_workspaces):
        """API endpoints enforce minimum role requirements."""
        owner = test_users[0]
        viewer = test_users[1]
        workspace = test_workspaces[0]["team"]

        # Add viewer to workspace
        set_rls_context(db, owner)
        db.execute(
            text("""
                INSERT INTO workspace_members (workspace_id, user_id, role)
                VALUES (:workspace_id, :user_id, 'viewer')
            """),
            {"workspace_id": workspace, "user_id": viewer}
        )
        db.commit()

        # Login as viewer
        response = client.post(
            "/api/auth/login",
            json={"email": "user1@example.com", "password": "password"}
        )
        token = response.json()["access_token"]

        # Try to create table (requires editor role)
        response = client.post(
            f"/api/workspaces/{workspace}/tables",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "unauthorized_table",
                "schema_definition": [{"name": "col1", "type": "TEXT"}]
            }
        )

        assert response.status_code == 403
        assert "requires editor" in response.json()["detail"].lower()


# ============================================
# SQL INJECTION TESTS
# ============================================

class TestSQLInjectionProtection:
    """Test protection against SQL injection attacks."""

    def test_table_name_injection_prevented(self, client, db, test_users, test_workspaces):
        """Malicious table names are rejected."""
        owner = test_users[0]
        workspace = test_workspaces[0]["team"]

        set_rls_context(db, owner)

        # Login
        response = client.post(
            "/api/auth/login",
            json={"email": "user0@example.com", "password": "password"}
        )
        token = response.json()["access_token"]

        # Try SQL injection in table name
        malicious_names = [
            "table'; DROP TABLE users; --",
            "table UNION SELECT * FROM users",
            "../../../etc/passwd",
            "table\"; DELETE FROM workspaces; --"
        ]

        for malicious_name in malicious_names:
            response = client.post(
                f"/api/workspaces/{workspace}/tables",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "name": malicious_name,
                    "schema_definition": [{"name": "col1", "type": "TEXT"}]
                }
            )

            # Should be rejected by validation
            assert response.status_code in [400, 422], \
                f"Malicious table name '{malicious_name}' should be rejected"

    def test_parameterized_queries_prevent_injection(self, db, test_users, test_workspaces):
        """Parameterized queries prevent SQL injection."""
        user = test_users[0]
        workspace = test_workspaces[0]["team"]

        set_rls_context(db, user)

        # Attempt SQL injection via workspace_id parameter
        malicious_id = "'; DROP TABLE users; --"

        # This should safely handle the malicious input (UUID validation)
        result = db.execute(
            text("SELECT * FROM workspaces WHERE id = :workspace_id"),
            {"workspace_id": malicious_id}
        ).fetchall()

        # Should return empty (invalid UUID) without executing injection
        assert len(result) == 0


# Run tests with: pytest backend/tests/test_security_boundaries.py -v
