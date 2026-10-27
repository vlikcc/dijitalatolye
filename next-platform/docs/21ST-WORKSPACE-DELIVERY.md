# 21st çalışma alanı pilotu — teslim kaydı

27 Ekim 2026 · Dijital Oyun Atölyesi

Sonraki paket: [Ödevi yeniden kullanma ve rapor çıktıları](ASSIGNMENT-REUSE-EXPORT-DELIVERY.md).

[Kabul edilen planın](21ST-WORKSPACE-IMPLEMENTATION-PLAN.md) beş geliştirme paketi uygulandı. Teslim yerel uygulamadır; gerçek kullanıcı pilotunun ölçümü ve canlı dağıtım ayrı aşamalardır.

## Uygulanan davranışlar

| Alan | Sonuç |
|---|---|
| Ödev raporu | Tüm alıcıların durum sayaçları, Türkçe ad/kullanıcı adı araması ve son etkinlik sıralaması. Masaüstünde tablo; mobilde ayrıntıları açılabilen öğrenci listesi. Son deneme, en iyi puan, tamamlanma ve puansız deneme birbirinden ayrılıyor. Kayıtsız oyunlarda açılma bilgisi gösteriliyor. |
| Ödev atama | Klavyeyle kullanılan, oyun ID’sini koruyan aramalı seçici; öğrenci araması ve yalnız seçilenler filtresi. Aramada gizlenen seçimler korunuyor, sınıf değişince sıfırlanıyor. Alıcılar, tarih/saat dilimi ve takip kapsamı gönderim öncesi görünür. Hata sırasında alanlar korunuyor ve çift gönderim engelleniyor. Aynı öğrenci seçici mevcut ödeve alıcı eklerken de kullanılıyor. |
| İçeriklerim / inceleme kuyruğu | Sunucuda arama ve filtreleme, doğru toplamla 25 kayıtlık sayfalar ve URL üzerinden geri/ileri gezinme. Eski yayını açık olan yeni taslak, hem yayında hem işlem bekliyor filtresinde bulunabiliyor. Kuyruk yalnız güncel inceleme sürümlerini getiriyor. |
| Uzun formlar | Metadata ve değerlendirmede bölüm bağlantıları, mevcut kurallara göre eksik özeti ve ilgili alana odak taşıma. Karar girilmesi ile yayın onayına uygunluk ayrı gösteriliyor. Sekme geçişleri form değerlerini koruyor; metadata taslağı kaydedilip yeniden açılabiliyor. |
| İlk kullanım | Öğretmene gerçek sınıf, üyelik ve ödev durumundan sonraki adım; katılım kodunu kopyalama geri bildirimi. Öğrenciye sınıfsız, onay bekleyen, ödevsiz etkin üyelik ve pasif üyelik için ayrı yönlendirme. |

Regresyon sırasında bulunan bir sorun da giderildi: giriş ve öğrenci kayıt formu, JavaScript hazır olmadan gönderilebiliyordu. Gönderme düğmeleri artık form hazır olana kadar kapalı; formun yerel gönderim yöntemi de `POST`. JavaScript kapalı ilk görüntü ayrıca kontrol edildi.

Yeni paket bağımlılığı, veritabanı göçü veya HTTP uç noktası eklenmedi. Mevcut rol ve sahiplik kontrolleri korundu. Öğrenci özelliğinin üretimdeki varsayılanı değiştirilmedi.

## 21st erişimi ve kullanım kararı

