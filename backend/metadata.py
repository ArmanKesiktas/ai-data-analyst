"""
Metadata Management Module
--------------------------
Manages table and column metadata for the Table Builder feature.
Tracks schema changes and provides metadata sync functionality.
"""

from sqlalchemy import create_engine, text
from datetime import datetime
import os
import json

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sales.db")
# SQLite için check_same_thread gerekli, PostgreSQL için değil
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# PostgreSQL mi SQLite mi kontrol et
IS_POSTGRES = "postgresql" in DATABASE_URL


def init_metadata_tables():
    """Create metadata tables if they don't exist"""
    with engine.connect() as conn:
        # Table metadata
        # PostgreSQL uses SERIAL, SQLite uses AUTOINCREMENT
        if IS_POSTGRES:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS _table_metadata (
                    id SERIAL PRIMARY KEY,
                    table_name TEXT NOT NULL UNIQUE,
                    display_name TEXT,
                    is_visible INTEGER DEFAULT 1,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """))
        else:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS _table_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    table_name TEXT NOT NULL UNIQUE,
                    display_name TEXT,
                    is_visible INTEGER DEFAULT 1,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """))
        
        # Column metadata
        if IS_POSTGRES:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS _column_metadata (
                    id SERIAL PRIMARY KEY,
                    table_name TEXT NOT NULL,
                    column_name TEXT NOT NULL,
                    data_type TEXT NOT NULL,
                    is_nullable INTEGER DEFAULT 1,
                    is_primary_key INTEGER DEFAULT 0,
                    is_visible INTEGER DEFAULT 1,
                    display_order INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(table_name, column_name)
                )
            """))
        else:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS _column_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    table_name TEXT NOT NULL,
                    column_name TEXT NOT NULL,
                    data_type TEXT NOT NULL,
                    is_nullable INTEGER DEFAULT 1,
                    is_primary_key INTEGER DEFAULT 0,
                    is_visible INTEGER DEFAULT 1,
                    display_order INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(table_name, column_name)
                )
            """))
        
        # Schema changelog
        if IS_POSTGRES:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS _schema_changelog (
                    id SERIAL PRIMARY KEY,
                    table_name TEXT NOT NULL,
                    action TEXT NOT NULL,
                    details TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """))
        else:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS _schema_changelog (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    table_name TEXT NOT NULL,
                    action TEXT NOT NULL,
                    details TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """))
        
        conn.commit()
    
    print("✅ Metadata tables initialized")


def log_schema_change(table_name: str, action: str, details: dict = None):
    """Log a schema change to the changelog"""
    with engine.connect() as conn:
        conn.execute(text("""
            INSERT INTO _schema_changelog (table_name, action, details, created_at)
            VALUES (:table_name, :action, :details, :created_at)
        """), {
            "table_name": table_name,
            "action": action,
            "details": json.dumps(details) if details else None,
            "created_at": datetime.now().isoformat()
        })
        conn.commit()


def save_table_metadata(table_name: str, display_name: str = None):
    """Save or update table metadata"""
    with engine.connect() as conn:
        # Check if exists
        result = conn.execute(text(
            "SELECT id FROM _table_metadata WHERE table_name = :name"
        ), {"name": table_name}).fetchone()
        
        now = datetime.now().isoformat()
        
        if result:
            conn.execute(text("""
                UPDATE _table_metadata 
                SET display_name = :display_name, updated_at = :updated_at
                WHERE table_name = :name
            """), {
                "name": table_name,
                "display_name": display_name or table_name,
                "updated_at": now
            })
        else:
            conn.execute(text("""
                INSERT INTO _table_metadata (table_name, display_name, created_at, updated_at)
                VALUES (:name, :display_name, :created_at, :updated_at)
            """), {
                "name": table_name,
                "display_name": display_name or table_name,
                "created_at": now,
                "updated_at": now
            })
        
        conn.commit()


