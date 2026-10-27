"use client";
import { useId, useRef, useState, type ReactNode } from "react";
/** Panels stay mounted: reviewing evidence never discards an unfinished assessment. */
export function WorkspaceSections({
  sections,
}: {
  sections: { title: string; content: ReactNode; note?: string }[];
}) {
  const [active, setActive] = useState(0),
    id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  function select(index: number) {
    setActive(index);
    buttons.current[index]?.focus();
  }
  return (
    <div className="workspace-sections">
      <div
        className="workspace-tabs"
        role="tablist"
        aria-label="İnceleme bölümleri"
      >
        {sections.map((section, index) => (
          <button
            key={section.title}
            ref={(el) => {
              buttons.current[index] = el;
            }}
            role="tab"
            aria-label={section.title}
            aria-describedby={section.note ? `${id}-note-${index}` : undefined}
            type="button"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              select(
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? sections.length - 1
                    : (index +
                        (event.key === "ArrowRight"
                          ? 1
                          : sections.length - 1)) %
                      sections.length,
              );
            }}
          >
            {section.title}
            {section.note && (
              <span id={`${id}-note-${index}`} className="workspace-tab-note">
                {section.note}
              </span>
            )}
          </button>
        ))}
      </div>
      {sections.map((section, index) => (
        <div
          key={section.title}
          id={`${id}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${index}`}
          hidden={active !== index}
          tabIndex={0}
        >
          {section.content}
        </div>
      ))}
    </div>
  );
}
