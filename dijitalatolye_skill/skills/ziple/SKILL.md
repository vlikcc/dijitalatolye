---
name: ziple
description: "Oyun klasörünü ziplemeden önce kapak görsellerini oyun klasörünün içine koyar, zipleme işlemini gerçekleştirir ve hem oyun klasörünü hem de üretilen zip dosyasını 'oyunlar' klasörüne taşır. /ziple komutuyla tetiklenir."
---

# Zipleme ve Paketleme Becerisi (ziple)

## Genel Bakış
Bu beceri, tamamlanan oyun klasörünü paketlemeyi ve düzenlemeyi otomatikleştirir. Oyun için üretilmiş olan kapak görsellerini (`[oyun-adi]-kapak-*.png`) oyun klasörünün içine yerleştirir, ardından klasörü tek bir sıkıştırılmış zip dosyası (`[oyun-adi].zip`) olarak paketler. Son adımda hem oyun klasörünü hem de üretilen zip dosyasını ana dizindeki `oyunlar/` klasörünün altına taşır.

## Gereksinimler
Sıkıştırma işlemi için işletim sistemlerinin yerleşik arşivleme araçları ve dosya taşıma komutları kullanılır. `oyunlar/` hedef klasörü yoksa otomatik olarak oluşturulmalıdır.

## Kullanım Yönergesi (Ajan İçin)
Kullanıcı `/ziple [oyun-klasoru-adi]` komutunu çalıştırdığında veya oyunu paketlemek istediğinde şu adımları izleyin:

### 1. Hazırlık Aşaması
- Oyun klasörünün absolute yolunu ve yer aldığı üst dizini (parent directory / workspace root) belirleyin.
- Oyun için üretilmiş olan kapak görsellerinin (`[oyun-klasor-adi]-kapak-*.png`) konumunu kontrol edin:
  - Eğer kapak görselleri oyun klasörünün dışında (üst dizinde) ise, bunları oyun klasörünün içine taşıyın/kopyalayın.
  - Eğer kapak görselleri zaten oyun klasörünün içinde ise veya bulunamadıysa bir sonraki adıma geçin.
- Ana dizinde `oyunlar/` adında bir klasör olup olmadığını kontrol edin, yoksa oluşturun.

### 2. Sıkıştırma ve Arşivleme Aşaması
- Oyun klasöründeki `zipler.bat` dosyasının zipe dahil edilmemesi için bu dosyayı geçici olarak bir üst dizine taşıyın:

   *   **Windows Sistemlerde (PowerShell):**
       ```powershell
       if (Test-Path "[oyun-klasoru-yolu]\zipler.bat") { Move-Item -Path "[oyun-klasoru-yolu]\zipler.bat" -Destination "[ust-dizin-yolu]\" -Force }
       ```

   *   **macOS / Linux Sistemlerde (Bash):**
       ```bash
       [ -f "[oyun-klasoru-yolu]/zipler.bat" ] && mv "[oyun-klasoru-yolu]/zipler.bat" "[ust-dizin-yolu]/"
       ```

- İşletim sistemine uygun yerleşik komutları kullanarak oyun klasörünü sıkıştırın:

   *   **Windows Sistemlerde (PowerShell):**
       ```powershell
       Compress-Archive -Path "[oyun-klasoru-yolu]" -DestinationPath "[ust-dizin-yolu]\[oyun-klasor-adi].zip" -Force
       ```

   *   **macOS / Linux Sistemlerde (Bash):**
       ```bash
       cd "[ust-dizin-yolu]" && zip -r "[oyun-klasor-adi].zip" "[oyun-klasor-adi]"
       ```

- Sıkıştırma işlemi tamamlandıktan sonra, `zipler.bat` dosyasını hem zip arşivinden hem de oyunlar klasörüne taşınacak olan orijinal oyun klasöründen tamamen arındırmak için geçici dizindeki `zipler.bat` dosyasını silin (böylece oyunlar/ altına taşınan klasörde de bu dosya yer almaz):

   *   **Windows Sistemlerde (PowerShell):**
       ```powershell
       if (Test-Path "[ust-dizin-yolu]\zipler.bat") { Remove-Item -Path "[ust-dizin-yolu]\zipler.bat" -Force }
       ```

   *   **macOS / Linux Sistemlerde (Bash):**
       ```bash
       rm -f "[ust-dizin-yolu]/zipler.bat"
       ```

### 3. Klasör ve Arşiv Taşıma Aşaması
- Sıkıştırma işlemi bittikten sonra, hem orijinal oyun klasörünü hem de oluşturulan `[oyun-klasor-adi].zip` dosyasını `oyunlar/` klasörünün altına taşıyın:

   *   **Windows Sistemlerde (PowerShell):**
       ```powershell
       Move-Item -Path "[oyun-klasoru-yolu]", "[ust-dizin-yolu]\[oyun-klasor-adi].zip" -Destination "[ust-dizin-yolu]\oyunlar\" -Force
       ```

   *   **macOS / Linux Sistemlerde (Bash):**
       ```bash
       mv "[oyun-klasoru-yolu]" "[ust-dizin-yolu]/[oyun-klasor-adi].zip" "[ust-dizin-yolu]/oyunlar/"
       ```

### 4. Sonuç Raporu
- İşlem tamamlandıktan sonra kullanıcıya başarı mesajını, oluşturulan zip dosyasının yeni konumunu ve taşınan klasör yollarını iletin.

