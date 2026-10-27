import { KeyRound } from "lucide-react";
import type { ReactNode } from "react";

export function RecoveryLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      className="auth-box recovery-panel"
      aria-labelledby="recovery-title"
    >
      <span className="recovery-mark" aria-hidden="true">
        <KeyRound size={24} />
      </span>
      <h1 id="recovery-title">{title}</h1>
      <p>{description}</p>
      {children}
    </section>
  );
}
