using MongoDB.Driver;

namespace DijitalAtolye.AIModeration.API.Persistence;

public sealed class MongoModerationReportStore : IModerationReportStore
{
    private readonly IMongoCollection<ModerationReport> _col;

    public MongoModerationReportStore(IMongoDatabase database)
    {
        _col = database.GetCollection<ModerationReport>("moderation_reports");
        _col.Indexes.CreateMany(
        [
            new CreateIndexModel<ModerationReport>(Builders<ModerationReport>.IndexKeys.Ascending(r => r.ContentId)),
            new CreateIndexModel<ModerationReport>(Builders<ModerationReport>.IndexKeys
                .Ascending(r => r.ContentId).Ascending(r => r.VersionId), new CreateIndexOptions { Unique = true }),
        ]);
    }

    public Task SaveAsync(ModerationReport report, CancellationToken ct = default) =>
        _col.InsertOneAsync(report, cancellationToken: ct);

    public async Task<ModerationReport?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _col.Find(r => r.Id == id).FirstOrDefaultAsync(ct);

    public async Task<ModerationReport?> GetByContentVersionAsync(Guid contentId, Guid versionId, CancellationToken ct = default) =>
        await _col.Find(r => r.ContentId == contentId && r.VersionId == versionId).FirstOrDefaultAsync(ct);

    public async Task<ModerationStats> GetStatsSinceAsync(DateTime sinceUtc, CancellationToken ct = default)
    {
        var rows = await _col.Find(r => r.AnalyzedAtUtc >= sinceUtc)
            .Project(r => new { r.PromptTokens, r.CompletionTokens, r.EstimatedCostUsd })
            .ToListAsync(ct);
        return new ModerationStats(
            rows.Count,
            rows.Sum(r => (long)r.PromptTokens),
            rows.Sum(r => (long)r.CompletionTokens),
            rows.Sum(r => r.EstimatedCostUsd));
    }
}
