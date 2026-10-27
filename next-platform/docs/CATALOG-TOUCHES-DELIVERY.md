# Katalog: üç küçük etkileşim

27 Ekim 2026. Kullanıcı üç önerinin tamamını onayladı.

## Görünüm ve davranış

- **Ders çizgisi:** Seçili dersin altındaki tek çizgi yeni bağlantıya kayar ve ders rengini alır. Bağlantılar gerçek URL’leri, klavye odağını ve tarayıcı geçmişini korur. Satır kayması, ekran genişliği ve font yüklemesinde çizgi yeniden hizalanır. Mobilde mevcut Ders seçicisi kullanılır; JavaScript yokken statik çizgi görünür.
- **Kaydetme tepkisi:** Başarılı tıklamada yer imi simgesi kısa bir hareket yapar. Kartta 1,8 saniye “Kaydedildi” veya “Kayıt kaldırıldı” mesajı görünür; ekran okuyucuya da bildirilir. Kayıtlı bir sayfa yeniden açıldığında animasyon/mesaj tekrarlanmaz. Depolama hatasında başarı mesajı gösterilmez; mevcut hata açıklaması korunur.
- **Filtre etiketleri:** Yalnız uygulanmış arama, sınıf ve ders seçimleri etiket olarak görünür. Her etiket tek başına kaldırılabilir. Diğer seçimler, kaydedilmiş oyunlar koleksiyonu ve henüz uygulanmamış arama taslağı korunur. Arama etiketi kaldırılırsa arama alanı temizlenir. Klavye odağı sonraki etikete; son etiket kaldırılınca sonuç başlığına geçer. Sonuç sayısında tekrarlanan filtre metinleri çıkarıldı.

Hareket azaltma tercihi tüm yeni hareketleri kapatır. Etiketler 44px dokunma alanına sahiptir ve uzun metinlerde satıra yayılır. Yeni bağımlılık veya veri şeması eklenmedi.

## 21st kaynakları

UI Build ve katalog becerileri kullanıldı. Önce katalog arandı, kaynak kodları okundu, sonra mevcut React/CSS bileşenlerine uyarlandı:

- [Animated Tabs — educalvolpz, 24930](https://21st.dev/@educalvolpz/components/animated-tabs): ortak hareketli gösterge. Mevcut URL bağlantıları korundu; Motion yerine CSS geçişi ve ResizeObserver kullanıldı.
- [Bookmark Icon Button — ozantekin, 1696](https://21st.dev/@ozantekin/components/bookmark-icon-button): kaydetmeye simge tepkisi. Mevcut yerel kayıt sonucuna bağlandı, sade bir onay hareketi ve metni kullanıldı.
- [Filter Badge — serafimcloud, 519](https://21st.dev/@serafimcloud/components/filter-badge): tek tek kaldırılabilir etiketler. Mevcut renkler ve Lucide simgeleri kullanıldı.

## Kaynaklar

- `src/components/catalog-subject-nav.tsx`
- `src/components/catalog-view.tsx`
- `src/components/saved-games.tsx`
- `src/app/globals.css`
- `tests/e2e/catalog-touches.spec.ts`
- `.21st/design.json`, `.21st/DESIGN.md`

## Doğrulama

Tür kontrolü ve 120 birim testi geçti. Ayrı test veritabanıyla 9 tarayıcı kontrolü geçti: mevcut dört katalog kontrolü ve beş yeni işlevsel kontrol. Yeni kontroller tek filtre silme, taslak/geçmiş/koleksiyon korunması, klavye odağı, çok satırlı ders menüsünde çizgi hizası, mobil yerleşim, kayıt kalıcılığı, azaltılmış hareket ve engellenmiş depolama senaryolarını kapsar.

21st review: 0 hata, 0 uyarı; ortak CSS’teki mevcut renkler için 58 bilgi düzeyinde öneri.

Kayıtlar `.data/catalog-touches-browser.log`, `.data/catalog-touches-unit.log`, `.data/catalog-touches-21st-review.json`; test görselleri `.impeccable/review/catalog-touches/` içinde. Değişiklik öncesi kaynaklar `.data/catalog-touches-backup/source-before.tar.gz` içinde saklandı.

Üretim derlemesi tamamlandı (`.data/catalog-touches-build.log`). Güncel derleme `http://localhost:3113/` adresinde açıldı. Uygulama içi tarayıcıda ders/sınıf seçimi, tek etiket kaldırma ve gerçek kaydetme bildirimi ayrıca doğrulandı; deneme kayıtları geri alındı ve görünüm filtresiz ana sayfaya döndürüldü. Üç dokunuşun örnek görüntüsü `.impeccable/review/catalog-touches/production-touches.png` içinde. Canlı ortama dağıtım yapılmadı.

27 Ekim 2026 ek düzenleme: Seçilen dersin adı, başlıkta ana sayfanın işaretleme çizgisiyle vurgulanır. Renk ilgili ders sekmesindeki `--subject` değerinden gelir; “oyunları” sözcüğü düz kalır. Üretim derlemesi ve tür kontrolü geçti; 21st incelemesinde 0 hata/uyarı. Dört ders başlığı uygulama içi tarayıcıda kontrol edildi. Kaynaklar: `catalog-intro.tsx`, `catalog-view.tsx`, `globals.css`. Kayıt `.data/subject-title-build.log`; görsel `.impeccable/review/catalog-touches/subject-title.png`.
