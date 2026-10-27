# Öğrenci, sınıf ve oyun kaydı

Bu modül `STUDENT_LEARNING_ENABLED=true` ile açılır; varsayılan kapalıdır. Web, aynı veritabanını kullanan worker ve oyun Nginx yapılandırması birlikte güncellenir. Eski .NET/Angular uygulamasına bağımlı değildir.

## Kullanım

1. Öğretmen veya öğretmen yetkilerini de taşıyan Yönetici (`editor`), `/ogretmen/siniflar` üzerinden sınıf oluşturur ve katılım kodunu paylaşır.
2. Öğrenci `/kayit?tur=ogrenci` üzerinden görünen ad, kullanıcı adı, parola ve sınıf koduyla kayıt olur. E-posta toplanmaz. Sınıf üyeliği onaya kadar bekler; serbest oyun oynanabilir. Giriş, ortak `/giris` ekranında kullanıcı adıyla yapılır; öğretmenler e-posta kullanır. `/ogrenci/kayit` ve `/ogrenci/giris` eski bağlantıları sorgu parametrelerini koruyarak ortak ekranlara yönlenir.
3. Öğretmen üyeliği onaylar. İlk onaylayan öğretmen veya Yönetici hesabın kurtarma sorumlusudur. Sınıf değiştirmek bu yetkiyi değiştirmez. Admin (`admin`) kullanıcı listesinden kurtarma sorumluluğunu açıkça devralabilir; bu işlem öğretmenlik, içerik düzenleme veya yayın onaylama yetkisi vermez.
4. Öğretmen oyun detayındaki **Ödev ver** veya `/ogretmen/odevler` üzerinden yayımlanmış bir oyunu tüm onaylı üyelere veya seçilenlere atar. Alıcı listesi atama anında sabitlenir. Yeni öğrenciler rapor ekranından eklenir.
5. Öğrenci `/ogrenci` üzerinden **Ödevler**, `/ogrenci?bolum=oyunlar` üzerinden **Oyunlar**, `/ogrenci?bolum=siniflar` üzerinden **Sınıflar** bölümünü seçer; **Hesap** `/hesap` adresindedir. Her görünüm seçili görevi gösterir. Öğretmen ödev sonuçlarını öğrenci bazında görür; serbest oyun kayıtlarını göremez.

Ortak giriş ve kayıt bağlantıları `next` hedefini taşır. Oturum açıldıktan sonra `/oturum`, hedefin yerel ve hesabın rolüne uygun olduğunu denetler; geçersiz hedefte öğrenci `/ogrenci` adresine gider. Öğrenci modülü kapalıyken öğrenci kayıt sekmesi sunulmaz ve öğrenci çalışma alanı erişime açılmaz. Yönetici (`editor`) öğretmen işlemlerine ek olarak içerik inceleyebilir; Admin (`admin`) sınıf kuramaz, ödev veremez veya içerik yayınını onaylayamaz. Ayrıntılı rol tablosu ve güncel ekranlar [ortak deneyim kaydında](UNIFIED-EXPERIENCE.md) bulunur.

Son tarih gecikme etiketi üretir. Öğretmen kapatana kadar çalışma devam eder. Sınıfın arşivlenmesi veya üyeliğin kaldırılması yeni kayıt ve oyun erişimini kapatır; geçmiş sonuçlar korunur. Ödev durumu en az bir tamamlanmış deneme varsa tamamlandı olarak gösterilir. Son puan/ilerleme en yeni denemeden, en iyi puan tüm denemelerden gelir; yeniden başlamak önceki tamamlanmayı silmez. Bir oyunun açılması veya kapanması tamamlanma sayılmaz.

## SDK sözleşmesi, sürüm 1

`sdk/dijital-atolye.js` dosyasını oyun paketine kopyalayın ve oyundan önce yükleyin. `manifest.json` içerisine `"tracking": 1` ekleyin. Bu alan tarama sırasında değişmez içerik sürümüne yazılır. Eski paketler oynamaya devam eder; yalnızca açılma bilgisi ölçülür. Beyan bir öğrenme veya doğruluk sertifikası değildir.

```html
<script src="dijital-atolye.js"></script>
<script src="game.js"></script>
```

```js
const saved = await DijitalAtolye.ready();
let state = saved?.state ?? { round: 0, answers: [] };
// Arayüzü state üzerinden geri yükleyin; saved.completed sonuç ekranını açabilir.
await DijitalAtolye.save({ state, progress: 40, score: 75 });
await DijitalAtolye.complete({ state, score: 90 });
```

