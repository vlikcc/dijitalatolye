using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.Search.API.Domain;
using DijitalAtolye.Search.API.Index;
using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.Aggregations;
using Elastic.Clients.Elasticsearch.QueryDsl;

namespace DijitalAtolye.Search.API.Endpoints;

public static class SearchEndpoints
{
    private static readonly string[] MoreLikeThisFieldNames = ["title", "description", "tags"];
    public static IEndpointRouteBuilder MapSearchEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/search").WithTags("Search");

        g.MapGet("/contents", async (
            string? q,
            string? type,
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

            var mustQueries = BuildMustQueries(q);
            var filters = BuildFilters(type, subject, gradeLevel, outcome, tag);

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
                .Aggregations(a => a
                    .Add("types", agg => agg.Terms(t => t.Field(f => f.Type).Size(5)))
                    .Add("subjects", agg => agg.Terms(t => t.Field(f => f.Subjects).Size(20)))
                    .Add("gradeLevels", agg => agg.Terms(t => t.Field(f => f.GradeLevels).Size(12)))
                    .Add("tags", agg => agg.Terms(t => t.Field(f => f.Tags).Size(30)))
                    .Add("outcomes", agg => agg.Terms(t => t.Field(f => f.OutcomeCodes).Size(40))))
                .Sort(so => so.Field(f => f.Popularity, fs => fs.Order(Elastic.Clients.Elasticsearch.SortOrder.Desc))), ct);

            if (!resp.IsValidResponse)
            {
                return Results.Problem(
                    detail: resp.DebugInformation,
                    statusCode: StatusCodes.Status503ServiceUnavailable,
                    title: "Arama servisi geçici olarak kullanılamıyor");
            }

            return Results.Ok(new
            {
                total = resp.Total,
                page,
                pageSize,
                items = resp.Documents ?? [],
                facets = ExtractFacets(resp.Aggregations),
            });
        });

        g.MapGet("/contents/{slug}", async (string slug, ElasticsearchClient client, CancellationToken ct) =>
        {
            // Otomatik oluşturulan indekslerde slug genelde text+keyword alt alanıdır; tam eşleşme için .keyword gerekir.
            var resp = await client.SearchAsync<ContentSearchDocument>(s => s
                .Index(ElasticSearchIndexer.IndexName)
                .Size(1)
                .Query(q => q.Bool(b => b.Should(
                    sh => sh.Term(t => t.Field(new Field("slug.keyword")).Value(slug)),
                    sh => sh.Term(t => t.Field(f => f.Slug).Value(slug))))), ct);

            if (!resp.IsValidResponse)
            {
                return Results.Problem(
                    detail: resp.DebugInformation,
                    statusCode: StatusCodes.Status503ServiceUnavailable,
                    title: "Arama servisi geçici olarak kullanılamıyor");
            }

            var doc = resp.Documents?.FirstOrDefault();
            return doc is null ? Results.NotFound() : Results.Ok(doc);
        });

        g.MapGet("/more-like-this/{contentId:guid}", async (
            Guid contentId,
            int? size,
            ElasticsearchClient client,
            CancellationToken ct) =>
        {
            var take = size is null or <= 0 or > 20 ? 8 : size.Value;

            var resp = await client.SearchAsync<ContentSearchDocument>(s => s
                .Index(ElasticSearchIndexer.IndexName)
                .Size(take)
                .Query(q => q.Bool(b => b
                    .Must(m => m.MoreLikeThis(mlt => mlt
                        .Fields(MoreLikeThisFieldNames)
                        .Like(
                        [
                            new Like(new LikeDocument
                            {
                                Index = ElasticSearchIndexer.IndexName,
                                Id = contentId.ToString(),
                            }),
                        ])
                        .MinTermFreq(1)
                        .MinDocFreq(1)
                        .MaxQueryTerms(25)))
                    .MustNot(mn => mn.Ids(ids => ids.Values(contentId.ToString())))))
                .Sort(so => so.Field(f => f.Popularity, fs => fs.Order(SortOrder.Desc))), ct);

            return Results.Ok(new
            {
                contentId,
                items = resp.Documents,
            });
        });

        g.MapPost("/admin/reindex", async (ISearchIndexer indexer, CancellationToken ct) =>
        {
            var result = await indexer.ReindexAsync(ct);
            return Results.Ok(new
            {
                indexed = result.Indexed,
                indexRecreated = result.IndexRecreated,
            });
        }).RequireAuthorization(Policies.AdminOnly);

        return app;
    }

    private static List<Action<QueryDescriptor<ContentSearchDocument>>> BuildMustQueries(string? q)
    {
        var mustQueries = new List<Action<QueryDescriptor<ContentSearchDocument>>>();
        if (!string.IsNullOrWhiteSpace(q))
        {
            mustQueries.Add(qd => qd.MultiMatch(mm => mm
                .Query(q!)
                .Fields(new[] { "title^3", "description", "tags^2" })
                .Fuzziness(new Fuzziness("AUTO"))));
        }

        return mustQueries;
    }

    private static List<Action<QueryDescriptor<ContentSearchDocument>>> BuildFilters(
        string? type,
        string? subject,
        int? gradeLevel,
        string? outcome,
        string? tag)
    {
        var filters = new List<Action<QueryDescriptor<ContentSearchDocument>>>();
        if (!string.IsNullOrWhiteSpace(type))
            filters.Add(qd => qd.Term(t => t.Field(f => f.Type).Value(type!)));
        if (!string.IsNullOrWhiteSpace(subject))
            filters.Add(qd => qd.Term(t => t.Field(f => f.Subjects).Value(subject!)));
        if (gradeLevel is not null)
            filters.Add(qd => qd.Term(t => t.Field(f => f.GradeLevels).Value(gradeLevel.Value)));
        if (!string.IsNullOrWhiteSpace(outcome))
            filters.Add(qd => qd.Term(t => t.Field(f => f.OutcomeCodes).Value(outcome!)));
        if (!string.IsNullOrWhiteSpace(tag))
            filters.Add(qd => qd.Term(t => t.Field(f => f.Tags).Value(tag!)));

        return filters;
    }

    private static object ExtractFacets(AggregateDictionary? aggregations)
    {
        if (aggregations is null)
        {
            return new
            {
                types = Array.Empty<object>(),
                subject = Array.Empty<object>(),
                gradeLevel = Array.Empty<object>(),
                tags = Array.Empty<object>(),
                outcome = Array.Empty<object>(),
            };
        }

        return new
        {
            types = ExtractTerms(aggregations, "types"),
            subject = ExtractTerms(aggregations, "subjects"),
            gradeLevel = ExtractTerms(aggregations, "gradeLevels"),
            tags = ExtractTerms(aggregations, "tags"),
            outcome = ExtractTerms(aggregations, "outcomes"),
        };
    }

    private static IEnumerable<object> ExtractTerms(AggregateDictionary aggregations, string name)
    {
        if (!aggregations.TryGetValue(name, out var aggregate))
            return [];

        return aggregate switch
        {
            StringTermsAggregate str => str.Buckets.Select(b => new { value = b.Key, count = b.DocCount }),
            LongTermsAggregate lng => lng.Buckets.Select(b => new { value = b.Key, count = b.DocCount }),
            _ => [],
        };
    }
}
