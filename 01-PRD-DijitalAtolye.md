# DijitalAtölye — Product Requirements Document (PRD)

**Doküman Versiyonu:** 1.0
**Hazırlayan:** Veli Keçeci
**Tarih:** Nisan 2026
**Durum:** Taslak

---

## 1. Yönetici Özeti

**DijitalAtölye**, öğretmenlerin hazırladığı HTML tabanlı eğitici oyun, simülasyon ve interaktif içerikleri toplayan, AI destekli moderasyon ve editör onayı süreçlerinden geçirerek öğrencilere ve öğretmenlere yayınlayan bir eğitim teknolojileri (EdTech) platformudur.

Platform, MEB müfredatına uygun (sınıf, ders, kazanım) içerik kataloğu sunar ve "zeka oyunları", "bulmaca", "deney", "simülasyon" gibi serbest etiketlerle ek filtreleme imkânı sağlar.

**Temel değer önerisi:**
- **Öğretmenler için:** İçeriklerini ulusal ölçekte yayınlama, geri bildirim alma, dijital portfolyo oluşturma.
- **Öğrenciler/diğer öğretmenler için:** Müfredata uygun, kalitesi onaylanmış, kazanım odaklı zengin dijital içerik havuzu.
- **MEB/Kurum için:** Merkezi olarak yönetilen, kalite güvencesi sağlanmış, ölçülebilir bir dijital eğitim ekosistemi.

---

## 2. Problem Tanımı

Türkiye'de öğretmenlerin geliştirdiği yüzlerce HTML5 oyunu, simülasyon ve interaktif içerik mevcut; ancak bunlar dağınık platformlarda (kişisel siteler, EBA, sosyal medya) bulunmakta, kalite kontrolünden geçmemekte ve müfredat kazanımlarıyla net bir şekilde eşleştirilememektedir. Bu durum:
- Öğretmenlerin doğru içeriğe ulaşmasını zorlaştırır.
- Düşük kaliteli ya da güvensiz içeriklerin yayılmasına yol açar.
- İçerik üreten öğretmenlerin emeğinin görünür olmasını engeller.

**DijitalAtölye**, bu problemi tek bir merkezi platform, AI destekli ön-moderasyon ve editör onaylı yayın akışı ile çözer.

---

## 3. Hedefler ve Başarı Metrikleri

### 3.1 İş Hedefleri (12 ay)
- 5.000+ aktif öğretmen kullanıcı
- 10.000+ onaylanmış içerik
- 100.000+ aylık aktif kullanıcı (öğrenci + öğretmen)
- AI ön-moderasyon ile editör iş yükünü %60 azaltmak

### 3.2 Başarı Metrikleri (KPI)
| Kategori | Metrik | Hedef |
|----------|--------|-------|
| Büyüme | Aylık aktif kullanıcı (MAU) | 100K |
| İçerik | Yayınlanan içerik sayısı | 10K |
| Kalite | Editör red oranı (AI onayından sonra) | < %15 |
| Performans | İçerik yükleme → AI değerlendirme süresi | < 30 sn |
| Performans | İçerik sayfa açılış süresi (p95) | < 2 sn |
| Memnuniyet | NPS (öğretmen) | > 50 |
| Kullanım | İçerik başına ortalama oynanma | > 50 |

---

## 4. Hedef Kullanıcılar (Persona)

### 4.1 İçerik Üreticisi Öğretmen — "Ayşe"
- 35 yaş, fen bilimleri öğretmeni
- HTML/JavaScript bilgisi orta düzeyde, hazır şablonları ve AI araçlarını kullanır
- Hedefi: Hazırladığı interaktif deney simülasyonlarını öğrencileriyle ve diğer öğretmenlerle paylaşmak

### 4.2 İçerik Tüketicisi Öğretmen — "Mehmet"
- 42 yaş, sınıf öğretmeni
- Teknik bilgisi sınırlı; arama-filtreleme yapıp hazır kullanmak ister
- Hedefi: Bir sonraki ders için "3. sınıf — Hayat Bilgisi — Trafik kuralları" kazanımına uygun aktivite bulmak

### 4.3 Öğrenci — "Elif"
- 12 yaş, ortaokul 6. sınıf
- Telefon/tablet üzerinden içeriklere erişir
- Hedefi: Öğretmenin paylaştığı linke tıklayıp oyunu oynamak (login zorunlu olmamalı)

### 4.4 Editör — "Hakan"
- 38 yaş, MEB tarafından görevlendirilmiş ölçme-değerlendirme uzmanı
- Hedefi: AI ön-moderasyonundan geçmiş içerikleri pedagojik açıdan değerlendirip onaylamak/reddetmek

