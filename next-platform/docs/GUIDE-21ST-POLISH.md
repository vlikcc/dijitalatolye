# Nasıl kullanılır? — küçük görsel dokunuşlar

27 Ekim 2026. Kullanıcının bu sayfaya özel, ana sayfadaki vurgu diline yakın küçük dokunuş isteği için 21st UI Build ve katalog becerileri kullanıldı.

## Uygulama

- “Birlikte keşfet.” ifadesi mevcut `catalog-title-highlight` stiliyle vurgulanır. Ana sayfanın amber rengi, çizim süresi ve azaltılmış hareket davranışı yeniden kullanılır.
- Başlığın yanındaki iki doğal sayfa bağlantısı, “Öğrenciyim” ve “Öğretmenim”, ilgili bölüme gider. Dar ekranlarda başlığın altına geçer. Mevcut Lucide ikonları ve renk değişkenleri kullanılır; bağlantılarda hafif hover/odak geri bildirimi bulunur.
- Öğrenci ikonları ve öğretmen sıra numaraları, ince bağlantı çizgileriyle adımların akışını gösterir. Gösterimler etkileşimli kontrol gibi davranmaz.

Kaynak değişiklikleri yalnız `src/app/nasil-kullanilir/page.tsx` ve `src/app/globals.css` içindeki bu sayfaya ait kurallardadır. Yeni bağımlılık veya istemci bileşeni eklenmedi.

## Katalog kaynakları

- [Text Highlight — uiable](https://21st.dev/@uiable/components/text-highlight), demo 27942: kaynağı incelendi. Yeni bir Framer Motion bileşeni kurmak yerine aynı örnekten daha önce uyarlanan mevcut başlık vurgusu kullanıldı.
- [How It Works Timeline — olewandowski1](https://21st.dev/@olewandowski1/components/how-it-works-2), demo 19863: kaynağı incelendi. Dikey adım düğümleri ve bağlantı çizgisi fikri mevcut listeye yerel CSS ile uyarlandı. Kaynak TSX, Remix Icon ve Badge bileşeni kopyalanmadı.

## Kontroller

- TypeScript tür kontrolü geçti.
- 320, 390, 600, 768, 900, 1024 ve 1440 px genişliklerde taşma bulunmadı.
- Kısayolun klavyeyle çalışması, bölümün görünür alana gelmesi, öğrenci kayıt/öğretmen paylaşım hedefleri ve azaltılmış harekette alt çizgi animasyonunun kapalı olması doğrulandı.
- Tarayıcıda JavaScript hatası görülmedi; masaüstü, tablet ve telefon görselleri incelendi.
- `21st review`: 0 hata, 0 uyarı. Genel CSS dosyasındaki mevcut renkler için 58 bilgi önerisi var; yeni sayfa kurallarında sabit renk eklenmedi.

Yerel kanıt ve kaynak yedeği: `.data/audience-polish/`.
