> **Geri çekildi — 27 Ekim 2026:** Kullanıcı bu ana sayfa denemesini kaldırdı. Güncel yön: kompakt katalog ve hafif başlık/kart hareketleri. Bu belge tarihsel teslim kaydıdır.

# Ana sayfa · Canlı vitrin

27 Ekim 2026 — Kullanıcının seçtiği Canlı vitrin yönü uygulandı.

Ana sayfa güçlü başlık, dört kullanılabilir dersten seçilen gerçek oyun önizlemesi ve mevcut aramayla açılır. Ders seçimi yalnız vitrindeki oyunu değiştirir; katalogdaki filtreleri değiştirmez. Arama veya filtre uygulanınca vitrin küçülerek mevcut katalog girişine döner. `/kesfet` kompakt düzenini sürdürür.

## Uygulama

- `src/components/home-showcase.tsx`: ders başına gerçek oyun seçimi, sekmeler, kapak, açıklama, sınıf/süre ve Demo/Yayımlandı bilgileri. Boş katalogda mevcut girişe döner. Kapak yoksa veya yüklenemezse yedek görünüm sunar; erken görüntü hataları da yakalanır.
- `src/components/catalog-view.tsx`, `catalog.tsx`, `src/app/page.tsx`: ana sayfa ayrımı ve mevcut aramanın entegrasyonu. Arama öğesi vitrin daralırken aynı React konumunda kalarak odağını ve taslağını korur.
- `src/app/globals.css`: mevcut lacivert, kâğıt, ders renkleri, Manrope ve Source Sans 3 ile duyarlı vitrin. Mobilde iki sütunlu ders seçimi; ok tuşları/Home/End, görünür odak ve azaltılmış hareket desteği.
- `.21st/design.json` ve `.21st/DESIGN.md`: seçilen yönün kalıcı kaydı.

21st referansları: [Hero Carousel](https://21st.dev/@crafterui/components/hero-carousel) ve [Editorial Collage Hero](https://21st.dev/@felipemenezes098/components/hero-04). Kompozisyon ve elle değiştirilen önizleme fikri uyarlandı; kaynak kod kopyalanmadı. Mevcut `CatalogSearchField`, `CatalogIntro`, `detailHref` ve Lucide simgeleri kullanıldı. Yeni paket, ücretli üretim veya veritabanı değişikliği yok.

## Doğrulama

| Kontrol | Sonuç |
| --- | --- |
| `pnpm typecheck` | Geçti |
| `pnpm test` | 14 dosya / 120 test geçti |
| Üretim derlemesi | `.next-home-touch-build` içinde geçti |
| İlgili Playwright kontrolleri | 16 kontrol geçti: üretim koşusunda 14, kalan iki kontrolün düzeltilmiş tekrarında 2 |
| 21st review | 0 hata, 0 uyarı; mevcut genel stil dosyasında 58 bilgi önerisi |
| Gerçek Safari | Ders seçimi, sağ ok/Home tuşları ve görüntü doğrulandı |
| Ekran genişlikleri | 320, 390, 600, 768, 1024, 1440 px; yatay taşma yok |

Tarayıcı kontrolleri ders/oyun eşleşmesini, gerçek kapakları, klavye dolaşımını, aramada odak korunmasını, geçmiş gezinmesini, hızlı filtreleri, azaltılmış hareketi, kapak hatasını ve mevcut kompakt katalog davranışını kapsar. Ayrı yerel test veritabanı kullanıldı.

Eski katalog testleri yeni ana sayfa yerine kompakt `/kesfet` görünümüne taşındı. Test veritabanındaki ek yayınlar ve mevcut benzerlik araması nedeniyle sabit sonuç sayısı/boş arama varsayımları düzeltildi. İlk geliştirme koşusundaki geçici tür dosyası çakışması, son derleme ve testlerin sabit üretim sunucusunda yapılmasıyla giderildi. Projenin tür yapılandırması geri yüklendi.

JavaScript kapalıyken uygulamanın mevcut kök yükleme sınırı katalog yerine “Atölye hazırlanıyor…” gösterir. Bu önceden var olan davranış değiştirilmedi; JavaScript kapalı ana sayfa işlevselliği doğrulanmış olarak sayılmadı.

## Önizleme ve kanıtlar

- Yerel üretim önizlemesi: http://localhost:3111/ — Safari'de açık.
- Görüntüler: `.impeccable/review/home-touch/home-{genişlik}.png` ve `safari-desktop.png`.
- İlk üretim test raporu: `.data/home-touch-playwright-report/index.html`.
- Kalan iki kontrolün başarılı raporu: `.data/home-touch-followup-report/index.html`.
- Derleme ve inceleme kayıtları: `.data/home-touch-build.log`, `.data/home-touch-review.json`.
- Önceki kaynakların yedeği: `.data/home-touch-backup/source-before.tar.gz`.

Üretim sitesine dağıtım yapılmadı; kaynak değişiklikleri ve yerel önizleme hazır.
