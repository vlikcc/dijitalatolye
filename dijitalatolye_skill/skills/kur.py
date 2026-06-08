import os
import shutil
import sys

def main():
    print("====================================================")
    print("   Antigravity Becerileri Kurulum Sihirbazı (Python)")
    print("====================================================")
    print()
    
    # Hedef dizin (tüm işletim sistemlerinde uyumlu)
    target_dir = os.path.expanduser(os.path.join('~', '.gemini', 'config', 'skills'))
    
    if not os.path.exists(target_dir):
        print(f"Hedef dizin oluşturuluyor: {target_dir}")
        os.makedirs(target_dir, exist_ok=True)
        
    skills = ['oyun-uret', 'kapak-uret', 'ziple', 'oyun-guncelle']
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    success_count = 0
    for skill in skills:
        src = os.path.join(script_dir, skill)
        dst = os.path.join(target_dir, skill)
        
        if not os.path.exists(src):
            print(f"Hata: Kaynak klasör bulunamadı: {src}")
            continue
            
        print(f"{skill} kopyalanıyor...")
        try:
            # Hedefte varsa öncekini temizle
            if os.path.exists(dst):
                if os.path.isdir(dst):
                    shutil.rmtree(dst)
                else:
                    os.remove(dst)
            # Klasörü kopyala
            shutil.copytree(src, dst)
            print(f"-> {skill} başarıyla kuruldu.")
            success_count += 1
        except Exception as e:
            print(f"-> {skill} kopyalanırken hata oluştu: {e}")
            
    print("----------------------------------------------------")
    if success_count == len(skills):
        print("\nKurulum başarıyla tamamlandı!")
        print("IDE'nizi yeniden başlattıktan sonra beceriler yüklenecektir.")
        print("Kullanmak için sohbete direkt 'oyun üret', 'kapak üret', 'ziple' veya 'oyun güncelle' yazabilirsiniz.")
    else:
        print("\nKurulum sırasında bazı hatalar oluştu.")

if __name__ == "__main__":
    main()
