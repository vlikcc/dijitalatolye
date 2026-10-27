"use client";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "./ui/button";

export function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <section className="empty workspace-error">
      <TriangleAlert size={28} aria-hidden="true" />
      <h1>Çalışma alanı yüklenemedi.</h1>
      <p>Bağlantını kontrol edip yeniden deneyebilirsin.</p>
      <div className="empty-actions">
        <Button onClick={reset}>Yeniden dene</Button>
        <Link className="button button-outline" href="/kesfet">
          Oyunları keşfet
        </Link>
      </div>
    </section>
  );
}