### 4.5 Platform Yöneticisi — "Zeynep"
- Sistem yöneticisi
- Hedefi: Kullanıcı, rol, kategori, kazanım ve etiket yönetimi; raporlama

---

## 5. Kullanıcı Hikayeleri (User Stories)

### Öğretmen (İçerik Üreticisi)
- US-01: Bir öğretmen olarak, platforma kayıt olabilmek istiyorum, böylece içerik yükleyebilirim.
- US-02: Bir öğretmen olarak, HTML/CSS/JS dosyalarımı (zip olarak veya tek HTML olarak) yükleyebilmek istiyorum.
- US-03: Bir öğretmen olarak, içeriğime sınıf, ders, kazanım ve serbest etiket atayabilmek istiyorum.
- US-04: Bir öğretmen olarak, içeriğimin hangi aşamada (AI moderasyon, editör inceleme, yayınlandı, reddedildi) olduğunu görebilmek istiyorum.
- US-05: Bir öğretmen olarak, içeriğim reddedilirse gerekçesini görmek ve revize edip tekrar gönderebilmek istiyorum.
- US-06: Bir öğretmen olarak, kendi içeriklerimin istatistiklerini (görüntülenme, oynanma, beğeni) görebilmek istiyorum.

### Öğretmen (İçerik Tüketicisi)
- US-07: Bir öğretmen olarak, sınıf-ders-kazanıma göre içerik filtreleyebilmek istiyorum.
- US-08: Bir öğretmen olarak, etiket bazlı (zeka oyunları, bulmaca vb.) içerik bulabilmek istiyorum.
- US-09: Bir öğretmen olarak, içerikleri favorilere ekleyebilmek ve koleksiyonlar oluşturabilmek istiyorum.
- US-10: Bir öğretmen olarak, içerik için doğrudan paylaşılabilir bir link/QR kod alabilmek istiyorum.

### Öğrenci
- US-11: Bir öğrenci olarak, paylaşılan linkle login olmadan içeriği oynayabilmek istiyorum.
- US-12: Bir öğrenci olarak, içeriği mobil cihazda sorunsuz oynayabilmek istiyorum.

### Editör
- US-13: Bir editör olarak, AI'dan geçmiş içerikleri kuyruktan alıp inceleyebilmek istiyorum.
- US-14: Bir editör olarak, içeriği sandbox iframe içinde oynayıp test edebilmek istiyorum.
- US-15: Bir editör olarak, AI değerlendirme raporunu (uygunluk, güvenlik, kazanım eşleşmesi) görebilmek istiyorum.
- US-16: Bir editör olarak, içeriği onaylayabilir, reddedebilir veya öğretmenden revizyon talep edebilmek istiyorum.

### Yönetici
- US-17: Bir yönetici olarak, kullanıcıları ve rolleri yönetebilmek istiyorum.
- US-18: Bir yönetici olarak, MEB kazanım ağacını (sınıf > ders > ünite > kazanım) yönetebilmek istiyorum.
- US-19: Bir yönetici olarak, etiketleri ve kategorileri yönetebilmek istiyorum.
- US-20: Bir yönetici olarak, platform genelinde raporlar (içerik üretim hızı, AI doğruluk oranı, editör performansı) görebilmek istiyorum.

---

## 6. Fonksiyonel Gereksinimler

### 6.1 Kimlik ve Erişim Yönetimi
- E-posta + şifre, Google OAuth, MEB kurumsal e-posta (opsiyonel SSO ileride) ile giriş.
- Roller: `Student`, `Teacher`, `Editor`, `Admin`, `SuperAdmin`.
- JWT tabanlı erişim, refresh token mekanizması.
- E-posta doğrulama; öğretmen rolü için MEB e-postası veya manuel onay.
- 2FA (yöneticiler için zorunlu).

### 6.2 İçerik Yükleme ve Yönetimi
- Yükleme türleri: Tek HTML dosyası, ZIP arşivi (HTML + CSS + JS + asset).
- Maksimum dosya boyutu: 50 MB (yapılandırılabilir).
- Otomatik kontroller (yükleme sırasında):
  - Dosya türü beyaz listesi (.html, .css, .js, .png, .jpg, .svg, .json, .mp3, .mp4, .woff)
  - Antivirüs taraması (ClamAV)
  - Boyut sınırı
  - Manifest.json zorunluluğu (giriş HTML, başlık, açıklama, yazar, sürüm)
- İçeriğe metadata atanması:
  - Sınıf seviyesi (1–12)
  - Ders (Matematik, Türkçe, Fen vb.)
  - Ünite
  - Kazanım kodu (örn. M.5.1.1.1)
  - Serbest etiketler (max 10)
  - Hedef yaş, tahmini süre, zorluk seviyesi
- Versiyonlama: Her revizyon yeni versiyon olarak saklanır; aktif yayın versiyonu işaretlenir.

