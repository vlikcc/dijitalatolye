# 21st Builder önyüz pilotu — kaynak kaydı

27 Ekim 2026. Kapsam: katalog girişi, oyun kartları, giriş/kayıt yerleşimi ve oyun bilgileri.

Bu pilotta aşağıdaki örneklerin yerleşim fikirleri incelendi. Bileşenler projenin mevcut React, Lucide ve CSS altyapısıyla bağımsız yazıldı; üçüncü taraf bileşen kodu veya bağımlılığı projeye kopyalanmadı. Aşağıdaki “MIT” bilgileri katalog etiketidir; sabit bir üretici deposunun lisans doğrulaması olarak kullanılmaz.

| Referans ve yazar | Erişim / lisans kanıtı | Alınan fikir ve yerel uygulama |
|---|---|---|
| [Hero with image, text and two buttons](https://21st.dev/@tommyjepsen/components/hero-with-image-text-and-two-buttons) — Tommy Jepsen | Giriş yapılmış Safari hesabında Component.tsx sekmesi açıldı. Katalog: MIT; yayımlanma 23 Aralık 2024. Kaynak commit'i alınmadı. | Metin ve gerçek görseli yan yana yerleştirme. `catalog-intro.tsx` mevcut kısa başlığın yanına en fazla üç katalog kapağı koyar; büyük hero ve iki yeni eylem eklemez. |
| [Split Screen Login](https://21st.dev/@lavikatiyar/components/login) — Lavi Katiyar | Görsel yerleşim referansı. Kaynak lisansı doğrulanmadı; kod alınmadı. | `account-layout.tsx`: masaüstünde form solda, gerçek katalog kapakları sağda; 1024 px altında yalnız form. |
| [Layro Auth Forms](https://docs.21st.dev/@uvain/components/auth-forms-signin-signup) — Mohamed Uvaish / Layro | Katalogda MIT etiketi; sabit kaynak sürümü alınmadı. Yalnız form geri bildirimi referansı. | Mevcut kayıt formunda gerçek 12 karakter koşulu ve belirgin durum alanı. Kaynağın kimlik doğrulama, SMS veya OTP uygulaması alınmadı. |

Kaynak özeti: 27 Ekim 2026 tarihinde görülen metin–görsel kompozisyonu, bölünmüş hesap yerleşimi ve alan yanında durum geri bildirimi desenleri. Projede kullanılan görseller mevcut herkese açık `CatalogGame.cover` değerleridir; yeni stok veya yapay görsel yoktur. Kapaksız kayıtlar dekoratif seçimden çıkarılır; katalog boşsa sahte içerik üretilmez.

## Hesap ve MCP durumu

- Kullanıcının satın aldığı Builder planı Safari hesap ekranında etkin görüldü; bileşen kod sekmesine erişim doğrulandı.
- Ekran görüntüsündeki `codex plugin marketplace add 21st-dev/codex-plugin` komutu yalnız pazaryerini eklemişti. Eksik eklenti kurulumu `codex plugin add 21st@21st` ile tamamlandı: yerel sürüm **0.5.0**. Son `codex plugin list --json` kontrolünde `installed: true` ve `enabled: true` doğrulandı.
- [Resmî MCP bağlantı sayfası](https://21st.dev/mcp) ve yerel eklenti belgeleri incelendi. Kurulum sonrası bu açık sohbetin araç listesinde 21st araçları bulunmadı. Pilot kaynak incelemesi Safari üzerinden tamamlandı; MCP çağrısı veya MCP kimlik doğrulamasının çalıştığı iddia edilmiyor.
- Bu çalışma yeni satın alma, AI üretim çağrısı, AI kredisi, ücretli şablon veya çalışma zamanı paketi kullanmadı. Kullanıcının önceden aldığı abonelik bu ifadenin dışındadır.

Bağımsız yazılan bu önyüz için yeni bir üçüncü taraf kod lisansı bildirimi eklenmedi. Önceki yükleme/yayın pilotunun gerçek kod uyarlamaları ve MIT bildirimleri [ayrı kaynak kaydında](21st-pilot.md) korunur.

## Sonraki giriş ekranı iyileştirmesi — 27 Ekim 2026

Bu sonraki turda 21st MCP araçları erişilebildi: `get_usage` ücretli erişimi ve AI üretiminin kapalı olduğunu doğruladı. `search` ardından [Split Sign In Form — diarmuradi](https://21st.dev/@diarmuradi/components/sign-in-3) kaynağı `get_component` ile incelendi (demo `39096`, bileşen `22060`). İki sütunlu form/vitrin kompozisyonu referans alındı. Yanıtta lisans ve sabit kaynak commit'i bulunmadığından kod kopyalanmadı; uygulama mevcut proje bileşenleriyle bağımsız yazıldı. Bu güncelleme önceki turdaki “MCP erişilemedi” kaydının tarihsel niteliğini açıklar. Ayrıntılar ve kontroller [giriş teslim kaydında](../LOGIN-SHOWCASE-DELIVERY.md).

## Katalog küçük dokunuşları — 27 Ekim 2026

UI Build ve katalog becerileriyle 12 arama, 44 ayrı sonuç ve 12 ana kaynak incelemesine dayanılarak arama vurgusu, boş sonuç eylemleri, geri alma, gerçek bekleme, görsel hata hali, açıklama balonu, kısayol ve yükleme iskeleti yerel olarak uygulandı. Yeni üçüncü taraf kod veya paket eklenmedi. Kaynak bağlantıları ve uygulanmış davranışlar [teslim kaydında](../CATALOG-MICRO-TOUCHES-DELIVERY.md); ayrıntılı kaynak değerlendirmesi [araştırmada](../21ST-MICRO-TOUCH-RESEARCH-2026-10-27.md).
