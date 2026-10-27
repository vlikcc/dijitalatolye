"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowUp } from "lucide-react";

export function CatalogReturnLink({
  filters,
  count,
}: {
  filters: RefObject<HTMLDivElement | null>;
  count: number;
}) {
  const link = useRef<HTMLAnchorElement>(null);
  const [long, setLong] = useState(false);
  useEffect(() => {
    function measure() {
      if (!filters.current || !link.current) return;
      const distance =
        link.current.getBoundingClientRect().top -
        filters.current.getBoundingClientRect().top;
      setLong(distance > innerHeight);
    }
    const observer = new ResizeObserver(measure);
    if (filters.current?.parentElement)
      observer.observe(filters.current.parentElement);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [count, filters]);
  return (
    <div className="catalog-return" data-visible={long}>
      <a
        ref={link}
        className="text-link"
        href="#catalog-filters"
        tabIndex={long ? undefined : -1}
        aria-hidden={!long}
        onClick={(event) => {
          event.preventDefault();
          const target = filters.current?.querySelector<HTMLElement>(
            'button[role="combobox"]',
          );
          target?.focus({ preventScroll: true });
          filters.current?.scrollIntoView({
            block: "start",
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
          });
        }}
      >
        Filtrelere dön <ArrowUp size={16} aria-hidden="true" />
      </a>
    </div>
  );
}
