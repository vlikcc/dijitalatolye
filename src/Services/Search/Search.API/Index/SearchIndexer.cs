using DijitalAtolye.Search.API.Domain;
using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.IndexManagement;
using Elastic.Clients.Elasticsearch.Mapping;

namespace DijitalAtolye.Search.API.Index;

public interface ISearchIndexer
{
    Task EnsureIndexAsync(CancellationToken ct = default);
    Task IndexAsync(ContentSearchDocument doc, CancellationToken ct = default);
    Task RemoveAsync(Guid contentId, CancellationToken ct = default);
}

public sealed class ElasticSearchIndexer : ISearchIndexer
{
    public const string IndexName = "contents-tr";

    private readonly ElasticsearchClient _client;
    private readonly ILogger<ElasticSearchIndexer> _logger;

    public ElasticSearchIndexer(ElasticsearchClient client, ILogger<ElasticSearchIndexer> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task EnsureIndexAsync(CancellationToken ct = default)
    {
        var exists = await _client.Indices.ExistsAsync(IndexName, ct);
        if (exists.Exists) return;

        var resp = await _client.Indices.CreateAsync(IndexName, c => c
            .Mappings(m => m
                .Properties<ContentSearchDocument>(p => p
                    .Keyword(k => k.Slug)
                    .Text(t => t.Title)
                    .Text(t => t.Description!)
                    .Keyword(k => k.Subject!)
                    .IntegerNumber(n => n.GradeLevel!)
                    .Keyword(k => k.OutcomeCodes)
                    .Keyword(k => k.Tags)
                    .Keyword(k => k.AuthorName!)
                    .Date(d => d.PublishedAt)
                    .IntegerNumber(n => n.Views)
                    .IntegerNumber(n => n.Likes)
                    .DoubleNumber(n => n.Popularity))), ct);

        if (!resp.IsValidResponse)
            _logger.LogWarning("Index create failed: {Error}", resp.DebugInformation);
    }

    public async Task IndexAsync(ContentSearchDocument doc, CancellationToken ct = default)
    {
        var resp = await _client.IndexAsync(doc, idx => idx.Index(IndexName).Id(doc.Id.ToString()), ct);
        if (!resp.IsValidResponse) _logger.LogWarning("Index doc failed: {Err}", resp.DebugInformation);
    }

    public async Task RemoveAsync(Guid contentId, CancellationToken ct = default) =>
        await _client.DeleteAsync<ContentSearchDocument>(contentId.ToString(), d => d.Index(IndexName), ct);
}
