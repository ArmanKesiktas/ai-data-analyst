#!/usr/bin/env python3
"""
Quanty.studio Security Audit Script
====================================

This script performs automated security checks on the database and application
configuration to ensure proper multi-tenant isolation is configured.

Usage:
    python scripts/security_audit.py

Environment Variables Required:
    DATABASE_URL - PostgreSQL connection string
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from colorama import Fore, Style, init
from typing import List, Tuple

# Initialize colorama for colored output
init(autoreset=True)


class SecurityAudit:
    """Security audit checker for Quanty.studio database."""

    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine = create_engine(database_url)
        self.issues: List[Tuple[str, str]] = []  # (severity, message)
        self.warnings: List[str] = []
        self.passes: List[str] = []

    def print_header(self, text: str):
        """Print section header."""
        print(f"\n{Fore.CYAN}{'=' * 80}")
        print(f"{Fore.CYAN}{text}")
        print(f"{Fore.CYAN}{'=' * 80}{Style.RESET_ALL}\n")

    def check_pass(self, message: str):
        """Record a passed check."""
        self.passes.append(message)
        print(f"{Fore.GREEN}✓{Style.RESET_ALL} {message}")

    def check_warning(self, message: str):
        """Record a warning."""
        self.warnings.append(message)
        print(f"{Fore.YELLOW}⚠{Style.RESET_ALL} {message}")

    def check_fail(self, severity: str, message: str):
        """Record a failed check."""
        self.issues.append((severity, message))
        color = Fore.RED if severity == "CRITICAL" else Fore.YELLOW
        print(f"{color}✗ [{severity}]{Style.RESET_ALL} {message}")

    def run(self):
        """Run all security checks."""
        print(f"{Fore.BLUE}{'=' * 80}")
        print(f"{Fore.BLUE}Quanty.studio Security Audit")
        print(f"{Fore.BLUE}{'=' * 80}{Style.RESET_ALL}")

        try:
            with self.engine.connect() as conn:
                self.check_rls_enabled(conn)
                self.check_rls_policies(conn)
                self.check_helper_functions(conn)
                self.check_triggers(conn)
                self.check_indexes(conn)
                self.check_foreign_keys(conn)
                self.check_user_privileges(conn)
                self.check_password_security(conn)

            self.check_environment_variables()
            self.print_summary()

        except SQLAlchemyError as e:
            print(f"{Fore.RED}Database connection failed: {e}{Style.RESET_ALL}")
            sys.exit(1)

    def check_rls_enabled(self, conn):
        """Verify RLS is enabled on all critical tables."""
        self.print_header("ROW LEVEL SECURITY (RLS) STATUS")

        critical_tables = [
            'workspaces',
            'workspace_members',
            'tables_metadata',
            'dashboards',
            'query_history',
            'workspace_invitations'
        ]

        for table in critical_tables:
            result = conn.execute(text(f"""
                SELECT relrowsecurity
                FROM pg_class
                WHERE relname = :table_name
            """), {"table_name": table}).fetchone()

            if result and result[0]:
                self.check_pass(f"RLS enabled on table: {table}")
            else:
                self.check_fail(
                    "CRITICAL",
                    f"RLS NOT enabled on table: {table}"
                )

    def check_rls_policies(self, conn):
        """Verify all required RLS policies exist."""
        self.print_header("RLS POLICIES")

        expected_policies = {
            'workspaces': ['workspace_select', 'workspace_insert', 'workspace_update', 'workspace_delete'],
            'workspace_members': ['members_select', 'members_insert', 'members_update', 'members_delete'],
            'tables_metadata': ['tables_select', 'tables_insert', 'tables_update', 'tables_delete'],
            'dashboards': ['dashboards_select', 'dashboards_insert', 'dashboards_update', 'dashboards_delete'],
            'query_history': ['query_history_select', 'query_history_insert'],
            'workspace_invitations': ['invitations_select', 'invitations_insert', 'invitations_delete']
        }

        for table, policies in expected_policies.items():
            # Get existing policies
            result = conn.execute(text("""
                SELECT policyname
                FROM pg_policies
                WHERE tablename = :table_name
            """), {"table_name": table}).fetchall()

            existing_policies = [row[0] for row in result]

            for policy in policies:
                if policy in existing_policies:
                    self.check_pass(f"Policy exists: {table}.{policy}")
                else:
                    self.check_fail(
                        "CRITICAL",
                        f"Missing RLS policy: {table}.{policy}"
                    )

    def check_helper_functions(self, conn):
        """Verify RLS helper functions exist."""
        self.print_header("RLS HELPER FUNCTIONS")

        required_functions = [
            'current_user_id',
            'is_workspace_member',
            'can_edit_workspace',
            'is_workspace_owner',
            'get_workspace_role'
        ]

        for func in required_functions:
            result = conn.execute(text("""
                SELECT proname
                FROM pg_proc
                WHERE proname = :func_name
            """), {"func_name": func}).fetchone()

            if result:
                self.check_pass(f"Function exists: {func}()")
            else:
                self.check_fail(
                    "CRITICAL",
                    f"Missing RLS helper function: {func}()"
                )

    def check_triggers(self, conn):
        """Verify critical triggers exist."""
        self.print_header("DATABASE TRIGGERS")

        expected_triggers = {
            'users': ['create_user_workspace'],
            'workspaces': ['update_workspaces_updated_at'],
            'tables_metadata': ['update_tables_updated_at']
        }

        for table, triggers in expected_triggers.items():
            result = conn.execute(text("""
                SELECT tgname
                FROM pg_trigger
                JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
                WHERE pg_class.relname = :table_name
            """), {"table_name": table}).fetchall()

            existing_triggers = [row[0] for row in result]

            for trigger in triggers:
                if trigger in existing_triggers:
                    self.check_pass(f"Trigger exists: {table}.{trigger}")
                else:
                    self.check_fail(
                        "HIGH",
                        f"Missing trigger: {table}.{trigger}"
                    )

    def check_indexes(self, conn):
        """Verify critical indexes exist for performance."""
        self.print_header("DATABASE INDEXES")

        expected_indexes = {
            'users': ['idx_users_email'],
            'workspaces': ['idx_workspaces_owner', 'idx_workspaces_slug'],
            'workspace_members': ['idx_workspace_members_user', 'idx_workspace_members_workspace'],
            'tables_metadata': ['idx_tables_workspace'],
            'dashboards': ['idx_dashboards_workspace'],
            'query_history': ['idx_query_history_workspace', 'idx_query_history_user']
        }

        for table, indexes in expected_indexes.items():
            result = conn.execute(text("""
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = :table_name
            """), {"table_name": table}).fetchall()

            existing_indexes = [row[0] for row in result]

            for index in indexes:
                if index in existing_indexes:
                    self.check_pass(f"Index exists: {index}")
                else:
                    self.check_warning(f"Missing performance index: {index}")

    def check_foreign_keys(self, conn):
        """Verify foreign key constraints for data integrity."""
        self.print_header("FOREIGN KEY CONSTRAINTS")

        # Check workspace_members foreign keys
        result = conn.execute(text("""
            SELECT COUNT(*) as fk_count
            FROM information_schema.table_constraints
            WHERE table_name = 'workspace_members'
            AND constraint_type = 'FOREIGN KEY'
        """)).fetchone()

        if result[0] >= 2:  # Should have at least 2 FKs (workspace_id, user_id)
            self.check_pass(f"workspace_members has {result[0]} foreign keys")
        else:
            self.check_fail(
                "HIGH",
                f"workspace_members missing foreign keys (found {result[0]}, expected >= 2)"
            )

        # Check tables_metadata foreign keys
        result = conn.execute(text("""
            SELECT COUNT(*) as fk_count
            FROM information_schema.table_constraints
            WHERE table_name = 'tables_metadata'
            AND constraint_type = 'FOREIGN KEY'
        """)).fetchone()

        if result[0] >= 2:  # workspace_id, created_by
            self.check_pass(f"tables_metadata has {result[0]} foreign keys")
        else:
            self.check_fail(
                "HIGH",
                f"tables_metadata missing foreign keys (found {result[0]}, expected >= 2)"
            )

    def check_user_privileges(self, conn):
        """Verify database user doesn't have excessive privileges."""
        self.print_header("DATABASE USER PRIVILEGES")

        # Get current user
        result = conn.execute(text("SELECT current_user")).fetchone()
        current_user = result[0]

        print(f"Current database user: {Fore.CYAN}{current_user}{Style.RESET_ALL}")

        # Check if user is superuser
        result = conn.execute(text("""
            SELECT usesuper
            FROM pg_user
            WHERE usename = :username
        """), {"username": current_user}).fetchone()

        if result and result[0]:
            self.check_fail(
                "CRITICAL",
                f"User '{current_user}' has SUPERUSER privileges (security risk!)"
            )
        else:
            self.check_pass(f"User '{current_user}' is not a superuser")

        # Check BYPASSRLS privilege
        result = conn.execute(text("""
            SELECT rolbypassrls
            FROM pg_roles
            WHERE rolname = :username
        """), {"username": current_user}).fetchone()

        if result and result[0]:
            self.check_fail(
                "CRITICAL",
                f"User '{current_user}' can BYPASS RLS (security risk!)"
            )
        else:
            self.check_pass(f"User '{current_user}' cannot bypass RLS")

    def check_password_security(self, conn):
        """Check password hashing and security."""
        self.print_header("PASSWORD SECURITY")

        # Check if any users have plaintext-looking passwords
        result = conn.execute(text("""
            SELECT COUNT(*) as count
            FROM users
            WHERE LENGTH(password_hash) < 40
        """)).fetchone()

        if result[0] > 0:
            self.check_fail(
                "CRITICAL",
                f"Found {result[0]} users with weak/unhashed passwords"
            )
        else:
            self.check_pass("All users have properly hashed passwords")

        # Check password hash format (should start with bcrypt prefix)
        result = conn.execute(text("""
            SELECT COUNT(*) as count
            FROM users
            WHERE password_hash NOT LIKE '$2%'
        """)).fetchone()

        if result[0] > 0:
            self.check_warning(
                f"Found {result[0]} users with non-bcrypt password hashes"
            )
        else:
            self.check_pass("All passwords use bcrypt hashing")

    def check_environment_variables(self):
        """Check critical environment variables."""
        self.print_header("ENVIRONMENT CONFIGURATION")

        required_vars = {
            'DATABASE_URL': 'Database connection string',
            'JWT_SECRET_KEY': 'JWT signing secret',
        }

        optional_vars = {
            'JWT_ALGORITHM': 'JWT algorithm (default: HS256)',
            'JWT_EXPIRATION_HOURS': 'Token expiration (default: 24)',
        }

        for var, description in required_vars.items():
            value = os.getenv(var)
            if value:
                # Don't print sensitive values
                masked = '***' if 'SECRET' in var or 'PASSWORD' in var else value[:20] + '...'
                self.check_pass(f"{var} is set: {masked}")
            else:
                self.check_fail("CRITICAL", f"{var} not set ({description})")

        for var, description in optional_vars.items():
            value = os.getenv(var)
            if value:
                self.check_pass(f"{var} is set: {value}")
            else:
                self.check_warning(f"{var} not set (using default)")

        # Check JWT secret strength
        jwt_secret = os.getenv('JWT_SECRET_KEY')
        if jwt_secret:
            if len(jwt_secret) < 32:
                self.check_fail(
                    "HIGH",
                    f"JWT_SECRET_KEY is too weak (length: {len(jwt_secret)}, recommended: >= 32)"
                )
            else:
                self.check_pass(f"JWT_SECRET_KEY has sufficient length ({len(jwt_secret)} chars)")

    def print_summary(self):
        """Print audit summary."""
        self.print_header("AUDIT SUMMARY")

        print(f"{Fore.GREEN}Passed Checks: {len(self.passes)}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Warnings: {len(self.warnings)}{Style.RESET_ALL}")
        print(f"{Fore.RED}Failed Checks: {len(self.issues)}{Style.RESET_ALL}")

        if self.issues:
            print(f"\n{Fore.RED}CRITICAL ISSUES FOUND:{Style.RESET_ALL}")
            for severity, message in self.issues:
                color = Fore.RED if severity == "CRITICAL" else Fore.YELLOW
                print(f"{color}  [{severity}] {message}{Style.RESET_ALL}")

        if self.warnings:
            print(f"\n{Fore.YELLOW}WARNINGS:{Style.RESET_ALL}")
            for warning in self.warnings:
                print(f"{Fore.YELLOW}  {warning}{Style.RESET_ALL}")

        print(f"\n{Fore.CYAN}{'=' * 80}{Style.RESET_ALL}")

        # Determine exit status
        critical_count = sum(1 for s, _ in self.issues if s == "CRITICAL")

        if critical_count > 0:
            print(f"{Fore.RED}AUDIT FAILED: {critical_count} critical issue(s) found{Style.RESET_ALL}")
            print(f"{Fore.RED}Security posture is COMPROMISED. Fix critical issues immediately.{Style.RESET_ALL}")
            sys.exit(1)
        elif self.issues:
            print(f"{Fore.YELLOW}AUDIT WARNING: {len(self.issues)} issue(s) found{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}Security posture is ADEQUATE but needs improvement.{Style.RESET_ALL}")
            sys.exit(0)
        else:
            print(f"{Fore.GREEN}AUDIT PASSED: Security posture is EXCELLENT{Style.RESET_ALL}")
            sys.exit(0)


def main():
    """Main entry point."""
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print(f"{Fore.RED}ERROR: DATABASE_URL environment variable not set{Style.RESET_ALL}")
        print(f"Usage: DATABASE_URL='postgresql://...' python scripts/security_audit.py")
        sys.exit(1)

    # Don't run on SQLite (RLS not supported)
    if 'sqlite' in database_url.lower():
        print(f"{Fore.YELLOW}WARNING: SQLite detected. RLS security features not available.{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}For production, use PostgreSQL with RLS enabled.{Style.RESET_ALL}")
        sys.exit(0)

    audit = SecurityAudit(database_url)
    audit.run()


if __name__ == "__main__":
    main()
