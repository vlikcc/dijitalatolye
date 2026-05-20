using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace DijitalAtolye.Identity.IntegrationTests;

public sealed class IdentityWebAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Test")
            ?? "Host=127.0.0.1;Port=5432;Database=identity_test;Username=gha_test;Password=";

        builder.ConfigureAppConfiguration(config =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Postgres"] = connectionString,
                ["JwtIssuer:SigningKey"] = new string('k', 48),
                ["JwtIssuer:Issuer"] = "https://test.identity",
                ["JwtIssuer:Audience"] = "dijitalatolye-api",
                ["Database:AutoMigrate"] = "true",
            });
        });
    }
}
