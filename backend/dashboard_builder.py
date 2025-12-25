"""
AI Dashboard Builder - Kullanıcının istediği dashboard'u oluşturur
"""
from google import genai
import os
import json
import re
from file_handler import get_dynamic_schema, get_table_preview

class DashboardBuilder:
    """AI destekli dashboard oluşturucu"""

    def __init__(self, table_name: str = None):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY bulunamadı!")

        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.0-flash'
        self.table_name = table_name
        self.db_schema = get_dynamic_schema(table_name)
        
        print(f"🔧 DashboardBuilder başlatıldı:")
        print(f"   📋 Tablo: {self.table_name}")
        print(f"   📊 Şema: {self.db_schema[:200]}...")
        
        # Örnek veri al
        try:
            self.sample_data = get_table_preview(table_name, limit=5) if table_name else []
            print(f"   📝 Örnek veri: {len(self.sample_data)} satır")
        except Exception as e:
            print(f"   ❌ Örnek veri hatası: {str(e)}")
            self.sample_data = []

    def _analyze_columns(self) -> dict:
        """Tablo kolonlarını analiz et - filtre oluşturmak için"""
        from sqlalchemy import create_engine, text, inspect
        import os
        
        column_info = {
            "date_columns": [],
            "categorical_columns": [],
            "numeric_columns": [],
            "text_columns": []
        }
        
        if not self.table_name:
            return column_info
        
        DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sales.db")
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
        
        try:
            inspector = inspect(engine)
            columns = inspector.get_columns(self.table_name)
            
            with engine.connect() as conn:
                for col in columns:
                    col_name = col['name']
                    col_type = str(col['type']).upper()
                    
                    # Unique değer sayısını kontrol et
                    result = conn.execute(text(f"SELECT COUNT(DISTINCT {col_name}) FROM {self.table_name}"))
                    unique_count = result.scalar()
                    
                    # Örnek değerler
                    sample_result = conn.execute(text(f"SELECT DISTINCT {col_name} FROM {self.table_name} LIMIT 10"))
                    sample_values = [str(row[0]) for row in sample_result.fetchall() if row[0] is not None]
                    
                    if 'DATE' in col_type or 'TIME' in col_type or any(kw in col_name.lower() for kw in ['date', 'time', 'tarih', 'zaman']):
                        column_info["date_columns"].append({
                            "name": col_name,
                            "type": "date"
                        })
                    elif 'INT' in col_type or 'REAL' in col_type or 'FLOAT' in col_type or 'NUMERIC' in col_type:
                        column_info["numeric_columns"].append({
                            "name": col_name,
                            "type": "numeric"
                        })
                    elif unique_count <= 20:
                        # Az sayıda unique değer = kategorik
                        column_info["categorical_columns"].append({
                            "name": col_name,
                            "unique_count": unique_count,
                            "sample_values": sample_values[:5]
                        })
                    else:
                        column_info["text_columns"].append({
                            "name": col_name,
                            "unique_count": unique_count
                        })
        except Exception as e:
            print(f"Kolon analizi hatası: {str(e)}")
        
        return column_info

    def generate_dashboard(self, user_request: str) -> dict:
        """
        Kullanıcının isteğine göre dashboard konfigürasyonu oluştur
        
        Args:
            user_request: Kullanıcının dashboard açıklaması
            Örnek: "Günlük satış trendi, kategorilere göre pasta grafiği, 
                    aylık karşılaştırma ve tarih filtresi olsun"
        
        Returns:
            Dashboard konfigürasyonu (widgets, filters, layout)
        """
        
        # Kolon tiplerini analiz et
        column_types = self._analyze_columns()
        
        prompt = f"""Sen bir veri analisti ve dashboard tasarımcısısın. 
Kullanıcının istediği dashboard'u oluştur.

VERİTABANI ŞEMASI:
{self.db_schema}

KOLON ANALİZİ:
{json.dumps(column_types, ensure_ascii=False)}

ÖRNEK VERİLER:
{json.dumps(self.sample_data[:3], ensure_ascii=False, default=str)}

KULLANICI İSTEĞİ:
{user_request}

GÖREVİN:
1. Kullanıcının istediği dashboard için widget'ları oluştur
2. TABLO KOLONLARINA GÖRE UYGUN FİLTRELER OLUŞTUR:
   - Tarih kolonları için date_range filtresi
   - Kategorik kolonlar (az sayıda unique değer) için select filtresi
   - Diğer metin kolonları için multi_select filtresi

WIDGET TÜRLERİ:
- kpi: Tek sayısal değer gösterimi (toplam, ortalama vb.)
- bar_chart: Çubuk grafik (kategori bazlı karşılaştırma)
- line_chart: Çizgi grafik (zaman serisi, trend)
- pie_chart: Pasta grafik (dağılım, yüzde)
- area_chart: Alan grafiği (trend)
- table: Veri tablosu

FİLTRE TÜRLERİ:
- date_range: Tarih aralığı seçici (tarih kolonları için)
- select: Dropdown seçici (kategorik kolonlar için)
- multi_select: Çoklu seçim (metin kolonları için)

WIDGET BOYUTLARI (grid sisteminde):
- small: 1 kolon genişliği
- medium: 2 kolon genişliği  
- large: 2 kolon genişliği, 2 satır yüksekliği
- full: 4 kolon genişliği (tam satır)

ÇIKTI FORMATI (sadece JSON, başka hiçbir şey yazma):
{{
  "title": "Dashboard başlığı",
  "description": "Kısa açıklama",
  "filters": [
    {{
      "id": "filter_1",
      "type": "date_range|select|multi_select",
      "label": "Filtre etiketi",
      "column": "kolon_adi",
      "options": ["değer1", "değer2"] // select/multi_select için
    }}
  ],
  "widgets": [
    {{
      "id": "widget_1",
      "title": "Widget başlığı",
      "type": "kpi|bar_chart|line_chart|pie_chart|area_chart|table",
      "size": "small|medium|large|full",
      "sql": "SELECT ... FROM {self.table_name} (SQLite formatında)",
      "x_axis": "x ekseni kolonu (grafik için)",
      "y_axis": "y ekseni kolonu (grafik için)",
      "color": "blue|green|purple|orange",
      "gridPosition": {{"x": 0, "y": 0, "w": 2, "h": 1}}
    }}
  ],
  "layout": "grid"
}}

KURALLAR:
1. SQL sorgularında sadece SELECT kullan
2. Tablo adı: {self.table_name}
3. SQLite sözdizimi kullan
4. Her widget için gerçekçi SQL sorgusu yaz
5. Sadece JSON döndür, açıklama ekleme
6. Kullanıcının istediği HER öğeyi dahil et
7. Filtreleri tablodaki kolonlara göre otomatik oluştur
8. gridPosition'ları widget'ları mantıklı yerleştirmek için kullan (x: 0-3, y: 0+, w: 1-4, h: 1-2)

JSON:"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            
            result_text = response.text.strip()
            
            # JSON'u parse et
            # Markdown bloklarını temizle
            result_text = re.sub(r'```json\s*', '', result_text)
            result_text = re.sub(r'```\s*', '', result_text)
            result_text = result_text.strip()
            
            # JSON parse
            dashboard_config = json.loads(result_text)
            
            # Her widget için SQL'i doğrula ve temizle
            for widget in dashboard_config.get('widgets', []):
                sql = widget.get('sql', '')
                # SELECT'ten önceki her şeyi kaldır
                select_match = re.search(r'\bSELECT\b', sql, re.IGNORECASE)
                if select_match:
                    sql = sql[select_match.start():]
                # Noktalı virgül ekle
                if not sql.endswith(';'):
                    sql += ';'
                widget['sql'] = sql
            
            print(f"✅ Dashboard oluşturuldu: {dashboard_config.get('title', 'Untitled')}")
            print(f"   - {len(dashboard_config.get('widgets', []))} widget")
            print(f"   - {len(dashboard_config.get('filters', []))} filtre")
            
            return dashboard_config
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse hatası: {str(e)}")
            print(f"   Raw response: {result_text[:200]}...")
            return {
                "error": "Dashboard oluşturulamadı. Lütfen daha açık bir şekilde tarif edin.",
                "title": "Hata",
                "widgets": [],
                "filters": []
            }
        except Exception as e:
            print(f"❌ Dashboard oluşturma hatası: {str(e)}")
            return {
                "error": str(e),
                "title": "Hata",
                "widgets": [],
                "filters": []
            }

    def execute_widget_query(self, sql: str) -> list:
        """Widget için SQL sorgusunu çalıştır"""
        from query_executor import QueryExecutor
        import re
        
        try:
            # SQL'i temizle
            sql = sql.strip()
            
            # Markdown bloklarını temizle
            sql = re.sub(r'```(?:sql|sqlite)?\s*', '', sql)
            sql = re.sub(r'```\s*', '', sql)
            
            # SELECT'ten önceki her şeyi kaldır
            select_match = re.search(r'\bSELECT\b', sql, re.IGNORECASE)
            if select_match:
                sql = sql[select_match.start():]
            
            # Noktalı virgülden sonrasını kaldır
            if ';' in sql:
                sql = sql[:sql.index(';') + 1]
            else:
                sql += ';'
            
            print(f"📊 Widget sorgusu: {sql[:100]}...")
            
            with QueryExecutor() as executor:
                df = executor.execute_query(sql)
                result = df.to_dict('records')
                print(f"   ✅ {len(result)} satır döndü")
                return result
                
        except Exception as e:
            print(f"❌ Widget sorgu hatası: {str(e)}")
            print(f"   SQL: {sql[:200]}")
            return []

