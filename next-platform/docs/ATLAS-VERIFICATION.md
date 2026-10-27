# Keşif Atlası — teslim ve doğrulama kaydı

Bu dosya eklemeli bir revizyon günlüğüdür. Aşağıdaki önceki teslimler ve görsel yönler **tarihsel** kayıttır; kendi dönemlerinin test sonuçlarını ve sınırlarını anlatır. Güncel uygulama geneli kapsamı, en sondaki “Ortak uygulama deneyimi” revizyonu ve [UNIFIED-EXPERIENCE.md](UNIFIED-EXPERIENCE.md) tanımlar.

Tarih: 26 Ekim 2026. Uygulama: `next-platform`. Yerel önizleme: `http://localhost:3000`.

## Teslim edilen kapsam

- Ortak katalog modeliyle `/` ve `/kesfet`; birleşik detay/oyun ekranıyla `/icerik/[slug]`.
- Eski `/oyna/[slug]` adresinden `?oyna=1` ile oyunu başlatan yönlendirme.
- Dört derste 16 bağımsız, açıkça demo olarak işaretli, 2–3 etkinlikten oluşan oyun. Seçim, eşleştirme, sıralama ve sınıflandırma mekanikleri.
- Açıklamalı cevap geri bildirimi, ilerleme, sonuç ve yeniden başlatma; sürükleme gerektirmeyen klavye/dokunma kontrolleri.
- URL'de arama/ders/sınıf/kaydedilenler; tarayıcıda kalıcı kaydetme; bağlantı kopyalama ve seçilebilir bağlantı alternatifi.
- Şeffaf puzzle simgesi, yatay marka dosyası, favicon; yerel Manrope/Source Sans 3 fontları; lacivert, mor, turkuaz ve sıcak turuncu marka renkleri.
- Gerçek oyun sahnelerinden 16 kapak. Kod: `src/games/`; bağımsız HTML: `fixtures/atlas/`; raster köken kayıtları: `.impeccable/assets/`.

## Mimari sınırlar

Veritabanı şeması ve dış API sözleşmeleri değişmedi. Demolar `DEMO_CATALOG_ENABLED=true` ile açılır; bayrak varsayılan olarak kapalıdır. Demo iframe'i `sandbox="allow-scripts"` ve kısıtlı CSP kullanır. Öğretmen yüklemeleri mevcut tarama/onay hattını ve ayrı oyun origin'ini kullanır. Öğrenci hesapları, sınıf/ödev takibi ve canlı dağıtım eklenmedi.

Yerel uçtan uca test, test öğretmeni tarafından yüklenen bir mevcut örneği gerçek inceleme hattından yayımlar. Bu nedenle yerel katalogda 16 paketli demoya ek olarak bir öğretmen paylaşımı görülebilir; toplam içerik sayısı gerçek kayıtlardan hesaplanır.

## Doğrulama

- TypeScript: başarılı.
- Vitest: 3 dosyada 28 test başarılı.
- Next.js production build ve Docker web build: başarılı. `public/` içindeki logo/kapaklar standalone pakete dahil edildi.
- Mevcut yaşam döngüsü E2E testi: başarılı. Kayıt, e-posta doğrulama, giriş, yükleme, ClamAV/YARA taraması, editör 2FA, önizleme, onay, ayrı origin'de oyun, yayından kaldırma ve yeniden yayınlama kontrol edildi.
- Bayrak kapalı kontrolü: HTML oyun adresi 404; detay Next.js bulunamadı sınırına düşüyor; katalogda paketli demo bağlantıları yok. Akışlı detay yanıtının HTTP durumu Next.js davranışı nedeniyle 200 olabilir; içerik bulunamadı ekranıdır.
- Temel kontrast ölçümleri: lacivert/lavanta 14,76:1; ikincil metin/lavanta 5,21:1; beyaz/mor 5,99:1; oyun hata/beyaz 6,91:1; doğru geri bildirim/beyaz 7,31:1.
- Raster köken taraması: 20 dosya, eksik kayıt yok.
- Oyun belgelerinde fontlar Latin/Latin Extended WOFF verileri ve lisanslarıyla gömülüdür. Başlıklar Manrope, kontroller ve sahne etiketleri Source Sans 3 kullanır; sonuç ekranı aynı çizgi kalınlığında SVG simge taşır.

