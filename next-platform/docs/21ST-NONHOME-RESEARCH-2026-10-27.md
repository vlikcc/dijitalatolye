# Ana sayfa dışındaki ekranlar için 21st dokunuş araştırması

27 Ekim 2026 · Durum: araştırma ve uygulanabilir öneriler · Uygulama kodu değiştirilmedi.

**Sonraki adım tamamlandı:** Kullanıcının onayladığı uygulama ve doğrulama sonuçları [teslim notunda](./21ST-NONHOME-DELIVERY.md). Aşağıdaki metin uygulama öncesi araştırmanın kaydıdır.

**Önerilen yön:** Keşif Atlası'nın mevcut görünümünü koruyup ekranları küçük durum işaretleri, daha iyi eylem yerleşimi ve tutarlı geri bildirimlerle tamamlamak. En yüksek katkı; mobilde oyunu başlatma, uzun listelerin taranması, işlem sonucunun anlaşılması ve hesap kurtarma akışının görsel bütünlüğünde.

**İnceleme kapsamı ve kanıtın gücü**

- Ana sayfa dışında **25 `page.tsx` rotası** incelendi. Son kaynak durumunda bunların **20'si ekran, 5'i yönlendirme**. Öğrenci alanının üç bölümü, yönetimin beş bölümü, kayıt türleri ve Kaydettiklerim ayrıca değerlendirildi.
- 21st **UI Build** ve **katalog** becerileri kullanıldı. Tasarım bağlamı, gerçek bileşenler ve önceki teslim kayıtları okundu; **20 canlı katalog aramasında 104 farklı demo adayı** tarandı, **13 adayın kaynak kodu alındı**. 11 ana kaynak bütünüyle, iki büyük kaynak ilgili davranış satırları üzerinden incelendi; bütün bağımlılık ağaçları denetlenmedi.
- Kamu ekranları yerel önizlemede incelendi. Oyun detayının 390×844 mobil görünümü ayrıca görüldü. Korumalı öğretmen/öğrenci/yönetici ekranlarında güncel kaynak ve önceki testlerden sekiz kayıtlı görüntü kullanıldı. Bu tur korumalı rollerde yeni oturum açılmadı veya işlem gönderilmedi.
- Araştırma sırasında kullanım rehberi eklendi ve `/ogretmenler-icin`, `/nasil-kullanilir` adresine yönlendirmeye dönüştü. Son envanter bunu esas alır. Rehberin kaynak kodu okundu; canlı gezinmesi zaman aşımına uğradığı için bu sayfaya canlı görsel doğrulama iddiası eklenmedi.
- Katalog erişimi araştırma anında ücretli ve kaynak alımı sınırsızdı; hosted AI kapalıydı. AI üretimi, yeni paket kurulumu veya katalog kodu kopyalama yapılmadı.
- Arama sonuçları, kaynak kararları ve görüntü listesi [kanıt dosyasında](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/docs/21ST-NONHOME-RESEARCH-EVIDENCE-2026-10-27.json). Beklenen faydalar tasarım değerlendirmesidir; kullanıcılarla ölçülmüş başarı oranları değildir.

**Yeniden yapılacak iş sayılmayan mevcut iyileştirmeler**

Katalogdaki kayan ders çizgisi, tek tek kaldırılabilen filtre etiketleri ve kaydetme tepkisi mevcut. Giriş/kayıt vitrinleri, açıklamalı hesap türü sekmeleri, parola uzunluğu geri bildirimi de mevcut. Yükleme alanında sürükle-bırak, dosya boyutu/tür kontrolü, gerçek aktarım yüzdesi ve yayın adımları uygulanmış. Çalışma alanında arama/sayfalama, ödev oyun/öğrenci seçicileri, gönderim özeti, mobil rapor ayrıntıları, CSV/PDF çıktısı, ödevi yeniden kullanma, uzun form eksik özetleri ve duruma göre ilk kullanım yönlendirmeleri var.

Bu rapor bunların üzerine yapılabilecek farkları tarif eder. Örneğin öneri “rapora filtre eklemek” değil, mevcut filtrelerin seçili durumunu ve sonuç satırlarını daha rahat okumaktır.

**Öncelik ve kapsam ölçeği**

P1: ilk uygulanacak, gözlenen ihtiyacı karşılayan işler. P2: ikinci turda faydalı iyileştirmeler. P3: isteğe bağlı ayrıntılar. Bunlar hata şiddeti değildir. Küçük: mevcut bileşen ve veriyle görünüm/metin değişikliği. Orta: yeni görünüm durumu, odak veya responsive davranış gerektirir. Büyük: yeni veri, kalıcılık veya ürün akışı gerektirir; küçük dokunuş paketine alınmaz.

**1. Keşif, oyun ve kullanım rehberi**

