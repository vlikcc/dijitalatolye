# Dijital Oyun Atölyesi — küçük arayüz dokunuşları araştırması

27 Ekim 2026 · Araştırma ve öneri

Sonraki durum: Kullanıcı tüm önerileri onayladı; uygulama ve doğrulama sonuçları [teslim kaydında](CATALOG-MICRO-TOUCHES-DELIVERY.md). Aşağıdaki araştırma, uygulama öncesindeki bulgu ve önerileri korur.

## Sonuç

En uygun sonraki adım, mevcut sade kataloğun içinde aramayı daha anlaşılır, ders kimliğini daha belirgin ve küçük işlemleri daha güvenilir yapmak. İlk görsel paket için **arama eşleşmelerinin vurgulanması + derse özel kısa açıklama** öneriyorum. Bunlara **sonuç bulunamadığında bağlamı koruyan çıkışlar** eklenirse küçük, tamamlanmış bir iyileştirme paketi oluşur. Kaydı kaldırmayı geri alma ve gerçek bekleme durumu ikinci pakette ele alınabilir.

Bu belge yeni bir ana sayfa tasarımı önermiyor. Onaylanan başlık, ders rengiyle alt çizgi, katalog düzeni ve kartlar önerilerin temelidir. Büyük vitrin, yapboz seçici, tek soruluk deneme ve arama yanındaki dekoratif oyun görselleri geri getirilmez.

## Araştırma yöntemi ve sınırları

- 21st **UI Build** yaklaşımıyla `.21st/design.json`, `.21st/DESIGN.md`, mevcut bileşenler ve ürün kararları karşılaştırıldı.
- 21st katalog bağlantısı üzerinden **12 arama yapıldı; 44 ayrı sonuç kimliği** incelendi. Aynı bileşen ailesinin farklı örnekleri bulunabildiğinden bu sayı 44 bağımsız kütüphane anlamına gelmez.
- Seçilen **12 örneğin ana bileşen kaynak kodu** okundu. İçe aktarımlar, durum yönetimi, klavye davranışı ve projeye uyarlama ihtiyacı değerlendirildi. Katalog açıklaması, kodun gerçekten yaptığı şeyden ayrıldı.
- Yerel önizlemede Türkçe ders filtresi, `sözcük` arama önerileri ve `uzay gemisi` aramasının boş sonuç durumu incelendi. Önerilerin mevcut davranışla çakışıp çakışmadığı kaynak koduyla karşılaştırıldı.
- Bu turda uygulamanın kaynak kodu ve bağımlılıkları değiştirilmedi; yeni özellikler tarayıcıda uygulanmış veya Safari'de doğrulanmış sayılmamalıdır. Aşağıdaki mobil ve erişilebilirlik maddeleri uygulama kabul koşullarıdır.
- Katalog kodları projeye kopyalanmadı. Barındırılan AI üretimi kullanılmadı. Önerilerin mevcut React, CSS, Lucide ve Radix altyapısıyla, yeni paket eklemeden uygulanması hedefleniyor.

Arama sonuçları, bağlantılar ve incelenen bileşenlerin bağımlılık dökümü: [araştırma kanıt kaydı](21ST-MICRO-TOUCH-EVIDENCE-2026-10-27.json).

## Mevcut arayüzde zaten bulunanlar

Başlık alt çizgisi, ders rengine göre başlık vurgusu, dersler arasında kayan seçim çizgisi, kartın hover/focus tepkisi, küçük ok hareketi, kaldırılabilir filtre etiketleri ve kaydetme onayı zaten var. Bunları yeni öneri gibi sunmak doğru olmaz.

Arama alanında gerçek oyunlardan öneriler, ok tuşları, Escape ve mobil klavyeye göre konumlanan öneri listesi bulunuyor. Oyun detayında paylaşım paneli, kopyalama onayı, öğretmen notlarının açılması, ilgili oyunlar ve filtreli sonuçlara geri dönüş de mevcut.

