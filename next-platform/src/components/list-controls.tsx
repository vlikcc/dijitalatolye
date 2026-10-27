import Link from "next/link";
import { listHref } from "@/lib/workspace-list";
export function ListSummary({
  total,
  page,
  size = 25,
  label = "kayıt",
}: {
  total: number;
  page: number;
  size?: number;
  label?: string;
}) {
  const first = (page - 1) * size + 1;
  const last = Math.min(page * size, total);
  return (
    <p className="list-summary">
      <strong>
        {total} {label}
      </strong>
      {total > 0 && first <= total && (
        <span>
          {first}–{last} arası gösteriliyor
        </span>
      )}
    </p>
  );
}
export function ListSearch({
  section,
  query,
  placeholder = "Ara",
  pathname = "/yonetim",
  params = {},
  children,
}: {
  section?: string;
  query: string;
  placeholder?: string;
  pathname?: string;
  params?: Record<string, string>;
  children?: React.ReactNode;
}) {
  return (
    <form className="list-toolbar workspace-toolbar" action={pathname}>
      {section && <input type="hidden" name="bolum" value={section} />}
      {Object.entries(params).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label>
        <span className="sr-only">{placeholder}</span>
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder={placeholder}
          maxLength={120}
        />
      </label>
      {children}
      <button className="button button-outline">Ara</button>
      {(query || children) && (
        <Link
          className="text-link"
          href={listHref(pathname, { bolum: section })}
        >
          Temizle
        </Link>
      )}
    </form>
  );
}
export function Pagination({
  section,
  query,
  page,
  total,
  size = 25,
  recordCount = total,
  pathname = "/yonetim",
  params = {},
}: {
  section?: string;
  query: string;
  page: number;
  total: number;
  size?: number;
  recordCount?: number;
  pathname?: string;
  params?: Record<string, string>;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  const href = (p: number) =>
    listHref(pathname, {
      ...params,
      bolum: section,
      q: query,
      sayfa: String(p),
    });
  return (
    <nav className="pagination" aria-label="Liste sayfaları">
      <span>
        {recordCount} kayıt · Sayfa {page} / {pages}
      </span>
      <div>
        {page > 1 && (
          <Link
            className="button button-outline button-sm"
            href={href(page - 1)}
          >
            Önceki
          </Link>
        )}
        {page < pages && (
          <Link
            className="button button-outline button-sm"
            href={href(page + 1)}
          >
            Sonraki
          </Link>
        )}
      </div>
    </nav>
  );
}
