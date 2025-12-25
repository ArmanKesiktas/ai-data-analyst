# 📊 Sample Sales Data - Kullanım Kılavuzu

## 🎉 Yeni Kullanıcılara Özel Örnek Veri!

Yeni kayıt olan tüm kullanıcılar artık **otomatik olarak** örnek bir "sales" tablosu ile başlıyor! Bu sayede özellikleri hemen test edebilirsiniz.

---

## 📋 Örnek Tablo Bilgileri

### Tablo Adı: `sales`
**Görünen Ad**: Sample Sales Data
**Açıklama**: Sample sales data for testing - 100 rows across 90 days
**Satır Sayısı**: 100
**Tarih Aralığı**: Son 90 gün

---

## 📊 Veri Yapısı

### Kolonlar (9 adet)

| Kolon | Tip | Açıklama | Örnek Değer |
|-------|-----|----------|-------------|
| **id** | number | Benzersiz satış ID'si | 1, 2, 3... |
| **date** | date | Satış tarihi | 2025-12-26 |
| **product** | string | Ürün adı | Laptop, Phone, T-Shirt |
| **category** | string | Ürün kategorisi | Electronics, Clothing, Food, Furniture |
| **quantity** | number | Satılan miktar | 1, 2, 3, 4, 5 |
| **price** | number | Birim fiyat | 800, 50, 15... |
| **total** | number | Toplam tutar (quantity × price) | 1600, 100, 45... |
| **region** | string | Satış bölgesi | North, South, East, West |
| **salesperson** | string | Satış temsilcisi | Alice Johnson, Bob Smith... |

---

## 🏷️ Kategoriler ve Ürünler

### Electronics (Elektronik)
- **Laptop**: $800 - $1,500
- **Phone**: $400 - $1,000
- **Headphones**: $50 - $300

### Clothing (Giyim)
- **T-Shirt**: $15 - $50
- **Jeans**: $40 - $120
- **Sneakers**: $60 - $200

### Food (Gıda)
- **Coffee**: $5 - $15
- **Sandwich**: $8 - $20

### Furniture (Mobilya)
- **Desk**: $150 - $500
- **Chair**: $80 - $300

---

## 👥 Satış Temsilcileri

- Alice Johnson
- Bob Smith
- Carol Davis
- David Wilson
- Emma Brown

---

## 📍 Bölgeler

- North (Kuzey)
- South (Güney)
- East (Doğu)
- West (Batı)

---

## 🎯 Örnek Kullanım Senaryoları

### 1. Kategori Bazlı Analiz
```
Soru: "Hangi kategori en çok satış yapıyor?"

Beklenen Sonuç:
- Electronics: Yüksek fiyat → Yüksek toplam
- Clothing: Orta fiyat → Orta toplam
- Food: Düşük fiyat → Düşük toplam
- Furniture: Yüksek fiyat → Yüksek toplam
```

### 2. Satış Temsilcisi Performansı
```
Soru: "En başarılı satış temsilcisi kim?"

Beklenen Sonuç:
- Her satış temsilcisinin toplam satışları
- En yüksek ciro yapan kişi
- Ortalama satış tutarları
```

### 3. Bölgesel Analiz
```
Soru: "Hangi bölgede satışlar daha iyi?"

Beklenen Sonuç:
- Her bölgenin toplam satışları
- Bölge bazlı kategori dağılımı
- En karlı bölge
```

### 4. Zaman Bazlı Trend
```
Soru: "Son 30 günde satışlar nasıl?"

Beklenen Sonuç:
- Günlük satış grafiği
- Haftalık trend
- Aylık karşılaştırma
```

### 5. Ürün Bazlı Analiz
```
Soru: "En çok satan ürün hangisi?"

Beklenen Sonuç:
- Ürün bazlı satış miktarları
- En popüler ürünler
- Ortalama ürün fiyatları
```

---

## 🚀 Nasıl Test Edilir?

