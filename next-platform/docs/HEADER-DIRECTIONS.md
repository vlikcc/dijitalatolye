# Header ve menü yönleri

27 Ekim 2026. Tasarım keşfinin ardından kullanıcı “Sağda tek grup” yönünü seçti ve gerçek uygulama güncellendi. Aşağıdaki karşılaştırma kararın gerekçesini korur; uygulama ve doğrulama sonucu [HEADER-DELIVERY.md](HEADER-DELIVERY.md) dosyasındadır.

## Mevcut sorunun kaynağı

- `header-navigation.tsx`: keşif bağlantıları ve paylaşım/hesap işlemleri tek bir navigasyonda. `globals.css` içindeki `.nav-discovery { margin-inline: auto }` keşif grubunun iki tarafında büyüyen boşluklar oluşturuyor. 1440 px tarayıcıda logo yaklaşık x=68–230, keşif x=556–814, paylaşım/giriş x=1141–1372. Kullanıcı üç ayrı kümeyi taramak zorunda kalıyor.
- Misafir için “İçerik paylaş” → `/giris?next=%2Fogretmen%2Fyeni`, “Giriş yap” → `/giris`. Girişten sonraki hedefler farklı, fakat ilk ekranın başlığı ve açıklaması aynı. Kullanıcının iki eylemi aynı sanması anlaşılır.
- Header “İçerik paylaş”, alt menü ve çalışma alanı “Oyun paylaş” diyor. Tek eylem için tek isim kullanılmalı. Buradaki paylaşım, bir oyunun bağlantısını paylaşmaktan da ayrılmalı.
- `/` ve `/kesfet` aynı aktif “Oyunlar” durumuna sahip. Ana sayfa ayrı bir vitrin olduğu için bağlantı yalnız `/kesfet` üzerinde seçili görünmeli; ana sayfa bağlantısı logo.
- Kaydettiklerim, giriş durumundan bağımsız olarak tarayıcı ve origin temelinde yerel saklanıyor. Hesap menüsüne taşımak veya giriş zorunluymuş izlenimi vermek yanlış olur.
- 1100 px altında bütün bağlantılar menüye saklanıyor. Daha kompakt bir header ile gerçek içerik sığma sınırı yeniden ölçülmeli; eşik keyfî düşürülmemeli.

## Önerilen yön: Sağda tek grup

Misafir: `Logo — esnek boşluk — Oyunlar · Kaydettiklerim · Öğretmenler için | Giriş yap`

Öğretmen/Yönetici: `Logo — esnek boşluk — Oyunlar · Kaydettiklerim · + Oyun paylaş | Atölyem ▾`

Öğrenci: `Logo — esnek boşluk — Oyunlar · Kaydettiklerim | Atölyem ▾`

Admin: `Logo — esnek boşluk — Oyunlar · Kaydettiklerim | Yönetim ▾`

Bağlantıları mevcut içerik konteynerinin sağına hizala; ekranın fiziksel kenarına yaslama. Keşif bağlantıları metin ağırlıklı, kayıt simgesi yardımcı, hesap tarafı ince bir ayraçla ayrılmış olsun. Header'da paylaşım için baskın renkli CTA kullanma: ürünün önceliği oyun keşfi. Mevcut logo, lacivert/nötr yüzeyler, Manrope/Source Sans 3 ve 44 px dokunma hedefleri korunur.

“Öğretmenler için” yeni bir herkese açık `/ogretmenler-icin` sayfasını açar. Bu sayfa hesap istemeden HTML/ZIP yükleme, bilgi tamamlama ve insan incelemesi adımlarını açıklar. Ana eylemi “Paylaşmak için giriş yap”, ikincili “Öğretmen hesabı oluştur”. İki eylem de güvenli dönüş hedefini korur. `/giris?next=…` paylaşım niyeti taşıyorsa giriş ekranı “Oyununu paylaşmak için giriş yap” ve “Girişten sonra oyun yüklemeye devam edeceksin” metinlerini gösterir. Ayrı bir kimlik doğrulama sistemi veya öğretmen giriş sayfası oluşturulmaz.

Giriş yapmış ve `can(role, "create")` yetkisi olan kullanıcı doğrudan `/ogretmen/yeni` sayfasına gider. Öğrenci ve Admin için paylaşım eylemi görünmez. Genel giriş hâlâ ortak `/giris` üzerinden rolün çalışma alanına gider. `safeReturn` ve rol doğrulaması aynen korunur.

Hesap açılır menüsü yalnız görevleri ve hesabı içerir: öğretmende İçeriklerim; yöneticide ayrıca İnceleme kuyruğu; öğrencide Ödevlerim/Sınıflarım; adminde Sistem yönetimi. Öğretmen sınıf/ödev bağlantıları yalnız mevcut öğrenme özelliği açıkken görünür. Hesabım ve Çıkış yap ortak. Header'da zaten görünür olan Oyun paylaş ve Kaydettiklerim burada tekrar edilmez. Mevcut çalışma alanı kenar menüsü korunur; mobilde görev bağlantıları tek bir yerde sunulur.

## Üç karşılaştırılabilir seçenek

