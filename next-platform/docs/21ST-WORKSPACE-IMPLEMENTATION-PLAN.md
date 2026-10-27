# 21st Builder ile çalışma alanı iyileştirme planı

27 Ekim 2026 · Dijital Oyun Atölyesi · Durum: beş geliştirme paketi uygulandı

Uygulama ve doğrulama ayrıntıları [teslim kaydındadır](21ST-WORKSPACE-DELIVERY.md). Aşağıdaki metin kabul edilen kapsamı korur; gerçek kullanıcı pilotunun ölçümü ayrı aşamadır.

## Amaç ve doğrulanmış başlangıç

Kullanıcının seçtiği beş öncelik: ödev raporu, ödev atama, İçeriklerim/inceleme kuyruğu, uzun form özetleri ve ilk kullanım yönlendirmesi. Hedef; öğretmenin doğru öğrenciyi, alıcı grubunu ve sonraki işlemi bulmasını; yöneticinin incelemeyi eksiksiz tamamlamasını kolaylaştırmak.

- Builder satın alımı önceki teslim kaydında mevcut. Bu oturumda `21st@21st` sürüm **0.5.0**, `installed: true`, `enabled: true` doğrulandı. Ardından canlı MCP `get_usage` çağrısı **paid** erişim, sınırsız bileşen kodu alma ve `aiGenerationEnabled: false` döndürdü. Arama ve iki ayrı `get_component` çağrısı başarılı oldu. Bağlantı artık yalnız kurulum kaydına dayanmıyor.
- Ana sayfa, oyun kartları, giriş/kayıt ve oyun detayı [önyüz pilotunda](21ST-FRONTEND-PILOT.md) tamamlanmış. Yükleme/yayın pilotu da mevcut. Bu plan onların üzerine kurulacak.
- Uygulama alanı `next-platform`. Keşif Atlası kimliği, lacivert eylemler, Manrope/Source Sans 3, mevcut rol ve nesne sahipliği kuralları esas alınacak.
- Teslim yerelde çalışan ve doğrulanan uygulama olacak. Canlı dağıtım, öğrenci özelliğini üretimde açma, yeni abonelik, çizim tahtası, analitik kurulumu ve AI üretimi bu beş pakete dahil değil.

## 21st kullanımı ve ortak yaklaşım