### Adım 1: Tabloyu Görüntüle
```
1. Uygulamaya giriş yap
2. Sidebar'da "sales" tablosunu gör
3. Tabloya tıkla
4. 100 satır veri yüklenir
```

### Adım 2: AI Sorgula
```
1. Chat kutusuna soru yaz:
   "Show me total sales by category"
2. AI analiz eder
3. Sonuçları tablo/grafik olarak gösterir
```

### Adım 3: Dashboard Oluştur
```
1. "Create Dashboard" butonuna tıkla
2. Sales tablosunu seç
3. Grafik türü seç (Bar, Line, Pie)
4. Dashboard kaydet
```

### Adım 4: Tablo Kopyala
```
1. Sales tablosu üzerine hover yap
2. "Copy" ikonuna tıkla
3. Başka workspace seç
4. Kopyala
```

---

## 📈 Veri İstatistikleri

### Genel Bilgiler
- **Toplam Satır**: 100
- **Tarih Aralığı**: 90 gün
- **Ürün Sayısı**: 10 farklı ürün
- **Kategori Sayısı**: 4 kategori
- **Bölge Sayısı**: 4 bölge
- **Satış Temsilcisi**: 5 kişi

### Tahmini Değerler
- **Ortalama Sipariş**: $200-$400
- **Minimum Sipariş**: $15 (1 T-Shirt)
- **Maksimum Sipariş**: $7,500 (5 Laptop)
- **Toplam Ciro**: ~$30,000-$50,000

---

## 🎨 Görselleştirme Örnekleri

### 1. Kategori Bazlı Pie Chart
```
Electronics: 35%
Clothing: 30%
Furniture: 25%
Food: 10%
```

### 2. Bölgesel Bar Chart
```
North: ████████ 28%
South: ██████ 24%
East: ███████ 26%
West: ██████ 22%
```

### 3. Zaman Serisi Line Chart
```
Son 90 günde günlük satış trendi
Peak: ~$2000/gün
Average: ~$500/gün
Low: ~$100/gün
```

### 4. Satış Temsilcisi Performance
```
Alice: ████████ 22%
Bob: ███████ 20%
Carol: ███████ 21%
David: ██████ 19%
Emma: ██████ 18%
```

---

## 🔧 Teknik Detaylar

### Veri Oluşturma
```javascript
// WorkspaceContext.jsx içinde
const generateSampleSalesData = () => {
  // 100 satır rastgele veri oluştur
  // Son 90 günü kapsayan tarihler
  // Gerçekçi fiyat aralıkları
  // Rastgele bölge ve satış temsilcisi
}
```

### Veri Yapısı
```javascript
{
  id: 1,
  date: "2025-12-26",
  product: "Laptop",
  category: "Electronics",
  quantity: 2,
  price: 1200,
  total: 2400,
  region: "North",
  salesperson: "Alice Johnson"
}
```

### localStorage Kaydı
```javascript
{
  "workspaces": [
    {
      "id": 1,
      "name": "My Workspace",
      "tables": [
        {
          "name": "sales",
          "data": [...], // 100 rows
          "isSampleData": true
        }
      ]
    }
  ]
}
```

---

## 💡 Kullanım İpuçları

### AI Sorguları
```
✅ "Show total sales by category"
✅ "Which salesperson has the highest sales?"
✅ "Show sales trend for the last 30 days"
✅ "What is the average order value?"
✅ "Top 5 products by revenue"

❌ "Show me yesterday's data" (veri rastgele üretildi)
❌ "Update Alice's sales" (sadece sorgu, değiştirme yok)
```

### Dashboard İpuçları
```
💡 Kategori dağılımı için Pie Chart kullanın
💡 Zaman trendi için Line Chart kullanın
💡 Bölge karşılaştırması için Bar Chart kullanın
💡 Multiple metrics için Table View kullanın
```

