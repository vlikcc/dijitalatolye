import { Check, CircleAlert } from "lucide-react";
import type { PublicationProgress as Progress } from "@/lib/publication-progress";

// ReUI Stepper's indicator/title/separator presentation, adapted as a static list.
// No tablist, clickable steps or external runtime. MIT: docs/third-party/21st-pilot.md.
export function PublicationProgress({ progress }: { progress: Progress }) {
  return (
    <section
      className="publication-progress"
      aria-label="Yükleme ve yayın durumu"
    >
      <ol className="publication-steps" aria-label="Yayın aşamaları">
        {progress.steps.map((step, index) => (
          <li
            key={step.label}
            data-status={step.status}
            aria-current={step.current ? "step" : undefined}
          >
            <span className="publication-step-indicator" aria-hidden="true">
              {step.status === "complete" ? (
                <Check size={17} />
              ) : step.status === "error" ? (
                <CircleAlert size={18} />
              ) : (
                index + 1
              )}
            </span>
            <span className="publication-step-copy">
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="publication-summary" data-tone={progress.tone}>
        <h2>{progress.title}</h2>
        <p>{progress.description}</p>
        {progress.action && (
          <a href={progress.action.href}>{progress.action.label}</a>
        )}
      </div>
      {progress.previousPublicationLive && (
        <p className="publication-live-note">
          Önceki sürüm yayında. Bu sürüm üzerinde çalışmanız mevcut yayını
          değiştirmez; yeni sürüm onaylanıp yayınlandığında onun yerini alır.
        </p>
      )}
    </section>
  );
}