### 6.3 AI Moderasyon Servisi (Agent)
AI agent, yüklenen her içerik için aşağıdaki kriterleri değerlendirir ve bir **moderasyon raporu** üretir:

**A. Teknik Güvenlik Kontrolleri (Otomatik / Statik Analiz)**
- XSS, eval, document.write, dış kaynaklı script (whitelist dışı CDN) tespiti
- localStorage/sessionStorage kullanım analizi
- iframe / popup / window.open kullanımı
- Çerez ve veri toplama davranışı
- Dış API çağrıları (whitelist kontrolü)

**B. Pedagojik ve İçerik Uygunluğu (LLM tabanlı)**
- Beyan edilen kazanımla içeriğin örtüşme oranı (0–100)
- Hedef yaş grubuna uygunluk
- Dil ve yazım hataları
- Kültürel/etik uygunluk (şiddet, ayrımcılık, dini/siyasi propaganda, reklam içeriği)
- Erişilebilirlik (alt text, kontrast, klavye erişimi)

**C. Kalite Skoru**
- AI agent her içerik için bir genel skor (0–100) ve karar üretir:
  - `AutoApproveCandidate` (skor ≥ 85, kritik bayrak yok) → Editör kuyruğuna "öncelik düşük" olarak gider
  - `NeedsReview` (60 ≤ skor < 85) → Editör kuyruğuna "öncelik orta"
  - `FlaggedForReview` (skor < 60 veya kritik güvenlik bayrağı) → Editör kuyruğuna "öncelik yüksek + uyarılar"
  - `AutoReject` (skor < 30 veya virüs/malware) → Otomatik red, öğretmene gerekçeli geri bildirim

**Human-in-the-loop:** AI hiçbir içeriği tek başına yayına almaz; sadece editör sırasını ve önceliğini belirler.

**LLM Sağlayıcı:** Gemini 1.5 Pro (Türkçe için iyi), DeepSeek veya Claude. Soyutlama katmanı ile değiştirilebilir olmalı.

### 6.4 Editör Onay Akışı
- Editör paneli: AI önceliğine göre sıralanmış kuyruk, filtreleme (ders, sınıf, durum).
- İçeriği `sandboxed iframe` (allow-scripts, allow-same-origin yok) ile önizleme.
- AI raporunu yan panelde gösterme (skor, bayraklar, kazanım eşleşmesi).
- Aksiyonlar: **Onayla**, **Revizyon İste** (yorum zorunlu), **Reddet** (gerekçe zorunlu).
- Onay sonrası içerik `Published` durumuna geçer ve yayın URL'si oluşur.
- Editör performans logları (ortalama inceleme süresi, onay/red oranı).

### 6.5 İçerik Kataloğu ve Filtreleme
- Çok yönlü filtreleme: Sınıf + Ders + Ünite + Kazanım + Etiket + Yazar + Tarih + Süre + Zorluk
- Tam metin arama (başlık, açıklama, etiket) — Elasticsearch
- Sıralama: En yeni, en popüler, en yüksek puanlı, en çok oynanan
- Faceted search (sayaçlı filtreler)
- Önerilen içerikler (benzer kazanım/etiket tabanlı)

### 6.6 Etiketleme (Tagging)
- Sistem tanımlı kategoriler (admin tarafından yönetilir): Zeka Oyunları, Bulmaca, Deney, Simülasyon, Quiz, Hikaye, vb.
- Serbest etiketler: Öğretmen tarafından eklenir (autocomplete, mevcut etiketler önerilir).
- Etiket onayı: Yeni etiketler ilk kullanımda admin onayına düşer.

### 6.7 İçerik Görüntüleme ve Oynatma
- Sandboxed iframe içinde oynatma
- Tam ekran modu
- Mobil uyumlu (responsive)
- "Oynatıldı" eventi (analytics için)
- Sosyal paylaşım butonları, QR kod oluşturma, embed kodu kopyalama

### 6.8 Etkileşim
- Beğeni / favori
- 5 yıldız puanlama (sadece login olmuş öğretmenler)
- Yorum (moderasyonlu)
- "Sınıfımla paylaş" — link veya Google Classroom entegrasyonu (faz 2)

### 6.9 Bildirimler
- E-posta (içerik durumu değişikliği)
- Uygulama içi bildirim
- (Opsiyonel) Web push

### 6.10 Yönetici Paneli
- Kullanıcı yönetimi (CRUD, rol atama, ban)
- Kazanım ağacı yönetimi (CRUD + içe aktarma — MEB JSON)
- Etiket / kategori yönetimi
- Editör atamaları
- Raporlar ve dashboard

---

## 7. Fonksiyonel Olmayan Gereksinimler

