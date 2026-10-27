"use client";
import { useState } from "react";
import { ImageOff } from "lucide-react";

export function CoverImage(props: { src: string; alt: string }) {
  return <CoverImageState key={props.src} {...props} />;
}
function CoverImageState({ src, alt }: { src: string; alt: string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  return (
    <div className="cover-image-frame" data-state={state}>
      {state !== "error" && (
        <img
          src={src}
          alt={alt}
          width={720}
          height={440}
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
        />
      )}
      {state !== "ready" && (
        <div className="cover-image-placeholder" role="status">
          {state === "error" ? (
            <>
              <ImageOff size={23} aria-hidden="true" />
              Kapak gösterilemiyor.
            </>
          ) : (
            "Kapak yükleniyor…"
          )}
        </div>
      )}
    </div>
  );
}
