import { readFile, mkdir, writeFile, copyFile } from "node:fs/promises";
import { demoGames } from "../src/games/demos";
import { demoDocument } from "../src/games/demo-document";
import { ZipFile } from "yazl";
const runtime = await readFile("src/games/pilot-runtime.js", "utf8");
const types = ["choice", "match", "order", "sort"] as const;
for (const type of types) {
  const g = demoGames.find((g) => g.rounds.every((r) => r.type === type))!;
  const root = `fixtures/learning/${type}`;
  await mkdir(root, { recursive: true });
  const html = demoDocument(g).replace(
    /<script>[^]*?<\/script>\s*<\/body>/,
    '<script src="dijital-atolye.js"></script><script src="game.js"></script></body>',
  );
  if (!html.includes('src="game.js"'))
    throw Error("Demo document runtime slot changed.");
  await writeFile(`${root}/index.html`, html);
  await writeFile(`${root}/game.js`, runtime);
  await copyFile("sdk/dijital-atolye.js", `${root}/dijital-atolye.js`);
  await writeFile(
    `${root}/manifest.json`,
    JSON.stringify({ entrypoint: "index.html", tracking: 1 }, null, 2),
  );
  await writeFile(
    `${root}/dijitalatolye.json`,
    JSON.stringify(
      {
        schemaVersion: 1,
        title: g.title + " — Kayıt pilotu",
        description: g.description,
        grade: g.grade,
        subject:
          (
            {
              matematik: "Matematik",
              turkce: "Türkçe",
              fen: "Fen Bilimleri",
              hayat: "Hayat Bilgisi",
            } as Record<string, string>
          )[g.subject] || "Fen Bilimleri",
      },
      null,
      2,
    ),
  );
  const zip = new ZipFile();
  for (const f of [
    "index.html",
    "game.js",
    "dijital-atolye.js",
    "manifest.json",
    "dijitalatolye.json",
  ])
    zip.addFile(`${root}/${f}`, f);
  zip.end();
  const chunks: Buffer[] = [];
  for await (const chunk of zip.outputStream)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  await writeFile(`fixtures/learning/${type}.zip`, Buffer.concat(chunks));
  console.log(`Built ${type}: ${g.title}`);
}