- Atlas E2E: 20 test başarılı. 16 oyunun her turunda yanlış/doğru cevap, tamamlama ve yeniden başlatma; birleşik filtreler, boş sonuç, kaydetme/yenileme, geri dönüş, otomatik başlatma, iframe sandbox, tam ekran ve paylaşım alternatifi test edildi.
- 390, 768, 1280 ve 1440 pikselde iki ana ekran görüntülendi; yatay taşma bulunmadı. Klavye atlama bağlantısı, görünür odak ve azaltılmış hareket davranışı doğrulandı.

## Bağımsız Impeccable incelemesi

İlk görüntü denetiminde yükleme ekranı ve henüz yüklenmemiş kapaklar nedeniyle yeniden çekim istendi. Yakalama yordamı, gerçek sayfa içeriğini/fontları bekleyecek, tüm görselleri kaydırarak yükleyip çözümleyecek biçimde düzeltildi.

Tam inceleme iki maddi düzeltme istedi: iframe içindeki Arial yazı tipini marka fontlarıyla eşleştirmek ve sonuç ekranındaki Unicode onay işaretini çizilmiş SVG simgeyle değiştirmek. İki düzeltme tek turda uygulandı; 16 kapak/HTML yeniden üretildi, köken kayıtları işlendi ve 22 ekran görüntüsü yeniden incelendi.

Son karar **ship**: her iki bulgu **resolved** olarak değerlendirildi. Bu karar iki düzeltmenin doğrulanması kapsamındadır; yeniden yapılmış sınırsız bir bütün-ürün onayı değildir. Tam rapor `.impeccable/review/finish-review.md`, düzeltme kararı `.impeccable/review/finish-verdict.md` içindedir. Yeni tasarım belgeleri `DESIGN.md`, `.impeccable/design.json` ve `.impeccable/direction.md` üzerinden tutulur.

Kullanıcının açıkça onayladığı Keşif Atlası yönü esas alındı. Kurulu Impeccable sürümünün daha yeni `seed-reference` alanını sunmaması nedeniyle roll kökeni bağımsız olarak doğrulanmış sayılmadı. Mekanik detector bir kez çalıştırıldı; çıktısı araç bağlamında kırpıldığı için temiz detector sonucu iddia edilmez. Bağımsız görsel inceleme ve yukarıdaki somut testler teslim kanıtıdır.

## Görsel kanıtlar

`.impeccable/review/` içinde katalog ve detay ekranlarının 390, 768, 1280 ve 1440 piksel genişlikte tam sayfa görüntüleri bulunur: `catalog-<width>.png`, `detail-<width>.png`. 390/1440 için ilk görünüm ayrıca `-viewport.png` son ekiyle kaydedilir. `playing-390.png`, `playing-1440.png`, `filters-390.png`, `empty-390.png`, `login-390.png`, `completed-390.png`, `completed-1440.png` ve `focus-desktop.png` etkileşim durumlarını gösterir. `teacher-desktop.png` ve `upload-mobile.png` mevcut öğretmen akışının yeni kimlikle görünümüdür.

## Çalıştırma

Yerel Docker servisleri `deploy/compose.dev.yml`, `deploy/compose.worker-dev.yml` ve `deploy/compose.web-dev.yml` ile çalışır. Web `localhost:3000`, ayrı oyun sunucusu `*.games.localhost:58080` adresindedir. Testler `tests/e2e/atlas.spec.ts` ve `tests/e2e/lifecycle.spec.ts` içinde; aynı çıktı diziniyle eşzamanlı iki Playwright süreci çalıştırılmamalıdır.

İlk kontrollerdeki 3001/3000 origin uyuşmazlığı mevcut güvenlik izinlerini genişletmeden, yeni web imajını yerel 3000 servisine alarak giderildi. Canlı ortama dağıtım yapılmadı.

## Oyuncu yerleşimi ve sinema modu — 26 Ekim 2026

Önizleme ve oynatma aynı, görünür ekran yüksekliğiyle sınırlı çerçeveyi kullanır. Oyun başlatıldığında veya ekran döndürüldüğünde oyuncu anında görünür konuma gelir. Sinema düğmesi mevcut iframe'i genişleterek bilgi panelini alta taşır; tam ekran, sinema ve standart mod arasında oyun ilerlemesi korunur. Sinemadan düğmeyle veya demo içindeyken de Escape ile çıkılır.

