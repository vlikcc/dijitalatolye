using Microsoft.AspNetCore.DataProtection;

namespace DijitalAtolye.Content.API.Studio;

/// <summary>Kullanıcı EVREN anahtarını DataProtection ile şifreler/çözer. Anahtar düz metin olarak saklanmaz, loglanmaz, istemciye dönmez.</summary>
public sealed class StudioKeyProtector
{
    private readonly IDataProtector _protector;

    public StudioKeyProtector(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("Studio.UserApiKey.v1");
    }

    public string Protect(string apiKey) => _protector.Protect(apiKey);

    public string Unprotect(string encrypted) => _protector.Unprotect(encrypted);

    public static string Last4(string apiKey)
    {
        var trimmed = apiKey.Trim();
        return trimmed.Length <= 4 ? trimmed : trimmed[^4..];
    }
}
