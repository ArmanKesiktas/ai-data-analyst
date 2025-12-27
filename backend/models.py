from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class AnalyzeRequest(BaseModel):
    """Kullanıcı sorusu için request modeli"""
    question: str
    table_name: Optional[str] = None

class KPIData(BaseModel):
    """KPI verilerini tutan model"""
    toplam_gelir: Optional[float] = None
    ortalama_satis: Optional[float] = None
    toplam_adet: Optional[int] = None
    kategori_sayisi: Optional[int] = None
    tarih_araligi: Optional[str] = None
    buyume_orani: Optional[float] = None

class ChartConfig(BaseModel):
    """Grafik konfigürasyonu"""
    type: str  # bar, line, pie
    x_axis: str
    y_axis: str

class AnalyzeResponse(BaseModel):
    """Analiz sonucu response modeli"""
    success: bool
    sql: Optional[str] = None
    data: List[Dict[str, Any]] = []
    kpis: Optional[Dict[str, Any]] = None
    explanation: Optional[str] = None
    chart_config: Optional[ChartConfig] = None
    error: Optional[str] = None


# ========== AUTH MODELS ==========

class UserCreate(BaseModel):
    """Kullanıcı kayıt modeli"""
    email: str
    password: str
    full_name: str


class UserLogin(BaseModel):
    """Kullanıcı giriş modeli"""
    email: str
    password: str


class UserResponse(BaseModel):
    """Kullanıcı response modeli (password hariç)"""
    id: int
    email: str
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """JWT token response modeli"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ========== WORKSPACE MODELS ==========

class WorkspaceCreate(BaseModel):
    """Workspace oluşturma modeli"""
    name: str
    description: Optional[str] = None


class WorkspaceUpdate(BaseModel):
    """Workspace güncelleme modeli"""
    name: Optional[str] = None
    description: Optional[str] = None


class WorkspaceResponse(BaseModel):
    """Workspace response modeli"""
    id: int
    name: str
    description: Optional[str]
    role: str
    is_owner: bool
    member_count: int
    created_at: str
    updated_at: str


class WorkspaceMemberResponse(BaseModel):
    """Workspace üye response modeli"""
    id: int
    user_id: int
    email: str
    full_name: str
    role: str
    joined_at: str


class WorkspaceInviteCreate(BaseModel):
    """Workspace davet oluşturma modeli"""
    email: str
    role: str = "viewer"


class WorkspaceInvitationResponse(BaseModel):
    """Workspace davet response modeli"""
    id: int
    email: str
    role: str
    invited_by: str
    created_at: str
    expires_at: str


class AcceptInvitationRequest(BaseModel):
    """Davet kabul etme modeli"""
    token: str


# ========== DATA CLEANING MODELS ==========

class DataCleaningOptions(BaseModel):
    """Veri temizleme seçenekleri"""
    remove_duplicates: bool = False
    fill_missing: bool = False
    fill_method: Optional[str] = None  # mean, median, forward, drop
    remove_outliers: bool = False
    normalize_text: bool = False
    convert_dates: bool = False
    date_columns: Optional[List[str]] = None


class DataCleaningRequest(BaseModel):
    """Veri temizleme request modeli"""
    table_name: str
    options: DataCleaningOptions


class DataCleaningResponse(BaseModel):
    """Veri temizleme response modeli"""
    success: bool
    table_name: str
    rows_before: int
    rows_after: int
    changes: Dict[str, Any]
    message: str

