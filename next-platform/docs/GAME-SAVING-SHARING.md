# Oyun kaydetme ve paylaşma

27 Ekim 2026.

## Kaydet nerede tutuluyor?

`src/components/saved-games.tsx`, oyunların slug değerlerini `localStorage` içindeki `dijital-oyun-atolyesi:saved:v1` anahtarında saklar. Oyun dosyası indirilmez. Giriş yapan ve yapmayan kullanıcı aynı tarayıcı koleksiyonunu kullanır; kullanıcı kimliği veya hesap veritabanıyla eşitleme yoktur. Aynı tarayıcıda farklı hesaplar da bu listeyi görür. Hesaba bağlı oyun ilerlemesi farklı bir özelliktir.

Üst menü ve alt menüdeki **Kaydettiklerim**, `/kesfet?saved=1` adresindeki listeyi açar. Bu bağlantı giriş durumundan bağımsızdır. Kayıtlar farklı tarayıcıya/cihaza taşınmaz ve site verileri temizlenince silinir. Origin kapsamı nedeniyle `localhost:3000` ve `localhost:3001` de ayrı koleksiyonlardır. Hesaba bağlı favoriler ve ziyaretçi listesini hesaba aktarma bu değişikliğin kapsamına alınmadı.

## Paylaşım seçenekleri

Yeni `src/components/game-share.tsx`, **Paylaş** düğmesinde küçük bir panel açar:

- Bağlantıyı kopyala: panoya yalnız herkese açık oyun URL'sini yazar. Hata durumunda açıklama ve otomatik seçilen salt okunur bağlantı alanı gösterir.
- WhatsApp’ta paylaş: oyun başlığı ve bağlantıyla, alıcı belirtilmeyen resmî `wa.me/?text=` bağlantısını açar. Alıcıyı ve gönderimi kullanıcı seçer. [WhatsApp belgesi](https://faq.whatsapp.com/5913398998672934).
- E-postayla paylaş: alıcısı boş, konu ve gövdesi hazırlanmış `mailto:` taslağını kullanıcının e-posta uygulamasına bırakır. Sunucudan e-posta gönderilmez. [MDN e-posta bağlantıları](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#linking_to_an_email_address).
- Diğer uygulamalar: güvenli bağlamda `navigator.share` mevcutsa cihazın paylaşım seçeneklerini açar. Kullanıcı iptali hata gibi gösterilmez; diğer hatalarda alternatifler kalır. [MDN Web Share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).

Paylaşım bağlantısı mevcut origin ve oyun slug'ından üretilir; `from`, arama, filtre veya oynatma parametreleri aktarılmaz. Yerel önizlemedeki `localhost` bağlantısı başka bir kişinin cihazında bu bilgisayarı açmaz. Canlı sitede aynı davranış canlı origin'i kullanır.

Panel bir modal değildir. Açılınca ilk seçenek odaklanır; Tab ile dolaşılır, Escape/kapatma düğmesi odağı Paylaş'a döndürür. Dış tıklama ve odak ayrılması paneli kapatır. Yerleşim ekrana göre sınırlandırılır, kontroller en az 44 px'tir. Oynatıcı ve iframe korunur. Yeni paket, HTTP ucu, veritabanı şeması veya mesaj gönderme servisi eklenmedi.

## Kontroller

- TypeScript geçti.
- İlgili beş tarayıcı senaryosu geçti: mevcut kaydetme/filtreye dönüş, oynatıcı/tam ekran/kopyalama hatası, dar ekran kontrolleri ve iki yeni paylaşım senaryosu. İlk yeni testte Sözcük Eşleri için yanlış varsayılan üç tur, gerçek iki tur bilgisiyle düzeltildi; uygulama hatası değildi.
- 320, 390, 768 ve 1450 px açık panel ve kopyalama hatası görüntüleri incelendi. Dosyalar `.impeccable/review/game-sharing/` içinde.
- WhatsApp ve e-posta URL'lerinin Türkçe başlık, herkese açık bağlantı ve boş alıcı içerdiği kontrol edildi; dış uygulamadan gerçek mesaj gönderilmedi.
- Pano kopyalama başarısı ve cihaz paylaşımının kullanıcı tarafından iptali kontrollü tarayıcı taklitleriyle doğrulandı. `copied-native.png` bu destekli cihaz durumunu gösterir; bütün işletim sistemlerinde gerçek paylaşım penceresinin test edildiği anlamına gelmez.
