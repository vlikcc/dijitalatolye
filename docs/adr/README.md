# Architecture Decision Records (ADR)

Bu klasör DijitalAtölye için alınan mimari kararların gerekçeli kayıtlarını içerir. [Michael Nygard'ın ADR formatı](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) takip edilir.

## Format

Her ADR `NNNN-short-title.md` adıyla kaydedilir ve şu bölümleri içerir:

```
# ADR-NNNN: Başlık

- **Durum:** Proposed | Accepted | Deprecated | Superseded by ADR-XXXX
- **Tarih:** YYYY-MM-DD
- **Karar veren:** İsim(ler)

## Bağlam
Hangi problem? Hangi kısıtlar?

## Karar
Ne yapmaya karar verdik?

## Gerekçe
Neden bu seçim? Hangi alternatifler değerlendirildi?

## Sonuçlar
Olumlu / olumsuz etkiler. Neye dikkat etmeliyiz?

## Alternatifler
- A: ...
- B: ...
```

## Liste

| # | Başlık | Durum |
|---|--------|-------|
| [001](001-microservice-boundaries.md) | Mikroservis sınırları | Accepted |
| [002](002-message-broker-rabbitmq.md) | Mesaj broker — RabbitMQ + MassTransit | Accepted |
| [003](003-api-gateway-yarp.md) | API Gateway — YARP | Accepted |
| [004](004-auth-openiddict.md) | Auth — OpenIddict | Accepted |
| [005](005-database-per-service.md) | Database per service | Accepted |
| [006](006-llm-provider-abstraction.md) | LLM sağlayıcı soyutlaması — DeepSeek primary | Accepted |
| [007](007-monorepo.md) | Mono-repo (V1) | Accepted |
| [008](008-self-hosted-k3s.md) | Self-hosted K3s + VPS | Accepted |
| [009](009-ai-moderation-real-llm-from-start.md) | AI Moderation gerçek LLM ile başla | Accepted |
| [010](010-content-license-tbd.md) | İçerik telif modeli | Proposed (bekleniyor) |
