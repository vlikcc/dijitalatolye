---
name: kapak-uret
description: "Oyun klasöründeki index.html'i inceleyerek renk paletini ve başlığı çeker, kapak-arka-plan klasöründeki uygun şablonu seçip oyun adını yazarak generate_image aracı yardımıyla kapak üretir. /kapakuret komutuyla tetiklenir."
---

# Kapak Üretme Becerisi (kapak-uret)

## Genel Bakış
Bu beceri, oyun klasörünün içeriğini (başlık, renk şeması, tema, eğitsel konu) **kaynak kodundan okuyarak** analiz eder, `kapak-arka-plan/` dizinindeki en uygun hazır şablon görselini seçer ve `generate_image` aracıyla bu şablon üzerine oyun adını ve konuya uygun bir illüstrasyon ekleyerek en fazla 4 kapak görseli (`[oyun-adi]-kapak-1.png` … `[oyun-adi]-kapak-4.png`) üretir.

> [!WARNING]
> **TARAYICI AÇMAYIN / EKRAN GÖRÜNTÜSÜ ALMAYIN:** Bu beceri oyunun ekran görüntüsünü **almaz**. Analiz tamamen `index.html` kaynak kodu (başlık, CSS renkleri, oyun konusu) okunarak yapılır. Playwright/Selenium gibi tarayıcı otomasyonu kullanmayın.

> [!WARNING]
> **PROGRAMATİK ÇİZİM YASAĞI (CROSS-PLATFORM):** KESİNLİKLE Pillow (PIL), HTML Canvas, OpenCV veya başka bir yerel programatik çizim kütüphanesi kullanarak yazıları şablon üzerine yerleştirmeye ÇALIŞMAYIN. Yazı yazma ve illüstrasyon ekleme işlemi SADECE `generate_image` yapay zeka aracı ile yapılmalıdır. Yerel kütüphaneler (Pillow) işletim sistemlerinde yazı tipi (font) uyuşmazlığına ve çirkin, kaymış sonuçlara neden olmaktadır.

> [!IMPORTANT]
> **CROSS-PLATFORM (WINDOWS / macOS UYUMLULUĞU):**
> - Dosya yollarını çözerken asla sabit `C:\...` sürücü harfi kullanmayın. Yolları dinamik ve göreceli (relative) veya `os.path.abspath()` ile çözün.
> - macOS ve Linux sistemlerinde dosya yollarının `/Users/...` şeklinde başladığını unutmayın.

## Gereksinimler
Kapak arka plan şablonları çalışma dizinindeki `kapak-arka-plan/` klasöründe yer alır. Dosya isimleri `[a/k].[renk].png` biçimindedir (örn. `k.yesil.png`, `a.mavi.png`).
- `a.` ön eki Açık (light) temayı temsil eder (dış zemin açık, iç yazı kutusu koyu renktir).
- `k.` ön eki Koyu (dark) temayı temsil eder (dış zemin koyu, iç yazı kutusu beyaz/açık gri renktir).
- `[renk]` ifadesi çerçeve veya arka planda kullanılan baskın rengi belirtir (bordo, kahve, mavi, mor, turkuaz, yesil).

## Kullanım Yönergesi (Ajan İçin)
Kullanıcı `/kapakuret [oyun-klasoru-adi]` komutunu çalıştırdığında veya oyun için kapak üretilmesini istediğinde şu adımları izleyin:

### 1. Hazırlık ve Adet Seçimi
- Kapak üretimine başlamadan önce kullanıcıya kaç adet kapak üretmek istediğini sorun. Seçenek olarak **1, 2, 3 veya 4 adet** sunun ve kullanıcının yanıtını bekleyin.

### 2. Analiz Aşaması
- Hedef oyun klasörünün içindeki `index.html` dosyasını okuyun.
- `<title>` etiketi veya `class="game-title"` olan H1 etiketinden oyun adını çekin.
- CSS içerisindeki ana renkleri (örneğin `--renk-arka-plan`, `--renk-primary` vb.) tespit edip uygun renkli şablonu belirleyin (Örn: Mor/mavi tonları ağırlıklıysa `mor` veya `mavi` şablon seçilir).
- HTML/JS kodunu inceleyerek oyunun eğitsel konusunu ve amacını analiz edin (Örn: Meyve toplama, matematik eşleştirme vb.).
- **KESİNLİKLE tarayıcı açmayın ve ekran görüntüsü almayın.**

### 3. Görsel Üretim Aşaması (generate_image)
`generate_image` aracını kullanarak kullanıcının seçtiği adet miktarına göre görsel üretimi yapın.

#### Kombinasyon Seçenekleri (Toplam 4 Olası Kombinasyon):
1. **Kapak 1 (`[oyun-adi]-kapak-1.png`):** Koyu arka plan şablonu (`k.[renk].png`) + Koyu tema konseptli oyun çizimi + Oyun adı (beyaz renkle).
2. **Kapak 2 (`[oyun-adi]-kapak-2.png`):** Açık arka plan şablonu (`a.[renk].png`) + Koyu tema konseptli oyun çizimi + Oyun adı (koyu/uyumlu renkle).
3. **Kapak 3 (`[oyun-adi]-kapak-3.png`):** Koyu arka plan şablonu (`k.[renk].png`) + Açık tema konseptli oyun çizimi + Oyun adı (beyaz renkle).
4. **Kapak 4 (`[oyun-adi]-kapak-4.png`):** Açık arka plan şablonu (`a.[renk].png`) + Açık tema konseptli oyun çizimi + Oyun adı (koyu/uyumlu renkle).