def save_column_metadata(table_name: str, columns: list):
    """
    Save column metadata for a table
    
    Args:
        table_name: Name of the table
        columns: List of column dicts with keys: name, type, nullable, is_primary_key
    """
    with engine.connect() as conn:
        # Clear existing column metadata for this table
        conn.execute(text(
            "DELETE FROM _column_metadata WHERE table_name = :table_name"
        ), {"table_name": table_name})
        
        now = datetime.now().isoformat()
        
        for idx, col in enumerate(columns):
            conn.execute(text("""
                INSERT INTO _column_metadata 
                (table_name, column_name, data_type, is_nullable, is_primary_key, display_order, created_at, updated_at)
                VALUES (:table_name, :column_name, :data_type, :is_nullable, :is_primary_key, :display_order, :created_at, :updated_at)
            """), {
                "table_name": table_name,
                "column_name": col["name"],
                "data_type": col["type"],
                "is_nullable": 1 if col.get("nullable", True) else 0,
                "is_primary_key": 1 if col.get("is_primary_key", False) else 0,
                "display_order": idx,
                "created_at": now,
                "updated_at": now
            })
        
        conn.commit()


def get_table_metadata(table_name: str) -> dict:
    """Get full metadata for a table including columns"""
    with engine.connect() as conn:
        # Get table metadata
        table_result = conn.execute(text("""
            SELECT table_name, display_name, is_visible, created_at, updated_at
            FROM _table_metadata WHERE table_name = :name
        """), {"name": table_name}).fetchone()
        
        if not table_result:
            return None
        
        # Get column metadata
        columns_result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, is_primary_key, is_visible, display_order
            FROM _column_metadata 
            WHERE table_name = :name
            ORDER BY display_order
        """), {"name": table_name}).fetchall()
        
        return {
            "table_name": table_result[0],
            "display_name": table_result[1],
            "is_visible": bool(table_result[2]),
            "created_at": table_result[3],
            "updated_at": table_result[4],
            "columns": [
                {
                    "name": row[0],
                    "type": row[1],
                    "nullable": bool(row[2]),
                    "is_primary_key": bool(row[3]),
                    "is_visible": bool(row[4]),
                    "display_order": row[5]
                }
                for row in columns_result
            ]
        }


def update_column_visibility(table_name: str, column_name: str, is_visible: bool):
    """Toggle column visibility (logical hide, not physical delete)"""
    with engine.connect() as conn:
        conn.execute(text("""
            UPDATE _column_metadata 
            SET is_visible = :is_visible, updated_at = :updated_at
            WHERE table_name = :table_name AND column_name = :column_name
        """), {
            "table_name": table_name,
            "column_name": column_name,
            "is_visible": 1 if is_visible else 0,
            "updated_at": datetime.now().isoformat()
        })
        conn.commit()
    
    log_schema_change(table_name, "column_visibility", {
        "column": column_name,
        "visible": is_visible
    })


def delete_table_metadata(table_name: str):
    """Delete all metadata for a table"""
    with engine.connect() as conn:
        conn.execute(text(
            "DELETE FROM _column_metadata WHERE table_name = :name"
        ), {"name": table_name})
        conn.execute(text(
            "DELETE FROM _table_metadata WHERE table_name = :name"
        ), {"name": table_name})
        conn.commit()
    
    log_schema_change(table_name, "table_deleted", None)


def rename_table_metadata(old_name: str, new_name: str):
    """Update metadata when a table is renamed"""
    with engine.connect() as conn:
        now = datetime.now().isoformat()
        
        conn.execute(text("""
            UPDATE _table_metadata 
            SET table_name = :new_name, updated_at = :updated_at
            WHERE table_name = :old_name
        """), {"old_name": old_name, "new_name": new_name, "updated_at": now})
        
        conn.execute(text("""
            UPDATE _column_metadata 
            SET table_name = :new_name, updated_at = :updated_at
            WHERE table_name = :old_name
        """), {"old_name": old_name, "new_name": new_name, "updated_at": now})
        
        conn.commit()
    
    log_schema_change(new_name, "table_renamed", {"old_name": old_name})


def get_schema_changelog(table_name: str = None, limit: int = 50) -> list:
    """Get schema changelog entries"""
    with engine.connect() as conn:
        if table_name:
            result = conn.execute(text("""
                SELECT table_name, action, details, created_at
                FROM _schema_changelog
                WHERE table_name = :name
                ORDER BY created_at DESC
                LIMIT :limit
            """), {"name": table_name, "limit": limit}).fetchall()
        else:
            result = conn.execute(text("""
                SELECT table_name, action, details, created_at
                FROM _schema_changelog
                ORDER BY created_at DESC
                LIMIT :limit
            """), {"limit": limit}).fetchall()
        
        return [
            {
                "table_name": row[0],
                "action": row[1],
                "details": json.loads(row[2]) if row[2] else None,
                "created_at": row[3]
            }
            for row in result
        ]


# Initialize metadata tables on module import
init_metadata_tables()
