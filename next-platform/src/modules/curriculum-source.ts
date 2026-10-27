import { readFile, mkdir, writeFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import https from "node:https";
import { lookup } from "node:dns/promises";
import { createHash } from "node:crypto";
import type { CurriculumSource } from "./curriculum-types";
import { settings } from "../server/env";
import { fail } from "../server/errors";
export function officialSourceUrl(raw: string) {
  const u = new URL(raw);
  if (
    !["https:", "http:"].includes(u.protocol) ||
    u.username ||
    u.password ||
    u.port ||
    !(u.hostname === "meb.gov.tr" || u.hostname.endsWith(".meb.gov.tr"))
  )
    throw Error("Kaynak adresi resmî MEB adresi olmalı.");
  u.protocol = "https:";
  return u;
}
const publicIp = (ip: string) =>
  !(
    /^(?:0\.|10\.|127\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.|192\.0\.|198\.(?:18|19)\.|22[4-9]\.|2[3-5]\d\.|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(
      ip,
    ) || ip.includes(":")
  );
async function download(raw: string, redirects = 0): Promise<Buffer> {
  if (redirects > 3) throw Error("Kaynak yönlendirme sınırı.");
  const url = officialSourceUrl(raw);
  const addresses = await lookup(url.hostname, { all: true, family: 4 });
  const address = addresses.find((a) => publicIp(a.address));
  if (!address) throw Error("Kaynak ağ adresi kabul edilmedi.");
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        lookup: ((_host: unknown, opts: { all?: boolean }, cb: any) =>
          opts.all
            ? cb(null, [{ address: address.address, family: 4 }])
            : cb(null, address.address, 4)) as any,
        headers: { "User-Agent": "DijitalAtolye-Curriculum/1.0" },
      },
      (res) => {
        if (
          [301, 302, 303, 307, 308].includes(res.statusCode ?? 0) &&
          res.headers.location
        ) {
          res.resume();
          download(new URL(res.headers.location, url).href, redirects + 1).then(
            resolve,
            reject,
          );
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(Error(`MEB kaynağı alınamadı (${res.statusCode}).`));
          return;
        }
        let size = 0;
        const chunks: Buffer[] = [];
        res.on("data", (b: Buffer) => {
          size += b.length;
          if (size > 50 * 1024 * 1024) {
            req.destroy(Error("Kaynak 50 MiB sınırını aşıyor."));
            return;
          }
          chunks.push(b);
        });
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      },
    );
    const timer = setTimeout(
      () => req.destroy(Error("MEB kaynağı zaman aşımına uğradı.")),
      20_000,
    );
    req.on("close", () => clearTimeout(timer));
    req.on("error", reject);
  });
}
export async function ensureSource(source: CurriculumSource): Promise<string> {
  if (!source.sha256 || !/^[a-f0-9]{64}$/.test(source.sha256))
    fail(409, "Kaynağın doğrulanmış hash'i yok.");
  const root = path.join(settings().dataDir, "curriculum-sources"),
    dest = path.join(root, source.sha256 + ".pdf");
  const valid = (b: Buffer) =>
    b.subarray(0, 5).toString() === "%PDF-" &&
    createHash("sha256").update(b).digest("hex") === source.sha256;
  try {
    if (valid(await readFile(dest))) return dest;
  } catch {}
  const bytes = await download(source.url);
  if (!valid(bytes))
    fail(409, "Kaynak değişmiş veya geçerli PDF değil; doğrulama yapılmadı.");
  await mkdir(root, { recursive: true });
  const temp = dest + "." + crypto.randomUUID();
  try {
    await writeFile(temp, bytes, { mode: 0o600, flag: "wx" });
    await rename(temp, dest);
  } finally {
    await rm(temp, { force: true });
  }
  return dest;
}
