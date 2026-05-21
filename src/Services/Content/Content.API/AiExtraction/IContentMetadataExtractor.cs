namespace DijitalAtolye.Content.API.AiExtraction;

/// <summary>
/// Bundle metni üzerinden LLM ile metadata önerisi üreten servis.
/// İki aşamalı çağrı yapar: önce subject/grade dahil draft, sonra subject+grade
/// filtreli kazanım listesinden uygun kodları seçer. Yalnızca öneri döner.
/// </summary>
public interface IContentMetadataExtractor
{
    Task<AiExtractedMetadataDto> ExtractAsync(string sampledText, CancellationToken ct);
}

public sealed record AiExtractedMetadataDto(
    string? Title,
    string? Description,
    string? Subject,
    int? GradeLevel,
    int? DurationMinutes,
    string? Difficulty,
    IReadOnlyList<string> OutcomeCodes,
    IReadOnlyList<string> Tags,
    double Confidence,
    int CandidateOutcomeCount,
    string? RawDraftResponse,
    string? RawOutcomesResponse);

public sealed record CatalogOutcomeDto(string Code, string Description);
