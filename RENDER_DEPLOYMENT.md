# 🚀 Render.com Deployment Guide

Bu rehber, **Quanty.Studio** projesini Render.com'a deploy etme adımlarını içerir.

---

## 📋 Gereksinimler

1. **GitHub hesabı** - Projenin bir GitHub repo'sunda olması gerekiyor
2. **Render.com hesabı** - [render.com](https://render.com) üzerinden ücretsiz kayıt
3. **Supabase hesabı** (Zaten var) - Veritabanı için

---

## 🔧 Deployment Öncesi Hazırlık

### 1. GitHub'a Push Et

Eğer proje henüz GitHub'da değilse:

```bash
cd /Users/arman/Desktop/ai-data-analyst

# Git repo oluştur (zaten varsa bu adımı atla)
git init

# GitHub'da yeni bir repo oluştur, sonra:
git remote add origin https://github.com/KULLANICI_ADIN/ai-data-analyst.git

# Tüm dosyaları ekle ve push et
git add .
git commit -m "Render.com deployment ready"
git push -u origin main
```

### 2. Environment Variables Hazırla

Aşağıdaki değerleri not et (bunları Render'a gireceksin):

| Değişken | Değer | Açıklama |
|----------|-------|----------|
| `GEMINI_API_KEY` | `AIzaSy...` | Google AI API anahtarın |
| `DATABASE_URL` | `postgresql://...supabase.com...` | Supabase bağlantı URL'in |
| `JWT_SECRET_KEY` | `89b7ab89...` | JWT için gizli anahtar |
| `JWT_ALGORITHM` | `HS256` | JWT algoritması |
| `JWT_EXPIRATION_HOURS` | `24` | Token geçerlilik süresi |
| `ALLOWED_ORIGINS` | `https://frontend-url.onrender.com` | Frontend URL (deploy sonrası güncellenecek) |

---

## 🖥️ Backend Deployment (Python/FastAPI)

### Adım 1: Render'da Yeni Web Service Oluştur

1. [dashboard.render.com](https://dashboard.render.com) adresine git
2. **"New +"** butonuna tıkla → **"Web Service"** seç
3. **"Build and deploy from a Git repository"** seç
4. GitHub hesabını bağla ve **ai-data-analyst** repo'sunu seç

### Adım 2: Backend Ayarları

| Ayar | Değer |
|------|-------|
| **Name** | `quanty-backend` |
| **Region** | `Frankfurt (EU Central)` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | `Free` (başlangıç için yeterli) |

### Adım 3: Environment Variables Ekle

"Environment" sekmesinde aşağıdakileri ekle:

```
GEMINI_API_KEY=<your-google-gemini-api-key>
DATABASE_URL=<your-supabase-postgresql-connection-string>
JWT_SECRET_KEY=<generate-with-openssl-rand-hex-32>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
ALLOWED_ORIGINS=https://your-frontend.onrender.com
```

> ⚠️ **ÖNEMLİ:** Gerçek API key ve şifreleri asla Git'e commit etme! Bunları sadece Render Dashboard'dan gir.

> ⚠️ **Güvenlik Notu:** `ALLOWED_ORIGINS` değerini frontend deploy olduktan sonra güncellemen gerekecek.

### Adım 4: Deploy Et

**"Create Web Service"** butonuna tıkla ve build'in tamamlanmasını bekle (3-5 dakika).

Backend URL'in şuna benzer bir şey olacak:
`https://quanty-backend.onrender.com`

---

## 🌐 Frontend Deployment (React/Vite)

### Adım 1: Yeni Static Site Oluştur

1. Render Dashboard'da **"New +"** → **"Static Site"** seç
2. Aynı GitHub repo'sunu seç

### Adım 2: Frontend Ayarları

| Ayar | Değer |
|------|-------|
| **Name** | `quanty-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### Adım 3: Environment Variable Ekle

"Environment" sekmesinde:

```
VITE_API_URL=https://quanty-backend.onrender.com
```

> 📝 **Not:** `quanty-backend` kısmını kendi backend URL'inle değiştir.

### Adım 4: Deploy Et

**"Create Static Site"** butonuna tıkla.

Frontend URL'in şuna benzer olacak:
`https://quanty-frontend.onrender.com`

---

## ✅ Deploy Sonrası Kontrol Listesi

- [ ] Backend URL'i tarayıcıda aç: `https://quanty-backend.onrender.com/api/health`
- [ ] Frontend'i aç ve kayıt ol
- [ ] Giriş yap
- [ ] Yeni workspace oluştur
- [ ] Dosya yükle
- [ ] AI sorgusu yap

---

## 🔄 CORS Ayarını Güncelle (Önemli!)

Frontend deploy olduktan sonra:

1. Render Dashboard → Backend service → Environment
2. `ALLOWED_ORIGINS` değerini güncelle:
   ```
   ALLOWED_ORIGINS=https://quanty-frontend.onrender.com
   ```
3. **"Save Changes"** tıkla - Backend otomatik restart olacak

---

## 🐛 Sorun Giderme

### "Cold Start" Gecikmesi
Render Free tier'da 15 dakika inaktivite sonrası servis uyur. İlk istek 30-60 saniye sürebilir.

### CORS Hatası
`ALLOWED_ORIGINS` değerini kontrol et. Frontend URL'in tam olarak eşleşmeli.

### Database Bağlantı Hatası
- Supabase Dashboard'dan bağlantı URL'ini kontrol et
- Connection pooler kullandığından emin ol (önerilir)

### Build Hatası
- `requirements.txt` dosyasının doğru olduğundan emin ol
- Render build loglarını kontrol et

---

## 📱 Özel Domain Ekleme (Opsiyonel)

1. Render Dashboard → Settings → Custom Domains
2. Domain adını gir (örn: `app.quanty.studio`)
3. DNS ayarlarını yap (CNAME record ekle)

---

## 💡 İpuçları

1. **Ücretsiz Tier Limitleri:**
   - 750 saat/ay (tüm servisler için toplam)
   - 15 dakika sonra uyku modu
   - 512 MB RAM

2. **Paid Tier Avantajları ($7/ay):**
   - Sürekli aktif (uyku yok)
   - Daha fazla RAM
   - Daha hızlı build

3. **Monitoring:**
   - Render Dashboard'dan logları takip edebilirsin
   - Health check endpoint'i otomatik izleniyor

---

## 🎉 Tebrikler!

Projen artık canlıda! 

- **Frontend:** `https://quanty-frontend.onrender.com`
- **Backend API:** `https://quanty-backend.onrender.com`
- **Health Check:** `https://quanty-backend.onrender.com/api/health`
