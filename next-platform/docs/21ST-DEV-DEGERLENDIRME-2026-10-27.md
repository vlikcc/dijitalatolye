# 21st.dev kullanım ve yatırım değerlendirmesi

27 Ekim 2026 · Dijital Oyun Atölyesi · Yerel uygulama ve güncel 21st hesabı

**Uygulama güncellemesi:** Bu araştırmadan sonra kullanıcı Builder aboneliğini aldı ve katalog, hesap ekranları, oyun detayını kapsayan önyüz pilotu uygulandı. Teslim kapsamı, önce/sonra görüntüleri ve test sonuçları [önyüz pilotu raporunda](21ST-FRONTEND-PILOT.md). Aşağıdaki yatırım değerlendirmesi araştırma anındaki önerileri korur.

**21st.dev uygulamamız için değerli bir tasarım ve kaynak keşif aracı. Ana sayfa, oyun kartları, giriş ve kayıt ekranlarında belirgin görsel değer; öğretmen raporları, ödev atama ve içerik incelemesinde kullanım kolaylığı sağlayabilir. Bu kazanımlar için ücretli hesap zorunlu değil.** İlk tercih ücretsiz kaynaklarla odaklı iyileştirmeler; yoğun bileşen toplama sürecine girersek Builder değerlendirilebilir. AI ile farklı tasarımlar üretmek istersek gereken paket Builder + AI.

Mevcut uygulama zaten özgün bir kimliğe, çalışan rol ayrımına, oyun çalıştırma altyapısına ve yayın sürecine sahip. En iyi sonuç; lacivert eylemleri, nötr zemini, Manrope ve Source Sans 3 yazılarını koruyarak seçilmiş parçaları bu akışlara uyarlamakla alınır.

## Karar özeti

| Öncelik | Yapılacak iş | Kullanıcıya kazandıracağı şey | 21st maliyeti |
|---|---|---|---|
| 1 | Ödev raporunda durum özeti, filtreler ve mobil öğrenci ayrıntısı | Öğretmen kimin başlamadığını ve kimin tamamladığını hızlı bulur | Ücretsiz yapılabilir |
| 2 | Ödev atarken aranabilir oyun ve öğrenci seçimi, gönderim özeti | Kalabalık listelerde seçim kolaylaşır; yanlış sınıfa veya gruba atama riski azalır | Ücretsiz yapılabilir |
| 3 | İnceleme kuyruğu ve İçeriklerim için arama, filtre ve belirgin sonraki eylem | Bekleyen iş ve öğretmenin yapması gereken işlem daha kolay bulunur | Ücretsiz yapılabilir |
| 4 | Uzun metadata ve değerlendirme formlarında bölüm özeti | Seçimler ve eksik değerlendirmeler daha kolay takip edilir | Ücretsiz yapılabilir |
| 5 | Sınıf katılımı ve öğrenci ödevleri için duruma göre yönlendirme | Kullanıcı beklemesi mi, kod girmesi mi, oyuna dönmesi mi gerektiğini anlar | Ücretsiz yapılabilir |
| Sonraki aşama | Tasarım alternatifleri ve PR tasarım incelemesi | Geliştirme ekibinin görsel karar ve kontrol sürecini destekler | Kullanıma göre Builder + AI |

Beklenen faydalar tasarım değerlendirmesidir; henüz kullanıcı deneyinde ölçülmüş zaman veya başarı artışı değildir. Aşağıdaki ölçüm planı, bu varsayımları sınamak içindir.

## Dashboard dışındaki önyüz için öneriler

Ana sayfa ve hesap ekranları da ayrı bir pilotu hak ediyor. Çalışma alanı öncelikleri, bu yüzeylerde tasarım fırsatı olmadığı anlamına gelmiyor. Mevcut lacivert ve ders renklerini kullanarak daha sıcak, oyunların içeriğini daha iyi gösteren bir arayüz kurulabilir.

### Ana sayfa ve oyun kartları

Bugünkü ana sayfa kısa başlık, arama ve oyun ızgarasıyla doğrudan keşfe yöneliyor. Önerim aramayı hemen erişilebilir tutan, masaüstünde başlığın yanında kendi oyunlarımızdan iki veya üç kapak kullanan **kompakt bir karşılama alanı**. Böylece ziyaretçi ilk bakışta hangi dünyaya girdiğini görür. Mobilde kapak kolajı küçülür veya kaldırılır; arama ve ilk oyunlar geriye itilmez.

