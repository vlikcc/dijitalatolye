import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Self-contained demos cannot depend on cross-origin font requests from their opaque sandbox.
const sans = "node_modules/@fontsource/source-sans-3";
const display = "node_modules/@fontsource-variable/manrope";
const files = [
    [sans, "latin-400.css"],
    [sans, "latin-ext-400.css"],
    [sans, "latin-600.css"],
    [sans, "latin-ext-600.css"],
    [display, "index.css"],
];
let css = "";
for (const [root, filename] of files) {
    const input = await readFile(path.join(root, filename), "utf8");
    const faces = input.match(/@font-face\s*\{[^}]+\}/g) ?? [];
    for (const face of faces) {
        if (root === display && !face.includes("manrope-latin")) continue;
        let embedded = face;
        for (const match of face.matchAll(/url\(([^)]+)\)/g)) {
            const buffer = await readFile(
                path.join(root, match[1].replace(/["']/g, "")),
            );
            const format = match[1].endsWith("woff2") ? "woff2" : "woff";
            embedded = embedded.replace(
                match[0],
                `url(data:font/${format};base64,${buffer.toString("base64")})`,
            );
        }
        css += embedded + "\n";
    }
}
for (const root of [sans, display]) {
    const license = await readFile(path.join(root, "LICENSE"), "utf8");
    css += `\n/* ${root}\n${license.replaceAll("*/", "* /")} */\n`;
}
await writeFile("src/games/font-css.json", JSON.stringify(css) + "\n");
console.log("Embedded Turkish-capable demo fonts with their licenses.");
