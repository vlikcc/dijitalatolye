using System.Text;
using DijitalAtolye.Content.API.AiExtraction;
using DijitalAtolye.Content.API.Bundles;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DijitalAtolye.Content.API.Studio;

/// <summary>Kullanıcıya gösterilecek, beklenen üretim hatası (anahtar yok, kota vb.).</summary>
public sealed class StudioGenerationException(string message) : Exception(message);

/// <summary>
/// Stüdyo turlarını kuyruktan alıp EVREN'e gönderir, sonucu ayıklar/tarar ve önizleme kopyasını yayınlar.
/// LLM çağrıları dakikalar sürebildiği için HTTP isteğinden ayrı çalışır; istemci turu yoklar.
/// Not: Content servisi tek replika varsayımıyla çalışır (açılışta Running turlar başarısız sayılır).
/// </summary>
public sealed class GameGenerationWorker : BackgroundService
{
    public const string PreviewPrefix = "studio-preview";

    private readonly IServiceScopeFactory _scopes;
    private readonly GameGenerationQueue _queue;
    private readonly StudioOptions _options;
    private readonly ILogger<GameGenerationWorker> _logger;

    public GameGenerationWorker(
        IServiceScopeFactory scopes,
        GameGenerationQueue queue,
        IOptions<StudioOptions> options,
        ILogger<GameGenerationWorker> logger)
    {
        _scopes = scopes;
        _queue = queue;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RecoverAsync(stoppingToken);

        var gate = new SemaphoreSlim(Math.Max(1, _options.MaxConcurrent));
        await foreach (var turnId in _queue.ReadAllAsync(stoppingToken))
        {
            await gate.WaitAsync(stoppingToken);
            _ = Task.Run(async () =>
            {
                try
                {
                    await ProcessAsync(turnId, stoppingToken);
                }
                finally
                {
                    gate.Release();
                }
            }, CancellationToken.None);
        }
    }

