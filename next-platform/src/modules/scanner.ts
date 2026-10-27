import net from "node:net";
import { createReadStream } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
export class MalwareError extends Error {}
export async function scannerIdentity() {
  const clam = await new Promise<string>((resolve) => {
    const socket=net.createConnection({host:process.env.CLAMAV_HOST||"127.0.0.1",port:Number(process.env.CLAMAV_PORT||53310)});
    let result="";const done=()=>{socket.destroy();resolve(result.replace(/\0/g,"").trim().slice(0,250));};
    socket.setTimeout(1500,done);socket.on("error",done);socket.on("close",done);
    socket.on("connect",()=>socket.write("zVERSION\0"));socket.on("data",chunk=>{result+=chunk.toString();if(result.includes("\0"))done();});
  });
  let yara="";
  try{yara=(await exec(process.env.YARA_BIN||"yara",["--version"],{timeout:1500,maxBuffer:1024})).stdout.trim();}catch{}
  return [clam,yara?`YARA ${yara}`:""].filter(Boolean).join(" · ") || undefined;
}
export async function clamScan(file: string) {
  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({
      host: process.env.CLAMAV_HOST || "127.0.0.1",
      port: Number(process.env.CLAMAV_PORT || 53310),
    });
    const input = createReadStream(file, { highWaterMark: 64 * 1024 });
    let result = "";
    socket.setTimeout(120000, () =>
      socket.destroy(new Error("ClamAV zaman aşımı.")),
    );
    socket.on("error", reject);
    socket.on("data", (data) => {
      result += data.toString();
      if (result.includes("\0")) socket.end();
    });
    socket.on("close", () => {
      input.destroy();
      if (/FOUND/.test(result))
        reject(new MalwareError("Zararlı içerik tespit edildi."));
      else if (/: OK\0/.test(result)) resolve();
      else reject(new Error("ClamAV taraması tamamlanamadı."));
    });
    socket.on("connect", () => {
      void (async () => {
        socket.write("zINSTREAM\0");
        for await (const chunk of input) {
          const buffer = chunk as Buffer;
          const size = Buffer.alloc(4);
          size.writeUInt32BE(buffer.length);
          await new Promise<void>((res, rej) =>
            socket.write(Buffer.concat([size, buffer]), (e) =>
              e ? rej(e) : res(),
            ),
          );
        }
        socket.write(Buffer.alloc(4));
      })().catch((e) => socket.destroy(e));
    });
  });
}
export async function yaraScan(directory: string) {
  const { stdout } = await exec(
    process.env.YARA_BIN || "yara",
    ["-r", "-f", process.env.YARA_RULES || "deploy/security.yar", directory],
    { timeout: 120000, maxBuffer: 1024 * 1024 },
  );
  if (stdout.trim())
    throw new MalwareError("Paket güvenlik kuralıyla eşleşti.");
}
