using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace DijitalAtolye.Notification.API.Email;

public interface IHtmlTemplateRenderer
{
    Task<string> RenderAsync(string templateName, IReadOnlyDictionary<string, string> variables, CancellationToken ct = default);
}

public sealed partial class FileHtmlTemplateRenderer : IHtmlTemplateRenderer
{
    private static readonly ConcurrentDictionary<string, string> Cache = new();
    private readonly string _templatesDir;
    private readonly ILogger<FileHtmlTemplateRenderer> _logger;

    public FileHtmlTemplateRenderer(IHostEnvironment env, ILogger<FileHtmlTemplateRenderer> logger)
    {
        _templatesDir = Path.Combine(env.ContentRootPath, "Email", "Templates");
        _logger = logger;
    }

    public async Task<string> RenderAsync(string templateName, IReadOnlyDictionary<string, string> variables, CancellationToken ct = default)
    {
        var fileName = templateName.EndsWith(".html", StringComparison.OrdinalIgnoreCase) ? templateName : $"{templateName}.html";
        var path = Path.Combine(_templatesDir, fileName);
        if (!File.Exists(path))
        {
            _logger.LogWarning("Template not found: {Path}", path);
            return $"<p>Template {templateName} not found.</p>";
        }

        var html = Cache.GetOrAdd(path, static p => File.ReadAllText(p));
        // Değerler kullanıcı girdisi içerebilir (ör. DisplayName) — HTML enjeksiyonuna karşı encode edilir.
        foreach (var (key, value) in variables)
        {
            var encoded = System.Net.WebUtility.HtmlEncode(value);
            html = PlaceholderRegex().Replace(html, m => m.Groups[1].Value == key ? encoded : m.Value);
        }

        await Task.CompletedTask;
        return html;
    }

    [GeneratedRegex(@"\{\{(\w+)\}\}")]
    private static partial Regex PlaceholderRegex();
}
