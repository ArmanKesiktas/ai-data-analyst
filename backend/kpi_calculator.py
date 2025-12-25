import pandas as pd
from datetime import datetime
from typing import Dict, Any

def calculate_kpis(df: pd.DataFrame, sql_query: str = "") -> Dict[str, Any]:
    """
    DataFrame'den otomatik KPI'ları hesapla

    Args:
        df: Sorgu sonucu DataFrame
        sql_query: Çalıştırılan SQL sorgusu (opsiyonel)

    Returns:
        KPI dictionary
    """
    kpis = {}

    if df.empty:
        return kpis

    try:
        # Kolon isimlerini al
        columns = df.columns.tolist()

        # 1. TOPLAM GELİR (eğer total_sale kolonu varsa)
        if 'total_sale' in columns:
            kpis['toplam_gelir'] = round(df['total_sale'].sum(), 2)

        # 2. ORTALAMA SATIŞ (eğer total_sale kolonu varsa)
        if 'total_sale' in columns:
            kpis['ortalama_satis'] = round(df['total_sale'].mean(), 2)

        # 3. TOPLAM ADET (eğer quantity kolonu varsa)
        if 'quantity' in columns:
            kpis['toplam_adet'] = int(df['quantity'].sum())

        # 4. KATEGORİ SAYISI (eğer category kolonu varsa)
        if 'category' in columns:
            kpis['kategori_sayisi'] = df['category'].nunique()

        # 5. TARİH ARALIĞI (eğer sale_date kolonu varsa)
        if 'sale_date' in columns:
            try:
                # Tarihleri datetime'a çevir
                df['sale_date'] = pd.to_datetime(df['sale_date'])
                min_date = df['sale_date'].min()
                max_date = df['sale_date'].max()

                # Tarih farkını hesapla
                days_diff = (max_date - min_date).days

                if days_diff > 0:
                    kpis['tarih_araligi'] = f"{min_date.strftime('%Y-%m-%d')} - {max_date.strftime('%Y-%m-%d')} ({days_diff} gün)"
                else:
                    kpis['tarih_araligi'] = min_date.strftime('%Y-%m-%d')

            except Exception as e:
                print(f"⚠️  Tarih aralığı hesaplanamadı: {str(e)}")

        # 6. BÜYÜME ORANI (eğer tarih ve total_sale varsa)
        if 'sale_date' in columns and 'total_sale' in columns and len(df) > 1:
            try:
                df_sorted = df.sort_values('sale_date')

                # İlk ve son dönemleri ayır
                mid_index = len(df_sorted) // 2
                first_half = df_sorted.iloc[:mid_index]['total_sale'].sum()
                second_half = df_sorted.iloc[mid_index:]['total_sale'].sum()

                if first_half > 0:
                    growth_rate = ((second_half - first_half) / first_half) * 100
                    kpis['buyume_orani'] = round(growth_rate, 2)

            except Exception as e:
                print(f"⚠️  Büyüme oranı hesaplanamadı: {str(e)}")

        # 7. ORTALAMA FİYAT (eğer price kolonu varsa)
        if 'price' in columns:
            kpis['ortalama_fiyat'] = round(df['price'].mean(), 2)

        # 8. TOPLAM ÜRÜN ÇEŞİDİ (eğer product_name kolonu varsa)
        if 'product_name' in columns:
            kpis['toplam_urun_cesidi'] = df['product_name'].nunique()

        # 9. EN YÜKSEK SATIŞ (eğer total_sale varsa)
        if 'total_sale' in columns:
            kpis['en_yuksek_satis'] = round(df['total_sale'].max(), 2)

        # 10. EN DÜŞÜK SATIŞ (eğer total_sale varsa)
        if 'total_sale' in columns:
            kpis['en_dusuk_satis'] = round(df['total_sale'].min(), 2)

        # 11. TOPLAM KAYIT SAYISI
        kpis['toplam_kayit'] = len(df)

        print(f"✅ {len(kpis)} adet KPI hesaplandı")

    except Exception as e:
        print(f"❌ KPI hesaplama hatası: {str(e)}")

    return kpis
