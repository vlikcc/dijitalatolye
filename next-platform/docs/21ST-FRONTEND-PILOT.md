# 21st Builder önyüz pilotu — teslim ve doğrulama

27 Ekim 2026 · Yerel önizleme: [localhost:3001](http://localhost:3001)

## Teslim edilen davranış

- Ana sayfa ve `/kesfet` aynı katalog altyapısını kullanır. Mevcut başlık/arama korunur; 1024 px ve üstünde filtrelenmemiş katalogdaki gerçek kapaklardan en fazla üçü giriş alanında görünür. Filtreli, kaydedilmiş ve boş görünümde dekoratif kapaklar yoktur.
- Ortak oyun kartları sarılan başlık, tutarlı kapak, hizalı bilgi satırı ve ayrı kaydetme düğmesi kullanır. Ders, sınıf, varsa süre ve Demo/Yayımlandı ayrımı korunur. Benzer oyunlar da aynı kartı kullanır.
- Giriş ve kayıt aynı hesap yerleşimini paylaşır. 1024 px ve üzerinde form solda, gerçek oyunlar sağdadır; dar ekranda form öne çıkar. Katalog hatası dekoratif galeriyi kaldırır, giriş formunu engellemez.
- Kayıt türlerinde kısa açıklamalar, ilişkili sınıf kodu yardımı ve gerçek en az 12 karakter koşulunun canlı geri bildirimi vardır. Yeni parola kuralı veya kayıt adımı yoktur. Giriş ve parola kurtarma davranışı korunur.
- Oyun detayında başlık, gerçek bilgiler ve eylemler gruplanır. Öğrenme hedefi ve hazırlayan varsa gösterilir. İlk öğretmen notu açıktır; ek notlar yerel HTML `details` alanındadır. Not açıp kapatma çalışan iframe'i değiştirmez.

HTTP uçları, veritabanı şeması, rol/yayın yetkileri ve bağımlılık dosyaları değişmedi. Dashboard tasarımı ve canlı dağıtım bu teslimin kapsamında değildir.

## Sağladığı değer

Gerçek oyunlar ilk izlenimi güçlendirirken arama ve ilk kartlar aynı ekranda kalır. Hesap ekranı platformun içeriğini gösterir; kayıt seçenekleri ve parola koşulu daha anlaşılır olur. Oyun bilgileri öğretmenin uygunluğu değerlendirmesini kolaylaştırır. Bunlar tasarımın beklenen faydalarıdır; kullanıcı dönüşümünde veya görev süresinde ölçülmüş artış iddiası yoktur.

27 Ekim kullanıcı geri bildirimi: normal oyun detayındaki “Oyunlara dön” satırı, logo ve ana menüyü tekrar ettiği için kaldırıldı. Arama/sınıf/ders bağlamıyla gelinmişse “Sonuçlara dön”, kaydedilmiş koleksiyondan gelinmişse “Kaydettiklerime dön” görünür; güvenli dönüş adresi ve filtreler korunur. TypeScript ve ilgili beş mevcut E2E senaryosu geçti. Test tarayıcısı önbellekte bulunmadığından kurulu Chrome kullanıldı; ilk toplu koşudaki tek masaüstü gezinme zaman aşımı, kod değişmeden tek başına yeniden çalıştırıldığında geçti. Güncel mobil/tablet/masaüstü görüntüleri ve dar kapsamlı inceleme `.impeccable/review/detail-navigation/` içindedir.

## Teknik doğrulama

| Kontrol | Sonuç ve kapsam |
|---|---|
| TypeScript | `pnpm typecheck` geçti. |
| Birim testleri | `pnpm test`: 12 dosyada **98 test geçti**. Yeni iki test, gerçek kapak seçim sınırlarını ve boş/çok paragraflı oyun bilgisini doğrular. |
| Üretim derlemesi | `next build --webpack` ayrı `.next-frontend-test` çıktısıyla geçti. |
| Etkilenen tarayıcı testleri | **33 farklı senaryo geçti**. İlk toplu koşuda 32 geçti; mobil katalog testinde Chromium hedefi kapandı. Aynı senaryo kod değişmeden tek başına tekrar geçti. |
| Gerçek öğrenci/oyun akışı | Ek **1 senaryo geçti**: öğrenci kaydı, tarama ve inceleme üzerinden gerçek yayımlanan oyun, ilerleme kaydı, yeniden deneme, cihazlar arası devam ve öğretmen raporu. Toplam 34 farklı tarayıcı senaryosu. |
| Özellik bayrağı ve boş katalog | Ayrı sunucuda öğrenci özelliği kapalıyken öğretmen formu görünür; öğrenci sekmesi yoktur. Boş katalogda sahte kapak veya dekoratif galeri yoktur. |
| Safari | Gerçek Safari'de katalog arama, oyun başlatma, giriş/kayıt görünümü ve klavyeyle kayıt türü geçişinde taslak koruma doğrulandı. Bu kontrol tüm test paketinin Safari'de çalıştırılması anlamına gelmez. |

Tarayıcı kontrolleri `tests/e2e/atlas.spec.ts`, `catalog-controls.spec.ts`, `detail-header.spec.ts`, `discovery-palette.spec.ts`, `frontend-pilot.spec.ts`, `hero.spec.ts`, `player-layout.spec.ts`, `unified-surfaces.spec.ts`, `unified-workspaces.spec.ts` ve ayrıca `learning.spec.ts` kapsamındadır. Kayıt, e-posta doğrulama, parola kurtarma, hatalı giriş, çift gönderim, dört rolün yönlendirmesi, yönetici rollerinin iki aşamalı doğrulaması, arama/filtre/geçmiş/kaydetme, tam ekran/sinema ve yön değişimi kontrolleri kullanıldı.

Test veritabanı `dijital_frontend_test`, dosyalar `.data/frontend-test`, uygulama portu 3104, bayrak kontrolü 3105 ve oyun portu 58086 olarak ayrıldı. Gerçek yerel önizleme veritabanına test kayıtları yazılmadı. Üretim modundaki yerel HTTP testleri projenin mevcut `DEPLOYMENT_ENV=local-test` desteğiyle çalıştırıldı; uygulamanın güvenlik kuralları değiştirilmedi.

Teslim sonunda yalnız bu pilota ait iki test sunucusu ile `dijital-frontend` worker/oyun konteynerleri durduruldu. Test verileri korundu; derleme `.data/frontend-build` altında arşivlendi. Geçici Next.js tür yolu ekleri kaldırıldı; `tsconfig.json` ve `next-env.d.ts` başlangıç durumuna döndü. 3001 portundaki yerel önizleme açık bırakıldı ve HTTP 200 yanıtı doğrulandı.

## Görsel ve erişilebilirlik kanıtı

320, 390, 600, 768, 1024 ve 1440 px genişliklerde katalog, giriş, kayıt ve oyun detayı incelendi. Yatay taşma bulunmadı. 1440×900'de ilk dört kart tamamen, 390×844'te ilk kapak ve başlık görünür. Klavye odağı, 44 px hedefler, uzun Türkçe içerik ve azaltılmış hareket kontrol edildi. %200 büyütme, Chromium'da CSS zoom eşdeğeriyle doğrulandı; işletim sistemi ekran okuyucu sertifikasyonu yapılmadı.

Kanıt dizini: `.impeccable/review/21st-frontend/`. Bu klasör yerel inceleme çıktısıdır ve `.gitignore` kapsamındadır.

| Ekran | Önce | Sonra |
|---|---|---|
| Ana sayfa | [1440](../.impeccable/review/21st-frontend/before/home-1440.png) · [390](../.impeccable/review/21st-frontend/before/home-390.png) | [1440](../.impeccable/review/21st-frontend/after/home-1440.png) · [390](../.impeccable/review/21st-frontend/after/home-390.png) |
| Giriş | [1440](../.impeccable/review/21st-frontend/before/login-1440.png) · [390](../.impeccable/review/21st-frontend/before/login-390.png) | [1440](../.impeccable/review/21st-frontend/after/login-1440.png) · [390](../.impeccable/review/21st-frontend/after/login-390.png) |
| Kayıt | [1440](../.impeccable/review/21st-frontend/before/register-1440.png) · [390](../.impeccable/review/21st-frontend/before/register-390.png) | [1440](../.impeccable/review/21st-frontend/after/register-1440.png) · [390](../.impeccable/review/21st-frontend/after/register-390.png) |
| Oyun | [1440](../.impeccable/review/21st-frontend/before/game-1440.png) · [390](../.impeccable/review/21st-frontend/before/game-390.png) | [1440](../.impeccable/review/21st-frontend/after/game-1440.png) · [390](../.impeccable/review/21st-frontend/after/game-390.png) |

Ek kanıtlar: `after/zoom-*.png`, `after/safari-*.png`, `after/game-active-*.png`, `after/registration-learning-off-empty-catalogue.png` ve `feature-flags.json`. `additional-notes-fixture.png`, gerçek bileşenin test için üretilmiş çok paragraflı içeriğini gösterir; gerçek kullanıcı notu değildir. İlk iki büyütülmüş görüntü yükleme durumunda yakalandığı için hazır içerik beklenerek yenilendi.

Bağımsız görsel inceleme sonucu **ship**: belirtilen pilot ve sağlanan durumlar için maddi düzeltme talebi yok. İnceleme 33 pilot görüntüsü, sekiz önce görüntüsü ve üç Safari görüntüsünü kapsar; tarihsel tasarım seçimi belgelerinin doğrulanması veya tüm ürünün sertifikasyonu değildir. Ayrıntılar [finish-review.md](../.impeccable/review/21st-frontend/finish-review.md) içinde; kaynaklar, lisans sınırları ve MCP durumu [kaynak kaydında](third-party/21st-frontend.md) bulunur.
