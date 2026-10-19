using System.Text;
using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Content.API.Bundles;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using DijitalAtolye.Content.API.Studio;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace DijitalAtolye.Content.API.Endpoints;

/// <summary>
/// AI Oyun Stüdyosu: öğretmen EVREN modelleriyle oyun üretir, sohbetle iyileştirir ve seçtiği sürümü
/// normal içerik taslağı olarak gönderir (Guard → AI moderasyon → editör onayı aynen uygulanır).
/// </summary>
public static class StudioEndpoints
{
    private static readonly Dictionary<string, (string Label, string Description)> ModelInfo = new(StringComparer.Ordinal)
    {
        ["qwen3.8-flash-next"] = ("Qwen 3.8 Flash Next", "En hızlı; çoğu oyun 2-3 dakikada hazır (önerilen)"),
        ["glm-5.3"] = ("GLM 5.3", "Filonun en yetenekli modeli; daha yavaş"),
        ["deepseek-v4.1-flash"] = ("DeepSeek V4.1 Flash", "Kodda güçlü; yoğun saatlerde yavaş"),
        ["mimo-v2.6-pro"] = ("MiMo V2.6 Pro", "Uzun soluklu, büyük model"),
        ["auto"] = ("Otomatik", "EVREN isteğe göre modeli kendisi seçer"),
    };

    public static IEndpointRouteBuilder MapStudioEndpoints(this IEndpointRouteBuilder routes)
    {
        var studio = routes.MapGroup("/contents/studio")
            .WithTags("AiStudio")
            .RequireAuthorization(Policies.TeacherOrAbove);

        studio.MapGet("/models", async (
            ICurrentUser current,
            ContentDbContext db,
            IEvrenChatClient client,
            IMemoryCache cache,
            IOptions<StudioOptions> options,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var opts = options.Value;
            var available = await GetAvailableModelsAsync(client, cache, opts, ct);
            var credential = await db.AiCredentials.AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == current.UserId, ct);
            var used = await CountPlatformUsageTodayAsync(db, current.UserId.Value, ct);

            var models = available
                .Select(id => ModelInfo.TryGetValue(id, out var info)
                    ? new StudioModelDto(id, info.Label, info.Description)
                    : new StudioModelDto(id, id, string.Empty))
                .ToList();
            var defaultModel = available.Contains(opts.DefaultModel) ? opts.DefaultModel : available.FirstOrDefault() ?? opts.DefaultModel;

            return Results.Ok(new StudioModelsResponse(
                models,
                defaultModel,
                opts.PlatformKeyConfigured,
                credential is not null,
                credential?.KeyLast4,
                opts.DailyGenerationsPerUser,
                used));
        });

