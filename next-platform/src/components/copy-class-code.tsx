"use client";
import { CopyButton } from "./copy-button";
export function CopyClassCode({ code }: { code: string }) {
  return (
    <span className="copy-class-code">
      <CopyButton
        value={code}
        label="Kodu kopyala"
        successMessage="Kod kopyalandı. Öğrencilerinle paylaşabilirsin."
        errorMessage="Kod kopyalanamadı. Katılım kodunu seçip elle kopyalayabilirsin."
      />
    </span>
  );
}
