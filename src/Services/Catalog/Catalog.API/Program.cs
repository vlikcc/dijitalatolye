using System.Text.Json;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.Common;
using DijitalAtolye.BuildingBlocks.WebHostExtensions;
using DijitalAtolye.Catalog.API.Endpoints;
using DijitalAtolye.Catalog.API.Import;
using DijitalAtolye.Catalog.API.Persistence;
using DijitalAtolye.Catalog.API.Seed;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddDijitalAtolyeServiceDefaults("catalog");

builder.Services.AddDbContext<CatalogDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")
        ?? throw new InvalidOperationException("Postgres connection string missing.")));

builder.Services.AddStackExchangeRedisCache(opts =>
{
    opts.Configuration = builder.Configuration.GetConnectionString("Redis");
    opts.InstanceName = "dijitalatolye:catalog:";
});

builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddScoped<MebCatalogImporter>();
builder.Services.AddDijitalAtolyeJwtAuth(builder.Configuration);

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Postgres")!, tags: ["ready"])
    .AddRedis(builder.Configuration.GetConnectionString("Redis")!, tags: ["ready"]);

var app = builder.Build();

app.UseDijitalAtolyeServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();
app.MapCatalogEndpoints();

if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
    await db.EnsureSchemaAsync();
    // Outcome.Description varchar(1000) -> text (bazı MEB kazanımları 1000 karakteri aşıyor). Idempotent.
    await db.Database.ExecuteSqlRawAsync(
        """ALTER TABLE catalog."Outcomes" ALTER COLUMN "Description" TYPE text;""");
    await CatalogSeeder.SeedAsync(db);

    // MEB kazanım setini Excel'den üretilmiş bundled JSON'dan içe aktar (idempotent).
    // Guard: katalog zaten doluysa her boot'ta ~3700 sorgu yapma.
    var seedFile = Path.Combine(app.Environment.ContentRootPath, "Seed", "meb-outcomes.json");
    if (File.Exists(seedFile))
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("CatalogImport");
        try
        {
            var json = await File.ReadAllTextAsync(seedFile);
            var rows = JsonSerializer.Deserialize<List<DijitalAtolye.Catalog.API.Import.MebImportRow>>(
                json, new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? [];
            var existing = await db.Outcomes.CountAsync();
            if (rows.Count > 0 && existing < rows.Count)
            {
                var importer = scope.ServiceProvider.GetRequiredService<DijitalAtolye.Catalog.API.Import.MebCatalogImporter>();
                var result = await importer.ImportAsync(rows, CancellationToken.None);
                logger.LogInformation("MEB import: {Imported}/{Total} kazanım eklendi (mevcut: {Existing}).",
                    result.Imported, result.TotalRows, existing);
            }
            else
            {
                logger.LogInformation("MEB import atlandı (mevcut outcome: {Existing}, dosya: {Rows}).", existing, rows.Count);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "MEB kazanım import başarısız.");
        }
    }
}

app.Run();
