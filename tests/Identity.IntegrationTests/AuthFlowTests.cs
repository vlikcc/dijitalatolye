using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Npgsql;

namespace DijitalAtolye.Identity.IntegrationTests;

public sealed class AuthFlowTests
{
    private static bool PostgresAvailable()
    {
        try
        {
            var cs = Environment.GetEnvironmentVariable("ConnectionStrings__Test")
                ?? "Host=127.0.0.1;Port=5432;Database=identity_test;Username=gha_test";
            using var conn = new NpgsqlConnection(cs);
            conn.Open();
            return true;
        }
        catch
        {
            return false;
        }
    }

    [Fact]
    public async Task Register_and_login_returns_tokens()
    {
        if (!PostgresAvailable()) return;

        await using var factory = new IdentityWebAppFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var email = $"teacher{Guid.NewGuid():N}@meb.k12.tr";
        var password = "Test1234!Aa";

        var register = await client.PostAsJsonAsync("/auth/register", new
        {
            email,
            password,
            displayName = "Test Teacher",
            role = "Teacher",
        });
        register.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.Conflict);

        var login = await client.PostAsJsonAsync("/auth/login", new { email, password });
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await login.Content.ReadFromJsonAsync<SessionResponse>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrWhiteSpace();
        body.RefreshToken.Should().BeNull("refresh token yalnızca HttpOnly çerezde taşınır");

        var cookie = RefreshCookie(login);
        cookie.Should().NotBeNull();
        var setCookie = string.Join(";", login.Headers.GetValues("Set-Cookie")).ToLowerInvariant();
        setCookie.Should().Contain("httponly").And.Contain("samesite=strict").And.Contain("path=/api/auth");

        // Çerezle yenileme: yeni access token + rotasyon (yeni çerez)
        var refresh = await SendWithCookieAsync(client, "/auth/refresh", cookie!);
        refresh.StatusCode.Should().Be(HttpStatusCode.OK);
        (await refresh.Content.ReadFromJsonAsync<SessionResponse>())!.AccessToken.Should().NotBeNullOrWhiteSpace();
        var rotated = RefreshCookie(refresh);
        rotated.Should().NotBeNull().And.NotBe(cookie);

        // Logout yeni token'ı iptal eder; sonrasında yenileme reddedilir
        (await SendWithCookieAsync(client, "/auth/logout", rotated!)).StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await SendWithCookieAsync(client, "/auth/refresh", rotated!)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private static string? RefreshCookie(HttpResponseMessage response) =>
        response.Headers.TryGetValues("Set-Cookie", out var values)
            ? values.Select(v => v.Split(';')[0])
                .FirstOrDefault(v => v.StartsWith("da_rt=", StringComparison.Ordinal) && v.Length > "da_rt=".Length)
            : null;

    private static Task<HttpResponseMessage> SendWithCookieAsync(HttpClient client, string path, string cookie)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, path) { Content = JsonContent.Create(new { }) };
        request.Headers.Add("Cookie", cookie);
        return client.SendAsync(request);
    }

    [Fact]
    public async Task Resend_verification_accepts_request()
    {
        if (!PostgresAvailable()) return;

        await using var factory = new IdentityWebAppFactory();
        using var client = factory.CreateClient();

        var email = $"verify{Guid.NewGuid():N}@meb.k12.tr";
        await client.PostAsJsonAsync("/auth/register", new
        {
            email,
            password = "Test1234!Aa",
            displayName = "Verify Test",
            role = "Teacher",
        });

        var resend = await client.PostAsJsonAsync("/auth/resend-verification", new { email });
        resend.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Login_rate_limit_returns_429_after_burst()
    {
        if (!PostgresAvailable()) return;

        await using var factory = new IdentityWebAppFactory();
        using var client = factory.CreateClient();

        HttpStatusCode? lastStatus = null;
        // Login politikası IP başına 60 istek/dk (Identity Program.cs); limitin hemen üstüne çık.
        for (var i = 0; i < 65; i++)
        {
            var resp = await client.PostAsJsonAsync("/auth/login", new
            {
                email = "nonexistent@example.com",
                password = "wrong",
            });
            lastStatus = resp.StatusCode;
            if (resp.StatusCode == HttpStatusCode.TooManyRequests)
                break;
        }

        lastStatus.Should().Be(HttpStatusCode.TooManyRequests);
    }

    [Fact]
    public async Task Health_ready_returns_ok()
    {
        if (!PostgresAvailable()) return;

        await using var factory = new IdentityWebAppFactory();
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/health/ready");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private sealed record SessionResponse(string AccessToken, string? RefreshToken);
}
