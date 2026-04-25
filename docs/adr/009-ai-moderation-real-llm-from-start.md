# ADR-009: AI Moderation — Faz 1'den İtibaren Gerçek LLM

- **Durum:** Accepted
- **Tarih:** 2026-04-25
- **Karar veren:** Veli Keçeci

## Bağlam

`03-Todo-List.md` Faz 1'de AI Moderation servisini **mock/stub** olarak yapmayı, gerçek LLM entegrasyonunu Faz 2'ye bırakmayı önerdi. Ancak proje sahibi **baştan gerçek LLM ile başlamayı** tercih etti.

## Karar

Faz 1 sonu vertical slice demosu **gerçek DeepSeek API çağrısı** içerecek. Mock provider sadece **birim testlerde** ve **CI integration testlerinde** kullanılacak (DeepSeek API çağrısı CI'da skipped, lokal `dotnet test --filter Category=LiveLLM` ile tetiklenir).

## Gerekçe

- **Erken validasyon:** PRD'nin en yüksek riskli alanı AI moderasyon kalitesi (PRD §9 Risk #1). Mock ile geçmek bu riski 8 hafta erteler; gerçek API ile baştan ölçeriz.
- **Prompt mühendisliği iterasyonu:** Türkçe yapılandırılmış JSON çıktı için DeepSeek'in nasıl davrandığını Faz 1'de görmek, Faz 2'de tüm Editor UX'i bu çıktıya göre tasarlanırken kritik.
- **Maliyet düşük:** Faz 1 boyunca tahmini test trafiği: 50-100 içerik × 5K input + 1K output token × DeepSeek fiyatı ≈ **$1-3 toplam.** Risk minimal.
- **Soyutlama yine de var:** ADR-006'daki `ILlmProvider` ile mock-test mümkün; production yolunda gerçek provider.

## Sonuçlar

**Olumlu:**
- Faz 1 demosu gerçekçi → erken paydaş feedback'i
- Faz 1 sonunda DeepSeek Türkçe kalitesi netleşir → ADR-006 revize kararı için veri
- LLM maliyet izleme altyapısı (Prometheus metric, Grafana dashboard) Faz 1'de yazılır

**Olumsuz:**
- Faz 1 boyunca DeepSeek API key zorunlu (env: `DEEPSEEK_API_KEY`) → secret yönetimi (Faz 0'da sealed-secrets veya .env.local) → CI'da repository secret
- API rate limit durumunda fallback gerekli → Faz 1'de en azından `IsAvailable` retry mekanizması, Faz 2'de Gemini fallback

## Alternatifler

- **Mock-first (Todo List önerisi):** Daha güvenli ama erken risk doğrulaması yok → reddedildi.
- **Sadece statik analiz V1:** PRD §6.3 LLM-tabanlı pedagojik analiz şart kıldı → reddedildi.
