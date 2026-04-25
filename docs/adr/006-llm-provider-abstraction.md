# ADR-006: LLM Sağlayıcı Soyutlaması — DeepSeek Primary

- **Durum:** Accepted
- **Tarih:** 2026-04-25
- **Karar veren:** Veli Keçeci

## Bağlam

PRD §6.3: AI Moderation servisi içeriği teknik (statik) ve pedagojik (LLM) açıdan değerlendirir. Aylık tahmini içerik: V1 ilk 6 ay için ~500-2000, ortalama 5K input + 1K output token. Soyutlama katmanı şart (PRD §11 Açık Soru #5'te bütçe netleştirilmemiş).

## Karar

**`ILlmProvider` arayüzü** ile çoklu sağlayıcı. **DeepSeek-Chat** primary; `GeminiProvider` ve `ClaudeProvider` fallback olarak hazır.

```csharp
public interface ILlmProvider
{
    string Name { get; }
    Task<LlmResponse> CompleteAsync(LlmRequest request, CancellationToken ct);
    LlmCost EstimateCost(int inputTokens, int outputTokens);
}
```

Konfigürasyonda `AIModeration:Provider` = `deepseek` | `gemini` | `claude`.

## Gerekçe

- **Maliyet:** DeepSeek-V3 input ~$0.14/M, output ~$0.28/M. Gemini 1.5 Pro input ~$1.25/M, output ~$5/M. Claude 3.5 Sonnet ~$3/$15. **DeepSeek Gemini'den ~9x, Claude'dan ~20x ucuz.**
- **Türkçe kalitesi:** DeepSeek-V3 Türkçe yetenekleri V2/V3 itibariyle Gemini'ye yakın seviyede. PRD §6.3 yapılandırılmış JSON çıktı istiyor — DeepSeek bu konuda olgun.
- **Soyutlama yine de zorunlu:** Eğer DeepSeek Türkçe pedagojik kalitesi yetersiz çıkarsa, runtime'da Gemini'ye geçiş 1 config değişikliği.
- **Hibrit strateji (V2):** Statik analiz → ucuz model (DeepSeek), karmaşık edge case → premium model (Gemini/Claude). `IModerationStrategy` ile yönlendir.

## Sonuçlar

**Olumlu:** Düşük V1 LLM bütçesi (~$10-20/ay başlangıç), provider lock-in yok.

**Olumsuz:** Türkçe pedagojik kalite Gemini'den az olabilir → Faz 1 sonunda **20 örnek içerik ile A/B test** ve karar revizyonu (ADR-006b).

**İzleme:**
- Her LLM çağrısı: `provider`, `model`, `input_tokens`, `output_tokens`, `latency_ms`, `cost_usd` → Prometheus + Grafana dashboard.
- Editör red oranı / AI önerisi metriği → ayda bir provider review.

## Alternatifler

- **OpenAI GPT-5:** Kalite üst seviye ama V1 maliyeti yüksek.
- **Mistral / Llama (self-hosted):** GPU sunucu yok V1'de; operasyonel yük.
- **Sadece statik analiz (LLM yok):** Pedagojik kazanım uyumu sorgusu mümkün değil → reddedildi.
- **Mock-first (Faz 1 mock, Faz 2 gerçek LLM):** Erken validasyon kayıp → ADR-009'da reddedildi.
