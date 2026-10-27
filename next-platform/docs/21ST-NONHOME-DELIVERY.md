# Ana sayfa dışındaki arayüz dokunuşları

27 Ekim 2026 · 21st UI Build ve katalog araştırmasının uygulaması

Keşif Atlası'nın Manrope / Source Sans 3 yazı karakterleri, lacivert–amber renkleri, ince kenarlıkları ve mevcut ekran yoğunluğu korundu. Dokunuşlar; kullanıcının yapacağı işi, işlem sonucunu ve bulunduğu aşamayı daha kolay görmesine odaklanıyor.

## Uygulanan değişiklikler

| Alan | Somut değişiklik |
|---|---|
| Oyun detayı | Mobilde oyun başlamadan önce kapak ve başlatma düğmesi kompakt akışta. Oyun başlayınca mevcut oynama alanı açılıyor. Geniş ekranda araçların görünür metin etiketleri var. |
| Öğrenci oynatıcısı | Bağlantı hazır, kaydediliyor, kaydedildi ve kayıt hatası ayrı simge/metin durumları. Başarı sunucu yanıtından sonra gösteriliyor; kayıt çakışmasında mevcut güncel kaydı yükleme eylemi korunuyor. |
| Parola kurtarma | E-posta ile kurtarma, yeni parola ve öğrenci parolası ekranları ortak kompakt beyaz form yüzeyinde. Öğrencinin iki gerçek adımı açıklanıyor. Yeni parola alanı mevcut 12 karakter koşulunu canlı gösteriyor. |
| Giriş / kayıt | İşleme özgü bekleme metinleri, simgeli hata ve başarı geri bildirimi. Başarılı öğretmen kaydında “E-postanı kontrol et” sonuç alanı. 2FA koduna geçişte odak ve kısa yardım. Öğrenci kullanıcı adı alanı terk edildiğinde biçim geri bildirimi. |
| Hesap / güvenlik | Rol ve iki aşamalı doğrulama durumu okunabilir etiketler. Kurulumun iki aşaması açık; yedek kodlar için sonuç bekleyen kopyalama eylemi. |
| Öğretmen içerik listesi | Listenin üstünde toplam ve mevcut kayıt aralığı; durumlar simgeyle destekleniyor. İlk içerik ve sonuçsuz filtre için ilgili eylem mevcut. |
| İçerik ayrıntısı | İçeriklerime dönüş; gerçek tarihleri ve aktif yayın durumunu gösteren sürüm çizgisi. Kapak için sabit oranlı yükleme / hata görünümü. |
| Uzun formlar | Bölüm özetinde kaydırmaya göre aktif işaret ve eksik sayısı. Tıklamayla mevcut odak davranışı korunuyor; kaydırma sırasında odak taşınmıyor. Kaydetme sonucu ortak durum diliyle gösteriliyor. |
| Yeni içerik yükleme | İsteğe bağlı kapakta yerel önizleme, dosya adı/boyutu, kaldırma ve tür/boyut kontrolü. “Henüz yüklenmedi” seçimin kayıt olmadığını açıklıyor. Önizleme URL'si temizleniyor. |
| Sınıflar | Onaylı / bekleyen öğrenci sayıları; üyelik etiketleri; sınıf koduyla aynı grupta kopyalama. Pano reddinde elle kopyalama açıklaması kalıyor. |
| Öğretmen ödevleri | Açık / kapalı durumlar ve tarih daha kolay taranıyor. Mevcut yeniden kullanma eylemi ikincil görünüyor; seçili alıcı sayısı belirgin. |
| Öğrenci çalışma alanı | Devam edilebilen ödev satırı, üyelik ve sonuç durumları ayrışıyor. Gerçek sayısal ilerleme küçük bir çubukla destekleniyor. |
| Ödev raporu | Sayısal hücreler hizalı; ilerleme yüzdesi ve ince dolgu birlikte. Veri olmayan değer `—`, gerçek sıfır `%0` olarak kalıyor. CSV indirme başlatıldığında kısa bildirim, çıktı eylemlerinde simge var. |
| Editör listesi / inceleme | Üstte liste özeti, satır durumları ve görünür inceleme eylemi. Teknik bulguların engel / uyarı sayıları; sekme adını bozmayan bulgu açıklaması. Karar sayısı yayımlanabilirlik iddiası taşımıyor. |
| Yönetim | Rol, güvenlik, yayın ve iş durumları tutarlı etiketler. Başarılı işlemler kendi sonucunu söylüyor. İşlem günlüklerinde bilinen olaylar Türkçe, ham kod ve tam hedef kimliği ayrıntıda erişilebilir. Sistem ekranındaki iki liste ayrı sayılıyor. |
| Yan durumlar | Öğretmen, öğrenci, editör ve yönetim segmentlerinde doğal bekleme iskeleti ve yeniden deneme / oyunlara dönüş içeren hata yüzeyi. Yapay bekletme yok. |

