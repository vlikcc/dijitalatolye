using DijitalAtolye.BuildingBlocks.Authentication;
using DijitalAtolye.User.API.Domain;
using DijitalAtolye.User.API.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DijitalAtolye.User.API.Endpoints;

public static class CollectionEndpoints
{
    public static IEndpointRouteBuilder MapCollectionEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/users/me/collections").WithTags("Collections").RequireAuthorization();

        group.MapGet("/", async (ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var items = await db.Collections.AsNoTracking()
                .Where(c => c.UserId == current.UserId)
                .Include(c => c.Items)
                .OrderByDescending(c => c.UpdatedAtUtc)
                .ToListAsync(ct);
            return Results.Ok(items);
        });

        group.MapPost("/", async (
            [FromBody] CreateCollectionRequest body,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(body.Name)) return Results.BadRequest("Name required");
            var collection = new UserCollection
            {
                UserId = current.UserId.Value,
                Name = body.Name.Trim(),
                Description = body.Description?.Trim(),
                IsPublic = body.IsPublic,
            };
            db.Collections.Add(collection);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/users/me/collections/{collection.Id}", collection);
        });

        group.MapGet("/{id:guid}", async (Guid id, ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var collection = await db.Collections.AsNoTracking()
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == current.UserId, ct);
            return collection is null ? Results.NotFound() : Results.Ok(collection);
        });

        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] UpdateCollectionRequest body,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == id && c.UserId == current.UserId, ct);
            if (collection is null) return Results.NotFound();
            if (body.Name is not null) collection.Name = body.Name.Trim();
            if (body.Description is not null) collection.Description = body.Description.Trim();
            if (body.IsPublic is not null) collection.IsPublic = body.IsPublic.Value;
            collection.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        group.MapDelete("/{id:guid}", async (Guid id, ICurrentUser current, UserDbContext db, CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == id && c.UserId == current.UserId, ct);
            if (collection is null) return Results.NotFound();
            db.Collections.Remove(collection);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        group.MapPost("/{id:guid}/items", async (
            Guid id,
            [FromBody] AddCollectionItemRequest body,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var collection = await db.Collections.Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == current.UserId, ct);
            if (collection is null) return Results.NotFound();
            if (collection.Items.Any(i => i.ContentId == body.ContentId)) return Results.Conflict("Already in collection");
            collection.Items.Add(new CollectionItem { CollectionId = id, ContentId = body.ContentId });
            collection.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok(collection);
        });

        group.MapDelete("/{id:guid}/items/{contentId:guid}", async (
            Guid id,
            Guid contentId,
            ICurrentUser current,
            UserDbContext db,
            CancellationToken ct) =>
        {
            if (current.UserId is null) return Results.Unauthorized();
            var item = await db.CollectionItems
                .FirstOrDefaultAsync(i => i.CollectionId == id && i.ContentId == contentId, ct);
            if (item is null) return Results.NotFound();
            var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == id && c.UserId == current.UserId, ct);
            if (collection is null) return Results.NotFound();
            db.CollectionItems.Remove(item);
            collection.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        return routes;
    }
}

public sealed record CreateCollectionRequest(string Name, string? Description, bool IsPublic = false);
public sealed record UpdateCollectionRequest(string? Name, string? Description, bool? IsPublic);
public sealed record AddCollectionItemRequest(Guid ContentId);
