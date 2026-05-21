using System.Security.Cryptography;
using System.Text;

namespace DijitalAtolye.Storage.API.Guard;

/// <summary>
/// Guard ile paylaşılan HMAC-SHA256 imza sözleşmesini uygular.
/// İmzalanan metin: <c>METHOD\nPATH\nTIMESTAMP\nNONCE\nSHA256_HEX(body)</c>.
/// Multipart body için hash, HTTP client'in göndereceği raw byte'lar üzerinden alınır.
/// </summary>
public sealed class GuardSignatureService
{
    private const int NonceByteLength = 16;

    public string ComputeBodySha256Hex(ReadOnlySpan<byte> body)
    {
        Span<byte> hash = stackalloc byte[SHA256.HashSizeInBytes];
        SHA256.HashData(body, hash);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public async Task<string> ComputeBodySha256HexAsync(Stream body, CancellationToken ct = default)
    {
        using var sha = SHA256.Create();
        var hash = await sha.ComputeHashAsync(body, ct);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public string NewNonce()
    {
        Span<byte> bytes = stackalloc byte[NonceByteLength];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public string Sign(string secret, string method, string path, string timestamp, string nonce, string bodySha256Hex)
    {
        var message = string.Join('\n', method.ToUpperInvariant(), path, timestamp, nonce, bodySha256Hex);
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var signature = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
        return Convert.ToBase64String(signature);
    }

    /// <summary>
    /// Constant-time signature comparison for callback verification.
    /// </summary>
    public bool Verify(string secret, string method, string path, string timestamp, string nonce,
        string bodySha256Hex, string providedSignatureBase64)
    {
        var expected = Sign(secret, method, path, timestamp, nonce, bodySha256Hex);
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var providedBytes = Encoding.UTF8.GetBytes(providedSignatureBase64);
        return CryptographicOperations.FixedTimeEquals(expectedBytes, providedBytes);
    }

    public bool IsTimestampFresh(string timestampHeader, int skewSeconds)
    {
        if (!long.TryParse(timestampHeader, out var ts)) return false;
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        return Math.Abs(now - ts) <= skewSeconds;
    }

    /// <summary>
    /// Guard delivery client'ının multipart imzasında kullandığı gövde hash'i:
    /// <c>SHA256( SHA256_hex(file + sorted_metadata_json).encode('utf-8') )</c>.
    /// </summary>
    public string ComputeDeliverySignedBodyHash(string compositeSha256Hex)
        => ComputeBodySha256Hex(Encoding.UTF8.GetBytes(compositeSha256Hex));
}
