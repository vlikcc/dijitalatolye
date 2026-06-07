using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;
using DijitalAtolye.BuildingBlocks.Outbox;
using DijitalAtolye.Content.API.AiExtraction;
using DijitalAtolye.Content.API.Bundles;
using DijitalAtolye.Content.API.Domain;
using DijitalAtolye.Content.API.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Minio;
using Minio.DataModel.Args;

namespace DijitalAtolye.Content.API.Endpoints;

public static class ContentEndpoints
{
    public static IEndpointRouteBuilder MapContentEndpoints(this IEndpointRouteBuilder routes)
    {
        var contents = routes.MapGroup("/contents").WithTags("Contents").RequireAuthorization();

        contents.MapPost("/", async (
            [FromBody] CreateContentRequest body,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = new Domain.Content
            {
                AuthorUserId = current.UserId.Value,
                Title = body.Title,
                Description = body.Description,
                Subject = body.Subject,
                GradeLevel = body.GradeLevel,
                OutcomeCodes = body.OutcomeCodes.ToList(),
                Tags = body.Tags.ToList(),
                TargetAge = body.TargetAge,
                DurationMinutes = body.DurationMinutes,
                Difficulty = NormalizeDifficulty(body.Difficulty),
                CoverImageBucket = body.CoverImageBucket,
                CoverImageKey = body.CoverImageKey,
                AiSuggestionJson = body.AiSuggestion is null
                    ? null
                    : System.Text.Json.JsonSerializer.Serialize(body.AiSuggestion),
            };
            db.Contents.Add(content);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/contents/{content.Id}", new { content.Id, content.State });
        }).RequireAuthorization(Policies.TeacherOrAbove);

        contents.MapPost("/{id:guid}/versions", async (
            Guid id,
            [FromBody] AddVersionRequest body,
            ICurrentUser current,
            ContentDbContext db,
            IOutboxWriter outbox,
            BundleValidator validator,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = await db.Contents.Include(c => c.Versions)
                .FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.AuthorUserId != current.UserId) return Results.Forbid();

            BundleValidationResult validation;
            try
            {
                validation = await validator.ValidateAsync(body.Bucket, body.Key, body.ManifestEntry, ct);
            }
            catch (BundleValidationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }

            var nextNum = content.Versions.Count == 0 ? 1 : content.Versions.Max(v => v.VersionNumber) + 1;
            var version = new ContentVersion
            {
                ContentId = id,
                VersionNumber = nextNum,
                StorageBucket = body.Bucket,
                StorageKey = body.Key,
                ManifestEntry = validation.ManifestEntry,
                ManifestJson = validation.ManifestJson,
                FileSizeBytes = validation.SizeBytes,
                Sha256 = validation.Sha256,
                CreatedByUserId = current.UserId.Value,
                ChangeLog = body.ChangeLog,
            };
            db.Versions.Add(version);
            content.CurrentVersionId = version.Id;
            content.UpdatedAtUtc = DateTime.UtcNow;

            await outbox.WriteAsync(new DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage.FileUploadedV1
            {
                ContentId = content.Id,
                VersionId = version.Id,
                Bucket = version.StorageBucket,
                Key = version.StorageKey
            }, ct: ct);

            await db.SaveChangesAsync(ct);
            return Results.Created($"/contents/{id}/versions/{version.Id}", version);
        }).RequireAuthorization(Policies.TeacherOrAbove);

