using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Analytics;
using DijitalAtolye.BuildingBlocks.EventBus.Contracts.Assignment;
using DijitalAtolye.User.API.Domain;
using DijitalAtolye.User.API.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Consumers;

/// <summary>
/// Bir öğrenci bir içeriği tamamladığında (Analytics'ten ContentCompletedV1), o içeriğe ait aktif
/// atamalardaki ilgili öğrenci üyeliklerini "tamamlandı" olarak işaretler ve öğretmene bildirim için
/// AssignmentCompletedV1 yayınlar.
/// </summary>
public sealed class ContentCompletedConsumer : IConsumer<ContentCompletedV1>
{
    private readonly UserDbContext _db;
    private readonly ILogger<ContentCompletedConsumer> _logger;

    public ContentCompletedConsumer(UserDbContext db, ILogger<ContentCompletedConsumer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ContentCompletedV1> context)
    {
        var msg = context.Message;
        var ct = context.CancellationToken;

        // Bu öğrencinin, bu içeriğe ait aktif ve henüz tamamlanmamış üyelikleri.
        var members = await _db.AssignmentMembers
            .Where(m => m.StudentUserId == msg.UserId && m.CompletedAtUtc == null)
            .Join(
                _db.Assignments.Where(a => a.ContentId == msg.ContentId && a.Status == AssignmentStatus.Active),
                m => m.AssignmentId,
                a => a.Id,
                (m, a) => new { Member = m, Assignment = a })
            .ToListAsync(ct);

        if (members.Count == 0) return;

        foreach (var row in members)
        {
            row.Member.CompletedAtUtc = msg.CompletedAt;
            row.Member.BestScore = msg.Score is { } s
                ? (row.Member.BestScore is { } prev ? Math.Max(prev, s) : s)
                : row.Member.BestScore;
        }
        await _db.SaveChangesAsync(ct);

        // Öğretmen bilgisi için profil email'lerini topla (bildirim).
        var teacherIds = members.Select(r => r.Assignment.TeacherUserId).Distinct().ToList();
        var teacherEmails = await _db.Profiles
            .Where(p => teacherIds.Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId, p => p.Email, ct);

        foreach (var row in members)
        {
            teacherEmails.TryGetValue(row.Assignment.TeacherUserId, out var teacherEmail);
            await context.Publish(new AssignmentCompletedV1
            {
                AssignmentId = row.Assignment.Id,
                TeacherUserId = row.Assignment.TeacherUserId,
                TeacherEmail = teacherEmail ?? string.Empty,
                StudentEmail = row.Member.StudentEmail,
                AssignmentTitle = row.Assignment.Title,
                Score = row.Member.BestScore,
                CompletedAt = msg.CompletedAt,
            }, ct);
        }

        _logger.LogInformation("Marked {Count} assignment member(s) completed for user {UserId}, content {ContentId}",
            members.Count, msg.UserId, msg.ContentId);
    }
}