    private async Task RecoverAsync(CancellationToken ct)
    {
        try
        {
            using var scope = _scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ContentDbContext>();
            var interrupted = await db.StudioTurns
                .Where(t => t.Status == StudioTurnStatus.Running)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(t => t.Status, StudioTurnStatus.Failed)
                    .SetProperty(t => t.Error, "Sunucu yeniden başlatıldığı için üretim yarıda kaldı. Tekrar deneyin.")
                    .SetProperty(t => t.CompletedAtUtc, DateTime.UtcNow), ct);
            var queued = await db.StudioTurns
                .Where(t => t.Status == StudioTurnStatus.Queued)
                .OrderBy(t => t.CreatedAtUtc)
                .Select(t => t.Id)
                .ToListAsync(ct);
            foreach (var id in queued) _queue.Enqueue(id);
            if (interrupted > 0 || queued.Count > 0)
                _logger.LogInformation("Stüdyo kurtarma: {Interrupted} yarım tur başarısız, {Queued} tur yeniden kuyrukta.", interrupted, queued.Count);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Stüdyo kuyruk kurtarması başarısız; yeni turlar yine işlenecek.");
        }
    }

    private async Task ProcessAsync(Guid turnId, CancellationToken stoppingToken)
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ContentDbContext>();

        // Atomik sahiplenme: aynı tur iki kez işlenmez.
        var claimed = await db.StudioTurns
            .Where(t => t.Id == turnId && t.Status == StudioTurnStatus.Queued)
            .ExecuteUpdateAsync(s => s
                .SetProperty(t => t.Status, StudioTurnStatus.Running)
                .SetProperty(t => t.StartedAtUtc, DateTime.UtcNow), stoppingToken);
        if (claimed == 0) return;

        var turn = await db.StudioTurns.FirstOrDefaultAsync(t => t.Id == turnId, stoppingToken);
        var session = turn is null
            ? null
            : await db.StudioSessions.FirstOrDefaultAsync(s => s.Id == turn.SessionId, stoppingToken);
        if (turn is null || session is null) return;

        try
        {
            await GenerateAsync(scope.ServiceProvider, db, session, turn, stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            await FailAsync(db, turn, "Sunucu kapanırken üretim yarıda kaldı. Tekrar deneyin.");
        }
        catch (OperationCanceledException)
        {
            await FailAsync(db, turn, "EVREN yanıtı zaman aşımına uğradı. Daha sade bir istekle tekrar deneyin.");
        }
        catch (EvrenApiException ex)
        {
            await FailAsync(db, turn, ex.Message);
        }
        catch (StudioGenerationException ex)
        {
            await FailAsync(db, turn, ex.Message);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "EVREN'e ulaşılamadı (tur {TurnId}).", turnId);
            await FailAsync(db, turn, "EVREN hizmetine ulaşılamadı. Bir süre sonra tekrar deneyin.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Stüdyo turu beklenmeyen hata ile bitti (tur {TurnId}).", turnId);
            await FailAsync(db, turn, "Beklenmeyen bir hata oluştu. Tekrar deneyin.");
        }
    }

    private async Task GenerateAsync(
        IServiceProvider services,
        ContentDbContext db,
        GameStudioSession session,
        GameStudioTurn turn,
        CancellationToken ct)
    {
        var client = services.GetRequiredService<IEvrenChatClient>();
        var apiKey = await ResolveApiKeyAsync(services, db, session.OwnerUserId, turn.KeySource, ct);
        var brief = await BuildBriefAsync(services.GetRequiredService<ICatalogOutcomeProvider>(), session, ct);

        string? baseHtml = null;
        if (session.SelectedTurnId is { } selectedId)
        {
            baseHtml = await db.StudioTurns.AsNoTracking()
                .Where(t => t.Id == selectedId && t.Status == StudioTurnStatus.Succeeded)
                .Select(t => t.Html)
                .FirstOrDefaultAsync(ct);
        }

        var messages = baseHtml is null
            ? GamePromptBuilder.BuildInitial(brief, turn.UserPrompt)
            : GamePromptBuilder.BuildRevision(brief, baseHtml, turn.UserPrompt);

        Task ReportProgress(int chars) => db.StudioTurns
            .Where(t => t.Id == turn.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.ProgressChars, chars), ct);

        var result = await client.CompleteAsync(apiKey, turn.Model, messages, ReportProgress, ct);
        var promptTokens = result.PromptTokens;
        var completionTokens = result.CompletionTokens;
        var extracted = GeneratedHtmlExtractor.Extract(result.Content, result.FinishReason);

        if (extracted.Html is not null)
        {
            var violations = GeneratedGameLinter.Check(extracted.Html);
            if (violations.Count > 0)
            {
                _logger.LogInformation("Stüdyo turu {TurnId} kural ihlali içeriyor ({Violations}); düzeltme isteniyor.",
                    turn.Id, string.Join(", ", violations));
                var fixMessages = GamePromptBuilder.BuildFix(messages, result.Content, violations);
                var fixedResult = await client.CompleteAsync(apiKey, turn.Model, fixMessages, ReportProgress, ct);
                promptTokens += fixedResult.PromptTokens;
                completionTokens += fixedResult.CompletionTokens;
                extracted = GeneratedHtmlExtractor.Extract(fixedResult.Content, fixedResult.FinishReason);
                if (extracted.Html is not null)
                {
                    var remaining = GeneratedGameLinter.Check(extracted.Html);
                    if (remaining.Count > 0)
                    {
                        extracted = new ExtractedGame(null, null,
                            "Üretilen kod platform güvenlik kurallarına uymadı (" + string.Join("; ", remaining) + "). İsteği değiştirip tekrar deneyin.");
                    }
                }
            }
        }

        turn.PromptTokens = promptTokens;
        turn.CompletionTokens = completionTokens;

        if (extracted.Html is null)
        {
            await FailAsync(db, turn, extracted.Error ?? "Oyun üretilemedi.");
            return;
        }

        var config = services.GetRequiredService<IConfiguration>();
        var publishedBucket = config["Minio:BucketPublished"] ?? "dijitalatolye-content-published";
        var previewKey = $"{PreviewPrefix}/{session.Id:N}/{turn.Id:N}/index.html";
        await services.GetRequiredService<BundleExtractor>()
            .PublishFileAsync(publishedBucket, previewKey, Encoding.UTF8.GetBytes(extracted.Html), ct);

        turn.Html = extracted.Html;
        turn.ChangeSummary = extracted.Summary;
        turn.PreviewKey = previewKey;
        turn.ProgressChars = extracted.Html.Length;
        turn.Status = StudioTurnStatus.Succeeded;
        turn.CompletedAtUtc = DateTime.UtcNow;
        session.SelectedTurnId = turn.Id;
        session.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(CancellationToken.None);
    }

    private async Task<string> ResolveApiKeyAsync(
        IServiceProvider services,
        ContentDbContext db,
        Guid userId,
        StudioKeySource source,
        CancellationToken ct)
    {
        if (source == StudioKeySource.Platform)
        {
            return _options.PlatformKeyConfigured
                ? _options.PlatformApiKey
                : throw new StudioGenerationException("Platform EVREN anahtarı henüz tanımlı değil. Profilinizden kendi anahtarınızı ekleyebilirsiniz.");
        }

        var credential = await db.AiCredentials.AsNoTracking().FirstOrDefaultAsync(c => c.UserId == userId, ct)
            ?? throw new StudioGenerationException("Kayıtlı EVREN anahtarınız bulunamadı. Profilinizden anahtar ekleyin.");
        try
        {
            return services.GetRequiredService<StudioKeyProtector>().Unprotect(credential.EncryptedApiKey);
        }
        catch (System.Security.Cryptography.CryptographicException)
        {
            throw new StudioGenerationException("Kayıtlı EVREN anahtarınız çözülemedi. Profilinizden anahtarı yeniden kaydedin.");
        }
    }

    /// <summary>Oturumdaki kazanım kodlarını Catalog açıklamalarıyla zenginleştirir; bulunamayanlar yalnız kodla kalır.</summary>
    private static async Task<GameBrief> BuildBriefAsync(ICatalogOutcomeProvider catalog, GameStudioSession session, CancellationToken ct)
    {
        var outcomes = new List<CatalogOutcomeDto>();
        if (session.OutcomeCodes.Count > 0)
        {
            var found = new Dictionary<string, CatalogOutcomeDto>(StringComparer.OrdinalIgnoreCase);
            var subjects = session.Subjects.Count > 0 ? session.Subjects.Take(3).Select(s => (string?)s) : [null];
            IEnumerable<int?> grades = session.GradeLevels.Count > 0 ? session.GradeLevels.Take(3).Select(g => (int?)g) : [null];
            foreach (var subject in subjects)
            {
                foreach (var grade in grades)
                {
                    foreach (var o in await catalog.GetAsync(subject, grade, 500, ct))
                    {
                        if (session.OutcomeCodes.Contains(o.Code, StringComparer.OrdinalIgnoreCase))
                            found.TryAdd(o.Code, o);
                    }
                }
            }
            outcomes.AddRange(session.OutcomeCodes.Select(code =>
                found.TryGetValue(code, out var o) ? o : new CatalogOutcomeDto(code, string.Empty)));
        }

        return new GameBrief(session.Title, session.Idea, session.Subjects, session.GradeLevels, outcomes);
    }

    private async Task FailAsync(ContentDbContext db, GameStudioTurn turn, string error)
    {
        turn.Status = StudioTurnStatus.Failed;
        turn.Error = error.Length <= 1000 ? error : error[..1000];
        turn.CompletedAtUtc = DateTime.UtcNow;
        try
        {
            await db.SaveChangesAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            // Oturum bu arada silinmiş olabilir.
            _logger.LogWarning(ex, "Stüdyo turu {TurnId} başarısız durumu kaydedilemedi.", turn.Id);
        }
    }
}
