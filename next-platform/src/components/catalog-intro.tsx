import type { ReactNode } from "react";

export function CatalogIntro({
  title,
  description,
  highlight = false,
}: {
  title: ReactNode;
  description: string;
  highlight?: boolean;
}) {
  return (
    <section className="discovery-intro" aria-labelledby="discovery-title">
      <div className="discovery-intro-copy">
        <h1 id="discovery-title">
          {highlight ? (
            <>
              Her oyunda{" "}
              <span className="catalog-title-highlight">yeni bir keşif.</span>
            </>
          ) : (
            title
          )}
        </h1>
        <p>{description}</p>
      </div>
    </section>
  );
}
