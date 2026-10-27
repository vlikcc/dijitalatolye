"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Search, X, ArrowUpRight } from "lucide-react";
import { normalizeSearch, type CatalogGame } from "@/lib/catalog-model";
import { searchExcerpt, searchMatchRanges } from "@/lib/search-highlight";
import { HighlightText } from "./highlight-text";

export function CatalogSearchField({
  games,
  value: query,
  onValueChange: setQuery,
  onSelect,
}: {
  games: CatalogGame[];
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (game: CatalogGame) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target;
      if (
        event.key !== "/" ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      if (
        target instanceof Element &&
        target.closest(
          'input, textarea, select, button, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="dialog"], [role="listbox"]',
        )
      )
        return;
      event.preventDefault();
      input.current?.focus();
    }
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, []);
  const needle = normalizeSearch(query.trim());
  const suggestions = games
    .filter(
      (game) =>
        !needle ||
        normalizeSearch(
          `${game.title} ${game.subject} ${game.description}`,
        ).includes(needle),
    )
    .slice(0, 5);
  const expanded = open && suggestions.length > 0;
  const [placement, setPlacement] = useState({ above: false, height: 350 });

  useLayoutEffect(() => {
    if (!expanded) return;
    function position() {
      const bounds = root.current?.closest("form")?.getBoundingClientRect();
      if (!bounds) return;
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop ?? 0;
      const bottom = top + (viewport?.height ?? window.innerHeight);
      const before = bounds.top - top - 16;
      const after = bottom - bounds.bottom - 16;
      const above =
        after < Math.min(350, suggestions.length * 70 + 14) && before > after;
      const height = Math.max(0, Math.min(350, above ? before : after));
      setPlacement((previous) =>
        previous.above === above && previous.height === height
          ? previous
          : { above, height },
      );
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    window.visualViewport?.addEventListener("resize", position);
    window.visualViewport?.addEventListener("scroll", position);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      window.visualViewport?.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("scroll", position);
    };
  }, [expanded, suggestions.length]);

  function accept(game: CatalogGame) {
    setOpen(false);
    setActive(-1);
    onSelect(game);
  }

  return (
    <div className="search-field" ref={root}>
      <Search size={21} aria-hidden="true" />
      <label className="sr-only" htmlFor={id}>
        Oyun veya konu ara
      </label>
      <input
        ref={input}
        id={id}
        name="q"
        type="search"
        role="combobox"
        placeholder="Bugün ne öğrenmek istersin?"
        value={query}
        maxLength={120}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-autocomplete="list"
        aria-keyshortcuts="/"
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={expanded ? `${id}-suggestions` : undefined}
        aria-activedescendant={
          expanded && active >= 0 && active < suggestions.length
            ? `${id}-suggestion-${active}`
            : undefined
        }
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={(event) => {
          if (!root.current?.contains(event.relatedTarget)) setOpen(false);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (
            (event.key === "ArrowDown" || event.key === "ArrowUp") &&
            suggestions.length
          ) {
            event.preventDefault();
            setOpen(true);
            const next =
              event.key === "ArrowDown"
                ? (expanded ? active + 1 : 0) % suggestions.length
                : active <= 0
                  ? suggestions.length - 1
                  : active - 1;
            setActive(next);
            document
              .getElementById(`${id}-suggestion-${next}`)
              ?.scrollIntoView({ block: "nearest" });
          } else if (
            event.key === "Enter" &&
            expanded &&
            active >= 0 &&
            active < suggestions.length
          ) {
            event.preventDefault();
            accept(suggestions[active]);
          } else if (event.key === "Enter") {
            setOpen(false);
            setActive(-1);
          } else if (event.key === "Escape" && expanded) {
            event.preventDefault();
            setOpen(false);
            setActive(-1);
          }
        }}
      />
      {!query && (
        <kbd className="search-shortcut" aria-hidden="true">
          /
        </kbd>
      )}
      {query && (
        <button
          type="button"
          className="search-clear"
          aria-label="Aramayı temizle"
          onClick={() => {
            setQuery("");
            setActive(-1);
            setOpen(true);
            input.current?.focus();
          }}
        >
          <X size={16} />
        </button>
      )}
      {expanded && (
        <ul
          id={`${id}-suggestions`}
          className="search-suggestions"
          data-side={placement.above ? "top" : "bottom"}
          style={{ maxHeight: placement.height }}
          role="listbox"
          aria-label="Oyun önerileri"
        >
          {suggestions.map((game, index) => (
            <li key={game.id} role="presentation">
              <button
                type="button"
                role="option"
                id={`${id}-suggestion-${index}`}
                aria-selected={active === index}
                tabIndex={-1}
                className="search-suggestion"
                onMouseDown={(event) => event.preventDefault()}
                onPointerMove={() => setActive(index)}
                onClick={() => accept(game)}
              >
                {game.cover && (
                  <img src={game.cover} alt="" width={48} height={40} />
                )}
                <span className="suggestion-copy">
                  <strong>
                    <HighlightText text={game.title} query={query} />
                  </strong>
                  <span>
                    <HighlightText text={game.subject} query={query} /> ·{" "}
                    {game.grade}. sınıf
                  </span>
                  {needle &&
                    !searchMatchRanges(`${game.title} ${game.subject}`, query)
                      .length &&
                    searchExcerpt(game.description, query) && (
                      <span className="suggestion-excerpt">
                        <HighlightText
                          text={searchExcerpt(game.description, query)!}
                          query={query}
                        />
                      </span>
                    )}
                </span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
