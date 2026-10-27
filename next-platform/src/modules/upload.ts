import Busboy from "busboy";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { rm, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import { filePath, initStorage } from "./storage";
import { limits } from "./bundle";
import { fail, AppError } from "../server/errors";
export async function receiveUpload(request: Request, id: string) {
  if (!request.body) fail(400, "Oyun dosyası gerekli.");
  await initStorage();
  const temp = filePath("quarantine", id + ".partial");
  let fields: Record<string, string> = {};
  let fileCount = 0;
  let format = "";
  let originalFilename = "";
  let bytes = 0;
  const hash = createHash("sha256");
  let work: Promise<void> | undefined;
  const bb = Busboy({
    headers: { "content-type": request.headers.get("content-type") || "" },
    limits: {
      files: 1,
      fileSize: limits.upload,
      fields: 1,
      fieldSize: 16000,
      parts: 3,
    },
  });
  let error: Error | undefined;
  bb.on("field", (name, value, info) => {
    if (name !== "metadata" || info.valueTruncated)
      error = new Error("İçerik bilgileri geçersiz.");
    fields[name] = value;
  });
  for (const event of ["filesLimit", "fieldsLimit", "partsLimit"])
    bb.on(event, () => {
      error = new Error("Tek oyun paketi yükleyin.");
    });
  bb.on("file", (_name, stream, info) => {
    fileCount++;
    originalFilename = (info.filename || "")
      .split(/[\\/]/)
      .pop()!
      .slice(0, 255);
    format = /\.zip$/i.test(info.filename || "")
      ? "zip"
      : /\.html?$/i.test(info.filename || "")
        ? "html"
        : "";
    stream.on("limit", () => {
      error = new Error("Dosya 50 MB sınırını aşıyor.");
    });
    work = pipeline(
      stream,
      new Transform({
        transform(chunk, _e, cb) {
          bytes += chunk.length;
          hash.update(chunk);
          cb(null, chunk);
        },
      }),
      createWriteStream(temp, { flags: "wx", mode: 0o600 }),
    );
    work.catch((e) => {
      error = e;
      bb.destroy(e);
    });
  });
  try {
    let received = 0;
    await pipeline(
      Readable.fromWeb(request.body as any),
      new Transform({
        transform(chunk, _encoding, callback) {
          received += chunk.length;
          if (received > limits.upload + 32768)
            callback(new AppError(413, "Yükleme boyutu sınırı aşıldı."));
          else callback(null, chunk);
        },
      }),
      bb,
    );
    await work;
    if (error) fail(400, error.message);
    if (fileCount !== 1 || !format || !bytes)
      fail(400, "HTML veya ZIP oyun paketi seçin.");
    let metadata: unknown;
    try {
      metadata = JSON.parse(fields.metadata || "{}");
    } catch {
      fail(400, "İçerik bilgileri okunamadı.");
    }
    await rename(temp, filePath("quarantine", id));
    return { format, sha256: hash.digest("hex"), metadata, originalFilename };
  } catch (e) {
    await rm(temp, { force: true });
    throw e;
  }
}
