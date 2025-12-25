"""
Dosya yükleme ve işleme modülü
CSV ve Excel dosyalarını parse edip SQLite'a dinamik tablo olarak kaydeder
"""
import pandas as pd
import os
import re
from sqlalchemy import create_engine, text, inspect
from datetime import datetime
import uuid

# Maksimum dosya boyutu (50 MB)
MAX_FILE_SIZE = 50 * 1024 * 1024

# Desteklenen dosya formatları
ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls'}

# Veritabanı bağlantısı
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sales.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})


def sanitize_table_name(name: str) -> str:
    """Tablo adını güvenli hale getir"""
    # Dosya uzantısını kaldır
    name = os.path.splitext(name)[0]
    # Sadece alfanumerik ve alt çizgi bırak
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    # Sayı ile başlıyorsa prefix ekle
    if name[0].isdigit():
        name = 't_' + name
    # Küçük harfe çevir
    name = name.lower()
    # Maksimum uzunluk
    if len(name) > 50:
        name = name[:50]
    return name


def detect_column_types(df: pd.DataFrame) -> dict:
    """DataFrame kolonlarının tiplerini algıla"""
    column_info = {}
    
    for col in df.columns:
        dtype = df[col].dtype
        sample_values = df[col].dropna().head(5).tolist()
        
        if pd.api.types.is_integer_dtype(dtype):
            sql_type = "INTEGER"
        elif pd.api.types.is_float_dtype(dtype):
            sql_type = "REAL"
        elif pd.api.types.is_datetime64_any_dtype(dtype):
            sql_type = "DATE"
        elif pd.api.types.is_bool_dtype(dtype):
            sql_type = "BOOLEAN"
        else:
            sql_type = "TEXT"
        
        column_info[col] = {
            "type": sql_type,
            "sample_values": sample_values[:3]
        }
    
    return column_info


def upload_file(file_path: str, original_filename: str) -> dict:
    """
    Dosyayı yükle ve veritabanına kaydet
    
    Args:
        file_path: Geçici dosya yolu
        original_filename: Orijinal dosya adı
    
    Returns:
        Yükleme sonucu bilgileri
    """
    # Dosya boyutu kontrolü
    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE:
        raise ValueError(f"Dosya boyutu çok büyük. Maksimum: {MAX_FILE_SIZE // (1024*1024)} MB")
    
    # Dosya uzantısı kontrolü
    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Desteklenmeyen dosya formatı. İzin verilen: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Dosyayı oku - otomatik ayraç algılama ile
    df = None
    
    if ext == '.csv':
        import csv
        
        # Önce dosya içeriğine bakarak ayracı belirlemeye çalış
        detected_sep = None
        detected_encoding = None
        
        encodings = ['utf-8', 'latin-1', 'iso-8859-9', 'cp1254', 'utf-8-sig', 'utf-16']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    sample = f.read(4096)
                    
                # Python csv.Sniffer kullan
                try:
                    dialect = csv.Sniffer().sniff(sample, delimiters=',;\t|')
                    detected_sep = dialect.delimiter
                    detected_encoding = encoding
                    print(f"🔍 Sniffer tespit etti: encoding={encoding}, sep='{detected_sep}'")
                    break
                except csv.Error:
                    # Sniffer başarısız oldu, manuel kontrol yap
                    # İlk satırdaki ayraç sayısını say
                    first_line = sample.split('\n')[0] if '\n' in sample else sample
                    sep_counts = {
                        ',': first_line.count(','),
                        ';': first_line.count(';'),
                        '\t': first_line.count('\t'),
                        '|': first_line.count('|')
                    }
                    # En çok kullanılan ayracı seç (en az 1 olmalı)
                    best_sep = max(sep_counts, key=sep_counts.get)
                    if sep_counts[best_sep] >= 1:
                        detected_sep = best_sep
                        detected_encoding = encoding
                        print(f"🔍 Manuel tespit: encoding={encoding}, sep='{detected_sep}' (count={sep_counts[best_sep]})")
                        break
            except UnicodeDecodeError:
                continue
            except Exception as e:
                print(f"⚠️ Encoding {encoding} hatası: {str(e)}")
                continue
        
        # Tespit edilen ayraç ile oku
        if detected_sep and detected_encoding:
            try:
                df = pd.read_csv(file_path, encoding=detected_encoding, sep=detected_sep)
                print(f"✅ CSV okundu: {len(df.columns)} kolon, {len(df)} satır")
            except Exception as e:
                print(f"❌ Tespit edilen ayraçla okuma başarısız: {str(e)}")
                df = None
        
        # Hala okuyamadıysak farklı kombinasyonları dene
        if df is None or len(df.columns) < 2:
            separators = [',', ';', '\t', '|']
            for encoding in encodings:
                if df is not None and len(df.columns) >= 2:
                    break
                for sep in separators:
                    try:
                        test_df = pd.read_csv(file_path, encoding=encoding, sep=sep, nrows=5)
                        if len(test_df.columns) >= 2:
                            df = pd.read_csv(file_path, encoding=encoding, sep=sep)
                            print(f"✅ CSV okundu (fallback): encoding={encoding}, sep='{sep}'")
                            break
                    except:
                        continue
        
        # Son çare: Python engine ile otomatik algılama
        if df is None or len(df.columns) < 2:
            try:
                df = pd.read_csv(file_path, encoding='utf-8', sep=None, engine='python')
                print("✅ CSV okundu: Python engine otomatik algılama")
            except Exception as e:
                raise ValueError(f"CSV dosyası okunamadı. Hata: {str(e)}")
    else:
        # Excel dosyası
        try:
            df = pd.read_excel(file_path)
        except Exception as e:
            raise ValueError(f"Excel dosyası okunamadı: {str(e)}")
    
    # Boş dosya kontrolü
    if df.empty:
        raise ValueError("Dosya boş veya veri içermiyor")
    
    # Kolon sayısı kontrolü
    if len(df.columns) < 2:
        raise ValueError(f"CSV doğru ayrıştırılamadı. Sadece {len(df.columns)} kolon algılandı. Lütfen dosya formatını kontrol edin.")
    
    # Kolon isimlerini temizle
    df.columns = [re.sub(r'[^a-zA-Z0-9_]', '_', str(col)).lower() for col in df.columns]
    
    # Benzersiz tablo adı oluştur
    base_name = sanitize_table_name(original_filename)
    table_name = f"{base_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Kolon tiplerini algıla
    column_info = detect_column_types(df)
    
    # Veritabanına kaydet
    df.to_sql(table_name, engine, if_exists='replace', index=False)
    
    return {
        "success": True,
        "table_name": table_name,
        "original_filename": original_filename,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": column_info,
        "file_size": file_size,
        "created_at": datetime.now().isoformat()
    }