Bu nedenle yeni bir arama kutusu, açılır komut merkezi, paylaşım paneli veya ikinci bir filtre çubuğu düşük değer taşır. Asıl fırsat mevcut bileşenlerin belirli durumlarını tamamlamaktır.

## Öncelik karşılaştırması

Eforlar göreli mühendislik değerlendirmesidir; ölçülmüş süre, dönüşüm artışı veya performans kazancı değildir.

| Dokunuş | Nerede hissedilir? | Görsel değişim | Efor | Öneri |
|---|---|---|---|---|
| Aranan sözcüğü vurgulama | Arama önerileri ve sonuç başlıkları | Küçük, belirgin | Küçük–orta | İlk paket |
| Derse özel kısa açıklama | Ders başlığının hemen altı | Çok küçük, markaya yakın | Küçük | İlk paket |
| Bağlama uygun boş sonuç | Sonuç bulunamayan aramalar | Yalnız gerektiğinde | Küçük–orta | İlk paket |
| Kayıttan kaldırmayı geri alma | Özellikle Kaydettiklerim | Küçük işlem bildirimi | Orta | İkinci paket |
| Gerçek bekleme geri bildirimi | Arama/filtre geçişi | Çok küçük | Küçük | İkinci paket |
| Kapak yükleme ve hata görünümü | Yavaş veya başarısız görseller | Küçük | Küçük–orta | İkinci paket |
| Simgelerde kısa açıklama | Kaydet gibi yalnız simgeli düğmeler | Hover/focus sırasında | Orta | İsteğe bağlı |
| Aramaya klavye kısayolu | Sık kullanan masaüstü ziyaretçi | Çok küçük | Küçük–orta | Sonra |
| Filtrelere dönüş bağlantısı | Uzun sonuç listesi | Çok küçük | Küçük | Liste uzarsa |
| İlk yükleme için kart iskeleti | İlk sayfa yüklemesi | Geçici | Orta | Yavaşlık ölçülürse |

## 1. Aranan sözcüğü sonuçta görünür kılmak

**Örnek:** Kullanıcı `sözcük` yazdığında önerideki “Sözcük Eşleri” başlığının yalnız eşleşen kısmı hafif bir renkle vurgulanır. Seçili ders varsa o dersin açık tonu, tüm oyunlarda mevcut amber tonu kullanılabilir. Metin lacivert kalır. Harfler hareket etmez; yazı genişliği değişmez.

