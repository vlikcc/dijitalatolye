import { CheckCircle2, LoaderCircle, TriangleAlert } from "lucide-react";
import { Button } from "./ui/button";
import type { ComponentProps, ReactNode } from "react";

export function ActionFeedback({
  error = false,
  children,
}: {
  error?: boolean;
  children: ReactNode;
}) {
  const Icon = error ? TriangleAlert : CheckCircle2;
  return (
    <p
      className={`action-feedback ${error ? "error" : "action-success"}`}
      role={error ? "alert" : "status"}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function ActionButton({
  busy,
  label,
  pendingLabel = "İşleniyor…",
  success = false,
  successLabel = "Tamamlandı",
  ...props
}: Omit<ComponentProps<typeof Button>, "children"> & {
  busy: boolean;
  label: string;
  pendingLabel?: string;
  success?: boolean;
  successLabel?: string;
}) {
  const state = busy ? "pending" : success ? "success" : "idle";
  return (
    <Button {...props} disabled={props.disabled || busy} aria-busy={busy}>
      <span className="action-button-label">
        <span
          className={state === "idle" ? "" : "action-label-hidden"}
          aria-hidden={state !== "idle"}
        >
          {label}
        </span>
        <span
          className={state === "pending" ? "" : "action-label-hidden"}
          aria-hidden={state !== "pending"}
        >
          <LoaderCircle size={16} className="spinner" aria-hidden="true" />
          {pendingLabel}
        </span>
        {success && (
          <span
            className={state === "success" ? "" : "action-label-hidden"}
            aria-hidden={state !== "success"}
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            {successLabel}
          </span>
        )}
      </span>
    </Button>
  );
}
