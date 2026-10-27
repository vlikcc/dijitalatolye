import { ZipFile } from "yazl";
import { readdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
const z = new ZipFile();
for (const name of await readdir("fixtures/demo"))
  z.addFile("fixtures/demo/" + name, name);
z.end();
await pipeline(z.outputStream, createWriteStream("fixtures/demo-game.zip"));
