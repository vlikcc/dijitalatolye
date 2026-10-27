# Katalog küçük dokunuşları — teslim kaydı

27 Ekim 2026. Kullanıcı ayrıntılı araştırmadaki önerilerin tamamını onayladı. Uygulama mevcut kompakt katalog üzerinde tamamlandı.

## Uygulananlar

1. **Arama vurgusu:** Öneri ve sonuçlarda özgün Türkçe yazım korunarak eşleşen bölüm `<mark>` ile boyanır. Açıklamada bulunan eşleşmeler öneride kısa bir alıntıyla gösterilir. Normalizasyon mevcut aramayla aynıdır; HTML ve regex çalıştırılmaz.
2. **Derse özel metin:** Matematik, Türkçe, Fen Bilimleri ve Hayat Bilgisi başlıklarının altında kısa, sabit açıklamalar bulunur.
3. **Boş sonuçtan çıkış:** Arama, ders veya sınıf ayrı kaldırılabilir; diğer seçimler ve Kaydettiklerim kapsamı korunur. Boş koleksiyon ile filtrelere uymayan koleksiyon farklı açıklanır.
4. **Geri al:** Son kaldırılan kayıt, kart ekrandan kaybolsa bile geri alınabilir. İşlem en güncel yerel kaydı okuyarak yalnız ilgili oyunu ekler. Süre dolumu yoktur; sonraki kaldırma son işlemi değiştirir. Depolama hatası başarı gibi gösterilmez. Klavye odağı geri döner.
5. **Gerçek bekleme:** Yavaş filtre/arama geçişinde “Oyunlar güncelleniyor…” gösterilir; mevcut kartlar görünmeye devam eder. Hızlı geçişte yanıp sönmeyi önlemek için göstergenin görünmesi 150 ms geciktirilir; isteğe yapay gecikme eklenmez.
6. **Kapak dayanıklılığı:** Görsel alanı boyutunu korur, başarılı yeni görsel kısa geçişle belirir, önbellekteki görsel bekletilmez. Hatalı görsel yerine okunabilir oyun adı ve açıklama bulunur.
7. **Kaydet açıklaması:** Fareyle veya klavye odağıyla küçük açıklama açılır; açıklama üstüne gelindiğinde açık kalır ve Escape ile kapanır. Düğmenin erişilebilir adı bağımsızdır.
8. **Arama kısayolu:** `/` aramaya odaklanır. Türkçe klavyenin Shift kombinasyonu desteklenir; metin alanları, IME ve başka denetimler etkilenmez. Dar/dokunmatik ekranda kısayol etiketi gizlenir.
9. **Filtrelere dön:** Yalnız liste gerçekten ekran yüksekliğini aşıyorsa görünür. Klavye odağını sınıf seçimine taşır; azaltılmış hareket tercihinde yumuşak kaydırma yapmaz.
10. **İlk yükleme:** Mevcut kök yükleme sınırında yalnız `/` ve `/kesfet` için kart geometrisine uygun dört statik iskelet kullanılır. Çalışma alanları mevcut genel yükleme metnini kullanır. Filtre geçişleri bu iskeleti kullanmaz.

## Kaynak ve tasarım

[Araştırma](21ST-MICRO-TOUCH-RESEARCH-2026-10-27.md) ve [kanıt kaydı](21ST-MICRO-TOUCH-EVIDENCE-2026-10-27.json): 12 arama, 44 ayrı sonuç kimliği, 12 kaynak incelemesi. UI Build ve katalog becerileri kullanıldı.