#### Üretilecek Kapakların Seçim Mantığı:
- **Kullanıcı 4 adet üretilmesini isterse:** Yukarıdaki 4 kombinasyonun tamamını sırayla üretin.
- **Kullanıcı 3 adet üretilmesini isterse:** Oyunun yapısına en uygun **3 adet** kapak kombinasyonunu (örneğin Kapak 1, Kapak 2 ve Kapak 4 gibi en uyumlu zemin ve tema eşleşmelerini) seçip sadece bu 3 kombinasyonu üretin.
- **Kullanıcı 2 adet üretilmesini isterse:** Oyunun yapısına en uygun **2 adet** kapak kombinasyonunu (örneğin hem koyu zemin Kapak 1, hem açık zemin Kapak 4 gibi kontrast seçenekleri) seçip sadece bu 2 kombinasyonu üretin.
- **Kullanıcı 1 adet üretilmesini isterse:** Oyunun varsayılan/ana tema yapısına en uygun olan **1 adet** kapak kombinasyonunu (örneğin oyun koyu temalıysa Kapak 1'i, açık temalıysa Kapak 4'ü) agent olarak kendiniz seçip sadece o kombinasyonu üretin.

#### Prompt Yönergesi (Tasarım ve Alan Kuralları):
- `generate_image` çağrılırken `ImagePaths` parametresinde girdi görseli olarak sadece belirlenen kapak şablon dosyasını (örneğin `kapak-arka-plan/k.mor.png`) verin.
- **Şablon Alan Tanımları ve Sınırlar:**
  - **Logo Bölgesi (En Üst Bölüm):** Şablonun en üst kısmında yer alan "DİJİTAL OYUN ATÖLYESİ" logosuna ve üst çizgilere kesinlikle müdahale edilmemeli, üzerine yazı yazılmamalı ve hiçbir görsel bu alanı kapatmamalıdır.
  - **İç İçerik Kutusu (Merkez Bölge):** Şablonun ortasında yer alan beyaz/açık renkli iç kutu, tüm tasarımın yapılacağı ana alandır. Yazılacak oyun adı ve yapılacak çizimler KESİNLİKLE bu iç içerik kutusunun sınırları içinde kalmalı, dışarıya veya dış çerçeve kenarlıklarına asla taşmamalıdır.
- **Konumlandırma, Çizim ve Hizalama:**
  - **Çizim/Grafik:** Şablonun ortasındaki iç kutunun alt/orta bölgesine, analiz ettiğiniz oyunun konusuna uygun (örneğin meyve toplama oyunu ise sepet ve renkli meyveler illüstrasyonu; matematik oyunu ise eğlenceli sayılar ve formüller) modern, çocuklara yönelik ve yüksek kaliteli bir illüstrasyon çizdirin. **Aksi belirtilmediği sürece çizimlerde büyücü, sihir, iksir, fantastik macera gibi sürreal veya fantastik ögeler kesinlikle kullanılmamalı, gerçekçi ve eğitsel nesneler tercih edilmelidir.**
  - **Oyun İsmi:** Oyun adını, ortadaki iç içerik kutusunun üst-sağ veya üst-orta bölgesine, çerçevenin iç sınırlarından yeterli boşluk (margin) bırakacak şekilde yerleştirin. Yazıyı Türkçe karakterlere dikkat ederek **tamamen BÜYÜK HARFLERLE** (ALL UPPERCASE), kalın, okunaklı ve modern bir sans-serif yazı tipiyle (örn: Inter, Montserrat, Outfit) yazdırın. Türkçe büyük harfleri yazarken `İ` ve `I` harflerine özellikle dikkat edin (örneğin "MİSAFİR").
- **Renk Kuralları:**
  - Eğer seçilen şablon `a.[renk].png` (açık tema) ise, oyun adını **koyu mavi / koyu renk** veya şablon rengiyle uyumlu koyu tonlarda yazdırın.
  - Eğer seçilen şablon `k.[renk].png` (koyu tema) ise, oyun adını **beyaz veya çok açık gri** renkle yazdırın.
- Şablonun orijinal dış sınırlarını ve tüm grafik detaylarını aynen koruyun.
- Çıktının 1:1 en-boy oranında (kare) olmasını sağlayın.
- **Görsel Kaydetme ve Versiyonlama Kuralları:**
  - Üretilen görselleri kaydetmeden önce oyun klasörü içerisinde aynı isimde bir dosya (örn: `[oyun-klasor-adi]-kapak-1.png`) olup olmadığını kontrol edin.
  - Eğer aynı isimde bir dosya varsa, eski dosyanın üzerine yazılmasını önlemek için dosya adının sonuna artan bir versiyon numarası ekleyerek yeni bir dosya olarak kaydedin (örn: `[oyun-klasor-adi]-kapak-1-v2.png`, `[oyun-klasor-adi]-kapak-1-v3.png` vb.).
  - Eğer çakışma yoksa, doğrudan standart isimle (örn. `[oyun-klasor-adi]-kapak-1.png`) kaydedin.

### 4. Kapak Yönetimi ve Sunum
- Üretim tamamlandığında kullanıcıya üretilen kapak dosya bağlantılarını sunun.
- Kullanılmayan veya onaylanmayan eski kapak görselleri varsa temizleyin.



