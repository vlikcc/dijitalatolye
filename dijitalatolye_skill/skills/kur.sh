#!/bin/bash
# UTF-8 encoding
echo "===================================================="
echo "   Antigravity Becerileri Kurulum Sihirbazı (Mac/Linux)"
echo "===================================================="
echo ""

TARGET_DIR="$HOME/.gemini/config/skills"

if [ ! -d "$TARGET_DIR" ]; then
    echo "Hedef dizin oluşturuluyor: $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
fi

echo "Beceriler kopyalanıyor..."
echo "----------------------------------------------------"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Hedefte varsa temizle ve kopyala
rm -rf "$TARGET_DIR/oyun-uret"
rm -rf "$TARGET_DIR/kapak-uret"
rm -rf "$TARGET_DIR/ziple"
rm -rf "$TARGET_DIR/oyun-guncelle"

cp -R "$SCRIPT_DIR/oyun-uret" "$TARGET_DIR/"
cp -R "$SCRIPT_DIR/kapak-uret" "$TARGET_DIR/"
cp -R "$SCRIPT_DIR/ziple" "$TARGET_DIR/"
cp -R "$SCRIPT_DIR/oyun-guncelle" "$TARGET_DIR/"

echo "----------------------------------------------------"
echo ""
echo "Kurulum başarıyla tamamlandı!"
echo "IDE'nizi yeniden başlattıktan sonra beceriler yüklenecektir."
echo "Kullanmak için sohbete direkt 'oyun üret', 'kapak üret', 'ziple' veya 'oyun güncelle' yazabilirsiniz."
