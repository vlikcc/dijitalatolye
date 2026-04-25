using System.Reflection;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DijitalAtolye.BuildingBlocks.EventBus.Configuration;

public static class MassTransitConfigurationExtensions
{
    /// <summary>
    /// MassTransit + RabbitMQ entegrasyonunu yapılandırır.
    /// Çağıran servis kendi consumer'larını <paramref name="consumerAssemblies"/> içinden register eder.
    /// </summary>
    public static IServiceCollection AddDijitalAtolyeEventBus(
        this IServiceCollection services,
        IConfiguration configuration,
        string serviceName,
        Action<IBusRegistrationConfigurator>? configureBus = null,
        params Assembly[] consumerAssemblies)
    {
        var rabbit = configuration.GetSection("RabbitMq").Get<RabbitMqOptions>()
            ?? throw new InvalidOperationException("RabbitMq configuration section is missing.");

        services.AddMassTransit(busConfigurator =>
        {
            busConfigurator.SetKebabCaseEndpointNameFormatter();

            if (consumerAssemblies.Length > 0)
            {
                busConfigurator.AddConsumers(consumerAssemblies);
            }

            configureBus?.Invoke(busConfigurator);

            busConfigurator.UsingRabbitMq((context, cfg) =>
            {
                cfg.Host(rabbit.Host, rabbit.Port, rabbit.VirtualHost, host =>
                {
                    host.Username(rabbit.Username);
                    host.Password(rabbit.Password);
                });

                cfg.MessageTopology.SetEntityNameFormatter(new KebabCaseEntityNameFormatter());

                cfg.UseMessageRetry(retry =>
                {
                    retry.Exponential(
                        retryLimit: 5,
                        minInterval: TimeSpan.FromSeconds(1),
                        maxInterval: TimeSpan.FromMinutes(2),
                        intervalDelta: TimeSpan.FromSeconds(5));
                });

                cfg.UseInMemoryOutbox(context);

                cfg.ConfigureEndpoints(context);
            });
        });

        return services;
    }
}

public sealed class RabbitMqOptions
{
    public string Host { get; init; } = "localhost";
    public ushort Port { get; init; } = 5672;
    public string VirtualHost { get; init; } = "/";
    public string Username { get; init; } = "guest";
    public string Password { get; init; } = "guest";
}

internal sealed class KebabCaseEntityNameFormatter : IEntityNameFormatter
{
    public string FormatEntityName<T>() => typeof(T).Name
        .Replace("V1", string.Empty, StringComparison.Ordinal)
        .Replace("V2", string.Empty, StringComparison.Ordinal)
        .ToKebabCase();
}

file static class StringExtensions
{
    public static string ToKebabCase(this string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return value;
        }

        var sb = new System.Text.StringBuilder();
        for (var i = 0; i < value.Length; i++)
        {
            var c = value[i];
            if (char.IsUpper(c) && i > 0)
            {
                sb.Append('-');
            }
            sb.Append(char.ToLowerInvariant(c));
        }
        return sb.ToString();
    }
}
