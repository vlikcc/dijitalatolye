# ADR-003: API Gateway — YARP

- **Durum:** Accepted
- **Tarih:** 2026-04-25
- **Karar veren:** Veli Keçeci

## Bağlam

Frontend istemcileri tek noktadan backend'e bağlanmalı; routing, JWT validation, rate limiting, CORS merkezi yönetilmeli. .NET 10 ekosistemi ile uyumlu olmalı.

## Karar

**YARP (Yet Another Reverse Proxy)** — Microsoft tarafından geliştirilen, .NET tabanlı modern reverse proxy.

## Gerekçe

- **.NET 10 native:** Ekipte .NET 10 bilgisi var; aynı runtime, aynı middleware, aynı OpenTelemetry/Serilog setup'ı.
- **Esnek routing:** path-based, header-based, weighted, A/B testing.
- **Yerleşik özellikler:** rate limiting (`Microsoft.AspNetCore.RateLimiting`), CORS, response caching, session affinity.
- **Aktif geliştirme:** Microsoft destekli, Azure içinde kullanılıyor.
- **BFF pattern:** İstemci özel agregasyonlar gerektiğinde minimal API ile aynı projede yazılabilir.

## Sonuçlar

**Olumlu:** Tek dil, tek stack, kolay debug, tek geliştiricinin operasyonel yükünü azaltır.

**Olumsuz:** Kong/Envoy gibi olgun gateway'lerin (ör: WAF rule'ları, plugin marketplace) zenginliğine sahip değil → WAF için Cloudflare edge'de kullanılacak.

## Alternatifler

- **Kong / Tyk:** Daha zengin plugin ekosistemi ama ayrı runtime (Lua / Go), ekipte deneyim yok.
- **Envoy + Istio:** K8s service mesh ile entegre; ancak V1'de service mesh yok (operasyonel yük), V2'de değerlendirilebilir.
- **Ocelot:** .NET ama proje aktivitesi düşmüş, YARP onu superseded ediyor.
- **NGINX + Lua:** Hızlı ama .NET ekosistemiyle entegrasyonu zayıf.
