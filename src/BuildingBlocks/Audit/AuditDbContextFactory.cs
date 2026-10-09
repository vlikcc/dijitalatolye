using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DijitalAtolye.BuildingBlocks.Audit;

/// <summary>
/// EF Core CLI tool'larının (`dotnet ef`) design-time <see cref="AuditDbContext"/> oluşturması için kullanılır.
/// </summary>
public sealed class AuditDbContextFactory : IDesignTimeDbContextFactory<AuditDbContext>
{
    public AuditDbContext CreateDbContext(string[] args)
    {
        var cs = Environment.GetEnvironmentVariable("ConnectionStrings__Audit")
            ?? "Host=localhost;Port=5432;Database=audit;Username=dijitalatolye;Password=";
        return new AuditDbContext(new DbContextOptionsBuilder<AuditDbContext>().UseNpgsql(cs).Options);
    }
}
