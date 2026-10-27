import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
export function PageHeading({
  title,
  description,
  actions,
  back,
  badge,
  children,
  game = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: { href: string; label: string };
  badge?: ReactNode;
  children?: ReactNode;
  game?: boolean;
}) {
  return (
    <div className={game ? "game-heading" : "page-heading"}>
      {back && (
        <Link className="back-link" href={back.href}>
          <ArrowLeft size={16} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <header className="heading-row">
        <div className="heading-copy">
          <div className="heading-title">
            <h1>{title}</h1>
            {badge}
          </div>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="heading-actions">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
