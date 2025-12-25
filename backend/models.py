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