| Yön | Kompozisyon ve etkileşim farkı | En uygun durum | Bedel / erişilebilirlik konusu |
| --- | --- | --- | --- |
| **Sağda tek grup** | Tek sıra, bütün navigasyon sağda. Misafir paylaşım yerine öğretmenlere yönelik açıklama sayfasına gider; hesap işlemleri ayrı açılır menüdedir. | Mevcut vitrin ve kısa menü. Önerilen. | Sağ grup daralınca mobil menüye geçmeli. Öğretmen paylaşımına misafir için bir açıklama adımı eklenir. |
| **Keşif solda** | Oyunlar/Kaydettiklerim logoya yakın; sağda doğrudan Oyun paylaş çağrısı ve sade giriş. Paylaşım yine açıklama sayfasını açar. | Sık geri dönen öğretmenler; keşif ve üretimin birlikte önem kazandığı ürün. | Logo tarafı daha yoğun, “Oyun paylaş” misafire güçlü bir beklenti verir. Formdan önceki açıklama iyi yazılmalı. |
| **Arama üstte** | İlk satır logo/arama/hesap; ikinci satır navigasyon. Arama global ve sürekli erişilebilir olur; sayfa içindeki arama kaldırılır. | Katalog ve filtreleme kullanımının ana vitrine baskın olduğu aşama. | Header daha yüksek. Mevcut canlı vitrinle rekabet eder; tablet/mobilde iki arama olmamalı. Şimdilik önerilmiyor. |

Tüm yönlerde aynı marka, etiketler, yetkiler, hesap akışı ve klavye erişimi korunur. Etkileşimli örneklerde hesap rolü, mobil görünüm ve öğrenme özelliği değiştirilebilir. Örnek giriş/yükleme alanları işlem yapmaz; hiçbir hesap veya içerik oluşturmaz.

## Menüye ekleme sınırı

- İlk aşamada yalnız öğretmenlere yönelik açıklama ve düzenli hesap açılır menüsü eklenmeli.
- Kaydettiklerim sayfasındaki yerel saklama bilgisi görünür kalmalı. Sayı eklenecekse gerçek yerel kayıt sayısından türetilmeli; boşta 0 rozeti ile menü ağırlaştırılmamalı.
- Dersler ve sınıf filtreleri katalogda kalmalı; header'da ikinci kez çoğaltılmamalı.
- Bildirim, blog, mega menü, tema düğmesi veya işlevi olmayan yardım bağlantıları eklenmemeli. Bunlar mevcut kullanıcı görevlerinden çıkmıyor.

## 21st kaynakları ve uygulama sınırı

- [Centered Nav Header — olewandowski1](https://21st.dev/@olewandowski1/components/centered-nav-header), demo 21220: navigasyon ve hesap/eylem alanlarının ayrılması, mobil davranış. Kaynak ve demo incelendi. Mutlak ortalama modeli mevcut soruna çözüm olmadığı için önerilen yönde alınmadı.
- [Dropdown Menu — originui](https://21st.dev/@originui/components/dropdown-menu), demo 393: kimlik bilgisi, görev bağlantıları, ayraç ve çıkış grubu. Kaynak ve demo incelendi; rol politikası projeden alındı.
- [Header with Search — efferd](https://21st.dev/@efferd/components/header-with-search), demo 8127: aramanın header'a taşındığı alternatif için katalog açıklaması incelendi; kaynak kod alınmadı.

21st UI Build, katalog ve UI Explore iş akışları kullanıldı. AI üretim erişimi kapalı; katalog üzerinden arama ve iki kaynak incelemesi yapıldı. Önizlemeler bağımsız yazıldı; katalog kodu veya yeni bağımlılık projeye eklenmedi. Seçim yapılmadığı için `.21st/design.json` içine onaylanmış karar yazılmadı.

## Seçimden sonra uygulama ve doğrulama

`header-navigation.tsx`, ilgili `globals.css` kuralları, ortak header'ın rol/hesap verisi, öğretmen açıklama sayfası ve giriş bağlamı birlikte ele alınmalı. Açılır menü Escape/dışarı tıklama/klavyeyle ayrılmada kapanmalı; odak tetikleyiciye dönmeli. Yan yana iki “Atölyem / hesabım” tetikleyicisi üretilmemeli. Uzun ad ve rol etiketleri yerleşimi bozmamalı.

320, 390, 768, 1024 ve 1440 px; misafir/öğretmen/öğrenci/yönetici/admin; öğrenme özelliği açık/kapalı; klavye, aktif bağlantı, giriş-kayıt-doğrulama sonrası güvenli dönüş ve mobilde yinelenmeyen görev bağlantıları kontrol edilmeli. Mevcut bookmark saklama ve yetki politikası değiştirilmemeli. Üretim kodu uygulandığında tür kontrolü, ilgili header/auth testleri ve `21st review` çalıştırılmalı.

## Önizleme doğrulaması

Yerel Chrome kontrolünde üç seçeneğin her biri 320, 390, 768, 790 ve 1024 px genişlikte açıldı: 15 yerleşimde yatay taşma görülmedi. Düzen geçişleri, menü içinden Kaydettiklerim'e erişim ve seçili düzenin korunması kontrol edildi. Dört oturum rolü × üç düzen için 12 hesap menüsü kontrolü geçti; paylaşım yetkisi, Escape ile kapanma ve odağın tetikleyiciye dönüşü doğrulandı. Genel giriş ile paylaşım amacıyla giriş farklı açıklamalar gösterdi; tarayıcı JavaScript hatası kaydedilmedi.

Bu kontroller etkileşimli tasarım örneğine aittir; gerçek oturum açma, yükleme, üretim kodu veya dağıtım testi değildir. Uygulama kaynakları değişmediği için proje testleri ve 21st kaynak kod incelemesi bu keşif aşamasında çalıştırılmadı.
