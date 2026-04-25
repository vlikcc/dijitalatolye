using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DijitalAtolye.Identity.Infrastructure.Persistence;

/// <summary>
/// EF Core CLI tool'larının (`dotnet ef`) design-time DbContext oluşturması için kullanılır.
/// </summary>
public sealed class IdentityDbContextFactory : IDesignTimeDbContextFactory<IdentityDbContext>
{
    public IdentityDbContext CreateDbContext(string[] args)
    {
        var cs = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=identity;Username=dijitalatolye;Password=";
        var options = new DbContextOptionsBuilder<IdentityDbContext>()
            .UseNpgsql(cs)
            .Options;
        return new IdentityDbContext(options);
    }
}
