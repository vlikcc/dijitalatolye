using Microsoft.AspNetCore.Identity;

namespace DijitalAtolye.Identity.Domain.Entities;

public sealed class ApplicationRole : IdentityRole<Guid>
{
    public ApplicationRole() { }

    public ApplicationRole(string name) : base(name) { }
}
