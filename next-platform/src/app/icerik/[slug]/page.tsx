import { can } from "@/lib/permissions";
import { PageHeading } from "@/components/page-heading";
import { headers } from "next/headers";
import { getAuth } from "@/server/auth";
import { learningEnabled } from "@/server/learning-feature";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, GraduationCap, MousePointer2 } from "lucide-react";
import { libraryGame, libraryGames } from "@/modules/library";
import { safeCatalogReturn, type SearchParams } from "@/lib/catalog-model";
import {
  GameActions,
  GamePlayer,
  GameSession,
  StartGameButton,
} from "@/components/game-player";
import { SaveButton } from "@/components/saved-games";
import { ShareButton } from "@/components/game-share";
import { GameCard } from "@/components/game-card";
import { GameInformation } from "@/components/game-information";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const g = await libraryGame((await params).slug);
  return { title: g?.title ?? "Oyun bulunamadı" };
}
export default async function GameDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const game = await libraryGame((await params).slug);
  if (!game) notFound();
  const query = await searchParams;
  const session = learningEnabled()
    ? await getAuth().api.getSession({ headers: await headers() })
    : null;
  const from = safeCatalogReturn(
    typeof query.from === "string" ? query.from : undefined,
  );
  const returnQuery = new URLSearchParams(from.split("?")[1]);
  const savedReturn = returnQuery.get("saved") === "1";
  const hasReturnContext =
    savedReturn ||
    ["q", "grade", "subject"].some((key) => returnQuery.get(key)?.trim());
  const related = (
    await libraryGames({ subject: game.subjectId ?? game.subjectKey })
  )
    .filter((g) => g.slug !== game.slug)
    .slice(0, 4);
  return (
    <GameSession
      key={game.slug}
      playHref={
        session?.user.role === "student" && game.kind === "published"
          ? `/ogrenci/oyna/${game.id}`
          : undefined
      }
    >
      <article className={`game-detail subject-${game.subjectKey}`}>
        <PageHeading
          game
          title={game.title}
          description={game.description}
          back={
            hasReturnContext
              ? {
                  href: from,
                  label: savedReturn ? "Kaydettiklerime dön" : "Sonuçlara dön",
                }
              : undefined
          }
          badge={
            game.kind === "demo" ? (
              <span className="demo-label">Demo oyun</span>
            ) : undefined
          }
          actions={
            <GameActions>
              <StartGameButton disabled={!game.gameUrl} />
              <SaveButton slug={game.slug} title={game.title} />
              <ShareButton slug={game.slug} title={game.title} />
              {learningEnabled() &&
                game.kind === "published" &&
                can(session?.user.role, "teach") && (
                  <Link
                    className="button button-outline"
                    href={`/ogretmen/odevler?oyun=${game.id}`}
                  >
                    Ödev ver
                  </Link>
                )}
            </GameActions>
          }
        >
          <ul className="detail-facts" aria-label="Oyun bilgileri">
            <li>
              <Link
                className="detail-subject"
                href={`/kesfet?subject=${game.subjectId ?? game.subjectKey}`}
              >
                {game.subject}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </li>
            <li>
              <GraduationCap size={16} aria-hidden="true" />
              {game.grade}. sınıf
            </li>
            {game.minutes && (
              <li>
                <Clock3 size={15} aria-hidden="true" />
                {game.minutes} dakika
              </li>
            )}
            {game.mechanic && (
              <li>
                <MousePointer2 size={15} aria-hidden="true" />
                {game.mechanic}
              </li>
            )}
          </ul>
        </PageHeading>
        <div className="detail-layout">
          <GamePlayer game={game} autostart={query.oyna === "1"} />
          <p className="player-caption">
            Klavye veya dokunmatik ekranla oyna.{" "}
            {game.kind === "demo"
              ? "Bu demo ilerleme kaydı tutmaz."
              : session?.user.role === "student"
                ? "Kayıt destekli oyunlarda ilerlemen hesabına kaydedilir."
                : "Hesap açman gerekmez."}
          </p>
        </div>
        <GameInformation game={game} />
        {related.length > 0 && (
          <section className="related-games">
            <div className="collection-heading">
              <div>
                <h2>Merakın burada bitmesin.</h2>
                <p>Aynı dersten yeni keşifler seni bekliyor.</p>
              </div>
              <Link
                className="text-link"
                href={`/kesfet?subject=${game.subjectId ?? game.subjectKey}`}
              >
                Tümünü gör <ArrowRight size={17} />
              </Link>
            </div>
            <div className="game-grid">
              {related.map((g) => (
                <GameCard key={g.id} game={g} returnTo={from} />
              ))}
            </div>
          </section>
        )}
      </article>
    </GameSession>
  );
}
