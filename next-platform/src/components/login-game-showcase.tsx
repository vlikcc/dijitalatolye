"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CatalogGame } from "@/lib/catalog-model";

export type LoginShowcaseGame = Pick<
  CatalogGame,
  "id" | "title" | "cover" | "subject" | "subjectKey" | "grade" | "kind"
>;

/** A manual, decorative preview: changing the cover never affects the form. */
export function LoginGameShowcase({ games }: { games: LoginShowcaseGame[] }) {
  const [selectedId, setSelectedId] = useState(games[0]?.id);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const deck = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // A cached/early image error can precede React attaching its handlers.
    const failed = Array.from(deck.current?.querySelectorAll("img") ?? [])
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.dataset.gameId!);
    if (failed.length) setFailedIds((ids) => [...new Set([...ids, ...failed])]);
  }, [games]);
  const available = games.filter(
    (game) => game.cover && !failedIds.includes(game.id),
  );
  function omitFailedCover(id: string) {
    setFailedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }
  const captionId = useId();
  const selectedIndex = Math.max(
    0,
    available.findIndex((game) => game.id === selectedId),
  );
  const selected = available[selectedIndex];
  if (!selected) return null;

  return (
    <div className="login-game-showcase">
      <div className="login-game-deck" ref={deck} aria-hidden="true">
        {available.map((game, index) => (
          <img
            key={game.id}
            data-game-id={game.id}
            className={`login-game-cover subject-${game.subjectKey}`}
            data-position={
              (index - selectedIndex + available.length) % available.length
            }
            src={game.cover}
            alt=""
            width={720}
            height={440}
            loading="lazy"
            onError={() => omitFailedCover(game.id)}
          />
        ))}
      </div>
      <div
        className="login-game-caption"
        id={captionId}
        aria-live="polite"
        aria-atomic="true"
      >
        <h3>{selected.title}</h3>
        <p>
          {selected.subject} · {selected.grade}. sınıf
          <span className="login-game-kind">
            {selected.kind === "demo" ? "Demo oyun" : "Yayımlandı"}
          </span>
        </p>
      </div>
      {available.length > 1 && (
        <div
          className="login-game-choices"
          role="group"
          aria-label="Oyun kapaklarını keşfet"
        >
          {available.map((game) => (
            <button
              key={game.id}
              type="button"
              aria-pressed={game.id === selected.id}
              aria-controls={captionId}
              aria-label={`${game.title} kapağını göster`}
              onClick={() => setSelectedId(game.id)}
            >
              <img
                src={game.cover}
                alt=""
                width={48}
                height={32}
                loading="lazy"
                onError={() => omitFailedCover(game.id)}
              />
              <span>{game.subject}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
