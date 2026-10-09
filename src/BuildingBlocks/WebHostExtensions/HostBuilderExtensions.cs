using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Sentry.AspNetCore;
using Serilog;
using Serilog.Context;
using Serilog.Events;

namespace DijitalAtolye.BuildingBlocks.WebHostExtensions;

/// <summary>
/// Tüm DijitalAtolye servisleri için ortak host setup'ı.
/// Kullanım:
/// <code>
/// var builder = WebApplication.CreateBuilder(args);
/// builder.AddDijitalAtolyeServiceDefaults("identity");
/// // ... service-specific registrations
/// var app = builder.Build();
/// app.UseDijitalAtolyeServiceDefaults();
/// </code>
/// </summary>
public static class HostBuilderExtensions
{
    public static WebApplicationBuilder AddDijitalAtolyeServiceDefaults(
        this WebApplicationBuilder builder,
        string serviceName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceName);

        builder.Configuration.AddEnvironmentVariables();

        ConfigureSerilog(builder, serviceName);
        ConfigureOpenTelemetry(builder, serviceName);
        ConfigureSentry(builder, serviceName);

        builder.Services.AddHttpContextAccessor();
        builder.Services.AddProblemDetails();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer((document, _, _) =>
            {
                document.Info.Title = $"DijitalAtolye {serviceName} API";
                document.Info.Version = "v1";
                return Task.CompletedTask;
            });
        });
        builder.Services.AddHealthChecks();
        builder.Services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });
        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            // Yalnızca iç ağdaki proxy'lere (Caddy, gateway, nginx — Docker/K8s private aralıkları) güven.
            // X-Forwarded-Host bilinçli olarak işlenmez: Caddy Host'u zaten korur.
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = 2;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
            foreach (var cidr in new[] { "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8", "::1/128", "fc00::/7" })
            {
                options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(cidr));
            }
        });

        return builder;
    }

    public static WebApplication UseDijitalAtolyeServiceDefaults(this WebApplication app)
    {
        // Request log'ları gerçek istemci IP'sini görsün diye ilk sırada.
        app.UseForwardedHeaders();
        app.UseSerilogRequestLogging();
        app.Use(CorrelationIdMiddleware);

        if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("staging"))
        {
            app.MapOpenApi();
        }

        app.UseExceptionHandler();
        app.UseStatusCodePages();

        app.UseDijitalAtolyeSecurityHeaders();

        app.MapPrometheusScrapingEndpoint("/metrics");

        app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
        {
            Predicate = _ => false,
            ResponseWriter = HealthCheckResponseWriter.WriteResponse,
        });

        app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
        {
            ResponseWriter = HealthCheckResponseWriter.WriteResponse,
        });

        return app;
    }

    private static void ConfigureSerilog(WebApplicationBuilder builder, string serviceName)
    {
        var otlpEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"];

        builder.Host.UseSerilog((ctx, sp, lc) =>
        {
            lc
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
                .MinimumLevel.Override("MassTransit", LogEventLevel.Warning)
                .Enrich.FromLogContext()
                .Enrich.WithMachineName()
                .Enrich.WithProperty("service", serviceName)
                .Enrich.WithProperty("environment", ctx.HostingEnvironment.EnvironmentName)
                .WriteTo.Console(outputTemplate:
                    "[{Timestamp:HH:mm:ss} {Level:u3}] {service} {Message:lj} {Properties:j}{NewLine}{Exception}");

            // Seviyeler ortamdan ayarlanabilir, ör. Serilog__MinimumLevel__Default=Debug
            // veya Serilog__MinimumLevel__Override__MassTransit=Information.
            lc.ReadFrom.Configuration(ctx.Configuration);

            if (!string.IsNullOrWhiteSpace(otlpEndpoint))
            {
                lc.WriteTo.OpenTelemetry(opts =>
                {
                    opts.Endpoint = otlpEndpoint;
                    opts.ResourceAttributes = new Dictionary<string, object>
                    {
                        ["service.name"] = serviceName,
                        ["service.namespace"] = "dijitalatolye",
                    };
                });
            }
        });
    }

    private static void ConfigureOpenTelemetry(WebApplicationBuilder builder, string serviceName)
    {
        var otlpEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"];

        builder.Services.AddOpenTelemetry()
            .ConfigureResource(r => r
                .AddService(serviceName: serviceName, serviceNamespace: "dijitalatolye")
                .AddAttributes([new KeyValuePair<string, object>("deployment.environment", builder.Environment.EnvironmentName)]))
            .WithMetrics(m =>
            {
                m.AddAspNetCoreInstrumentation();
                m.AddHttpClientInstrumentation();
                m.AddRuntimeInstrumentation();
                m.AddMeter("DijitalAtolye.*");
                m.AddPrometheusExporter();
                if (!string.IsNullOrWhiteSpace(otlpEndpoint))
                {
                    m.AddOtlpExporter(opt => opt.Endpoint = new Uri(otlpEndpoint));
                }
            })
            .WithTracing(t =>
            {
                t.AddAspNetCoreInstrumentation(o => o.RecordException = true);
                t.AddHttpClientInstrumentation();
                t.AddSource("MassTransit");
                if (!string.IsNullOrWhiteSpace(otlpEndpoint))
                {
                    t.AddOtlpExporter(opt => opt.Endpoint = new Uri(otlpEndpoint));
                }
            });
    }

    private static async Task CorrelationIdMiddleware(HttpContext context, Func<Task> next)
    {
        var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
            ?? Guid.NewGuid().ToString("N");
        context.Response.Headers["X-Correlation-Id"] = correlationId;
        using (LogContext.PushProperty("correlationId", correlationId))
        {
            await next();
        }
    }

    private static void ConfigureSentry(WebApplicationBuilder builder, string serviceName)
    {
        var dsn = builder.Configuration["SENTRY_DSN"];
        if (string.IsNullOrWhiteSpace(dsn))
        {
            return;
        }

        builder.Services.AddSentry();
        builder.Services.Configure<SentryAspNetCoreOptions>(opts =>
        {
            opts.Dsn = dsn;
            opts.Environment = builder.Configuration["SENTRY_ENVIRONMENT"] ?? builder.Environment.EnvironmentName;
            opts.Release = $"{serviceName}@{typeof(HostBuilderExtensions).Assembly.GetName().Version}";
            opts.MinimumEventLevel = LogLevel.Warning;
            opts.SendDefaultPii = false;
            opts.AttachStacktrace = true;
            opts.TracesSampleRate = builder.Environment.IsProduction() ? 0.1 : 1.0;
        });
    }
}
