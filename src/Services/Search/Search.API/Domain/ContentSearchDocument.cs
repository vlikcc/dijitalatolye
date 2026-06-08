namespace DijitalAtolye.Search.API.Domain;

public sealed class ContentSearchDocument
{
    public Guid Id { get; set; }
    public Guid ContentId { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public required string Slug { get; set; }
    /// <summary>İçerik türü: Game | DigitalContent | EBook (keyword filtresi).</summary>
    public string? Type { get; set; }
    public string? Subject { get; set; }
    public int? GradeLevel { get; set; }
    public IReadOnlyCollection<string> OutcomeCodes { get; set; } = [];
    public IReadOnlyCollection<string> Tags { get; set; } = [];
    public string? AuthorName { get; set; }
    public DateTime PublishedAt { get; set; }
    public int Views { get; set; }
    public int Likes { get; set; }
    public double Popularity { get; set; }
}
