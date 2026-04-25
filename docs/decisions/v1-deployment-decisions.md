# DijitalAtölye V1 — Lansman Kararları (Onaylandı)

Bu doküman, V1 lansman öncesi onaylanan operasyonel kararları içerir.

## 1. Hosting

**Karar**: Sunucu sağlayıcı seçimi ertelendi. **V1 lokal/staging'e kadar
docker-compose ile devam.** K3s ve Helm template'leri hazır (`deploy/`),
sağlayıcı seçildiğinde Ansible playbook'u ile cluster ayağa kaldırılacak.

Aday sağlayıcılar (kapalı beta önce karar gerekiyor):
- Hetzner Cloud — en uygun fiyat (~70€/ay)
- UpCloud — daha iyi network (~120$/ay)
- TurkTelekom/TurkCell — KVKK için yurt-içi avantajı (~150-300$/ay)

## 2. Domain

**Karar**: Domain kayıtlı, DNS bilgileri kullanıcıdan alınacak.

Beklenen subdomain'ler: `app`, `api`, `cdn`, `status`, `sentry`, `grafana`.

## 3. AI Bütçesi

**Karar**: DeepSeek için **bütçe limiti yok**, kullanıma göre belirlenecek.
İlk 30 gün maliyet izleme dashboard'u (Grafana) kurulacak; aylık $300'ü
geçerse uyarı.

DijitalAtölye `LlmProviderOptions:CostCapUsdPerDay` ayarı ile gün başına
emniyet limiti getirebilir (şu an opsiyonel, set edilmemiş).

## 4. SMTP

**Karar**: **Brevo (Sendinblue)**.

- Free tier: 300 mail/gün (kapalı beta için yeterli)
- Production: $25/ay 20.000 mail
- Konfigürasyon: `Notification.API/appsettings.json` içinde Brevo SMTP relay
  default. Credential `SMTP__USERNAME` / `SMTP__PASSWORD` env var ile geçilir.

## 5. Hata İzleme

**Karar**: **Self-hosted Sentry**.

- Kurulum talimatları: `docs/runbooks/self-hosted-sentry.md`
- Tüm .NET servisleri `SENTRY_DSN` env var'ı set edildiğinde otomatik
  bağlanır (`HostBuilderExtensions.ConfigureSentry`).
- Lokalde DSN boş, Sentry devre dışı.

## 6. PRD Açık Soruları

**Karar**: V1 için varsayılanlar yeterli. Aşağıdaki konular **V1.1
backlog**'una taşındı:
- MEB resmi iş birliği / kurumsal sözleşme
- Telif hakkı / lisans politikası (CC-BY varsayılan)
- Editor onboarding ve maaş/ücret yapısı
- Öğrenci verisi toplama (V1'de toplanmıyor; sadece öğretmen)
- Kurumsal bütçe modeli