### Tablo Özellikleri
```
✅ Filtreleme yapabilirsiniz
✅ Sıralama yapabilirsiniz
✅ Export edebilirsiniz (CSV/JSON)
✅ Kopyalayabilirsiniz (workspace'ler arası)

ℹ️ Sample data değiştirilemez (read-only)
ℹ️ Yeni tablo oluşturup kendi verinizi yükleyin
```

---

## 🎯 Test Checklist

Yeni kullanıcılar için test adımları:

- [ ] **1. Tablo Görünümü**
  - [ ] Sidebar'da "sales" tablosu görünüyor mu?
  - [ ] 100 satır yükleniyor mu?
  - [ ] Tüm kolonlar görünüyor mu?

- [ ] **2. AI Sorguları**
  - [ ] "Total sales by category" çalışıyor mu?
  - [ ] Grafik oluşturuluyor mu?
  - [ ] Sonuçlar doğru mu?

- [ ] **3. Filtering & Sorting**
  - [ ] Kategori filtresi çalışıyor mu?
  - [ ] Tarih sıralaması çalışıyor mu?
  - [ ] Fiyat filtresi çalışıyor mu?

- [ ] **4. Copy Feature**
  - [ ] Tablo kopyalanabiliyor mu?
  - [ ] Başka workspace'e gidiyor mu?
  - [ ] Veri integrity korunuyor mu?

- [ ] **5. Export**
  - [ ] CSV export çalışıyor mu?
  - [ ] JSON export çalışıyor mu?
  - [ ] Veri eksiksiz mi?

---

## 🐛 Sorun Giderme

### Tablo Görünmüyor?
```bash
Çözüm:
1. localStorage'ı temizle
2. Sayfayı yenile
3. Yeni workspace oluşturulacak
4. Sample data otomatik eklenecek
```

### Veri Yüklenmiyor?
```bash
Kontrol:
1. Console'da hata var mı?
2. generateSampleSalesData() çalışıyor mu?
3. localStorage boyutu doldu mu?
4. Browser localStorage desteği var mı?
```

### AI Sorguları Çalışmıyor?
```bash
Kontrol:
1. Backend bağlantısı var mı?
2. Tablo seçili mi?
3. Soru formatı doğru mu?
4. API key geçerli mi?
```

---

## 🔮 Gelecek Geliştirmeler

### Planlanan
- [ ] Daha fazla örnek tablo (customers, products, orders)
- [ ] Farklı endüstriler (retail, saas, e-commerce)
- [ ] Daha büyük veri setleri (500, 1000 satır)
- [ ] İlişkili tablolar (foreign keys)
- [ ] Real-time data generation
- [ ] Sample dashboard templates

---

## 📊 Veri Özeti

### Örnek Veri Kartı

```
╔════════════════════════════════════╗
║     SAMPLE SALES DATA              ║
╠════════════════════════════════════╣
║ Rows:         100                  ║
║ Columns:      9                    ║
║ Date Range:   90 days              ║
║ Categories:   4                    ║
║ Products:     10                   ║
║ Regions:      4                    ║
║ Salespeople:  5                    ║
║                                    ║
║ Price Range:  $5 - $1,500          ║
║ Avg Order:    ~$300                ║
║ Total Value:  ~$40,000             ║
╚════════════════════════════════════╝
```

---

## ✨ Özet

**Yeni kullanıcılar artık:**

✅ Hemen kullanıma hazır **100 satırlık örnek veri** ile başlıyor
✅ **9 farklı kolon** ile zengin analiz yapabiliyor
✅ **4 kategori, 10 ürün, 5 satış temsilcisi** ile gerçekçi veri
✅ **AI sorguları, dashboard, filtering** özelliklerini test edebiliyor
✅ **Workspace kopyalama, export** gibi özellikleri deneyebiliyor

**Hiç kurulum gerektirmeden, anında test edebilirsiniz!** 🎉

---

**Version**: 1.0
**Created**: 26 Aralık 2025
**Status**: ✅ Active
**Rows**: 100
**Auto-generated**: Yes

**Happy Testing!** 🚀
