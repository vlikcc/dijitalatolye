using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Identity;
using DijitalAtolye.User.API.Domain;
using DijitalAtolye.User.API.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Consumers;

/// <summary>
/// Identity Service yeni kullanıcı oluşturduğunda User Service profil oluşturur.
/// Event-driven sınır geçişi.
/// </summary>
public sealed class UserRegisteredConsumer : IConsumer<UserRegisteredV1>
{
    private readonly UserDbContext _db;
    private readonly ILogger<UserRegisteredConsumer> _logger;

    public UserRegisteredConsumer(UserDbContext db, ILogger<UserRegisteredConsumer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<UserRegisteredV1> context)
    {
        var msg = context.Message;
        var existing = await _db.Profiles.AnyAsync(p => p.UserId == msg.UserId, context.CancellationToken);
        if (existing)
        {
            _logger.LogInformation("Profile already exists for {UserId}", msg.UserId);
            return;
        }

        _db.Profiles.Add(new UserProfile
        {
            UserId = msg.UserId,
            Email = msg.Email,
            DisplayName = msg.DisplayName,
            PrimaryRole = msg.PrimaryRole,
        });

        await _db.SaveChangesAsync(context.CancellationToken);
        _logger.LogInformation("Profile created for {UserId} ({Email})", msg.UserId, msg.Email);
    }
}