## Kapsam ve korunan davranışlar

Ana sayfa bileşenleri ve kök yükleme / hata görünümleri değiştirilmedi. Yeni stiller hedef bileşen sınıflarına bağlı. Ana sayfanın önce/sonra görsellerinde yerleşim korundu; geliştirme göstergesi ve geç yüklenen kapak yüzünden bu karşılaştırma piksel eşitliği iddiası değildir.

Katalogdaki kaydedilenler ayrımı, bekleme göstergesi ve kullanım rehberindeki bölüm bağlantıları mevcut çalışma içinde zaten tamamlandığından yeniden uygulanmadı. Rehberin eşzamanlı değişiklikleri korunuyor. Yönlendirme rotalarına yapay ekran eklenmedi.

Yetki kuralları, veritabanı şeması, API sözleşmeleri, ödev kapatma anlamı, kayıtsız oyunların takibi, 25 kayıtlık sayfalama ve yayın denetimleri aynı. Durum metinleri gerçek yanıt/veriden geliyor. Yeni paket kurulmadı; katalog kodu doğrudan kopyalanmadı.

## 21st kaynaklarının kullanımı

Araştırmadaki 20 arama, 104 aday ve kaynak kodu incelenen 13 adayın kaydı [araştırma raporunda](./21ST-NONHOME-RESEARCH-2026-10-27.md) ve [kanıt dosyasında](./21ST-NONHOME-RESEARCH-EVIDENCE-2026-10-27.json).

