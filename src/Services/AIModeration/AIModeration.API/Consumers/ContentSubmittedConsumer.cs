using DijitalAtolye.AIModeration.API.Pipeline;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Content;
using MassTransit;

namespace DijitalAtolye.AIModeration.API.Consumers;

public sealed class ContentSubmittedConsumer : IConsumer<ContentSubmittedV1>
{
    private readonly ModerationPipeline _pipeline;
    private readonly IPublishEndpoint _publish;
    private readonly ILogger<ContentSubmittedConsumer> _logger;

    public ContentSubmittedConsumer(ModerationPipeline pipeline, IPublishEndpoint publish, ILogger<ContentSubmittedConsumer> logger)
    {
        _pipeline = pipeline;
        _publish = publish;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ContentSubmittedV1> context)
    {
        _logger.LogInformation("Moderation start: content={Content} version={Version}",
            context.Message.ContentId, context.Message.VersionId);

        var (evt, _) = await _pipeline.AnalyzeAsync(context.Message, context.CancellationToken);
        await _publish.Publish(evt, context.CancellationToken);
    }
}
