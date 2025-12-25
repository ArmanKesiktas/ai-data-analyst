-- ============================================
-- QUANTY.STUDIO ROW LEVEL SECURITY POLICIES
-- Workspace-based Data Isolation
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Check Workspace Membership
-- ============================================
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID, usr_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = ws_id AND user_id = usr_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: Get User Role in Workspace
-- ============================================
CREATE OR REPLACE FUNCTION get_workspace_role(ws_id UUID, usr_id UUID)
RETURNS workspace_role AS $$
DECLARE
    user_role workspace_role;
BEGIN
    SELECT role INTO user_role 
    FROM workspace_members 
    WHERE workspace_id = ws_id AND user_id = usr_id;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: Check if user can edit
-- ============================================
CREATE OR REPLACE FUNCTION can_edit_workspace(ws_id UUID, usr_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role workspace_role;
BEGIN
    SELECT role INTO user_role 
    FROM workspace_members 
    WHERE workspace_id = ws_id AND user_id = usr_id;
    RETURN user_role IN ('owner', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: Check if user is owner
-- ============================================
CREATE OR REPLACE FUNCTION is_workspace_owner(ws_id UUID, usr_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = ws_id 
        AND user_id = usr_id 
        AND role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: Get current user from session
-- ============================================
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- RLS POLICIES: WORKSPACES
-- ============================================
DROP POLICY IF EXISTS workspace_select ON workspaces;
DROP POLICY IF EXISTS workspace_insert ON workspaces;
DROP POLICY IF EXISTS workspace_update ON workspaces;
DROP POLICY IF EXISTS workspace_delete ON workspaces;

CREATE POLICY workspace_select ON workspaces
    FOR SELECT USING (
        is_workspace_member(id, current_user_id())
    );

CREATE POLICY workspace_insert ON workspaces
    FOR INSERT WITH CHECK (
        owner_id = current_user_id()
    );

CREATE POLICY workspace_update ON workspaces
    FOR UPDATE USING (
        is_workspace_owner(id, current_user_id())
    );

CREATE POLICY workspace_delete ON workspaces
    FOR DELETE USING (
        is_workspace_owner(id, current_user_id())
        AND type != 'personal'  -- Cannot delete personal workspace
    );

-- ============================================
-- RLS POLICIES: WORKSPACE_MEMBERS
-- ============================================
DROP POLICY IF EXISTS members_select ON workspace_members;
DROP POLICY IF EXISTS members_insert ON workspace_members;
DROP POLICY IF EXISTS members_update ON workspace_members;
DROP POLICY IF EXISTS members_delete ON workspace_members;

CREATE POLICY members_select ON workspace_members
    FOR SELECT USING (
        is_workspace_member(workspace_id, current_user_id())
    );

CREATE POLICY members_insert ON workspace_members
    FOR INSERT WITH CHECK (
        is_workspace_owner(workspace_id, current_user_id())
    );

CREATE POLICY members_update ON workspace_members
    FOR UPDATE USING (
        is_workspace_owner(workspace_id, current_user_id())
    );

CREATE POLICY members_delete ON workspace_members
    FOR DELETE USING (
        is_workspace_owner(workspace_id, current_user_id())
        AND user_id != current_user_id()  -- Cannot remove self if owner
    );

-- ============================================
-- RLS POLICIES: TABLES_METADATA
-- ============================================
DROP POLICY IF EXISTS tables_select ON tables_metadata;
DROP POLICY IF EXISTS tables_insert ON tables_metadata;
DROP POLICY IF EXISTS tables_update ON tables_metadata;
DROP POLICY IF EXISTS tables_delete ON tables_metadata;

CREATE POLICY tables_select ON tables_metadata
    FOR SELECT USING (
        is_workspace_member(workspace_id, current_user_id())
    );

CREATE POLICY tables_insert ON tables_metadata
    FOR INSERT WITH CHECK (
        can_edit_workspace(workspace_id, current_user_id())
    );

CREATE POLICY tables_update ON tables_metadata
    FOR UPDATE USING (
        can_edit_workspace(workspace_id, current_user_id())
    );

CREATE POLICY tables_delete ON tables_metadata
    FOR DELETE USING (
        is_workspace_owner(workspace_id, current_user_id())
    );

-- ============================================
-- RLS POLICIES: DASHBOARDS
-- ============================================
DROP POLICY IF EXISTS dashboards_select ON dashboards;
DROP POLICY IF EXISTS dashboards_insert ON dashboards;
DROP POLICY IF EXISTS dashboards_update ON dashboards;
DROP POLICY IF EXISTS dashboards_delete ON dashboards;

CREATE POLICY dashboards_select ON dashboards
    FOR SELECT USING (
        is_workspace_member(workspace_id, current_user_id())
        OR is_public = TRUE
    );

CREATE POLICY dashboards_insert ON dashboards
    FOR INSERT WITH CHECK (
        can_edit_workspace(workspace_id, current_user_id())
    );

CREATE POLICY dashboards_update ON dashboards
    FOR UPDATE USING (
        can_edit_workspace(workspace_id, current_user_id())
    );

CREATE POLICY dashboards_delete ON dashboards
    FOR DELETE USING (
        is_workspace_owner(workspace_id, current_user_id())
    );

-- ============================================
-- RLS POLICIES: QUERY_HISTORY
-- ============================================
DROP POLICY IF EXISTS query_history_select ON query_history;
DROP POLICY IF EXISTS query_history_insert ON query_history;

CREATE POLICY query_history_select ON query_history
    FOR SELECT USING (
        is_workspace_member(workspace_id, current_user_id())
    );

CREATE POLICY query_history_insert ON query_history
    FOR INSERT WITH CHECK (
        is_workspace_member(workspace_id, current_user_id())
        AND user_id = current_user_id()
    );

-- ============================================
-- RLS POLICIES: WORKSPACE_INVITATIONS
-- ============================================
DROP POLICY IF EXISTS invitations_select ON workspace_invitations;
DROP POLICY IF EXISTS invitations_insert ON workspace_invitations;
DROP POLICY IF EXISTS invitations_delete ON workspace_invitations;

CREATE POLICY invitations_select ON workspace_invitations
    FOR SELECT USING (
        is_workspace_owner(workspace_id, current_user_id())
        OR email = (SELECT email FROM users WHERE id = current_user_id())
    );

CREATE POLICY invitations_insert ON workspace_invitations
    FOR INSERT WITH CHECK (
        is_workspace_owner(workspace_id, current_user_id())
    );

CREATE POLICY invitations_delete ON workspace_invitations
    FOR DELETE USING (
        is_workspace_owner(workspace_id, current_user_id())
    );

-- ============================================
-- GRANT PERMISSIONS FOR APPLICATION USER
-- ============================================
-- Run these after creating the application database user:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
