# 21st.dev pilotu — doğrulama ve teslim

27 Ekim 2026. Yerel öğretmen akışına uygulandı. Canlı dağıtım, yeni paket, migration veya ücretli hizmet yoktur. Kaynak sabitlemeleri ve tam MIT bildirimleri [kaynak kaydında](third-party/21st-pilot.md).

## Sonuç

Dosya seçiminden yayına kadar tek beş aşamalı gösterge kullanılır. Seçme ve bırakma aynı doğrulamayı yapar. Dosya seçimi aktarım hatasında korunur; başarılı içerik kimliği tekrar kullanılır. Çift gönderim engellenir. Aktarım yüzdesi XHR olaylarından gelir; aktarım sonrası yalnız sunucu kaydı beklenir. Kapak hatası başarılı oyun yüklemesini geri almaz. Öğretmen listesi ve detay ekranı, mevcut yayını yeni taslaktan ayırır ve iptal edilmiş sürümü yayında göstermez.

## Gerçekleştirilen kontroller

| Kontrol | Sonuç |
|---|---|
| `pnpm typecheck` | Geçti; son kaynak üzerinde tekrar doğrulandı |
| `pnpm exec vitest run tests/package-file.test.ts tests/publication-progress.test.ts` | 37 test geçti |
| `pnpm exec vitest run --config vitest.integration.config.ts tests/integration/upload-boundary.test.ts` | Gerçek multipart ayrıştırıcıyla 3 boyut sınırı testi geçti |
| `pnpm exec playwright test tests/e2e/upload-pilot.spec.ts` | 10 senaryo geçti |
| `pnpm exec playwright test tests/e2e/lifecycle.spec.ts` | Gerçek uçtan uca senaryo geçti; yaklaşık 1,7 dakika |
| `NEXT_DIST_DIR=.next-learning-21st-build … pnpm exec next build --webpack` | Üretim derlemesi geçti |
| Üretim derlemesini localhost:3102 üzerinde çalıştırma | Dosya seçici ve statik varlıklar doğrulandı; dört genişlikte taşma yok |
| Tasarım denetleyicisi | 0 birincil bulgu. Yeni bölümdeki 21px başlık önerisi mevcut 22px ölçeğine düzeltildi; kalan öneriler eski ortak CSS ile ilgili |

Komutlar test ortamının değişkenleri yüklenerek çalıştırıldı. Ayrı `dijital_21st_test` PostgreSQL veritabanı ve `.data/21st-test` dosya alanı kullanıldı. Yerel test veritabanı mevcut `dijital_unified_test` veritabanından kopyalandı; müfredat kaynakları test alanına kopyalandı. Hiçbir test ana `dijital` veritabanında çalıştırılmadı. Tarama için ayrı işçi ve mevcut yerel ClamAV/YARA; oyun sunumu için ayrı 58084 portu kullanıldı.

Gerçek yaşam döngüsü senaryosu kayıt/e-posta doğrulama, HTML/ZIP yükleme, tarama, metadata çıkarımı, taslağın kaydedilip yeniden açılması, kapak değişimi, yetki kontrolleri, 2FA yönetici incelemesi, yayın, anonim oyun çalıştırma, yayından kaldırma ve eski yayın korunurken yeni sürüm incelemesini kapsar.

Pilot tarayıcı testleri şunları kapsar:

