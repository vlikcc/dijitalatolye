"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton, ActionFeedback } from "./action-feedback";
import { Button } from "./ui/button";
export async function post(url: string, data: unknown = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok)
    throw Error(
      body.error + (body.traceId ? ` (İzleme: ${body.traceId})` : ""),
    );
  return body;
}
export function ActionForm({
  endpoint,
  label,
  children,
  data = {},
  variant = "default",
  successMessage = "İşlem tamamlandı.",
}: {
  endpoint: string;
  label: string;
  successMessage?: string;
  children?: React.ReactNode;
  data?: Record<string, unknown>;
  variant?: "default" | "outline" | "destructive";
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const submitting = useRef(false);
  return (
    <form
      className="form"
      onChange={() => setSuccess(false)}
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        setBusy(true);
        setError("");
        setSuccess(false);
        const fields = Object.fromEntries(new FormData(e.currentTarget));
        try {
          await post(endpoint, { ...data, ...fields });
          setSuccess(true);
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "İşlem başarısız.");
        } finally {
          submitting.current = false;
          setBusy(false);
        }
      }}
    >
      {children}
      {error && <ActionFeedback error>{error}</ActionFeedback>}
      {success && <ActionFeedback>{successMessage}</ActionFeedback>}
      <div>
        <ActionButton variant={variant} busy={busy} label={label} />
      </div>
    </form>
  );
}
export function Preview({ id }: { id: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button
        disabled={busy}
        variant="outline"
        onClick={async () => {
          setBusy(true);
          try {
            const r = await post(`/api/versions/${id}/preview`);
            setUrl(r.url);
            setError("");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Önizleme açılamadı.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? "Hazırlanıyor…"
          : url
            ? "Önizleme bağlantısını yenile"
            : "Oyunu önizle"}
      </Button>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {url && (
        <>
          <Button type="button" variant="outline" onClick={() => setUrl("")}>
            Önizlemeyi kapat
          </Button>
          <p className="form-help">Bağlantı 15 dakika geçerlidir.</p>
          <iframe
            className="game-frame"
            title="Oyun önizlemesi"
            src={url}
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
          />
        </>
      )}
    </>
  );
}
