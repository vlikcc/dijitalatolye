"use client";
import { useId, useRef, useState } from "react";
import { FileArchive, FileCode2, UploadCloud } from "lucide-react";
import { Button } from "./ui/button";
import {
  formatPackageBytes,
  packageFileKind,
  PACKAGE_ACCEPT,
  validatePackageFiles,
} from "@/lib/package-file";

// Adapted from Extend File Upload (MIT); see docs/third-party/21st-pilot.md.
// File selection only: no network calls, object URLs or HTML execution.
export function PackageFilePicker({
  file,
  onChange,
  disabled = false,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const choose = useRef<HTMLButtonElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const Icon = file && /\.zip$/i.test(file.name) ? FileArchive : FileCode2;
  const select = (files: File[]) => {
    if (disabled || !files.length) return;
    const problem = validatePackageFiles(files);
    setError(problem ?? "");
    if (!problem) onChange(files[0]);
  };
  return (
    <div className="package-picker">
      <label htmlFor={id}>Oyun paketi</label>
      <input
        ref={input}
        id={id}
        className="sr-only package-picker-input"
        type="file"
        name="archive"
        accept={PACKAGE_ACCEPT}
        disabled={disabled}
        tabIndex={-1}
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
        aria-invalid={!!error}
        onChange={(e) => {
          select(Array.from(e.currentTarget.files ?? []));
          e.currentTarget.value = "";
        }}
      />
      <div
        className="package-dropzone"
        data-dragging={!disabled && dragging}
        aria-disabled={disabled}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled && e.dataTransfer.types.includes("Files")) {
            dragDepth.current++;
            setDragging(true);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = disabled ? "none" : "copy";
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (!dragDepth.current) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          select(Array.from(e.dataTransfer.files));
        }}
      >
        {file ? (
          <div className="package-selection" role="status">
            <Icon size={28} aria-hidden="true" />
            <div>
              <strong className="package-filename">{file.name}</strong>
              <span className="form-help">
                {formatPackageBytes(file.size)} · {packageFileKind(file.name)}
              </span>
            </div>
          </div>
        ) : (
          <div className="package-empty">
            <UploadCloud size={28} aria-hidden="true" />
            <p>
              Oyun dosyanızı buraya bırakın
              <br />
              <span className="form-help">veya cihazınızdan seçin.</span>
            </p>
          </div>
        )}
        <div className="actions">
          <Button
            ref={choose}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
            onClick={() => input.current?.click()}
          >
            {file ? "Dosyayı değiştir" : "Dosya seç"}
          </Button>
          {file && (
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={() => {
                onChange(null);
                setError("");
                choose.current?.focus();
              }}
            >
              Dosyayı kaldır
            </Button>
          )}
        </div>
      </div>
      <p id={`${id}-help`} className="form-help">
        Tek HTML veya ZIP · 50 MB’dan küçük, en fazla 500 dosya. Oyun kaynakları
        paketin içinde olmalı. Dosya seçmek yüklemeyi başlatmaz.
      </p>
      {error && (
        <p id={`${id}-error`} className="notice error" role="alert">
          {error}
          {file && " Önceki dosyanız korunuyor."}
        </p>
      )}
    </div>
  );
}
