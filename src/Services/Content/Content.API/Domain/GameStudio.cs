namespace DijitalAtolye.Content.API.Domain;

/// <summary>
/// AI Oyun Stüdyosu oturumu: öğretmenin bir oyun fikri etrafında EVREN ile yaptığı üretim/revizyon sohbeti.
/// Gönderildiğinde seçili turun HTML'i normal bir <see cref="Content"/> taslağına dönüşür ve onay akışına girer.
/// </summary>
public sealed class GameStudioSession
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public required Guid OwnerUserId { get; init; }

    public required string Title { get; set; }

    /// <summary>İlk oyun fikri / açıklaması (her turda bağlam olarak modele verilir).</summary>
    public required string Idea { get; set; }

    public List<string> Subjects { get; set; } = [];

    public List<int> GradeLevels { get; set; } = [];

    public List<string> OutcomeCodes { get; set; } = [];

    /// <summary>Son kullanılan model; yeni turlar aksi belirtilmezse bunu kullanır.</summary>
    public required string Model { get; set; }

    public StudioKeySource KeySource { get; set; } = StudioKeySource.Platform;

    /// <summary>Önizlenen / gönderilecek sürüm (başarılı bir tur). Revizyonlar bu sürümün üstüne yapılır.</summary>
    public Guid? SelectedTurnId { get; set; }

    /// <summary>Gönderildikten sonra oluşan içerik. Gönderilmiş oturumda yeni tur açılmaz.</summary>
    public Guid? ContentId { get; set; }

    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<GameStudioTurn> Turns { get; init; } = [];
}

/// <summary>Stüdyo oturumundaki tek bir üretim isteği ve sonucu (oyunun bir sürümü).</summary>
public sealed class GameStudioTurn
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public required Guid SessionId { get; init; }

    /// <summary>Kota sayımı için oturum sahibinin kopyası.</summary>
    public required Guid OwnerUserId { get; init; }

    public required int Seq { get; init; }

    public required string UserPrompt { get; init; }

    public StudioTurnStatus Status { get; set; } = StudioTurnStatus.Queued;

    public required string Model { get; init; }

    public StudioKeySource KeySource { get; init; }

    public string? Html { get; set; }

    public string? ChangeSummary { get; set; }

    public string? Error { get; set; }

    /// <summary>Akış sırasında alınan karakter sayısı (ilerleme göstergesi).</summary>
    public int ProgressChars { get; set; }

    public int PromptTokens { get; set; }

    public int CompletionTokens { get; set; }

    /// <summary>Önizleme kopyasının published bucket içindeki anahtarı.</summary>
    public string? PreviewKey { get; set; }

    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;

    public DateTime? StartedAtUtc { get; set; }

    public DateTime? CompletedAtUtc { get; set; }
}

/// <summary>Öğretmenin kendi EVREN API anahtarı (DataProtection ile şifreli).</summary>
public sealed class UserAiCredential
{
    public required Guid UserId { get; init; }

    public string Provider { get; init; } = "evren";

    public required string EncryptedApiKey { get; set; }

    public required string KeyLast4 { get; set; }

    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

public enum StudioKeySource
{
    Platform = 0,
    User = 1,
}

public enum StudioTurnStatus
{
    Queued = 0,
    Running = 1,
    Succeeded = 2,
    Failed = 3,
}

/// <summary>İçeriğin nasıl oluşturulduğu (editör ekranında rozet olarak gösterilir).</summary>
public enum ContentSource
{
    Upload = 0,
    AiStudio = 1,
}
