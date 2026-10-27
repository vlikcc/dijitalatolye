import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { demoGames } from "../src/games/demos";
import { demoDocument } from "../src/games/demo-document";
await mkdir("public/game-covers", { recursive: true });
await mkdir("fixtures/atlas", { recursive: true });
await mkdir(".impeccable/assets", { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 720, height: 440 },
    deviceScaleFactor: 1,
  });
  for (const game of demoGames) {
    await writeFile(`fixtures/atlas/${game.slug}.html`, demoDocument(game));
    await page.setContent(demoDocument(game, true), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const pixels = await page.screenshot({ type: "png" });
    await sharp(pixels)
      .webp({ quality: 92 })
      .toFile(`public/game-covers/${game.slug}.webp`);
  }
  await writeFile(
    ".impeccable/assets/game-covers.json",
    JSON.stringify(
      {
        origin:
          "Browser captures of each bundled game's actual scene, rendered with demoDocument(game, true). No external artwork or invented game imagery.",
        command: "pnpm demos:build",
        sources: [
          "src/games/demos.ts",
          "src/games/scenes.ts",
          "src/games/demo-document.ts",
        ],
        outputs: demoGames.map((g) => `public/game-covers/${g.slug}.webp`),
      },
      null,
      2,
    ),
  );
  console.log(
    `Built ${demoGames.length} self-contained HTML demos and their real scene captures.`,
  );
} finally {
  await browser.close();
}
