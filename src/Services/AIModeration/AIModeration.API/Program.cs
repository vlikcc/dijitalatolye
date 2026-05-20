using DijitalAtolye.AIModeration.API.Consumers;
using DijitalAtolye.AIModeration.API.Health;
using DijitalAtolye.AIModeration.API.Endpoints;
using DijitalAtolye.AIModeration.API.Llm;
using DijitalAtolye.AIModeration.API.Persistence;
using DijitalAtolye.AIModeration.API.Pipeline;
using DijitalAtolye.AIModeration.API.StaticAnalysis;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Configuration;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using Microsoft.Extensions.Http.Resilience;
using Minio;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

// Mongo Guid'leri Standard formatta (UUID v4) saklamak için global serializer kaydı
try { BsonSerializer.TryRegisterSerializer(new GuidSerializer(GuidRepresentation.Standard)); } catch { }

builder.AddDijitalAtolyeServiceDefaults("aimoderation");

// MongoDB
builder.Services.AddSingleton<IMongoClient>(_ =>
    new MongoClient(builder.Configuration.GetConnectionString("Mongo")
        ?? throw new InvalidOperationException("Mongo connection string missing.")));
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(builder.Configuration["Mongo:Database"] ?? "ai_moderation"));
builder.Services.AddSingleton<IModerationReportStore, MongoModerationReportStore>();

// MinIO
var minio = builder.Configuration.GetSection("Minio");
builder.Services.AddMinio(c => c
    .WithEndpoint(minio["Endpoint"] ?? "localhost:9000")
    .WithCredentials(minio["AccessKey"]!, minio["SecretKey"]!)
    .WithSSL(bool.Parse(minio["UseSsl"] ?? "false"))
    .Build());

// LLM
builder.Services.Configure<LlmProviderOptions>(builder.Configuration.GetSection("Llm"));
builder.Services.AddHttpClient<ILlmProvider, DeepSeekProvider>()
    .AddStandardResilienceHandler(o =>
    {
        o.Retry.MaxRetryAttempts = 3;
        o.AttemptTimeout.Timeout = TimeSpan.FromSeconds(60);
        o.TotalRequestTimeout.Timeout = TimeSpan.FromMinutes(3);
        o.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(120);
    });

builder.Services.AddSingleton<IStaticAnalyzer, HtmlJsStaticAnalyzer>();
builder.Services.AddScoped<ModerationPipeline>();

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);

builder.Services.AddDijitalAtolyeEventBus(
    builder.Configuration,
    serviceName: "aimoderation",
    configureBus: null,
    typeof(ContentSubmittedConsumer).Assembly);

builder.Services.AddHealthChecks()
    .AddCheck<MongoHealthCheck>("mongodb", tags: ["ready"]);

var app = builder.Build();
app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();
app.MapModerationEndpoints();
app.Run();
