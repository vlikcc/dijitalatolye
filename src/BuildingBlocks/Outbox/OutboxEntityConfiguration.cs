using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DijitalAtolye.BuildingBlocks.Outbox;

public sealed class OutboxMessageEntityConfiguration : Microsoft.EntityFrameworkCore.IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("OutboxMessages");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.EventType).HasMaxLength(512).IsRequired();
        builder.Property(o => o.Payload).IsRequired();
        builder.Property(o => o.OccurredOn).IsRequired();
        builder.Property(o => o.Error).HasMaxLength(2048);

        // Dispatcher polling sorgusu için verimli index
        builder.HasIndex(o => new { o.ProcessedAt, o.OccurredOn })
            .HasDatabaseName("IX_OutboxMessages_ProcessedAt_OccurredOn");
    }
}
