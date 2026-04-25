namespace DijitalAtolye.AIModeration.API.Persistence;

public interface IModerationReportStore
{
    Task SaveAsync(ModerationReport report, CancellationToken ct = default);
    Task<ModerationReport?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ModerationReport?> GetByContentVersionAsync(Guid contentId, Guid versionId, CancellationToken ct = default);
}
