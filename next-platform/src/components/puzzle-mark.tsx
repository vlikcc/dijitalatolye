"use client";

import { useEffect, useId, useRef, useState } from "react";

// Shared across client navigation and remounts, reset by a new document load.
let entrancePlayed = false;

// Paths follow the white seam centres in the approved 1254px source.
// Each mask reveals the original pixels, including their texture and alpha.
const top =
  "M627 54V237C627 280 660 262 692 249C750 225 809 271 804 344C802 419 728 456 672 421C644 403 627 412 627 440V620";
const right =
  "M627 620H810C832 620 848 631 837 650C797 719 818 779 891 791C967 813 1031 756 995 672C980 640 984 620 1010 620H1210";
const bottom =
  "M627 620V802C627 833 604 841 578 827C505 785 441 838 444 911C444 979 511 1017 579 979C609 960 627 973 627 1005V1200";
const left =
  "M627 620H452C425 620 413 603 432 568C467 492 409 418 323 442C263 456 227 519 264 577C278 602 269 620 239 620H43";
const pieces = [
  "M0 0H627V237C627 280 660 262 692 249C750 225 809 271 804 344C802 419 728 456 672 421C644 403 627 412 627 440V620H452C425 620 413 603 432 568C467 492 409 418 323 442C263 456 227 519 264 577C278 602 269 620 239 620H0Z",
  "M627 0H1254V620H1010C984 620 980 640 995 672C1031 756 967 813 891 791C818 779 797 719 837 650C848 631 832 620 810 620H627V440C627 412 644 403 672 421C728 456 802 419 804 344C809 271 750 225 692 249C660 262 627 280 627 237Z",
  "M1254 620V1254H627V1005C627 973 609 960 579 979C511 1017 444 979 444 911C441 838 505 785 578 827C604 841 627 833 627 802V620H810C832 620 848 631 837 650C797 719 818 779 891 791C967 813 1031 756 995 672C980 640 984 620 1010 620Z",
];

export function PuzzleMark() {
  const id = useId();
  const image = useRef<HTMLImageElement>(null);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const node = image.current;
    if (!node) return;
    const start = () => {
      if (entrancePlayed || !node.naturalWidth) return;
      entrancePlayed = true;
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setEntering(true);
      }
    };
    if (node.complete) start();
    else node.addEventListener("load", start, { once: true });
    return () => node.removeEventListener("load", start);
  }, []);

  return (
    <span className="brand-mark" data-entering={entering} aria-hidden="true">
      <img
        ref={image}
        src="/brand/puzzle-mark.webp"
        width={48}
        height={48}
        alt=""
      />
      <svg
        className="brand-mark-layers"
        viewBox="0 0 1254 1254"
        width={48}
        height={48}
        focusable="false"
        onAnimationEnd={(event) => {
          if (event.animationName === "puzzle-signature") setEntering(false);
        }}
      >
        <defs>
          {[0, 1, 2, 3].map((piece) => (
            <mask
              key={piece}
              id={`${id}-piece-${piece}`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="1254"
              height="1254"
            >
              {piece < 3 ? (
                <path d={pieces[piece]} fill="white" />
              ) : (
                <>
                  <rect width="1254" height="1254" fill="white" />
                  {pieces.map((path, index) => (
                    <path key={index} d={path} fill="black" />
                  ))}
                </>
              )}
            </mask>
          ))}
        </defs>
        <image
          href="/brand/puzzle-mark.webp"
          width="1254"
          height="1254"
          opacity="0.12"
        />
        <g
          className="brand-mark-lines"
          fill="none"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
        >
          {[top, right, bottom, left].map((path, index) => (
            <path
              key={index}
              d={path}
              pathLength="1"
              style={{ animationDelay: `${index * 40}ms` }}
            />
          ))}
        </g>
        {[0, 1, 2, 3].map((piece) => (
          <g key={piece} mask={`url(#${id}-piece-${piece})`}>
            <image
              className="brand-mark-color"
              href="/brand/puzzle-mark.webp"
              width="1254"
              height="1254"
              style={{ animationDelay: `${200 + piece * 120}ms` }}
            />
          </g>
        ))}
      </svg>
    </span>
  );
}
