// Busboy emits its limit event at exactly 50 MiB; keep the existing server rule.
export const MAX_PACKAGE_BYTES = 50 * 1024 * 1024 - 1;
export const PACKAGE_ACCEPT = ".html,.htm,.zip";

/** Shared by the native picker, drag/drop and submit validation. */
export function validatePackageFiles(
  files: readonly Pick<File, "name" | "size">[],
): string | null {
  if (files.length !== 1) return "Tek seferde yalnızca bir oyun dosyası seçin.";
  const file = files[0];
  if (!/\.(html?|zip)$/i.test(file.name))
    return "HTML (.html, .htm) veya ZIP (.zip) dosyası seçin.";
  if (file.size === 0)
    return "Bu dosya boş. İçeriği olan bir oyun dosyası seçin.";
  if (file.size > MAX_PACKAGE_BYTES)
    return "Dosya 50 MB sınırına ulaşıyor veya aşıyor. 50 MB’dan küçük bir oyun paketi seçin.";
  return null;
}

export function packageFileKind(name: string): string {
  return /\.zip$/i.test(name) ? "ZIP paketi" : "HTML oyunu";
}
export function formatPackageBytes(bytes: number): string {
  const unit = bytes >= 1024 * 1024 ? 1024 * 1024 : bytes >= 1024 ? 1024 : 1;
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(bytes / unit)} ${unit === 1 ? "bayt" : unit === 1024 ? "KB" : "MB"}`;
}
