import { eq } from "drizzle-orm";
import { db, pool } from "../src/server/db";
import { taxonomy } from "../src/server/schema";
// Only taxonomy. Demo games are uploaded through the real pipeline in the E2E fixture.
for (const label of ["Matematik", "Türkçe", "Fen Bilimleri", "Hayat Bilgisi"])
  await db
    .insert(taxonomy)
    .values({ kind: "subject", label })
    .onConflictDoNothing();
console.log(
  "Temel dersler eklendi. Resmî kazanım veya yayımlanmış içerik üretilmedi.",
);
await pool.end();