        contents.MapPost("/{id:guid}/submit", async (
            Guid id,
            ICurrentUser current,
            ContentDbContext db,
            IOutboxWriter outbox,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = await db.Contents.Include(c => c.Versions)
                .FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.AuthorUserId != current.UserId) return Results.Forbid();
            if (content.CurrentVersionId is null) return Results.BadRequest("Önce en az bir versiyon yüklenmeli.");
            if (!content.CanTransitionTo(ContentState.Submitted))
            {
                return Results.Conflict($"Mevcut durumda gönderilemez: {content.State}");
            }

            content.TransitionTo(ContentState.Submitted);
            var current_v = content.Versions.First(v => v.Id == content.CurrentVersionId);

            await outbox.WriteAsync(new ContentSubmittedV1
            {
                ContentId = content.Id,
                VersionId = current_v.Id,
                AuthorUserId = content.AuthorUserId,
                ManifestEntry = current_v.ManifestEntry,
                StorageKey = current_v.StorageKey,
                Title = content.Title,
                OutcomeCodes = content.OutcomeCodes.AsReadOnly(),
                Tags = content.Tags.AsReadOnly(),
                GradeLevel = content.GradeLevel,
                Subject = content.Subject,
            }, ct: ct);

            await db.SaveChangesAsync(ct);
            return Results.Accepted($"/contents/{id}", new { content.Id, content.State });
        }).RequireAuthorization(Policies.TeacherOrAbove);

        contents.MapGet("/mine", async (
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var items = await db.Contents.AsNoTracking()
                .Where(c => c.AuthorUserId == current.UserId)
                .OrderByDescending(c => c.UpdatedAtUtc)
                .Take(50)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Slug,
                    State = c.State.ToString(),
                    Status = c.State.ToString(),
                    Subject = c.Subject,
                    Grade = c.GradeLevel.ToString(),
                    GradeLevel = c.GradeLevel,
                    UpdatedAt = c.UpdatedAtUtc,
                    UpdatedAtUtc = c.UpdatedAtUtc,
                    CreatedAtUtc = c.CreatedAtUtc,
                })
                .ToListAsync(ct);
            return Results.Ok(items);
        });

        contents.MapGet("/all", async (
            int? pageSize,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null || !current.Roles.Contains("Admin") && !current.Roles.Contains("SuperAdmin"))
                return Results.Forbid();

            var items = await db.Contents.AsNoTracking()
                .OrderByDescending(c => c.CreatedAtUtc)
                .Take(pageSize ?? 50)
                .Select(c => new {
                    c.Id,
                    c.Title,
                    State = c.State.ToString(),
                    AuthorEmail = c.AuthorUserId.ToString(), // Simplification since user email isn't in Content DB
                    c.CreatedAtUtc
                })
                .ToListAsync(ct);
                
            return Results.Ok(new { items });
        });

        contents.MapPost("/{id:guid}/revise", async (
            Guid id,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = await db.Contents.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.AuthorUserId != current.UserId) return Results.Forbid();
            if (!content.CanTransitionTo(ContentState.Draft))
                return Results.Conflict($"Mevcut durumdan revize edilemez: {content.State}");

            content.TransitionTo(ContentState.Draft);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { content.Id, content.State });
        }).RequireAuthorization(Policies.TeacherOrAbove);

        contents.MapPut("/{id:guid}/metadata", async (
            Guid id,
            [FromBody] UpdateMetadataRequest body,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = await db.Contents.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.AuthorUserId != current.UserId) return Results.Forbid();
            if (content.State is not (ContentState.Draft or ContentState.RevisionRequested))
                return Results.Conflict("Sadece Draft veya RevisionRequested durumda metadata güncellenebilir.");

            content.Title = body.Title ?? content.Title;
            content.Description = body.Description ?? content.Description;
            content.Subject = body.Subject ?? content.Subject;
            content.GradeLevel = body.GradeLevel ?? content.GradeLevel;
            if (body.OutcomeCodes is not null) content.OutcomeCodes = body.OutcomeCodes.ToList();
            if (body.Tags is not null) content.Tags = body.Tags.ToList();
            content.TargetAge = body.TargetAge ?? content.TargetAge;
            content.DurationMinutes = body.DurationMinutes ?? content.DurationMinutes;
            content.Difficulty = NormalizeDifficulty(body.Difficulty) ?? content.Difficulty;
            if (body.CoverImageBucket is not null) content.CoverImageBucket = body.CoverImageBucket;
            if (body.CoverImageKey is not null) content.CoverImageKey = body.CoverImageKey;
            content.UpdatedAtUtc = DateTime.UtcNow;

            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        }).RequireAuthorization(Policies.TeacherOrAbove);

        // Editör katalog düzeltmesi: inceleme sırasında AI önerisini kazanım/etiket vb.'ye uygulayabilir.
        // Sahip kontrolü yok (editör başka öğretmenin içeriğini inceler); yalnızca inceleme durumlarında.
        contents.MapPut("/{id:guid}/editor-metadata", async (
            Guid id,
            [FromBody] EditorMetadataRequest body,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            var content = await db.Contents.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.State is not (ContentState.AIReviewing or ContentState.AIReviewed or ContentState.EditorReviewing))
                return Results.Conflict("Sadece AI/editör inceleme durumlarında düzenlenebilir.");

            if (body.OutcomeCodes is not null) content.OutcomeCodes = body.OutcomeCodes.ToList();
            if (body.Tags is not null) content.Tags = body.Tags.ToList();
            if (body.Subject is not null) content.Subject = body.Subject;
            content.GradeLevel = body.GradeLevel ?? content.GradeLevel;
            content.Difficulty = NormalizeDifficulty(body.Difficulty) ?? content.Difficulty;
            content.UpdatedAtUtc = DateTime.UtcNow;

            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        }).RequireAuthorization(Policies.EditorOrAbove);

        contents.MapGet("/{id:guid}", async (Guid id, ContentDbContext db, CancellationToken ct) =>
        {
            var content = await db.Contents.AsNoTracking()
                .Include(c => c.Versions)
                .FirstOrDefaultAsync(c => c.Id == id, ct);
            return content is null ? Results.NotFound() : Results.Json(content);
        });

        // Faz 1 — AI destekli yükleme: tek ekran upload akışı için
        // Multipart ZIP/HTML bundle alır, MinIO'ya geçici key olarak yazar, metin örnekler,
        // Catalog'tan kazanım listesi çekip DeepSeek'e gönderir ve metadata önerisi döner.
        // Kullanıcı sonra form'u onaylayıp POST /contents + /versions + /submit ile devam eder.
        contents.MapPost("/ai-extract", async (
            IFormFile file,
            ICurrentUser current,
            IMinioClient minio,
            [FromServices] BundleValidator validator,
            [FromServices] BundleTextSampler sampler,
            [FromServices] IContentMetadataExtractor extractor,
            [FromServices] AiExtractionMetrics metrics,
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            if (current.UserId is null) return Results.Unauthorized();
            if (file is null || file.Length == 0)
            {
                metrics.RecordClientError(sw.Elapsed.TotalMilliseconds, "empty_file");
                return Results.BadRequest(new { error = "Dosya boş veya eksik." });
            }
            if (file.Length > 50L * 1024 * 1024)
            {
                metrics.RecordClientError(sw.Elapsed.TotalMilliseconds, "too_large");
                return Results.BadRequest(new { error = "Dosya 50 MB sınırını aşıyor." });
            }

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext is not (".zip" or ".html" or ".htm"))
            {
                metrics.RecordClientError(sw.Elapsed.TotalMilliseconds, "bad_extension");
                return Results.BadRequest(new { error = "Sadece .zip, .html veya .htm yüklenebilir." });
            }

            var log = loggerFactory.CreateLogger("ContentAiExtract");

            // 1) Belleğe oku
            await using var input = file.OpenReadStream();
            using var buffer = new MemoryStream();
            await input.CopyToAsync(buffer, ct);
            var bytes = buffer.ToArray();

            // 2) MinIO temp key — version create için yeniden kullanılacak (kullanıcı tekrar upload etmesin diye)
            const string bucket = "dijitalatolye-content";
            var key = $"{current.UserId:N}/{Guid.NewGuid():N}/{SanitizeFileName(file.FileName)}";

            await EnsureBucketAsync(minio, bucket, ct);
            using (var putStream = new MemoryStream(bytes))
            {
                await minio.PutObjectAsync(new PutObjectArgs()
                    .WithBucket(bucket)
                    .WithObject(key)
                    .WithStreamData(putStream)
                    .WithObjectSize(bytes.LongLength)
                    .WithContentType(file.ContentType ?? "application/octet-stream"), ct);
            }

            // 3) Bundle validasyonu (manifest, dosya türü whitelist, vs.)
            BundleValidationResult validation;
            try
            {
                validation = await validator.ValidateAsync(bucket, key, declaredManifestEntry: null, ct);
            }
            catch (BundleValidationException ex)
            {
                metrics.RecordClientError(sw.Elapsed.TotalMilliseconds, "bundle_invalid");
                return Results.BadRequest(new { error = ex.Message });
            }

            // 4) Metin örnekle
            BundleSample sample;
            try
            {
                using var sampleStream = new MemoryStream(bytes);
                sample = sampler.Sample(sampleStream, file.FileName);
            }
            catch (Exception ex)
            {
                log.LogWarning(ex, "BundleTextSampler başarısız; boş örnekle devam.");
                sample = new BundleSample(string.Empty, Array.Empty<string>(), Array.Empty<string>(), 0);
            }

            // 5) İki aşamalı LLM çağrısı: draft (subject/grade) → Catalog filtreli kazanım seçimi (extractor içinde)
            AiExtractedMetadataDto metadata;
            var aiFailed = false;
            try
            {
                var promptText = BuildSampleText(sample);
                metadata = await extractor.ExtractAsync(promptText, ct);
            }
            catch (Exception ex)
            {
                log.LogError(ex, "AI extract başarısız; manifest fallback ile devam.");
                aiFailed = true;
                metadata = new AiExtractedMetadataDto(
                    Title: validation.ManifestTitle,
                    Description: null,
                    Subject: null,
                    GradeLevel: null,
                    DurationMinutes: null,
                    Difficulty: null,
                    OutcomeCodes: Array.Empty<string>(),
                    Tags: Array.Empty<string>(),
                    Confidence: 0.0,
                    CandidateOutcomeCount: 0,
                    RawDraftResponse: null,
                    RawOutcomesResponse: null);
            }

            if (aiFailed)
            {
                metrics.RecordServerError(sw.Elapsed.TotalMilliseconds, "llm_failure");
            }
            else
            {
                metrics.RecordSuccess(sw.Elapsed.TotalMilliseconds, metadata.Confidence, metadata.CandidateOutcomeCount);
            }

            return Results.Ok(new AiExtractResponse(
                Bucket: bucket,
                Key: key,
                ManifestEntry: validation.ManifestEntry,
                FileSizeBytes: validation.SizeBytes,
                Sha256: validation.Sha256,
                Metadata: metadata,
                FilesScanned: sample.FilesScanned));
        })
        .DisableAntiforgery()
        .RequireAuthorization(Policies.TeacherOrAbove);

        return routes;
    }

    private static string BuildSampleText(BundleSample sample)
    {
        var sb = new System.Text.StringBuilder();
        if (sample.Titles.Count > 0)
        {
            sb.AppendLine("Başlık(lar): " + string.Join(" | ", sample.Titles));
        }
        if (sample.Headings.Count > 0)
        {
            sb.AppendLine("Bölüm başlıkları: " + string.Join(" | ", sample.Headings));
        }
        if (!string.IsNullOrWhiteSpace(sample.Text))
        {
            sb.AppendLine();
            sb.AppendLine(sample.Text);
        }
        return sb.ToString();
    }

    private static string SanitizeFileName(string name)
    {
        var trimmed = Path.GetFileName(name).Trim();
        if (string.IsNullOrEmpty(trimmed)) return "bundle";
        var sb = new System.Text.StringBuilder(trimmed.Length);
        foreach (var c in trimmed)
        {
            sb.Append(c switch
            {
                'ç' => 'c', 'Ç' => 'C',
                'ğ' => 'g', 'Ğ' => 'G',
                'ı' => 'i', 'İ' => 'I',
                'ö' => 'o', 'Ö' => 'O',
                'ş' => 's', 'Ş' => 'S',
                'ü' => 'u', 'Ü' => 'U',
                _ when char.IsLetterOrDigit(c) || c is '.' or '-' or '_' => c,
                _ => '_',
            });
        }
        return sb.ToString();
    }

    private static async Task EnsureBucketAsync(IMinioClient minio, string bucket, CancellationToken ct)
    {
        var exists = await minio.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucket), ct);
        if (!exists)
        {
            await minio.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucket), ct);
        }
    }

    private static string? NormalizeDifficulty(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.Trim().ToLowerInvariant() switch
        {
            "easy" or "kolay" => "Easy",
            "medium" or "orta" => "Medium",
            "hard" or "zor" => "Hard",
            _ => null,
        };
    }
}

