"""
Table Builder Module
--------------------
Handles manual table creation and schema editing operations.
Generates safe SQL statements and validates operations.
"""

from sqlalchemy import create_engine, text
from datetime import datetime
import os
import re

from metadata import (
    save_table_metadata,
    save_column_metadata,
    delete_table_metadata,
    rename_table_metadata,
    log_schema_change,
    get_table_metadata,
    update_column_visibility
)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sales.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})

# Type mapping: UI type -> SQLite type
TYPE_MAPPING = {
    "text": "TEXT",
    "number": "REAL",
    "date": "DATE",
    "boolean": "INTEGER"
}

# Reserved table names that cannot be created/modified
RESERVED_TABLES = {"_table_metadata", "_column_metadata", "_schema_changelog"}

# Reserved column names
RESERVED_COLUMNS = {"rowid"}


def validate_name(name: str, name_type: str = "table") -> tuple[bool, str]:
    """
    Validate table or column name
    Returns (is_valid, error_message)
    """
    if not name:
        return False, f"{name_type.capitalize()} name cannot be empty"
    
    if len(name) > 64:
        return False, f"{name_type.capitalize()} name too long (max 64 characters)"
    
    # Must start with letter, contain only lowercase letters, numbers, underscores
    if not re.match(r'^[a-z][a-z0-9_]*$', name):
        return False, f"{name_type.capitalize()} name must be snake_case (lowercase letters, numbers, underscores, starting with a letter)"
    
    if name_type == "table" and name in RESERVED_TABLES:
        return False, f"'{name}' is a reserved table name"
    
    if name_type == "column" and name.lower() in RESERVED_COLUMNS:
        return False, f"'{name}' is a reserved column name"
    
    return True, ""


def validate_columns(columns: list) -> tuple[bool, str]:
    """Validate column definitions"""
    if not columns:
        return False, "At least one column is required"
    
    names_seen = set()
    primary_key_count = 0
    
    for col in columns:
        name = col.get("name", "")
        col_type = col.get("type", "")
        
        # Validate name
        valid, error = validate_name(name, "column")
        if not valid:
            return False, error
        
        # Check for duplicates
        if name.lower() in names_seen:
            return False, f"Duplicate column name: '{name}'"
        names_seen.add(name.lower())
        
        # Validate type
        if col_type not in TYPE_MAPPING:
            return False, f"Invalid column type: '{col_type}'. Valid types: {list(TYPE_MAPPING.keys())}"
        
        # Count primary keys
        if col.get("is_primary_key"):
            primary_key_count += 1
    
    if primary_key_count > 1:
        return False, "Only one column can be marked as primary key"
    
    return True, ""


def generate_create_sql(table_name: str, columns: list, add_auto_id: bool = True) -> str:
    """
    Generate CREATE TABLE SQL statement
    
    Args:
        table_name: Name of the table
        columns: List of column dicts with keys: name, type, nullable, is_primary_key
        add_auto_id: If True and no primary key defined, add 'id INTEGER PRIMARY KEY AUTOINCREMENT'
    
    Returns:
        SQL CREATE TABLE statement
    """
    # Check if any column is already marked as primary key
    has_primary_key = any(col.get("is_primary_key") for col in columns)
    
    column_defs = []
    
    # Add auto ID if needed
    if add_auto_id and not has_primary_key:
        column_defs.append("id INTEGER PRIMARY KEY AUTOINCREMENT")

    # Add user_id for multi-tenant isolation (always add)
    column_defs.append("user_id INTEGER NOT NULL")

    for col in columns:
        col_name = col["name"]
        col_type = TYPE_MAPPING.get(col["type"], "TEXT")
        nullable = col.get("nullable", True)
        is_pk = col.get("is_primary_key", False)
        
        parts = [col_name, col_type]
        
        if is_pk:
            parts.append("PRIMARY KEY")
            if col_type == "INTEGER":
                parts.append("AUTOINCREMENT")
        elif not nullable:
            parts.append("NOT NULL")
        
        column_defs.append(" ".join(parts))
    
    sql = f"CREATE TABLE {table_name} (\n    " + ",\n    ".join(column_defs) + "\n)"
    return sql