| Ekran | Mevcut durum / fırsat | Önerilen küçük dokunuş | Öncelik / kapsam |
|---|---|---|---|
| `/kesfet` | Arama, filtre etiketleri, seçili ders çizgisi ve sonuç sayısı var. | Sonuç yenilenirken sayı alanında kısa “Sonuçlar güncelleniyor…” metni; yerleşimi değiştirmeyen bekleme işareti. İlgili alan zaten `aria-busy` kullanıyor, bu davranış genişletilir. | P2 / küçük |
| `/kesfet?saved=1` | Boş koleksiyonun başlığı ve keşif eylemi doğru; simge arama büyüteci. | Boş koleksiyonda yer imi simgesi; “Kaydet” düğmesinin küçük, statik açıklaması. Kayıtların bu tarayıcıya ait olduğu mevcut açıklama korunur. | P2 / küçük |
| Filtreli kaydedilenler | Koleksiyon ile arama sonucu aynı alanı kullanıyor. | Gerçekten boş koleksiyon ile “Kaydettiklerinde bu filtreye uygun oyun yok” ayrı görünümler olsun. İkinci durumda filtre temizleme birincil eylem olsun. Global kayıtların sayısı filtrelenmiş sonuçtan türetilmesin. | P1 / orta |
| `/icerik/[slug]` — başlamadan önce | Mobilde uzun oyun alanı ve en alta yerleşen başlatma kutusu, ana düğmeyi ilk ekranın altına itiyor. | Yalnız başlamamış mobil görünümü kısalt; başlatma düğmesini önizlemenin hemen altında normal akışta tut. Oyun başlayınca mevcut geniş oyun alanına geç. | P1 / orta |
| `/icerik/[slug]` — araçlar ve bilgi | Sinema/tam ekran/yeniden başlat simgeleri etiketli; `title` yardımı var. Öğretmen notları ve uzun not açıklığı mevcut. | Geniş ekranda araç simgelerine kısa görünür metin; mobilde ortak “Oyun araçları” açıklaması. Öğretmen notlarına küçük başlık simgesi ve sakin sol kenar çizgisi. | P2 / küçük |
| `/nasil-kullanilir` | Öğrenci ve öğretmen için ayrı içerik ve gerçek rol/bayrak koşulları mevcut. | Üstte mevcut `#ogrenciler` ve `#ogretmenler` hedeflerine iki normal bölüm bağlantısı; öğretmen adımları arasına ince bağlantı çizgisi. Gerekirse üç kısa soru: hesap gerekli mi, kayıtlar nerede, oyun ne zaman yayımlanır. | P2 / küçük |

Mobil oynatıcı bulgusu [GamePlayer](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/game-player.tsx) ve [CSS](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/app/globals.css) ile doğrulandı: mobil `.player-wrap` yüksekliği `min(680px, calc(100svh - 32px))`; `.player-start` en alta mutlak konumlanıyor. Bu ölçü oyun oynarken yararlı olabilir, ancak başlamadan önce de kullanılıyor. Dokunuş yalnız başlangıç görünümüne uygulanmalı; iframe'in etkin oyun geometrisi, sinema modu ve tam ekran davranışı aynı kalmalı. Çok uzun oyun adında “her cihazda ilk ekranda görünür” garantisi verilemez; hedef 390×844 örneğinde ve kısa/orta başlıklarda başlatma eylemini görünür kılmaktır.

