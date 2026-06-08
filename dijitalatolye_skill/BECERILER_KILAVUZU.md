# Antigravity Özel Beceriler Kurulum ve Kullanım Kılavuzu (BECERILER_KILAVUZU.md)

Bu kılavuz, Dijital İçerik Fabrikası için geliştirilen özel yapay zeka yeteneklerinin (becerilerin) Windows ve Apple (macOS) bilgisayarlarda nasıl kurulacağını ve Antigravity IDE içinde nasıl kullanılacağını açıklamaktadır.

---

## 1. Beceriler (Skills) Nedir?

Geliştirilen 4 yeni beceri sayesinde, yapay zekayı uzun uzun promptlarla yönlendirmek yerine tek bir tetikleyici kelimeyle işlem yaptırabilirsiniz:
1.  **`/oyun` (oyun-uret):** Şablon klasörünü kopyalar ve belirttiğiniz senaryoya göre yeni oyunu sıfırdan kodlar.
2.  **`/kapakuret` (kapak-uret):** Oyunun `index.html` dosyasını inceleyerek renk paleti ve ismi çeker, 500x500 px boyutunda kapak görseli üretir.
3.  **`/ziple` (ziple):** Oyun klasörünü ve kapak görselini işletim sisteminin yerleşik araçlarıyla tek bir zip dosyasında paketler.
4.  **`/oyunguncelle` (oyun-guncelle):** `oyunguncelle/` klasörüne atılan eski projeleri taranıp analiz eder, yapılacak değişiklikler için onayınızı alır ve şablona uygun güncellenmiş yeni bir sürüm oluşturur.

> [!IMPORTANT]
> **Bu beceriler yalnızca Antigravity IDE içinde çalışır.** `kapak-uret` (`generate_image` aracına ihtiyaç duyar), `ziple` ve `oyun-guncelle` (dosya sistemine erişim ister) becerileri ChatGPT/Claude web arayüzünde **çalışmaz**. Web arayüzlerinde yalnızca `oyun-uret` iş akışını, `ORNEK_PROMPT.md`'deki hazır promptu manuel kopyalayarak kullanabilirsiniz.
>
> Aşağıda kolay okunması için `/oyun`, `/kapakuret` gibi gösterimler kullanılmıştır; bunlar gerçek slash komutları değildir (sohbetteki `/` listesinde görünmezler). Komutu doğrudan sohbete yazmanız yeterlidir.

---

## 2. Kurulum Talimatları

Becerilerimiz tamamen Python bağımsızdır. Yerelde hiçbir ek yazılıma (Python, Pillow vb.) ihtiyaç duymazlar. Kurulum dosyaları projenizin içindeki `skills/` klasöründe yer almaktadır. İşletim sisteminize uygun adımı izleyin:

### Windows İçin Kurulum:
1.  Proje içindeki `skills/` klasörünü açın.
2.  **`kur.bat`** dosyasına çift tıklayarak çalıştırın.
3.  Komut satırı penceresi açılacak ve dosyaları kopyalayacaktır. Ekrandaki tamamlandı mesajından sonra bir tuşa basarak kapatabilirsiniz.

### Apple (macOS) İçin Kurulum:
macOS sistemlerde iki yöntemden birini seçebilirsiniz:

#### Yöntem A: Terminal ve Shell Script ile (Önerilen)
1.  Terminal (Uçbirim) uygulamasını açın.
2.  Projedeki `skills` klasörünün içine gidin (Terminal penceresine `cd ` yazıp `skills` klasörünü sürükleyip bırakarak Enter'a basabilirsiniz).
3.  Şu komutları sırasıyla çalıştırın:
    ```bash
    chmod +x kur.sh
    ./kur.sh
    ```

#### Yöntem B: Python ile
1.  Terminal uygulamasını açın.
2.  `skills` klasörünün dizinine gidin.
3.  Şu komutu çalıştırın:
    ```bash
    python3 kur.py
    ```

> [!IMPORTANT]
> Kurulum tamamlandıktan sonra yeni becerilerin yüklenip aktif olabilmesi için **Antigravity IDE'yi kapatıp yeniden başlatmanız** (veya sohbet penceresini yenilemeniz) gerekmektedir.

> [!NOTE]
> Kurulum scriptleri becerileri `~/.gemini/config/skills` (Windows'ta `%USERPROFILE%\.gemini\config\skills`) dizinine kopyalar. Antigravity sürümünüz farklı bir beceri dizini kullanıyorsa, kurulumdan sonra beceriler görünmüyorsa bu yolu IDE'nizin beceri (skills) dizinine göre güncellemeniz gerekebilir.

---

## 3. Kullanım Talimatları (Nasıl Tetiklenir?)

Özel beceriler chat ekranında `/` tuşuna basıldığında açılan otomatik tamamlama listesinde **görünmezler**. Bu liste sadece sistemin yerleşik komutlarına ayrılmıştır.

Bunun yerine, sohbete doğrudan aşağıdaki komutları veya doğal dil ifadelerini yazarak yetenekleri tetikleyebilirsiniz. Yapay zeka bu kelimeleri algılayarak arka planda ilgili beceriyi çalıştıracaktır:

### A. Yeni Oyun Üretme (`/oyun` veya `oyun-uret`)
*   **Komut olarak:** `/oyun [yeni-oyun-klasor-adi] [Oyun Senaryosu]`
    *   *Örnek:* `/oyun kelime-bulmaca Ekrana gelen dağınık harflerden anlamlı Türkçe kelimeler türetme oyunu.`
*   **Doğal dilde:** `"Şablondan kopyalayarak 'uzay-savasi' adında bir oyun üret. Senaryosu: ..."`

### B. Kapak Görseli Oluşturma (`/kapakuret` veya `kapak-uret`)
*   **Komut olarak:** `/kapakuret [oyun-klasor-adi]`
    *   *Örnek:* `/kapakuret meyve-eslestirmece`
*   **Doğal dilde:** `"meyve-eslestirmece oyunu için kapak resmi oluştur."` veya `"kapak üret"`.

### C. Zipleme ve Yayınlama (`/ziple` veya `ziple`)
*   **Komut olarak:** `/ziple [oyun-klasor-adi]`
    *   *Örnek:* `/ziple meyve-eslestirmece`
*   **Doğal dilde:** `"meyve-eslestirmece oyununu ziple"` veya `"projeyi paketle"`.

### D. Eski Oyunu Güncelleme (`/oyunguncelle` veya `oyun-guncelle`)
*   **Komut olarak:** `/oyunguncelle [eski-oyun-klasor-adi]`
    *   *Örnek:* `/oyunguncelle hayvan-sesleri`
*   **Doğal dilde:** `"oyunguncelle klasöründeki hayvan-sesleri oyununu güncelle"` veya `"eski oyunu şablona uyarla"`.

---

## 4. Örnek İş Akışı (Uçtan Uca Oyun Geliştirme)

1.  **IDE'yi Başlatın:** Projenizi Antigravity ile açın.
2.  **Oyunu Üretin:** Sohbete yazın:
    > `/oyun hayvan-bulmaca Hayvan seslerini dinleyip doğru görseli seçme oyunu.`
3.  **Kapağı Oluşturun:** Oyun başarıyla kodlandığında sohbete yazın:
    > `/kapakuret hayvan-bulmaca`
4.  **Paketi Hazırlayın:** Kapak oluştuktan sonra sohbete yazın:
    > `/ziple hayvan-bulmaca`
5.  **Sonuç:** Kapak görselleri (`hayvan-bulmaca-kapak-1.png` … en fazla `-4.png`) oyun klasörünün içine yerleştirilir, ardından klasör `hayvan-bulmaca.zip` olarak paketlenir. Hem oyun klasörü hem de zip dosyası ana dizindeki `oyunlar/` klasörünün altına taşınır. `oyunlar/hayvan-bulmaca.zip` dosyasını LMS/web portalınıza yükleyebilirsiniz.
