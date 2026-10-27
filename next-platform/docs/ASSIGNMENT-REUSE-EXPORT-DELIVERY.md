# Ödevi yeniden kullanma ve rapor çıktıları

27 Ekim 2026 · Dijital Oyun Atölyesi

Ödev listesindeki veya sonuç sayfasındaki **Yeniden kullan** bağlantısı, başlık, yönerge ve oyun seçimi doldurulmuş yeni ödev formunu açar. Hedef sınıf, alıcılar ve son tarih yeniden seçilir. Yeni ödev kaydedilirken oyunun yayındaki güncel sürümü sabitlenir; önceki ödev, alıcıları ve denemeleri korunur.

Kapalı ödevler ve arşivlenmiş sınıflardaki ödevler kaynak olabilir. Hedef sınıf etkin olmalıdır. Kaynak oyun atanamıyorsa metinler korunur ve başka oyun seçilmesi istenir. Başkasının veya geçersiz kimlikli ödevin yeniden kullanım bağlantısı bulunamadı ekranına gider. Form başka kaynak ödeve geçildiğinde sıfırlanır. Kayıt sırasında sınıf, oyun ve alıcı uygunluğu tekrar kontrol edilir.

## Rapor çıktıları

- **CSV indir**: UTF-8 BOM, noktalı virgül ayracı, CRLF satır sonları. Sınıf, ödev, oyun, takip kapsamı ve sekiz öğrenci sonuç sütunu. Metinlerdeki ayraç/tırnak/satır sonları kaçışlanır; elektronik tablo formülü olarak değerlendirilebilecek metinlere koruyucu tek tırnak eklenir.
- **Yazdır / PDF**: tarayıcının yazdırma penceresi üzerinden çıktı veya PDF kaydı. A4 yatay tablo, tekrarlanan sütun başlıkları, ödev bilgileri, kapsam, öğrenci sayısı ve İstanbul saatinde çıktı zamanı. Mobilde de tüm sütunlar basılır; sayfa menüleri ve işlem düğmeleri çıkarılır.
- Varsayılan kapsam ekrandaki arama ve durum filtresidir. **Tüm öğrenciler** filtreleri kaldırır; seçili sıralama her iki kapsamda korunur. Ekrandaki filtreler çıktı alındığında değişmez. Boş kapsamda çıktı düğmeleri kapalıdır.
- Sıfır puan korunur, ölçülmeyen değerler boş kalır. Takipsiz oyunlar yalnız açılma bilgisi sunduğunu açıkça belirtir. Çıktı sayfaya yüklenen rapor verisini kullanır; sonradan gelen sonuçlar için sayfa yenilenir.

Safari 27.0.1 yerel baskı penceresinde CSS sayfa yönünü otomatik seçmedi. **A4 ve Yatay** elle seçilerek bütün sütunların görünmesi doğrulandı; arayüzde bu yönlendirme bulunur. Chrome PDF çıktısı otomatik A4 yataydır. Fiziksel yazıcıya iş gönderilmedi. Safari kontrolü arayüz üzerinden yapılan hedefli kontroldür; otomatik tam Safari regresyonu değildir.

## Teknik sınırlar ve tasarım

Yeni veritabanı şeması, HTTP API veya paket bağımlılığı yoktur. `/ogretmen/odevler?yeniden=<ödev-id>` sunucuda sahiplik kontrollü başlangıç verisi alır; mevcut ödev oluşturma API’sini kullanır. CSV ve yazdırma, aynı yetkili rapor verilerini ve durum hesaplamasını paylaşır. Oyun seçicinin sorgusu da oluşturma API’sindeki temiz tarama/yayın koşuluyla eşitlendi.

Mevcut Atlas renkleri, fontları, düğmeleri, seçicileri ve tablo düzeni kullanıldı. 21st aramasında [Data Table Toolbar](https://21st.dev/@skovhm/components/data-table-toolbar) (39966) ve [Toolbar](https://21st.dev/@cnippet-dev/components/cnippet-toolbar) (19516) metadata örnekleri incelendi; katalog kodu kopyalanmadı. Ek satın alma veya barındırılan AI üretimi kullanılmadı. Değişen arayüz dosyalarının 21st denetimi **0 hata, 0 uyarı** verdi; 59 bilgi düzeyi renk önerisi önceki ortak CSS satırlarıdır.

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| TypeScript | Geçti |
| Birim testleri | 14 dosyada 120 test geçti; CSV için 14 yeni senaryo |
| Entegrasyon | 17 test geçti: 7 yeniden kullanım, 10 mevcut öğrenme senaryosu |
| Üretim derlemesi | Geçti; `.next-assignment-build` |
| Chrome kabul / regresyon | 15 test geçti: 6 yeni kabul, 8 çalışma alanı, 1 gerçek oyun/öğrenme akışı |
| Safari | Kaynak alanları, boş sınıf/alıcı/tarih, alıcı seçimi, filtreli CSV indirme, baskı önizlemesi ve iptal sonrası filtre koruma doğrulandı |
| PDF | 50 öğrenci üç A4 yatay sayfada; tüm kullanıcı adları mevcut, sütun başlıkları her sayfada tekrarlanıyor |

320, 390, 768 ve 1440 px görünüm, yatay taşma, klavyeyle oyun seçimi, kaynak değiştirme, erişim reddi, null/0 puan, metin/formül güvenliği, filtrelenmiş/tüm kapsam ve takipsiz oyun senaryoları denetlendi. Testler ayrı `dijital_workspace_test` veritabanı ve 3106 uygulama portunda sentetik hesaplarla çalıştırıldı. Gerçek öğrenci verisi kullanılmadı; üretim özelliği bayrağı ve `.env` değiştirilmedi. Geçici derleme tür yolları geri alındı.

## Örnek çıktılar ve yeniden doğrulama

- [Tek öğrenci CSV](../.impeccable/review/assignment-delivery/filtered-report.csv) · [Tek öğrenci PDF](../.impeccable/review/assignment-delivery/filtered-report.pdf)
- [50 öğrenci CSV](../.impeccable/review/assignment-delivery/all-report.csv) · [50 öğrenci PDF](../.impeccable/review/assignment-delivery/all-report.pdf)
- [Mobil rapor](../.impeccable/review/assignment-delivery/exports-390.png) · [Mobil yeniden kullanım](../.impeccable/review/assignment-delivery/reuse-390.png) · [Safari baskı](../.impeccable/review/assignment-delivery/safari-print.png)
- [PDF içerik kontrolü](../.impeccable/review/assignment-delivery/pdf-validation.json) · [21st denetimi](../.impeccable/review/assignment-delivery/design-review.json)

Test dosyaları: `tests/assignment-export.test.ts`, `tests/integration/assignment-reuse.test.ts`, `tests/e2e/assignment-delivery.spec.ts`. Mevcut `learning` entegrasyonu ile `workspace-pilot` ve `learning` tarayıcı senaryoları regresyon kapsamındadır. Ortam değişkenleri ayrı yerel test veritabanını göstermelidir; testler `_test` veritabanı koşulunu denetler.

Üretim derlemesi 3106 portunda yerel önizleme olarak açık bırakıldı.

Yerel kanıtlar `.impeccable/review/assignment-delivery/`, tarayıcı raporu `.data/assignment-playwright-report/`, son test günlüğü `.data/assignment-e2e.log` içindedir. Kaynak yedeği ve incelenebilir değişiklik yaması `.data/assignment-delivery-backup/` altındadır. Bu teslim yerel uygulamadır; canlı dağıtım yapılmadı.
