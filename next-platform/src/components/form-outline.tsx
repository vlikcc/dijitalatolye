"use client";
import { useEffect, useState } from "react";
export type OutlineItem = { id: string; label: string };
export function focusFormSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  let ancestor = target.parentElement;
  while (ancestor) {
    if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
    ancestor = ancestor.parentElement;
  }
  const control = target.matches("input,select,textarea,button")
    ? target
    : (target.querySelector<HTMLElement>(
        "input:not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled)",
      ) ?? target);
  control.focus({ preventScroll: true });
  control.scrollIntoView({ block: "center", behavior: "instant" });
}
export function FormOutline({
  title,
  sections,
  missing,
  children,
}: {
  title: string;
  sections: OutlineItem[];
  missing: OutlineItem[];
  children?: React.ReactNode;
}) {
  const [active, setActive] = useState("");
  const sectionIds = sections.map((s) => s.id).join("\n");
  useEffect(() => {
    const targets = sectionIds
      .split("\n")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        const current = targets.find(
          (el) => visible.has(el) && el.getClientRects().length,
        );
        if (current) setActive(current.id);
      },
      { rootMargin: "-25% 0px -50% 0px", threshold: 0 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [sectionIds]);
  return (
    <details className="form-outline" open>
      <summary>
        {title}
        {missing.length > 0 && (
          <span className="outline-missing-count">{missing.length} eksik</span>
        )}
      </summary>
      <div>
        <nav aria-label={title}>
          {sections.map((s) => (
            <button
              className="outline-link"
              type="button"
              key={s.id}
              aria-current={active === s.id ? "location" : undefined}
              onClick={() => {
                setActive(s.id);
                focusFormSection(s.id);
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>
        {children}
        {!!missing.length && (
          <ul className="form-missing">
            {missing.map((m) => (
              <li key={m.id}>
                <button
                  className="outline-link"
                  type="button"
                  onClick={() => focusFormSection(m.id)}
                >
                  {m.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