Demo belgeleri ekran oranına göre sahne/soru yerleşimini değiştirir, ardından aktif içeriği ölçerek gerektiğinde orantılı küçültür. Geri bildirim, sonraki etkinlik, sıralama parçaları ve sonuç ekranı aynı ölçüme dahildir. Öğretmen yüklemeleri sınırlı iframe alanını kullanır; kendi iç yerleşimlerini otomatik ölçekleme bu değişikliğin kapsamında değildir. Sandbox veya ayrı origin politikaları değişmedi. `fixtures/atlas/` içindeki 16 bağımsız belge de güncellendi.

- TypeScript ve Next.js production build başarılı; standalone hazırlama adımı çalıştırıldı.
- 5 Atlas birim testi ve 30 Playwright testi başarılı. Paket 16 oyunun tüm turlarını, altı ekran boyutunu (1366×768, 1280×720, 768×1024, 390×844, 320×568, 844×390), modlar arası ilerlemeyi, klavye kullanımını ve oynarken ekran döndürmeyi kapsar.
- Mobil/yatay ekranda eşleştirme, sıralama ve sınıflandırmanın her adımında içerik sınırları ölçüldü; başlatmadan sonra oyuncu yüksekliğinin değişmediği doğrulandı.
- Son görseller: `.impeccable/review/player-standard-1366.png`, `player-cinema-1366.png`, `player-standard-390.png`, `player-cinema-390.png`. Masaüstü ve mobil görüntüler gözle incelendi.
- Mekanik tarama 76 advisory bulgu verdi; mevcut genel CSS renk/yazı boyutu kayıtlarıyla ilgiliydi. Oyuncu TypeScript'i ve yeni demo yerleşiminde bulgu yok. Bağımsız dar kapsamlı kaynak/görsel incelemede maddi kusur bulunmadı.
- Doğrulama önizlemesi `http://localhost:3001/icerik/demo-yonunu-bul`; mevcut geliştirme veritabanındaki şema farkı nedeniyle ayrı `dijital_player_layout_test` veritabanıyla çalışır. Canlı dağıtım yapılmadı.

## Kompakt keşif ve logo hareketi — 27 Ekim 2026

Ana sayfa ve filtresiz keşif görünümü kısa başlık, arama, ders filtreleri, sonuç sayısı ve oyun kartlarından oluşur. Büyük vitrin ve önizleme seçicisi kaldırıldı. Sabit mor/turkuaz arka plan geçişi kartlara doğru kaybolur. Filtreli ve kaydedilmiş görünümler bağlamsal başlıklarını korur.

Üst menüde turkuaz puzzle parçası, orijinal görsele uygulanan tamamlayıcı SVG maskeleriyle bir kez yerine oturur. 100 ms gecikme ve 600 ms hareket sonunda orijinal raster gösterilir. Footer statiktir; sayfa içi gezinme hareketi yeniden başlatmaz. Azaltılmış hareket tercihinde ve JavaScript çalışmadığında tamamlanmış logo görünür.

- TypeScript ve üretim derlemesi başarılı; standalone hazırlama adımı çalıştırıldı.
- 7 ilgili Playwright testi geçti: beş ekran genişliğinde yerleşim, logo hareketinin bitişi/tekrarlanmaması, azaltılmış hareket, arama önerileri ve klavye, sınıf/ders filtreleri, kaydetme ve geri dönüş akışları.
- 320, 390, 600, 768 ve 1440 px genişlikleri gözle kontrol edildi. 1440×900'de ilk dört kart bütünüyle; 390×844'te ilk kartın görseli ve başlığı kaydırmadan görünür. Yatay taşma yok.
- Güncel görüntüler: `.impeccable/review/compact-discovery/desktop.png` ve `mobile.png`.
- Mekanik tarama yalnız advisory bulgular verdi (67); yeni logo bileşeninde bulgu yok. Genel CSS token tavsiyeleri bu dar kapsamlı değişiklikte topluca dönüştürülmedi.
- Önizleme `http://localhost:3001/` adresinde. Oyun oynatıcı, dış API ve veritabanı şeması değişmedi.

## Keşif tezgâhı ve çizgiden renge imza — 27 Ekim 2026

