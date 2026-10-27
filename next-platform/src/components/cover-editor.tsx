"use client";
import { useEffect, useState } from "react";
import { CoverImage } from "./cover-image";
import { Button } from "./ui/button";
import type { CoverState, CoverSelection } from "@/modules/review-types";
async function json(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  const b = await r.json();
  if (!r.ok) throw Error(b.error);
  return b;
}
const labels = {
  generated: "Otomatik kapak",
  package: "Paketten seçilen görsel",
  upload: "Öğretmenin yüklediği görsel",
};
export function CoverEditor({
  versionId,
  sha256,
  revision,
  disabled,
  onBusy,
}: {
  versionId: string;
  sha256: string;
  revision: number;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
}) {
  const [cover, setCover] = useState<CoverState | null>(null),
    [candidates, setCandidates] = useState<string[]>([]),
    [path, setPath] = useState("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const endpoint = `/api/versions/${versionId}/cover`;
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const b = await json(endpoint);
        if (active) {
          setCover(b.cover);
          setCandidates(b.candidates);
          setLoading(false);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Kapak bilgisi alınamadı.");
          setLoading(false);
        }
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [endpoint, revision]);
  async function select(selection: CoverSelection, file?: File) {
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      const init: RequestInit = file
        ? {
            method: "POST",
            headers: {
              "Content-Type": file.type,
              "X-Package-Sha256": sha256,
              "X-Metadata-Revision": String(revision),
              "X-Cover-Revision": String(cover?.revision ?? 0),
            },
            body: file,
          }
        : {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sha256,
              revision,
              coverRevision: cover?.revision ?? 0,
              selection,
            }),
          };
      const b = await json(
        file ? `/api/versions/${versionId}/thumbnail` : endpoint,
        init,
      );
      setCover(b.cover);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kapak seçilemedi.");
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <fieldset className="cover-editor" disabled={disabled || busy || loading}>
      <legend>Oyun kapağı</legend>
      <div className="cover-editor-layout">
        <div className="cover-preview">
          {cover?.artifact ? (
            <CoverImage
              src={`${endpoint}/image?asset=${cover.artifact.id}`}
              alt="Seçili oyun kapağı"
            />
          ) : (
            <div className="cover-image-frame">
              <p className="cover-image-placeholder" role="status">
                {loading ? "Kapak bilgisi alınıyor…" : "Kapak hazırlanıyor."}
              </p>
            </div>
          )}
          <p className="form-help">
            {cover?.artifact
              ? labels[cover.artifact.source]
              : "Bilgileri kaydettiğinizde otomatik kapak hazırlanır."}
          </p>
        </div>
        <div className="cover-controls">
          <p>
            Oyun görselinizi kullanın veya başlık, ders ve sınıftan kapak
            hazırlayın.
          </p>
          <label htmlFor="cover-upload">
            <span id="cover-upload-label">Kapak görseli yükle</span>
            <input
              id="cover-upload"
              aria-labelledby="cover-upload-label"
              aria-describedby="cover-upload-help"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void select({ mode: "auto" }, file);
                e.target.value = "";
              }}
            />
            <span id="cover-upload-help" className="form-help">
              PNG, JPG, WebP · En fazla 5 MB · Hareketli görsel kabul edilmez.
            </span>
          </label>
          {!!candidates.length && (
            <>
              <label htmlFor="package-cover">
                Paketteki görsel
                <select
                  id="package-cover"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                >
                  <option value="">Bir dosya seçin</option>
                  {candidates.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={!path || busy || disabled}
                onClick={() => void select({ mode: "package", path })}
              >
                Paket görselini kullan
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => void select({ mode: "generated" })}
          >
            Otomatik kapak kullan
          </Button>
        </div>
      </div>
      {cover?.status === "pending" && (
        <p role="status" className="notice">
          Kapak hazırlanıyor. İncelemeye gönderirken güncel kapağı bekleyeceğiz.
        </p>
      )}
      {cover?.warning && <p className="notice">{cover.warning}</p>}
      {(error || cover?.error) && (
        <p role="alert" className="notice error">
          {error || cover?.error} Yeni bir görsel seçebilir veya otomatik kapağı
          kullanabilirsiniz.
        </p>
      )}
    </fieldset>
  );
}
