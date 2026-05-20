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
    Task<ReindexResult> ReindexAsync(CancellationToken ct = default);
}

public sealed record ReindexResult(int Indexed, bool IndexRecreated);

public sealed class ElasticSearchIndexer : ISearchIndexer
{
    public const string IndexName = "contents-tr";
    public const string TurkishAnalyzer = "turkish_folded";

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

        await CreateIndexAsync(ct);
    }

    public async Task IndexAsync(ContentSearchDocument doc, CancellationToken ct = default)
    {
        var resp = await _client.IndexAsync(doc, idx => idx.Index(IndexName).Id(doc.Id.ToString()), ct);
        if (!resp.IsValidResponse) _logger.LogWarning("Index doc failed: {Err}", resp.DebugInformation);
    }

    public async Task RemoveAsync(Guid contentId, CancellationToken ct = default) =>
        await _client.DeleteAsync<ContentSearchDocument>(contentId.ToString(), d => d.Index(IndexName), ct);

    public async Task<ReindexResult> ReindexAsync(CancellationToken ct = default)
    {
        var docs = await FetchAllDocumentsAsync(ct);
        var existed = (await _client.Indices.ExistsAsync(IndexName, ct)).Exists;

        if (existed)
        {
            var deleteResp = await _client.Indices.DeleteAsync(IndexName, ct);
            if (!deleteResp.IsValidResponse)
                _logger.LogWarning("Index delete failed: {Error}", deleteResp.DebugInformation);
        }

        await CreateIndexAsync(ct);

        if (docs.Count == 0)
            return new ReindexResult(0, true);

        var bulkResp = await _client.BulkAsync(b =>
        {
            b.Index(IndexName);
            foreach (var doc in docs)
                b.Index(doc);
        }, ct);

        if (!bulkResp.IsValidResponse)
            _logger.LogWarning("Bulk reindex failed: {Error}", bulkResp.DebugInformation);

        return new ReindexResult(docs.Count, true);
    }

    private async Task<List<ContentSearchDocument>> FetchAllDocumentsAsync(CancellationToken ct)
    {
        var exists = await _client.Indices.ExistsAsync(IndexName, ct);
        if (!exists.Exists) return [];

        const int pageSize = 500;
        var docs = new List<ContentSearchDocument>();
        var from = 0;

        while (true)
        {
            var resp = await _client.SearchAsync<ContentSearchDocument>(s => s
                .Index(IndexName)
                .From(from)
                .Size(pageSize)
                .Query(q => q.MatchAll(_ => { })), ct);

            if (!resp.IsValidResponse || resp.Documents.Count == 0)
                break;

            docs.AddRange(resp.Documents);
            if (resp.Documents.Count < pageSize)
                break;

            from += pageSize;
        }

        return docs;
    }

    private async Task CreateIndexAsync(CancellationToken ct)
    {
        var resp = await _client.Indices.CreateAsync(IndexName, c => c
            .Settings(s => s
                .Analysis(a => a
                    .Analyzers(an => an
                        .Custom(TurkishAnalyzer, ca => ca
                            .Tokenizer("standard")
                            .Filter(["turkish_lowercase", "asciifolding"])))))
            .Mappings(m => m
                .Properties<ContentSearchDocument>(p => p
                    .Keyword(k => k.Slug)
                    .Text(t => t.Title, td => td.Analyzer(TurkishAnalyzer))
                    .Text(t => t.Description!, td => td.Analyzer(TurkishAnalyzer))
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
}
