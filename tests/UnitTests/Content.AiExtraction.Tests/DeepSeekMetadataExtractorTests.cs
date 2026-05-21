using System.Net;
using System.Text;
using System.Text.Json;
using DijitalAtolye.Content.API.AiExtraction;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using Xunit;

namespace DijitalAtolye.Content.API.AiExtraction.Tests;

public sealed class DeepSeekMetadataExtractorTests
{
    [Fact]
    public async Task ExtractAsync_TwoPhase_ReturnsMergedMetadataAndFiltersHallucinatedCodes()
    {
        var draftJson = """
        {
          "title": "Kesirler Etkileşimli Ders",
          "description": "Pizza dilimleri üzerinden kesir kavramı.",
          "subject": "Matematik",
          "gradeLevel": 5,
          "durationMinutes": 25,
          "difficulty": "kolay",
          "tags": ["matematik", "Kesirler", "oyun"],
          "confidence": 0.83
        }
        """;
        var outcomesJson = """{"outcomeCodes":["M.5.1.1.1","UYDURMA.9.9.9"]}""";

        var handler = new ScriptedHandler([Ok(draftJson), Ok(outcomesJson)]);
        var http = new HttpClient(handler);

        var catalog = Substitute.For<ICatalogOutcomeProvider>();
        catalog.GetAsync("Matematik", 5, Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(new List<CatalogOutcomeDto>
            {
                new("M.5.1.1.1", "Doğal sayıları okur ve yazar."),
                new("M.5.1.1.2", "Basamak değerini belirler."),
            });

        var sut = NewSut(http, catalog);

        var result = await sut.ExtractAsync("örnek metin", CancellationToken.None);

        result.Title.Should().Be("Kesirler Etkileşimli Ders");
        result.Subject.Should().Be("Matematik");
        result.GradeLevel.Should().Be(5);
        result.DurationMinutes.Should().Be(25);
        result.Difficulty.Should().Be("Easy");
        result.OutcomeCodes.Should().ContainSingle().Which.Should().Be("M.5.1.1.1");
        result.Tags.Should().BeEquivalentTo(new[] { "matematik", "kesirler", "oyun" });
        result.Confidence.Should().BeApproximately(0.83, 0.001);
        result.CandidateOutcomeCount.Should().Be(2);
        result.RawDraftResponse.Should().NotBeNull();
        result.RawOutcomesResponse.Should().NotBeNull();

        handler.CallCount.Should().Be(2, "iki aşamalı çağrı: draft + outcomes");
        await catalog.Received(1).GetAsync("Matematik", 5, Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ExtractAsync_SkipsOutcomeCallWhenSubjectAndGradeAreNull()
    {
        var draftJson = """{"title":"X","subject":null,"gradeLevel":null,"tags":[],"confidence":0.1}""";
        var handler = new ScriptedHandler([Ok(draftJson)]);
        var http = new HttpClient(handler);

        var catalog = Substitute.For<ICatalogOutcomeProvider>();
        var sut = NewSut(http, catalog);

        var result = await sut.ExtractAsync("metin", CancellationToken.None);

        result.OutcomeCodes.Should().BeEmpty();
        result.CandidateOutcomeCount.Should().Be(0);
        handler.CallCount.Should().Be(1, "subject ve grade yoksa ikinci LLM çağrısı yapılmamalı");
        await catalog.DidNotReceive().GetAsync(Arg.Any<string?>(), Arg.Any<int?>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ExtractAsync_SkipsOutcomeCallWhenCatalogIsEmpty()
    {
        var draftJson = """{"subject":"Matematik","gradeLevel":5,"tags":[],"confidence":0.5}""";
        var handler = new ScriptedHandler([Ok(draftJson)]);
        var http = new HttpClient(handler);

        var catalog = Substitute.For<ICatalogOutcomeProvider>();
        catalog.GetAsync(Arg.Any<string?>(), Arg.Any<int?>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(Array.Empty<CatalogOutcomeDto>());

        var sut = NewSut(http, catalog);

        var result = await sut.ExtractAsync("metin", CancellationToken.None);

        result.OutcomeCodes.Should().BeEmpty();
        result.CandidateOutcomeCount.Should().Be(0);
        handler.CallCount.Should().Be(1, "katalog boşsa outcome çağrısı yapılmamalı");
    }

    [Fact]
    public async Task ExtractAsync_OutcomeParseFailure_DoesNotFailWholeRequest()
    {
        var draftJson = """{"subject":"Matematik","gradeLevel":5,"tags":[],"confidence":0.7}""";
        var handler = new ScriptedHandler([Ok(draftJson), Ok("{bozuk")]);
        var http = new HttpClient(handler);

        var catalog = Substitute.For<ICatalogOutcomeProvider>();
        catalog.GetAsync("Matematik", 5, Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(new List<CatalogOutcomeDto> { new("M.5.1.1.1", "test") });

        var sut = NewSut(http, catalog);

        var result = await sut.ExtractAsync("metin", CancellationToken.None);

        result.Subject.Should().Be("Matematik");
        result.OutcomeCodes.Should().BeEmpty();
        result.CandidateOutcomeCount.Should().Be(1);
    }

    [Fact]
    public async Task ExtractAsync_InvalidDraftJson_Throws()
    {
        var handler = new ScriptedHandler([Ok("{bozuk")]);
        var http = new HttpClient(handler);
        var sut = NewSut(http, Substitute.For<ICatalogOutcomeProvider>());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.ExtractAsync("metin", CancellationToken.None));
    }

    [Fact]
    public async Task ExtractAsync_NonSuccessHttpStatus_Throws()
    {
        var handler = new ScriptedHandler([new HttpResponseMessage(HttpStatusCode.InternalServerError)
        {
            Content = new StringContent("error", Encoding.UTF8, "text/plain"),
        }]);
        var http = new HttpClient(handler);
        var sut = NewSut(http, Substitute.For<ICatalogOutcomeProvider>());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.ExtractAsync("metin", CancellationToken.None));
    }

    private static DeepSeekMetadataExtractor NewSut(HttpClient http, ICatalogOutcomeProvider catalog) =>
        new(http,
            Options.Create(new DeepSeekExtractorOptions { Endpoint = "https://example.com/v1", ApiKey = "test", Model = "deepseek-chat" }),
            catalog,
            NullLogger<DeepSeekMetadataExtractor>.Instance);

    private static HttpResponseMessage Ok(string modelContent)
    {
        var payload = new
        {
            choices = new[] { new { message = new { role = "assistant", content = modelContent } } },
            usage = new { prompt_tokens = 0, completion_tokens = 0 },
        };
        var body = JsonSerializer.Serialize(payload);
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };
    }

    private sealed class ScriptedHandler : HttpMessageHandler
    {
        private readonly Queue<HttpResponseMessage> _queue;
        public int CallCount { get; private set; }
        public ScriptedHandler(IEnumerable<HttpResponseMessage> responses) => _queue = new Queue<HttpResponseMessage>(responses);

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            if (_queue.Count == 0)
            {
                throw new InvalidOperationException($"Beklenenden fazla HTTP çağrısı (#{CallCount}).");
            }
            return Task.FromResult(_queue.Dequeue());
        }
    }
}
