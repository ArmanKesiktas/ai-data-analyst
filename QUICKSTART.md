# Hızlı Başlangıç - AI Veri Analizi

## 3 Adımda Başlayın

### 1️⃣ Gemini API Key Alın
https://makersuite.google.com/app/apikey

### 2️⃣ Backend Başlatın
```bash
cd backend
pip install -r requirements.txt
# .env dosyasına API key'inizi ekleyin
python database.py  # Veritabanı oluştur
python main.py      # Sunucuyu başlat
```

### 3️⃣ Frontend Başlatın
```bash
cd frontend
npm install
npm run dev
```

## Hazır!

Tarayıcınızda http://localhost:5173 açılacak.

### İlk Sorunuzu Sorun:
"Son 6 ayda en çok gelir getiren kategori hangisi?"

---

**Not:** Backend http://localhost:8000 adresinde çalışır.
API dokümantasyonu: http://localhost:8000/docs
