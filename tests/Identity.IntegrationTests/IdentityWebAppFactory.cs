using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace DijitalAtolye.Identity.IntegrationTests;

public sealed class IdentityWebAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Test")
            ?? "Host=127.0.0.1;Port=5432;Database=identity_test;Username=gha_test;Password=";

        // Minimal hosting: Program.cs ayarları (ör. JwtIssuer:SigningKey doğrulaması) builder.Build()'dan
        // ÖNCE okur; ConfigureAppConfiguration ile eklenen değerler o noktada görünmez. UseSetting
        // değerleri host yapılandırmasına en başta eklenir.
        var settings = new Dictionary<string, string>
        {
            ["ConnectionStrings:Postgres"] = connectionString,
            ["ConnectionStrings:Audit"] = connectionString,
            ["JwtIssuer:SigningKey"] = new string('k', 48),
            ["Jwt:SigningKey"] = new string('k', 48),
            ["JwtIssuer:Issuer"] = "https://test.identity",
            ["JwtIssuer:Audience"] = "dijitalatolye-api",
            ["Database:AutoMigrate"] = "true",
        };
        foreach (var (key, value) in settings)
        {
            builder.UseSetting(key, value);
        }
    }
}
