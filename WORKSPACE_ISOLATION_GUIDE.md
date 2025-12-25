# 🔐 Workspace Isolation Implementation Guide

## ✅ Tamamlanan Özellikler

### 1. **Workspace İzolasyonu**
Her workspace artık kendi tablolarına sahip:
- ✅ Workspace A'daki tablolar Workspace B'de görünmüyor
- ✅ Yeni workspace oluşturulduğunda boş tablo listesi ile başlıyor
- ✅ Her workspace bağımsız veri saklıyor

### 2. **Tablo Kopyalama Özelliği**
Kullanıcılar istedikleri zaman tabloları workspace'ler arası kopyalayabilir:
- ✅ `CopyTableModal` component'i oluşturuldu
- ✅ Sidebar'da her tablo için "Copy" butonu eklendi
- ✅ Hedef workspace seçimi yapılabiliyor
- ✅ Sadece editor/owner rolü olan workspace'lere kopyalama yapılabiliyor
- ✅ Aynı isimde tablo kontrolü yapılıyor

### 3. **Context Güncellemeleri**
WorkspaceContext'e yeni fonksiyonlar eklendi:
- ✅ `addTableToWorkspace(workspaceId, tableData)` - Workspace'e tablo ekle
- ✅ `removeTableFromWorkspace(workspaceId, tableName)` - Workspace'den tablo sil
- ✅ `copyTableToWorkspace(sourceWs, targetWs, tableName)` - Workspace'ler arası kopyala

---

## 📦 Oluşturulan Dosyalar

### 1. `CopyTableModal.jsx`
**Konum**: `frontend/src/components/CopyTableModal.jsx`

**Özellikler**:
- Modal pencere ile workspace seçimi
- Kullanıcının erişebildiği workspace'leri listeler
- Sadece edit yetkisi olan workspace'leri gösterir
- Mevcut workspace'i otomatik filtreler
- Kopyalama işlemi için onay gösterir
- Başarılı/başarısız durumlar için bildiri

**Kullanım**:
```jsx
<CopyTableModal
    isOpen={true}
    onClose={() => setOpen(false)}
    tableName="sales_data"
    tableData={{ name: "sales_data", rowCount: 1000 }}
    currentWorkspaceId={1}
/>
```

### 2. `WorkspaceContext.jsx` (Güncellendi)
**Yeni Fonksiyonlar**:

```javascript
// Workspace'e tablo ekle
addTableToWorkspace(workspaceId, tableData)

// Workspace'den tablo sil
removeTableFromWorkspace(workspaceId, tableName)

// Tabloyukopya workspace'ler arası kopyala
copyTableToWorkspace(sourceWorkspaceId, targetWorkspaceId, tableName)
```

### 3. `Sidebar.jsx` (Güncellendi)
**Değişiklikler**:
- `Copy` icon import edildi
- `onCopyTable` prop eklendi
- Her tablo için "Copy to workspace" butonu eklendi
- Hover durumunda mavi renk ile vurgulanıyor

### 4. `App.jsx` (Güncellendi)
**Değişiklikler**:
- `CopyTableModal` import edildi
- `copyTableModal` state'i eklendi
- `handleCopyTable()` fonksiyonu eklendi
- `closeCopyTableModal()` fonksiyonu eklendi
- Escape tuşu ile modal kapatma eklendi
- Sidebar'a `onCopyTable` prop'u geçildi

---

## 🎯 Nasıl Çalışıyor?

### 1. Workspace Değiştirme
```javascript
// Kullanıcı workspace değiştirdiğinde:
setCurrentWorkspaceId(newWorkspaceId)

// Otomatik olarak:
// - currentWorkspace güncellenir
// - Sadece o workspace'in tabloları gösterilir
// - Diğer workspace'lerin tabloları gizlenir
```

### 2. Tablo Kopyalama Akışı
```
1. Kullanıcı tablo üzerine gelir (hover)
2. "Copy" butonuna tıklar
3. CopyTableModal açılır
4. Hedef workspace seçilir
5. "Copy Table" butonuna basılır
6. Kontroller yapılır:
   - Hedef workspace var mı?
   - Aynı isimde tablo var mı?
   - Kullanıcının edit yetkisi var mı?
7. Tablo kopyalanır
8. Başarı bildirimi gösterilir
```

### 3. Workspace İzolasyonu
```javascript
// Her workspace kendi tables dizisine sahip:
{
    id: 1,
    name: "My Workspace",
    tables: [
        { name: "sales", rowCount: 1000 },
        { name: "customers", rowCount: 500 }
    ]
}

{
    id: 2,
    name: "Team Workspace",
    tables: [] // Boş başlar!
}
```

---

## 🚀 Kullanıcı Senaryoları

### Senaryo 1: Yeni Workspace Oluşturma
```
1. Kullanıcı "Create Workspace" butonuna tıklar
2. Workspace adını girer
3. Yeni workspace oluşturulur
4. Workspace boş tablo listesi ile açılır ✅
5. Önceki workspace'in tabloları görünmez ✅
```

### Senaryo 2: Tablo Kopyalama
```
1. Kullanıcı Workspace A'da
2. "sales" tablosunu görür
3. Tablo üzerine gelir
4. Copy ikonuna tıklar
5. Modal açılır, Workspace B'yi seçer
6. "Copy Table" butonuna basar
7. Tablo Workspace B'ye kopyalanır ✅
8. Workspace B'ye geçince tabloyu görür ✅
```

