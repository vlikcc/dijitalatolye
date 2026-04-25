using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Configuration;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using DijitalAtolye.Search.API.Consumers;
using DijitalAtolye.Search.API.Endpoints;
using DijitalAtolye.Search.API.Index;
using Elastic.Clients.Elasticsearch;
using Elastic.Transport;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("search");

var esUri = new Uri(builder.Configuration["Elasticsearch:Uri"] ?? "http://localhost:9200");
var settings = new ElasticsearchClientSettings(esUri).DefaultIndex(ElasticSearchIndexer.IndexName);
builder.Services.AddSingleton(new ElasticsearchClient(settings));
builder.Services.AddSingleton<ISearchIndexer, ElasticSearchIndexer>();

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);
builder.Services.AddAuthorization();

builder.Services.AddDijitalAtolyeEventBus(
    builder.Configuration,
    serviceName: "search",
    configureBus: null,
    typeof(ContentPublishedSearchConsumer).Assembly);

var app = builder.Build();

app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();

app.MapSearchEndpoints();

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    using var scope = app.Services.CreateScope();
    var indexer = scope.ServiceProvider.GetRequiredService<ISearchIndexer>();
    try
    {
        await indexer.EnsureIndexAsync().ConfigureAwait(false);
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Elasticsearch unavailable; search index'i atlanıyor.");
    }
}

await app.RunAsync().ConfigureAwait(false);
