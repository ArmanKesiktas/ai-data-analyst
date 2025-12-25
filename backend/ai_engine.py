from google import genai
import os
from functools import lru_cache
from file_handler import get_dynamic_schema

# Cache for schema - avoids repeated database calls
@lru_cache(maxsize=50)
def get_cached_schema(table_name: str) -> str:
    """
    Get schema with caching.
    Cache remains valid until explicitly cleared.
    """
    return get_dynamic_schema(table_name)

def clear_schema_cache():
    """Clear schema cache - call when schema changes"""
    get_cached_schema.cache_clear()

class AIEngine:
    """Google Gemini API destekli AI motoru - Dinamik şema desteği"""

    def __init__(self, table_name: str = None):
        """
        AI motorunu başlat
        
        Args:
            table_name: Analiz edilecek tablo adı (None ise tüm tablolar)
        """
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable bulunamadı!")

        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.0-flash'
        self.table_name = table_name
        # Use cached schema for better performance
        self.db_schema = get_cached_schema(table_name or "__all__")

    def generate_sql(self, user_question: str) -> str:
        """
        Kullanıcı sorusunu SQL sorgusuna çevir

        Args:
            user_question: Kullanıcının doğal dildeki sorusu

        Returns:
            SQL sorgusu string olarak
        """
        prompt = f"""Sen bir SQL uzmanısın. Kullanıcının sorusunu SQL sorgusuna çevir.

VERİTABANI ŞEMASI:
{self.db_schema}

KURALLAR:
- SADECE SQL sorgusu üret, başka hiçbir şey yazma
- Yorum veya açıklama ekleme
- SELECT 'INSUFFICIENT_DATA' as error; döndür eğer şemada yeterli bilgi yoksa
- Tehlikeli komutları (DROP, DELETE, UPDATE, INSERT, ALTER, CREATE) ASLA kullanma
- Şemadaki kolon isimlerini AYNEN kullan
- Tablo adını şemadan al ve AYNEN kullan
- Toplam hesaplamalar için SUM() kullan
- Ortalama için AVG() kullan
- Kategori/grup bazlı veriler için GROUP BY kullan
- Sıralama için ORDER BY kullan
- Sadece SELECT sorguları yaz
- SQLite sözdizimi kullan

ÖNEMLİ: Şemadaki örnek verilere bakarak veri tiplerini ve değerleri anla.

KULLANICI SORUSU:
{user_question}

SQL SORGUSU:"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            sql_query = response.text.strip()

            # Güvenlik kontrolü - tehlikeli komutları engelle
            dangerous_keywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC']
            sql_upper = sql_query.upper()

            for keyword in dangerous_keywords:
                if keyword in sql_upper:
                    print(f"⚠️  Tehlikeli komut tespit edildi: {keyword}")
                    return None

            # Markdown kod bloklarını temizle - tüm varyasyonları
            import re
            # ```sql, ```sqlite, ```SQL vb. formatlarını temizle
            sql_query = re.sub(r'```\w*\s*', '', sql_query)
            sql_query = sql_query.replace('```', '').strip()
            
            # SELECT'ten önceki her şeyi kaldır (bazen AI ön açıklama ekliyor)
            select_match = re.search(r'\bSELECT\b', sql_query, re.IGNORECASE)
            if select_match:
                sql_query = sql_query[select_match.start():]
            
            # Satır sonu ve fazla boşlukları temizle
            sql_query = ' '.join(sql_query.split())

            # Noktalı virgül ekle eğer yoksa
            if not sql_query.endswith(';'):
                sql_query += ';'

            print(f"✅ SQL oluşturuldu: {sql_query[:100]}...")
            return sql_query

        except Exception as e:
            print(f"❌ SQL üretme hatası: {str(e)}")
            return None

    def explain_results(self, question: str, query: str, results: list, kpis: dict) -> str:
        """
        Analiz sonuçlarını Türkçe açıkla

        Args:
            question: Kullanıcının sorusu
            query: Çalıştırılan SQL sorgusu
            results: Sorgu sonuçları (ilk 5 satır)
            kpis: Hesaplanan KPI'lar

        Returns:
            Türkçe açıklama metni
        """
        # Sonuçları string'e çevir (çok uzunsa kısalt)
        results_str = str(results[:5]) if len(results) > 5 else str(results)
        if len(results_str) > 500:
            results_str = results_str[:500] + "..."

        prompt = f"""Sen bir veri analisti gibi sonuçları açıkla.

KULLANICI SORUSU: {question}

SQL SORGUSU: {query}

SONUÇLAR: {results_str}

KPI'LAR: {kpis}

GÖREVİN:
- Türkçe, anlaşılır ve iş odaklı bir açıklama yap
- Sayıları önemse ve vurgula
- İstatistiksel bilgiler ver
- Kısa ve net cümleler kullan (maksimum 3-4 cümle)
- Trend ve insight'ları belirt
- Emoji kullanma, sadece düz metin
- Kolon isimlerini doğal Türkçe'ye çevirerek kullan

ŞİMDİ AÇIKLA:"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            explanation = response.text.strip()

            # Emoji varsa temizle
            explanation = explanation.replace('📊', '').replace('📈', '').replace('💰', '').replace('✅', '').replace('🎯', '')

            print(f"✅ Açıklama oluşturuldu: {explanation[:100]}...")
            return explanation

        except Exception as e:
            print(f"❌ Açıklama üretme hatası: {str(e)}")
            return "Sonuçlar başarıyla alındı ancak açıklama oluşturulamadı."

    def determine_chart_type(self, data: list, sql_query: str) -> dict:
        """
        Veri tipine göre otomatik grafik türü belirle

        Args:
            data: Sorgu sonuçları
            sql_query: SQL sorgusu

        Returns:
            Chart configuration dict
        """
        if not data or len(data) == 0:
            return None

        # İlk satırdaki kolonları kontrol et
        first_row = data[0]
        columns = list(first_row.keys())
        
        # Sayısal kolonları bul
        numeric_cols = []
        string_cols = []
        date_cols = []
        
        for col in columns:
            value = first_row[col]
            col_lower = col.lower()
            
            if 'date' in col_lower or 'tarih' in col_lower:
                date_cols.append(col)
            elif isinstance(value, (int, float)):
                numeric_cols.append(col)
            else:
                string_cols.append(col)

        # Eğer tarih kolonu varsa -> Line Chart
        if date_cols:
            y_col = numeric_cols[0] if numeric_cols else columns[-1]
            return {
                "type": "line",
                "x_axis": date_cols[0],
                "y_axis": y_col
            }

        # Eğer az sayıda satır ve kategorik veri varsa -> Pie Chart
        if len(data) <= 6 and string_cols and numeric_cols:
            return {
                "type": "pie",
                "x_axis": string_cols[0],
                "y_axis": numeric_cols[0]
            }

        # Kategorik ve sayısal veri varsa -> Bar Chart
        if string_cols and numeric_cols:
            return {
                "type": "bar",
                "x_axis": string_cols[0],
                "y_axis": numeric_cols[0]
            }

        # Default: İlk ve son kolon ile bar chart
        return {
            "type": "bar",
            "x_axis": columns[0],
            "y_axis": columns[-1] if len(columns) > 1 else columns[0]
        }