public sealed record CreateContentRequest(
    string Title,
    string? Description,
    string Subject,
    int? GradeLevel,
    string[] OutcomeCodes,
    string[] Tags,
    int? TargetAge = null,
    int? DurationMinutes = null,
    string? Difficulty = null,
    string? CoverImageBucket = null,
    string? CoverImageKey = null,
    AiSuggestionInput? AiSuggestion = null);

/// <summary>İçerik oluşturulurken yakalanan AI metadata önerisi (editör karşılaştırması için saklanır).</summary>
public sealed record AiSuggestionInput(
    string? Subject,
    int? GradeLevel,
    int? DurationMinutes,
    string? Difficulty,
    string[] OutcomeCodes,
    string[] Tags,
    double Confidence);

public sealed record UpdateMetadataRequest(
    string? Title,
    string? Description,
    string? Subject,
    int? GradeLevel,
    string[]? OutcomeCodes,
    string[]? Tags,
    int? TargetAge,
    int? DurationMinutes,
    string? Difficulty,
    string? CoverImageBucket,
    string? CoverImageKey);

public sealed record EditorMetadataRequest(
    string[]? OutcomeCodes,
    string[]? Tags,
    string? Subject,
    int? GradeLevel,
    string? Difficulty);

public sealed record AddVersionRequest(
    string Bucket,
    string Key,
    string? ManifestEntry,
    string? ManifestJson,
    long FileSizeBytes,
    string? Sha256,
    string? ChangeLog);

public sealed record AiExtractResponse(
    string Bucket,
    string Key,
    string ManifestEntry,
    long FileSizeBytes,
    string Sha256,
    AiExtractedMetadataDto Metadata,
    int FilesScanned);
