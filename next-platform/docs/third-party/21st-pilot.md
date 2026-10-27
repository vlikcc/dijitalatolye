# 21st.dev ücretsiz pilotu — kaynak ve uyarlama kaydı

27 Ekim 2026. Bu pilotta ücretli hizmet, hesap, 21st MCP, API anahtarı veya yeni çalışma zamanı paketi kullanılmadı. Maliyet **$0**. 21st katalog keşfi için; sabitlenen üretici depoları kaynak ve lisans için kullanıldı. Ücretli 21st planlarına bağımlılık yoktur.

| Kaynak | Sabit sürüm | Yerel uyarlama |
|---|---|---|
| [Extend File Upload](https://21st.dev/@extend-hq/components/file-upload) | `331a0b1bf35faa61f4ed946c7dbaa524ff3e851f` | `src/components/package-file-picker.tsx` |
| [ReUI vertical stepper](https://21st.dev/@sean0205/components/stepper/vertical) | `067aa0dc7f8bbfec1cd76fc5ad31f842be5f569a` | `src/components/publication-progress.tsx`, ilgili CSS |

Extend [sabit kaynak](https://github.com/extend-hq/ui/blob/331a0b1bf35faa61f4ed946c7dbaa524ff3e851f/apps/v4/components/extend/file-upload.tsx) ve [sabit lisans](https://github.com/extend-hq/ui/blob/331a0b1bf35faa61f4ed946c7dbaa524ff3e851f/LICENSE.md). Tam bildirim: [extend-LICENSE.txt](extend-LICENSE.txt).

ReUI [sabit kaynak](https://github.com/keenthemes/reui/blob/067aa0dc7f8bbfec1cd76fc5ad31f842be5f569a/registry-reui/bases/radix/reui/stepper.tsx) ve [sabit lisans](https://github.com/keenthemes/reui/blob/067aa0dc7f8bbfec1cd76fc5ad31f842be5f569a/LICENSE.md). Tam bildirim: [reui-LICENSE.txt](reui-LICENSE.txt).

## Uyarlama kapsamı

- Extend'in bırakma alanı, yerel dosya seçicisi ve iç içe sürükleme olayları için sayaç yaklaşımı tek oyun paketine uyarlandı. Seçici `File | null` ile kontrollü; ağ işlemi yapmaz. Hareketli çerçeve, ek ikon paketi, belge kuyruğu, dosya önizleme ve diğer bağımlılıklar alınmadı. HTML/ZIP tarayıcıda çalıştırılmaz.
- ReUI'nin gösterge, başlık ve ayırıcı çizgi düzeni anlamsal bir `ol` olarak uyarlandı. Radix sekme altyapısı, gezinme ve adım değiştirme davranışları alınmadı. Durum, yeni saf `getPublicationProgress` fonksiyonundan gelir. Öğretmen bu listeden işlem aşaması atlayamaz.
- Lucide, mevcut Button ve tasarım renkleri kullanıldı. Gösterge 768 px ve üstünde yatay, daha dar genişliklerde dikeydir. Metin durumları, `aria-current="step"`, gerçek dosya seçici, görünür odak ve azaltılmış hareket desteği vardır.
- Origin UI kullanılmadı: eski katalog MIT kaydı ile güncel coss/ui kaynak yönlendirmesi uyuşmadığından lisansı sabitlenen ReUI tercih edildi.

## İşleyiş ve sınırlar

`package-file.ts` seçme, bırakma ve gönderme öncesi aynı doğrulamayı yapar. Uzantı büyük/küçük harften bağımsızdır. Geçersiz seçim eski geçerli dosyayı silmez. Ağ kaydı UploadForm ve `package-upload.ts` tarafından yönetilir. Eşzamanlı kilit çift gönderimi engeller; başarılı içerik kimliği elle tekrar denemede korunur. İletim sonucu belirsizse otomatik tekrar yapılmaz. İçerik kimliği bilinmiyorsa İçeriklerim, biliniyorsa o içerik kaydı gösterilir. Başarılı oyun yüklemesinden sonraki tüm kapak hataları içerik detayında açıklanır.

Sunucu durumu tek başına yayın kanıtı sayılmaz. `publishedVersionId`, sürüm kimliği, `published` durumu ve `revokedAt` birlikte doğrulanır. Eski yayın ile yeni taslak ayrıdır. İptal edilmiş, eski veya bilinmeyen sürümler etkin/başarılı süreç olarak gösterilmez. Görünür sekmedeki mevcut 5 saniyelik yenileme korunur; olay zamanı, tarama yüzdesi ve süre tahmini üretilmez.

**Testte bulunan sınır ayrıntısı:** Mevcut Busboy yapılandırması tam `50 × 1024 × 1024` baytta limit olayı üretir. Sunucu değiştirilmedi. Seçici en fazla `52.428.799` baytı kabul eder; kullanıcı metni “50 MB’dan küçük” olarak netleştirildi. Sınırın bir bayt altı, tam sınır ve bir bayt üstü gerçek multipart ayrıştırıcıyla test edilir.

HTTP uçları, veritabanı şeması, tarama ve yayın yetkileri değişmedi. Metadata formunun alanları/kaydetmesi korunup yalnız tekrarlanan üç aşamalı gösterge kaldırıldı. Öğrenci/rapor ekranları kapsam dışında. Canlı dağıtım yapılmadı.
