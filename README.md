# AI Veri Analizi ve Karar Destek Sistemi

Google Gemini API destekli yapay zeka tabanlı veri analizi platformu. Kullanıcılar doğal dilde soru sorar, sistem otomatik olarak SQL sorgusu oluşturur, veritabanında çalıştırır, KPI'ları hesaplar ve sonuçları görselleştirir.

## Özellikler

- **Doğal Dil İşleme**: Türkçe sorularınızı anlayıp SQL'e çevirir
- **Otomatik SQL Üretimi**: Google Gemini AI ile güvenli SQL sorguları
- **KPI Hesaplama**: Toplam gelir, ortalama satış, büyüme oranı gibi metrikleri otomatik hesaplar
- **Grafik ve Dashboard**: Bar, line ve pie chart ile görselleştirme
- **Türkçe Açıklamalar**: AI, sonuçları iş diliyle açıklar
- **Güvenlik**: SQL injection koruması, sadece SELECT sorgularına izin

## Teknoloji Stack

### Backend
- **Python 3.8+**
- **FastAPI**: Modern, hızlı web framework
- **Google Gemini API**: AI destekli SQL üretimi ve açıklama
- **SQLAlchemy**: ORM ve veritabanı yönetimi
- **Pandas**: Veri analizi
- **SQLite**: Geliştirme veritabanı

### Frontend
- **React.js 18**: Modern UI framework
- **Vite**: Hızlı build tool
- **Tailwind CSS**: Utility-first CSS
- **Recharts**: Grafik kütüphanesi
- **Axios**: HTTP client
- **Lucide React**: İkonlar

## Kurulum

### 1. Gereksinimler

