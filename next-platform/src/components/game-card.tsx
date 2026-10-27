import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { CatalogGame } from "@/lib/catalog-model";
import { SaveButton } from "./saved-games";
import { CatalogCover } from "./catalog-cover";
import { HighlightText } from "./highlight-text";
export function detailHref(
  game: CatalogGame,
  returnTo = "/kesfet",
  play = false,
) {
  const params = new URLSearchParams({ from: returnTo });
  if (play) params.set("oyna", "1");
  return `/icerik/${game.slug}?${params}`;
}
export function GameCard({
  game,
  returnTo = "/kesfet",
  query,
}: {
  game: CatalogGame;
  returnTo?: string;
  query?: string;
}) {
  return (
    <article className={`game-card subject-${game.subjectKey}`}>
      <div className="card-art">
        <Link
          href={detailHref(game, returnTo)}
          tabIndex={-1}
          aria-hidden="true"
        >
          <CatalogCover
            key={game.cover ?? "missing"}
            src={game.cover}
            title={game.title}
          />
        </Link>
        <span className="card-grade">{game.grade}. sınıf</span>
        <SaveButton slug={game.slug} title={game.title} compact />
      </div>
      <div className="card-content">
        <div className="card-meta">
          <span className="subject-label">
            <i />
            {game.subject}
          </span>
          {game.minutes && (
            <span>
              <Clock3 size={13} />
              {game.minutes} dk
            </span>
          )}
        </div>
        <h3>
          <Link href={detailHref(game, returnTo)}>
            <span>
              <HighlightText text={game.title} query={query} />
            </span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </h3>
        <p>
          <HighlightText text={game.description} query={query} />
        </p>
        <div className="card-bottom">
          <span>{game.mechanic ?? "Öğretmen paylaşımı"}</span>
          <span
            className={game.kind === "demo" ? "demo-label" : "published-label"}
          >
            {game.kind === "demo" ? "Demo" : "Yayımlandı"}
          </span>
        </div>
      </div>
    </article>
  );
}