- Kurulu/etkin eklenti: `21st@21st`, sürüm `0.5.0`.
- Canlı MCP erişimi: `paid`; bileşen alma erişimi çalışıyor. `aiGenerationEnabled=false`. Bu çalışma AI üretimi veya yeni satın alma gerektirmedi.
- [Data Table](https://21st.dev/@ephraimduncan/components/table-05), demo `28327`, ve [Combobox](https://21st.dev/@shugar/components/combobox), demo `4029`, kaynakları incelendi. Yerleşim ve etkileşim fikirleri mevcut React/CSS bileşenlerine uygulandı; katalog kodu kopyalanmadı. Bu nedenle doğrulanmamış kaynak lisansına veya yeni bileşen ailesine bağımlılık oluşturulmadı.
- CLI ile `.21st` tasarım bağlamı oluşturuldu. Otomatik bulunan font değerleri gerçek Manrope / Source Sans 3 kullanımıyla düzeltildi.
- Yerel `21st review`: **0 hata, 0 uyarı**. 59 bilgi düzeyindeki renk önerisinin tamamı çalışma öncesinde de var olan CSS satırlarına ait. [Makine çıktısı](../.impeccable/review/21st-workspace/design-review.json).

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| TypeScript | Geçti |
| Birim testleri | 13 dosyada 106 test geçti |
| Öğrenme ve liste entegrasyonu | 2 dosyada 15 test geçti |
| Chrome kabul ve regresyon testleri | 22 test geçti: 8 çalışma alanı/ilk form, 1 gerçek öğrenme akışı, 10 yükleme ve 3 önyüz regresyonu |
| Üretim derlemesi | Geçti; ayrı `.next-workspace-build` çıktısı |
| Özellik bayrağı kapalı | Öğrenci, sınıf ve ödev sayfaları bulunamadı ekranını gösteriyor; öğrenci kayıt sekmesi yok |
| JavaScript öncesi form | Gönderim düğmeleri kapalı, form yöntemi `POST` |

Chrome kapsamı: 50 öğrenciden beş alıcı seçimi, gizlenen seçimler, sınıf değiştirme, sunucu hatası/tekrar deneme, çift gönderim, null/0 puan ayrımı, önce tamamlayıp sonra yeniden başlayan öğrenci, 54 içerikte filtre/sayfalama, metadata kaydı, inceleme sekmelerinde taslak koruma, öğretmen/öğrenci başlangıç durumları ve gerçek oyun kaydı/başka cihazdan devam etme akışı. Yükleme ve önceki önyüz pilotunun regresyonları da çalıştırıldı.

320, 390, 768 ve 1440 px görünüm; %200 büyütme; klavyeyle oyun seçimi ve mobil ayrıntı açma; azaltılmış hareket ve yatay taşma kontrolleri yapıldı. Safari 27.0.1’de gerçek arayüzden giriş, rapor araması/durum filtresi, klavyeyle oyun seçimi, bölüm bağlantısının odağı, taslak kaydı ve filtrelenmiş listede kaydın görünmesi doğrulandı. Safari WebDriver için uzaktan otomasyon kapalı olduğundan Safari kontrolü otomatik tam regresyon paketi değildir; tarayıcı ayarı değiştirilmedi.

Testler ayrı `dijital_workspace_test` veritabanında, ayrı depolamada ve 3106 uygulama / 58087 oyun portlarında sentetik hesaplarla yürütüldü. Özellik kapalı kontrolü 3107’de yapıldı. Yerel disk alanı kesintisi sırasında geçici geliştirme çıktısı temizlendi ve durmuş Docker servisleri veri silmeden yeniden açıldı. Son kontroller sabit üretim derlemesinde yapıldı. TypeScript’in geçici test çıktı yolları geri alındı.

## Görsel kanıtlar

| Ekran | Önce | Sonra |
|---|---|---|
| Mobil rapor | [Önce](../.impeccable/review/21st-workspace/before/learning-report-390.png) | [Sonra](../.impeccable/review/21st-workspace/after/report-390.png) |
| Mobil atama | [Önce](../.impeccable/review/21st-workspace/before/learning-assignment-390.png) | [Sonra](../.impeccable/review/21st-workspace/after/assignment-390.png) |
| İçeriklerim | [Önce](../.impeccable/review/21st-workspace/before/unified-teacher-390.png) | [Sonra](../.impeccable/review/21st-workspace/after/contents-390.png) |
| İnceleme kuyruğu | [Önce](../.impeccable/review/21st-workspace/before/unified-editor-1440.png) | [Sonra](../.impeccable/review/21st-workspace/after/queue-1440.png) |
| Değerlendirme | [Önce](../.impeccable/review/21st-workspace/before/assessment-detail-390.png) | [Sonra](../.impeccable/review/21st-workspace/after/assessment-390.png) |

Önce görüntüleri önceki pilotun tarihsel kayıtlarıdır; aynı veri kümesiyle çekilmiş piksel karşılaştırması değildir. Ek kanıtlar: [metadata](../.impeccable/review/21st-workspace/after/metadata-390.png), [öğretmen başlangıcı](../.impeccable/review/21st-workspace/after/teacher-start-390.png), [öğrenci başlangıcı](../.impeccable/review/21st-workspace/after/student-start-390.png), [Safari raporu](../.impeccable/review/21st-workspace/after/safari-report.png), [bayrak ve ilk form kontrolü](../.impeccable/review/21st-workspace/feature-and-hydration-checks.json).

## Kullanıcı pilotu için kalan ölçüm

Raporun önerdiği 3–5 öğretmen ve 1–2 inceleyiciyle görev denemesi henüz yapılmadı. Bu teslimden kullanıcı hızı veya yatırım getirisi yüzdesi çıkarılmadı. Katılımcılarla başlamayan öğrenciyi bulma, doğru beş kişiye ödev verme, hedef içeriğin sonraki işlemini bulma ve eksik değerlendirmeyi tamamlama görevleri ölçülebilir. Kayıt alanları: görev doğruluğu, yanlış alıcı sayısı, süre, yardım ihtiyacı ve düzeltme/bakım süresi. Bu aşama için otomasyon veya dış kişilere mesaj oluşturulmadı.

Yeniden çalıştırma için test ortamını sağlayıp `pnpm typecheck`, `pnpm test`, ilgili iki entegrasyon dosyası ve `workspace-pilot`, `learning`, `upload-pilot`, `frontend-pilot` Playwright dosyaları kullanılabilir. Yerel komut çıktıları `.data/workspace-*.log`, tarayıcı raporu `.data/workspace-playwright-report` altındadır. Kaynakların çalışma öncesi yedeği `.data/workspace-pilot-backup/source-before.tar.gz` dosyasındadır.

31 kaynak/test dosyasının değişiklikleri ayrıca `.data/workspace-pilot-backup/implementation.patch` içinde incelenebilir. Paket bildirimi, kilit dosyası ve mevcut veritabanı şeması değiştirilmedi.