- Python 3.8+
- Node.js 16+
- Google Gemini API Key ([Buradan alın](https://makersuite.google.com/app/apikey))

### 2. Projeyi İndirin

```bash
cd ai-data-analyst
```

### 3. Backend Kurulumu

```bash
cd backend

# Sanal ortam oluştur (opsiyonel ama önerilir)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Bağımlılıkları yükle
pip install -r requirements.txt

# .env dosyası oluştur
cp ../.env.example .env

# .env dosyasını düzenleyip Gemini API key'inizi ekleyin
# GEMINI_API_KEY=your_actual_api_key_here

# Veritabanı ve örnek veriyi oluştur
python database.py
```

### 4. Frontend Kurulumu

```bash
cd ../frontend

# Bağımlılıkları yükle
npm install
```

### 5. Uygulamayı Çalıştırın

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
# Veya: uvicorn main:app --reload
```

Backend http://localhost:8000 adresinde çalışacak.

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend http://localhost:5173 adresinde açılacak.

## Kullanım

1. Tarayıcınızda http://localhost:5173 adresini açın
2. Soru kutusuna doğal dilde sorunuzu yazın
3. "Gönder" butonuna tıklayın veya Enter tuşuna basın
4. AI sorunuzu analiz edecek ve:
   - SQL sorgusu oluşturacak
   - Veritabanında çalıştıracak
   - KPI'ları hesaplayacak
   - Grafik oluşturacak
   - Sonuçları açıklayacak

### Örnek Sorular

- "Son 6 ayda en çok gelir getiren kategori hangisi?"
- "Bu yıl kaç adet ürün satıldı?"
- "Geçen aya göre bu ay satışlar ne kadar arttı?"
- "En pahalı 5 ürün nedir?"
- "Gıda kategorisinde ortalama satış değeri nedir?"
- "Elektronik ve giyim kategorilerini karşılaştır"
- "Son 3 ayda hangi ürün en çok satıldı?"

## Gemini API Key Nasıl Alınır?

1. https://makersuite.google.com/app/apikey adresine gidin
2. Google hesabınızla giriş yapın
3. "Create API Key" butonuna tıklayın
4. Oluşturulan API key'i kopyalayın
5. Backend dizinindeki `.env` dosyasına ekleyin:
   ```
   GEMINI_API_KEY=AIza...your_key_here
   ```

## Proje Yapısı

```
ai-data-analyst/
├── backend/
│   ├── main.py                 # FastAPI ana dosya
│   ├── ai_engine.py            # Gemini API entegrasyonu
│   ├── database.py             # Veritabanı yönetimi
│   ├── query_executor.py       # SQL çalıştırma
│   ├── kpi_calculator.py       # KPI hesaplamaları
│   ├── models.py               # Pydantic modeller
│   ├── sample_data.sql         # Örnek SQL sorguları
│   ├── requirements.txt        # Python bağımlılıkları
│   └── sales.db                # SQLite veritabanı (otomatik oluşur)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx      # Soru arayüzü
│   │   │   ├── KPICards.jsx           # KPI kartları
│   │   │   ├── ChartDisplay.jsx       # Grafik gösterimi
│   │   │   └── SQLViewer.jsx          # SQL görüntüleyici
│   │   ├── App.jsx                    # Ana component
│   │   ├── main.jsx                   # React entry point
│   │   └── index.css                  # Global stiller
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── .env.example                # Örnek environment dosyası
├── .gitignore
└── README.md
```

## API Endpoints

### GET /
Ana endpoint, API bilgisi döner.

### GET /api/health
Sağlık kontrolü, API ve Gemini bağlantı durumunu kontrol eder.

### POST /api/analyze
Veri analizi endpoint'i.

**Request:**
```json
{
  "question": "Son 6 ayda en çok gelir getiren kategori hangisi?"
}
```

**Response:**
```json
{
  "success": true,
  "sql": "SELECT category, SUM(total_sale) as toplam_gelir FROM sales WHERE sale_date >= date('now', '-6 months') GROUP BY category ORDER BY toplam_gelir DESC LIMIT 1;",
  "data": [
    {
      "category": "Elektronik",
      "toplam_gelir": 245000.50
    }
  ],
  "kpis": {
    "toplam_gelir": 245000.50,
    "ortalama_satis": 196.0,
    "toplam_adet": 1250
  },
  "explanation": "Son 6 ayda Elektronik kategorisi toplam 245.000 TL gelir elde etti...",
  "chart_config": {
    "type": "bar",
    "x_axis": "category",
    "y_axis": "toplam_gelir"
  }
}
```

## Veritabanı Şeması

```sql
CREATE TABLE sales (
    id INTEGER PRIMARY KEY,
    sale_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,      -- Elektronik, Giyim, Gıda, Mobilya
    product_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total_sale DECIMAL(10, 2) NOT NULL  -- quantity * price
);
```

## Güvenlik

- **SQL Injection Koruması**: Tehlikeli SQL komutları (DROP, DELETE, UPDATE) engellenir
- **Sadece SELECT**: Sadece veri okuma sorgularına izin verilir
- **API Key Güvenliği**: Environment variable ile saklanır
- **CORS**: Sadece belirlenen frontend portlarına izin verilir

## Sorun Giderme

### Backend başlamıyor

1. Python version kontrolü: `python --version` (3.8+ olmalı)
2. Bağımlılıkları tekrar yükle: `pip install -r requirements.txt`
3. `.env` dosyasının backend dizininde olduğundan emin olun
4. Gemini API key'in doğru olduğunu kontrol edin

### Frontend başlamıyor

1. Node.js version kontrolü: `node --version` (16+ olmalı)
2. node_modules'u sil ve tekrar yükle:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### "Backend sunucusuna bağlanılamadı" hatası

1. Backend'in çalıştığından emin olun (http://localhost:8000/api/health)
2. CORS ayarlarını kontrol edin (main.py)

### Gemini API hatası

1. API key'in doğru olduğunu kontrol edin
2. API quota limitini kontrol edin (ücretsiz: 60 request/dakika)
3. İnternet bağlantınızı kontrol edin

## Lisans

MIT License

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## İletişim

Sorularınız için issue açabilirsiniz.

---

**Powered by Google Gemini AI**
