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
                Type = body.Type,
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
            if (content.Type == ContentType.DigitalContent && content.OutcomeCodes.Count == 0)
                return Results.BadRequest(new { error = "Dijital içerik için en az bir kazanım seçilmelidir." });
            if (!content.CanTransitionTo(ContentState.GuardScanning) && !content.CanTransitionTo(ContentState.Submitted))
            {
                return Results.Conflict($"Mevcut durumda gönderilemez: {content.State}");
            }

            var current_v = content.Versions.First(v => v.Id == content.CurrentVersionId);

            // Guard-önce-AI: temiz tarama yoksa AI tetiklenmez; GuardScanning'de beklenir.
            if (GuardScanStatuses.IsCleanForAiModeration(current_v.GuardScanStatus))
            {
                content.TransitionTo(ContentState.Submitted);
                await outbox.WriteAsync(ContentSubmittedEventFactory.Create(content, current_v), ct: ct);
            }
            else
            {
                content.TransitionTo(ContentState.GuardScanning);
            }

            await db.SaveChangesAsync(ct);
            return Results.Accepted($"/contents/{id}", new { content.Id, content.State });
        }).RequireAuthorization(Policies.TeacherOrAbove);

        contents.MapGet("/mine", async (
            string? type,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var query = db.Contents.AsNoTracking()
                .Where(c => c.AuthorUserId == current.UserId);
            if (TryParseContentType(type, out var typeFilter))
                query = query.Where(c => c.Type == typeFilter);
            var items = await query
                .OrderByDescending(c => c.UpdatedAtUtc)
                .Take(50)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Slug,
                    Type = c.Type.ToString(),
                    State = c.State.ToString(),
                    Status = c.State.ToString(),
                    c.AutoRejectReason,
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
            string? type,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null || !current.Roles.Contains("Admin") && !current.Roles.Contains("SuperAdmin"))
                return Results.Forbid();

            var query = db.Contents.AsNoTracking();
            if (TryParseContentType(type, out var typeFilter))
                query = query.Where(c => c.Type == typeFilter);
            var items = await query
                .OrderByDescending(c => c.CreatedAtUtc)
                .Take(pageSize ?? 50)
                .Select(c => new {
                    c.Id,
                    c.Title,
                    Type = c.Type.ToString(),
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

            content.AutoRejectReason = null;
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
            if (body.Type is not null) content.Type = body.Type.Value;
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
            if (body.AiSuggestion is not null)
            {
                content.AiSuggestionJson = System.Text.Json.JsonSerializer.Serialize(body.AiSuggestion);
            }
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

        // Editör inceleme önizlemesi: yayınlanmamış (ama Guard-temiz) bundle'ı public-read bucket'a
        // geçici prefix ile extract edip oynanabilir entry URL'ini döndürür. İframe bu public URL'i yükler.
        contents.MapGet("/{id:guid}/preview-url", async (
            Guid id,
            ContentDbContext db,
            BundleExtractor extractor,
            ContentMinioOptions minioOpts,
            IConfiguration config,
            CancellationToken ct) =>
        {
            var content = await db.Contents.Include(c => c.Versions)
                .FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.CurrentVersionId is null) return Results.NotFound();
            var version = content.Versions.FirstOrDefault(v => v.Id == content.CurrentVersionId);
            if (version is null) return Results.NotFound();

            var publicBase = string.IsNullOrWhiteSpace(minioOpts.PublicEndpoint)
                ? $"http://{minioOpts.Endpoint}"
                : minioOpts.PublicEndpoint.TrimEnd('/');

            // Zaten yayınlanmışsa published kopyayı kullan.
            if (!string.IsNullOrWhiteSpace(content.PublishedBucket) && !string.IsNullOrWhiteSpace(content.PublishedKey))
                return Results.Ok(new { url = $"{publicBase}/{content.PublishedBucket}/{content.PublishedKey}" });

            var publishedBucket = config["Minio:BucketPublished"] ?? "dijitalatolye-content-published";
            var prefix = $"preview/{content.Id:N}/{version.Id:N}";
            var result = await extractor.ExtractToPublishedAsync(
                version.StorageBucket, version.StorageKey, version.ManifestEntry, publishedBucket, prefix, ct);
            return Results.Ok(new { url = $"{publicBase}/{publishedBucket}/{result.EntryKey}" });
        }).RequireAuthorization(Policies.EditorOrAbove);

        // Taslak/red içerik silme: yalnızca yayınlanmamış sahip durumları. Versiyonlar cascade,
        // MinIO nesneleri best-effort temizlenir. İçerik tamamen sistemden kalkar.
        contents.MapDelete("/{id:guid}", async (
            Guid id,
            ICurrentUser current,
            ContentDbContext db,
            IMinioClient minio,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = await db.Contents.Include(c => c.Versions).FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.AuthorUserId != current.UserId) return Results.Forbid();
            if (content.State is not (ContentState.Draft or ContentState.RevisionRequested
                or ContentState.AutoRejected or ContentState.Rejected))
                return Results.Conflict(new { error = $"Bu durumda silinemez: {content.State}. Yalnızca yayınlanmamış taslak/red içerikler silinebilir." });

            // MinIO temizliği (best-effort; eksik nesne silmeyi engellemesin).
            foreach (var v in content.Versions)
                await TryRemoveObjectAsync(minio, v.StorageBucket, v.StorageKey, ct);
            if (!string.IsNullOrWhiteSpace(content.PublishedBucket) && !string.IsNullOrWhiteSpace(content.PublishedKey))
                await TryRemoveObjectAsync(minio, content.PublishedBucket!, content.PublishedKey!, ct);
            if (!string.IsNullOrWhiteSpace(content.CoverImageBucket) && !string.IsNullOrWhiteSpace(content.CoverImageKey))
                await TryRemoveObjectAsync(minio, content.CoverImageBucket!, content.CoverImageKey!, ct);

            db.Likes.RemoveRange(db.Likes.Where(x => x.ContentId == id));
            db.Favorites.RemoveRange(db.Favorites.Where(x => x.ContentId == id));
            db.Comments.RemoveRange(db.Comments.Where(x => x.ContentId == id));
            db.Ratings.RemoveRange(db.Ratings.Where(x => x.ContentId == id));
            db.Contents.Remove(content); // Versions cascade
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        }).RequireAuthorization(Policies.TeacherOrAbove);

        // Guard-önce-AI yükleme: dosya → MinIO → versiyon → Guard; LLM metadata sonra.
        contents.MapPost("/bundle-upload", async (
            IFormFile file,
            [FromForm] string? type,
            ICurrentUser current,
            ContentDbContext db,
            IOutboxWriter outbox,
            IMinioClient minio,
            [FromServices] BundleValidator validator,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var upload = await TryUploadBundleAsync(file, current.UserId.Value, minio, validator, ct);
            if (upload.Error is not null) return upload.Error;

            var draftTitle = string.IsNullOrWhiteSpace(upload.Validation!.ManifestTitle)
                ? Path.GetFileNameWithoutExtension(file.FileName)
                : upload.Validation.ManifestTitle!;

            var content = new Domain.Content
            {
                AuthorUserId = current.UserId.Value,
                Title = draftTitle.Length > 200 ? draftTitle[..200] : draftTitle,
                Type = ParseContentType(type),
            };
            var version = new ContentVersion
            {
                ContentId = content.Id,
                VersionNumber = 1,
                StorageBucket = upload.Bucket!,
                StorageKey = upload.Key!,
                ManifestEntry = upload.Validation.ManifestEntry,
                ManifestJson = upload.Validation.ManifestJson,
                FileSizeBytes = upload.Validation.SizeBytes,
                Sha256 = upload.Validation.Sha256,
                CreatedByUserId = current.UserId.Value,
                ChangeLog = "İlk versiyon (Guard-önce upload)",
            };
            db.Contents.Add(content);
            db.Versions.Add(version);
            content.CurrentVersionId = version.Id;
            content.UpdatedAtUtc = DateTime.UtcNow;

            await outbox.WriteAsync(new DijitalAtolye.BuildingBlocks.EventBus.Contracts.Storage.FileUploadedV1
            {
                ContentId = content.Id,
                VersionId = version.Id,
                Bucket = version.StorageBucket,
                Key = version.StorageKey,
            }, ct: ct);

            await db.SaveChangesAsync(ct);

            return Results.Ok(new BundleUploadResponse(
                content.Id,
                version.Id,
                version.StorageBucket,
                version.StorageKey,
                version.ManifestEntry,
                version.FileSizeBytes,
                version.Sha256 ?? string.Empty,
                version.GuardScanStatus,
                content.Type.ToString()));
        })
        .DisableAntiforgery()
        .RequireAuthorization(Policies.TeacherOrAbove);

        contents.MapGet("/{id:guid}/processing-status", async (
            Guid id,
            ICurrentUser current,
            ContentDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var content = await db.Contents.AsNoTracking()
                .Include(c => c.Versions)
                .FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.AuthorUserId != current.UserId) return Results.Forbid();

            var version = content.Versions.FirstOrDefault(v => v.Id == content.CurrentVersionId);
            var guardStatus = version?.GuardScanStatus;
            var rejected = !string.IsNullOrWhiteSpace(guardStatus) && GuardScanStatuses.IsRejected(guardStatus)
                || content.State == ContentState.AutoRejected;

            return Results.Ok(new ContentProcessingStatusResponse(
                content.Id,
                content.State.ToString(),
                guardStatus,
                rejected,
                GuardScanStatuses.IsCleanForAiModeration(guardStatus)));
        }).RequireAuthorization(Policies.TeacherOrAbove);

        contents.MapPost("/{id:guid}/metadata-extract", async (
            Guid id,
            ICurrentUser current,
            ContentDbContext db,
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
            var content = await db.Contents.Include(c => c.Versions)
                .FirstOrDefaultAsync(c => c.Id == id, ct);
            if (content is null) return Results.NotFound();
            if (content.AuthorUserId != current.UserId) return Results.Forbid();
            if (content.CurrentVersionId is null) return Results.BadRequest(new { error = "Versiyon bulunamadı." });

            var version = content.Versions.First(v => v.Id == content.CurrentVersionId);
            if (!GuardScanStatuses.IsCleanForAiModeration(version.GuardScanStatus))
            {
                metrics.RecordClientError(sw.Elapsed.TotalMilliseconds, "guard_not_clean");
                return Results.Conflict(new
                {
                    error = "AI metadata çıkarımı için Guard taramasının temiz (clean) olması gerekir.",
                    guardScanStatus = version.GuardScanStatus,
                });
            }

            var log = loggerFactory.CreateLogger("ContentMetadataExtract");
            var fileName = Path.GetFileName(version.StorageKey);
            await using var objectStream = await OpenStorageObjectAsync(minio, version.StorageBucket, version.StorageKey, ct);
            using var buffer = new MemoryStream();
            await objectStream.CopyToAsync(buffer, ct);
            var bytes = buffer.ToArray();

            BundleSample sample;
            try
            {
                using var sampleStream = new MemoryStream(bytes);
                sample = sampler.Sample(sampleStream, fileName);
            }
            catch (Exception ex)
            {
                log.LogWarning(ex, "BundleTextSampler başarısız; boş örnekle devam.");
                sample = new BundleSample(string.Empty, Array.Empty<string>(), Array.Empty<string>(), 0);
            }

            AiExtractedMetadataDto metadata;
            var aiFailed = false;
            try
            {
                metadata = await extractor.ExtractAsync(BuildSampleText(sample), ct);
            }
            catch (Exception ex)
            {
                log.LogError(ex, "Metadata extract başarısız; manifest fallback.");
                aiFailed = true;
                metadata = new AiExtractedMetadataDto(
                    Title: content.Title,
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

            return Results.Ok(new MetadataExtractResponse(
                version.StorageBucket,
                version.StorageKey,
                version.ManifestEntry,
                version.FileSizeBytes,
                version.Sha256 ?? string.Empty,
                metadata,
                sample.FilesScanned));
        }).RequireAuthorization(Policies.TeacherOrAbove);

        // Faz 1 — AI destekli yükleme (legacy): Guard-önce akış için /bundle-upload + /metadata-extract kullanın.
        // Multipart ZIP/HTML bundle alır, MinIO'ya yazar, LLM metadata döner (Guard beklenmez).
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

    private sealed record BundleUploadAttempt(
        string? Bucket,
        string? Key,
        BundleValidationResult? Validation,
        IResult? Error);

    private static async Task<BundleUploadAttempt> TryUploadBundleAsync(
        IFormFile file,
        Guid userId,
        IMinioClient minio,
        BundleValidator validator,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            return new BundleUploadAttempt(null, null, null, Results.BadRequest(new { error = "Dosya boş veya eksik." }));
        }
        if (file.Length > 50L * 1024 * 1024)
        {
            return new BundleUploadAttempt(null, null, null, Results.BadRequest(new { error = "Dosya 50 MB sınırını aşıyor." }));
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not (".zip" or ".html" or ".htm"))
        {
            return new BundleUploadAttempt(null, null, null, Results.BadRequest(new { error = "Sadece .zip, .html veya .htm yüklenebilir." }));
        }

        await using var input = file.OpenReadStream();
        using var buffer = new MemoryStream();
        await input.CopyToAsync(buffer, ct);
        var bytes = buffer.ToArray();

        const string bucket = "dijitalatolye-content";
        var key = $"{userId:N}/{Guid.NewGuid():N}/{SanitizeFileName(file.FileName)}";

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

        try
        {
            var validation = await validator.ValidateAsync(bucket, key, declaredManifestEntry: null, ct);
            return new BundleUploadAttempt(bucket, key, validation, null);
        }
        catch (BundleValidationException ex)
        {
            return new BundleUploadAttempt(null, null, null, Results.BadRequest(new { error = ex.Message }));
        }
    }

    private static async Task<Stream> OpenStorageObjectAsync(
        IMinioClient minio,
        string bucket,
        string key,
        CancellationToken ct)
    {
        var ms = new MemoryStream();
        await minio.GetObjectAsync(new GetObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithCallbackStream(async (stream, token) =>
            {
                await stream.CopyToAsync(ms, token);
            }), ct);
        ms.Position = 0;
        return ms;
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

    private static async Task TryRemoveObjectAsync(IMinioClient minio, string bucket, string key, CancellationToken ct)
    {
        try
        {
            await minio.RemoveObjectAsync(new RemoveObjectArgs().WithBucket(bucket).WithObject(key), ct);
        }
        catch
        {
            // best-effort: nesne yoksa veya silinemezse içerik silmeyi engellemez.
        }
    }

    private static async Task EnsureBucketAsync(IMinioClient minio, string bucket, CancellationToken ct)
    {
        var exists = await minio.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucket), ct);
        if (!exists)
        {
            await minio.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucket), ct);
        }
    }

    /// <summary>Form/query string'i ContentType'a çevirir; geçersizse Game.</summary>
    private static ContentType ParseContentType(string? value) =>
        Enum.TryParse<ContentType>(value, ignoreCase: true, out var parsed) ? parsed : ContentType.Game;

    /// <summary>Opsiyonel tür filtresi; boş/geçersizse false (filtre uygulanmaz).</summary>
    private static bool TryParseContentType(string? value, out ContentType parsed)
    {
        if (!string.IsNullOrWhiteSpace(value) && Enum.TryParse(value, ignoreCase: true, out parsed))
            return true;
        parsed = default;
        return false;
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
    ContentType Type = ContentType.Game,
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
    ContentType? Type,
    string? Description,
    string? Subject,
    int? GradeLevel,
    string[]? OutcomeCodes,
    string[]? Tags,
    int? TargetAge,
    int? DurationMinutes,
    string? Difficulty,
    string? CoverImageBucket,
    string? CoverImageKey,
    AiSuggestionInput? AiSuggestion = null);

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

public sealed record BundleUploadResponse(
    Guid ContentId,
    Guid VersionId,
    string Bucket,
    string Key,
    string ManifestEntry,
    long FileSizeBytes,
    string Sha256,
    string? GuardScanStatus,
    string Type);

public sealed record ContentProcessingStatusResponse(
    Guid ContentId,
    string State,
    string? GuardScanStatus,
    bool GuardRejected,
    bool CanExtractMetadata);

public sealed record MetadataExtractResponse(
    string Bucket,
    string Key,
    string ManifestEntry,
    long FileSizeBytes,
    string Sha256,
    AiExtractedMetadataDto Metadata,
    int FilesScanned);
