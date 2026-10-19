using System.Threading.Channels;

namespace DijitalAtolye.Content.API.Studio;

/// <summary>Üretim turlarının süreç içi kuyruğu. Kalıcılık DB'dedir: yeniden başlatmada Queued turlar tekrar kuyruğa alınır.</summary>
public sealed class GameGenerationQueue
{
    private readonly Channel<Guid> _channel = Channel.CreateUnbounded<Guid>(new UnboundedChannelOptions
    {
        SingleReader = true,
    });

    public void Enqueue(Guid turnId) => _channel.Writer.TryWrite(turnId);

    public IAsyncEnumerable<Guid> ReadAllAsync(CancellationToken ct) => _channel.Reader.ReadAllAsync(ct);
}
