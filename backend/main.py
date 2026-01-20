from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from dotenv import load_dotenv
import os
import tempfile
import shutil
from datetime import datetime
from collections import defaultdict
from typing import Optional, List

from models import AnalyzeRequest, AnalyzeResponse, ChartConfig, UserCreate, UserLogin, TokenResponse, UserResponse
from database import User, SessionLocal, Base, engine as db_engine
from auth import verify_password, get_password_hash, create_access_token, get_current_user_id, get_optional_user_id
from ai_engine import AIEngine, clear_schema_cache
from query_executor import QueryExecutor
from kpi_calculator import calculate_kpis
from file_handler import (
    upload_file, 
    get_all_tables, 
    get_table_schema, 
    delete_table,
    get_table_preview,
    MAX_FILE_SIZE,
    engine
)
from table_builder import (
    create_table,
    preview_create_sql,
    rename_table,
    truncate_table,
    drop_table,
    rename_column,
    check_type_change_safety
)
from metadata import (
    get_table_metadata,
    update_column_visibility,
    get_schema_changelog
)

# Import workspace router
from workspace_endpoints import router as workspace_router


# Pydantic models for Table Builder API
class ColumnDefinition(BaseModel):
    name: str
    type: str  # text, number, date, boolean
    nullable: bool = True
    is_primary_key: bool = False


class CreateTableRequest(BaseModel):
    name: str
    columns: List[ColumnDefinition]
    add_auto_id: bool = True


class RenameTableRequest(BaseModel):
    new_name: str


class RenameColumnRequest(BaseModel):
    new_name: str


class ColumnVisibilityRequest(BaseModel):
    is_visible: bool


# .env dosyasını yükle
load_dotenv()

# FastAPI uygulaması
app = FastAPI(
    title="AI Veri Analizi API",
    description="Google Gemini API destekli veri analizi ve karar destek sistemi - Dinamik veri seti desteği",
    version="2.0.0"
)

# CORS middleware - Frontend'den erişim için
# SECURITY: Only allow specific origins, never use wildcard "*" in production
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include workspace router
app.include_router(workspace_router)

# Rate limiting için basit sayaç
request_counts = defaultdict(list)
RATE_LIMIT = 10
RATE_LIMIT_WINDOW = 60

def check_rate_limit(ip: str) -> bool:
    """Rate limiting kontrolü"""
    now = datetime.now()
    request_counts[ip] = [req_time for req_time in request_counts[ip]
                          if (now - req_time).seconds < RATE_LIMIT_WINDOW]
    if len(request_counts[ip]) >= RATE_LIMIT:
        return False
    request_counts[ip].append(now)
    return True


# Create tables on startup
@app.on_event("startup")
def on_startup():
    """Create database tables on startup"""
    Base.metadata.create_all(bind=db_engine)
    
    # Log database connection info (masked)
    db_url = os.getenv("DATABASE_URL", "sqlite:///./sales.db")
    if "postgresql" in db_url:
        print("✅ Connected to PostgreSQL (Supabase)")
    elif "sqlite" in db_url:
        print("⚠️  Connected to SQLite (Local)")
    else:
        print(f"ℹ️  Connected to: {db_url.split(':')[0]}://...")
        
    print("✅ Database tables initialized (including users)")


# ========== AUTH ENDPOINTS ==========

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """
    Yeni kullanıcı kaydı
    
    - Email benzersiz olmalı
    - Kayıt başarılı olursa JWT token döner
    """
    db = SessionLocal()
    try:
        # Check if email already exists
        email = user_data.email.lower()
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="This email is already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=user_data.full_name
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Generate token
        access_token = create_access_token(data={"sub": str(new_user.id)})
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                id=new_user.id,
                email=new_user.email,
                full_name=new_user.full_name,
                created_at=new_user.created_at
            )
        )
    finally:
        db.close()


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Kullanıcı girişi
    
    - Email ve şifre doğrulaması yapar
    - Başarılı olursa JWT token döner
    """
    db = SessionLocal()
    try:
        # Find user by email
        user = db.query(User).filter(User.email == credentials.email.lower()).first()
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Generate token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                created_at=user.created_at
            )
        )
    finally:
        db.close()


@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user(user_id: int = Depends(get_current_user_id)):
    """
    Mevcut kullanıcı bilgilerini getir
    
    - JWT token gerektirir
    - Token geçersiz veya expired ise 401 döner
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            created_at=user.created_at
        )
    finally:
        db.close()