Satın alınmış paketin arama ve kaynak erişimi kullanılacak. Yeni satın alma veya AI erişimi gerekmiyor. MCP birincil erişim yolu; çalışan bağlantıyı yeniden kurma işi yok. Ücretli katalog erişimi ile AI üretimi ayrı yetkiler; [resmî MCP açıklaması](https://21st.dev/mcp) da bu ayrımı yapıyor.

Plan hazırlığında kaynakları alınan adaylar:

| Kaynak | Doğrulama | Uygulama kararı |
|---|---|---|
| [Data Table — ephraimduncan](https://21st.dev/@ephraimduncan/components/table-05), demo `28327` | Kaynak ve bağımlılık ağacı MCP üzerinden alındı. Kaynak TanStack Table ve birden fazla yardımcı bileşen kullanıyor. | Arama, sonuç sayısı ve tablo araç çubuğu düzeni referans olacak. İlk sürüm mevcut React/CSS ve semantik HTML tabloyla yapılacak. |
| [Combobox — shugar](https://21st.dev/@shugar/components/combobox), demo `4029` | Kaynak ve bağımlılıklar alındı. Kaynakta ayrı görsel kontrol ailesi var; combobox kaynak dosyasında klavye olay yönetimi bulunmuyor. | Doğrudan kurulmayacak. Projenin mevcut katalog aramasındaki odak/klavye yaklaşımı kullanılarak ID tabanlı, kontrollü oyun seçici yapılacak. |

Bu alımlar erişim ve teknik uygunluk incelemesidir; kaynak lisansları bu aşamada doğrulanmadı ve kod projeye kopyalanmadı. Bu sürüm için karar, mevcut bileşenleri geliştirmek ve katalogdan yerleşim/etkileşim fikirleri almaktır. Yeni TanStack, Base UI, Recharts, dnd-kit, ikon veya takvim paketi eklenmeyecek. Gerçek kod uyarlaması sonradan gerekirse kaynak sürümü, tam lisans, bağımlılıklar ve değiştirilen dosyalar doğrulanıp üçüncü taraf kaydına yazılacak; uygunluğu belirsiz kod alınmayacak.

Uygulama başlangıcında mevcut `DESIGN.md` ve CSS değerlerinden eksik `.21st` tasarım bağlamı oluşturulacak; otomatik çıkarılan değerler mevcut kimlikle karşılaştırılacak. Her paket sonunda erişilebilirlik/görsel inceleme yapılacak. 21st yerel inceleme aracı kullanılabiliyorsa ek kontrol olarak çalıştırılacak; uygulamanın testlerinin yerini almayacak.

## Beş teslim paketi

### 1. Ödev raporu

- Üstte atanan öğrenci sayısı; kayıt destekli oyunlarda Başlamadı / Devam ediyor / Tamamlandı durum filtreleri. Kayıt desteği olmayan oyunlarda Açılmadı / Açıldı gösterilecek.
- Ad ve kullanıcı adı araması; varsayılan Türkçe ad sırası ve isteğe bağlı son etkinlik sırası. Özet sayıları tüm alıcıları, sonuç alanı filtrelenmiş/toplam sayısını gösterecek. Arama ve durum filtresi birlikte çalışacak.
- 768 px ve üzerinde mevcut yedi alanı koruyan semantik tablo; daha dar ekranda ad, durum ve varsa son puanın göründüğü öğrenci listesi. Diğer değerler yerel `details` ile açılacak. Ekran okuyucu aynı kaydı iki kez okumayacak.
- `assignmentReport` sorgusunun anlamları korunacak: herhangi bir tamamlanmış deneme tamamlanma durumunu belirler; son puan/ilerleme en yeni denemeden, en iyi puan tüm denemelerden gelir. Eksik puan sıfıra çevrilmeyecek. Kapalı ödev, etkin olmayan üyelik ve gecikme ilerleme durumundan ayrı açıklanacak.
- Bir sınıflık raporda arama/sıralama istemcide yapılacak; yeni rapor uç noktası veya sunucu sayfalaması eklenmeyecek.

**Kabul:** öğretmen başlamayan öğrencileri tek filtreyle bulur; mobilde tüm alanlara erişir; önce tamamlayıp sonra yeniden başlayan öğrencide son/en iyi puan ve tamamlanma doğru kalır.

### 2. Ödev atama

- Oyun başlığıyla aranabilir, seçimi oyun ID'siyle tutan alan. Sonuçlarda gerçek sınıf, ders ve kayıt desteği gösterilecek. Oyun detayından gelen geçerli ön seçim korunacak; artık atanamayan oyun seçiliymiş gibi gönderilmeyecek.
- Öğrenci seçiminde ad araması, seçilen sayı ve “Yalnız seçilenler”. Seçimler kontrollü state içinde tutulacak; arama görünmeyen seçimleri silmeyecek. Sınıf değişince önceki sınıfın seçimleri ve öğrenci araması temizlenecek.
- “Tüm onaylı öğrenciler” mevcut sınıfın tüm uygun alıcılarını ifade edecek; arama sonuçlarını ifade etmeyecek. Aynı seçim bileşeni mevcut ödeve öğrenci eklerken de kullanılacak.
- Gönder düğmesinin hemen üstünde sınıf, oyun, alıcı sayısı, son tarih/saat dilimi ve takip kapsamının canlı özeti olacak. Seçilmiş alıcıların adları açılabilir ayrıntıda görülebilecek. Ek zorunlu sihirbaz veya onay penceresi olmayacak.
- Mevcut tarih girişinin cihaz saat diliminden UTC'ye dönüşümü korunacak; özet girilen zamanı ve saat dilimini açık gösterecek. Boş tarih “Son tarih yok” olacak. Son tarihin geçmesi mevcut açık ödevi kendiliğinden kapatmayacak.
- Boş alıcı seçimi gönderilemeyecek. Gönderim sırasında çift işlem kilidi; sunucu hatasında tüm form değerleri korunacak. Sunucu sınıf/üyelik/yayın yetkilerini yeniden doğrulamaya devam edecek.

**Kabul:** en az 50 kişilik sentetik sınıfta aramayla seçilen beş öğrenci doğru alıcı listesiyle gönderilir; sınıf değiştirme ve hata sonrası tekrar denemede yanlış alıcı oluşmaz.

### 3. İçeriklerim ve inceleme kuyruğu

- İçeriklerim: başlık araması; Tümü, İşlemim bekleniyor, İncelemede ve Yayında filtreleri. İşlem bekleyenler mevcut yayın akışının dikkat/hata durumlarını, eksik yüklemeyi ve iptal edilmiş güncel sürümü kapsayacak. İncelemede güncel taslağın `review` durumu; Yayında gerçek etkin yayın kaydı esas alınacak.
- Filtreler birbirini dışlayan yayın aşamaları gibi sunulmayacak: eski yayın açıkken yeni taslak düzeltme bekliyorsa içerik hem Yayında hem İşlemim bekleniyor görünümünde bulunabilir. Satır iki gerçeği birlikte gösterecek.
- Duruma uygun mevcut işlem bağlantısı eklenecek: giriş dosyasını seçme, bilgileri tamamlama, düzeltmeyi açma veya ayrıntıları görme. Arka plandaki durumu doğrudan değiştiren yeni eylem eklenmeyecek.
- İnceleme kuyruğu: başlık, sınıf ve ders filtreleri; yalnız güncel `review` sürümleri. Sıralama varsayılanı sürüm oluşturma tarihi eskiden yeniye, alternatifi yeniden eskiye; eşit tarihlerde ID ile kararlı sıra. Ekran bunu “Sürüm oluşturma tarihi” olarak adlandıracak; incelemede bekleme süresi iddiası olmayacak.
- İki listede sunucuda filtreleme, toplam sayısı ve 25 kayıtlık sayfalama. Arama/filtre değişince ilk sayfaya dönülecek; URL üzerinden yenileme ve geri/ileri gezinme çalışacak. Boş liste ile filtre sonucu bulunamaması ayrı mesajlar kullanacak.

**Kabul:** 50 sentetik içerikte hedef kayıt ve doğru sonraki eylem bulunur; öğretmen başka sahibin içeriğini göremez; eski yayın/yeni taslak ayrımı filtreler altında korunur.

### 4. Uzun formlarda bölüm ve eksik özeti

- Metadata: Genel bilgiler, Program ve kazanımlar, Kapak bölüm bağlantıları; seçilen kazanım sayısı; kaydetme durumu ve mevcut gönderim kurallarına göre eksik alan listesi.
- Değerlendirme: beş eğitimsel başlık, teknik uyarılar ve kazanım kararları için ayrı tamamlanma/eksik özeti. “Karar girildi” ile “Yayın onayına uygun” ayrı kavramlar olacak; gerekli gerekçe eksikken bölüm tamamlanmış sayılmayacak.
- Özet bağlantısı ilgili alanı görünür yapıp odağı oraya taşıyacak. Bölümler gezinme sırasında kaldırılıp yeniden oluşturulmayacak; mevcut form değerleri ve sekme geçişindeki taslak koruması sürecek.
- Geniş ekranda yapışkan bölüm özeti, dar ekranda normal akışta kompakt açılır özet. Sabit başlık, özet veya sanal klavye odaklanan alanı örtmeyecek.
- İstemci özeti mevcut sunucu doğrulamasının saf kurallarını paylaşacak; sunucu bağımlılıkları istemci paketine taşınmayacak. Kazanım seçimi zorunlu hâle getirilmeyecek. Yeni otomatik kayıt veya değerlendirme taslağını sunucuda saklama özelliği eklenmeyecek.

**Kabul:** uzun Türkçe metinlerle bölüm/sekme geçişi seçim kaybettirmez; metadata taslağı yeniden açılır; yayın onayı eksik karar veya gerekçeyle geçilemez.

### 5. İlk kullanımda sıradaki adım

- Öğretmenin Sınıflarım alanında gerçek sınıf/üyelik/ödev verilerinden türeyen kısa başlangıç bölümü: sınıf oluşturma, kod paylaşma, bekleyen katılımı onaylama ve ilk ödevi verme. Katılım kodunu kopyalama geri bildirimi olacak; kopyalama “öğrencilere paylaşıldı” kanıtı sayılmayacak.
- Henüz sınıf yoksa oluşturma; sınıf var ve üye yoksa kod; bekleyen üyeler varsa onay; etkin üyeler var ve ödev yoksa atama öne çıkacak. İlk ödevden sonra başlangıç yönlendirmesi sonuç bağlantısına dönüşecek. Arşivli sınıflar etkin başlangıç sayılmayacak.
- Öğrencinin ödevi yoksa: etkin sınıf varsa ödev bekleme, yoksa bekleyen üyelik varsa öğretmen onayı, ikisi de yoksa sınıf koduyla katılma yönlendirmesi. Yalnız arşivlenmiş/kaldırılmış üyelik varsa erişim durumu açıklanıp yeni sınıfa katılma bağlantısı sunulacak.
- Mevcut bölüm bağlantıları kullanılacak. Zorunlu tur veya ayrı tamamlanma tablosu olmayacak. `STUDENT_LEARNING_ENABLED=false` durumunda öğrenci/sınıf yönlendirmeleri gösterilmeyecek.

**Kabul:** sınıfsız, onay bekleyen, etkin fakat ödevsiz ve yalnız arşivli üyeliği olan öğrenci doğru açıklamayı görür; öğretmen tamamlanmış başlangıç işini yeniden yapmak zorunda kalmaz.

## Veri ve arayüz sözleşmeleri

- Veritabanı göçü ve yeni HTTP uç noktası planlanmıyor. Mevcut ödev oluşturma/öğrenci ekleme istek gövdeleri, rol kimlikleri ve sahiplik kontrolleri korunacak.
- `teacherDashboard.games` dönüşü, yayımlanmış sürüm metadata'sından `grade`, `subjectId` ve ders adını ekleyecek. Eksik bilgi uydurulmayacak. Rapor için null puanları ve kayıt desteğini açık tanımlayan TypeScript görünüm tipleri kullanılacak.
- İçeriklerim URL parametreleri `q`, `durum`, `sayfa`; kuyruk parametreleri `q`, `sinif`, `ders`, `siralama`, `sayfa`. Eksik/geçersiz değerler güvenli varsayılana dönecek. Sorgular parametreli olacak; arama sınırı mevcut yönetim ekranındaki gibi 120 karakter.
- `ListSearch`/`Pagination` hedef yol ve korunacak parametrelerle genelleştirilecek; mevcut `/yonetim` kullanımı varsayılan davranışını koruyacak. Liste sorguları ve toplam hesapları aynı yetki/filtre koşullarını kullanacak.
- Yayın filtreleri ve satır açıklamaları aynı durum kurallarından beslenecek. Rapor özeti de satırdaki ilerleme sınıflandırmasını paylaşacak; ayrı ve zamanla ayrışan durum eşlemeleri oluşturulmayacak.

## Doğrulama ve teslim sırası

Her paket, kendi kabul senaryoları geçince teslim edilecek. Test veritabanı, depolama, uygulama/oyun portları ve `NEXT_DIST_DIR` yerel önizlemeden ayrılacak. Mevcut kullanıcı verilerine test kaydı yazılmayacak.

- Birim testleri: rapor durumları ve null değerler, toplam/filtre tutarlılığı, seçim koruma, yayın filtresi sınıflandırması, form eksik özetleri ve ilk kullanım durumları.
- Entegrasyon: sahiplik sınırları, arşivli/etkin olmayan üyeler, eski yayın + yeni taslak, iptal edilmiş yayın, filtre/sayfalama toplamı ve mevcut atama doğrulaması.
- Playwright: beş kabul görevi; boş/hatalı sonuçlar; çift gönderim; sunucu hatası; sınıf değiştirme; mevcut gerçek öğrenci–oyun–kayıt–rapor akışı ve etkilenen yükleme/inceleme akışları. Yeni test dosyaları ana Playwright yapılandırmasıyla çalıştırılacak; mevcut learning yapılandırması yalnız `learning.spec.ts` seçiyor.
- Görsel/erişilebilirlik: 320/390/768/1440 px, %200 büyütme, uzun Türkçe metin, yalnız klavye, görünür odak, combobox ok/Enter/Escape davranışı, azaltılmış hareket ve yatay taşma. Yeni akışlar Chromium ve Safari'de kontrol edilecek.
- Son kapı: `pnpm typecheck`, `pnpm test`, etkilenen entegrasyon/tarayıcı testleri ve ayrı çıktıda üretim derlemesi. Öğrenci bayrağı açık/kapalı durumları ile mevcut önyüz pilotunun ilgili regresyonları kontrol edilecek. Bu plan hazırlanırken uygulama testleri yeniden çalıştırılmadı.

| Pilot dönemi | İş ve çıktı |
|---|---|
| Gün 1–3 | Tasarım bağlamı, önce görüntüleri, sentetik görev verileri ve başlangıç ölçümü |
| Gün 4–10 | Paket 1–2: rapor ve atama; kaynak/uyarlama süresi kaydı |
| Gün 11–17 | Paket 3: iki listenin filtreleri ve sunucu sayfalaması |
| Gün 18–24 | Paket 4–5: uzun form özeti ve gerçek duruma göre yönlendirme |
| Gün 25–30 | Kullanıcı görevleri, düzeltmeler, son doğrulama ve bakım/getiri değerlendirmesi |

Bu dönemler çalışmanın başlangıcına göre hedef pilot pencereleridir; takvim taahhüdü veya otomasyon değildir. Kullanıcı değerlendirmesi için rapordaki 3–5 öğretmen ve 1–2 inceleyici önerisi korunur; katılımcılar henüz ayarlanmadı. Geliştirme sentetik verilerle ilerleyebilir; gerçek kullanıcı ölçümü yapılmadan başarı artışı iddia edilmeyecek.

Teslim kaydı; önce/sonra görüntüleri, test sonuçları, kaynak/bağımlılık kararları ve açık sınırlamaları içerecek. Getiri; görev doğruluğu, yanlış alıcı sayısı, yardım gereksinimi, kaynak bulma süresi ve uyarlama/bakım süresiyle değerlendirilecek. İlk uygulama paketi **ödev raporu**, hemen ardından **ödev atama** olacak.
