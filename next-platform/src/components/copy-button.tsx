"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({
  value,
  label = "Kopyala",
  successMessage = "Kopyalandı.",
  errorMessage = "Kopyalanamadı. Metni seçip elle kopyalayabilirsin.",
}: {
  value: string;
  label?: string;
  successMessage?: string;
  errorMessage?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    setState("idle");
  }, [value]);
  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), 2400);
    return () => clearTimeout(timer);
  }, [state]);
  return (
    <span className="copy-control">
      <button
        type="button"
        className="button button-outline button-sm"
        disabled={busy}
        onClick={async () => {
          if (lock.current) return;
          lock.current = true;
          setBusy(true);
          try {
            await navigator.clipboard.writeText(value);
            setState("copied");
          } catch {
            setState("error");
          } finally {
            lock.current = false;
            setBusy(false);
          }
        }}
      >
        {state === "copied" ? (
          <Check size={15} aria-hidden="true" />
        ) : (
          <Copy size={15} aria-hidden="true" />
        )}
        <span className="action-button-label">
          <span
            className={state === "copied" ? "action-label-hidden" : ""}
            aria-hidden={state === "copied"}
          >
            {label}
          </span>
          <span
            className={state === "copied" ? "" : "action-label-hidden"}
            aria-hidden={state !== "copied"}
          >
            Kopyalandı
          </span>
        </span>
      </button>
      <span
        className={`form-help ${state === "error" ? "error" : ""}`}
        role="status"
      >
        {state === "copied"
          ? successMessage
          : state === "error"
            ? errorMessage
            : ""}
      </span>
    </span>
  );
}
