> **Geri çekildi — 27 Ekim 2026:** Kullanıcı bu ana sayfa denemesini kaldırdı. Güncel yön: kompakt katalog ve hafif başlık/kart hareketleri. Bu belge tarihsel teslim kaydıdır.

# Ana sayfa: yapboz ve tek soruluk deneme

27 Ekim 2026. Kullanıcının onayladığı yapboz seçici + tek soruluk deneme, Canlı vitrin içine uygulandı.

Dersler birbirine geçen dört SVG yapboz parçasından seçilir. Gerçek demo oyununun ilk etkinliğinden bir soru gösterilir. Yanlış cevap tekrar denemeye izin verir; doğru cevap açıklamayı ve “Oyunun tamamını oyna” bağlantısını açar. Tam oyun başlangıçtan oynanır; örnek cevap ilerleme olarak aktarılmaz. Deneme sonuçları kaydedilmez. Ders değiştirmek ya da “Baştan dene” düğmesi örnek cevabı sıfırlar.

## Kaynaklar ve sınırlar

- Mevcut Manrope, Source Sans 3, ders renkleri, Lucide simgeleri, oyun kapakları ve katalog bileşenleri kullanıldı.
- 21st kataloğunda etkileşimli seçim/quiz örnekleri arandı. Yapboz geometrisi ve mini deneme bu projeye özel yazıldı; yeni bağımlılık veya ücretli üretim yok.
- Yalnız katalogda mevcut olan, `kind: demo` oyunları için soru hazırlanır. Demo bayrağı kapalıysa gizli bir demo vitrinde açılmaz. Yayımlanmış öğretmen oyunlarında örnek soru yoksa kapak ve gerçek oyun bağlantısı korunur.
- Seçim, eşleştirme, sıralama ve gruplama soruları kaynak demo içeriğinden türetilir. Boş/geçersiz soru sunulmaz.
- Sorular sunucuda hazırlanır; yalnız vitrindeki oyunların küçük soru verisi istemciye aktarılır. Tüm demo soru koleksiyonu istemci modülüne alınmaz.

## Değişen alanlar

- `src/components/home-showcase.tsx`: yapboz parçaları, ders seçimi ve mini deneme yerleşimi.
- `src/components/home-mini-game.tsx`: cevap, geri bildirim, sıfırlama ve tam oyuna geçiş.
- `src/games/preview.ts`, `src/lib/featured-games.ts`: gerçek kaynaktan soru ve farklı derslerden oyun seçimi.
- `src/components/catalog.tsx`, `catalog-view.tsx`: sunucu/istemci veri aktarımı.
- `src/app/globals.css`: duyarlı yapboz ve deneme stilleri.
- `.21st/design.json`, `.21st/DESIGN.md`: onaylanan yönün kaydı.

## Doğrulama

- Tür kontrolü ve ayrı dizinde üretim derlemesi geçti.
- 15 dosyada 128 birim testi geçti; 8 test yeni soru dönüştürme, kaynak bütünlüğü, boş katalog ve örneksiz oyun davranışını kapsar.
- 9 ilgili Playwright testi geçti: 320–1440 px, dört ders, yanlış/doğru cevap, sıfırlama ve odak, ders değişiminde cevap temizliği, azaltılmış hareket, kapak hatası, arama/filtreler ve klavyeyle tam oyunu açma.
- Gerçek Safari'de üretim önizlemesi açıldı; yanlış/doğru cevap, ders seçimi ve klavye geçişleri doğrulandı.
- 21st review: 0 hata, 0 uyarı; genel stil dosyasında 58 bilgi önerisi.
- Ayrı yerel test veritabanı kullanıldı. Deneme etkileşimleri öğrenme kayıt API'sine POST göndermiyor.

Önizleme: http://localhost:3112/ (Safari'de başlangıç durumunda açık). Önceki Canlı vitrin: http://localhost:3111/.

Görüntüler `.impeccable/review/home-puzzle/` altında; `home-390.png`, `home-1440.png`, `answer-390.png`, `safari-desktop.png` ve `safari-answer.png`.

Test raporu `.data/home-puzzle-playwright-report/index.html`, derleme kaydı `.data/home-puzzle-build.log`, önceki kaynak yedeği `.data/home-puzzle-backup/source-before.tar.gz`. Tür yapılandırmasındaki geçici derleme değişiklikleri geri yüklendi. Canlı siteye dağıtım yapılmadı.
