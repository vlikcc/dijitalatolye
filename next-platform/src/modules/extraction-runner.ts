import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { ExtractionInput } from "./metadata-extract";
import type { ExtractionReport } from "./curriculum-types";
// This process executes only our static parser. Uploaded scripts are never evaluated.
export function runExtraction(
  input: ExtractionInput,
): Promise<ExtractionReport> {
  return new Promise((resolve, reject) => {
    const child = fork(
      fileURLToPath(new URL("../worker/extract-child.ts", import.meta.url)),
      [],
      {
        execArgv: ["--import", "tsx", "--max-old-space-size=256"],
        stdio: ["ignore", "ignore", "ignore", "ipc"],
        env: { PATH: process.env.PATH, NODE_ENV: process.env.NODE_ENV },
      },
    );
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(Error("Bilgi çıkarımı 30 saniyede tamamlanamadı."));
    }, 30_000);
    child.once(
      "message",
      (m: { report?: ExtractionReport; error?: string }) => {
        clearTimeout(timer);
        if (m.report) resolve(m.report);
        else reject(Error(m.error ?? "Bilgi çıkarımı başarısız."));
      },
    );
    child.once("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.once("exit", () => {
      clearTimeout(timer);
      reject(
        Error("Bilgi çıkarıcı sonlandı; bilgileri elle tamamlayabilirsiniz."),
      );
    });
    child.send(input);
  });
}
