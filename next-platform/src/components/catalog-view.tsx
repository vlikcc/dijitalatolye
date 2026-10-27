"use client";
import {
  useEffect,
  useLayoutEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Compass,
  FlaskConical,
  Bookmark,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import {
  catalogHref,
  type CatalogGame,
  type CatalogFilters,
} from "@/lib/catalog-model";
import { detailHref, GameCard } from "./game-card";
import { useSavedGames } from "./saved-games";
import { CatalogSelect } from "./catalog-select";
import { CatalogSearchField } from "./catalog-search-field";
import { CatalogIntro } from "./catalog-intro";
import { CatalogSubjectNav } from "./catalog-subject-nav";
import { CatalogReturnLink } from "./catalog-return-link";
type Options = {
  subjects: { id: string; key: string; label: string }[];
  grades: number[];
};
const icons: Record<string, typeof Calculator> = {
  matematik: Calculator,
  turkce: BookOpen,
  fen: FlaskConical,
  hayat: Compass,
};
const subjectDescriptions: Record<string, string> = {
  matematik: "Bir yol dene, çözümü keşfet.",
  turkce: "Sözcüklerle düşün, anlamı keşfet.",
  fen: "Soru sor, bağlantıları keşfet.",
  hayat: "Günlük hayatı oyunla keşfet.",
};
export function CatalogView({
  games,
  filters,
  options,
  shareHref,
  guest,
}: {
  games: CatalogGame[];
  filters: CatalogFilters;
  options: Options;
  shareHref?: string;
  guest?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [showPending, setShowPending] = useState(false);
  useEffect(() => {
    if (!pending) {
      setShowPending(false);
      return;
    }
    const timer = setTimeout(() => setShowPending(true), 150);
    return () => clearTimeout(timer);
  }, [pending]);
  const busy = pending && showPending;
  const [selection, setSelection] = useOptimistic(filters);
  const latestSelection = useRef(filters);
  const [query, setQuery] = useState(filters.q ?? "");
  const [appliedQuery, setAppliedQuery] = useState(filters.q ?? "");
  const chipGroup = useRef<HTMLDivElement>(null);
  const filterStrip = useRef<HTMLDivElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const removedChipIndex = useRef<number | null>(null);
  // Only an applied query change replaces the draft. Grade/subject navigation
  // preserves typed text, including when requests complete asynchronously.
  if (appliedQuery !== (filters.q ?? "")) {
    setAppliedQuery(filters.q ?? "");
    setQuery(filters.q ?? "");
  }
  useEffect(() => {
    if (!pending) latestSelection.current = filters;
  }, [filters, pending]);
  function href(next: CatalogFilters) {
    // Stay on the current catalogue route so its draft and focus survive.
    return catalogHref(next).replace("/kesfet", pathname);
  }
  function navigate(change: Partial<CatalogFilters>) {
    const next = { ...latestSelection.current, ...change };
    latestSelection.current = next;
    startTransition(() => {
      setSelection(next);
      router.push(href(next), { scroll: false });
    });
  }
  const { saved, ready: savedReady } = useSavedGames();
  const shown = filters.saved ? games.filter((g) => saved.has(g.slug)) : games;
  const filtering = Boolean(
    filters.q || filters.grade || filters.subject || filters.saved,
  );
  const returnTo = catalogHref(filters);
  const selectedSubject = options.subjects.find(
    (s) => s.key === filters.subject || s.id === filters.subject,
  );
  const emptyCollection = Boolean(filters.saved && saved.size === 0);
  const narrowed = Boolean(filters.q || filters.grade || filters.subject);
  function recovery(
    label: string,
    change: Partial<CatalogFilters>,
    primary = false,
  ) {
    return (
      <Link
        className={`button ${primary ? "button-primary" : "button-outline"}`}
        href={href({ ...selection, ...change })}
        scroll={false}
        onNavigate={(event) => {
          event.preventDefault();
          removedChipIndex.current = 0;
          if ("q" in change) setQuery("");
          navigate(change);
        }}
      >
        {label}
      </Link>
    );
  }
  const gradeOptions = [
    { value: "", label: "Tüm sınıflar" },
    ...options.grades.map((g) => ({ value: String(g), label: `${g}. sınıf` })),
  ];
  const selectedFilterSubject = options.subjects.find(
    (subject) =>
      subject.key === selection.subject || subject.id === selection.subject,
  );
  const chips: {
    key: "q" | "grade" | "subject";
    label: string;
    className?: string;
  }[] = [];
  if (selection.q) chips.push({ key: "q", label: `“${selection.q}”` });
  if (selection.grade)
    chips.push({ key: "grade", label: `${selection.grade}. sınıf` });
  if (selection.subject)
    chips.push({
      key: "subject",
      label: selectedFilterSubject?.label ?? "Ders filtresi",
      className: `subject-${selectedFilterSubject?.key ?? "other"}`,
    });
  useLayoutEffect(() => {
    const index = removedChipIndex.current;
    if (index === null) return;
    removedChipIndex.current = null;
    const remaining =
      chipGroup.current?.querySelectorAll<HTMLButtonElement>("button");
    const next = remaining?.[Math.min(index, remaining.length - 1)];
    (next ?? resultsHeading.current)?.focus({ preventScroll: true });
  }, [selection.q, selection.grade, selection.subject]);
  return (
    <div
      className={`discovery${pathname === "/" ? " discovery-motion" : ""} ${selectedSubject ? `subject-${selectedSubject.key}` : ""}`}
    >
      <div className="discovery-workbench">
        <CatalogIntro
          highlight={pathname === "/" && !filtering}
          title={
            !filtering ? (
              "Her oyunda yeni bir keşif."
            ) : filters.saved ? (
              "Senin keşif koleksiyonun"
            ) : selectedSubject ? (
              <>
                <span
                  key={selectedSubject.id}
                  className={`catalog-title-highlight subject-${selectedSubject.key}`}
                >
                  {selectedSubject.label}
                </span>{" "}
                oyunları
              </>
            ) : (
              "Yeni bir keşfe hazır mısın?"
            )
          }
          description={
            !filtering
              ? "Sınıfta ya da evde, konunu seç ve oynayarak öğren."
              : filters.saved
                ? "Kaydettiğin oyunlar bu tarayıcıda seni bekliyor."
                : (subjectDescriptions[selectedSubject?.key ?? ""] ??
                  "Merak ettiğin konuyu bul, öğrenmeyi oyuna dönüştür.")
          }
        />
        <form
          action={pathname}
          role="search"
          className="catalog-search"
          autoComplete="off"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({ q: query.trim() || undefined });
          }}
        >
          <CatalogSearchField
            games={shown}
            value={query}
            onValueChange={setQuery}
            onSelect={(game) =>
              router.push(
                detailHref(
                  game,
                  catalogHref({ ...filters, q: query.trim() || undefined }),
                ),
              )
            }
          />
          {selection.grade && (
            <input type="hidden" name="grade" value={selection.grade} />
          )}
          {selection.subject && (
            <input type="hidden" name="subject" value={selection.subject} />
          )}
          {selection.saved && <input type="hidden" name="saved" value="1" />}
          <button className="search-submit" type="submit" aria-label="Oyun ara">
            Ara <ArrowRight size={17} />
          </button>
        </form>
      </div>
      <span className="sr-only" role="status">
        {busy ? "Oyunlar güncelleniyor…" : ""}
      </span>
      <section
        className="catalog-section"
        id="oyunlar"
        aria-label="Oyun kütüphanesi"
        aria-busy={pending}
      >
        <div
          ref={filterStrip}
          id="catalog-filters"
          className="catalog-filter-strip"
        >
          <label className="catalog-grade">
            <span>Sınıf</span>
            <CatalogSelect
              name="grade"
              label="Sınıf"
              value={selection.grade ?? ""}
              options={gradeOptions}
              onValueChange={(grade) => navigate({ grade: grade || undefined })}
            />
          </label>
          <label className="catalog-mobile-subject">
            <span>Ders</span>
            <CatalogSelect
              name="subject"
              label="Ders"
              value={
                options.subjects.find(
                  (subject) =>
                    subject.key === selection.subject ||
                    subject.id === selection.subject,
                )?.key ??
                selection.subject ??
                ""
              }
              options={[
                { value: "", label: "Tüm dersler" },
                ...options.subjects.map((subject) => ({
                  value: subject.key,
                  label: subject.label,
                })),
              ]}
              onValueChange={(subject) =>
                navigate({ subject: subject || undefined })
              }
            />
          </label>
          <CatalogSubjectNav activeKey={selection.subject ?? ""}>
            <Link
              href={href({ ...selection, subject: undefined })}
              scroll={false}
              onNavigate={(event) => {
                event.preventDefault();
                navigate({ subject: undefined });
              }}
              className={!selection.subject ? "selected" : ""}
              aria-current={!selection.subject ? "page" : undefined}
            >
              <Compass size={18} />
              Tüm oyunlar
            </Link>
            {options.subjects.map((subject) => {
              const Icon = icons[subject.key] ?? BookOpen;
              const active =
                selection.subject === subject.key ||
                selection.subject === subject.id;
              return (
                <Link
                  key={subject.key}
                  className={`subject-${subject.key} ${active ? "selected" : ""}`}
                  href={href({ ...selection, subject: subject.key })}
                  scroll={false}
                  onNavigate={(event) => {
                    event.preventDefault();
                    navigate({ subject: subject.key });
                  }}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={18} />
                  {subject.label}
                </Link>
              );
            })}
          </CatalogSubjectNav>
        </div>
        {chips.length > 0 && (
          <div
            ref={chipGroup}
            className="catalog-active-filters"
            role="group"
            aria-label="Etkin filtreler"
          >
            {chips.map((chip, index) => (
              <button
                type="button"
                key={chip.key}
                className={`catalog-filter-chip ${chip.className ?? ""}`}
                aria-label={`${chip.label} filtresini kaldır`}
                onClick={() => {
                  removedChipIndex.current = index;
                  if (chip.key === "q") setQuery("");
                  navigate({ [chip.key]: undefined });
                }}
              >
                <span>{chip.label}</span>
                <X size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        <div className="catalog-results">
          <div className="catalog-results-label">
            <h2 ref={resultsHeading} tabIndex={-1}>
              {filters.saved ? "Kaydettiklerin" : "Oyunlar"}
            </h2>
            <p
              aria-live={pending ? "off" : "polite"}
              aria-atomic="true"
              className="catalog-result-count"
            >
              {busy ? (
                <>
                  <LoaderCircle
                    size={15}
                    className="catalog-pending-icon"
                    aria-hidden="true"
                  />
                  Oyunlar güncelleniyor…
                </>
              ) : filters.saved && !savedReady ? (
                "Kaydettiklerin yükleniyor…"
              ) : (
                `${shown.length} oyun`
              )}
            </p>
          </div>
          {Boolean(filters.q || filters.grade || filters.subject) && (
            <Link
              className="clear-filters"
              href={href({ saved: filters.saved })}
              scroll={false}
              onNavigate={(event) => {
                event.preventDefault();
                removedChipIndex.current = 0;
                setQuery("");
                navigate({
                  q: undefined,
                  grade: undefined,
                  subject: undefined,
                });
              }}
            >
              <X size={16} />
              Filtreleri temizle
            </Link>
          )}
        </div>
        {filters.saved && !savedReady ? (
          <p className="saved-loading" role="status">
            Kaydettiklerin yükleniyor…
          </p>
        ) : shown.length ? (
          <div className="game-grid">
            {shown.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                returnTo={returnTo}
                query={filters.q}
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            {emptyCollection ? (
              <Bookmark size={28} aria-hidden="true" />
            ) : (
              <Search size={28} aria-hidden="true" />
            )}
            <h2>
              {emptyCollection
                ? "Koleksiyonuna bir oyun ekle"
                : "Henüz bir eşleşme yok"}
            </h2>
            <p>
              {emptyCollection
                ? "Oyunlardaki yer imi düğmesine dokun; favori keşiflerin burada biriksin."
                : filters.saved
                  ? narrowed
                    ? "Kaydettiklerinde bu filtrelerle eşleşen oyun yok."
                    : "Kaydettiğin oyunlar şu anda listelenemiyor."
                  : "Bu aramayla eşleşen bir oyun bulamadık. Bir filtreyi kaldırarak keşfetmeye devam edebilirsin."}
            </p>
            <div className="empty-actions">
              {!emptyCollection &&
                filters.q &&
                recovery("Aramayı temizle", { q: undefined }, true)}
              {!emptyCollection &&
                filters.subject &&
                recovery(
                  "Diğer derslerde ara",
                  { subject: undefined },
                  !filters.q,
                )}
              {!emptyCollection &&
                filters.grade &&
                recovery(
                  "Tüm sınıfları göster",
                  { grade: undefined },
                  !filters.q && !filters.subject,
                )}
              {(emptyCollection || !narrowed) && (
                <Link className="button button-primary" href="/kesfet">
                  Tüm oyunları keşfet{" "}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        )}
        {shown.length > 0 && (
          <CatalogReturnLink filters={filterStrip} count={shown.length} />
        )}
      </section>
      {guest ? (
        <section
          className="catalog-share"
          aria-label="Öğrenciler ve öğretmenler için"
        >
          <p>Öğrenciysen keşfet, öğretmensen ilham ver.</p>
          <div className="catalog-audience-links">
            <Link className="text-link" href="/nasil-kullanilir#ogrenciler">
              Öğrenciler için <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="text-link" href="/nasil-kullanilir#ogretmenler">
              Öğretmenler için <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : (
        shareHref && (
          <section className="catalog-share" aria-label="Oyun paylaş">
            <p>Hazırladığın oyunu paylaş.</p>
            <Link className="text-link" href={shareHref}>
              Oyun paylaş <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </section>
        )
      )}
    </div>
  );
}