[Hero with image, text and two buttons](https://21st.dev/@tommyjepsen/components/hero-with-image-text-and-two-buttons) bu yerleşim için sade bir referans. Katalog MIT etiketi ve Lucide bağımlılığı gösteriyor; kod alınacaksa tam kaynak lisansı ayrıca doğrulanır. Örnekteki görseller yerine kendi kesir, gezegen ve sözcük oyunlarımızın görselleri kullanılır. Mevcut başlık korunabilir; yeni pazarlama iddialarına ihtiyaç yok.

Kartlarda kapakların tutarlı kırpılması, başlık/açıklama yüksekliği, belirgin klavye odağı ve kısa hover geçişleri birlikte ele alınabilir. Büyük görselin üzerine çok sayıda etiket veya düğme yığılmamalı. Kayıt desteği gibi yeni bir işaret ancak gerçek veriye dayanır. Ek keşif grupları istenirse mevcut süre/oyun türü bilgisinden “Kısa bir oyun” veya “Eşleştirme oyunları” gibi bölümler üretilebilir; “en popüler” için gerçek kullanım verisi gerekir.

**Beklenen fayda:** daha güçlü ilk izlenim, oyunlar arasında daha rahat karşılaştırma ve atölyenin kendine özgü görünmesi. Ana sayfada ilk oyuna ulaşma süresi ve mobilde ilk ekranda görülen içerik, görsel değişimle birlikte ölçülmeli.

### Oyun sayfası

Oyun detayında büyük kapak, başlatma, sinema/tam ekran, öğretmen notları ve benzer oyunlar zaten var. Buradaki fırsat; oyun öncesi bilgileri daha iyi sıralamak ve ilgili içeriği daha okunabilir düzenlemek. Oyun başlamadan önce sınıf, süre ve oyun türünden oluşan kısa bir özet; mevcut öğrenme hedefi ve öğretmen notları için belirgin başlıklar; uzun notlarda açılır ayrıntı uygun olur. Kaynakta olmayan yönerge veya süre üretilmez.

21st’in kart, accordion ve sheet desenlerinden yararlanılabilir. Mobilde yardım ayrı bir panelde açılabilir; ana oyun alanı bu panelin altında çalışmaya devam ediyorsa odak ve kapanma davranışı doğru yönetilmelidir. Oyun başladıktan sonra görsel süs ve kalıcı örtüşen eylemler oyunun kontrolleriyle yarışmamalı.

**Beklenen fayda:** öğretmenin oyunun dersine uygunluğunu daha hızlı değerlendirmesi, öğrencinin oyun öncesi gerekli bilgiyi bulması. Bu sayfada bütün oynatıcıyı değiştirmek yerine bilgi hiyerarşisini iyileştirmek daha uygun.

### Giriş sayfası

Masaüstündeki mevcut ortalanmış formun yanına kendi oyun görsellerimiz ve kısa bir atölye anlatımı eklenebilir. Form tek ve açık kalır. Mobilde tanıtım alanı kaldırılarak doğrudan giriş alanları gösterilir. [Split Screen Login](https://21st.dev/@lavikatiyar/components/login) yerleşim örneği; hazır örneğin animasyon ve form paketlerini almak zorunlu değil. Mevcut giriş formunu kendi CSS düzenimiz içinde kullanabiliriz.

Girişe hangi işlemden gelindiyse, doğrulanmış hedefe bağlı “Girişten sonra oyun yüklemeye devam edeceksin” gibi bir bağlam gösterilebilir. Mevcut `next` yönlendirmesi korunur ve kullanıcıya ham URL yazdırılmaz. E-posta/kullanıcı adıyla ortak giriş devam eder; girişte yeni bir rol seçme zorunluluğu eklenmez.

**Beklenen fayda:** ana sayfayla daha tutarlı marka görünümü ve girişin ardından ne olacağının anlaşılması. Formun sade olması bir hata değildir; yan bölümün faydası görsel kimlik ve bağlamdır, giriş hızında artış garanti değildir.

### Kayıt sayfası

Mevcut Öğretmen/Öğrenci sekmeleri, altında birer satır açıklama bulunan iki seçenek olarak güçlendirilebilir: öğretmen için oyun paylaşma/sınıf yönetme; öğrenci için sınıf koduyla katılma. Bu, yeni bir kayıt adımı eklemeden doğru hesap türünü seçmeyi kolaylaştırır. Sekme değişiminde girilmiş değerlerin korunması sürdürülmeli.

Parola alanında “en az 12 karakter” metni bugün var; yazarken bu koşulun sağlandığını gösteren küçük metinsel kontrol eklenebilir. Sunucuda olmayan büyük harf/sembol kuralları veya gerçekte ölçülmeyen “güçlü parola” iddiası eklenmez. Sınıf kodu yardımının görünürlüğü ve hata sonrası odağın ilgili alana taşınması da değerlendirilebilir. [Layro Auth Forms](https://docs.21st.dev/@uvain/components/auth-forms-signin-signup) alan geri bildirimi ve durum düzeni için bir referans; örnekteki OTP/SMS akışı bizim e-posta bağlantısı doğrulamamızın yerine alınmaz.

Öğretmen kaydından sonra mevcut e-posta doğrulama mesajı ve yeniden gönderme işlemi, daha açık bir sonuç görünümünde sunulabilir. Öğrencide ise mevcut sınıf katılım durumuna uygun açıklama kullanılır. Sosyal giriş düğmeleri yalnız gerçekten desteklenen sağlayıcı varsa gösterilir.

**Beklenen fayda:** hesap türü ve gerekli bilgiler konusunda daha az tereddüt, düzeltilebilir hataların daha erken anlaşılması ve kayıt sonrasında açık yönlendirme.

### Önyüz pilotunun sırası ve kaynak seçimi

| Sıra | Paket | Görünür fark | İşlevsel katkı |
|---|---|---|---|
| 1 | Ana sayfa karşılama alanı ve ortak oyun kartı | Yüksek | Keşif ve karşılaştırma |
| 2 | Giriş/kayıt ortak düzeni ve açıklamalı hesap türü seçimi | Yüksek | Hesap türü ve sonraki adımın anlaşılması |
| 3 | Oyun detayının bilgi/yardım düzeni | Orta | Oyun öncesi hazırlık ve ders uygunluğunu anlama |

Bu pilot mevcut kaynaklar, görseller ve React/CSS ile ücretli abonelik olmadan yapılabilir. Seçilen katalog kodu kullanılacaksa dosya, lisans ve sürüm kaydı tutulur. Örneğin incelenen [Product Hero with Demo Panel](https://21st.dev/@felipemenezes098/components/hero-14) AGPL-3.0 etiketliydi; otomatik olarak MIT kaynak havuzumuza dahil edilmedi. Başka bir örneğin güzel görünmesi, lisansının ve bütün bağımlılıklarının projemize uygun olduğu anlamına gelmez.

Bu ek bölüm tasarım önerisidir; önyüz kodunda henüz değişiklik yapılmadı.

## İncelemenin dayanağı

Safari’de giriş yapılmış 21st hesabının katalog, bileşen, tema, şablon, uygulama ve yükseltme ekranları incelendi. ReUI veri tablosunda sayfalama çalıştırıldı; aranabilir seçim örneği açıldı; Clean Slate tema önizlemesinin renk, yazı ve kontrol kapsamı görüldü. Resmî fiyatlandırma, MCP, AI, Design Bug Bot, kullanım koşulları ve kaynak lisanslarıyla karşılaştırıldı. Bu değerlendirme, ürün alanlarını ve uygulamayla ilgili örnekleri kapsar; katalogdaki her bileşenin kalite denetimi değildir.

Uygulamada `localhost:3001` üzerinden katalog, arama önerileri, sonuçsuz arama, oyun detayı, gerçek demo başlatma ve giriş ekranı incelendi. Öğretmen, öğrenci, yönetici ve platform yönetimi için güncel kaynak kodu ile önceki yerel doğrulamanın 390/1440 px ekran görüntüleri kullanıldı. Korumalı rollerde bu araştırma sırasında yeni oturumlar açılarak uçtan uca test yapılmadı; aşağıdaki ekran bulguları kaynak ve kayıtlı görüntülerin birlikte değerlendirilmesine dayanır.

Yerel `.env` içinde öğrenci öğrenme özelliği açık; örnek ortam yapılandırmasında varsayılanı kapalı. Bu nedenle öğrenci, sınıf ve ödev önerileri mevcut yerel ürün kapsamına uygundur; canlı ortamın açık olduğu varsayılmamalıdır.

Önceki ücretsiz yükleme ve yayın takibi pilotu kaynakta mevcut. [Pilot doğrulama kaydı](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/docs/21ST-PILOT-VALIDATION.md) ayrı teslimdir; burada yeni fikir olarak tekrar sayılmıyor.

## Ücretsiz ve ücretli seçenekler

Safari yükseltme ekranında yıllık ödeme açıkken Builder 6 dolar/ay, kapatıldığında **8 dolar/ay ve üç aylık faturalandırma** gösterildi. Builder + AI için 500 kredi seçiliyken karşılıkları 15 ve 20 dolardı. Gözlenen ekranda tek aylık ödeme seçeneği bulunmadı.

| Paket | Gösterilen fiyat | Dönem bedeli | Bizim için anlamı |
|---|---:|---:|---|
| Free | 0 dolar | 0 dolar | Günlük iki bileşen kopyası; ilk uygulamalar için yeterli |
| Builder, üç aylık | 8 dolar/ay | 24 dolar/3 ay | Yoğun kaynak toplamada kota engelini kaldırır |
| Builder, yıllık | 6 dolar/ay | 72 dolar/yıl | Düzenli kullanım kanıtlandıktan sonra düşünülebilir |
| Builder + AI, üç aylık | 20 dolar/ay | 60 dolar/3 ay | 500 aylık krediyle tasarım üretimi ve inceleme denemesi |
| Builder + AI, yıllık | 15 dolar/ay | 180 dolar/yıl | Şimdilik gereksiz uzun taahhüt |

Dönem bedelleri gösterilen birim fiyatlardan hesaplandı; ödeme adımındaki vergi, kur ve son toplam doğrulanmadı. Free kopyalama kotası web, MCP ve CLI arasında ortak. Builder sınırsız kopyalama sağlar, AI kredisi sağlamaz. İptal erişimi dönem sonuna kadar korur; resmî sayfa ödemelerin iade edilmediğini belirtir. [Fiyatlandırma](https://21st.dev/pricing)

**Öneri:** Önce Free. Günlük kota seçilmiş işi somut olarak geciktirirse 24 dolarlık Builder dönemi düşünülebilir. Bir aylık deneme niyetiyle üç aylık ücretin kabul edildiği açık olmalı. Yalnızca bir tablo veya seçim alanı için abonelik gerekmiyor; üreticinin lisanslı açık kaynağı da kullanılabilir.

Abonelik geliştirme işçiliğini, barındırmayı, başka üreticilerin ücretli lisanslarını veya uygulamanın veri bağlantısını karşılamaz. Şablon kataloğunda “Free”, “Included in Plan” ve “Buy on 21st” ayrı kategoriler. Her şablonun pakete dahil olduğu kabul edilmemeli. [Şablonlar](https://21st.dev/community/templates)

## 21st ürün alanlarının bize uygunluğu

| Alan | Somut kullanım | Değerlendirme |
|---|---|---|
| Bileşen kataloğu | Tablo, seçim alanı, diyalog, durum kartı ve yüklenme düzeni karşılaştırmak | En yüksek değer; küçük parçaları uyarlamak uygun |
| CLI ve MCP | Kaynağı bulma ve projeye alma adımlarını kısaltmak | Geliştirici aracı; öğrenciye veya öğretmene doğrudan özellik eklemez |
| Themes | Ton, yüzey, kontrast ve kontrol düzenini karşılaştırmak | Mevcut kimliği denetlemek için yararlı; tüm temayı değiştirme önceliği yok |
| Templates | Gelecekte ayrı bir tanıtım veya yardım sitesi hazırlamak | Mevcut uygulamayı baştan kurmak için uygun yatırım değil |
| Icons | Eksik bir simgeyi anlamına göre bulmak | Lucide zaten var; sırf çeşitlilik için ikinci ikon sistemi eklemeyelim |
| Apps | Bağımsız açık kaynak projeleri keşfetmek | Çizim tahtası ve kullanım ölçümü için potansiyel; ayrı teknik kapsam |
| 21st AI | Aynı ekran için birkaç tasarımı yan yana üretmek | İhtiyaç netleştiğinde faydalı; mevcut Codex çalışmasının yanında ek tasarım maliyeti |
| Design Bug Bot | PR üzerindeki görsel tutarsızlıkları ikinci kez kontrol etmek | GitHub PR süreci kurulduğunda küçük deneme yapılabilir |
| Shader, gradient, ASCII, hareketli video/hero örnekleri | Tanıtım içeriğinde sınırlı görsel kullanım | Ders çalışma, rapor ve oyun yükleme ekranlarında düşük değer |

Clean Slate önizlemesi Inter yazı ailesi ve farklı yüzey/köşe değerleri kullanıyordu. Bütün temayı almak bizim Manrope/Source Sans 3 kimliğimizle ek uyarlama gerektirir. Yararlı olan, önizlemedeki kontrol tutarlılığını kendi tasarım değerlerimizle elde etmek. [Temalar](https://21st.dev/community/themes)

21st AI, Code/Sketch biçiminde birden fazla tasarım üretip ayrı ortamda karşılaştırmaya ve sonradan projeye entegre etmeye yarıyor. Bir ekran taslağı üretmesi; oturum, tarama, veritabanı veya yayın yetkilerini tamamladığı anlamına gelmiyor. Bizim için iyi deneme, sentetik verili ödev raporunun üç farklı düzeni olur. [21st AI](https://21st.dev/ai)

Design Bug Bot ilk beş başarılı incelemeyi ücretsiz sunuyor; sonraki incelemeler AI kredisi tüketiyor. GitHub erişimi gerektiriyor ve PR yorumları/önerileri üretiyor; otomatik birleştirmiyor. Görüntü üretimi başarılı render koşuluna bağlı. Kullanıcı testi ve mevcut Playwright doğrulamalarının yanında yardımcı kontrol olarak değerlendirilmeli. [Design Bug Bot](https://21st.dev/design-bug-bot)

## Uygulamanın bütün ana yüzeyleri için fırsatlar

### Keşif ve oyun

| Yüzey | Bugünkü durum | Faydalı ekleme | Öncelik ve kapsam |
|---|---|---|---|
| Ana sayfa ve keşfet | Arama önerileri, ders/sınıf filtresi, sonuç sayısı ve temizleme var | Ayrı ayrı kaldırılabilen etkin filtre etiketleri; katalog büyüyünce sıralama | Orta; mevcut filtre modeline eklenir |
| Sonuçsuz arama | Açıklama ve tüm oyunlara dönüş var | Hangi filtrenin sonuçları daralttığını görünür kılmak | Düşük; yeni boş durum paketi gerekmiyor |
| Oyun kartları | Sınıf, ders, süre, oyun türü, demo/yayın ayrımı ve kaydetme var | Gerçek verisi mevcutsa kayıt/ödev desteği etiketi | Orta; veri modelinin karta taşınması gerekir |
| Kaydettiklerim | Tarayıcıda tutulan kayıtlar ve boş durum var | Önce bu cihazda saklandığını açık anlatmak; sonra isteğe göre koleksiyonlar | Açıklama küçük iş; cihazlar arası koleksiyon yeni sunucu işi |
| Oyun detayı | Öğrenme hedefi, öğretmen notu, paylaşma, kaydetme, benzer oyunlar var | Uzun notlarda bölümlere geçiş; mevcut Ödev ver eyleminin bağlamını güçlendirmek | Orta; yeni paylaşma düğmesi gerekmiyor |
| Oyun oynatıcı | Başlatma, yeniden başlatma, sinema ve tam ekran var | Kayıt destekli oyunlarda mevcut kaydetme durumunu daha görünür sunmak | Duruma bağlı; iframe ve kayıt protokolü korunmalı |
| Gelecekte öğretmen çizim alanı | Oyun dışı çizim yüzeyi yok | Oyun öncesi kesir, şekil veya kavram açıklaması için tahta | Ayrı ürün denemesi; ilk üç işten sonra |

Keşifteki “kesir” araması iki gerçek öneri gösterdi. Sonuçsuz sorgu filtre temizleme bağlantısını sundu. Bu yüzden katalog aramasını hazır bir arama şablonuyla değiştirmek düşük getirili. Öğrenme çıktısına göre gelişmiş keşif ise anlamlı olabilir; yayınlanmış ve doğrulanmış kazanım ilişkilerini sorguya bağlamak gerekir. Yalnızca bir combobox eklemek yeterli değildir.

### Öğretmen çalışma alanı

| Yüzey | Bugünkü durum | Faydalı ekleme | Öncelik ve kapsam |
|---|---|---|---|
| Oyun yükleme | Tek dosya seçimi, sürükle-bırak, gerçek aktarım ve hata kurtarma pilotu mevcut | Gerçek öğretmenlerle anlaşılabilirlik ölçümü | Tamamlanan pilotu doğrula; yeniden inşa etme |
| Yayın takibi | Beş aşama, eski yayın/yeni taslak ve iptal bilgisi ayrılıyor | Duruma uygun ana eylemi tutarlı yerleştirme | Küçük tamamlayıcı iş |
| İçeriklerim | Doğru yayın/taslak açıklamalı liste var; arama ve filtre yok | Başlık araması; düzeltme, inceleme, yayında gibi filtreler | Yüksek; liste büyümesini yönetir |
| Metadata | Taslak, program bağlamı, kazanım araması, sayfalama ve seçilenler var | Bölüm bağlantıları; seçilenleri sürekli görünür özet; eksik alanlara geçiş | Yüksek; mevcut doğrulama ve taslak davranışı korunur |
| Kapak düzenleme | Yükleme, paketten seçme ve üretilen kapak seçenekleri var | Kartta kullanılacak oranı gösteren net önizleme | Orta; kırpma/yeni görüntü işlemi ayrıca değerlendirilir |
| Sınıflarım | Oluşturma, katılım kodu, üyelik onayı ve arşivleme var | Kod kopyalama; bekleyen/onaylı ayrımı; öğrenci arama | Yüksek, sınıf mevcudu arttıkça |
| Ödev oluşturma | Sınıf/oyun select alanı; tüm sınıf veya tek tek seçim; yerel tarih alanı var | Aranabilir oyun; seçilen öğrenci sayısı; son kontrol özeti | En yüksek önceliklerden biri |
| Ödevlerim | Açık/kapalı ve son tarih bilgili liste var | Sınıf ve durum filtresi, açık işler önce görünümü | Orta; tam takvim şart değil |
| Ödev raporu | Öğrenci başına yedi sütun; mobilde yatay kaydırma | Durum sayıları, arama/sıralama, mobil ayrıntı | En yüksek öncelik |

### Öğrenci ve hesap

| Yüzey | Bugünkü durum | Faydalı ekleme | Öncelik ve kapsam |
|---|---|---|---|
| Öğrenci Ödevlerim | Başla/Devam et/Sonucu gör; tarih, yönerge ve durum var | Aktif ve tamamlanan işleri ayırmak; yakın tarihli işi görünür kılmak | Yüksek; kart/listenin hiyerarşisi yeterli |
| Öğrenci boş ekranı | Henüz ödev yok açıklaması var | Sınıfa katılmamış, onay bekleyen ve ödev bekleyen durumlara ayrı metin/eylem | Yüksek ve küçük iş |
| Öğrenci Oyunlarım | Serbest oyun kayıtları ve devam et bağlantıları var | Son oynananı öne almak, gerçek kayıt durumunu tutarlı göstermek | Orta; oyunlardan gelen veriyle sınırlı |
| Öğrenci Sınıflarım | Kod girişi ve üyelik durumu var | Bekleme, onay ve arşiv durumuna kısa yönlendirme | Orta; çok aşamalı zorunlu tur gerekmiyor |
| Giriş ve kayıt | E-posta/kullanıcı adı, parola görünürlüğü, kurtarma ve rol akışı var | Markayla uyumlu ortak düzen; açıklamalı hesap türü seçimi; alan ve sonuç geri bildirimi | Görsel pilotta yüksek; mevcut auth mantığı korunur |
| Hesap ve güvenlik | Mevcut kimlik ve güvenlik işlemleri var | İşlem sonucu ve tehlikeli eylem onaylarını ortaklaştırmak | Orta; doğrulama/2FA sunucu davranışı korunmalı |

Öğrenci ekranındaki ilerleme, oyunun bildirdiği bilgidir. “Konuya hâkim oldu”, “sınıfın gerisinde” veya sıralama tablosu gibi değerlendirmeler mevcut ölçümden çıkarılamaz. Renk ve gösterge, eldeki durumun anlaşılmasını desteklemeli.

### İnceleme ve platform yönetimi

| Yüzey | Bugünkü durum | Faydalı ekleme | Öncelik ve kapsam |
|---|---|---|---|
| Yönetici inceleme kuyruğu | İncelemeye hazır sürümler eski oluşturulandan yeniye listeleniyor | Başlık/sınıf/ders filtresi; görünür sıra; sayfalama | Yüksek; doğru kuyruk zamanının tanımı ayrıca gerekli |
| Teknik rapor | Bulgular gruplu; engelleyici gruplar açık; kanıt ve çözüm metni var | Önem derecesi özeti ve bulgu filtresi | Orta; yeni tarama veya otomatik güvenlik kararı değildir |
| Eğitimsel değerlendirme | Beş başlık, teknik uyarı kararları, kazanım değerlendirmesi var | Eksik başlık sayısı; ilgili alana git; bölüm tamamlanma özeti | Yüksek; uzun formda atlamayı azaltır |
| Düzeltme ve yeni sürüm | Yönetici notu ve mevcut sürüm eylemleri var | Önceki/yeni bilgi farkını okunaklı gösterme | Orta; karşılaştırma verisi ve erişim kapsamı gerekir |
| Platform yönetimi | Kullanıcı/tanım/yayın/sistem/kayıt bölümleri; sunucuda arama ve sayfalama var | İhtiyaca göre sütun önceliği ve durum filtresi | Orta; mevcut sunucu sorguları korunur |
| İşlem geçmişi | Yönetim tarafında audit kayıtları var | Seçilmiş içerik için gerçek olaylardan okunabilir geçmiş | Sonraki aşama; yetkiye uygun yeni sorgu gerekir |
| Genel yüklenme/hata | Ortak yüklenme metni, hata ve bulunamadı sayfaları var | Rapor/katalog gibi yoğun alanlarda yerleşime uygun iskelet görünüm | Küçük iyileştirme; sahte ilerleme yüzdesi yok |
| Çalışma alanı gezinmesi | Rol bazlı menü ve bölümler var | Çok iş yapan yöneticiye isteğe bağlı komut menüsü | Sonraki aşama; normal menünün yerine geçmemeli |

## En güçlü beş uygulamanın ayrıntısı

### 1 Öğretmenin müdahale edebileceği rapor

**Bugün:** Bir öğrencinin durumunu anlamak için satırdaki durum, ilerleme, son puan, en iyi puan, deneme ve son etkinlik birlikte okunuyor. Mobil görüntü bütün sütunları aynı anda göstermiyor. [Mevcut mobil rapor](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/.impeccable/review/learning-report-390.png)

**Önerilen düzen:** Üstte atanan öğrenci sayısı ve birbirini dışlayan üç durum: başlamadı, devam ediyor, tamamladı. Altında öğrenci adı araması ve aynı durum filtreleri. Masaüstünde karşılaştırılabilir tablo; mobilde öğrenci adı, durum ve ana sonuç, açılabilen ayrıntıda diğer alanlar. Filtre uygulandığında “gösterilen / toplam” ayrımı açık kalır.

Veri kaynağı mevcut `assignmentReport`. Deneme sayısı, tamamlanma, son ilerleme/puan, en iyi puan ve son etkinlik zaten sorgulanıyor. İlk sürüm için yeni veritabanı şeması gerekmemesi beklenir. Kayıt desteği olmayan oyunlarda yalnız açıldı/açılmadı gösterilmeli; eksik puan sıfır yapılmamalı. Tamamlanmış eski deneme ile daha sonra başlayan yeni deneme birlikte varsa mevcut tamamlanma ve son deneme anlamları korunmalı.

21st’ten alınacak fikir **Data Table düzeni ve filtre araçları**. İlk sürümde grafik kütüphanesi zorunlu değil: sayılar ve kısa çubuklar mevcut React/CSS ile kurulabilir. Tam tablo motoru seçilirse TanStack bağımlılığı ve sürümü ayrıca kararlaştırılır. [shadcn Data Table](https://21st.dev/@shadcn/components/data-table)

Beklenen kazanım: öğretmen “kim başlamadı?” sorusundan öğrenci listesine tek filtreyle ulaşır. Kontrol görevi: aynı veriyle üç öğrenciyi bulma, son/en iyi puanı doğru yorumlama ve mobilde ayrıntıya erişme. Başarı, görev doğruluğu ve süreyle ölçülür.

### 2 Hatası daha zor bir ödev atama akışı

**Bugün:** Oyun listesi doğal select; belirli öğrenciler düz checkbox listesi. Sınıf büyüdükçe seçimleri gözden geçirmek uzuyor.

**Öneri:** Oyun başlığıyla arama; yanında sınıf/ders ve kayıt desteği bilgisi. Öğrenci listesinde arama, seçilen sayısı ve seçilenleri göster seçeneği. Gönder düğmesinden önce kısa özet: sınıf, oyun, alıcı sayısı, son tarih ve takibin kapsamı. Mevcut tarih alanı yeterli; bir takvim kütüphanesi ilk denemenin şartı değil.

Tek kişilik ReUI combobox örneği oyun seçimine görsel referans olabilir; öğrenci çoklu seçimi ayrıca tasarlanır. Sınıf değişince önceki sınıfın seçimleri gönderilmemeli. Arama görünmeyen seçilmiş öğrencileri sessizce silmemeli. “Tüm öğrenciler” ile “filtrede görünenler” aynı anlamda kullanılmamalı. Gönderme kilidi ve hata halinde seçimlerin korunması doğrulanmalı. [Lead Selection Combobox](https://21st.dev/@sean0205/components/c-combobox-23)

Beklenen kazanım: özellikle kalabalık sınıfta daha az seçim hatası. Kontrol görevi: belirli beş öğrenciye ödev verip gönderim özetinden alıcıları doğrulama. Gerçek öğrenci yerine test verisiyle başlanır.

### 3 Bekleyen işleri gösteren öğretmen ve yönetici listeleri

**Bugün:** İçeriklerim yayın ile yeni sürümü ayırıyor; yönetici kuyruğu yalnız inceleme durumundakileri listeliyor. Bu iki listede arama/filtre yok. [Mevcut kuyruk](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/.impeccable/review/unified/editor-1440.png)

**Öneri:** Öğretmende “işlemim bekleniyor”, “incelemede”, “yayında” filtreleri; satırda “Bilgileri tamamla”, “Düzeltmeyi aç” gibi doğru sonraki eylem. Yöneticide başlık, sınıf ve ders filtresi, açık sıralama ve sunucuda sayfalama. Kuyruğun kendisi yalnız inceleme sürümlerini içerdiği için buraya bütün yayın durumlarını gösteren işlevsiz bir filtre eklenmemeli.

Bu, arayüz parçasının yanında sunucu sorgusu işidir; mevcut yetkiler korunur. Yeni taslak varken eski yayın hâlâ açıksa iki bilgi de görünür kalır. “İncelemede geçen süre” istenirse dosyanın oluşturulma zamanı yerine gerçekten incelemeye gönderilme olayı kullanılmalı. Kaynakta olmayan tarih uydurulmaz.

Beklenen kazanım: bir sonraki iş daha hızlı seçilir. Kontrol görevi: 50 sentetik içerikten düzeltme bekleyen oyunu ve belli sınıftaki inceleme kaydını bulmak. Sürükle-bırak Kanban önermiyorum; durum geçişleri yetki ve iş kurallarına bağlı.

### 4 Uzun formda konumu ve eksikleri görmek

Metadata zaten kazanım arıyor, sayfalıyor ve seçilenleri listeliyor. Burada ihtiyaç yeni bir arama sistemi değil; uzun içeriğin daha anlaşılır düzenlenmesi. Genel bilgiler, program/kazanımlar ve kapak için bölüm bağlantıları; seçilmiş kazanım sayısı ve kaydetme durumunun özeti yeterli başlangıç olur. Küçük listelerde doğal select korunur.

İnceleme formunda beş değerlendirme başlığı ile teknik uyarı kararları birbirinden ayrılarak özetlenebilir. “İnceleme yüzde 80 güvenli” gibi bir çıkarım yerine “5 başlıktan 3’ünde karar var” denir. Eksik başlığa geçiş, formun mevcut değerlerini ve taslağını korumalı. [Mevcut uzun değerlendirme formu](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/.impeccable/review/assessment-detail-390.png)

Beklenen kazanım: kaydırma ve alan arama yükünün azalması, eksik başlıkların görünür olması. Kontrol görevi: uzun kazanım metinleri arasında seçim yapma, bölüm değiştirme ve taslağı yeniden açma. Kaynak kanıtı, doğrulama durumu, program/yıl/sınıf ayrımı korunur.

### 5 İlk kullanımda doğru sonraki adım

Öğretmen için “sınıf oluştur → kodu paylaş → katılımı onayla → ödev ver” işlemleri zaten var. Bunlar gerçek tamamlanma durumlarından türeyen küçük bir başlangıç listesinde birleştirilebilir. Tamamlanan işin tekrar yapılması istenmez.

Öğrenci için üç ayrı boş durum gerekir: hiç sınıfı yoksa kod girişi; üyeliği bekliyorsa öğretmen onayı açıklaması; üyeliği aktif ama ödevi yoksa öğretmenden ödev beklediğini anlatan kısa metin. Her durum için tek açık eylem veya bekleme açıklaması. Yeni özellik tanıtım kartları bu amaçla referans olabilir; her girişte açılan zorunlu tur gereksizdir. [Feature Discovery Alert](https://21st.dev/@sean0205/components/c-alert-18)

Beklenen kazanım: yardım istemeden ilerleyebilme. Kontrol görevi: ilk defa gelen öğretmen/öğrencinin sıradaki adımı kendi sözleriyle açıklaması. Açılır turu kapatabilmek de test edilir.

## Somut bileşen kısa listesi

Bu liste üretime alınmış kod değildir. Önizleme, bağımlılık ve lisans işaretleriyle seçilmiş adaylardır. Her kod alımında tam kaynak ve commit sabitlenmeli. Katalogdaki MIT etiketi ile üreticinin güncel premium ürünleri aynı kapsam sayılmamalı.

| Aday | Kullanacağımız yön | Almayacağımız veya ayrıca doğrulayacağımız yön |
|---|---|---|
| [shadcn Data Table](https://21st.dev/@shadcn/components/data-table) | Rapor filtreleri, sıralama, sayfalama | Ödeme/e-posta demo verileri ve gereksiz toplu işlem menüleri; TanStack uyumluluğu |
| [ReUI Data Grid Table](https://21st.dev/@sean0205/components/data-grid-table/auto-width-table) | Satır, sütun ve ayrıntı düzenleri için karşılaştırma | Tüm grid paketini ilk sürüme taşımak; katalog birden çok dnd-kit paketi listeliyor |
| [Lead Selection Combobox](https://21st.dev/@sean0205/components/c-combobox-23) | Aranabilir oyun seçiminin açılma/sonuç düzeni | Kişi avatarları ve “No lead”; Base UI ek bağımlılığı; çoklu seçim hazır varsayılmaz |
| [Statistics Card 2](https://21st.dev/@sean0205/components/statistics-card-2) | Raporun durum sayılarında başlık/değer hiyerarşisi | Gelir ve büyüme örnekleri; hayalî artış yüzdeleri |
| [Donut Chart With Center Total](https://21st.dev/@sean0205/components/c-chart-19) | İleride durum dağılımını karşılaştırmak için alternatif | İlk sürümde zorunlu değil; Recharts yükü, renk dışı etiketler, boş veri durumu |
| [Chart filter](https://21st.dev/@shadcn/components/chart-filter) | Tarih aralıklı rapor ihtiyacı doğarsa örnek düzen | Hazır ziyaretçi serisi; yeni tarih sorgusu, Türkçe yerelleştirme ve Recharts/date-picker bağımlılıkları |
| [Sheet](https://21st.dev/@sean0205/components/sheet) | Mobilde öğrenci satırı ayrıntısı için olası desen | Zorunlu değil; basit açılır ayrıntı daha hafif olabilir. Modal ise odak/Escape/geri dönüş testi gerekir |
| [Alert Dialog](https://21st.dev/@sean0205/components/alert-dialog) | Arşivleme veya erişim kapatma öncesi işlem kapsamını açıklamak | Mevcut onay mekanizmasını daha zayıf, kolayca kapanan bildirime dönüştürmek |
| [Skeleton](https://21st.dev/@sean0205/components/skeleton) | Rapor ve katalog yüklenirken yerleşimi korumak | Sürekli parlayan animasyon; gerçek yüklenme tamamlanınca gecikmeli gösterim |
| [Basic Command Palette](https://21st.dev/@sean0205/components/c-command-1) | İleri kullanıcıya rolüne uygun hızlı gezinme | Öğrenci ana menüsünü gizlemek; yetkisiz veya yıkıcı işlemleri tek tuşa bağlamak |
| [Feature Discovery Alert](https://21st.dev/@sean0205/components/c-alert-18) | İlk sınıf ve ilk ödev için tek bağlamsal yardım | Sürekli pazarlama bildirimi veya zorunlu tur |
| [Extend File Upload](https://21st.dev/@extend-hq/components/file-upload) ve [ReUI Stepper](https://21st.dev/@sean0205/components/stepper/vertical) | Önceki pilotta kullanılan dosya alanı ve aşama deseni | Çoklu kuyruk, hareketli çerçeve, aşamalar arası serbest gezinme; bunlar pilotta alınmadı |

shadcn ve ReUI kök depolarındaki MIT lisansları doğrulandı. ReUI ayrıca premium bloklar/ikonlar için lisans anahtarı istiyor; 21st aboneliğinin bunu otomatik karşıladığı varsayılamaz. Bazı katalog bağlantıları eski API örneklerine gidiyor: güncel shadcn/ReUI tablo belgeleriyle örnek kodun sürümü eşleştirilmeli. [shadcn lisansı](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md), [ReUI lisansı](https://github.com/keenthemes/reui/blob/main/LICENSE.md), [ReUI ücretsiz/premium ayrımı](https://reui.io/docs/license-setup), [güncel tablo belgesi](https://ui.shadcn.com/docs/components/data-table)

Önceki pilotun Extend `331a0b1bf35faa61f4ed946c7dbaa524ff3e851f` ve ReUI `067aa0dc7f8bbfec1cd76fc5ad31f842be5f569a` sabitlemeleri korunur. Yeni örnekleri eski pilotun lisans kaydı kapsıyormuş gibi değerlendirmemeliyiz. Origin UI önceki kaynak yönlendirmesi nedeniyle pilot dışında bırakılmıştı; bu raporda da uygulama adayı yapılmadı. [Pilot kaynak ve MIT kayıtları](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/docs/third-party/21st-pilot.md)

## Ayrı ürün değeri yaratabilecek iki uygulama

**Öğretmen çizim tahtası:** 21st Apps içindeki Excalidraw, React editörü olarak da kullanılabilen çizim yüzeyi sunuyor. Kesirleri şekille anlatmak veya oyundan önce kavram haritası çizmek, eğitsel açıdan anlamlı bir deneme olabilir. İlk kapsam öğretmenin geçici çizimi ve dışa aktarması olmalı. Hesaba kaydetme, öğrenciyle ortak düzenleme ve oyun üstüne çizme ayrı ihtiyaçlardır. Oyun iframe’ini kaplayan bir tahta yerine ayrı yüzey daha yönetilebilir. Kullanım ihtiyacı üç öğretmenle doğrulanmadan ana pakete eklenmemeli. [21st kaydı](https://21st.dev/community/apps/excalidraw), [sabitlenmiş MIT lisansı](https://github.com/excalidraw/excalidraw/blob/afa3a653fc5d2b742adcbd5a6063187b056d2419/LICENSE)

**Kullanım ölçümü:** Umami, hangi ekranların kullanıldığını ve belirli etkileşimleri ölçmek için ayrı bir araç olabilir. Böylece “hangi iyileştirme işe yaradı?” sorusu daha iyi yanıtlanır. Bu, öğrenci notlarını değerlendirme sistemi değildir. Kendi sunucumuzda kurulumun da işletim, saklama ve bakım maliyeti var. Başlangıçta kişisiz görev ölçümleri ve test oturumları yeterli olabilir; öğrenci adı, puanı, dosya adı veya serbest metin sorgusunu analitik olayı olarak göndermek gerekmiyor. [21st kaydı](https://21st.dev/community/apps/umami), [sabitlenmiş MIT lisansı](https://github.com/umami-software/umami/blob/ca661c7057984aa98ed4f7083d84dae2f65bfcb0/LICENSE)

Bu iki projenin açık kaynak olması Builder satın alımına bağlı değil. Ücretsiz kaynak lisansı, barındırma ve entegrasyonun ücretsiz olduğu anlamına gelmez.

## MCP bağlantısının durumu ve sağlayacağı fayda

Kullanıcı MCP’yi Codex’e kurduğunu belirtti. Bu oturumun kullanılabilir araçlarında 21st görünmedi; görünür yerel MCP yapılandırması ve eklenti aramasında da etkin bağlantı doğrulanamadı. Bu, kurulumun yapılmadığı anlamına gelmez; mevcut sohbetin bağlantıyı kullanabildiği henüz gösterilemedi. Safari oturumu çalıştığı için araştırma tamamlandı.

Resmî MCP, bileşen arama ve kaynak alma işini geliştirme aracına taşır. Safari’de oturum açılması tek başına bu bağlantının doğrulanması değildir; istemcinin yetkilendirmesi de gerekir. Sonraki kod alımı öncesinde Codex’te görünen sunucu ve bağlantı durumuyla bir ücretsiz arama denenmeli. Anahtar konuşmaya veya rapora yazılmamalı. [Resmî MCP kurulumu ve kotalar](https://21st.dev/mcp)

En yararlı kullanım, “öğretmen raporu için sade, mobilde anlaşılır bir tablo bul” gibi hedefli arama; ardından kaynak, bağımlılık ve lisans incelemesidir. Aracın indirdiği her şeyi olduğu gibi projeye eklemek uygun değil. Kaynak kod projeye alınıp yerel verilere bağlandığında öğretmenlerin ayrıca 21st hesabı kullanması gerekmez.

## Uygulama maliyeti ve bakım

| İş | Yaklaşık mühendislik eforu | Ek veri/altyapı |
|---|---:|---|
| Rapor özeti, filtre ve mobil ayrıntı | 2–4 iş günü | Mevcut rapor sorgusu; büyük veri için sayfalama ayrıca |
| Ödev oyun/öğrenci seçimi ve gönderim özeti | 1–3 iş günü | Mevcut API; ek oyun açıklama alanları gerekebilir |
| İçeriklerim ve inceleme kuyruğu filtreleri | 2–3 iş günü | Sunucu sorguları ve sayfalama |
| Uzun form bölüm/eksik özeti | 1–3 iş günü | Form durumu, taslak ve doğrulama uyumu |
| Bağlamsal başlangıç ve boş durumlar | 1–2 iş günü | Mevcut sınıf/üyelik/ödev durumu |
| Çizim tahtası veya analitik | Ayrı keşif gerekir | Paket, saklama/işletim ve erişim kapsamı |

Bunlar tek geliştirici için kaba planlama aralıklarıdır; takvim taahhüdü veya ölçülmüş süre değildir. Rol, mobil ve hata kontrolleri dahildir; yeni veri ihtiyaçları süreyi artırır. Aynı ortak parçalar tekrar kullanılabileceğinden satırları doğrudan toplamak yanıltıcı olabilir.

Mevcut projede React, Lucide ve sınırlı Radix bileşenleri var; TanStack Table, Recharts, Base UI ve dnd-kit mevcut paket listesinde yok. İlk denemeyi mevcut React/CSS ile kurmak mümkün. Tam kaynak alımı seçilirse bağımlılık bütçesi ayrıca kararlaştırılır. Büyük grid, tarih seçici ve grafik paketlerinin sadece gerekli sayfalarda yüklenmesi değerlendirilir; bütün ana sayfaya taşınmaz.

Hazır bileşenin tasarım ve ilk kodlama süresini azaltması beklenir. Asıl iş veri bağlantısı, rol kontrolü, Türkçeleştirme, erişilebilirlik ve testtir. Örneğin tablo bileşeninin kendi API’si bizim PostgreSQL sorgularımızı veya öğretmenin yalnız kendi sınıfını görebilmesini sağlamaz. [shadcn tablo mimarisi](https://ui.shadcn.com/docs/components/data-table)

## İlk 30 gün için ölçülebilir deneme

Bu bir çalışma önerisidir; zamanlanmış otomasyon veya abonelik başlatılmadı.

| Dönem | İş | Karar için tutulacak kayıt |
|---|---|---|
| 1–3. gün | Mevcut pilotu öğretmenlerle incele; rapor/atama/kuyruk görevlerini mevcut ekranda denetle | Görev doğruluğu, süre, yardım isteme ve karışan terimler |
| 4–10. gün | Rapor ve ödev seçimini ücretsiz kaynaklarla yerelde uygula | Alınan kaynak, uyarlama süresi, yeni bağımlılıklar, hata durumları |
| 11–17. gün | Kuyruk ve İçeriklerim filtrelerini ekle; aynı görevleri karşılaştır | Filtrelerin bulunması, doğru kayıt/alıcının seçilmesi |
| 18–24. gün | En sık görülen form/ilk kullanım sorununu düzelt | Gerçek sorunun çözüldüğü görev kanıtı |
| 25–30. gün | Kazanım ve bakım yükünü değerlendir | Devam edilecek parçalar; ücretli hesaba ihtiyaç olup olmadığı |

Önerilen küçük test grubu 3–5 öğretmen ve 1–2 içerik inceleyicisi. İlk denemede örnek öğrenci verisi kullanılır. Aynı görevin önce/sonra tekrarı öğrenme etkisi yaratacağından görev sırası değiştirilmeli; küçük örneklemden genel yüzde iddiası çıkarılmamalı.

| Ölçüt | Nasıl değerlendirilir |
|---|---|
| Rapor anlaşılabilirliği | Başlamayanları doğru bulma; son puan ile en iyi puanı karıştırmama |
| Atama doğruluğu | Doğru sınıf ve öğrenci grubuyla tamamlama; yanlış alıcı sayısı sıfır olmalı |
| Kuyruk verimliliği | Aranan inceleme kaydını bulma ve doğru sonraki eylemi seçme |
| Form güvenilirliği | Bölüm/filtre değişiminde seçim ve taslak kaybı olmaması |
| Yayın doğruluğu | Eski yayın + yeni taslak, iptal ve hata durumlarında yanlış “yayında” olmaması |
| Erişilebilirlik | Klavye, görünür odak, 320/390/768/1440 px, uzun Türkçe metin, %200 büyütme ve azaltılmış hareket |
| Geliştirme getirisi | Kaynak arama/kopyalama tasarrufu eksi uyarlama, bağımlılık ve hata düzeltme süresi |

Builder kararı için somut eşik: seçilmiş işlerde ücretsiz kota gerçekten beklemeye yol açıyor mu? Builder + AI için: üretilen alternatiflerden biri mevcut yöntemle elde edilenden daha yararlı bulundu mu ve kullanılan kredi/entegrasyon süresi kabul edilebilir mi? Yalnızca daha çok örnek görmek, tek başına satın alma gerekçesi değil.

## Bu aşamada eklenmemesi gerekenler

- Hareketli arka plan, parıltı, cursor efekti, ağır 3B kart ve sürekli konfeti. Öğrenme/raporlama görevine belirgin katkıları yok.
- Tüm uygulamayı yeni dashboard veya auth şablonuna taşımak. Mevcut rol, kayıt ve oyun akışlarının yeniden bağlanması gerekir.
- Yayın durumlarını sürükleyerek değiştiren Kanban. Gerçek durum geçişleri güvenlik ve onay kurallarına bağlı.
- Verisiz başarı grafikleri, otomatik öğrenme teşhisi veya öğrenciler arası sıralama. Oyun sonucu ile kazanım hâkimiyeti aynı veri değil.
- Çalışmayan bir bildirim altyapısının önüne bildirim çanı koymak. Kalıcı bildirim için olay, okunma ve yetki modeli gerekir.
- Sadece görünüm uğruna büyük grafik/tablo paketleri veya yeni bir ikon ailesi eklemek.
- 21st AI’ı öğretmene oyun üretme özelliği gibi sunmak. Tasarım üretimi ile güvenli eğitim oyunu üretimi farklı ürün kapsamlarıdır.

## Kaynak kullanımı ve teslim sınırı

Kopyalanacak her bileşenin dosyası, sürümü, lisansı ve bağımlılıkları kaydedilmeli. MIT bildirimleri korunmalı; katalog önizlemesindeki görsellerin ve marka varlıklarının kaynak kodla aynı kullanım hakkına sahip olduğu varsayılmamalı. 21st kullanım koşulları kaynak ve önizleme materyallerini ayırıyor. [Kullanım koşulları](https://21st.dev/terms)

AI tasarım denemelerinde sentetik sınıf/öğrenci verisi yeterli. Servis gönderilen prompt ve kodu işler; kendi model eğitimi için rıza beyanı, dışarı hiç veri gitmediği anlamına gelmez. Bu raporu hazırlamak için öğrenci verisi veya proje kaynakları 21st’e yüklenmedi. [Gizlilik politikası](https://21st.dev/privacy)

Bu teslim araştırma ve öneri raporudur. Uygulamanın çalışma kodu değiştirilmedi; yeni test çalıştırma, satın alma, MCP kurulumu veya canlı dağıtım yapılmadı. Mevcut pilotun test sonuçları kendi doğrulama kaydında kalır.

## Yerel teknik kanıt ve çalışma noktaları

| Konu | Kaynak |
|---|---|
| Ürün kapsamı ve görsel kimlik | [PRODUCT.md](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/PRODUCT.md), [DESIGN.md](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/DESIGN.md) |
| Arama ve mevcut filtreler | [catalog-search-field.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/catalog-search-field.tsx), [catalog-view.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/catalog-view.tsx) |
| İçerik detayı ve mevcut Ödev ver eylemi | [Oyun detayı](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/app/icerik/[slug]/page.tsx) |
| Rapor görünümü ve gerçek sorgu | [Ödev raporu](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/app/ogretmen/odevler/[id]/page.tsx), [learning.ts](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/modules/learning.ts) |
| Ödev seçimi ve sınıf işlemleri | [learning-forms.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/learning-forms.tsx), [Sınıflarım](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/app/ogretmen/siniflar/page.tsx) |
| Öğrenci durumları | [Öğrenci çalışma alanı](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/app/ogrenci/page.tsx), [Özellik anahtarı](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/server/learning-feature.ts) |
| İnceleme ve içerik listeleri | [İnceleme kuyruğu](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/app/editor/page.tsx), [İçeriklerim](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/app/ogretmen/page.tsx) |
| Uzun formlar | [Metadata](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/metadata-editor.tsx), [Değerlendirme](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/assessment-form.tsx) |
| Mevcut teknik gruplama | [technical-report.tsx](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/technical-report.tsx) |
| Yönetimde var olan arama/sayfalama | [Platform yönetimi](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/app/yonetim/page.tsx), [Liste kontrolleri](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/src/components/list-controls.tsx) |
| Önceki ücretsiz pilot | [Doğrulama](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/docs/21ST-PILOT-VALIDATION.md), [Kaynak ve lisanslar](/Users/mbp/Documents/Projects/MEM/dijitalatolye/next-platform/docs/third-party/21st-pilot.md) |
