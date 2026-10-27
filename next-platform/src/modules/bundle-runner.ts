import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import { BundleError, type validateSources } from "./bundle";
import type { FileRecord } from "../server/schema";
import type { Finding } from "./review-types";
export function validateBundleInChild(
  root: string,
  manifest: FileRecord[],
  selected?: string,
): ReturnType<typeof validateSources> {
  return new Promise((resolve, reject) => {
    const child = fork(
      fileURLToPath(new URL("../worker/bundle-child.ts", import.meta.url)),
      [],
      {
        execArgv: ["--import", "tsx", "--max-old-space-size=256"],
        stdio: ["ignore", "ignore", "ignore", "ipc"],
        env: { PATH: process.env.PATH, NODE_ENV: process.env.NODE_ENV },
      },
    );
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(Error("Paket analizi 30 saniyede tamamlanamadı."));
    }, 30000);
    child.once(
      "message",
      (m: {
        result?: Awaited<ReturnType<typeof validateSources>>;
        error?: string;
        finding?: Finding;
        rejected?: boolean;
      }) => {
        clearTimeout(timer);
        if (m.result) resolve(m.result);
        else
          reject(
            m.rejected
              ? new BundleError(m.error ?? "Paket doğrulanamadı.", m.finding)
              : Error(m.error ?? "Paket analizi tamamlanamadı."),
          );
      },
    );
    child.once("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.once("exit", () => {
      clearTimeout(timer);
      reject(Error("Paket analiz süreci tamamlanmadan sonlandı."));
    });
    child.send({ root, manifest, selected });
  });
}