### 7.1 Performans
- API yanıt süresi: p95 < 300 ms (CRUD), < 1 sn (arama)
- AI moderasyon süresi: < 30 sn (ortalama), < 60 sn (p95)
- Eşzamanlı kullanıcı: 10.000

### 7.2 Ölçeklenebilirlik
- Yatay ölçeklenebilir mikroservisler (Kubernetes)
- İçerik depolama: object storage (S3 uyumlu, MinIO veya GCS)
- CDN entegrasyonu (içerik dağıtımı için)

### 7.3 Güvenlik
- OWASP Top 10 uyumu
- Tüm trafik HTTPS / TLS 1.3
- Sandboxed iframe (CSP, sandbox attribute)
- Rate limiting (IP ve kullanıcı bazlı)
- WAF (Cloudflare veya Google Cloud Armor)
- KVKK uyumu (öğrenci verisi minimize)

### 7.4 Erişilebilirlik
- WCAG 2.1 AA seviyesi (platform UI'ı için)
- İçerik erişilebilirliği AI tarafından kontrol edilir, editör onayında değerlendirilir

### 7.5 Yerelleştirme
- Birincil dil: Türkçe
- UI'da i18n altyapısı (ileride İngilizce için)

### 7.6 Gözlemlenebilirlik
- Yapılandırılmış loglama (Serilog → Elasticsearch / Loki)
- Metrikler (Prometheus + Grafana)
- Distributed tracing (OpenTelemetry + Jaeger)
- Hata izleme (Sentry)

### 7.7 Yedekleme ve Felaket Kurtarma
- Veritabanı: günlük otomatik yedek (30 gün retention)
- Object storage: cross-region replication
- RTO: 4 saat, RPO: 1 saat

---

## 8. Kapsam Dışı (Out of Scope — V1)

- Mobil native uygulama (responsive web yeterli, V2'de değerlendirilecek)
- İçerik üzerinden ücretli abonelik / ödeme sistemi
- Canlı sınıf yönetimi (LMS özellikleri)
- Yapay zeka ile içerik **üretme** (sadece moderasyon)
- Çoklu kiracılı (multi-tenant) okul yönetimi

---

## 9. Riskler ve Varsayımlar

| Risk | Etki | Olasılık | Önlem |
|------|------|----------|-------|
| AI moderasyon kalitesinin düşük olması | Yüksek | Orta | İlk 3 ay tüm içerikler editör tarafından da incelenir; AI metrikleri ölçülür |
| Kötü amaçlı HTML içerik | Yüksek | Orta | Sandboxing + statik analiz + CSP + antivirüs |
| Editör kapasitesinin yetersiz kalması | Orta | Yüksek | AI önceliklendirme, oto-onay adayları |
| LLM maliyetlerinin patlaması | Orta | Orta | Statik analizleri önce yap, sadece geçenleri LLM'e gönder; cache; küçük model fallback |
| MEB kazanım yapısının değişmesi | Düşük | Orta | Kazanım servisi versiyonlu |

**Varsayımlar:**
- MEB kazanım listesi resmi kaynaktan elde edilebilir (talim ve terbiye kurulu yayınları).
- Hedef kullanıcıların büyük çoğunluğu modern tarayıcı kullanır (Chrome 100+, Safari 15+).

---

## 10. Yol Haritası (Yüksek Seviye)

| Faz | Süre | Çıktı |
|-----|------|-------|
| Faz 0 — Hazırlık | 2 hafta | Repo, CI/CD, mimari kararlar, MVP scope dondurma |
| Faz 1 — Çekirdek | 6 hafta | Identity, User, Content (yükleme), Catalog servisleri + temel UI |
| Faz 2 — Moderasyon | 4 hafta | AI Moderation Servisi + Editör paneli |
| Faz 3 — Yayın & Keşif | 4 hafta | Search, etiket sistemi, içerik oynatma, paylaşım |
| Faz 4 — Beta | 4 hafta | Kapalı beta (50 öğretmen), gözlemleme, iyileştirme |
| Faz 5 — Public Lansman | 2 hafta | Açık lansman, marketing, ölçekleme |

**Toplam tahmini süre (V1):** ~22 hafta (5–6 ay)

---

## 11. Açık Sorular

1. MEB ile resmi bir iş birliği mi, bağımsız bir platform mu olacak?
2. İçerik telifi öğretmende mi kalacak, platformda mı? Lisans (CC-BY-SA) modeli kullanılacak mı?
3. Editörler MEB tarafından mı atanacak, platform mu seçecek?
4. Öğrenci verisi tutulacak mı (oynama geçmişi vb.) yoksa anonim mi kalacak?
5. AI sağlayıcı için bütçe öngörüsü nedir? (Aylık tahmini içerik sayısı x token başına maliyet)