def get_all_tables() -> list:
    """List all tables in the database (excluding system tables)"""
    inspector = inspect(engine)
    tables = []
    
    # System tables to hide from users
    SYSTEM_TABLES = {
        'users',  # Authentication table
        '_column_metadata',
        '_table_metadata', 
        '_schema',
        '_migrations',
        'sqlite_sequence',
        'alembic_version',
    }
    
    for table_name in inspector.get_table_names():
        # Skip system tables (exact match or prefix match)
        if table_name in SYSTEM_TABLES or table_name.startswith('_'):
            continue
            
        columns = inspector.get_columns(table_name)
        
        # Get row count
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            row_count = result.scalar()
        
        tables.append({
            "name": table_name,
            "columns": [{"name": col["name"], "type": str(col["type"])} for col in columns],
            "row_count": row_count
        })
    
    return tables


def get_table_schema(table_name: str) -> str:
    """Belirli bir tablonun şemasını döndür"""
    inspector = inspect(engine)
    
    if table_name not in inspector.get_table_names():
        raise ValueError(f"Tablo bulunamadı: {table_name}")
    
    columns = inspector.get_columns(table_name)
    
    # Örnek verileri al
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT * FROM {table_name} LIMIT 3"))
        sample_rows = result.fetchall()
        column_names = result.keys()
    
    # Şema metnini oluştur
    schema_text = f"Tablo: {table_name}\n"
    schema_text += "Kolonlar:\n"
    
    for col in columns:
        schema_text += f"  - {col['name']} ({col['type']})\n"
    
    # Örnek veriler ekle
    if sample_rows:
        schema_text += "\nÖrnek Veriler (ilk 3 satır):\n"
        for row in sample_rows:
            row_dict = dict(zip(column_names, row))
            schema_text += f"  {row_dict}\n"
    
    return schema_text


def get_dynamic_schema(table_name: str = None) -> str:
    """Dinamik şema döndür - belirtilen tablo veya tüm tablolar"""
    inspector = inspect(engine)
    all_tables = inspector.get_table_names()
    
    if table_name and table_name in all_tables:
        return get_table_schema(table_name)
    
    # Tüm tabloların şemasını döndür
    schema_parts = []
    for tbl in all_tables:
        schema_parts.append(get_table_schema(tbl))
    
    return "\n---\n".join(schema_parts)


def delete_table(table_name: str) -> bool:
    """Tabloyu sil"""
    # sales tablosunu silmeye izin verme
    if table_name == "sales":
        raise ValueError("Demo 'sales' tablosu silinemez")
    
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        raise ValueError(f"Tablo bulunamadı: {table_name}")
    
    with engine.connect() as conn:
        conn.execute(text(f"DROP TABLE IF EXISTS {table_name}"))
        conn.commit()
    
    return True


def get_table_preview(table_name: str, limit: int = 10) -> list:
    """Tablo önizlemesi döndür"""
    inspector = inspect(engine)
    
    if table_name not in inspector.get_table_names():
        raise ValueError(f"Tablo bulunamadı: {table_name}")
    
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT * FROM {table_name} LIMIT {limit}"))
        rows = result.fetchall()
        columns = result.keys()
    
    return [dict(zip(columns, row)) for row in rows]
