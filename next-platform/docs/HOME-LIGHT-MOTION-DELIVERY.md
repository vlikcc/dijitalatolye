# Ana sayfa: kompakt katalog ve hafif hareket

27 Ekim 2026. Kullanıcı Canlı vitrin ve yapboz + tek soruluk denemeyi kaldırmayı, yeni yön olarak **hafif hareketli** görünümü seçti.

## Sonuç

Ana sayfa yeniden kompakt başlık, arama, ders/sınıf filtreleri ve oyun kataloğuyla açılır. Başlıktaki “yerine oturur.” ifadesinin altında sıcak renkli çizgi kısa bir geçişle belirir. Fare kartın üzerine geldiğinde veya kart içindeki bağlantı/düğme klavye odağı aldığında ders rengine uygun ince bir vurgu, hafif yükselme ve küçük ok hareketi görünür. Kart görselleri ve metinleri sabit boyutta kalır.

Hareket yalnız ana sayfada uygulanır. Dokunmatik aygıtlarda fare etkisi çalışmaz; hareket azaltma tercihinde hareketler kapalıdır, çizgi ve odak renkleri görünür kalır. Özgün marka işareti korunur. Kaydetme, arama, filtreler ve oyun bağlantıları mevcut bileşenleri kullanır.

Eski vitrin, yapboz seçici, mini deneme, bunlara özel veri hazırlığı ve testler kaldırıldı. Önceki kaynaklar `.data/home-reset-backup/source-before.tar.gz` içinde saklandı. Önceki teslim kayıtları tarihsel olarak işaretlendi.

## 21st kullanımı

21st **UI Build** ve **katalog** becerileri uygulandı. Katalog araması yapıldı ve aşağıdaki bileşenlerin kaynakları okundu:

- [Text Highlight — uiable, 27942](https://21st.dev/@uiable/components/text-highlight): soldan beliren başlık vurgusu; mevcut renklerle CSS animasyonuna uyarlandı.
- [Hover Effect — serafimcloud, 1071](https://21st.dev/@serafimcloud/components/hover-effect): etkin kartın belirginleşmesi; mevcut GameCard üzerinde fare ve klavye için CSS gölgesi/çerçevesiyle uygulandı. Katalogdaki kartlar arasında kayan ortak arka plan kullanılmadı.
- [Content Grid Section — felipemenezes098, 28132](https://21st.dev/@felipemenezes098/components/content-04): düzen alternatifi olarak incelendi; seçilen yön mevcut kompakt ızgarayı korudu.

Yeni paket eklenmedi. Hosted AI kullanılmadı; hesabın kaynak erişimi mevcut, AI generation kapalı.

## Değişen kaynaklar

`src/app/page.tsx`, `src/components/catalog.tsx`, `src/components/catalog-view.tsx`, `src/components/catalog-intro.tsx` ve `src/app/globals.css`. Kalıcı tasarım tercihi `.21st/design.json` ve `.21st/DESIGN.md` içinde güncellendi.

## Doğrulama

- Tür kontrolü geçti; 14 dosyada 120 birim testi geçti.
- Üretim derlemesi geçti: `.data/home-light-build.log`.
- Mevcut 13 tarayıcı kontrolü geçti: 320–1920px yerleşim/kontrast, yerel font yükleme, arama taslağı ve geçmişi, hızlı filtreler, kayıtlı koleksiyon, mobil menüler ve klavye, azaltılmış hareket ve JavaScript kapalı logo. Kayıtlar: `.data/home-light-browser.log` ve `.data/home-light-browser-controls.log`.
- 21st review: 0 hata, 0 uyarı. Mevcut ortak CSS renkleri için 58 bilgi düzeyinde öneri: `.data/home-light-21st-review.json`.
- Yerel Safari’de başlık ve kart görünümü, fare vurgusu, arama/temizleme ve Option-Tab ile kart düğmesi/bağlantısına geçiş doğrulandı.
- Görseller: `.impeccable/review/home-directions/safari-light-hover.png`, `safari-light-keyboard.png`; mobil/masaüstü görüntüleri `.impeccable/review/paper-discovery/` ve `.impeccable/review/21st-frontend/after/`.
- Önizleme: `http://localhost:3113/`, üretim derlemesi ve ayrı test veritabanı. Canlı ortama dağıtım yapılmadı. Bu çalışma veri şemasını veya içerik kayıtlarını değiştirmez.

27 Ekim 2026 ek düzenleme: Kullanıcının isteğiyle arama çubuğunun solundaki dekoratif küçük oyun önizlemeleri kaldırıldı. Katalog girişinde yalnız başlık ve açıklama bulunur.

Ek düzenleme doğrulaması: üretim derlemesi ve 2 mevcut yerleşim/kontrast tarayıcı kontrolü geçti; 21st incelemesinde hata ve uyarı yok. Açık uygulama içi önizleme yenilendi. Kayıtlar: `.data/home-clean-build.log`, `.data/home-clean-browser.log`; görsel: `.impeccable/review/home-directions/without-mini-previews.png`.