| Katalog referansı | Yerel uyarlama |
|---|---|
| [Status Badge](https://21st.dev/@serafimcloud/components/status-badge) | `StatusBadge`, Lucide simgeleri ve merkezi durum renkleri |
| [Loading Button](https://21st.dev/@ddoemonn/components/loading-button) | Mevcut Button üzerinde gerçek isteğe bağlı `ActionButton` / `ActionFeedback` |
| [Copy With Confirmation](https://21st.dev/@ibrandify/components/copy-with-confirmation) | `CopyButton`: Clipboard Promise, hata açıklaması, tekrar gönderim kilidi |
| [Table of Contents](https://21st.dev/@appica-dev/components/toc) | Mevcut `FormOutline` üzerinde aktif bölüm işareti |
| [Audit Log With Icon Tiles](https://21st.dev/@olewandowski1/components/activity-3) | Sürüm geçmişi ve yönetim olay satırları |
| [Progress With Value](https://21st.dev/@arihantcodes_1f7b8c4d/components/progress-with-value) | Null/0 ayrımını koruyan yerel `ProgressValue` |
| [File Dropzone](https://21st.dev/@joyco/components/file-dropzone) | Paket yükleyicisini değiştirmeyen `CoverFilePicker` |
| [Skeleton Swap](https://21st.dev/@ddoemonn/components/skeleton-swap) | Bekleme süresi eklemeyen segment iskeleti |

Projede bulunan Button, PasswordField, PageHeading, WorkspaceSections ve native `details/summary` yeniden kullanıldı. Hosted AI erişimi kapalı olduğundan AI üretimi yapılmadı. Seçimler `DESIGN.md`, `.21st/DESIGN.md` ve `.21st/design.json` içinde kayıtlı.

## Doğrulama

Testler yerel, ayrı `_test` veritabanındaki sentetik hesaplarla yürütüldü. Üretim derlemesiyle çalışan Chrome turu ve ek kapak testi tamamlandı. Geçici test sunucusu kapatıldı; ana geliştirme sunucusu açık bırakıldı.

- Üretim derlemesi: Next.js webpack derlemesi, TypeScript ve sayfa üretimi başarılı.
- Birim testleri: 15 dosyada 124 test geçti.
- Tür kontrolü geçti.
- Üretim tarayıcı turu: 40/40 senaryo geçti. Ardından yeni kapak yükleme/hata senaryosu ve görüntü hazır olmasını bekleyen iki tekrar 3/3 geçti; toplam 41 farklı senaryo doğrulandı.
- Görsel kontrol: üç kurtarma ekranı ve oyun detayı 320, 390 ve 1440 px genişliklerde; 12 görünümde yatay taşma ve tarayıcı hatası yok.
- 21st hedefli inceleme: 0 hata, 0 uyarı. 65 renk sabiti bilgi önerisi mevcut palet ve yeni merkezi durum tokenlarını içeriyor; otomatik yeniden renklendirme uygulanmadı.
- Yeni davranış kontrolleri: kapak seçme / kaldırma / boyut hatası; pano reddi ve gecikmeli başarı; kayıt beklemesi / sunucu onayı / ret; mobil başlangıç alanı.
- Regresyon kapsamı: dört rolün gezinmesi ve yetkileri, parola kurtarma ve doğrulama, 2FA odağı, form taslakları, filtre/sayfalama, rapor null/0 ayrımı, CSV/PDF, ödev alıcıları, aktif iframe'in sinema ve tam ekran geçişlerinde korunması.

Otomatik kontroller erişilebilirlik sertifikası veya kullanıcı araştırması değildir. Yeni durumlarda metin/simge, canlı bildirim, klavye odağı ve azaltılmış hareket desteği esas alındı.

Sonuçlar: [doğrulama kaydı](../.impeccable/review/nonhome-20261027/verification.json), [21st incelemesi](../.impeccable/review/nonhome-20261027/design-review.json), [40 senaryoluk tarayıcı raporu](../.data/nonhome-polish/report/index.html).

Görsel örnekler: [mobil oyun başlangıcı](../.impeccable/review/nonhome-20261027/player-390.png), [hesap kurtarma](../.impeccable/review/nonhome-20261027/recovery-390.png), [kapak seçimi](../.impeccable/review/nonhome-20261027/cover-selection-390.png), [sınıf yönetimi](../.impeccable/review/nonhome-20261027/teacher-start-390.png), [uzun içerik formu](../.impeccable/review/nonhome-20261027/metadata-390.png).

## Başlıca uygulama dosyaları

- Ortak desenler: `src/components/status-badge.tsx`, `action-feedback.tsx`, `copy-button.tsx`, `recovery-layout.tsx`, `workspace-loading.tsx`, `workspace-error.tsx`.
- Oynatıcı: `src/components/game-player.tsx`, `tracking-bridge.ts`.
- Hesap: `src/components/auth-form.tsx`, `learning-forms.tsx`; kurtarma rotaları ve `src/app/hesap/page.tsx`.
- Çalışma ekranları: öğretmen / öğrenci / editör / yönetim rotaları; `assignment-report.tsx`, `assignment-exports.tsx`, `list-controls.tsx`, `action-form.tsx`.
- İçerik: `cover-file-picker.tsx`, `cover-image.tsx`, `cover-editor.tsx`, `upload-form.tsx`, `form-outline.tsx`, `metadata-editor.tsx`, `version-detail.tsx`, `technical-report.tsx`, `curriculum-review.tsx`, `workspace-sections.tsx`.
- Görünüm: `src/app/globals.css` içindeki “Non-home polish” bloğu ve merkezi durum tokenları.
