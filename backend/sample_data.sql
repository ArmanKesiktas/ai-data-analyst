-- Örnek Satış Verileri
-- Bu dosya referans amaçlıdır. Asıl veri database.py ile oluşturulur.

-- Satış Tablosu Şeması
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total_sale DECIMAL(10, 2) NOT NULL
);

-- Örnek Veriler (database.py ile otomatik oluşturulur)
-- Kategoriler: Elektronik, Giyim, Gıda, Mobilya
-- Tarih Aralığı: Son 12 ay
-- Toplam: ~4000+ satış kaydı

-- Örnek Sorgular:

-- 1. Son 6 ayda en çok gelir getiren kategori
SELECT category, SUM(total_sale) as toplam_gelir
FROM sales
WHERE sale_date >= date('now', '-6 months')
GROUP BY category
ORDER BY toplam_gelir DESC
LIMIT 1;

-- 2. Bu yıl kaç adet ürün satıldı
SELECT SUM(quantity) as toplam_adet
FROM sales
WHERE strftime('%Y', sale_date) = strftime('%Y', 'now');

-- 3. En pahalı 5 ürün
SELECT product_name, price
FROM sales
ORDER BY price DESC
LIMIT 5;

-- 4. Kategori bazlı toplam satışlar
SELECT category, SUM(total_sale) as toplam_gelir, COUNT(*) as satis_adedi
FROM sales
GROUP BY category
ORDER BY toplam_gelir DESC;

-- 5. Aylık satış trendi
SELECT strftime('%Y-%m', sale_date) as ay, SUM(total_sale) as toplam_gelir
FROM sales
GROUP BY ay
ORDER BY ay;
