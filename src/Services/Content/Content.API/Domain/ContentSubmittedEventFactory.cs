using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;

namespace DijitalAtolye.Content.API.Domain;

public static class ContentSubmittedEventFactory
{
    public static ContentSubmittedV1 Create(Domain.Content content, ContentVersion version) =>
        new()
        {
            ContentId = content.Id,
            VersionId = version.Id,
            AuthorUserId = content.AuthorUserId,
            ManifestEntry = version.ManifestEntry,
            StorageKey = version.StorageKey,
            Title = content.Title,
            OutcomeCodes = content.OutcomeCodes.AsReadOnly(),
            Tags = content.Tags.AsReadOnly(),
            GradeLevels = content.GradeLevels.AsReadOnly(),
            Subjects = content.Subjects.AsReadOnly(),
        };
}
