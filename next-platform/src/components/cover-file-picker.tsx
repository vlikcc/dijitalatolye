"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ImageOff, X } from "lucide-react";

export function CoverFilePicker({ disabled }: { disabled: boolean }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return (
    <div className="cover-file-picker">
      <label htmlFor={id}>Kapak görseli (isteğe bağlı)</label>
      <input
        ref={input}
        id={id}
        name="thumbnail"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={disabled}
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
        aria-invalid={!!error}
        onChange={(e) => {
          const selected = e.currentTarget.files?.[0] ?? null;
          const problem =
            selected &&
            (!["image/png", "image/jpeg", "image/webp"].includes(selected.type)
              ? "PNG, JPG veya WebP görseli seç."
              : selected.size > 5 * 1024 * 1024
                ? "Kapak en fazla 5 MB olabilir."
                : selected.size === 0
                  ? "Boş bir dosya seçilemez."
                  : "");
          setError(problem || "");
          setBroken(false);
          setFile(problem ? null : selected);
          if (problem) e.currentTarget.value = "";
        }}
      />
      <p className="form-help" id={`${id}-help`}>
        PNG, JPG veya WebP · En fazla 5 MB. Kapağı daha sonra da ekleyebilirsin.
      </p>
      {error && (
        <p className="error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
      {file && (
        <div className="cover-file-selected">
          {url && !broken ? (
            <img
              src={url}
              alt="Seçilen kapak önizlemesi"
              width={120}
              height={74}
              onError={() => setBroken(true)}
            />
          ) : (
            <ImageOff size={24} aria-hidden="true" />
          )}
          <div>
            <strong>{file.name}</strong>
            <p className="form-help">
              {(file.size / 1024 / 1024).toLocaleString("tr-TR", {
                maximumFractionDigits: 2,
              })}{" "}
              MB · Henüz yüklenmedi
            </p>
            {broken && (
              <p className="form-help">
                Bu dosyanın önizlemesi gösterilemiyor.
              </p>
            )}
          </div>
          <button
            className="button button-ghost button-sm"
            type="button"
            disabled={disabled}
            onClick={() => {
              setFile(null);
              setBroken(false);
              setError("");
              if (input.current) {
                input.current.value = "";
                input.current.focus();
              }
            }}
          >
            <X size={15} aria-hidden="true" />
            Kaldır
          </button>
        </div>
      )}
    </div>
  );
}
