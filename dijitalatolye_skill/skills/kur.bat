@echo off
chcp 65001 > nul
echo ====================================================
echo    Antigravity Becerileri Kurulum Sihirbazi
echo ====================================================
echo.

:: Hedef klasor yolunu tanimla
set "SKILLS_DIR=%USERPROFILE%\.gemini\config\skills"

:: Hedef klasor yoksa olustur
if not exist "%SKILLS_DIR%" (
    echo Hedef dizin olusturuluyor: %SKILLS_DIR%
    mkdir "%SKILLS_DIR%"
)

echo Beceriler kopyalaniyor...
echo ----------------------------------------------------

:: Hedef klasorleri onceden temizle (eski scripts klasorlerinin kalmamasi icin)
if exist "%SKILLS_DIR%\oyun-uret" rmdir /S /Q "%SKILLS_DIR%\oyun-uret"
if exist "%SKILLS_DIR%\kapak-uret" rmdir /S /Q "%SKILLS_DIR%\kapak-uret"
if exist "%SKILLS_DIR%\ziple" rmdir /S /Q "%SKILLS_DIR%\ziple"
if exist "%SKILLS_DIR%\oyun-guncelle" rmdir /S /Q "%SKILLS_DIR%\oyun-guncelle"

:: xcopy ile tum klasorleri kopyala (/E: Alt klasorlerle beraber, /I: Hedef yoksa klasor olarak gor, /Y: Uzerine yaz)
xcopy /E /I /Y "oyun-uret" "%SKILLS_DIR%\oyun-uret"
xcopy /E /I /Y "kapak-uret" "%SKILLS_DIR%\kapak-uret"
xcopy /E /I /Y "ziple" "%SKILLS_DIR%\ziple"
xcopy /E /I /Y "oyun-guncelle" "%SKILLS_DIR%\oyun-guncelle"

echo ----------------------------------------------------
echo.
echo Kurulum basariyla tamamlandi! 
echo Artik Antigravity IDE uzerinden /oyun, /kapakuret, /ziple ve /oyunguncelle becerilerini kullanabilirsiniz.
echo.
pause