def create_table(table_name: str, columns: list, add_auto_id: bool = True) -> dict:
    """
    Create a new table in the database
    
    Args:
        table_name: Name of the table
        columns: List of column dicts
        add_auto_id: If True and no primary key, add auto-increment id
    
    Returns:
        dict with success status and message
    """
    # Validate table name
    valid, error = validate_name(table_name, "table")
    if not valid:
        return {"success": False, "error": error}
    
    # Validate columns
    valid, error = validate_columns(columns)
    if not valid:
        return {"success": False, "error": error}
    
    # Check if table already exists
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name = :name"
        ), {"name": table_name}).fetchone()
        
        if result:
            return {"success": False, "error": f"Table '{table_name}' already exists"}
    
    # Generate and execute SQL
    sql = generate_create_sql(table_name, columns, add_auto_id)
    
    try:
        with engine.connect() as conn:
            conn.execute(text(sql))
            conn.commit()
        
        # Save metadata
        # If we added auto ID, prepend it to columns list for metadata
        metadata_columns = list(columns)
        has_primary_key = any(col.get("is_primary_key") for col in columns)
        if add_auto_id and not has_primary_key:
            metadata_columns.insert(0, {
                "name": "id",
                "type": "number",
                "nullable": False,
                "is_primary_key": True
            })

        # Add user_id to metadata (always present for multi-tenant isolation)
        metadata_columns.insert(1 if (add_auto_id and not has_primary_key) else 0, {
            "name": "user_id",
            "type": "number",
            "nullable": False,
            "is_system_column": True  # Mark as system column, hidden from user
        })
        
        save_table_metadata(table_name)
        save_column_metadata(table_name, metadata_columns)
        log_schema_change(table_name, "table_created", {"columns": [c["name"] for c in metadata_columns]})
        
        return {
            "success": True,
            "message": f"Table '{table_name}' created successfully",
            "sql": sql
        }
        
    except Exception as e:
        return {"success": False, "error": f"Failed to create table: {str(e)}"}


def preview_create_sql(table_name: str, columns: list, add_auto_id: bool = True) -> dict:
    """Generate SQL preview without executing"""
    # Validate
    valid, error = validate_name(table_name, "table")
    if not valid:
        return {"success": False, "error": error}
    
    valid, error = validate_columns(columns)
    if not valid:
        return {"success": False, "error": error}
    
    sql = generate_create_sql(table_name, columns, add_auto_id)
    return {"success": True, "sql": sql}


def rename_table(old_name: str, new_name: str) -> dict:
    """Rename a table"""
    if old_name in RESERVED_TABLES:
        return {"success": False, "error": "Cannot rename system tables"}
    
    valid, error = validate_name(new_name, "table")
    if not valid:
        return {"success": False, "error": error}
    
    try:
        with engine.connect() as conn:
            # Check if old table exists
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name = :name"
            ), {"name": old_name}).fetchone()
            
            if not result:
                return {"success": False, "error": f"Table '{old_name}' not found"}
            
            # Check if new name already exists
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name = :name"
            ), {"name": new_name}).fetchone()
            
            if result:
                return {"success": False, "error": f"Table '{new_name}' already exists"}
            
            # Rename table
            conn.execute(text(f"ALTER TABLE {old_name} RENAME TO {new_name}"))
            conn.commit()
        
        # Update metadata
        rename_table_metadata(old_name, new_name)
        
        return {
            "success": True,
            "message": f"Table renamed from '{old_name}' to '{new_name}'"
        }
        
    except Exception as e:
        return {"success": False, "error": f"Failed to rename table: {str(e)}"}


def truncate_table(table_name: str) -> dict:
    """Delete all rows from a table (keep schema)"""
    if table_name in RESERVED_TABLES:
        return {"success": False, "error": "Cannot truncate system tables"}
    
    try:
        with engine.connect() as conn:
            # Check if table exists
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name = :name"
            ), {"name": table_name}).fetchone()
            
            if not result:
                return {"success": False, "error": f"Table '{table_name}' not found"}
            
            # Get row count before
            count_result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).fetchone()
            row_count = count_result[0] if count_result else 0
            
            # Delete all rows
            conn.execute(text(f"DELETE FROM {table_name}"))
            conn.commit()
        
        log_schema_change(table_name, "table_truncated", {"rows_deleted": row_count})
        
        return {
            "success": True,
            "message": f"Deleted {row_count} rows from '{table_name}'",
            "rows_deleted": row_count
        }
        
    except Exception as e:
        return {"success": False, "error": f"Failed to truncate table: {str(e)}"}


