using DijitalAtolye.Search.API.Domain;
using DijitalAtolye.Search.API.Index;
using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.QueryDsl;

namespace DijitalAtolye.Search.API.Endpoints;

public static class SearchEndpoints
{
    public static IEndpointRouteBuilder MapSearchEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/search").WithTags("Search");

        g.MapGet("/contents", async (
            string? q,
            string? subject,
            int? gradeLevel,
            string? outcome,
            string? tag,
            int page,
            int pageSize,
            ElasticsearchClient client,
            CancellationToken ct) =>
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize is <= 0 or > 50 ? 20 : pageSize;
            var from = (page - 1) * pageSize;

            var mustQueries = new List<Action<QueryDescriptor<ContentSearchDocument>>>();
            if (!string.IsNullOrWhiteSpace(q))
            {
                mustQueries.Add(qd => qd.MultiMatch(mm => mm
                    .Query(q!)
                    .Fields(new[] { "title^3", "description", "tags^2" })
                    .Fuzziness(new Fuzziness("AUTO"))));
            }

            var filters = new List<Action<QueryDescriptor<ContentSearchDocument>>>();
            if (!string.IsNullOrWhiteSpace(subject))
                filters.Add(qd => qd.Term(t => t.Field(f => f.Subject).Value(subject!)));
            if (gradeLevel is not null)
                filters.Add(qd => qd.Term(t => t.Field(f => f.GradeLevel).Value(gradeLevel.Value)));
            if (!string.IsNullOrWhiteSpace(outcome))
                filters.Add(qd => qd.Term(t => t.Field(f => f.OutcomeCodes).Value(outcome!)));
            if (!string.IsNullOrWhiteSpace(tag))
                filters.Add(qd => qd.Term(t => t.Field(f => f.Tags).Value(tag!)));

            var resp = await client.SearchAsync<ContentSearchDocument>(s => s
                .Index(ElasticSearchIndexer.IndexName)
                .From(from)
                .Size(pageSize)
                .Query(qd => qd.Bool(b =>
                {
                    if (mustQueries.Count > 0) b.Must(mustQueries.ToArray());
                    else b.Must(m => m.MatchAll(_ => { }));
                    if (filters.Count > 0) b.Filter(filters.ToArray());
                }))
                .Sort(so => so.Field(f => f.Popularity, fs => fs.Order(Elastic.Clients.Elasticsearch.SortOrder.Desc))), ct);

            return Results.Ok(new
            {
                total = resp.Total,
                page,
                pageSize,
                items = resp.Documents,
            });
        });

        g.MapGet("/contents/{slug}", async (string slug, ElasticsearchClient client, CancellationToken ct) =>
        {
            var resp = await client.SearchAsync<ContentSearchDocument>(s => s
                .Index(ElasticSearchIndexer.IndexName)
                .Size(1)
                .Query(q => q.Term(t => t.Field(f => f.Slug).Value(slug))), ct);
            var doc = resp.Documents.FirstOrDefault();
            return doc is null ? Results.NotFound() : Results.Ok(doc);
        });

        return app;
    }
}
