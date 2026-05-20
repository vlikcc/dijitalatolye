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
        var body = await login.Content.ReadFromJsonAsync<TokenResponse>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrWhiteSpace();
        body.RefreshToken.Should().NotBeNullOrWhiteSpace();
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

    private sealed record TokenResponse(string AccessToken, string RefreshToken);
}