        studio.MapGet("/credential", async (ICurrentUser current, ContentDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var credential = await db.AiCredentials.AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == current.UserId, ct);
            return Results.Ok(new StudioCredentialResponse(credential is not null, credential?.KeyLast4, credential?.UpdatedAtUtc));
        });

        studio.MapPut("/credential", async (
            [FromBody] SaveStudioCredentialRequest body,
            ICurrentUser current,
            ContentDbContext db,
            IEvrenChatClient client,
            StudioKeyProtector protector,
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var apiKey = body.ApiKey?.Trim() ?? string.Empty;
            if (apiKey.Length is < 8 or > 512 || apiKey.Any(char.IsWhiteSpace))
                return Results.BadRequest(new { error = "Geçerli bir EVREN API anahtarı girin." });

            // Kaydetmeden önce anahtarı EVREN'de doğrula (anahtar asla loglanmaz).
            try
            {
                await client.ListModelsAsync(apiKey, ct);
            }
            catch (EvrenApiException ex) when (ex.IsTermsNotAccepted)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (EvrenApiException ex) when (ex.IsAuthError)
            {
                return Results.BadRequest(new { error = "EVREN bu anahtarı kabul etmedi. Anahtarı kontrol edin." });
            }
            catch (Exception ex) when (ex is EvrenApiException or HttpRequestException or TaskCanceledException)
            {
                loggerFactory.CreateLogger("StudioCredential").LogWarning(ex, "EVREN anahtar doğrulaması yapılamadı.");
                return Results.Json(new { error = "EVREN'e ulaşılamadı; anahtar kaydedilmedi. Biraz sonra tekrar deneyin." },
                    statusCode: StatusCodes.Status502BadGateway);
            }

            var credential = await db.AiCredentials.FirstOrDefaultAsync(c => c.UserId == current.UserId, ct);
            if (credential is null)
            {
                credential = new UserAiCredential
                {
                    UserId = current.UserId.Value,
                    EncryptedApiKey = protector.Protect(apiKey),
                    KeyLast4 = StudioKeyProtector.Last4(apiKey),
                };
                db.AiCredentials.Add(credential);
            }
            else
            {
                credential.EncryptedApiKey = protector.Protect(apiKey);
                credential.KeyLast4 = StudioKeyProtector.Last4(apiKey);
                credential.UpdatedAtUtc = DateTime.UtcNow;
            }
            await db.SaveChangesAsync(ct);
            return Results.Ok(new StudioCredentialResponse(true, credential.KeyLast4, credential.UpdatedAtUtc));
        });

        studio.MapDelete("/credential", async (ICurrentUser current, ContentDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            await db.AiCredentials.Where(c => c.UserId == current.UserId).ExecuteDeleteAsync(ct);
            return Results.NoContent();
        });

        studio.MapGet("/sessions", async (
            ICurrentUser current,
            ContentDbContext db,
            ContentMinioOptions minioOpts,
            IConfiguration config,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var rows = await db.StudioSessions.AsNoTracking()
                .Where(s => s.OwnerUserId == current.UserId)
                .OrderByDescending(s => s.UpdatedAtUtc)
                .Take(50)
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.Model,
                    s.ContentId,
                    s.UpdatedAtUtc,
                    TurnCount = s.Turns.Count,
                    LatestStatus = s.Turns.OrderByDescending(t => t.Seq).Select(t => (StudioTurnStatus?)t.Status).FirstOrDefault(),
                    PreviewKey = s.Turns.Where(t => t.Id == s.SelectedTurnId).Select(t => t.PreviewKey).FirstOrDefault(),
                })
                .ToListAsync(ct);

            var baseUrl = PreviewBase(minioOpts, config);
            return Results.Ok(rows.Select(r => new StudioSessionSummary(
                r.Id, r.Title, r.Model, r.ContentId, r.LatestStatus, PreviewUrl(baseUrl, r.PreviewKey), r.UpdatedAtUtc, r.TurnCount)));
        });

        studio.MapPost("/sessions", async (
            [FromBody] CreateStudioSessionRequest body,
            ICurrentUser current,
            ContentDbContext db,
            GameGenerationQueue queue,
            IOptions<StudioOptions> options,
            ContentMinioOptions minioOpts,
            IConfiguration config,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var opts = options.Value;
            var title = body.Title?.Trim() ?? string.Empty;
            var idea = body.Idea?.Trim() ?? string.Empty;
            if (title.Length is < 1 or > 200)
                return Results.BadRequest(new { error = "Başlık 1-200 karakter olmalı." });
            if (idea.Length is < 10 or > 4000)
                return Results.BadRequest(new { error = "Oyun fikri 10-4000 karakter olmalı." });
            var model = string.IsNullOrWhiteSpace(body.Model) ? opts.DefaultModel : body.Model.Trim();
            if (!opts.IsAllowedModel(model))
                return Results.BadRequest(new { error = "Seçilen model kullanılamıyor." });
            var outcomeCodes = (body.OutcomeCodes ?? [])
                .Select(c => c.Trim())
                .Where(c => c.Length is > 0 and <= 50)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(20)
                .ToList();

            var blocked = await CheckGenerationAllowedAsync(db, opts, current.UserId.Value, body.KeySource, ct);
            if (blocked is not null) return blocked;

            var session = new GameStudioSession
            {
                OwnerUserId = current.UserId.Value,
                Title = title,
                Idea = idea,
                Subjects = ContentEndpoints.NormalizeSubjects(body.Subjects),
                GradeLevels = ContentEndpoints.NormalizeGradeLevels(body.GradeLevels),
                OutcomeCodes = outcomeCodes,
                Model = model,
                KeySource = body.KeySource,
            };
            var turn = new GameStudioTurn
            {
                SessionId = session.Id,
                OwnerUserId = session.OwnerUserId,
                Seq = 1,
                UserPrompt = idea,
                Model = model,
                KeySource = body.KeySource,
            };
            session.Turns.Add(turn);
            db.StudioSessions.Add(session);
            await db.SaveChangesAsync(ct);
            queue.Enqueue(turn.Id);

            return Results.Created($"/contents/studio/sessions/{session.Id}", ToDetail(session, PreviewBase(minioOpts, config)));
        });

        studio.MapGet("/sessions/{id:guid}", async (
            Guid id,
            ICurrentUser current,
            ContentDbContext db,
            ContentMinioOptions minioOpts,
            IConfiguration config,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var session = await LoadOwnedSessionAsync(db, id, current.UserId.Value, tracking: false, ct);
            return session is null ? Results.NotFound() : Results.Ok(ToDetail(session, PreviewBase(minioOpts, config)));
        });

        studio.MapPost("/sessions/{id:guid}/turns", async (
            Guid id,
            [FromBody] CreateStudioTurnRequest body,
            ICurrentUser current,
            ContentDbContext db,
            GameGenerationQueue queue,
            IOptions<StudioOptions> options,
            ContentMinioOptions minioOpts,
            IConfiguration config,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var opts = options.Value;
            var session = await LoadOwnedSessionAsync(db, id, current.UserId.Value, tracking: true, ct);
            if (session is null) return Results.NotFound();
            if (session.ContentId is not null)
                return Results.Conflict(new { error = "Bu oyun yayına gönderildi; değişiklik için yeni bir stüdyo oturumu açın." });
            if (session.Turns.Any(t => t.Status is StudioTurnStatus.Queued or StudioTurnStatus.Running))
                return Results.Conflict(new { error = "Önceki istek hâlâ işleniyor; bitmesini bekleyin." });

            var prompt = body.Prompt?.Trim() ?? string.Empty;
            if (prompt.Length is < 3 or > 4000)
                return Results.BadRequest(new { error = "İstek 3-4000 karakter olmalı." });
            var model = string.IsNullOrWhiteSpace(body.Model) ? session.Model : body.Model.Trim();
            if (!opts.IsAllowedModel(model))
                return Results.BadRequest(new { error = "Seçilen model kullanılamıyor." });
            var keySource = body.KeySource ?? session.KeySource;

            var blocked = await CheckGenerationAllowedAsync(db, opts, current.UserId.Value, keySource, ct);
            if (blocked is not null) return blocked;

            var turn = new GameStudioTurn
            {
                SessionId = session.Id,
                OwnerUserId = session.OwnerUserId,
                Seq = session.Turns.Count == 0 ? 1 : session.Turns.Max(t => t.Seq) + 1,
                UserPrompt = prompt,
                Model = model,
                KeySource = keySource,
            };
            db.StudioTurns.Add(turn);
            session.Model = model;
            session.KeySource = keySource;
            session.UpdatedAtUtc = DateTime.UtcNow;
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                // Aynı anda iki istek: (SessionId, Seq) benzersiz indeksi ikincisini reddeder.
                return Results.Conflict(new { error = "Önceki istek hâlâ işleniyor; bitmesini bekleyin." });
            }
            queue.Enqueue(turn.Id);
            return Results.Accepted($"/contents/studio/sessions/{id}/turns/{turn.Id}", ToTurnDto(turn, PreviewBase(minioOpts, config)));
        });

        studio.MapGet("/sessions/{id:guid}/turns/{turnId:guid}", async (
            Guid id,
            Guid turnId,
            ICurrentUser current,
            ContentDbContext db,
            ContentMinioOptions minioOpts,
            IConfiguration config,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var turn = await db.StudioTurns.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == turnId && t.SessionId == id && t.OwnerUserId == current.UserId, ct);
            return turn is null ? Results.NotFound() : Results.Ok(ToTurnDto(turn, PreviewBase(minioOpts, config)));
        });

        studio.MapPost("/sessions/{id:guid}/turns/{turnId:guid}/select", async (
            Guid id,
            Guid turnId,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var session = await LoadOwnedSessionAsync(db, id, current.UserId.Value, tracking: true, ct);
            if (session is null) return Results.NotFound();
            if (session.ContentId is not null)
                return Results.Conflict(new { error = "Gönderilmiş oturumda sürüm değiştirilemez." });
            var turn = session.Turns.FirstOrDefault(t => t.Id == turnId);
            if (turn is null) return Results.NotFound();
            if (turn.Status != StudioTurnStatus.Succeeded)
                return Results.Conflict(new { error = "Yalnızca başarılı bir sürüm seçilebilir." });
            session.SelectedTurnId = turn.Id;
            session.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        studio.MapPost("/sessions/{id:guid}/submit", async (
            Guid id,
            ICurrentUser current,
            ContentDbContext db,
            IOutboxWriter outbox,
            IMinioClient minio,
            [FromServices] BundleValidator validator,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var session = await db.StudioSessions
                .FirstOrDefaultAsync(s => s.Id == id && s.OwnerUserId == current.UserId, ct);
            if (session is null) return Results.NotFound();
            if (session.ContentId is not null)
                return Results.Conflict(new { error = "Bu oyun zaten gönderildi.", contentId = session.ContentId });
            if (await db.StudioTurns.AnyAsync(t => t.SessionId == id
                    && (t.Status == StudioTurnStatus.Queued || t.Status == StudioTurnStatus.Running), ct))
                return Results.Conflict(new { error = "Devam eden üretim bitmeden gönderilemez." });

            var turn = session.SelectedTurnId is null
                ? null
                : await db.StudioTurns.FirstOrDefaultAsync(t => t.Id == session.SelectedTurnId && t.Status == StudioTurnStatus.Succeeded, ct);
            if (turn?.Html is null)
                return Results.BadRequest(new { error = "Gönderilecek başarılı bir oyun sürümü yok." });

            var upload = await ContentEndpoints.StoreBundleBytesAsync(
                Encoding.UTF8.GetBytes(turn.Html), "index.html", "text/html; charset=utf-8",
                current.UserId.Value, minio, validator, ct);
            if (upload.Error is not null) return upload.Error;

            var content = new Domain.Content
            {
                AuthorUserId = current.UserId.Value,
                Title = session.Title,
                Type = ContentType.Game,
                Description = session.Idea.Length > 2000 ? session.Idea[..2000] : session.Idea,
                Subjects = session.Subjects.ToList(),
                GradeLevels = session.GradeLevels.ToList(),
                OutcomeCodes = session.OutcomeCodes.ToList(),
                Source = ContentSource.AiStudio,
                GeneratedByModel = turn.Model,
            };
            var version = new ContentVersion
            {
                ContentId = content.Id,
                VersionNumber = 1,
                StorageBucket = upload.Bucket!,
                StorageKey = upload.Key!,
                ManifestEntry = upload.Validation!.ManifestEntry,
                ManifestJson = upload.Validation.ManifestJson,
                FileSizeBytes = upload.Validation.SizeBytes,
                Sha256 = upload.Validation.Sha256,
                CreatedByUserId = current.UserId.Value,
                ChangeLog = $"AI Oyun Stüdyosu ile üretildi ({turn.Model}, sürüm {turn.Seq})",
            };
            db.Contents.Add(content);
            db.Versions.Add(version);
            content.CurrentVersionId = version.Id;
            // Doğrudan onay akışına girer: Guard taraması bitince GuardScanUpdatedConsumer AI moderasyonu tetikler,
            // ardından editör onayı gelir (/contents/{id}/submit ile aynı Guard-önce kuralı).
            content.TransitionTo(ContentState.GuardScanning);
            session.ContentId = content.Id;
            session.UpdatedAtUtc = DateTime.UtcNow;

            await outbox.WriteAsync(new DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage.FileUploadedV1
            {
                ContentId = content.Id,
                VersionId = version.Id,
                Bucket = version.StorageBucket,
                Key = version.StorageKey,
            }, ct: ct);

            await db.SaveChangesAsync(ct);
            return Results.Ok(new StudioSubmitResponse(content.Id));
        });

        studio.MapDelete("/sessions/{id:guid}", async (
            Guid id,
            ICurrentUser current,
            ContentDbContext db,
            IMinioClient minio,
            IConfiguration config,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var session = await LoadOwnedSessionAsync(db, id, current.UserId.Value, tracking: true, ct);
            if (session is null) return Results.NotFound();

            var bucket = config["Minio:BucketPublished"] ?? "dijitalatolye-content-published";
            foreach (var key in session.Turns.Select(t => t.PreviewKey).OfType<string>())
            {
                try
                {
                    await minio.RemoveObjectAsync(new RemoveObjectArgs().WithBucket(bucket).WithObject(key), ct);
                }
                catch
                {
                    // best-effort: önizleme kopyası silinemese de oturum silinir.
                }
            }
            db.StudioSessions.Remove(session);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        return routes;
    }

    /// <summary>Türkiye saati (UTC+3, yaz saati yok) ile bugünün başlangıcı, UTC olarak.</summary>
    public static DateTime StartOfTodayUtc(DateTime nowUtc) => nowUtc.AddHours(3).Date.AddHours(-3);

    /// <summary>Bugün platform anahtarıyla açılan turlar. Token harcamadan başarısız olanlar sayılmaz.</summary>
    private static Task<int> CountPlatformUsageTodayAsync(ContentDbContext db, Guid userId, CancellationToken ct)
    {
        var since = StartOfTodayUtc(DateTime.UtcNow);
        return db.StudioTurns.CountAsync(t =>
            t.OwnerUserId == userId
            && t.KeySource == StudioKeySource.Platform
            && t.CreatedAtUtc >= since
            && (t.Status != StudioTurnStatus.Failed || t.CompletionTokens > 0), ct);
    }

    private static async Task<IResult?> CheckGenerationAllowedAsync(
        ContentDbContext db,
        StudioOptions opts,
        Guid userId,
        StudioKeySource keySource,
        CancellationToken ct)
    {
        if (keySource == StudioKeySource.User)
        {
            return await db.AiCredentials.AnyAsync(c => c.UserId == userId, ct)
                ? null
                : Results.BadRequest(new { error = "Kayıtlı EVREN anahtarınız yok. Profilinizden anahtar ekleyin." });
        }

        if (!opts.PlatformKeyConfigured)
            return Results.BadRequest(new { error = "Platform EVREN anahtarı henüz tanımlı değil. Profilinizden kendi anahtarınızı ekleyebilirsiniz." });

        var used = await CountPlatformUsageTodayAsync(db, userId, ct);
        if (used >= opts.DailyGenerationsPerUser)
        {
            return Results.Json(
                new { error = $"Platform anahtarıyla günlük {opts.DailyGenerationsPerUser} üretim sınırına ulaştınız. Yarın tekrar deneyin veya kendi EVREN anahtarınızı ekleyin." },
                statusCode: StatusCodes.Status429TooManyRequests);
        }
        return null;
    }

    private static async Task<IReadOnlyList<string>> GetAvailableModelsAsync(
        IEvrenChatClient client,
        IMemoryCache cache,
        StudioOptions opts,
        CancellationToken ct)
    {
        if (!opts.PlatformKeyConfigured) return opts.EffectiveAllowedModels;
        if (cache.TryGetValue<IReadOnlyList<string>>("studio:models", out var cached) && cached is not null)
            return cached;

        IReadOnlyList<string> result;
        TimeSpan ttl;
        try
        {
            var live = (await client.ListModelsAsync(opts.PlatformApiKey, ct)).ToHashSet(StringComparer.Ordinal);
            // "auto" yönlendiricisi model listesinde görünmeyebilir; izinliyse koru.
            result = opts.EffectiveAllowedModels.Where(m => live.Contains(m) || m == "auto").ToList();
            if (result.Count == 0) result = opts.EffectiveAllowedModels;
            ttl = TimeSpan.FromMinutes(10);
        }
        catch (Exception ex) when (ex is EvrenApiException or HttpRequestException or TaskCanceledException)
        {
            result = opts.EffectiveAllowedModels;
            ttl = TimeSpan.FromMinutes(1);
        }
        cache.Set("studio:models", result, ttl);
        return result;
    }

    private static async Task<GameStudioSession?> LoadOwnedSessionAsync(
        ContentDbContext db, Guid id, Guid userId, bool tracking, CancellationToken ct)
    {
        var query = db.StudioSessions.Include(s => s.Turns).AsQueryable();
        if (!tracking) query = query.AsNoTracking();
        return await query.FirstOrDefaultAsync(s => s.Id == id && s.OwnerUserId == userId, ct);
    }

    private static string PreviewBase(ContentMinioOptions minioOpts, IConfiguration config)
    {
        var publicBase = string.IsNullOrWhiteSpace(minioOpts.PublicEndpoint)
            ? $"http://{minioOpts.Endpoint}"
            : minioOpts.PublicEndpoint.TrimEnd('/');
        var bucket = config["Minio:BucketPublished"] ?? "dijitalatolye-content-published";
        return $"{publicBase}/{bucket}";
    }

    private static string? PreviewUrl(string baseUrl, string? key) =>
        string.IsNullOrWhiteSpace(key) ? null : $"{baseUrl}/{key}";

    private static StudioSessionDetail ToDetail(GameStudioSession s, string previewBase) => new(
        s.Id,
        s.Title,
        s.Idea,
        s.Subjects,
        s.GradeLevels,
        s.OutcomeCodes,
        s.Model,
        s.KeySource,
        s.SelectedTurnId,
        s.ContentId,
        s.CreatedAtUtc,
        s.UpdatedAtUtc,
        s.Turns.OrderBy(t => t.Seq).Select(t => ToTurnDto(t, previewBase)).ToList());

    private static StudioTurnDto ToTurnDto(GameStudioTurn t, string previewBase) => new(
        t.Id,
        t.Seq,
        t.UserPrompt,
        t.Status,
        t.Model,
        t.KeySource,
        t.ChangeSummary,
        t.Error,
        t.ProgressChars,
        t.PromptTokens,
        t.CompletionTokens,
        PreviewUrl(previewBase, t.PreviewKey),
        t.CreatedAtUtc,
        t.StartedAtUtc,
        t.CompletedAtUtc);
}

public sealed record StudioModelDto(string Id, string Label, string Description);

public sealed record StudioModelsResponse(
    IReadOnlyList<StudioModelDto> Models,
    string DefaultModel,
    bool PlatformKeyConfigured,
    bool HasUserKey,
    string? UserKeyLast4,
    int DailyLimit,
    int UsedToday);

public sealed record StudioCredentialResponse(bool HasKey, string? Last4, DateTime? UpdatedAtUtc);

public sealed record SaveStudioCredentialRequest(string? ApiKey);

public sealed record CreateStudioSessionRequest(
    string? Title,
    string? Idea,
    string[]? Subjects,
    int[]? GradeLevels,
    string[]? OutcomeCodes,
    string? Model,
    StudioKeySource KeySource = StudioKeySource.Platform);

public sealed record CreateStudioTurnRequest(string? Prompt, string? Model, StudioKeySource? KeySource);

public sealed record StudioSessionSummary(
    Guid Id,
    string Title,
    string Model,
    Guid? ContentId,
    StudioTurnStatus? LatestStatus,
    string? PreviewUrl,
    DateTime UpdatedAtUtc,
    int TurnCount);

public sealed record StudioSessionDetail(
    Guid Id,
    string Title,
    string Idea,
    IReadOnlyList<string> Subjects,
    IReadOnlyList<int> GradeLevels,
    IReadOnlyList<string> OutcomeCodes,
    string Model,
    StudioKeySource KeySource,
    Guid? SelectedTurnId,
    Guid? ContentId,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    IReadOnlyList<StudioTurnDto> Turns);

public sealed record StudioTurnDto(
    Guid Id,
    int Seq,
    string UserPrompt,
    StudioTurnStatus Status,
    string Model,
    StudioKeySource KeySource,
    string? ChangeSummary,
    string? Error,
    int ProgressChars,
    int PromptTokens,
    int CompletionTokens,
    string? PreviewUrl,
    DateTime CreatedAtUtc,
    DateTime? StartedAtUtc,
    DateTime? CompletedAtUtc);

public sealed record StudioSubmitResponse(Guid ContentId);
