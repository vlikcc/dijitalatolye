import { cp, rm } from "node:fs/promises";
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
await cp("public", ".next/standalone/public", { recursive: true });
// Next's file tracer can include local env files. Runtime secrets must never ship.
for (const name of [
    ".env",
    ".env.local",
    ".env.production",
    ".env.production.local",
])
    await rm(".next/standalone/" + name, { force: true });
