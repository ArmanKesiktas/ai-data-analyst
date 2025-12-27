"""
Security utilities for multi-tenant data isolation and validation
"""
from sqlalchemy import inspect
from file_handler import engine


def validate_table_access(table_name: str, user_id: int) -> bool:
    """
    Validate that a user has access to a specific table.

    SECURITY: Multi-tenant isolation - checks if table exists and user has data in it.

    Args:
        table_name: Name of the table to validate
        user_id: Current authenticated user ID

    Returns:
        True if user has access, raises ValueError otherwise

    Raises:
        ValueError: If table doesn't exist or user has no access
    """
    inspector = inspect(engine)

    # Check if table exists
    if table_name not in inspector.get_table_names():
        raise ValueError(f"Table '{table_name}' not found")

    # System tables are never accessible
    SYSTEM_TABLES = {
        'users', '_column_metadata', '_table_metadata', '_schema',
        '_schema_changelog', '_migrations', 'sqlite_sequence', 'alembic_version'
    }

    if table_name in SYSTEM_TABLES or table_name.startswith('_'):
        raise ValueError(f"Access denied to system table '{table_name}'")

    # Get table columns
    columns = inspector.get_columns(table_name)
    column_names = [col["name"] for col in columns]

    # If table has user_id column, verify user has data in it
    if 'user_id' in column_names:
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(
                text(f"SELECT COUNT(*) FROM {table_name} WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            count = result.scalar()

            if count == 0:
                raise ValueError(
                    f"Access denied: You have no data in table '{table_name}'"
                )

    # Table exists and user has access
    return True


def get_user_filtered_query(table_name: str, user_id: int, base_query: str = None) -> str:
    """
    Add user_id filtering to a SQL query for multi-tenant isolation.

    Args:
        table_name: Name of the table being queried
        user_id: Current authenticated user ID
        base_query: Optional base query to modify (if None, returns just the WHERE clause)

    Returns:
        Modified query with user_id filter, or WHERE clause string
    """
    inspector = inspect(engine)
    columns = inspector.get_columns(table_name)
    column_names = [col["name"] for col in columns]

    # Only add filter if table has user_id column
    if 'user_id' not in column_names:
        return base_query if base_query else ""

    # If no base query, return just the WHERE clause
    if not base_query:
        return f"WHERE user_id = {user_id}"

    # Add WHERE clause to base query
    if 'WHERE' in base_query.upper():
        # Query already has WHERE, add AND condition
        return base_query.replace(
            'WHERE',
            f'WHERE user_id = {user_id} AND',
            1  # Only replace first occurrence
        )
    else:
        # Add new WHERE clause before ORDER BY, LIMIT, etc.
        keywords = ['ORDER BY', 'LIMIT', 'OFFSET', 'GROUP BY']
        for keyword in keywords:
            if keyword in base_query.upper():
                idx = base_query.upper().index(keyword)
                return (
                    base_query[:idx] +
                    f" WHERE user_id = {user_id} " +
                    base_query[idx:]
                )

        # No special clauses, add at end
        return f"{base_query} WHERE user_id = {user_id}"


def sanitize_sql_identifier(identifier: str) -> str:
    """
    Sanitize SQL identifiers (table names, column names) to prevent injection.

    Args:
        identifier: The identifier to sanitize

    Returns:
        Sanitized identifier

    Raises:
        ValueError: If identifier contains dangerous characters
    """
    import re

    # Only allow alphanumeric, underscore, and hyphen
    if not re.match(r'^[a-zA-Z0-9_-]+$', identifier):
        raise ValueError(
            f"Invalid identifier '{identifier}': only alphanumeric, underscore, and hyphen allowed"
        )

    # Prevent SQL keywords being used as identifiers
    SQL_KEYWORDS = {
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
        'ALTER', 'TRUNCATE', 'EXEC', 'EXECUTE', 'UNION', 'FROM', 'WHERE'
    }

    if identifier.upper() in SQL_KEYWORDS:
        raise ValueError(f"SQL keyword '{identifier}' cannot be used as identifier")

    return identifier