21st kaynağı: [Highlight Match — klyv-ui](https://21st.dev/@klyv-ui/components/highlight-match).

Kaynak, eşleşmeleri `<mark>` ile üretir; regex özel karakterlerini kaçırır ve normalize edilmiş metindeki konumları özgün metne eşler. Bu, güvenli metin işleme için yararlı bir örnek. Ancak varsayılan olarak sorguyu kelimelere ayırıyor ve Türkçe `ı` harfini projenin aramasıyla aynı biçimde işlemiyor. Doğrudan eklenirse aramanın bulduğu sözcük ile boyanan sözcük farklılaşabilir.

**Uyarlama:** Mevcut `normalizeSearch` davranışı korunmalı; özgün metne konum eşlemesi bununla uyumlu kurulmalı. Önce öneri başlıkları, sonra gönderilmiş sorguya ait kart başlıkları ele alınabilir. Eşleşme yalnız açıklamadaysa başlıkta olmayan bir bölüm boyanmamalı. Örneğin mevcut aramada `sözcük`, açıklaması nedeniyle “Cümle Ustası”nı da getiriyor. Gerekirse kısa eşleşen açıklama parçası gösterilir; bütün açıklama otomatik genişletilmez.

**Kabul:** `I/İ/ı/i`, `ş/ğ/ö/ü/ç`, parantez ve `+` gibi karakterler; boş sorgu; uzun başlık; klavyeyle seçili öneri ve renk vurgusunun birlikte okunabilmesi. HTML metin olarak işlenmeli, `innerHTML` kullanılmamalı. Mobilde ek sütun veya düğme gerekmez.

## 2. Dersin sesini kısa açıklamaya taşımak

Seçili ders adı zaten o dersin renginde alt çizgi taşıyor. Bunun altındaki tek satır da derse göre değişebilir:

| Ders | Önerilen açıklama |
|---|---|
| Matematik | Bir yol dene, çözümü keşfet. |
| Türkçe | Sözcüklerle düşün, anlamı keşfet. |
| Fen Bilimleri | Soru sor, bağlantıları keşfet. |
| Hayat Bilgisi | Günlük hayatı oyunla keşfet. |

Bu, **projeye özel editoryal önerimdir**; katalogda bulunmuş hazır bir bileşen olarak sunulmuyor. Yer, yazı boyutu ve satır aralığı aynı kalır. Yeni başlık alanı veya dönen metin eklenmez. Bütün oyunlarda mevcut genel açıklama korunur; tanınmayan derslerde genel metne dönülür.

Katkısı, ders seçiminin sayfanın diline de yansımasıdır. Küçük bir görsel dokunuş isteyen kullanıcı için en az müdahaleli seçeneklerden biri. Mobilde iki satıra çıkması, uzun ders adları ve ekran okuyucu duyurularının gereksiz tekrarlanmaması kontrol edilir.

## 3. Sonuç yokken bağlamı koruyan yardım

Mevcut görünümde boş sonuç mesajı geneldir; ana düğme `/kesfet` adresine giderek bütün arama bağlamından çıkar. Üstteki filtre etiketleri tek tek kaldırılabiliyor; önerilen değişiklik, aynı işlemi boş sonuç alanında anlaşılır bir sonraki adım olarak sunmak.

Örneğin Türkçe + `uzay gemisi` aramasında:

> Bu aramayla eşleşen bir oyun bulamadık.
>
> **Aramayı temizle** · Diğer derslerde ara

İlk eylem yalnız sorguyu; ikincisi yalnız ders filtresini kaldırır. Sınıf ve kayıtlı oyun kapsamı varsa korunur. Hangi filtre etkinse uygun eylem gösterilir. Bu eylemlerin mutlaka sonuç getireceği iddia edilmez.

Kaynaklar: [Empty / Filters — cnippet-dev](https://21st.dev/@cnippet-dev/components/cnippet-empty), [Search Empty State](https://21st.dev/@arihantcodes_1f7b8c4d/components/search-empty).

İlk örnek, ikon–başlık–eylem hiyerarşisi açısından iyi bir referans; demo düğmeleri gerçek filtre işlemlerine bağlı değil. İkinci örnekte sorgu yankısı ve öneriler var, fakat sonuçlar sabit bir demo veri kümesinden geliyor ve Motion kullanılıyor. Burada animasyonlu paneli değil, bağlama uygun eylem fikrini uyarlamak yerinde olur.

**Bulunan gerçek ayrım:** `shown.length === 0` ve `filters.saved` olduğunda mevcut kod doğrudan “Koleksiyonuna bir oyun ekle” diyor. Oysa koleksiyonda oyun bulunup etkin filtreye uymamış olabilir. Bu iki durum ayrılmalı:

- Koleksiyon gerçekten boşsa kaydetme hareketi açıklanır.
- Koleksiyon dolu ama eşleşme yoksa “Kaydettiklerinde bu filtrelerle eşleşen oyun yok” ve ilgili filtreyi kaldırma eylemi gösterilir.

Kaynak [Saved Empty State](https://21st.dev/@arihantcodes_1f7b8c4d/components/saved-empty), kaydetmeyi öğretme fikri açısından incelendi. Demodaki “her cihazda” vaadi bizim tarayıcı içi kaydetme modelimize uymuyor; kullanılamaz. Ek örnek oyun listesi de bu aşamada gerekli değil.

**Kabul:** Eylemden sonra URL, kalan filtreler, kayıtlı kapsam ve klavye odağı doğru kalmalı. Dar ekranda düğmeler alt alta geçmeli. “Şunu denersen 5 oyun var” gibi bir sayı, gerçek sorguyla doğrulanmadan üretilmemeli.

## 4. Yanlışlıkla kaldırılan kaydı geri almak

Mevcut “Kaydedildi” bildirimi yeterli; yeni bir kaydetme animasyonu önermiyorum. Fırsat, **Kaydettiklerim** ekranında kaldırılan kartın hemen kaybolmasıdır. Kart içindeki bildirim de kartla birlikte kaldırılır.

Önerilen küçük bildirim:

> Sözcük Eşleri kayıtlardan kaldırıldı. **Geri al**

Kaynaklar: [Undo Pill](https://21st.dev/@arihantcodes_1f7b8c4d/components/undo-pill), [Undo Feedback](https://21st.dev/@sltowl/components/matte-undo-feedback), [Undo Countdown Button](https://21st.dev/@dhxwhy/components/undo-countdown-button).

Undo Pill hover/focus sırasında sayacı durdurmayı örnekliyor, ancak Framer Motion ve hareketli sayaç bu ihtiyaç için fazla. Undo Countdown Button işlemi süre sonuna ertelemek üzere tasarlanmış; yerel yer imi için gerekli değil. Undo Feedback'in kaldırıldı/geri yüklendi/hata ayrımı daha uygun; görünümü projeye ait küçük bir bildirim olarak kurulmalı.

**Uyarlama:** Bildirim kartın dışında, katalog düzeyinde yaşar. `Geri al`, son kaldırılan oyunu o andaki kayıt kümesine ekler; eski tüm listeyi geri yazıp sonraki kayıtları ezmez. Ardışık kaldırmalarda son işlem açıkça belirtilir. İlk tercih kapatılabilir ve kullanıcıya acele ettirmeyen bildirimdir. Süreli sürüm seçilirse klavye odağındayken kaybolmamalı. Başarı yalnız depolama işlemi başarılıysa söylenir.

**Kabul:** Son kartı kaldırma, arka arkaya kaldırma, başka oyun kaydetme, ikinci sekmeden değişiklik ve depolama hatası. Kaldırılan düğmenin odağı kaybolmamalı. Mobil bildirim ekranı kaplamamalı ve klavyenin altına saklanmamalı.

## 5. Filtre değişirken küçük, gerçek geri bildirim

Kaynak kodda `useTransition` ve `aria-busy` mevcut. Görsel olarak “şimdi sonuçlar yenileniyor” diyen belirgin bir karşılığı yok. Sonuç satırında kısa bir **“Oyunlar güncelleniyor…”** ifadesi yeterli olabilir. İstenirse yanına küçük bir spinner eklenir; az hareket tercihinde metin tek başına yeterlidir.

Kaynak: [Spinner Input Group — sean0205](https://21st.dev/@sean0205/components/c-spinner-4).

Katalogdaki bu örnek, açıklamasına rağmen bir isteği takip etmiyor: spinner sürekli çiziliyor. Yalnız yerleşim fikri alınmalı ve mevcut gerçek `pending` durumuna bağlanmalı. Eski kartları her ders değişiminde boş iskeletlerle değiştirmek yerine yerlerinde tutmak daha sakin bir akış sağlar. Biten işlem için yeni sonuç sayısı tek duyuruyla gösterilir.

**Kabul:** Hızlı ağda gereksiz yanıp sönmemesi, yavaş ağda anlaşılır olması, art arda ders/sınıf seçimi, son isteğin kazanması, geri/ileri gezinmesi. Filtreleri bekleme sırasında topluca kilitlemek mevcut hızlı seçim davranışını bozar. Sahte bekleme eklenmez.

## 6. Kapak görsellerine sakin bir yükleme ve hata hali

Mevcut kartlar `width`, `height` ve `loading="lazy"` kullanıyor; görsel oranı zaten ayrılmış. Bu nedenle “kartlar artık zıplamayacak” diye yeni bir kazanım iddia etmek doğru olmaz. Eksik olan, adresi mevcut olduğu halde yüklenemeyen görselin uygun görünümüdür.

Kaynak: [Lazy Image — efferd](https://21st.dev/@efferd/components/lazy-image).

Örnek; yükleme, cache ve fallback düşüncesi açısından yararlı. Fakat Framer Motion ve AspectRatio bağımlılığı getiriyor, iki saniyelik opaklık geçişi kullanıyor. Aynı davranışı bütünüyle almak bu siteye ağır gelir. Mevcut native lazy loading korunarak kısa bir görünme geçişi ve düzgün hata yüzeyi yerel olarak kurulabilir. Hedef görsel geçiş süresi yaklaşık 120–180 ms; bu bir tasarım önerisidir.

**Uyarlama:** Açık ders rengi alanı → gerçek kapak. Cache'den gelen görsel hemen görünür. Hata halinde oyun adı, ders ve mevcut oyun simgesi okunabilir kalır. Kırık görsel simgesi veya sonsuza kadar dönen yükleme yüzeyi bırakılmaz. Yedek görsel de hata verirse döngü oluşmamalı; görsel JavaScript yokken görünmez kılınmamalı.

**Kabul:** İlk yükleme, cache, yavaş ağ, 404 görsel, başarısız fallback, azaltılmış hareket, Safari ve mobil. Yeni bir görsel üretme servisi veya kapak üretim süreci gerekmez.

## Sonraya bırakılabilecek dört seçenek

**Simgeler için kısa açıklama.** Kaydet düğmesindeki native `title`, klavye kullanıcısına görsel açıklama sunmaz. Gecikmeli, hover ve focus ile açılan “Bu tarayıcıda kaydet” açıklaması küçük bir iyileştirme olabilir. [Accessible Tooltip](https://21st.dev/@a11ypros/components/a11y-tooltip) Escape, hover'da açık kalma ve `aria-describedby` için incelendi. Ancak kaynak ayrı bir CSS dosyası içe aktarıyor; dönen bağımlılık listesi bunu göstermiyor. Doğrudan kuruluma hazır kabul edilmemeli. Mobilde temel eylem tooltip'e bağımlı olmamalı, her simgeye açıklama balonu eklenmemeli. “WCAG uyumlu” katalog ifadesi bizim uygulamamız için otomatik uygunluk kanıtı değildir.

**Aramaya masaüstü kısayolu.** [Search Input with Keyboard Shortcut](https://21st.dev/@shadcnspace/components/kbd-04) görsel referans. Kaynak yalnız kısayol etiketi ve Mac/Windows demo anahtarı çiziyor; klavye dinleyicisi yok. Registry dökümü 14 yardımcı dosya getiriyor. Mevcut arama alanına gerçekten çalışan `/` kısayolu çok daha küçük tutulabilir. Yazı alanında, düzenlenebilir metinde, IME sırasında veya oyun içinde yakalanmamalı; mobilde gereksiz etiket gizlenmeli. Kullanım verisi olmadan ilk öncelik değil.

**Uzun listede filtrelere dönüş.** Liste sonuna sade “Filtrelere dön ↑” bağlantısı yeterli olabilir. [Circular Scroll Progress](https://21st.dev/@reuno-ui/components/skiper89) gibi yüzde, sürükleme ve halka kullanan örnekler tarandı; bu katalog için gereksiz görsel yük olarak elendi. Scroll yüzdesi eğitim ilerlemesi anlamına gelmez. Sabit bir yüzen düğme yerine önce liste sonu bağlantısı değerlendirilmeli. Sayfa kısa olduğunda görünmesine gerek yok. Klavye odağı gerçekten filtrelere taşınmalı, azaltılmış harekette akıcı kaydırma kapatılmalı.

**İlk yüklemede kart iskeleti.** [Card Skeleton](https://21st.dev/@uiable/components/uiable-skeleton-card) incelendi; örneğin görsel/yazı sırası ve oranı mevcut kartla aynı değil. Uyarlanırsa kartın gerçek geometrisini korumalı. Mevcut global `loading.tsx`, “Atölye hazırlanıyor…” diyor. Katalog iskeleti eklemek ayrı bir yükleme sınırı kararıdır; öğretmen çalışma alanlarına yanlışlıkla katalog kartları gösterecek global değişiklik yapılmamalı. Önce algılanabilir ilk yükleme gecikmesi ölçülmeli.

## Bilinçli olarak elenenler

- **Morphing Search / Command Search:** Mevcut arama ve öneri listesini tekrar kuruyor; cam, büyüme ve otomatik yazı efektleri ekliyor.
- **Filter Token Bar:** Operatörlü gelişmiş sorgu arayüzü bu kataloğun sınıf/ders akışından daha karmaşık.
- **Filter Toolbar:** Mevcut kaldırılabilir filtre etiketleriyle büyük ölçüde örtüşüyor.
- **Sürekli scroll yüzdesi / sürüklenebilir ilerleme halkası:** İçerik keşfinde öğrenme ilerlemesini temsil etmiyor; ekranda sürekli yer kaplıyor.
- **Expanding Arrow / Sneaky Button:** Kartlarda zaten ok hareketi var; ikinci bir hareket dili gereksiz.
- **Bookmark Icon Button'ın yeni animasyon varyantı:** Mevcut kısa kaydetme onayını tekrar ediyor.
- **Yoğun skeleton shimmer, 3D scrollbar ve parlak gradient düğmeler:** Sade atölye görünümüyle uyumu zayıf.
- **Popülerlik, yıldız, “öğrencilerin favorisi” rozetleri:** Araştırmada bunları destekleyen gerçek veri bulunmadı; dekoratif sayılar üretilmemeli.

Bu sonuçların bağlantıları ve arama açıklamaları kanıt kaydında bulunuyor. Sonraya bırakılan veya elenen her örneğin kaynak kodu açılmadı; 12 kaynak incelemesiyle metadata taraması ayrı tutulmalıdır.

## Uygulama için önerilen sıra ve doğrulama

**Paket A — küçük, görünür dokunuş:** Arama eşleşmesi + derse özel açıklama + bağlama uygun boş sonuç. Aynı başlık/arama alanında çalışır, yeni bölüm açmaz. Önce masaüstünde, ardından 320–390 px aralığında ve mobil klavye açıkken kontrol edilir.

**Paket B — davranışı tamamlama:** Kaydı kaldırmayı geri alma + gerçek bekleme bilgisi + kapak hata durumu. Yerel depolama ve yarışan gezinme istekleri nedeniyle yalnız görsel kontrol yeterli değildir.

Her uygulamada mevcut ders paleti, 44 px dokunma hedefleri, görünür klavye odağı, yerel fontlar ve azaltılmış hareket tercihi korunmalı. Katalog örnekleri tek tek kurularak yeni yardımcı bileşen zincirleri eklenmemeli. Bir defalık kaydetme bildirimi, pending bilgisi ve ekran okuyucu duyuruları aynı anda üst üste konuşmamalı.

Uygulama sırasında ilgili tür kontrolü, hedefli birim/tarayıcı kontrolleri, üretim derlemesi ve değişen yollar için 21st review yapılmalı. UI Build sürecindeki bu kontroller, bu araştırma turunda çalıştırılmış sonuçlar değildir. Başarı ölçütü, “daha fazla animasyon” değil; aranan sonucu daha çabuk ayırt etme, boş sonuçtan bağlamı bozmadan çıkma ve yanlış kaldırmayı geri alabilmedir. Bunların kullanıcı davranışına etkisi henüz ölçülmedi.

## Yerel inceleme noktaları

- `src/components/catalog-search-field.tsx`: önerilerin eşleşmesi, klavye ve konum davranışı.
- `src/lib/catalog-model.ts`: Türkçe arama normalizasyonu ve filtre anlamı.
- `src/components/catalog-view.tsx`: pending, sonuç sayısı, boş sonuç, kayıtlı kapsam.
- `src/components/saved-games.tsx`: tarayıcı depolaması ve kart içi kısa bildirim.
- `src/components/game-card.tsx`: görsel yükleme, kapak bulunmaması ve kart geometrisi.
- `src/app/loading.tsx`: mevcut genel yükleme görünümü.
- `src/app/globals.css`, `.21st/design.json`, `.21st/DESIGN.md`: renkler, hareket ve tasarım kararları.
