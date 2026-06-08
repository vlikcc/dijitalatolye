@echo off
chcp 65001 > nul
:: Dosyanın bulunduğu klasörün adını al (Oyun klasörü adı)
for %%I in ("%~dp0.") do set "OyunAdi=%%~nxI"

echo ==============================================
echo  DİJİTAL İÇERİK FABRİKASI OTOMATİK ZİPLEYİCİ
echo ==============================================
echo Sıkıştırılacak Klasör: %OyunAdi%

:: PowerShell'i çağırarak klasörün içeriğini bir üst dizine zipler (LiteralPath kullanarak özel karakterleri destekler)
powershell -NoProfile -Command "Get-ChildItem -LiteralPath '%~dp0' | Compress-Archive -DestinationPath '%~dp0..\%OyunAdi%.zip' -Force"

echo.
echo [BAŞARILI] %OyunAdi%.zip dosyası bir üst dizinde oluşturuldu!
echo ==============================================
timeout /t 3
