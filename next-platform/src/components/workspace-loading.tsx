export default function WorkspaceLoading() {
  return (
    <div
      className="workspace-loading"
      role="status"
      aria-label="Çalışma alanı hazırlanıyor"
    >
      <p>Çalışma alanı hazırlanıyor…</p>
      <div aria-hidden="true">
        <div className="workspace-skeleton-title" />
        {[0, 1, 2, 3].map((row) => (
          <div className="workspace-skeleton-row" key={row}>
            <span />
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}