### Senaryo 3: İzinli Workspace'lere Kopyalama
```
1. Kullanıcının 3 workspace'i var:
   - Workspace A (owner) ✅
   - Workspace B (editor) ✅
   - Workspace C (viewer) ❌

2. Copy modal'da:
   - Workspace A listede
   - Workspace B listede
   - Workspace C listede YOK (viewer)

3. Sadece edit yetkisi olan workspace'lere kopyalama yapılabilir
```

---

## 🎨 UI/UX Özellikleri

### Copy Butonu
- 🎨 **Renk**: Gri (default) → Mavi (hover)
- 📍 **Konum**: Her tablonun sağında
- 🔍 **Görünürlük**: Sadece hover'da
- 💡 **Tooltip**: "Copy to workspace"

### Copy Modal
- 🎨 **Tasarım**: Gradient header (blue → purple)
- 📋 **Workspace Listesi**:
  - Her workspace için rol badge
  - Tablo sayısı gösterimi
  - Seçili workspace için checkmark
- ⚡ **Durumlar**:
  - Loading: "Copying..." + spinner
  - Success: "Copied!" + checkmark
  - Error: Kırmızı bildirim

### Bildirimler
- ✅ **Başarılı**: "Table 'sales' copied to 'Team Workspace'"
- ❌ **Hata**: "Table 'sales' already exists in 'Team Workspace'"
- ⚠️ **Uyarı**: "Please select a workspace"

---

## 🔧 Konfigürasyon

### Workspace Rolleri
```javascript
// Tablo kopyalama yetkileri:
OWNER → ✅ Kopyalayabilir
EDITOR → ✅ Kopyalayabilir
VIEWER → ❌ Kopyalayamaz (listede görünmez)
```

### LocalStorage Yapısı
```javascript
// Workspaces localStorage'da:
{
    "workspaces": [
        {
            "id": 1,
            "name": "My Workspace",
            "role": "owner",
            "tables": [
                {
                    "name": "sales",
                    "rowCount": 1000,
                    "createdAt": "2024-01-01T00:00:00Z"
                }
            ]
        }
    ],
    "currentWorkspaceId": 1
}
```

---

## 📝 Sonraki Adımlar (Opsiyonel)

### Backend Entegrasyonu
API endpoint'leri eklenebilir:
```javascript
// POST /api/workspaces/{workspaceId}/tables/{tableName}/copy
{
    "targetWorkspaceId": 2
}

// Response:
{
    "success": true,
    "message": "Table copied successfully"
}
```

### Gelişmiş Özellikler
- [ ] Bulk copy (Birden fazla tablo kopyalama)
- [ ] Copy with data filter (Sadece belirli satırları kopyala)
- [ ] Copy history (Kopyalama geçmişi)
- [ ] Undo copy (Kopyalamayı geri al)
- [ ] Copy notifications (Real-time bildirimler)
- [ ] Copy progress bar (Büyük tablolar için)

---

## 🐛 Sorun Giderme

### Sorun: Modal açılmıyor
**Çözüm**:
```javascript
// App.jsx'de kontrol et:
console.log(copyTableModal)
// { isOpen: true, tableName: "sales", tableData: {...} }

// Sidebar'da kontrol et:
onCopyTable={handleCopyTable} // ✅ Var mı?
```

### Sorun: Workspace listesi boş
**Çözüm**:
```javascript
// CopyTableModal.jsx'de:
const availableWorkspaces = workspaces.filter(ws =>
    ws.id !== currentWorkspaceId &&
    (ws.role === 'owner' || ws.role === 'editor')
)
console.log(availableWorkspaces) // Kontrol et
```

### Sorun: Kopyalama çalışmıyor
**Çözüm**:
```javascript
// WorkspaceContext.jsx'de:
console.log('Copying:', tableName, 'from', sourceId, 'to', targetId)

// Tablo verisi var mı?
const tableToCopy = sourceWorkspace.tables?.find(t => t.name === tableName)
console.log('Table data:', tableToCopy)
```

---

## ✅ Test Senaryoları

### Test 1: Workspace İzolasyonu
```
1. Workspace A'da tablo oluştur
2. Workspace B'ye geç
3. Beklenen: Tablo listesi boş ✅
```

### Test 2: Tablo Kopyalama
```
1. Workspace A'da tablo oluştur
2. Copy butonuna tıkla
3. Workspace B'yi seç
4. Copy Table butonuna bas
5. Workspace B'ye geç
6. Beklenen: Tablo görünüyor ✅
```

### Test 3: Aynı İsimde Tablo
```
1. Workspace A ve B'de aynı isimde tablo var
2. A'dan B'ye kopyala
3. Beklenen: Hata mesajı ✅
   "Table already exists"
```

### Test 4: Viewer Yetkisi
```
1. Viewer olduğun workspace'e kopyala
2. Beklenen: Listede görünmez ✅
```

---

## 📞 Destek

Sorularınız için:
- README.md dosyasına bakın
- WorkspaceContext.jsx kodunu inceleyin
- CopyTableModal.jsx example kodunu kontrol edin

**Başarılar!** 🎉

---

**Version**: 1.0
**Son Güncelleme**: 2025-12-26
**Durum**: ✅ Tamamlandı ve test edilmeye hazır
