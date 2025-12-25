# Hızlı Kurulum Rehberi

## 1. Gemini API Key Alın

1. https://makersuite.google.com/app/apikey adresine gidin
2. "Create API Key" butonuna tıklayın
3. Oluşan key'i kopyalayın

## 2. Backend Kurulum

```bash
cd backend

# Python sanal ortamı oluştur (opsiyonel)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Bağımlılıkları yükle
pip install -r requirements.txt

# .env dosyasını düzenle ve API key'inizi ekleyin
# GEMINI_API_KEY=AIza...your_key_here

# Veritabanı oluştur
python database.py
```

## 3. Frontend Kurulum

```bash
cd ../frontend

# Bağımlılıkları yükle
npm install
```

## 4. Çalıştır

**Terminal 1 (Backend):**
```bash
cd backend
python main.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## 5. Tarayıcıda Aç

http://localhost:5173

## Test Soruları

- "Son 6 ayda en çok gelir getiren kategori hangisi?"
- "Bu yıl kaç adet ürün satıldı?"
- "En pahalı 5 ürün nedir?"

Başarılar!
