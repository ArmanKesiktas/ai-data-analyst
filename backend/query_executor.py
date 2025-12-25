import pandas as pd
from sqlalchemy import text
from database import SessionLocal

class QueryExecutor:
    """SQL sorguları çalıştıran sınıf"""

    def __init__(self):
        """Query executor başlat"""
        self.db = SessionLocal()

    def execute_query(self, sql_query: str) -> pd.DataFrame:
        """
        SQL sorgusunu çalıştır ve sonuçları DataFrame olarak döndür

        Args:
            sql_query: Çalıştırılacak SQL sorgusu

        Returns:
            Pandas DataFrame
        """
        try:
            # SQL injection koruması - zaten AI Engine'de yapıldı ama ekstra kontrol
            dangerous_keywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE']
            sql_upper = sql_query.upper()

            for keyword in dangerous_keywords:
                if keyword in sql_upper:
                    raise ValueError(f"Tehlikeli SQL komutu tespit edildi: {keyword}")

            # Sorguyu çalıştır
            result = self.db.execute(text(sql_query))

            # Sonuçları DataFrame'e çevir
            rows = result.fetchall()
            if not rows:
                return pd.DataFrame()

            # Kolon isimlerini al
            columns = result.keys()

            # DataFrame oluştur
            df = pd.DataFrame(rows, columns=columns)

            print(f"✅ Sorgu başarıyla çalıştırıldı: {len(df)} satır döndü")
            return df

        except Exception as e:
            print(f"❌ Sorgu çalıştırma hatası: {str(e)}")
            raise e

    def close(self):
        """Veritabanı bağlantısını kapat"""
        self.db.close()

    def __enter__(self):
        """Context manager enter"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()
