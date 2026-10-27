"use client";

import { useEffect, useRef, useState } from "react";
import { Gamepad2 } from "lucide-react";

export function CatalogCover({ src, title }: { src?: string; title: string }) {
  const image = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"loading" | "cached" | "loaded" | "error">(
    "loading",
  );
  useEffect(() => {
    const img = image.current;
    if (img?.complete) setState(img.naturalWidth > 0 ? "cached" : "error");
  }, [src]);
  return (
    <span className="catalog-cover" data-state={state}>
      {src && state !== "error" ? (
        <img
          ref={image}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          width={720}
          height={440}
          onLoad={() =>
            setState((current) => (current === "cached" ? current : "loaded"))
          }
          onError={() => setState("error")}
        />
      ) : (
        <span className="cover-empty">
          <Gamepad2 size={32} aria-hidden="true" />
          <span>{title}</span>
          <small>{src ? "Önizleme yüklenemedi" : "Önizleme eklenmemiş"}</small>
        </span>
      )}
    </span>
  );
}
