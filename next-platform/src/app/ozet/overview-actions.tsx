"use client";

import { useState } from "react";
import { Copy, Printer } from "lucide-react";
import styles from "./overview.module.css";

export function OverviewActions() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");

  async function copyLink() {
    setBusy(true);
    setMessage("");
    setFallbackUrl("");
    const url = new URL("/ozet", window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Bağlantı kopyalandı. Ekibinle paylaşabilirsin.");
    } catch {
      setFallbackUrl(url);
      setMessage(
        "Otomatik kopyalanamadı. Aşağıdaki bağlantıyı seçip kopyalayabilirsin.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.sharing}>
      <div className={styles.actions}>
        <button
          type="button"
          className="button button-outline button-sm"
          onClick={copyLink}
          disabled={busy}
        >
          <Copy size={16} aria-hidden="true" />
          Bağlantıyı kopyala
        </button>
        <button
          type="button"
          className="button button-ghost button-sm"
          onClick={() => window.print()}
        >
          <Printer size={16} aria-hidden="true" />
          Yazdır / PDF
        </button>
      </div>
      <p className={styles.feedback} role="status">
        {message}
      </p>
      {fallbackUrl && (
        <label className={styles.copyFallback}>
          Sayfa bağlantısı
          <input
            readOnly
            value={fallbackUrl}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
      )}
    </div>
  );
}
