import { Suspense, type ReactNode } from "react";
import { libraryGames } from "@/modules/library";
import { catalogArtwork } from "@/lib/catalog-artwork";
import { LoginGameShowcase } from "@/components/login-game-showcase";

async function AccountGameGallery({
  showcase = false,
}: {
  showcase?: boolean;
}) {
  // Decorative discovery must never prevent signing in when the catalogue fails.
  const games = await libraryGames().catch(() => []);
  const artwork = catalogArtwork(games);
  if (!artwork.length) return null;
  if (showcase)
    return (
      <LoginGameShowcase
        games={artwork.map(
          ({ id, title, cover, subject, subjectKey, grade, kind }) => ({
            id,
            title,
            cover,
            subject,
            subjectKey,
            grade,
            kind,
          }),
        )}
      />
    );
  return (
    <div className="account-game-gallery">
      {artwork.map((game) => (
        <figure key={game.id} className={`subject-${game.subjectKey}`}>
          <img
            src={game.cover}
            alt=""
            width={720}
            height={440}
            loading="lazy"
          />
          <figcaption>
            <span>{game.title}</span>
            <span className="account-game-caption">
              {game.subject} · {game.grade}. sınıf
              {game.kind === "demo" ? " · Demo" : ""}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function AccountLayout({
  title,
  description,
  children,
  showcase = false,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  showcase?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`account-layout${showcase ? " account-layout-showcase" : ""} ${className}`.trim()}
    >
      <section
        className="auth-box account-form-panel"
        aria-labelledby="account-title"
      >
        <h1 id="account-title">{title}</h1>
        {description && <p>{description}</p>}
        {children}
      </section>
      <aside
        className="account-introduction"
        aria-labelledby="account-intro-title"
      >
        <h2 id="account-intro-title">
          Her oyunda <span>yeni bir keşif.</span>
        </h2>
        <p>Sınıfta ya da evde, konunu seç ve oynayarak öğren.</p>
        <Suspense fallback={null}>
          <AccountGameGallery showcase={showcase} />
        </Suspense>
      </aside>
    </div>
  );
}