Önceki kompakt keşif düzeni bu revizyonla yenilendi. 76 px header (telefonda 64 px), Oyunlar / Kaydettiklerim grubunu öğretmen işlemlerinden ayırır. 1100 px altında etiketli Menü tüm bağlantıları gösterir; Escape odağı düğmeye döndürür, dışarı tıklama ve bağlantı seçimi paneli kapatır. Aramanın yanındaki tekrarlayan kaydedilenler bağlantısı kaldırıldı.

1024 px üzerinde başlık aramanın solunda; daha dar ekranlarda üstündedir. Ortak şeritteki sınıf ve ders seçimleri anında uygulanır; 768 px altında ikisi de görünür, etiketli seçim alanlarıdır. Metin yalnızca Enter / Ara ile uygulanır. Gönderilmemiş metin filtre değişiminde korunur, bekleyen istek sırasında peş peşe seçimler birleşir. Uygulanmış durum URL'de tutulur; temizleme kaydedilmiş görünümü korur.

Logo imzası orijinal görselin piksellerini dört tamamlayıcı SVG maskesiyle gösterir: bağlantı çizgileri 0–300 ms, renkler 200–800 ms, orijinal rastera dönüş 900 ms. Marka yazısı ve logo boyutları sabittir. Belge başına bir kez çalışır; gezinmede veya footer'da tekrarlanmaz. Azaltılmış hareket ve JavaScript kapalı durumları statik orijinal görseli gösterir. Yeni kütüphane eklenmedi.

- TypeScript kontrolü ve `next build --webpack` üretim derlemesi başarılı. Dev sunucusuyla çakışmaması için ayrı çıktı dizini kullanıldı; derlemenin eklediği geçici TypeScript yolları temizlendi, çıktı `/private/tmp/dijital-workbench-build-20261027` altında tutuldu.
- 11 ilgili Playwright testi geçti: altı genişlikte yerleşim/menü/öneriler, ilk ekran kabul ölçütleri, anında filtreler, taslak arama, geciktirilmiş istekte ardışık seçimler, geri/ileri, boş sonuçlar, kaydetme/oyundan dönüş, öğretmen giriş bağlantıları, logo evreleri/tekrarlanmaması ve azaltılmış hareket/JavaScript kapalı durumları.
- 320, 390, 600, 768, 1024 ve 1440 px görüntüleri gözle incelendi. 1440×900'de ilk dört kart, 390×844'te ilk kartın görseli ve başlığı görünür; yatay taşma yok. Üç logo evresi ayrıca görüntülendi; animasyon sırasında sınır kutusu değişmiyor.
- Görseller `.impeccable/review/discovery-workbench/` altında: genişlik adlarıyla altı ekran ve `logo-drawing.png`, `logo-color.png`, `logo-complete.png`. Önceki revizyonların görselleri tarihsel kanıttır.
- Önizleme `http://localhost:3001/` adresinde çalışıyor. Oyun kartları, oynatıcı, sinema/tam ekran, dış API ve veritabanı şeması değiştirilmedi.


## Sıcak zemin ve Nunito — 27 Ekim 2026

Beğenilen keşif tezgâhının yerleşimi korundu. Katalog zemini `#F8F7F3`, ortak header `#FFFEFB`, metin `#292735`, ikincil metin `#66636B`, eylem/odak `#65518A`, hover `#53416F`, seçili zemin `#EEEAF3` oldu. Kartlar ve arama beyaz; ders renkleri ve orijinal puzzle pikselleri korunur. Üst mor/turkuaz gradient kaldırıldı. Katalog altındaki öğretmen daveti de beyaz yüzey ve aynı metin renklerini kullanır. Öğretmen ekranları ve oynatıcıya toplu palet değişikliği uygulanmadı.

İki sabit çizgi parçası, özgün puzzle'ın üst bağlantı çizgisinden türetildi (`public/brand/puzzle-seam.svg`). 140 px, 2 px ve %6 mürekkep opaklığı; yalnız dış yan boşluklarda, içerikten en az 12 px uzakta, header altındaki 260 px içinde aşağıya doğru solar. 1200 px altında gizlidir. Doku veya tekrar eden ikon eklenmedi.

