/** Only used by public catalogue routes, never by teacher workspaces. */
export function CatalogLoading() {
  return (
    <div className="catalog-loading">
      <p role="status">Oyunlar hazırlanıyor…</p>
      <div className="game-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="game-card catalog-skeleton">
            <div className="card-art" />
            <div className="card-content">
              <span />
              <span />
              <span />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
