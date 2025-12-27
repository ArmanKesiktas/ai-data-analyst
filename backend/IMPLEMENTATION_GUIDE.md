# Yeni Özelliklerin Implementasyon Rehberi

## ✅ TAMAMLANAN ÖZELLIKLER

### 1. Workspace Backend API ✅
**Dosyalar:**
- `database.py` - Workspace, WorkspaceMember, WorkspaceInvitation modelleri eklendi
- `workspace_service.py` - Tüm workspace business logic
- `workspace_endpoints.py` - FastAPI router ile API endpoint'leri
- `models.py` - Pydantic modelleri eklendi

**Özellikler:**
- ✅ Workspace oluşturma/güncelleme/silme
- ✅ Üye ekleme/çıkarma
- ✅ Davet token sistemi (7 gün geçerli)
- ✅ Role-based access control (owner, editor, viewer)

**Kullanım:**
```python
# main.py'ye ekle:
from workspace_endpoints import router as workspace_router
app.include_router(workspace_router)
```

### 2. Email Servisi ✅
**Dosya:** `email_service.py`

**Desteklenen Provider'lar:**
- Console (development - log'a yazdırır)
- SendGrid
- AWS SES
- SMTP (generic)

**Environment Variables:**
```bash
EMAIL_PROVIDER=console  # console, sendgrid, ses, smtp
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=AI Data Analyst

# SendGrid
SENDGRID_API_KEY=your-key

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password
SMTP_USE_TLS=true
```

**Kullanım:**
```python
from email_service import email_service

# Workspace davet endpoint'inde:
invitation_url = f"https://yourdomain.com/accept-invite?token={token}"
email_service.send_workspace_invitation(
    to_email=invite_email,
    workspace_name=workspace.name,
    inviter_name=current_user.full_name,
    invitation_url=invitation_url
)
```

### 3. Audit Logging ✅
**Dosya:** `database.py` - AuditLog modeli eklendi

**Kolon Yapısı:**
```python
user_id          # Kim yaptı
action           # Ne yaptı (upload, analyze, delete_table, etc.)
resource_type    # Hangi kaynak (table, row, workspace, etc.)
resource_id      # Hangi kaynak ID'si
details          # JSON string ile ek detaylar
ip_address       # Hangi IP'den
user_agent       # Hangi browser
created_at       # Ne zaman
```

---

## 🔨 YAPILMASI GEREKENLER

### 4. Data Cleaning Backend (Öncelik: Yüksek)

**Oluşturulacak Dosya:** `data_cleaning.py`

```python
"""
Data cleaning utilities
"""
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text, inspect
from file_handler import engine
from typing import Dict, Any
from scipy import stats


def clean_data(table_name: str, user_id: int, options: dict) -> Dict[str, Any]:
    """
    Clean data based on user options

    Args:
        table_name: Table to clean
        user_id: Current user ID (for multi-tenant security)
        options: Cleaning options dict

    Returns:
        Dict with before/after stats and changes
    """
    # Read data with user_id filter
    inspector = inspect(engine)
    columns = inspector.get_columns(table_name)
    column_names = [col["name"] for col in columns]

    # SECURITY: Only clean user's own data
    if 'user_id' in column_names:
        df = pd.read_sql(
            f"SELECT * FROM {table_name} WHERE user_id = ?",
            engine,
            params=(user_id,)
        )
    else:
        df = pd.read_sql(f"SELECT * FROM {table_name}", engine)

    rows_before = len(df)
    changes = {}

    # 1. Remove duplicates
    if options.get("remove_duplicates"):
        df_before = len(df)
        df = df.drop_duplicates()
        changes["duplicates_removed"] = df_before - len(df)

    # 2. Fill missing values
    if options.get("fill_missing"):
        method = options.get("fill_method", "drop")
        numeric_cols = df.select_dtypes(include=[np.number]).columns

        if method == "mean":
            for col in numeric_cols:
                df[col] = df[col].fillna(df[col].mean())
            changes["missing_filled"] = "mean"
        elif method == "median":
            for col in numeric_cols:
                df[col] = df[col].fillna(df[col].median())
            changes["missing_filled"] = "median"
        elif method == "forward":
            df = df.fillna(method='ffill')
            changes["missing_filled"] = "forward fill"
        elif method == "drop":
            df_before = len(df)
            df = df.dropna()
            changes["rows_with_missing_dropped"] = df_before - len(df)

    # 3. Remove outliers (Z-score > 3)
    if options.get("remove_outliers"):
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df_before = len(df)

        for col in numeric_cols:
            z_scores = np.abs(stats.zscore(df[col].dropna()))
            df = df[(z_scores < 3) | df[col].isna()]

        changes["outliers_removed"] = df_before - len(df)

    # 4. Normalize text
    if options.get("normalize_text"):
        text_cols = df.select_dtypes(include=['object']).columns
        for col in text_cols:
            if col != 'user_id':  # Don't normalize user_id
                df[col] = df[col].str.strip().str.lower()
        changes["text_normalized"] = True

    # 5. Convert dates
    if options.get("convert_dates"):
        date_cols = options.get("date_columns", [])
        for col in date_cols:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
        changes["dates_converted"] = date_cols

    rows_after = len(df)

    # Write back to database
    # DELETE old rows and INSERT new cleaned rows
    with engine.connect() as conn:
        if 'user_id' in column_names:
            conn.execute(
                text(f"DELETE FROM {table_name} WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
        else:
            conn.execute(text(f"DELETE FROM {table_name}"))

        df.to_sql(table_name, engine, if_exists='append', index=False)
        conn.commit()

    return {
        "rows_before": rows_before,
        "rows_after": rows_after,
        "changes": changes
    }
```

**API Endpoint (main.py'ye ekle):**
```python
from models import DataCleaningRequest, DataCleaningResponse
from data_cleaning import clean_data

@app.post("/api/data-cleaning", response_model=DataCleaningResponse)
async def clean_table_data(
    request: DataCleaningRequest,
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Clean data in a table based on user options
    """
    try:
        # Validate table access
        from security import validate_table_access
        validate_table_access(request.table_name, current_user_id)

        # Clean data
        result = clean_data(
            table_name=request.table_name,
            user_id=current_user_id,
            options=request.options.dict()
        )

        return DataCleaningResponse(
            success=True,
            table_name=request.table_name,
            rows_before=result["rows_before"],
            rows_after=result["rows_after"],
            changes=result["changes"],
            message=f"Data cleaned successfully. {result['rows_before']} rows -> {result['rows_after']} rows"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 5. Audit Logging Entegrasyonu

**Oluşturulacak Dosya:** `audit_logger.py`

```python
"""
Audit logging utility
"""
from database import SessionLocal, AuditLog
from fastapi import Request
import json


def log_action(
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: str = None,
    details: dict = None,
    request: Request = None
):
    """
    Log user action to audit table

    Args:
        user_id: User ID
        action: Action name (upload, analyze, delete, etc.)
        resource_type: table, row, workspace, etc.
        resource_id: ID of affected resource
        details: Additional details as dict
        request: FastAPI request object (for IP and user agent)
    """
    db = SessionLocal()
    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=json.dumps(details) if details else None,
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None
        )
        db.add(log_entry)
        db.commit()
    finally:
        db.close()


# Usage in endpoints:
from audit_logger import log_action

@app.post("/api/upload")
async def upload_data_file(
    file: UploadFile = File(...),
    current_user_id: int = Depends(get_current_user_id),
    request: Request = None
):
    # ... upload logic ...

    # Log the action
    log_action(
        user_id=current_user_id,
        action="upload",
        resource_type="table",
        resource_id=result["table_name"],
        details={"filename": file.filename, "rows": result["row_count"]},
        request=request
    )
```

**GET Audit Logs Endpoint:**
```python
@app.get("/api/audit-logs")
async def get_audit_logs(
    page: int = 0,
    page_size: int = 50,
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Get audit logs for current user
    """
    db = SessionLocal()
    try:
        logs = db.query(AuditLog).filter(
            AuditLog.user_id == current_user_id
        ).order_by(
            AuditLog.created_at.desc()
        ).offset(page * page_size).limit(page_size).all()

        return {
            "success": True,
            "logs": [
                {
                    "id": log.id,
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "details": json.loads(log.details) if log.details else None,
                    "ip_address": log.ip_address,
                    "created_at": log.created_at.isoformat()
                }
                for log in logs
            ]
        }
    finally:
        db.close()
```

### 6. Database Backup Utility

**Oluşturulacak Dosya:** `backup.py`

```python
"""
Database backup utility
"""
import os
import shutil
from datetime import datetime
import subprocess


def backup_sqlite(db_path: str, backup_dir: str = "./backups") -> str:
    """
    Backup SQLite database

    Args:
        db_path: Path to SQLite database file
        backup_dir: Directory to store backups

    Returns:
        Path to backup file
    """
    # Create backup directory
    os.makedirs(backup_dir, exist_ok=True)

    # Generate backup filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"backup_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_name)

    # Copy database file
    shutil.copy2(db_path, backup_path)

    print(f"✅ Backup created: {backup_path}")
    return backup_path


def backup_postgresql(connection_string: str, backup_dir: str = "./backups") -> str:
    """
    Backup PostgreSQL database using pg_dump

    Args:
        connection_string: PostgreSQL connection string
        backup_dir: Directory to store backups

    Returns:
        Path to backup file
    """
    # Create backup directory
    os.makedirs(backup_dir, exist_ok=True)

    # Generate backup filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"backup_{timestamp}.sql"
    backup_path = os.path.join(backup_dir, backup_name)

    # Run pg_dump
    subprocess.run([
        "pg_dump",
        connection_string,
        "-f", backup_path
    ], check=True)

    print(f"✅ PostgreSQL backup created: {backup_path}")
    return backup_path


def cleanup_old_backups(backup_dir: str = "./backups", keep_last: int = 7):
    """
    Delete old backups, keep only recent N backups

    Args:
        backup_dir: Backup directory
        keep_last: Number of backups to keep
    """
    if not os.path.exists(backup_dir):
        return

    # Get all backup files sorted by modification time
    backups = []
    for f in os.listdir(backup_dir):
        if f.startswith("backup_") and (f.endswith(".db") or f.endswith(".sql")):
            full_path = os.path.join(backup_dir, f)
            backups.append((full_path, os.path.getmtime(full_path)))

    # Sort by modification time (newest first)
    backups.sort(key=lambda x: x[1], reverse=True)

    # Delete old backups
    for backup_path, _ in backups[keep_last:]:
        os.remove(backup_path)
        print(f"🗑️  Deleted old backup: {backup_path}")


# Scheduled backup task (use with celery or cron)
def scheduled_backup():
    """Run daily backup"""
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sales.db")

    if "sqlite" in DATABASE_URL:
        # Extract file path from sqlite:///./sales.db
        db_path = DATABASE_URL.replace("sqlite:///", "")
        backup_sqlite(db_path)
    elif "postgresql" in DATABASE_URL:
        backup_postgresql(DATABASE_URL)

    # Cleanup old backups (keep last 7)
    cleanup_old_backups(keep_last=7)


# API endpoint
@app.post("/api/backup")
async def create_backup(current_user_id: int = Depends(get_current_user_id)):
    """
    Create database backup (admin only)

    TODO: Add admin role check
    """
    try:
        scheduled_backup()
        return {"success": True, "message": "Backup created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 📋 INTEGRATION CHECKLIST

### main.py Güncellemeleri

```python
# main.py başına ekle:
from workspace_endpoints import router as workspace_router
from email_service import email_service
from audit_logger import log_action
from data_cleaning import clean_data

# Router'ları ekle:
app.include_router(workspace_router)

# Database tablolarını oluştur (startup'ta):
@app.on_event("startup")
def on_startup():
    from database import Base, engine as db_engine
    Base.metadata.create_all(bind=db_engine)
    print("✅ All database tables initialized")
```

### .env Dosyası Güncellemeleri

```.env
# Existing vars...

# Email Configuration
EMAIL_PROVIDER=console  # console, sendgrid, ses, smtp
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=AI Data Analyst

# SendGrid (optional)
# SENDGRID_API_KEY=your-key

# AWS SES (optional)
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret

# SMTP (optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USERNAME=your-email
# SMTP_PASSWORD=your-password
# SMTP_USE_TLS=true

# Backup Settings
BACKUP_ENABLED=true
BACKUP_SCHEDULE=daily  # hourly, daily, weekly
BACKUP_RETENTION_DAYS=7
```

### Frontend Integration

Frontend'de workspace invitation kabul etme:

```javascript
// Accept invitation page
async function acceptInvitation(token) {
  const response = await fetch('/api/workspaces/invitations/accept', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });

  const result = await response.json();
  if (result.success) {
    // Redirect to workspace
    window.location.href = `/workspaces/${result.workspace_id}`;
  }
}
```

---

## 🧪 TEST SENARYOLARI

### Workspace API Test
```bash
# Create workspace
curl -X POST http://localhost:8000/api/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Workspace", "description": "Test workspace"}'

# List workspaces
curl http://localhost:8000/api/workspaces \
  -H "Authorization: Bearer $TOKEN"

# Invite member
curl -X POST http://localhost:8000/api/workspaces/1/invitations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "role": "editor"}'
```

### Data Cleaning Test
```bash
curl -X POST http://localhost:8000/api/data-cleaning \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_name": "sales_data_123",
    "options": {
      "remove_duplicates": true,
      "fill_missing": true,
      "fill_method": "mean",
      "remove_outliers": true
    }
  }'
```

---

## 📊 SONUÇ

**Tamamlanan:**
- ✅ Workspace backend (database + service + API)
- ✅ Email servis (multi-provider)
- ✅ Audit logging (database model)

**Hızlı Ekleme Gereken:**
- 🔨 Data cleaning implementation (yukarıdaki kodu `data_cleaning.py`'ye kopyala)
- 🔨 Audit logger integration (yukarıdaki kodu `audit_logger.py`'ye kopyala)
- 🔨 Backup utility (yukarıdaki kodu `backup.py`'ye kopyala)
- 🔨 main.py güncellemeleri (workspace router'ı ekle)
- 🔨 .env.example güncellemesi

**Toplam Süre:** ~2 saat kod yazma + 1 saat test = 3 saat
