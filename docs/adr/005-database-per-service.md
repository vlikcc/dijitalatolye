# ADR-005: Database per Service

- **Durum:** Accepted
- **Tarih:** 2026-04-25
- **Karar veren:** Veli Keçeci

## Bağlam

ADR-001 ile servisleri ayırdık. Mikroservis prensibi gereği her servis kendi verisinin sahibi olmalı; başka servis doğrudan başka servisin DB'sine erişmemeli.

## Karar

Her servis kendi schema'sına sahip. V1'de **mantıksal ayrım** (aynı PostgreSQL cluster, farklı database) ile başla; trafik ve izolasyon ihtiyacı arttıkça **fiziksel ayrım** (ayrı cluster) yap.

| Servis | DB | Gerekçe |
|--------|----|---------|
| Identity, User, Catalog, Content, Review, Notification, Analytics-collector | PostgreSQL 17 | İlişkisel, ACID, EF Core olgun |
| AIModeration | MongoDB 7 | Esnek/sürekli değişen rapor şeması |
| Search | Elasticsearch 9 | Tam metin + facet + Türkçe analyzer |
| Analytics-aggregate | TimescaleDB (PostgreSQL extension) | Zaman serisi, V1 hacmi için yeterli |
| Cache (oturum, kazanım ağacı) | Redis 7 | Düşük latency |
| Object storage | MinIO (self-hosted) | Dosya, varlık |

## Gerekçe

- **Tutarlılık modeli per servis:** Strong consistency servis içinde, eventual consistency servisler arası (event-driven).
- **Migration izolasyonu:** Her servisin kendi `Infrastructure` projesinde EF Core migration; deploy bağımsız.
- **Teknoloji uyumu:** AI raporu schema'sı haftalık değişebilir → MongoDB. Search Elasticsearch'siz yapılmaz. PostgreSQL gerisi için mükemmel.
- **TimescaleDB tercihi (ClickHouse yerine):** V1 hacmi için TimescaleDB ekstrası yeterli; ekstra PostgreSQL bilgisini yeniden kullanırız. ClickHouse V2'de değerlendirilebilir.

## Sonuçlar

**Olumlu:** Her servis bağımsız evrim, deploy, ölçek.

**Olumsuz:** Cross-service join yok → projeksiyon (Search), aggregate (Analytics) için event consumer'lar gerekli. Backup/restore stratejisi 4 farklı engine için ayrı tasarlanmalı.

## Alternatifler

- **Tek monolit DB:** Hızlı başlangıç ama V1 hedeflerinde mikroservis ayrımını çözmek imkansızlaşır → reddedildi.
- **Sadece PostgreSQL:** Search'ü `pg_trgm` + tsvector ile yapabilir miyiz? V1 başlangıç için tartışılır ama Türkçe analyzer ve facet performansı Elasticsearch kadar iyi değil; ayrıca PRD §6.5 facet sayaçları gerektiriyor → Elasticsearch tercih edildi.
- **CockroachDB / YugabyteDB:** Distributed SQL, aşırı kompleks V1 için.
