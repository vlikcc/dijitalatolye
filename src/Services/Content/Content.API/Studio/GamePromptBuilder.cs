using System.Text;
using DijitalAtolye.Content.API.AiExtraction;

namespace DijitalAtolye.Content.API.Studio;

/// <summary>Öğretmenin oyun tarifi: oturum oluşturulurken girilen bilgiler + Catalog'dan çözülen kazanım açıklamaları.</summary>
public sealed record GameBrief(
    string Title,
    string Idea,
    IReadOnlyList<string> Subjects,
    IReadOnlyList<int> GradeLevels,
    IReadOnlyList<CatalogOutcomeDto> Outcomes);

/// <summary>
/// EVREN için oyun üretim promptları. Kurallar platformun gerçek kısıtlarından gelir:
/// <list type="bullet">
/// <item>/cdn CSP'si: <c>default-src 'self'; connect-src 'none'</c> → dış kaynak ve ağ çağrısı çalışmaz.</item>
/// <item>iframe <c>sandbox="allow-scripts"</c> (allow-same-origin yok) → localStorage/cookie erişimi hata fırlatır.</item>
/// <item>AIModeration statik analizi (HtmlJsStaticAnalyzer) kritik desenlerde otomatik reddeder.</item>
/// </list>
/// </summary>
public static class GamePromptBuilder
{
    public const string SystemPrompt =
        """
        Sen Türkiye'deki okullar için eğitsel tarayıcı oyunları geliştiren uzman bir oyun geliştiricisisin.
        Öğretmenin isteğine göre TEK DOSYALIK, kendi kendine yeten bir HTML5 oyunu yazarsın.

        ZORUNLU TEKNİK KURALLAR:
        1. Tüm CSS <style> içinde, tüm JavaScript <script> içinde olacak. Tek dosya: index.html.
        2. Hiçbir dış kaynak kullanma: CDN, harici script/stil/font/görsel/ses YOK. Görseller için CSS, inline SVG,
           canvas çizimi veya emoji kullan. Ses gerekiyorsa Web Audio API ile üret.
        3. Ağ çağrısı YOK: fetch, XMLHttpRequest, WebSocket, sendBeacon kullanma.
        4. Depolama YOK: localStorage, sessionStorage, indexedDB, document.cookie kullanma (oyun sandbox içinde çalışır,
           bunlar hata verir). Durumu bellekte tut.
        5. Şu ifadeler kodda HİÇ geçmeyecek (güvenlik taraması otomatik reddeder): "eval(", "Function(",
           "document.write", "document.cookie", "window.opener", "navigator.geolocation".
           Dikkat: "Function(" kontrolü metin bazlıdır; adı "Function" ile biten fonksiyon tanımlama
           (ör. updateFunction yerine updateFn / guncelle kullan), new Function kullanma.
        6. alert/confirm/prompt kullanma; mesajları sayfa içinde göster.
        7. Mobil ve masaüstünde çalışsın: duyarlı yerleşim, dokunma + fare + klavye desteği, en az 44px dokunma hedefleri.
        8. Erişilebilirlik: yeterli renk kontrastı, butonlarda anlamlı metin/aria-label, html lang="tr".
        9. Tüm arayüz metinleri yaş grubuna uygun, doğru ve anlaşılır Türkçe olsun. İçerik pedagojik olarak doğru olmalı.
        10. Oyunda başlangıç ekranı (kısa nasıl oynanır), oyun ekranı, skor/geri bildirim ve "Tekrar oyna" bulunsun.
        11. Platforma ilerleme bildirmek için şu yardımcıyı script'in başına AYNEN ekle ve kullan:
            function daReport(type, score, outcomeCode, durationSeconds) {
              try { window.parent.postMessage({ app: 'dijitalatolye', type: type, outcomeCode: outcomeCode,
                score: typeof score === 'number' ? Math.max(0, Math.min(100, Math.round(score))) : undefined,
                durationSeconds: typeof durationSeconds === 'number' ? Math.round(durationSeconds) : undefined }, '*'); } catch (e) {}
            }
            Ara aşamalarda daReport('progress', yüzdeSkor) ve oyun bitince daReport('complete', yüzdeSkor, kazanımKodu, süreSaniye) çağır.
            score 0-100 arasıdır.

        YANIT BİÇİMİ (kesinlikle uy):
        - Önce tam oyun kodunu TEK bir ```html kod bloğu içinde ver (<!DOCTYPE html> ile başlasın, </html> ile bitsin).
        - Kod bloğundan sonra "Değişiklik özeti:" başlığıyla en fazla 5 maddelik kısa Türkçe özet yaz.
        - Kod bloğu dışında başka kod verme. Kodu asla kısaltma, "..." veya "önceki kod aynı" gibi yer tutucular kullanma.
        """;

