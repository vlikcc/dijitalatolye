import {
  CheckCircle2,
  Circle,
  Clock3,
  Info,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";

export type StatusTone =
  "neutral" | "success" | "pending" | "warning" | "error";
const icons = {
  neutral: Circle,
  success: CheckCircle2,
  pending: Clock3,
  warning: Info,
  error: TriangleAlert,
};

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: StatusTone;
  children: ReactNode;
}) {
  const Icon = icons[tone];
  return (
    <span className={`status-badge status-${tone}`}>
      <Icon size={14} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

export function ProgressValue({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(value)) return <span>—</span>;
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <span className="progress-value">
      <span>%{value}</span>
      <span className="progress-value-track" aria-hidden="true">
        <span style={{ width: `${bounded}%` }} />
      </span>
    </span>
  );
}
