using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace DijitalAtolye.Storage.API.Guard;

public interface IGuardClient
{
    /// <summary>
    /// Bir dosyayı Guard'a tarama için yükler. Guard <c>202 Accepted</c> ile birlikte
    /// <see cref="GuardUploadResponse"/> döner; ana site bu kaydı kendi <c>ContentVersion</c>'ında saklamalıdır.
    /// </summary>
    Task<GuardUploadResponse> UploadAsync(GuardUploadRequest request, CancellationToken ct = default);
}

public sealed record GuardUploadRequest(
    Stream Content,
    string OriginalFileName,
    string ExpectedSha256Hex,
    string SourceContentId,
    string? UploadedByExternalId = null);

public sealed record GuardUploadResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("sha256")] string Sha256,
    [property: JsonPropertyName("file_size")] long FileSize);

public sealed class GuardClient : IGuardClient
{
    private const string UploadPath = "/api/v1/uploads/from-main-site/";

    private readonly HttpClient _http;
    private readonly GuardSignatureService _signer;
    private readonly GuardOptions _options;
    private readonly ILogger<GuardClient> _logger;

    public GuardClient(HttpClient http, GuardSignatureService signer, IOptions<GuardOptions> options, ILogger<GuardClient> logger)
    {
        _http = http;
        _signer = signer;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<GuardUploadResponse> UploadAsync(GuardUploadRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.Secret))
        {
            throw new InvalidOperationException("Guard:Secret yapılandırılmamış. HMAC imzasız istek gönderilemez.");
        }
        if (string.IsNullOrWhiteSpace(_options.SourceId))
        {
            throw new InvalidOperationException("Guard:SourceId yapılandırılmamış.");
        }

        // Multipart body'sini bellekte oluşturuyoruz çünkü HMAC imzasını body byte'ları üzerinden almamız gerek.
        // 256 MB max upload limiti pratik üst sınır (Guard tarafı aynısını uygular).
        using var bodyStream = new MemoryStream();
        using (var multipart = new MultipartFormDataContent($"guard-{Guid.NewGuid():N}"))
        {
            multipart.Add(new StringContent(request.SourceContentId), "source_content_id");
            multipart.Add(new StringContent(request.OriginalFileName), "original_filename");
            multipart.Add(new StringContent(request.ExpectedSha256Hex), "expected_sha256");
            if (!string.IsNullOrWhiteSpace(request.UploadedByExternalId))
            {
                multipart.Add(new StringContent(request.UploadedByExternalId), "uploaded_by_external_id");
            }

            var fileContent = new StreamContent(request.Content);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            multipart.Add(fileContent, "file", request.OriginalFileName);

            await multipart.CopyToAsync(bodyStream, ct);
        }

        var bodyBytes = bodyStream.ToArray();
        var bodyHashHex = _signer.ComputeBodySha256Hex(bodyBytes);
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var nonce = _signer.NewNonce();
        var signature = _signer.Sign(_options.Secret, "POST", UploadPath, timestamp, nonce, bodyHashHex);

        using var http = new HttpRequestMessage(HttpMethod.Post, UploadPath)
        {
            Content = new ByteArrayContent(bodyBytes),
        };
        // Re-derive the boundary from the original multipart header to keep the server-side parser happy.
        // We rebuilt the body so we can hash + sign it, but the Content-Type with the boundary stays the same.
        http.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(GetMultipartContentType(bodyBytes));
        http.Headers.Add("X-Guard-Source", _options.SourceId);
        http.Headers.Add("X-Guard-Timestamp", timestamp);
        http.Headers.Add("X-Guard-Nonce", nonce);
        http.Headers.Add("X-Guard-Signature", signature);

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(_options.UploadTimeout);

        var response = await _http.SendAsync(http, HttpCompletionOption.ResponseHeadersRead, cts.Token);
        var responseBody = await response.Content.ReadAsStringAsync(cts.Token);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Guard upload başarısız: HTTP {Status} Body={Body}",
                (int)response.StatusCode, Truncate(responseBody, 500));
            throw new HttpRequestException($"Guard upload failed with HTTP {(int)response.StatusCode}");
        }

        var parsed = JsonSerializer.Deserialize<GuardUploadResponse>(responseBody)
            ?? throw new InvalidOperationException("Guard upload response parse edilemedi.");

        _logger.LogInformation("Guard upload kabul edildi: GuardFileId={Id} Status={Status} Size={Size}",
            parsed.Id, parsed.Status, parsed.FileSize);

        return parsed;
    }

    private static string GetMultipartContentType(byte[] bodyBytes)
    {
        // Bilinen multipart prologu: ilk satır "--<boundary>"
        var firstLine = Encoding.ASCII.GetString(bodyBytes, 0, Math.Min(bodyBytes.Length, 200)).Split('\r')[0];
        if (firstLine.StartsWith("--"))
        {
            var boundary = firstLine[2..];
            return $"multipart/form-data; boundary={boundary}";
        }
        throw new InvalidOperationException("Multipart body boundary tespit edilemedi.");
    }

    private static string Truncate(string value, int max)
        => value.Length <= max ? value : value[..max] + "...";
}
