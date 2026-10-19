using Microsoft.Extensions.Http.Resilience;

namespace DijitalAtolye.AIModeration.API.Llm;

public static class LlmServiceCollectionExtensions
{
    /// <summary>Moderasyon LLM sağlayıcısını <c>Llm:Provider</c> ayarına göre (evren | deepseek) kaydeder.</summary>
    public static IServiceCollection AddModerationLlm(this IServiceCollection services, IConfiguration configuration)
    {
        var section = configuration.GetSection("Llm");
        services.Configure<LlmProviderOptions>(section);
        var options = section.Get<LlmProviderOptions>() ?? new LlmProviderOptions();

        if (options.UsesEvren)
        {
            // Model yedeklemesini EvrenProvider yapar. Tam moderasyon prompt'u EVREN'de 25-85 sn sürebildiğinden
            // deneme süresi geniş; toplam süre tek denemeye izin verir, tekrar yalnızca hızlı 5xx'lerde olur.
            services.AddHttpClient<ILlmProvider, EvrenProvider>()
                .AddStandardResilienceHandler(o =>
                {
                    o.Retry.MaxRetryAttempts = 1;
                    o.AttemptTimeout.Timeout = TimeSpan.FromSeconds(120);
                    o.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(150);
                    o.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(300);
                });
        }
        else
        {
            services.AddHttpClient<ILlmProvider, DeepSeekProvider>()
                .AddStandardResilienceHandler(o =>
                {
                    o.Retry.MaxRetryAttempts = 3;
                    o.AttemptTimeout.Timeout = TimeSpan.FromSeconds(60);
                    o.TotalRequestTimeout.Timeout = TimeSpan.FromMinutes(3);
                    o.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(120);
                });
        }
        return services;
    }
}
