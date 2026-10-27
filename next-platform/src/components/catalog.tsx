import { headers } from "next/headers";
import { getAuth } from "@/server/auth";
import { can } from "@/lib/permissions";
import { Gamepad2 } from "lucide-react";
import { libraryGames, libraryOptions } from "@/modules/library";
import type { CatalogFilters } from "@/lib/catalog-model";
import { CatalogView } from "./catalog-view";
export function GameCover({
  versionId,
  title,
  hasThumbnail = false,
}: {
  versionId: string;
  title: string;
  hasThumbnail?: boolean;
}) {
  return (
    <div className="game-cover">
      {hasThumbnail ? (
        <img
          src={`/api/thumbnails/${versionId}`}
          alt={`${title} oyunundan görünüm`}
          loading="lazy"
        />
      ) : (
        <div className="cover-empty">
          <Gamepad2 />
          <span>Oyun önizlemesi</span>
        </div>
      )}
    </div>
  );
}
export async function Catalog({ filters }: { filters: CatalogFilters }) {
  const [games, options, session] = await Promise.all([
    libraryGames(filters),
    libraryOptions(),
    getAuth().api.getSession({ headers: await headers() }),
  ]);
  return (
    <CatalogView
      games={games}
      filters={filters}
      options={options}
      guest={!session}
      shareHref={
        !session
          ? "/giris?next=%2Fogretmen%2Fyeni"
          : can(session.user.role, "create")
            ? "/ogretmen/yeni"
            : undefined
      }
    />
  );
}