Filtresiz başlık “Oynadıkça yerine oturur.” ve açıklama “Matematikten Türkçeye, sınıfına uygun bir oyun seç.” oldu. Başlık Nunito 800, 32/28 px ve 1.2 satır yüksekliğinde; marka adı Nunito 900 ve mürekkep renginde. Diğer yazı karakterleri, bağlamsal başlıklar ve logo hareketi korundu. Fontsource Nunito 5.3.0 yerelden sunulur; Latin ve Latin Extended dosyaları ile `/licenses/Nunito-OFL.txt` lisansı dağıtıma dahil edildi.

- 13 ilgili tarayıcı kontrolü geçti: altı genişlikte yerleşim; menü/odak/öneriler; birleşik filtreler ve taslak sorgu; hızlı seçimler, geri/ileri, kaydetme ve oyundan dönüş; boş/kaydedilmiş görünüm; logo hareketi ve azaltılmış hareket/JavaScript kapalı durumları; palet kapsamı, kontrast, motif sınırları ve font yüklenmesi. İlk toplu çalışmadaki hızlı seçim kontrolü, eşzamanlı derleme sırasında zaman aşımına uğradı; sunucu sabitken aynı test değişiklik yapılmadan 2.5 saniyede geçti.
- 320, 390, 600, 768, 1024 ve 1440 px görüntüleri incelendi. 1440×900'de ilk dört kart tam görünür; 390×844'te ilk kartın tamamı görünür. 320 px başlık iki satırdır, yatay taşma yoktur. Motif sınırları ayrıca 1200 ve 1920 px'de doğrulandı.
- Nunito yüklenmesi geciktirilerek 320/390/1024/1440 px'de ölçüldü: ilk kartta dikey kayma 0 px. Font kaynaklı toplam layout-shift 0 / 0 / 0 / 0.000307. Türkçe `İı Şş Ğğ Çç Öö Üü` karakterleri yüklenir; tüm font ağ istekleri aynı yerel kaynağa gider.
- Metin kontrastı: ana metin 13.64:1, ikincil metin 5.50:1, Ara düğmesindeki beyaz metin 6.78:1. Arama odağı yeni mor tonu kullanır.
- TypeScript ve `next build --webpack` üretim derlemesi başarılı. Ayrı derleme çıktısı `/private/tmp/dijital-warm-build-20261027` altında; standalone varlıkları hazırlandı ve ortam dosyaları çıkarıldı. Yalnız bu derlemenin eklediği TypeScript yolları temizlendi.
- Güncel ekranlar `.impeccable/review/warm-discovery/{320,390,600,768,1024,1440}.png`; font ölçümleri `font-loading.json`. Görüntülerde geliştirme araçlarının yüzen düğmesi yalnız ekran yakalama sırasında gizlenmiştir.
- Yerel önizleme: `http://localhost:3001/`. Dağıtım, API, veri modeli ve URL değişikliği yapılmadı.


## Nötr kâğıt, lacivert ve Manrope — 27 Ekim 2026

Önceki sıcak zemin/Nunito revizyonunun yerini kullanıcının onayladığı nötr kâğıt yönü aldı. Beğenilen header, başlık–arama hizası ve ortak filtre şeridi korunur. Ortak header ve katalog zemini `#F6F7F9`, metin/eylem/marka `#24344D`, ikincil metin `#606A79`, hover `#17263C`, seçili zemin `#E8EDF4`, ayırıcı `#DDE2E8`, giriş kenarlığı `#8A94A4`, klavye odağı `#3B5F8C` oldu. Öğretmen ve oynatıcı kök paletleri değiştirilmedi.

Başlık Manrope 750, 32/28 px, 1.25 satır yüksekliği ve −0.03em harf aralığı kullanır. Marka adı Manrope 800'e döndü. Source Sans 3 arayüz yazıları, mevcut slogan/açıklama, bağlamsal başlıklar ve puzzle hareketi korundu. Nunito bağımlılığı, kullanılmayan lisansı ve büyük puzzle çizgi dekoru kaldırıldı.

`public/textures/paper-001.webp`, ambientCG Paper001'in düz renk haritasından hazırlanmış 68.584 baytlık yerel CC0 varlığıdır; küre önizlemesi kullanılmadı. Kaynak ve lisans bilgisi hem XMP hem yan JSON kaydında bulunur. CSS, lifleri gri tona getirir ve %5 opaklıkla header'dan ilk kart sırasına doğru soldurur. Katman metnin ve beyaz kontrollerin arkasındadır; dosya yüklenmezse nötr zemin aynen kalır. Renkli gradient, tekrar eden simge veya yeni dekoratif hareket eklenmedi.

