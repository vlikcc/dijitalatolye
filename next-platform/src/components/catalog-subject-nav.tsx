"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Indicator = { x: number; y: number; width: number; color: string };

// 21st Animated Tabs' shared indicator, adapted to the catalogue's real links.
export function CatalogSubjectNav({
  activeKey,
  children,
}: {
  activeKey: string;
  children: ReactNode;
}) {
  const nav = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<Indicator | null>(null);

  useLayoutEffect(() => {
    const root = nav.current;
    if (!root) return;
    let disposed = false;
    function measure() {
      if (disposed || !root) return;
      const active = root.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active || !active.offsetWidth) {
        setIndicator(null);
        return;
      }
      const next = {
        x: active.offsetLeft + 10,
        y: active.offsetTop + active.offsetHeight - 2,
        width: Math.max(0, active.offsetWidth - 20),
        color:
          getComputedStyle(active).getPropertyValue("--subject").trim() ||
          "var(--foreground)",
      };
      setIndicator((previous) =>
        previous &&
        Object.keys(next).every(
          (key) =>
            next[key as keyof Indicator] === previous[key as keyof Indicator],
        )
          ? previous
          : next,
      );
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll("a").forEach((link) => observer.observe(link));
    void document.fonts.ready.then(measure);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [activeKey, children]);

  return (
    <nav
      ref={nav}
      className="subject-tabs"
      aria-label="Derse göre keşfet"
      data-sliding={Boolean(indicator)}
    >
      {children}
      <span
        aria-hidden="true"
        className="subject-tab-indicator"
        hidden={!indicator}
        style={
          indicator
            ? {
                width: indicator.width,
                backgroundColor: indicator.color,
                transform: `translate(${indicator.x}px, ${indicator.y}px)`,
              }
            : undefined
        }
      />
    </nav>
  );
}
