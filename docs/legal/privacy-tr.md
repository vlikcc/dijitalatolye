# Gizlilik Politikası ve KVKK Aydınlatma Metni (Taslak)

> Bu metin V1 lansmanı için taslak niteliğindedir. Hukuki incelemeden geçmeden
> üretime alınmamalıdır.

## 1. Veri Sorumlusu

DijitalAtölye platformu (bundan sonra "Platform") aşağıda belirtilen kişisel
verileri 6698 sayılı KVKK kapsamında işlemektedir. Veri sorumlusu Platformun
yasal sahibidir.

İletişim: `kvkk@dijitalatolye.org`

## 2. İşlenen Kişisel Veriler

| Kategori | Veri | Toplama Yöntemi | Saklama Süresi |
|----------|------|------------------|----------------|
| Kimlik   | Ad, soyad, e-posta | Kayıt formu | Hesap aktif olduğu sürece |
| İletişim | E-posta, opsiyonel telefon | Profil ayarları | Hesap aktif |
| Mesleki  | Branş, okul, MEB doğrulama maili | Öğretmen doğrulama | Hesap aktif |
| Çevrimiçi tanımlayıcı | IP, user-agent, oturum logları | Otomatik | 12 ay |
| İçerik | Yüklenen ders materyalleri, yorumlar | Kullanıcıdan | Yayından kaldırılana kadar |

## 3. İşleme Amaçları

- Kullanıcı kimliğini doğrulamak ve oturum yönetimi
- Öğretmen kimliğini doğrulamak (MEB e-postası veya manuel inceleme)
- İçerik moderasyonu (AI ve insan editör)
- Sistem güvenliği ve kötüye kullanımın engellenmesi
- Kullanım analitikleri (anonimleştirilmiş)

## 4. Aktarım

Veriler yurt içinde tutulan sunucularda işlenir. AI moderasyon için içerik
metinleri DeepSeek (Çin) ve yedek olarak Google Gemini (AB) API'lerine
gönderilir. Bu aktarım açık rıza üzerinedir; aktarılan veri ders materyalinin
metnidir, kullanıcı kimliği aktarılmaz.

## 5. Veri Sahibinin Hakları

KVKK md. 11 uyarınca kullanıcı:
- Verilerine erişim ve kopya talebi (Platform içi `/kvkk` sayfasından)
- Yanlış işlenen verilerin düzeltilmesi
- Anonimleştirme veya silme (Platform içi `/kvkk` sayfasından)
- KVKK'ya şikayet hakkı

## 6. Çerezler

Platform yalnızca işlevsel çerezler kullanır (oturum, dil tercihi). Üçüncü
taraf izleme çerezi kullanılmaz.

## 7. Güvenlik Tedbirleri

- TLS 1.3, HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- Tüm parolalar bcrypt ile hashlenir
- Erişim logları audit veritabanında 12 ay saklanır
- Düzenli yedekleme ve felaket kurtarma planı
- KVKK ihlali durumunda 72 saat içinde bildirim
