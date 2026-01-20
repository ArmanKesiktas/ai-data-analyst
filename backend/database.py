from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, text, ForeignKey, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime, timedelta
import random
import secrets

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Veritabanı bağlantısı
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sales.db")
# SQLite için check_same_thread gerekli, PostgreSQL için değil
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Sale(Base):
    """Satış tablosu"""
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    sale_date = Column(Date, nullable=False)
    category = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    total_sale = Column(Float, nullable=False)


class User(Base):
    """Kullanıcı tablosu"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owned_workspaces = relationship("Workspace", back_populates="owner", foreign_keys="Workspace.owner_id")
    workspace_memberships = relationship("WorkspaceMember", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


class Workspace(Base):
    """Workspace tablosu - Multi-tenant workspace management"""
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    owner = relationship("User", back_populates="owned_workspaces", foreign_keys=[owner_id])
    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    invitations = relationship("WorkspaceInvitation", back_populates="workspace", cascade="all, delete-orphan")


class WorkspaceMember(Base):
    """Workspace üyeleri - Role-based access control"""
    __tablename__ = "workspace_members"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False, default="viewer")  # owner, editor, viewer
    joined_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", back_populates="workspace_memberships")


class WorkspaceInvitation(Base):
    """Workspace davetleri - Email-based invitations"""
    __tablename__ = "workspace_invitations"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    email = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False, default="viewer")
    token = Column(String, unique=True, nullable=False, index=True)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    accepted_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="invitations")

    @staticmethod
    def generate_token():
        """Generate a secure random invitation token"""
        return secrets.token_urlsafe(32)


class AuditLog(Base):
    """Audit logging - Track all user actions"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # upload, analyze, delete_table, etc.
    resource_type = Column(String, nullable=False)  # table, row, workspace, etc.
    resource_id = Column(String, nullable=True)  # table_name, row_id, etc.
    details = Column(Text, nullable=True)  # JSON string with additional details
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

def get_db():
    """Veritabanı session oluştur"""
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()

def create_tables():
    """Tabloları oluştur"""
    Base.metadata.create_all(bind=engine)
    print("✅ Veritabanı tabloları oluşturuldu")

def insert_sample_data():
    """Örnek veri ekle"""
    db = SessionLocal()

    # Önce mevcut verileri kontrol et
    existing_count = db.query(Sale).count()
    if existing_count > 0:
        print(f"⚠️  Veritabanında zaten {existing_count} kayıt var. Örnek veri eklenmedi.")
        db.close()
        return

    # Kategoriler ve ürünler
    products = {
        "Elektronik": [
            ("Laptop", 8000, 15000),
            ("Telefon", 5000, 12000),
            ("Kulaklık", 200, 1500),
            ("Tablet", 3000, 8000),
            ("Akıllı Saat", 1500, 5000),
            ("Klavye", 300, 1000),
            ("Mouse", 150, 500)
        ],
        "Giyim": [
            ("Tişört", 100, 300),
            ("Pantolon", 200, 600),
            ("Ayakkabı", 300, 1200),
            ("Mont", 500, 1500),
            ("Şapka", 50, 200),
            ("Çanta", 150, 800)
        ],
        "Gıda": [
            ("Çikolata", 20, 50),
            ("Kahve", 80, 200),
            ("Çay", 30, 100),
            ("Bisküvi", 15, 40),
            ("Şeker", 25, 60),
            ("Un", 30, 80)
        ],
        "Mobilya": [
            ("Sandalye", 500, 2000),
            ("Masa", 1000, 4000),
            ("Dolap", 2000, 8000),
            ("Koltuk", 3000, 10000),
            ("Yatak", 4000, 12000),
            ("Raf", 300, 1000)
        ]
    }

    # Son 12 ay için veri oluştur
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=365)

    sales_data = []
    current_date = start_date

    while current_date <= end_date:
        # Her gün için rastgele satışlar oluştur
        for category, product_list in products.items():
            # Her kategoriden rastgele 1-3 ürün sat
            num_products = random.randint(1, 3)
            selected_products = random.sample(product_list, num_products)

            for product_name, min_price, max_price in selected_products:
                quantity = random.randint(1, 10)
                price = random.uniform(min_price, max_price)
                total_sale = quantity * price

                sale = Sale(
                    sale_date=current_date,
                    category=category,
                    product_name=product_name,
                    quantity=quantity,
                    price=round(price, 2),
                    total_sale=round(total_sale, 2)
                )
                sales_data.append(sale)

        current_date += timedelta(days=1)

    # Toplu ekleme
    db.bulk_save_objects(sales_data)
    db.commit()

    print(f"✅ {len(sales_data)} adet örnek satış verisi eklendi")
    db.close()

def get_schema():
    """Veritabanı şemasını döndür"""
    return """
    Tablo: sales
    Kolonlar:
    - id (INTEGER PRIMARY KEY): Benzersiz satış kimliği
    - sale_date (DATE): Satış tarihi
    - category (VARCHAR): Ürün kategorisi (Elektronik, Giyim, Gıda, Mobilya)
    - product_name (VARCHAR): Ürün adı
    - quantity (INTEGER): Satılan miktar
    - price (DECIMAL): Birim fiyat
    - total_sale (DECIMAL): Toplam satış tutarı (quantity * price)
    """

if __name__ == "__main__":
    print("🔧 Veritabanı oluşturuluyor...")
    create_tables()
    insert_sample_data()
    print("🎉 Veritabanı hazır!")