- 14 ilgili Playwright testi tek son çalışmada başarılı (51,7 saniye): altı genişlikte yerleşim, menü/öneri/seçim/klavye, taslak ve uygulanmış arama, birleşik/hızlı filtreler, geri–ileri, kaydetme ve oyundan dönüş, boş ve kaydedilmiş görünümler, logo/azaltılmış hareket/JavaScript kapalı, palet kapsamı, kontrast, geciken font ve yüklenemeyen doku.
- 320, 390, 600, 768, 1024 ve 1440 px görüntüleri gerçek kapaklarla gözle incelendi. 1440×900'de ilk dört kart bütünüyle, 390×844'te ilk kartın görseli ve başlığı görünür. Başlık 320 px'de iki satırdır; yatay taşma bulunmadı. Açık mobil menü, arama önerileri ve ders listesi ayrıca incelendi.
- Font yüklenirken sonuç satırındaki 1 px değişim hizalamayla düzeltildi. Son ölçümde 320/390/1024/1440 px için ilk kartın dikey kayması 0 px; her ölçümde font layout-shift değeri 0,00025'in altında. Türkçe karakterler yerel Latin/Latin Extended fontlarla doğrulandı.
- TypeScript ve `next build --webpack` üretim derlemesi başarılı. Standalone dosyaları `/private/tmp/dijital-paper-build-20261027` altında; varlıklar dahil edildi, ortam dosyaları çıkarıldı, yalnız bu derlemenin eklediği TypeScript yolları temizlendi.
- Bağımsız, taze bağlamlı görsel/kaynak incelemesi **ship** kararı verdi; bu revizyon kapsamında maddi bulgu yok. Etkileşim ve yükleme değerlendirmesi kaydedilmiş test kanıtı ve kaynak incelemesine dayanır. Mekanik taramada 0 ana bulgu ve 63 advisory kayıt vardı; eski tasarım token belgeleri tarama sırasında henüz güncellenmemişti.
- Güncel kanıtlar `.impeccable/review/paper-discovery/` altında: altı genişlik görüntüsü, `desktop.png`/`mobile.png` tam sayfa, açık kontrol ve logo evreleri, `font-loading.json`, `verification.json` ve `review.md`. Önceki revizyon kayıtları tarihsel kanıttır.
- Önizleme `http://localhost:3001/`. API, veri modeli, URL sözleşmesi, oyuncu ve sinema/tam ekran davranışı değişmedi; dağıtım yapılmadı.

## Ortak uygulama deneyimi — 27 Ekim 2026 (güncel revizyon)

Nötr kâğıt/lacivert Keşif Atlası, onaylanan kapsamla oyun detayına, ortak hesap ekranlarına ve tüm rol çalışma alanlarına genişletildi. Açık footer, seçili görev menüleri, ortalanmış tek başlangıçlı oynatıcı, ortak giriş/kayıt ve Yönetici (`editor`) / Admin (`admin`) yetki ayrımı uygulanmıştır. Öğrenci kayıt bağlantısı `/kayit?tur=ogrenci`, ortak giriş `/giris` oldu; eski öğrenci adresleri yönlendirilir. Ders renkleri, oyunların iç tasarımı, SDK ilerlemesi, özgün puzzle ve hareket korunur.

Güncel kapsam, rol tablosu, oturumdan geri dönüş kuralları, masaüstü/mobil görüntüler ve inceleme kaydı [UNIFIED-EXPERIENCE.md](UNIFIED-EXPERIENCE.md) içindedir. Bu revizyonun TypeScript ve üretim derlemesi, 59 birim, 29 entegrasyon ve toplam 55 farklı tarayıcı senaryosu başarılıdır; odaklı tekrarlar benzersiz test sayısına eklenmez. Bağımsız incelemenin son durumu aynı kayıtta, gerçek değerlendirme kapsamıyla belirtilir.

Önceki bölümdeki “öğretmen ve oynatıcı kök paletleri değiştirilmedi” cümlesi yalnız önceki dar keşif revizyonunu tanımlar. Güncel kök tokenlar [DESIGN.md](../DESIGN.md) ve [design.json](../.impeccable/design.json) içinde eşlenmiştir. Üretim özelliği açılmadı, canlı migration/veri taşıması veya dağıtım yapılmadı.