- `ready()` kayıt oturumunda `{ state, progress, score, completed }`, anonim/önizleme/bağımsız açılışta `null` döndürür. Tamamlanan denemeyi yeniden kaydetmeyin; platformdaki baştan başla düğmesi yeni deneme açar.
- `save` ve `complete`, sunucu kaydı onaylayınca `{ saved: true, revision }` döndürür. İzlenmeyen açılışta `{ saved: false }` döner. SDK çağrıları sıraya alır ve çağrı anındaki durumu JSON olarak kopyalar.
- `state` en fazla 128 KiB UTF-8 JSON'dur; DOM, fonksiyon, dosya veya kimlik bilgisi içermez. `progress` ve `score` isteğe bağlı 0–100 tamsayılardır. `complete` ilerlemeyi 100 yapar. Öğrenci yanıtlarını soru bazında raporlamak bu sürümün parçası değildir.
- Kayıt başarısızken sayfa açık tutulur; geçici ağ/sunucu hataları aynı istek kimliğiyle yeniden denenir. Sayfa kapatılırsa henüz onaylanmamış kayıt kaybolabilir. Çevrimdışı kalıcı kuyruk yoktur.
- Çakışma veya kapatılmış ödev gibi kalıcı hata Promise'i reddeder. Oyunun bu hatayı göstermesi ve yeni kayıtları durdurması gerekir. Güncel kaydı tekrar yüklemek mevcut denemeyi sürdürür.

## Sunucu arayüzleri

Kimlik uçları `/api/auth/student/register`, `/login`, `/reset` altında POST kabul eder. Better Auth parola hash ve oturum cookie altyapısı kullanılır. Dahili `@students.placeholder.invalid` adresleri e-posta olarak doğrulanmaz ve gönderim yapılmaz. Öğretmen e-posta doğrulaması ile Yönetici (`editor`) / Admin (`admin`) 2FA koşulları korunur. Öğrenci rolü istemciden alınmaz.

`/api/learning` altında:

| İşlem | Yol |
|---|---|
| Öğrenci/öğretmen çalışma alanını oku | GET `/student`, `/teacher` |
| Sınıf oluştur; kod yenile, arşivle, üye onayla/kaldır | POST `/classes`, `/classes/:id` |
| Katılım isteği gönder | POST `/join` |
| Ödev oluştur; alıcı ekle veya kapat | POST `/assignments`, `/assignments/:id` |
| Öğretmen raporu | GET `/assignments/:id/report` |
| Sorumlu öğretmen/Yönetici olarak kurtarma kodu üret veya Admin olarak devral | POST `/recovery/:studentId` |
| Deneme aç/devam et veya yeniden başlat | POST `/play` |
| Ara kayıt veya tamamlanma | POST `/play/:sessionId` |

`/play` girdisi: `contentId`, opsiyonel `assignmentId`, `restart`, UUID `requestId`. Tekrarlanan başlangıç isteği yeni deneme oluşturmaz. Sonuç: oturum kimliği, sürüme bağlı oyun URL'si, kayıt durumu, revizyon ve takip desteği.

Kayıt girdisi: UUID `requestId`, `revision`, `state`, opsiyonel `progress`, `score`, `complete`. Revizyon çakışması 409, büyük durum 413, kapalı/erişilemeyen kaynak 403/409/410 döndürür. Aynı oturum/istek kimliği aynı içerikle tekrarlandığında ilk revizyon döner; farklı içerikle tekrar kullanılamaz.

Her işlem oturumdaki kullanıcıya göre yetkilendirilir. Oyun mesajındaki öğrenci/öğretmen/ödev kimliği yetki kaynağı değildir. Kimlik cookie'leri iframe'e verilmez. Köprü iframe penceresini, ayrı origin'i, el sıkışma nonce'ını ve oturumu doğrular. Oyun puanları istemci beyanıdır; yüksek güven gerektiren sınav veya not sistemi değildir.

## Sürüm ve erişim

Ödev ve deneme belirli `content_versions.id` ile sabittir. Yeni yayın mevcut kaydı dönüştürmez. Yeni serbest deneme güncel yayını kullanır; ödevin yeni denemesi ödevdeki sürümü kullanır. Eski sürümün `/play` URL'si halka açılmaz; yalnızca geçerli oyun oturumunun `/session/:capability/…` URL'siyle erişilir. Nginx her dosyada yetki sorgular. Capability yalnızca dosya okur, kayıt API'sinde kimlik doğrulamaz; paylaşılan URL geçerli olduğu sürece bearer erişimi sağlar. Capability loglanmaz, DB'de hash'i tutulur ve 8 saat sonra sona erer. Yeniden açmak aynı denemeyi sürdürür.

Yayından kaldırma tüm içerik sürümlerini geri alınamaz biçimde iptal eder. Sonraki yayın için yeni sürüm gerekir; eski ödev ve denemeler erişime açılmaz. Oturum kapatma/parola kurtarma oyun oturumlarını da geçersiz kılar. İndirilmiş veya bellekteki oyun kodu geri alınamaz; yeni kaynak istekleri ve kayıtlar reddedilir.

## Pilot ve dağıtım

`node --import tsx scripts/build-learning-pilots.ts` dört ZIP üretir: seçim, eşleştirme, sıralama ve sınıflandırma. Paketler `fixtures/learning/` altındadır. Üretim veritabanına doğrudan eklenmez; öğretmen yükleme, gerçek ClamAV/YARA, metadata onayı, teknik/eğitimsel editör incelemesi ve yayın hattından geçirilir. Katalogdaki DB dışı demo HTML'leri ödev olarak atanamaz.

