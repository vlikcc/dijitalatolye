using Microsoft.AspNetCore.Identity;

namespace DijitalAtolye.Identity.Domain.Entities;

/// <summary>
/// Identity Service'in birincil kullanıcı kayıt entity'si. ASP.NET Identity'i extend eder.
/// Profil bilgileri (branş, okul, il vb.) User Service'te tutulur (sınır ayrımı).
/// </summary>
public sealed class ApplicationUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAtUtc { get; set; }

    public bool IsLocked { get; set; }

    /// <summary>MEB e-posta doğrulaması (öğretmen rolü için).</summary>
    public bool MebEmailVerified { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