Başlıca referanslar: [Highlight Match](https://21st.dev/@klyv-ui/components/highlight-match), [Empty / Filters](https://21st.dev/@cnippet-dev/components/cnippet-empty), [Undo Pill](https://21st.dev/@arihantcodes_1f7b8c4d/components/undo-pill), [Spinner Input Group](https://21st.dev/@sean0205/components/c-spinner-4), [Lazy Image](https://21st.dev/@efferd/components/lazy-image), [Accessible Tooltip](https://21st.dev/@a11ypros/components/a11y-tooltip), [Keyboard Shortcut](https://21st.dev/@shadcnspace/components/kbd-04), [Card Skeleton](https://21st.dev/@uiable/components/uiable-skeleton-card). Kaynaklar davranış ve yerleşim referansıdır; kodları kopyalanmadı. Ders metinleri ve sade dönüş bağlantısı projeye özel yazıldı. Yeni paket, ücretli hizmet veya barındırılan AI üretimi kullanılmadı.

## Dosyalar

- Katalog: `catalog-view.tsx`, `catalog-search-field.tsx`, `game-card.tsx`, `catalog-cover.tsx`, `catalog-return-link.tsx`, `catalog-loading.tsx`.
- Arama: `highlight-text.tsx`, `src/lib/search-highlight.ts`.
- Kayıt ve açıklama: `saved-games.tsx`, `saved-game-feedback.tsx`, `use-button-hint.tsx`, `src/lib/saved-games-store.ts`.
- Bağlantılar ve görünüm: `src/app/layout.tsx`, `src/app/loading.tsx`, `src/app/globals.css`.
- Doğrulama: `tests/search-highlight.test.ts`, `tests/e2e/catalog-micro.spec.ts`; mevcut katalog kontrol ve dokunuş testleri de çalıştırıldı.

## Doğrulama sonuçları

| Kontrol | Sonuç |
|---|---|
| Birim testleri | 15 dosyada 124 test geçti. |
| Tür kontrolü | İzole kaynak tsconfig kontrolü ve üretim derlemesinin TypeScript aşaması geçti. |
| Üretim derlemesi | Başarılı. Eşzamanlı geliştirme sunucularının oluşturduğu tür önbelleklerinden etkilenmemek için kaynak kopyası `.data/micro-build-source` altında derlendi; yeni katalog bileşenleri asıl kaynakla aynı. |
| Chrome üretim tarayıcı testleri | 18 davranış senaryosu geçti. Ayrı JavaScript kapalı senaryo beklenen başarısızlık olarak kayıtlı; aşağıdaki sınıra bakın. Playwright toplamı bu beklenen başarısızlık dahil 19 olarak gösterir. |
| Mobil ve klavye | 320/390 px taşma, 44 px boş durum eylemleri, geri alma odağı, öneriler, Escape, Türkçe Shift+/ ve filtreye dönüş geçti. Mevcut tablet/menü kontrolleri de geçti. |
| Hata ve yarış durumları | Engelli depolama, bozuk kapak, iki sekmeden değişiklik, art arda kaldırma ve yavaş sunucu geçişi doğrulandı. |
| Azaltılmış hareket | Kapak, kaydetme ve gezinme davranışları kontrol edildi. |
| Safari | Yerel Safari'de Türkçe ders başlığı, yeni açıklama ve vurgulu arama önerileri görsel olarak kontrol edildi. Tam Safari otomasyon paketi çalıştırılmadı. |
| 21st review | 0 hata, 0 uyarı; global CSS renkleri için 58 bilgi düzeyinde öneri. |

Testler ayrı yerel test veritabanını kullandı. Veritabanı şeması değiştirilmedi. Üretim doğrulama sunucusu `localhost:3114`; geliştirme önizlemesi `localhost:3113`.

### Bilinen sınır: JavaScript kapalı kullanım

JavaScript tamamen kapatıldığında mevcut kök `loading.tsx`/React akış yapısı katalog HTML'sini gizli bir segmentte bırakıyor; sayfa yükleme durumundan çıkmıyor. Geliştirme ve üretim önizlemelerinde görüldü; genel yükleme metnine dönmek de sorunu çözmedi. Bu çalışma yeni bir Suspense sınırı eklemiyor. İlgili tarayıcı testi `test.fail` ile açıkça izleniyor; JavaScript kapalı tam sayfa desteği geçti sayılmamalıdır. Kapakların CSS'si başlangıçta görselleri gizlemez, fakat bu mevcut sayfa düzeyi sınırlama devam ediyor.

### Kanıtlar

- `.data/micro-build.log`: üretim derlemesi.
- `.data/micro-21st-review.json`: 21st incelemesi.
- `.data/micro-playwright-report/index.html`: tarayıcı raporu ve bilinen başarısızlık.
- `.impeccable/review/catalog-micro/search-desktop.png`: masaüstü arama.
- `.impeccable/review/catalog-micro/undo-320.png`, `undo-390.png`: geri alma.
- `.impeccable/review/catalog-micro/empty-320.png`, `empty-390.png`: dar ekran boş sonuçlar.

Tasarım kararı `.21st/design.json` ve `.21st/DESIGN.md` dosyalarına işlendi.