1. Veritabanını yedekleyin. Yeni web/worker sürümünü, Nginx şablonunu ve eklemeli migration'ları dağıtın; özellik kapalı kalsın.
2. Ayrılmış `_test` veritabanında migration, birim, entegrasyon ve öğrenme E2E testlerini çalıştırın. E2E gerçek Postgres, Mailpit, ClamAV/YARA worker ve ayrı oyun origin'i ister. Pilot test verileri yalnız test DB'sinde oluşturulur.
3. Pilot öğretmenlerle doğrulamadan sonra web için `STUDENT_LEARNING_ENABLED=true` yapın. Varsayılan `false`; canlı ortam bu geliştirme sırasında açılmaz.
4. Hatalarda bayrağı kapatın; migration'ları ve öğrenci kayıtlarını silmeyin. Kaydetme hataları ve 409 çakışmalarını API yanıtlarında, beklenmeyen hataları `request_failed` loglarında izleyin. Token, parola ve oyun durumunu loglamayın.

Komutlar: `pnpm typecheck`, `pnpm test`, `pnpm build`; ayrı `_test` DB ile `pnpm test:integration`; çalışan test ortamında `pnpm test:e2e:learning`. Bu E2E `STUDENT_LEARNING_ENABLED=true` ister; kendi raporunu `.data/learning-playwright-report/` içine yazar. Ekran kanıtları `.impeccable/review/learning-*.png` altında üretilir. Pilot ZIP'lerini yeniden üretmek için `pnpm pilots:build` kullanın.

## Tarihsel teslim doğrulaması — 27 Ekim 2026, ortak deneyim öncesi

- TypeScript kontrolü ve bağımsız çıktı dizinine üretim derlemesi geçti.
- 56 birim testi geçti. SDK testi, çağrı anındaki durumun kopyalanmasını, sıradaki tüm değişikliklerin bildirilmesini ve yalnız bağlı üst pencerenin onayının revizyonu ilerletmesini doğruladı.
- Ayrı PostgreSQL test veritabanında 29 entegrasyon testi geçti: 10 öğrenci/sınıf/kayıt testi ile mevcut müfredat, ClamAV/YARA yayın ve kapak incelemesi testleri. Son ek kontrol, takip desteği olmayan oyunun yeniden açılma zamanının güncellenmesini ve aynı başlangıç isteğinin zamanı değiştirmemesini doğruladı.
- Gerçek üretim çıktısı üzerinde öğrenme uçtan uca testi geçti: öğretmen e-posta doğrulaması, editör 2FA, dört ZIP'in gerçek tarama/onay/yayını, öğrenci kaydı, üyelik onayı, formdan seçili öğrenciye ödev, kayıp yanıtın tekrar gönderimi, başka tarayıcıdan devam, eski cihaz çatışması, dört oyun türünde kısmi kayıt, ödev kapatma ve parola kurtarma.
- Aynı test öğrenci ana oynama düğmesi, önizleme düğmesi ve otomatik başlatmanın kayıtlı oturuma gittiğini; ağ/bozuk yanıt hatalarında anlaşılır mesaj ve form verilerinin korunduğunu doğruladı. Mevcut detay/oynatıcı için 17 tarayıcı testi de geçti.
- Öğrenci, sınıf, atama, rapor, oynatıcı ve hata ekranları 1440/390 pikselde incelendi. Bağımsız arayüz incelemesinin dört düzeltmesi çözüldü (`ship`; bu karar değerlendirilen dört düzeltmeyle sınırlıdır).

Migration'lar yalnız test veritabanına uygulandı. Canlıya dağıtım veya özellik açılışı yapılmadı; `STUDENT_LEARNING_ENABLED=false` varsayılanı korunur. Test servisleri kapatıldı. Pilot paketlerin gerçek öğretmenlerle kabulü ve hedef ortamın dağıtımı açılış adımında yapılır.

## Güncel ortak deneyim revizyonu — 27 Ekim 2026

Giriş/kayıt, rol yetkileri ve seçili öğrenci bölümleri yukarıdaki güncel akışa taşındı. SDK, sürüme bağlı ilerleme, ödev alıcıları ve kurtarma sahipliği sözleşmeleri korunur. Ortak nötr/lacivert sistem, görev menüsü ve yeni masaüstü/mobil kanıtlar [UNIFIED-EXPERIENCE.md](UNIFIED-EXPERIENCE.md) içinde kayıtlıdır. Bu revizyonda 59 birim, 29 entegrasyon ve 55 farklı tarayıcı senaryosu geçti; sonraki odaklı tekrarlar yeni benzersiz senaryo olarak sayılmaz. Üretim bayrağı açılmadı, canlı migration veya dağıtım yapılmadı. Yukarıdaki önceki test sayıları ve servis durumları kendi tarihsel teslim anına aittir.
