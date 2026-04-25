# ADR-001: Mikroservis Sınırları

- **Durum:** Accepted
- **Tarih:** 2026-04-25
- **Karar veren:** Veli Keçeci

## Bağlam

PRD'deki kullanıcı hikayeleri (US-01..US-20) ve fonksiyonel gereksinimler (§6.1..§6.10) farklı bağlamlardaki sorumlulukları içeriyor: kimlik, kullanıcı profili, içerik yönetimi, kazanım kataloğu, AI moderasyon, editör akışı, arama, bildirim, analitik, dosya depolama. Tek monolit ile başlamak hızlı olur ama ölçek hedefi (10K eşzamanlı kullanıcı, 100K MAU) ve farklı teknoloji ihtiyaçları (Elasticsearch, MongoDB, ClickHouse) sınır çizmeyi gerektiriyor.

## Karar

V1'de **10 mikroservis** olarak başlıyoruz; her servis kendi domain'inde otonom:

1. **Identity** — kimlik doğrulama, JWT
2. **User** — profil, öğretmen doğrulama, favori
3. **Content** — içerik yükleme, versiyonlama, durum makinesi
4. **Catalog** — sınıf/ders/ünite/kazanım/etiket
5. **Storage** — MinIO/GCS soyutlama, presigned URL, ClamAV
6. **AIModeration** — statik analiz + LLM analizi
7. **Review** — editör kuyruk + karar
8. **Notification** — e-posta + in-app
9. **Search** — Elasticsearch projeksiyonu
10. **Analytics** — view/play telemetrisi

Servisler arası iletişim **asenkron event-driven** (RabbitMQ); senkron çağrı sadece zorunluysa (örn. presigned URL üretimi için Storage'a HTTP).

## Gerekçe

- Sınırlar PRD'deki context'leri yansıtıyor: her servisin farklı veri modeli, farklı SLA, farklı ölçekleme profili var.
- AI Moderation servisi izole olunca LLM maliyeti ve performansı net izlenebilir; provider değişimi diğer servisleri etkilemez.
- Search servisi izole olunca Elasticsearch'ün ayrı yaşam döngüsü (reindex, mapping change) yönetilebilir.
- Storage servisi soyutlandığında MinIO ↔ GCS ↔ S3 geçişi tek noktadan.

## Sonuçlar

**Olumlu:**
- Bağımsız deploy, bağımsız ölçekleme
- Teknoloji seçim özgürlüğü (MongoDB AI için, Elasticsearch search için)
- Audit / observability sınırları net

**Olumsuz:**
- 10 servis tek geliştirici için yorucu — Faz 1'de **vertical slice** yaklaşımı (Identity + Content + AI + Frontend) ile başla, diğerlerini sırayla ekle
- Eventual consistency kompleksitesi (Saga, Outbox pattern zorunlu)
- Operasyonel yük (10 chart, 10 deployment, 10 alarm seti) — Helm template şablonu ile azaltılır

## Alternatifler

- **Modüler monolit (.NET 10 single deployment, modül sınırları):** Hızlı başlangıç, ama PRD'nin AI moderasyon ve search bölümlerinin farklı ölçekleme/data ihtiyaçları monoliti zorlardı. V0/PoC için olabilirdi ama V1 için reddedildi.
- **3-4 servis (kurslar, içerik, kullanıcı, ai):** Ortayol; ancak Search ve Analytics gibi farklı data store gerektiren parçaların aynı servise sıkıştırılması teknolojik olarak ters.
