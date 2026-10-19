using System.Net;
using System.Text;
using System.Text.Json;
using DijitalAtolye.AIModeration.API.Llm;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace DijitalAtolye.AIModeration.Tests;

public sealed class EvrenProviderTests
{
    private static EvrenProvider Create(FakeHandler handler, string models = "glm-5.3,deepseek-v4.1-flash") =>
        new(new HttpClient(handler),
            Options.Create(new LlmProviderOptions { EvrenApiKey = "test-key", EvrenModels = models }),
            NullLogger<EvrenProvider>.Instance);

    private static HttpResponseMessage Completion(string content) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(JsonSerializer.Serialize(new
        {
            choices = new[] { new { message = new { content } } },
            usage = new { prompt_tokens = 120, completion_tokens = 40 },
        }), Encoding.UTF8, "application/json"),
    };

    [Fact]
    public async Task Sends_json_mode_request_and_returns_content()
    {
        var handler = new FakeHandler(_ => Completion("{\"score\":82}"));
        var provider = Create(handler);

        var result = await provider.CompleteJsonAsync("sys", "user");

        result.RawJson.Should().Be("{\"score\":82}");
        result.PromptTokens.Should().Be(120);
        result.EstimatedCostUsd.Should().Be(0m);
        provider.Model.Should().Be("glm-5.3");
        var sent = handler.Requests.Single();
        sent.Uri.Should().Be("https://evren-llmapi.ssyz.org.tr/v1/chat/completions");
        sent.Authorization.Should().Be("Bearer test-key");
        using var body = JsonDocument.Parse(sent.Body);
        body.RootElement.GetProperty("model").GetString().Should().Be("glm-5.3");
        body.RootElement.GetProperty("response_format").GetProperty("type").GetString().Should().Be("json_object");
        body.RootElement.GetProperty("chat_template_kwargs").GetProperty("enable_thinking").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task Falls_back_to_next_model_when_one_is_unavailable()
    {
        var handler = new FakeHandler(req => req.Body.Contains("\"glm-5.3\"")
            ? new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
            : Completion("{\"score\":75}"));
        var provider = Create(handler);

        var result = await provider.CompleteJsonAsync("sys", "user");

        result.RawJson.Should().Be("{\"score\":75}");
        provider.Model.Should().Be("deepseek-v4.1-flash");
        handler.Requests.Should().HaveCount(2);
    }

    [Fact]
    public async Task Does_not_try_other_models_when_the_key_is_rejected()
    {
        var handler = new FakeHandler(_ => new HttpResponseMessage(HttpStatusCode.Unauthorized));
        var provider = Create(handler);

        var act = () => provider.CompleteJsonAsync("sys", "user");

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*anahtar*");
        handler.Requests.Should().HaveCount(1);
    }

    [Fact]
    public async Task Throws_when_every_model_fails()
    {
        var handler = new FakeHandler(_ => new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
        var provider = Create(handler);

        var act = () => provider.CompleteJsonAsync("sys", "user");

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*glm-5.3, deepseek-v4.1-flash*");
        handler.Requests.Should().HaveCount(2);
    }

    [Fact]
    public void Provider_option_defaults_to_evren()
    {
        new LlmProviderOptions().UsesEvren.Should().BeTrue();
        new LlmProviderOptions { Provider = "deepseek" }.UsesEvren.Should().BeFalse();
        new LlmProviderOptions { EvrenModels = " a , ,b " }.EvrenModelList.Should().Equal("a", "b");
    }

    private sealed record SentRequest(string Uri, string? Authorization, string Body);

    private sealed class FakeHandler(Func<SentRequest, HttpResponseMessage> respond) : HttpMessageHandler
    {
        public List<SentRequest> Requests { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            var sent = new SentRequest(
                request.RequestUri!.ToString(),
                request.Headers.Authorization?.ToString(),
                request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(ct));
            Requests.Add(sent);
            return respond(sent);
        }
    }
}

public sealed class LlmRegistrationTests
{
    [Theory]
    [InlineData("evren", typeof(EvrenProvider))]
    [InlineData("deepseek", typeof(DeepSeekProvider))]
    public void Registers_provider_from_config_with_valid_resilience_options(string provider, Type expected)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Llm:Provider"] = provider })
            .Build();
        var services = new ServiceCollection()
            .AddLogging()
            .AddModerationLlm(config);
        using var sp = services.BuildServiceProvider();

        // Resolving builds the resilience pipeline, which validates its options (e.g. sampling vs attempt timeout).
        var llm = sp.GetRequiredService<ILlmProvider>();

        llm.Should().BeOfType(expected);
    }
}
