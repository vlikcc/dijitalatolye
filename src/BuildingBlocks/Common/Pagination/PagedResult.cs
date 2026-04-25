namespace DijitalAtolye.BuildingBlocks.Common.Pagination;

public sealed record PagedResult<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    long TotalItems)
{
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalItems / (double)PageSize);

    public bool HasPreviousPage => Page > 1;

    public bool HasNextPage => Page < TotalPages;

    public static PagedResult<T> Empty(int page, int pageSize) =>
        new(Array.Empty<T>(), page, pageSize, 0);
}

public sealed record PagedRequest(int Page = 1, int PageSize = 20, string? SortBy = null, bool SortDescending = false)
{
    public int Skip => (Math.Max(1, Page) - 1) * Math.Clamp(PageSize, 1, 100);

    public int Take => Math.Clamp(PageSize, 1, 100);
}
