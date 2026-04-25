# ADR-002: Mesaj Broker — RabbitMQ + MassTransit

- **Durum:** Accepted
- **Tarih:** 2026-04-25
- **Karar veren:** Veli Keçeci

## Bağlam

ADR-001'deki event-driven mimari için bir mesaj broker'a ihtiyaç var. Beklenen event hacmi V1'de düşük (içerik başına ~5-10 event, günde tahmini ≤ 10K event). Saga pattern (içerik yayın akışı) ve Outbox pattern desteği gerekli.

## Karar

**RabbitMQ 3.13+** + **MassTransit 8** kullanılacak. Topic exchange + per-service queue. Event şeması **CloudEvents 1.0** zarfı içinde JSON olarak.

## Gerekçe

- **MassTransit:** .NET için en olgun mesajlaşma kütüphanesi. Saga state machine, Outbox, retry/redelivery, scheduled message, conventions out-of-the-box.
- **RabbitMQ:** V1 hacmi için fazlasıyla yeterli. Operasyonu basit (tek node ile başla, ileride cluster), management UI mükemmel, K8s operator'ı hazır.
- **CloudEvents:** Vendor-neutral şema; ileride Kafka'ya geçiş veya GCP Pub/Sub bridge daha kolay.

## Sonuçlar

**Olumlu:** Hızlı başlangıç, düşük operasyonel yük, MassTransit'in geniş ekosistemi (testharness, monitoring).

**Olumsuz:** Yüksek event hacminde (>50K/sn) Kafka'ya geçiş gerekebilir → V2 değerlendirmesi (ADR-002b).

## Alternatifler

- **Apache Kafka:** Yüksek throughput, log-based, replay imkanı. Ancak V1 için overkill, operasyonel yük yüksek (Zookeeper veya KRaft mode bile karmaşık), MassTransit Kafka transport hâlâ RabbitMQ kadar olgun değil.
- **Azure Service Bus / GCP Pub/Sub:** Managed, kolay; ama self-hosted kararı (ADR-008) ile çelişir.
- **NATS / NATS JetStream:** Hafif, hızlı; ancak .NET ekosistemi RabbitMQ kadar zengin değil.
- **Redis Streams:** Hafif, mevcut Redis ile reuse; ama saga / outbox için yetersiz.