def drop_table(table_name: str) -> dict:
    """Drop a table completely"""
    if table_name in RESERVED_TABLES:
        return {"success": False, "error": "Cannot drop system tables"}
    
    if table_name == "sales":
        return {"success": False, "error": "Cannot drop the default 'sales' table"}
    
    try:
        with engine.connect() as conn:
            # Check if table exists
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name = :name"
            ), {"name": table_name}).fetchone()
            
            if not result:
                return {"success": False, "error": f"Table '{table_name}' not found"}
            
            # Drop table
            conn.execute(text(f"DROP TABLE {table_name}"))
            conn.commit()
        
        # Delete metadata
        delete_table_metadata(table_name)
        
        return {
            "success": True,
            "message": f"Table '{table_name}' deleted successfully"
        }
        
    except Exception as e:
        return {"success": False, "error": f"Failed to drop table: {str(e)}"}


def rename_column(table_name: str, old_column: str, new_column: str) -> dict:
    """Rename a column"""
    if table_name in RESERVED_TABLES:
        return {"success": False, "error": "Cannot modify system tables"}
    
    valid, error = validate_name(new_column, "column")
    if not valid:
        return {"success": False, "error": error}
    
    try:
        with engine.connect() as conn:
            # SQLite 3.25+ supports ALTER TABLE RENAME COLUMN
            conn.execute(text(
                f"ALTER TABLE {table_name} RENAME COLUMN {old_column} TO {new_column}"
            ))
            conn.commit()
        
        # Update column metadata
        with engine.connect() as conn:
            conn.execute(text("""
                UPDATE _column_metadata 
                SET column_name = :new_name, updated_at = :updated_at
                WHERE table_name = :table_name AND column_name = :old_name
            """), {
                "table_name": table_name,
                "old_name": old_column,
                "new_name": new_column,
                "updated_at": datetime.now().isoformat()
            })
            conn.commit()
        
        log_schema_change(table_name, "column_renamed", {
            "old_name": old_column,
            "new_name": new_column
        })
        
        return {
            "success": True,
            "message": f"Column renamed from '{old_column}' to '{new_column}'"
        }
        
    except Exception as e:
        return {"success": False, "error": f"Failed to rename column: {str(e)}"}


def check_type_change_safety(table_name: str, column_name: str, new_type: str) -> tuple[bool, str]:
    """
    Check if changing column type is safe (won't lose data)
    Returns (is_safe, warning_message)
    """
    # Get sample values from the column
    with engine.connect() as conn:
        result = conn.execute(text(
            f"SELECT DISTINCT {column_name} FROM {table_name} WHERE {column_name} IS NOT NULL LIMIT 100"
        )).fetchall()
    
    values = [row[0] for row in result]
    
    if not values:
        return True, ""  # No data, always safe
    
    if new_type == "text":
        return True, ""  # Everything can be text
    
    if new_type == "number":
        for val in values:
            try:
                float(val)
            except (ValueError, TypeError):
                return False, f"Cannot convert '{val}' to number. Some values are not numeric."
    
    if new_type == "boolean":
        valid_booleans = {0, 1, "0", "1", "true", "false", True, False}
        for val in values:
            if val not in valid_booleans and str(val).lower() not in {"true", "false"}:
                return False, f"Cannot convert '{val}' to boolean. Valid values: 0, 1, true, false."
    
    if new_type == "date":
        import re
        date_patterns = [
            r'^\d{4}-\d{2}-\d{2}$',  # YYYY-MM-DD
            r'^\d{2}/\d{2}/\d{4}$',  # MM/DD/YYYY
            r'^\d{2}-\d{2}-\d{4}$',  # DD-MM-YYYY
        ]
        for val in values:
            val_str = str(val)
            if not any(re.match(p, val_str) for p in date_patterns):
                return False, f"Cannot convert '{val}' to date. Expected format: YYYY-MM-DD"
    
    return True, ""


def get_all_user_tables() -> list:
    """Get all user-created tables (excluding system tables)"""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            AND name NOT LIKE '_%'
            AND name != 'sqlite_sequence'
            ORDER BY name
        """)).fetchall()
    
    return [row[0] for row in result]


def get_table_schema(table_name: str) -> list:
    """Get the actual schema of a table from SQLite"""
    with engine.connect() as conn:
        result = conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    
    return [
        {
            "cid": row[0],
            "name": row[1],
            "type": row[2],
            "notnull": bool(row[3]),
            "default": row[4],
            "is_primary_key": bool(row[5])
        }
        for row in result
    ]
