using Microsoft.AspNetCore.Builder;
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

        return builder;
    }

    public static WebApplication UseDijitalAtolyeServiceDefaults(this WebApplication app)
    {
        app.UseSerilogRequestLogging();

        if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("staging"))
        {
            app.MapOpenApi();
        }

        app.UseExceptionHandler();
        app.UseStatusCodePages();

        app.UseDijitalAtolyeSecurityHeaders();

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
