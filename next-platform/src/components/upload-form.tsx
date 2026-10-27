"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { CoverFilePicker } from "./cover-file-picker";
import { PackageFilePicker } from "./package-file-picker";
import { PublicationProgress } from "./publication-progress";
import { getPublicationProgress } from "@/lib/publication-progress";
import { validatePackageFiles } from "@/lib/package-file";
import {
  createUploadContent,
  uploadPackage,
  uploadOptionalCover,
} from "@/lib/package-upload";

export function UploadForm({ contentId }: { contentId?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<
    "preparing" | "uploading" | "saving" | "cover"
  >("preparing");
  const [percent, setPercent] = useState<number | null>(null);
  const [knownContentId, setKnownContentId] = useState(contentId);
  const content = useRef(contentId);
  const savedVersion = useRef<string | null>(null);
  // A synchronous latch also blocks two submissions before React commits disabled.
  const submitting = useRef(false);
  const progress = getPublicationProgress({
    uploadPhase: busy ? phase : file ? "ready" : "empty",
  });
  return (
    <form
      className="form upload-first"
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting.current) return;
        const problem = file
          ? validatePackageFiles([file])
          : "Önce bir HTML veya ZIP oyun dosyası seçin.";
        if (problem) {
          setError(problem);
          return;
        }
        const form = new FormData(e.currentTarget);
        submitting.current = true;
        setBusy(true);
        setError("");
        setPercent(null);
        setPhase("preparing");
        try {
          if (!content.current) {
            const id = await createUploadContent();
            content.current = id;
            setKnownContentId(id);
          }
          const id = content.current!;
          if (!savedVersion.current) {
            setPhase("uploading");
            const result = await uploadPackage(id, file!, setPercent, () => {
              setPercent(100);
              setPhase("saving");
            });
            savedVersion.current = result.versionId;
          }
          const thumbnail = form.get("thumbnail");
          let coverFailed = false;
          if (thumbnail instanceof File && thumbnail.size) {
            setPhase("cover");
            try {
              await uploadOptionalCover(id, savedVersion.current, thumbnail);
            } catch {
              coverFailed = true;
            }
          }
          window.location.assign(
            `/ogretmen/icerik/${encodeURIComponent(id)}${coverFailed ? "?cover=failed" : ""}`,
          );
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Yükleme tamamlanamadı. İçerik kaydını kontrol edin.",
          );
          submitting.current = false;
          setBusy(false);
        }
      }}
    >
      <PublicationProgress progress={progress} />
      <PackageFilePicker
        file={file}
        disabled={busy}
        onChange={(next) => {
          setFile(next);
          setError("");
          setPercent(null);
        }}
      />
      <CoverFilePicker disabled={busy} />
      {busy && (
        <div className="package-transfer" role="status" aria-live="polite">
          {phase === "uploading" && (
            <progress
              max={100}
              value={percent ?? undefined}
              aria-label="Dosya aktarım ilerlemesi"
            />
          )}
          <p>
            {phase === "preparing"
              ? "Yükleme kaydı hazırlanıyor…"
              : phase === "cover"
                ? "Oyun dosyanız kaydedildi; kapak ekleniyor…"
                : phase === "saving"
                  ? "Sunucuya kaydediliyor…"
                  : percent === null
                    ? "Dosya aktarılıyor…"
                    : `Dosya aktarılıyor: %${percent}`}
          </p>
        </div>
      )}
      {error && (
        <div className="notice error" role="alert">
          <p>{error}</p>
          <Link
            href={
              knownContentId
                ? `/ogretmen/icerik/${encodeURIComponent(knownContentId)}`
                : "/ogretmen"
            }
          >
            {knownContentId
              ? "İçerik kaydını kontrol et"
              : "İçeriklerim listesini kontrol et"}
          </Link>
        </div>
      )}
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? "Yükleme sürüyor…" : "Yükle ve taramayı başlat"}
        </Button>
      </div>
    </form>
  );
}