- Klavye ile gerçek dosya seçicisi; HTML/HTM/ZIP ve büyük harfli uzantılar; boş/çoklu/yanlış tür/büyük dosya; sınır boyutu; geçersiz seçimde önceki dosyanın korunması; seçim sırasında ağ gönderimi olmaması.
- Aynı anda iki form gönderiminde tek istek; kilitli değiştirme/kaldırma/kapak kontrolleri; gerçek aktarım olaylarına bağlı yüzde ve aktarım sonrası “Sunucuya kaydediliyor”. Yüzdeyi doğrulayan senaryoda XHR olayları denetimli olarak tetiklenir; gerçek aktarım ayrıca lifecycle senaryosunda çalışır.
- Bağlantı kopması, HTTP 500, bozuk JSON, eksik sürüm kimliği; elle tekrar denemede içerik kimliğinin korunması; içerik oluşturma hatasında liste üzerinden kurtarma.
- Başarılı paket yüklemesinden sonra kapak için sürüm bilgisi isteğinin ağ/JSON/eksik sürüm hataları ile kapak POST ağ/HTTP hatalarında detaya geçiş.
- Etkileşimsiz aşama listesi, mevcut yayın + yeni sürüm, iptal edilmiş yayında yanlış başarı göstermeme. Durum ekranı testlerinde yalnız görünümü sınamak için etiketli test verisi kullanılır; gerçek yayın yetkileri ayrı lifecycle testinde sınanır.

## Görsel kanıt

320, 390, 768 ve 1440 px genişliklerde boş, seçilmiş, hatalı dosya ve yayın takibi kaydedildi. 768 px ve üstünde yatay; daha dar genişlikte dikey gösterge doğrulandı. Uzun Türkçe dosya adı, en az 44px kontroller, görünür klavye odağı, %200 CSS yakınlaştırma ve `prefers-reduced-motion: reduce` kontrol edildi. Metin kontrastları hesaplandı: yardımcı metin 5,11:1; ana eylem metni 12,55:1; hata başlığı 5,94:1; hata açıklaması 7,47:1. Tarayıcının kendi menüsüyle zoom veya fiziksel mobil cihaz testi yapılmadı; Chromium viewport, dosya seçici ve CSS zoom kullanıldı. Ekran okuyucuyla elle dinleme yapılmadı; semantik liste, `aria-current`, canlı durumlar ve odak DOM/tarayıcı testleriyle doğrulandı.

| Görünüm | Önce | Sonra |
|---|---|---|
| 390 px yükleme | [Önce](../.impeccable/review/21st/before/upload-390.png) | [Sonra](../.impeccable/review/21st/upload-empty-390.png) |
| 1440 px yükleme | [Önce](../.impeccable/review/21st/before/upload-1440.png) | [Sonra](../.impeccable/review/21st/upload-empty-1440.png) |
| 320 px uzun dosya + hata | — | [Görüntü](../.impeccable/review/21st/upload-error-320.png) |
| 390 px inceleme + eski yayın | — | [Görüntü](../.impeccable/review/21st/publication-review-390.png) |
| 768 px yayın | — | [Görüntü](../.impeccable/review/21st/publication-live-768.png) |
| Gerçek tarama sonrası metadata | — | [Görüntü](../.impeccable/review/21st/real-metadata-390.png) |
| %200 yakınlaştırma | — | [Görüntü](../.impeccable/review/21st/upload-200-percent.png) |

Tüm yerel görseller `.impeccable/review/21st/` içinde, test çıktıları `.data/21st-pilot-results/` ve `.data/21st-lifecycle-results/` içinde bulunur. Boş yükleme ekranının son görüntüleri üretim derlemesinden; etkileşim/durum ve gerçek metadata görüntüleri geliştirme derlemesindendir. Görseller depo ignore kuralları gereği yerel doğrulama dosyalarıdır.

## Sınır ayrıntısı ve önizleme

Mevcut sunucu tam 50 MiB dosyayı reddeder. Sunucu değiştirilmeden arayüz de aynı sınırla hizalandı: en büyük kabul edilen paket 52.428.799 bayt; kullanıcı metni “50 MB’dan küçük”. Sınırın bir bayt altı, tam sınır ve bir bayt üstü hem seçicide hem gerçek multipart akışında doğrulandı.

Kullanıcının mevcut geliştirme önizlemesi [localhost:3001/ogretmen/yeni](http://localhost:3001/ogretmen/yeni) adresinde aynı güncel kaynakla çalışır; öğretmen oturumu gerekir. Ayrı 3102/58084 doğrulama servisleri test sonunda durduruldu; test verisi ve derleme çıktısı yerelde korunur. Canlı dağıtım yapılmadı.