@app.get("/")
def read_root():
    """Ana endpoint - API bilgisi"""
    return {
        "message": "AI Veri Analizi API",
        "version": "2.0.0",
        "features": ["Dinamik veri seti desteği", "CSV/Excel yükleme", "Çoklu tablo"],
        "endpoints": {
            "/api/health": "Sağlık kontrolü",
            "/api/analyze": "Veri analizi (POST)",
            "/api/upload": "Dosya yükleme (POST)",
            "/api/tables": "Tablo listesi (GET)",
            "/api/tables/{name}": "Tablo silme (DELETE)",
            "/api/tables/{name}/preview": "Tablo önizleme (GET)"
        }
    }

@app.get("/api/health")
def health_check():
    """Sağlık kontrolü endpoint'i"""
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        tables = get_all_tables()
        
        return {
            "status": "healthy",
            "message": "API çalışıyor",
            "timestamp": datetime.now().isoformat(),
            "gemini_api": "configured" if api_key else "missing",
            "tables_count": len(tables)
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/upload")
async def upload_data_file(
    file: UploadFile = File(...),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    CSV veya Excel dosyası yükle

    - Maksimum dosya boyutu: 50 MB
    - Desteklenen formatlar: .csv, .xlsx, .xls
    - Requires authentication - data will be associated with current user
    """
    try:
        # Dosya boyutu kontrolü
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Dosya boyutu çok büyük. Maksimum: {MAX_FILE_SIZE // (1024*1024)} MB"
            )
        
        # Geçici dosyaya kaydet
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            # Dosyayı işle (user_id ile)
            result = upload_file(tmp_path, file.filename, current_user_id)
            # Clear schema cache so AI can see the new table
            clear_schema_cache()
            return result
        finally:
            # Geçici dosyayı temizle
            os.unlink(tmp_path)
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya yükleme hatası: {str(e)}")

@app.get("/api/tables")
def list_tables(current_user_id: int = Depends(get_current_user_id)):
    """
    Veritabanındaki kullanıcıya ait tabloları listele

    SECURITY: Multi-tenant filtering - only shows tables with user's data
    """
    try:
        tables = get_all_tables(user_id=current_user_id)
        return {
            "success": True,
            "tables": tables,
            "count": len(tables)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tables/{table_name}")
def get_table_info(table_name: str):
    """Belirli bir tablonun bilgilerini al"""
    from sqlalchemy import inspect
    try:
        # Get columns as array for frontend compatibility
        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise ValueError(f"Table not found: {table_name}")
        
        columns = inspector.get_columns(table_name)
        pk_columns = inspector.get_pk_constraint(table_name).get('constrained_columns', [])
        
        schema_array = []
        for col in columns:
            schema_array.append({
                "name": col["name"],
                "type": str(col["type"]),
                "notnull": not col.get("nullable", True),
                "default": col.get("default"),
                "pk": 1 if col["name"] in pk_columns else 0,
                "is_primary_key": col["name"] in pk_columns
            })
        
        preview = get_table_preview(table_name, limit=5)
        schema_text = get_table_schema(table_name)
        
        return {
            "success": True,
            "table_name": table_name,
            "schema": schema_array,  # Array format for frontend
            "schema_text": schema_text,  # String format for AI
            "preview": preview
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tables/{table_name}/preview")
def preview_table(table_name: str, limit: int = 10):
    """Tablo önizlemesi al"""
    try:
        preview = get_table_preview(table_name, limit=min(limit, 100))
        return {
            "success": True,
            "table_name": table_name,
            "data": preview,
            "count": len(preview)
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tables/{table_name}")
def remove_table(table_name: str):
    """Tabloyu sil (sales tablosu hariç)"""
    try:
        delete_table(table_name)
        # Clear schema cache
        clear_schema_cache()
        return {
            "success": True,
            "message": f"'{table_name}' tablosu silindi"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_data(
    question: str = Form(...),
    table_name: Optional[str] = Form(None),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Veri analizi endpoint'i

    Kullanıcının doğal dilde sorduğu soruyu:
    1. SQL'e çevirir
    2. Veritabanında çalıştırır
    3. KPI'ları hesaplar
    4. Grafik konfigürasyonu belirler
    5. Sonuçları açıklar

    SECURITY: Requires authentication and validates table access

    Args:
        question: Kullanıcı sorusu
        table_name: Analiz edilecek tablo (opsiyonel, belirtilmezse tüm tablolar)
        current_user_id: Authenticated user ID (injected by dependency)
    """
    try:
        print(f"\n🔍 Yeni analiz isteği: {question}")
        print(f"📊 Seçili tablo: {table_name or 'Tüm tablolar'}")
        print(f"👤 Kullanıcı ID: {current_user_id}")

        # SECURITY: Validate table access if specific table requested
        if table_name:
            from security import validate_table_access
            try:
                validate_table_access(table_name, current_user_id)
            except ValueError as e:
                raise HTTPException(
                    status_code=403,
                    detail=str(e)
                )

        # 1. AI Engine ile SQL üret
        ai_engine = AIEngine(table_name=table_name, user_id=current_user_id)
        sql_query = ai_engine.generate_sql(question)

        if not sql_query:
            return AnalyzeResponse(
                success=False,
                error="SQL sorgusu oluşturulamadı. Lütfen sorunuzu daha net ifade edin."
            )

        print(f"📝 SQL: {sql_query}")

        # 2. Sorguyu çalıştır
        with QueryExecutor() as executor:
            df = executor.execute_query(sql_query)

        if df.empty:
            return AnalyzeResponse(
                success=True,
                sql=sql_query,
                data=[],
                kpis={},
                explanation="Sorgunuz için veri bulunamadı. Lütfen farklı bir soru deneyin.",
                chart_config=None
            )

        # 3. KPI'ları hesapla
        kpis = calculate_kpis(df, sql_query)

        # 4. DataFrame'i dictionary listesine çevir
        data = df.to_dict('records')

        # 5. Grafik tipini belirle
        chart_config = ai_engine.determine_chart_type(data, sql_query)

        # 6. Sonuçları açıkla
        explanation = ai_engine.explain_results(
            question=question,
            query=sql_query,
            results=data,
            kpis=kpis
        )

        print(f"✅ Analiz tamamlandı: {len(data)} satır, {len(kpis)} KPI")

        return AnalyzeResponse(
            success=True,
            sql=sql_query,
            data=data,
            kpis=kpis,
            explanation=explanation,
            chart_config=ChartConfig(**chart_config) if chart_config else None
        )

    except ValueError as e:
        print(f"⚠️  Güvenlik hatası: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz sorgu: {str(e)}"
        )

    except Exception as e:
        print(f"❌ Analiz hatası: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analiz sırasında hata oluştu: {str(e)}"
        )

# Eski JSON body desteği için alternatif endpoint
@app.post("/api/analyze/json", response_model=AnalyzeResponse)
async def analyze_data_json(request: AnalyzeRequest):
    """JSON body ile analiz (geriye uyumluluk için)"""
    return await analyze_data(
        question=request.question,
        table_name=getattr(request, 'table_name', None)
    )

# ========== DASHBOARD BUILDER ENDPOINTS ==========

@app.post("/api/dashboard/generate")
async def generate_dashboard(
    description: str = Form(...),
    table_name: Optional[str] = Form(None)
):
    """
    AI ile özel dashboard oluştur
    
    Kullanıcının doğal dildeki açıklamasına göre dashboard konfigürasyonu üretir.
    
    Örnek açıklamalar:
    - "Günlük satış trendi, kategorilere göre pasta grafiği ve toplam gelir göster"
    - "Aylık karşılaştırma, en çok satan ürünler ve tarih filtresi olsun"
    """
    from dashboard_builder import DashboardBuilder
    
    try:
        print(f"\n📊 Dashboard oluşturma isteği: {description[:50]}...")
        print(f"📋 Tablo: {table_name or 'Tüm tablolar'}")
        
        builder = DashboardBuilder(table_name=table_name)
        dashboard_config = builder.generate_dashboard(description)
        
        if "error" in dashboard_config and dashboard_config.get("widgets", []) == []:
            raise HTTPException(status_code=400, detail=dashboard_config["error"])
        
        return {
            "success": True,
            "dashboard": dashboard_config
        }
        
    except Exception as e:
        print(f"❌ Dashboard oluşturma hatası: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Dashboard oluşturulamadı: {str(e)}"
        )

@app.post("/api/dashboard/execute-widget")
async def execute_widget(
    sql: str = Form(...),
    widget_id: str = Form(...)
):
    """Widget için SQL sorgusunu çalıştır"""
    from dashboard_builder import DashboardBuilder
    
    try:
        builder = DashboardBuilder()
        data = builder.execute_widget_query(sql)
        
        return {
            "success": True,
            "widget_id": widget_id,
            "data": data,
            "row_count": len(data)
        }
        
    except Exception as e:
        print(f"❌ Widget sorgu hatası: {str(e)}")
        return {
            "success": False,
            "widget_id": widget_id,
            "data": [],
            "error": str(e)
        }

@app.post("/api/dashboard/execute-all")
async def execute_all_widgets(
    widgets: str = Form(...)  # JSON string of widgets array
):
    """Tüm widget'ların SQL sorgularını çalıştır"""
    from dashboard_builder import DashboardBuilder
    import json
    
    try:
        widgets_list = json.loads(widgets)
        builder = DashboardBuilder()
        
        results = {}
        for widget in widgets_list:
            widget_id = widget.get('id')
            sql = widget.get('sql')
            
            if widget_id and sql:
                try:
                    data = builder.execute_widget_query(sql)
                    results[widget_id] = {
                        "success": True,
                        "data": data,
                        "row_count": len(data)
                    }
                except Exception as e:
                    results[widget_id] = {
                        "success": False,
                        "data": [],
                        "error": str(e)
                    }
        
        return {
            "success": True,
            "results": results
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Geçersiz JSON formatı")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== TABLE BUILDER ENDPOINTS ==========

@app.post("/api/tables/create")
async def create_new_table(request: CreateTableRequest):
    """
    Create a new table from scratch
    
    Requires table name and column definitions.
    If no primary key is defined, id column will be auto-added.
    """
    columns = [col.model_dump() for col in request.columns]
    result = create_table(request.name, columns, request.add_auto_id)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Clear schema cache so AI can see the new table
    clear_schema_cache()
    return result


@app.post("/api/tables/create/preview")
async def preview_table_creation(request: CreateTableRequest):
    """
    Preview CREATE TABLE SQL without executing
    
    Returns the SQL statement that would be executed.
    """
    columns = [col.model_dump() for col in request.columns]
    result = preview_create_sql(request.name, columns, request.add_auto_id)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@app.put("/api/tables/{table_name}")
async def update_table_name(table_name: str, request: RenameTableRequest):
    """Rename a table"""
    result = rename_table(table_name, request.new_name)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Clear schema cache
    clear_schema_cache()
    return result


@app.post("/api/tables/{table_name}/truncate")
async def truncate_table_data(table_name: str):
    """Delete all rows from a table (keeps schema)"""
    result = truncate_table(table_name)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@app.get("/api/tables/{table_name}/metadata")
async def get_table_metadata_endpoint(table_name: str):
    """Get table metadata including columns"""
    metadata = get_table_metadata(table_name)
    
    if not metadata:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found or no metadata available")
    
    return {
        "success": True,
        "metadata": metadata
    }


@app.put("/api/tables/{table_name}/columns/{column_name}")
async def update_column(table_name: str, column_name: str, request: RenameColumnRequest):
    """Rename a column"""
    result = rename_column(table_name, column_name, request.new_name)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Clear schema cache
    clear_schema_cache()
    return result


@app.patch("/api/tables/{table_name}/columns/{column_name}/visibility")
async def toggle_column_visibility(table_name: str, column_name: str, request: ColumnVisibilityRequest):
    """Toggle column visibility (logical hide/show)"""
    try:
        update_column_visibility(table_name, column_name, request.is_visible)
        return {
            "success": True,
            "message": f"Column '{column_name}' visibility set to {request.is_visible}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/schema/changelog")
async def get_changelog(table_name: Optional[str] = None, limit: int = 50):
    """Get schema changelog entries"""
    changelog = get_schema_changelog(table_name, limit)
    return {
        "success": True,
        "changelog": changelog
    }


# ========== ROW CRUD ENDPOINTS ==========

@app.get("/api/tables/{table_name}/rows")
async def get_table_rows(
    table_name: str,
    page: int = 0,
    page_size: int = 50,
    sort_by: Optional[str] = None,
    sort_order: str = "asc",
    search: Optional[str] = None,
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Get paginated rows from a table with server-side sorting and searching

    SECURITY: Multi-tenant filtering - only returns rows belonging to current user

    Args:
        table_name: Name of the table
        page: Page number (0-indexed)
        page_size: Number of rows per page (max 100)
        sort_by: Column name to sort by
        sort_order: 'asc' or 'desc'
        search: Search term to filter across all text columns
        current_user_id: Authenticated user ID (injected by dependency)
    """
    from sqlalchemy import inspect
    from security import validate_table_access
    import re

    try:
        # SECURITY: Validate table access
        try:
            validate_table_access(table_name, current_user_id)
        except ValueError as e:
            raise HTTPException(status_code=403, detail=str(e))

        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        # Security: Validate table name exists
        if table_name not in table_names:
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
        
        # Get column info for validation
        columns_info = inspector.get_columns(table_name)
        valid_columns = [col["name"] for col in columns_info]
        
        # Validate sort_by column exists
        if sort_by and sort_by not in valid_columns and sort_by != "rowid":
            raise HTTPException(status_code=400, detail=f"Invalid sort column: {sort_by}")
        
        # Validate sort_order
        if sort_order.lower() not in ("asc", "desc"):
            sort_order = "asc"
        
        # Limit page_size for performance
        page_size = min(page_size, 100)
        offset = page * page_size
        
        with engine.connect() as conn:
            # Build WHERE clause for search + multi-tenant filtering
            where_conditions = []
            search_params = {}

            # SECURITY: Add user_id filter for multi-tenant isolation
            if 'user_id' in valid_columns:
                where_conditions.append("user_id = :current_user_id")
                search_params["current_user_id"] = current_user_id

            if search and search.strip():
                # Get text columns for searching
                text_columns = [col["name"] for col in columns_info
                               if "TEXT" in str(col["type"]).upper()
                               or "VARCHAR" in str(col["type"]).upper()
                               or "CHAR" in str(col["type"]).upper()]

                if text_columns:
                    search_conditions = []
                    for i, col in enumerate(text_columns):
                        param_name = f"search_{i}"
                        search_conditions.append(f"{col} LIKE :{param_name}")
                        search_params[param_name] = f"%{search}%"

                    # Wrap search conditions in parentheses
                    where_conditions.append("(" + " OR ".join(search_conditions) + ")")

            # Build final WHERE clause
            where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
            
            # Build ORDER BY clause
            order_clause = ""
            if sort_by:
                order_clause = f"ORDER BY {sort_by} {sort_order.upper()}"
            
            # Get total count (with search filter)
            count_sql = f"SELECT COUNT(*) FROM {table_name} {where_clause}"
            count_result = conn.execute(text(count_sql), search_params)
            total = count_result.scalar()
            
            # Get rows with pagination, sorting, and search
            data_sql = f"""
                SELECT rowid, * FROM {table_name} 
                {where_clause}
                {order_clause}
                LIMIT :limit OFFSET :offset
            """
            
            result = conn.execute(
                text(data_sql), 
                {**search_params, "limit": page_size, "offset": offset}
            )
            columns = list(result.keys())
            rows = [dict(zip(columns, row)) for row in result.fetchall()]
        
        return {
            "success": True,
            "data": rows,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 1,
            "sort_by": sort_by,
            "sort_order": sort_order,
            "search": search
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tables/{table_name}/rows")
async def insert_row(
    table_name: str,
    row_data: dict,
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Insert a new row into a table

    SECURITY: Automatically adds user_id to ensure multi-tenant isolation
    """
    from sqlalchemy import inspect
    from security import validate_table_access

    try:
        # SECURITY: Validate table access
        try:
            validate_table_access(table_name, current_user_id)
        except ValueError as e:
            raise HTTPException(status_code=403, detail=str(e))

        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")

        if not row_data:
            raise HTTPException(status_code=400, detail="Row data cannot be empty")

        # SECURITY: Automatically add user_id to new rows
        columns_info = inspector.get_columns(table_name)
        column_names = [col["name"] for col in columns_info]

        if 'user_id' in column_names:
            row_data['user_id'] = current_user_id

        columns = list(row_data.keys())
        placeholders = ", ".join([f":{col}" for col in columns])
        columns_str = ", ".join(columns)

        sql = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"

        with engine.connect() as conn:
            result = conn.execute(text(sql), row_data)
            conn.commit()
            new_rowid = result.lastrowid

        return {
            "success": True,
            "message": "Row inserted successfully",
            "rowid": new_rowid
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/tables/{table_name}/rows/{rowid}")
async def update_row(
    table_name: str,
    rowid: int,
    row_data: dict,
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Update an existing row

    SECURITY: Only allows updating rows owned by current user
    """
    from sqlalchemy import inspect
    from security import validate_table_access

    try:
        # SECURITY: Validate table access
        try:
            validate_table_access(table_name, current_user_id)
        except ValueError as e:
            raise HTTPException(status_code=403, detail=str(e))

        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")

        if not row_data:
            raise HTTPException(status_code=400, detail="Row data cannot be empty")

        # Remove rowid and user_id from data (prevent changing user_id!)
        row_data = {k: v for k, v in row_data.items() if k not in ('rowid', 'user_id')}

        # Get column info
        columns_info = inspector.get_columns(table_name)
        column_names = [col["name"] for col in columns_info]

        set_clause = ", ".join([f"{col} = :{col}" for col in row_data.keys()])

        # SECURITY: Add user_id filter to prevent updating other users' rows
        if 'user_id' in column_names:
            sql = f"UPDATE {table_name} SET {set_clause} WHERE rowid = :_rowid AND user_id = :_user_id"
            params = {**row_data, "_rowid": rowid, "_user_id": current_user_id}
        else:
            sql = f"UPDATE {table_name} SET {set_clause} WHERE rowid = :_rowid"
            params = {**row_data, "_rowid": rowid}

        with engine.connect() as conn:
            result = conn.execute(text(sql), params)
            conn.commit()

            if result.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail=f"Row with rowid {rowid} not found or you don't have permission to update it"
                )

        return {
            "success": True,
            "message": "Row updated successfully",
            "rowid": rowid
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/tables/{table_name}/rows/{rowid}")
async def delete_row(
    table_name: str,
    rowid: int,
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Delete a row from a table

    SECURITY: Only allows deleting rows owned by current user
    """
    from sqlalchemy import inspect
    from security import validate_table_access

    try:
        # SECURITY: Validate table access
        try:
            validate_table_access(table_name, current_user_id)
        except ValueError as e:
            raise HTTPException(status_code=403, detail=str(e))

        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")

        # Get column info
        columns_info = inspector.get_columns(table_name)
        column_names = [col["name"] for col in columns_info]

        # SECURITY: Add user_id filter to prevent deleting other users' rows
        if 'user_id' in column_names:
            sql = f"DELETE FROM {table_name} WHERE rowid = :rowid AND user_id = :user_id"
            params = {"rowid": rowid, "user_id": current_user_id}
        else:
            sql = f"DELETE FROM {table_name} WHERE rowid = :rowid"
            params = {"rowid": rowid}

        with engine.connect() as conn:
            result = conn.execute(text(sql), params)
            conn.commit()

            if result.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail=f"Row with rowid {rowid} not found or you don't have permission to delete it"
                )

        return {
            "success": True,
            "message": "Row deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    print("🚀 AI Veri Analizi API v2.0 başlatılıyor...")
    print("📍 http://localhost:8000")
    print("📚 Dokümantasyon: http://localhost:8000/docs")
    print("📊 Özellikler: Dinamik veri seti, CSV/Excel yükleme, AI Dashboard Builder, Table Builder")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

