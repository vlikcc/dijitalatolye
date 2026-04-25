namespace DijitalAtolye.BuildingBlocks.Common.Time;

/// <summary>
/// Test edilebilir zaman soyutlaması. Domain ve Application katmanları
/// <c>DateTime.UtcNow</c> yerine bunu kullanır.
/// </summary>
public interface IDateTimeProvider
{
    DateTime UtcNow { get; }

    DateOnly TodayUtc => DateOnly.FromDateTime(UtcNow);
}

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}