    public static IReadOnlyList<StudioChatMessage> BuildInitial(GameBrief brief, string request)
    {
        var sb = new StringBuilder();
        AppendBrief(sb, brief);
        sb.AppendLine();
        // İlk turda istek, oturumun oyun fikriyle aynıdır; tekrar yazılmaz.
        if (!string.Equals(request.Trim(), brief.Idea.Trim(), StringComparison.Ordinal))
        {
            sb.AppendLine("ÖĞRETMENİN OYUN İSTEĞİ:");
            sb.AppendLine(request.Trim());
            sb.AppendLine();
        }
        sb.AppendLine("Bu bilgilere göre oyunu sıfırdan yaz.");
        return [new("system", SystemPrompt), new("user", sb.ToString())];
    }

    public static IReadOnlyList<StudioChatMessage> BuildRevision(GameBrief brief, string currentHtml, string request)
    {
        var sb = new StringBuilder();
        AppendBrief(sb, brief);
        sb.AppendLine();
        sb.AppendLine("MEVCUT OYUN KODU:");
        sb.AppendLine("```html");
        sb.AppendLine(currentHtml);
        sb.AppendLine("```");
        sb.AppendLine();
        sb.AppendLine("ÖĞRETMENİN DEĞİŞİKLİK İSTEĞİ:");
        sb.AppendLine(request.Trim());
        sb.AppendLine();
        sb.AppendLine("İsteneni uygula, istenmeyen kısımları koru ve oyunun TAM güncel kodunu ver.");
        return [new("system", SystemPrompt), new("user", sb.ToString())];
    }

    /// <summary>Güvenlik kuralı ihlalinde tek seferlik düzeltme turu: önceki yanıt + ihlal listesi.</summary>
    public static IReadOnlyList<StudioChatMessage> BuildFix(
        IReadOnlyList<StudioChatMessage> previousMessages,
        string previousResponse,
        IReadOnlyList<string> violations)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Ürettiğin kod platformun güvenlik kurallarını ihlal ediyor:");
        foreach (var v in violations) sb.AppendLine($"- {v}");
        sb.AppendLine();
        sb.AppendLine("Oyunun davranışını koruyarak bu ihlalleri gider ve TAM kodu aynı yanıt biçimiyle yeniden ver.");
        return [.. previousMessages, new("assistant", previousResponse), new("user", sb.ToString())];
    }

    private static void AppendBrief(StringBuilder sb, GameBrief brief)
    {
        sb.AppendLine($"OYUN ADI: {brief.Title}");
        if (brief.Subjects.Count > 0)
            sb.AppendLine($"DERS(LER): {string.Join(", ", brief.Subjects)}");
        if (brief.GradeLevels.Count > 0)
            sb.AppendLine($"SINIF SEVİYESİ: {string.Join(", ", brief.GradeLevels.Select(g => $"{g}. sınıf"))}");
        if (brief.Outcomes.Count > 0)
        {
            sb.AppendLine("HEDEF KAZANIMLAR (oyun bunları desteklemeli; complete bildiriminde ilk kodu kullan):");
            foreach (var o in brief.Outcomes)
                sb.AppendLine(string.IsNullOrWhiteSpace(o.Description) ? $"- {o.Code}" : $"- {o.Code}: {o.Description}");
        }
        if (!string.IsNullOrWhiteSpace(brief.Idea))
        {
            sb.AppendLine("OYUN FİKRİ / AÇIKLAMA:");
            sb.AppendLine(brief.Idea.Trim());
        }
    }
}