Katalog için ayrı bir tasarım veya kart ailesi gerekmiyor. [Empty State, 1435](https://21st.dev/@serafimcloud/components/empty-state), simge–açıklama–eylem sırası için uygun referans. Üç hareketli simge ve büyük kesikli çerçeve çalışma ekranlarına taşınmamalı. Kullanım rehberinde [Accessible Accordion, 34660](https://21st.dev/@a11ypros/components/a11y-accordion) yaklaşımı, zaten kullanılan yerel `details/summary` ile uyumlu.

**2. Giriş, kayıt, kurtarma ve hesap**

| Ekran / durum | Mevcut durum / fırsat | Önerilen küçük dokunuş | Öncelik / kapsam |
|---|---|---|---|
| `/giris` | Yeni beyaz form + lacivert oyun vitrini uygulanmış. | Mevcut düğmenin yükleme etiketini “Giriş yapılıyor…” olarak özelleştir; durum değişirken genişliği koru. Hata açıklamasına küçük hata simgesi ekle. | P2 / küçük |
| `/giris` — e-posta doğrulama ve 2FA | Kod, yedek kod, doğrulama bağlantısını yeniden gönderme ve başarı metinleri var. | Form alanının üstünde “Doğrulama kodunu gir” alt başlığı ve kodun nereden alınacağı açıklaması. Tek kod alanı korunur; 2FA alanına geçişte odak yönetimi kontrol edilir. | P2 / orta |
| `/kayit` — öğretmen | Rol açıklaması, parola koşulunun canlı işareti ve kayıt sonrası e-posta mesajı var. | Başarılı kayıt mesajını simgeli, belirgin “E-postanı kontrol et” sonuç alanına dönüştür; giriş bağlantısını yanında tut. İşlem bitmişken aynı formu tekrar göndermeye davet eden görünümü azalt. | P2 / orta |
| `/kayit?tur=ogrenci` | Kullanıcı adı, sınıf kodu ve parola açıklamaları mevcut. | Kullanıcı adı koşulunu alan terk edildiğinde kısa geri bildirimle göster. Sınıf kodunu tek alanda daha okunur karakter aralığıyla sun. Sekmelerdeki değer koruması devam eder. | P2 / orta |
| `/parolami-unuttum` | Yeni giriş ekranından farklı, çıplak `.auth-box` düzeninde. | Ortak hesap formunun beyaz yüzeyi, başlık aralığı ve lacivert/amber küçük simgesiyle kompakt kurtarma kartı. Öğrenci yardımı ikincil, ayrılmış satır olsun. | P1 / küçük |
| `/parola-yenile` | Aynı eski form düzeni; parola uzunluğu açıklaması statik. | Kurtarma ailesiyle ortak düzen; kayıtta zaten çalışan uzunluk koşulu geri bildirimini burada da kullan. Başarı sonrası belirgin giriş bağlantısı. | P1 / küçük |
| `/ogrenci/parola` | Kullanıcı adı, öğretmenden alınan kod, yeni parola ve 15 dakika açıklaması var. | Aynı kompakt kurtarma yüzeyi; “Öğretmeninden kod al → Yeni parolanı belirle” şeklinde iki kısa açıklama. Kod için geri sayım ekleme; gerçek sona erme zamanı bu ekranda yok. | P1 / küçük |
| `/hesap` | Hesap bilgileri ve role göre güvenlik/kurtarma metni var. | İsim/rol, hesap bilgileri ve güvenlik durumunu üç açık bölüm halinde hizala. 2FA etkinliğini simge + metinle göster; öğrenciye yalnız gerçek kurtarma sorumlusu gösterilir. | P2 / küçük |
| `/hesap` — 2FA kurulumu | Kurulum bağlantısı, manuel anahtar, kod ve yedek kodlar mevcut. | Mevcut iki gerçek aşamayı “Uygulamaya ekle / Kodu doğrula” diye adlandır; yedek kod kutusunda okunabilir satır aralığı ve kopyalama seçeneği değerlendir. Başarı yalnız doğrulama yanıtından sonra gösterilir. | P2 / orta |

Burada tekrar bir büyük vitrin tasarımı önermiyorum. Kurtarma ekranlarında daha küçük, yaklaşık mevcut 480 px form genişliğini koruyan bir yüzey yeterli. Girişteki “sen”, kurtarma açıklamalarındaki “siz” geçişleri de aynı ürün diliyle tutarlı hale getirilebilir.

[PasswordField](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/password-field.tsx) zaten `showRequirementFeedback` desteğine sahip; [AuthForm](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/auth-form.tsx) bunu yalnız kayıt modunda açıyor. Yeni parola ölçer kurmak yerine bu mevcut yetenek genişletilebilir. Sunucuda olmayan sembol/büyük harf şartları veya “parolan güvenli” iddiası eklenmez. Parola sıfırlama yanıtındaki hesap varlığını açığa çıkarmayan mevcut ifade korunur.

[Loading Button, 23536](https://21st.dev/@ddoemonn/components/loading-button) sabit boyutlu işlem geri bildirimi için iyi kaynak. [OTP Input, 23543](https://21st.dev/@ddoemonn/components/otp-input) ise bu kapsam için önerilmedi: çoklu alan, özel yapıştırma/odak yönetimi ve animasyon bağımlılığı getiriyor. Mevcut `autocomplete="one-time-code"` alanı daha az bakım gerektiriyor.

**3. Öğretmen içerik, yükleme ve sürüm ekranları**

| Ekran / durum | Mevcut durum / fırsat | Önerilen küçük dokunuş | Öncelik / kapsam |
|---|---|---|---|
| `/ogretmen` — İçeriklerim | Arama, durum filtresi, sonraki eylem ve yayın/taslak ayrımı var. Sayı yalnız alt sayfalama alanında. | Listenin üstünde “54 kayıt · 26–50 arası” gibi gerçek aralık; satırda durum ikonu ve hizalı eylem alanı; başlık bağlantısına focus-within vurgusu. | P1 / küçük |
| İçeriklerim — boş/filtreli | İki duruma ayrı metin var; boş alan içinde eylem yok. | İlk içerik için “Oyun paylaş”, sonuçsuz filtre için “Filtreleri temizle” eylemini mesajın yanında göster. Üstteki eylemle hiyerarşi tutarlı olsun. | P2 / küçük |
| `/ogretmen/yeni` | Paket seçimi, gerçek aktarım ilerlemesi ve yayın adımları yeterli. İsteğe bağlı kapak yerel dosya girdisi olarak kalmış. | Kapakta seçilen dosya adı, boyut, küçük raster önizleme ve “Değiştir/Kaldır”. Dosya seçimi ile sunucuya kaydetme ayrı anlatılsın. | P2 / orta |
| `/ogretmen/icerik/[id]` — başlık | İçeriklerim'e belirgin geri bağlantısı yok. | Başlığın üstüne “İçeriklerime dön”; güvenli liste bağlamı veriliyorsa arama/durum/sayfa korunur. | P1 / küçük; bağlam koruma orta |
| Aynı sayfa — yayın durumu | Beş aşamalı akış ve önceki yayının açık olduğu bilgisi mevcut. | O anki adımın zeminini hafifçe ayır; durum açıklamasında gerçek sonraki işi öne çıkar. Uzun süren işte sahte yüzde veya “az kaldı” metni ekleme. | P2 / küçük |
| Aynı sayfa — metadata | Eksik özeti, bölüm bağlantıları ve kaydedilmemiş değişiklik metni zaten var. | Özette görünen bölümü işaretle; eksik sayısını küçük etikete al. Kaydetme durumunu düğmeyle aynı görsel dilde göster. | P1 / orta |
| Aynı sayfa — kapak | Güncel kapak ve kaynağı gösteriliyor; hazırlama/hata metni var. | Kapak yüklenirken gerçek 720:440 oranında yer tutucu; görsel yüklenemediğinde boş kırık resim yerine açıklama ve mevcut alternatif eylem. | P2 / orta |
| Aynı sayfa — sürüm geçmişi | Eski sürümler düz paragraf olarak listeleniyor. | İnce dikey çizgi ve küçük durum simgesiyle tarih–başlık–yayın etiketi. Gerçek aktif yayın ayrı işaretlenir; yeni taslak ile aynılaştırılmaz. | P1 / küçük |

[Status Badge, 521](https://21st.dev/@serafimcloud/components/status-badge) iki gerçeği aynı anda göstermek için yararlı: örneğin **“Yayında”** yanında **“Yeni sürüm: düzeltme bekliyor”**. Tek bir yeşil rozet bütün içerik sürecinin tamamlandığı izlenimini vermemeli. Durum, mevcut [publication-progress](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/lib/publication-progress.ts) hesabından gelmeli.

[Table of Contents, 34517](https://21st.dev/@appica-dev/components/toc) aktif bölüm takibi için referans. Mevcut [FormOutline](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/form-outline.tsx) korunur: bölüm açma, ilk uygun alana odak taşıma ve mobilde normal akış davranışları zaten uygulanmış. Yalnız aktif bölümün ince lacivert çizgisi eklenir. Her kaydırmada odak taşınmaz.

Sürüm geçmişi için [Audit Log With Icon Tiles, 28483](https://21st.dev/@olewandowski1/components/activity-3) okunabilir olay satırına örnek. Kaynağın statik demo olayları alınmaz; yalnız elimizdeki sürüm oluşturma zamanı, başlık, iptal ve etkin yayın durumu kullanılır. “İncelemeye gönderildiği an” gibi kaydı bu listede olmayan olaylar uydurulmaz.

**4. Sınıflar, ödevler ve rapor**

| Ekran / durum | Mevcut durum / fırsat | Önerilen küçük dokunuş | Öncelik / kapsam |
|---|---|---|---|
| `/ogretmen/siniflar` | İlk kullanım yönlendirmesi, katılım kodu kopyalama, üyelik işlemleri var. | Sınıf başlığında mevcut veriden “18 onaylı · 3 bekleyen”; bekleyen isteklerde simgeli durum. Kod + kopyala düğmesi tek hizalı grup. | P1 / küçük |
| Sınıf kodu kopyalama | Başarı mesajı var, düğme aynı yazıda kalıyor. | Başarıdan sonra düğme “Kopyalandı ✓” olur, sonra geri döner. Hata açıklaması kalıcı ve seçilebilir kalır. | P1 / küçük |
| `/ogretmen/odevler` — liste | Açık/kapalı, tarih ve yeniden kullan/sonuç eylemleri var. | Açık/kapalıyı metinli rozet yap; tarih ile oyun/sınıfı ayrı satırda hizala; sonuç bağlantısını birincil, yeniden kullanmayı ikincil göster. | P1 / küçük |
| Aynı sayfa — atama formu | Aranabilir seçimler, seçilen sayı ve gönderim özeti mevcut. | Seçili oyun satırına küçük ders işareti; özette alıcı sayısını görsel olarak belirginleştir. Arama sonuçlarında kaybolan seçimi yanlışlıkla boş sanmayı önle. | P2 / küçük |
| `/ogretmen/odevler/[id]` — rapor | Sayımlı filtreler, masaüstü tablo, mobil ayrıntı, CSV/PDF var. | Durum hücresine simge + yazı; puanları sağa hizala, sayıları eş genişlikli yap; satır hover/focus arka planını hafifçe değiştir. | P1 / küçük |
| Rapor — ilerleme | Gerçek yüzde veya eksik değer metinsel gösteriliyor. | Yalnız kayıt destekli ve sayısal değeri olan satırda, yüzde yazısını koruyan ince ilerleme izi. Null değer için çubuk çizilmez. | P2 / orta |
| Rapor — çıktı | Kapsam ve öğrenci sayısı zaten açık. | CSV düğmesinde dosya simgesi; tıklamada “İndirme başlatıldı” geri bildirimi. Dosyanın diske kaydedildiği iddia edilmez. | P2 / küçük |

Sınıflar ekranında toplu onay veya sürükleyerek öğrenci taşıma bu kapsamda gereksiz. Ödev raporunda büyük pasta grafiği de mevcut sayımlı durum filtrelerine fazla bilgi katmıyor. Örneğin **“Devam ediyor · Kapalı”** iki ayrı gerçektir; biri çalışma durumunu, diğeri ödevin yeni çalışmaya açık olmadığını gösterir. Yeni rozet görünümü bu ayrımı korumalı.

[Copy With Confirmation, 36536](https://21st.dev/@ibrandify/components/copy-with-confirmation) gerçek pano işlemi tamamlanınca onay veriyor ve başarısızlıkta elle kopyalamaya geçiyor. Bu desen, mevcut [CopyClassCode](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/copy-class-code.tsx) üzerinde küçük bir genişleme için yeterli. [Progress With Value, 19174](https://21st.dev/@arihantcodes_1f7b8c4d/components/progress-with-value) yalnız görsel referans: kaynakta `value`, Radix köküne aktarılmadığı için doğrudan alınması uygun değil.

**5. Öğrenci çalışma alanı ve oyuncu**

| Ekran / durum | Mevcut durum / fırsat | Önerilen küçük dokunuş | Öncelik / kapsam |
|---|---|---|---|
| `/ogrenci` — Ödevlerim | Gerçek duruma göre başla/devam et/sonuç eylemleri, tarihler ve öğretmen yönergesi var. | “Devam et” eylemi bulunan satırda ince vurgu; tamamlandı durumunda küçük onay simgesi; son tarih ayrı, kolay taranan satır. | P1 / küçük |
| `/ogrenci?bolum=oyunlar` | Hesaptaki serbest oyunlar ile öğretmen raporları ayrılmış. | Yalnız gerçek sayısal ilerlemede yüzde + ince çizgi; “Kaldığın yerden devam et” bağlantısının hiyerarşisini güçlendir. | P2 / orta |
| `/ogrenci?bolum=siniflar` | Kodla katılma ve üyelik durumları var. | Onay bekliyor/onaylandı/arşivlendi metinlerine farklı simgeler. Katılma isteğinin gerçek başarısında alan yanında sonuç mesajı. | P1 / küçük |
| Öğrenci boş durumları | Sınıfsız, bekleyen, ödev bekleyen ve erişimi sona eren durumlar zaten ayrılmış. | Duruma özel tek simge ve kompakt yüzey. Bekleyen üyelikte yeni kayıt olmaya yönlendirmek yerine mevcut isteğe bağlantı korunur. | P2 / küçük |
| `/ogrenci/oyna/[id]` | Kayıt bağlantısı, kaydediliyor/kaydedildi/hata ve yeniden yükleme metinleri var. | Aynı mesajlara tipli durum görünümü: bekleme, başarı ve hata simgeleri. Metin alanının yeri/yüksekliği sabitlenir; oyun kontrolleri kapanmaz. | P1 / orta |

Oyuncunun **“Kaydedildi”** işareti sadece sunucu onayından gelmeli. “Kayıt bağlantısı hazır”, “Oyun açıldı” ve “Oyun tamamlandı” farklı olaylardır. [Tracking bridge](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/tracking-bridge.ts) şu anda metinle durum bildiriyor; görünüm metnin içindeki sözcükleri arayarak renklendirilmemeli. Küçük, tipli bir görünüm durumu eklenmesi bu yüzden orta kapsamlıdır.

Öğrencinin ilerlemesine konfeti, seri gün sayacı veya sınıf sıralaması eklemek bu araştırmanın küçük dokunuş hedefini karşılamıyor. Eldeki oyun puanı, öğrenme hedefinin kazanıldığına ilişkin bir ölçüm gibi sunulamaz. Son tarih geçmiş ama açık olan ödevde başlatma eylemi kapatılmaz.

**6. İçerik incelemesi ve platform yönetimi**

| Ekran / bölüm | Mevcut durum / fırsat | Önerilen küçük dokunuş | Öncelik / kapsam |
|---|---|---|---|
| `/editor` | Arama, sınıf/ders filtreleri, tarih sırası ve sayfalama var. | Filtrelerin hemen altında sayı/aralık; başlık yanında görünür “İncele” eylemi; satır odağı. Sıra metni yine sürüm oluşturma tarihini belirtir. | P1 / küçük |
| `/editor/[id]` | Oyun/kapak, teknik inceleme ve değerlendirme sekmeleri mevcut; taslaklar sekme değişiminde korunuyor. | Kuyruğa geri bağlantısı; sekmelerde ince seçili işaret. Teknik inceleme sekmesinde gerçek engelleyici/uyarı sayısı. | P1 / orta |
| Teknik rapor | Bulgular kategorili; engelleyici bulunan grup başlangıçta açık. | Grup başlığında önem seviyesi + sayı; dosya/konum/kural daha sakin ikincil satır; kanıt bloğunun okunabilirliği. | P1 / küçük |
| Değerlendirme | Beş başlık, teknik uyarılar, kazanım kararları ve eksik özeti var. | Mevcut “5 başlıktan 2 karar” bilgisini küçük kontrol satırına dönüştür; eksik bağlantılarda tek vurgu rengi; aktif form bölümü işareti. | P1 / orta |
| `/yonetim?bolum=kullanicilar` | Rol ve 2FA açıklaması, rol değiştirme/kurtarma eylemleri var. | Rol etiketi ve ayrı 2FA durum işareti; e-posta ikincil satır. Rol değişikliği sunucuda tamamlanınca satır yanında “Rol güncellendi”. | P1 / küçük |
| `/yonetim?bolum=tanimlar` | Etkin/pasif, sınıf tanımları ve ekleme açıklıkları var. | Etkin/pasif metinli işaret; ders ve kazanım türünü tipografik ayır. Açılır başlıklarda ortak ok ve tıklama alanı. | P2 / küçük |
| `/yonetim?bolum=yayinlar` | Teknik inceleme ve yayından kaldırma eylemleri var. | İçerik adıyla eylem grubunu hizala; kaldırma düğmesi satırın geri kalanından görsel olarak ayrışsın. Yeni kaldırma/toplu işlem akışı ekleme. | P2 / küçük |
| `/yonetim?bolum=sistem` | İşlem hataları ve başarısız kuyruk işleri ayrı gösteriliyor. | Hata kartında başlık → kısa hata → yeniden dene sırası. Geri bildirim “İş tekrar kuyruğa alındı” olsun; tamamlandığı sanılmasın. | P1 / küçük |
| `/yonetim?bolum=kayitlar` | Zaman/işlem/hedef tablosu var; uzun teknik hedefler mobilde ağır. | Bilinen olay adlarını Türkçe etiketle, ham kodu ayrıntıda koru. Hedef ID için kopyalama; mobilde tarih ve olay adı önce, tam hedef açılır ayrıntıda. | P2 / orta |

İnceleme ekranındaki “karar girildi” işareti “yayın onayına uygun” ile aynı anlamı taşımamalı. Kaynak doğrulaması, kapak ve teknik yayın koşulları ayrı kalır. Admin'in teknik inceleme erişimi de yayın onayı verme yetkisine dönüştürülmez.

Liste yoğunluğu için [Pagination with Page Info and Page Size, 25140](https://21st.dev/@bundui/components/pagination9) bilgi yerleşimi açısından yararlı. Mevcut [Pagination](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/list-controls.tsx) 25 kayıtlık sunucu sayfalaması kullanıyor; sayfa boyutu seçicisini aynen almak küçük görünüm değişikliğini yeni sorgu davranışına dönüştürür. Öneri, mevcut sayfalamanın üstte de görünür olması ve gerçek aralık metnidir. Sistem ekranı iki ayrı veri listesi gösterdiği için tek “1–25” aralığı bütün kayıtları temsil etmez; bu bölümün sayıları ayrı gösterilmelidir.

**7. Yönlendirmeler, yükleme, hata ve boş durumlar**

| Yüzey | Karar |
|---|---|
| `/ogrenci/giris` → `/giris` | Ayrı giriş tasarımı ekleme; hedef ekranın dokunuşlarını kullan. Mevcut sorgu parametreleri korunur. |
| `/ogrenci/kayit` → `/kayit?tur=ogrenci` | Aynı yaklaşım; yeni bir rol seçme adımı ekleme. |
| `/oyna/[slug]` → `/icerik/[slug]?oyna=1` | Ayrı oyuncu sayfası tasarlama. Otomatik başlatmanın doğru davranması yeterli. |
| `/oturum` → role uygun hedef | Süslü ara ekran veya yapay bekleme ekleme. Güvenli hedef ve rol kontrolü korunur. |
| `/ogretmenler-icin` → `/nasil-kullanilir` | Eski tanıtım ekranına yatırım yapma; kullanım rehberini geliştir. |
| Bekleme | Mevcut kök `loading.tsx` yalnız “Atölye hazırlanıyor…” gösteriyor. Ana sayfa dışındaki uzun veri ekranlarında başlık + birkaç satır iskeleti düşünülebilir. |
| Hata | Mevcut “Yeniden dene” eylemi var. Küçük durum simgesi ve uygun çalışma listesine geri bağlantısı eklenebilir. |
| Bulunamadı | Mevcut keşfet bağlantısı var. Kompakt eksik dosya/oyun simgesi yeterli; sahte öneri veya kayıp içeriğe dair kesin neden üretilmez. |

Ana sayfa kapsam dışında olduğu için kök `loading.tsx`, `error.tsx`, `not-found.tsx` ve global stillere yapılan değişiklikler otomatik olarak önerilen uygulama paketine dahil edilmemeli. Gerekli yeni bekleme/hata görünümleri ilgili segmentlere yerleştirilmeli veya yalnız hedef yüzeyde etkinleşmeli. `/` ile `/kesfet` aynı katalog bileşenini kullanıyor; kataloğa özgü yeni görünüm de rota/prop üzerinden açıkça sınırlandırılmalı.

**8. Bütün ekranları birleştiren altı küçük desen**

1. **İşlem sonucunu aynı yerde göster.** “Kaydet → Kaydediliyor… → Kaydedildi ✓” dizisi. Başarı gerçek yanıtı bekler; hata kısa süre sonra kaybolmaz. `ActionForm` bugün başarıda yeniliyor, açık bir başarı durumu tutmuyor. `LearningAction` ise başarı/hata mesajını aynı genel metin alanında sunuyor. Ortak görünüm bu iki farkı giderebilir.
2. **Durum = simge + sözcük.** Yeşil, amber ve hata renkleri yardımcıdır; kullanıcı rengi görmese de anlamı okumalı. Ders renkleri ile işlem durum renkleri birbirine karıştırılmaz. Çalışma satırlarında renkli halo veya kartı yukarı kaldırma yerine ince arka plan/focus vurgusu yeterli.
3. **Liste sonucunu başta söyle.** Kayıt sayısı, uygulanan filtre ve mevcut sayfa bilgisi üstte; gezinme altta kalabilir. Uzun mobil listede kullanıcının sonuç sayısını görmek için sonuna gitmesi gerekmez. Sayı sıfırken “1–0” gibi aralık üretilmez.
4. **Açılır ayrıntılar aynı dili kullansın.** Aynı chevron, en az mevcut kontrol yüksekliği, odakta belirgin çerçeve. Teknik kanıt, öğretmen notu ve mobil rapor zaten `details` kullanıyor; içerikleri başka bir kütüphaneye taşımak gereksiz.
5. **Üst bağlamı küçük tut.** İçerik ayrıntısında İçeriklerim'e, incelemede kuyruğa ve raporda ödev listesine tek satır dönüş. İki seviyeli hiyerarşi için büyük breadcrumb menüsü gerekmiyor. Filtreli dönüş URL'si ayrıca güvenli yerel yollarla sınırlandırılır.
6. **Hareket yalnız değişimi anlatsın.** Başlangıç önerisi olarak ikon/metin geçişleri yaklaşık 140–180 ms; seçili işaret geçişleri 180–220 ms. Bu süreler standart zorunluluğu değil tasarım önerisi. Azaltılmış harekette konum/ölçek hareketi kaldırılır; metin ve durum kalır. İş tamamlanmışsa animasyon uğruna bekletilmez.

Odak almadan değişen başarı ve bekleme metinlerinin yardımcı teknolojiye bildirilmesi [W3C durum mesajları açıklamasına](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) uygun biçimde tasarlanmalı. Yapışkan özetler klavye odağını örtmemeli; [odak görünürlüğü açıklaması](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum) bunu özellikle ele alıyor. Hareket tercihinin desteklenmesi [Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) ile uyumlu; bu kriter AAA düzeyindedir, bütün ürünün WCAG uygunluğu test edilmiş anlamına gelmez.

Mevcut 44 px oyuncu kontrolleri küçültülmemeli. 44 px burada ürünün hedefidir; WCAG 2.2 AA'nın hedef boyutundaki temel eşik 24×24 CSS px ve tanımlı istisnalardır. [W3C WCAG 2.2 yenilikleri](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)

**9. Kaynağı incelenen 21st adayları ve kararlar**

| Kaynak | Kaynaktan görülen teknik durum | Karar |
|---|---|---|
| [Status Badge — 521](https://21st.dev/@serafimcloud/components/status-badge) | `@remixicon/react` ve Tremor'a özgü sınıflar var. | İki bölümlü durum fikri alınabilir; mevcut Lucide ve proje renkleriyle yerel uyarlama. |
| [Copy With Confirmation — 36536](https://21st.dev/@ibrandify/components/copy-with-confirmation) | Pano Promise sonucu, manuel fallback ve reduced-motion var; bileşen için geniş genel stil/yardımcı kod da dönüyor. | Mevcut kopyalama bileşenini genişlet; tüm kaynağı kurma. |
| [Empty State — 1435](https://21st.dev/@serafimcloud/components/empty-state) | Lucide + Button; üç simgede hover hareketi ve geniş padding. | İçerik hiyerarşisi uygun, boyut/hareket sadeleştirilmeli. |
| [Loading Button — 23536](https://21st.dev/@ddoemonn/components/loading-button) | Gerçek Promise, eşzamanlı çağrı kilidi, live status; `motion/react`. Demo süreyle tamamlanıyor. | Üretimde gerçek istek sonucuna bağlanmış yerel Button/CSS deseni. Demo zamanlayıcısı alınmaz. |
| [Table of Contents — 34517](https://21st.dev/@appica-dev/components/toc) | IntersectionObserver, rootMargin, aria-current ve ResizeObserver; Base UI importları. | Mevcut FormOutline'a aktif bölüm işareti; Base UI kurulumu gereksiz. |
| [Skeleton Swap — 23557](https://21st.dev/@ddoemonn/components/skeleton-swap) | Sabit yükseklik ve iç kaydırma; içerik opacity/pointer-events ile gizleniyor. Motion ve minimum görünme süresi var. | Doğrudan kullanma. Şekil/yer rezervasyonu fikri, doğal yükseklikli ve odak erişimi doğru yerel sürümde değerlendirilebilir. |
| [Accessible Accordion — 34660](https://21st.dev/@a11ypros/components/a11y-accordion) | Native details/summary; chevron ve tek/çoklu açılma yönetimi. | Yerel details yüzeylerini tutarlı hale getirmek için en yakın desen. Katalogdaki erişilebilirlik beyanı bağımsız test yerine geçmez. |
| [Pagination — 25140](https://21st.dev/@bundui/components/pagination9) | Örnek hash bağlantıları ve veri sorgusuna bağlı olmayan sayfa boyutu seçicisi. | Yalnız bilgi düzeni. Mevcut sunucu URL'leri, filtreler ve 25 kayıt korunur. |
| [Progress With Value — 19174](https://21st.dev/@arihantcodes_1f7b8c4d/components/progress-with-value) | `value` Radix Root'a aktarılmıyor; dolgu `value || 0`. Yeni react-progress bağımlılığı. | Doğrudan kurma. Null/0 ayrımı, erişilebilir değer ve görünür yüzde yerelde doğru modellenmeli. |
| [Audit Log With Icon Tiles — 28483](https://21st.dev/@olewandowski1/components/activity-3) | Statik olaylar, Badge ve IconPlaceholder yardımcıları. | Sürüm geçmişi ve mobil işlem kaydı için yerleşim referansı; gerçek tarih/veri gerekir. |
| [Breadcrumb — 23681](https://21st.dev/@cnippet-dev/components/breadcrumb) | `nav`, `ol`, `aria-current`; Base UI yardımcıları. | Mevcut PageHeading.back daha hafif. Görsel üst bağlam referansı yeterli. |
| [File Dropzone — 19201](https://21st.dev/@joyco/components/file-dropzone) | Dosya adı/boyut, preview ve hata alanı; ayrı use-file-upload yardımcısı. | Paket seçici zaten var. Yalnız isteğe bağlı raster kapak önizlemesine fikir. |
| [OTP Input — 23543](https://21st.dev/@ddoemonn/components/otp-input) | Çoklu karakter hücresi, özel paste/odak yönetimi, Motion. | Bu kapsamda elendi; tek kod alanı korunur. |

Bu araştırmada kaynakların yeni lisans doğrulaması yapılmadı ve kod kopyalanmadı. Uygulama aşamasında gerçekten bir dosya alınacaksa tam lisans, kaynak sürümü ve bağımlılıkları ayrıca kaydedilmeli. Yerel bileşenin davranışını katalog desenine göre geliştirmek, katalog paketinin tamamını projeye eklemekle aynı şey değildir.

**10. Önerilen uygulama sırası**

| Paket | İçerik | Beklenen katkı | Kapsam |
|---|---|---|---|
| A — ilk görünür fark | Mobil başlangıç oynatıcı düzeni; üç kurtarma ekranının ortak yüzeyi; liste üstü sayı/aralık | Kullanıcının ana eylemi ve bulunduğu durumu daha erken görmesi | Küçük + orta |
| B — çalışma ekranları | Durum işaretleri; kopyalama/işlem geri bildirimi; sınıf sayıları; rapor sayısal hizası | Kalabalık ekranların taranması, işlemin sonucunun anlaşılması | Çoğu küçük |
| C — uzun işler | Sürüm geçmişi; formda aktif bölüm; inceleme önem/sayı etiketleri; kapak önizlemesi | Nerede kalındığının ve sonraki işin anlaşılması | Küçük + orta |
| D — son rötuşlar | Rehber bölüm bağlantıları; boş durum simgeleri; seçili sayfalarda iskelet; mobil işlem kayıtları | Daha tutarlı yan durumlar | Küçük + orta |

Paket A'yı ilk tercih ederim. Görsel olarak hemen fark edilir ve mevcut ürün davranışına dayanır. Paket B uygulamayı daha tamamlanmış hissettirir. C ve D, ilk iki paketin sonuçlarına göre sıraya alınabilir. Saat/gün taahhüdü verilmedi; korumalı ekranların gerçek test verileriyle doğrulanması iş miktarını etkiler.

**Uygulama sırasında kabul örnekleri**

- Mobil oyun detayı: 390×844'te standart uzunlukta başlıkla başlatma eylemi görünür; oynama, sinema, tam ekran ve yön değişimi mevcut davranışı korur. 320 px ve uzun Türkçe başlıkta taşma oluşmaz.
- Kurtarma: e-posta/kod akışları, güvenli `next` hedefi, hatada form değerleri ve parola yöneticisi desteği korunur. Mevcut hesap-varlığı gizleyen yanıt değişmez.
- Durumlar: eski sürüm yayındayken yeni taslak düzeltme bekleyebilir; null puan sıfır olmaz; kayıtsız oyun tamamlanmış gibi görünmez; geciken açık ödev kapalı sayılmaz.
- Geri bildirim: pano reddinde “Kopyalandı” gösterilmez; başarısız istek yeşile dönmez; tekrar kuyruklama “iş bitti” anlamına gelmez. Aynı işlem iki kez gönderilmez.
- Listeler: toplam ve aralık mevcut yetkili sorgudan gelir; filtre/sayfa geçmişi korunur; sistemin iki listesi için yanıltıcı birleşik aralık verilmez.
- Uzun form: aktif bölüm yalnız görsel izdir; sekme/bölüm değiştirmek taslakları kaldırmaz. Mobil klavye ve %200 büyütmede odaklanan alan görünür.
- Hareket: `prefers-reduced-motion` ile bütün yeni hareketler sınanır; geri bildirim metni hareket kapalıyken de anlaşılır.
- Ana sayfa: `/` için önce/sonra görüntüsü ve ortak bileşen regresyonu, kapsam dışındaki ana sayfanın değişmediğini doğrular.

Araştırma teslimi için uygulama testleri yeniden çalıştırılmadı. Uygulama yapılırsa değişen davranışların ilgili testleri, tür kontrolü ve etkilenen tarayıcı senaryoları çalıştırılmalı; yalnız mevcut testlerin önceki başarı kaydına dayanılmamalı.

**Küçük dokunuş paketine alınmaması gerekenler**

Yeni dashboard teması, tüm sayfalara büyük kartlar, otomatik carousel, konfeti, sürekli parıldayan durum ışıkları, grafik kütüphanesi, bildirim merkezi, bulutla eşlenen favoriler, ödev takvimi, sürüklenebilir yayın Kanban'ı, otomatik kayıt sistemi ve çok adımlı zorunlu form sihirbazı. Bunların çoğu yeni ürün davranışı veya veri modeli gerektiriyor; mevcut küçük iyileştirmelerin önüne geçmemeli.

**Önemli yerel uygulama noktaları**

| Alan | Dosyalar |
|---|---|
| Katalog ve koleksiyon | [catalog-view.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/catalog-view.tsx), [saved-games.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/saved-games.tsx) |
| Oyun ve kayıt durumu | [game-player.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/game-player.tsx), [student-player.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/student-player.tsx), [tracking-bridge.ts](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/tracking-bridge.ts) |
| Hesap yüzeyleri | [account-layout.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/account-layout.tsx), [auth-form.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/auth-form.tsx), [password-field.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/password-field.tsx), [register-form.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/register-form.tsx) |
| İşlem geri bildirimi | [action-form.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/action-form.tsx), [learning-forms.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/learning-forms.tsx), [copy-class-code.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/copy-class-code.tsx) |
| Liste ve gezinme | [list-controls.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/list-controls.tsx), [page-heading.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/page-heading.tsx), [workspace-nav.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/workspace-nav.tsx) |
| Yükleme ve formlar | [upload-form.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/upload-form.tsx), [cover-editor.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/cover-editor.tsx), [metadata-editor.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/metadata-editor.tsx), [form-outline.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/form-outline.tsx) |
| İnceleme | [version-detail.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/version-detail.tsx), [technical-report.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/technical-report.tsx), [curriculum-review.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/curriculum-review.tsx), [workspace-sections.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/workspace-sections.tsx) |
| Rapor ve çıktı | [assignment-report.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/assignment-report.tsx), [assignment-exports.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/assignment-exports.tsx) |
| Tasarım ve son teslimler | [DESIGN.md](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/DESIGN.md), [.21st/design.json](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/.21st/design.json), [çalışma alanı teslimi](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/docs/21ST-WORKSPACE-DELIVERY.md), [katalog dokunuşları](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/docs/CATALOG-TOUCHES-DELIVERY.md) |
