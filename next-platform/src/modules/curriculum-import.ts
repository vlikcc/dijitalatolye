import {
  readFile,
  readdir,
  realpath,
  stat,
  mkdir,
  copyFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { Ajv2020 } from "ajv/dist/2020.js";
import { eq, sql } from "drizzle-orm";
import { transaction } from "../server/db";
import {
  curriculumCatalogs as catalogs,
  curriculumSources as sources,
  curriculumPrograms as programs,
  curriculumUnits as units,
  curriculumOutcomes as outcomes,
  curriculumApplicability as applicability,
  curriculumComponents as components,
  taxonomy,
} from "../server/schema";
import type {
  CurriculumSource,
  CurriculumProgram,
  CurriculumUnit,
  CurriculumOutcome,
} from "./curriculum-types";

export const digest = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
export const normalizeCode = (code: string) =>
  code
    .normalize("NFC")
    .replace(/\s+/g, "")
    .replace(/\.+$/, "")
    .toLocaleUpperCase("tr-TR");
const core = [
  "schema.json",
  "sources.json",
  "programs.json",
  "units.json",
  "applicability.json",
  "coverage.json",
  "issues.json",
];
async function filesUnder(root: string, relative: string): Promise<string[]> {
  const list: string[] = [];
  for (const item of await readdir(path.join(root, relative), {
    withFileTypes: true,
  })) {
    if (item.isSymbolicLink())
      throw Error("Veri paketinde sembolik bağlantı kabul edilmez.");
    const name = path.posix.join(relative, item.name);
    if (item.isDirectory()) list.push(...(await filesUnder(root, name)));
    else if (item.name.endsWith(".json")) list.push(name);
  }
  return list.sort();
}
type Document<T> = {
  items: T[];
  programId?: string;
  scopeGrades?: number[] | null;
};
export async function inspectCurriculum(input: string) {
  const root = await realpath(input);
  const manifest = JSON.parse(
    await readFile(path.join(root, "file-manifest.json"), "utf8"),
  ) as { files: { path: string; bytes: number; sha256: string }[] };
  const index = new Map(manifest.files.map((f) => [f.path, f]));
  if (index.size !== manifest.files.length)
    throw Error("Manifestte yinelenen dosya yolu.");
  const files = [...core, ...(await filesUnder(root, "outcomes"))];
  const declared = manifest.files
    .filter((f) => f.path.startsWith("outcomes/") && f.path.endsWith(".json"))
    .map((f) => f.path)
    .sort();
  if (
    JSON.stringify(declared) !==
    JSON.stringify(files.filter((f) => f.startsWith("outcomes/")).sort())
  )
    throw Error("Çıktı dosyaları manifest ile eşleşmiyor.");
  const warnings: string[] = [];
  const fingerprint = createHash("sha256");
  for (const name of [...files, "README.md"]) {
    const expected = index.get(name);
    const target = await realpath(path.join(root, name));
    if (!target.startsWith(root + path.sep))
      throw Error("Veri yolu paket dışında.");
    const bytes = await readFile(target);
    if (
      !expected ||
      expected.bytes !== bytes.length ||
      expected.sha256 !== digest(bytes)
    ) {
      if (name === "README.md")
        warnings.push(
          "README.md manifest hash'iyle uyuşmuyor; veri dosyaları ayrıca doğrulandı.",
        );
      else throw Error(`Dosya bütünlüğü doğrulanamadı: ${name}`);
    }
    if (name !== "README.md")
      fingerprint.update(name + "\0" + digest(bytes) + "\n");
  }
  const schema = JSON.parse(
    await readFile(path.join(root, "schema.json"), "utf8"),
  );
  const ajv = new Ajv2020({
    strict: false,
    allErrors: false,
    validateFormats: true,
  });
  ajv.addFormat("uri", {
    type: "string",
    validate: (s: string) => {
      try {
        return Boolean(new URL(s).protocol);
      } catch {
        return false;
      }
    },
  });
  const validate = ajv.compile(schema);
  const read = async <T>(name: string): Promise<Document<T>> => {
    const bytes = await readFile(path.join(root, name));
    const expected = index.get(name);
    if (
      !expected ||
      bytes.length !== expected.bytes ||
      digest(bytes) !== expected.sha256
    )
      throw Error(`Dosya bütünlüğü aktarım sırasında değişti: ${name}`);
    const d = JSON.parse(bytes.toString("utf8"));
    if (!validate(d))
      throw Error(`JSON Schema: ${name}: ${ajv.errorsText(validate.errors)}`);
    return d as Document<T>;
  };
  const sourceItems = (await read<CurriculumSource>("sources.json")).items;
  const programItems = (await read<CurriculumProgram>("programs.json")).items;
  const unitItems = (await read<CurriculumUnit>("units.json")).items;
  const applications = (
    await read<Record<string, unknown>>("applicability.json")
  ).items;
  const coverage = (await read<Record<string, unknown>>("coverage.json")).items;
  await read("issues.json");
  const unique = <T extends { id: string }>(items: T[]) => {
    const m = new Map(items.map((x) => [x.id, x]));
    if (m.size !== items.length) throw Error("Yinelenen kayıt kimliği.");
    return m;
  };
  const sourceMap = unique(sourceItems),
    programMap = unique(programItems),
    unitMap = unique(unitItems);
  for (const s of sourceItems) {
    const u = new URL(s.url);
    if (
      (u.protocol !== "https:" && u.protocol !== "http:") ||
      !(u.hostname === "meb.gov.tr" || u.hostname.endsWith(".meb.gov.tr"))
    )
      throw Error(`Resmî olmayan kaynak: ${s.id}`);
  }
  const refs = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(refs);
      return;
    }
    const obj = value as Record<string, unknown>;
    if (typeof obj.sourceId === "string") {
      const source = sourceMap.get(obj.sourceId);
      if (!source) throw Error(`Kırık kaynak ilişkisi: ${obj.sourceId}`);
      if (
        typeof obj.pdfPage === "number" &&
        source.pageCount &&
        obj.pdfPage > source.pageCount
      )
        throw Error("Kaynak sayfası sınır dışında.");
    }
    Object.values(obj).forEach(refs);
  };
  for (const p of programItems) {
    if (p.sourceIds.some((id) => !sourceMap.has(id)))
      throw Error("Program kaynağı eksik.");
    refs(p);
  }
  for (const u of unitItems) {
    if (
      !programMap.has(u.programId) ||
      (u.parentId && unitMap.get(u.parentId)?.programId !== u.programId)
    )
      throw Error("Ünite ilişkisi geçersiz.");
    refs(u);
  }
  for (const a of applications) {
    if (!programMap.has(String(a.programId)))
      throw Error("Uygulama programı eksik.");
    refs(a);
  }
  const ids = new Set<string>();
  let count = 0,
    unresolved = 0;
  const verification: Record<string, number> = {};
  for (const file of files.filter((f) => f.startsWith("outcomes/"))) {
    const d = await read<CurriculumOutcome>(file);
    for (const o of d.items) {
      if (ids.has(o.id)) throw Error(`Yinelenen kazanım: ${o.id}`);
      ids.add(o.id);
      if (
        !programMap.has(o.programId) ||
        d.programId !== o.programId ||
        (o.unitId && unitMap.get(o.unitId)?.programId !== o.programId)
      )
        throw Error(`Kırık kazanım ilişkisi: ${o.id}`);
      for (const id of [
        ...((o.relatedUnitIds as string[]) ?? []),
        ...(o.unitVariants ?? []).map((v) => v.unitId),
      ])
        if (unitMap.get(id)?.programId !== o.programId)
          throw Error(`Kırık bağlam ilişkisi: ${o.id}`);
      if (
        o.grades?.some(
          (g) => !(programMap.get(o.programId)!.grades ?? []).includes(g),
        )
      )
        throw Error(`Program/sınıf uyuşmuyor: ${o.id}`);
      refs(o);
      count++;
      if (!o.grades?.length) unresolved++;
      verification[o.verificationStatus] =
        (verification[o.verificationStatus] ?? 0) + 1;
    }
  }
  for (const row of coverage) {
    if (!programMap.has(String(row.programId)))
      throw Error("Kapsam programı eksik.");
    refs(row);
  }
  const id = fingerprint.digest("hex");
  try {
    const transfer = JSON.parse(
      await readFile(path.join(root, "transfer.json"), "utf8"),
    );
    if (transfer.catalogId !== id)
      throw Error("Aktarım paketi katalog hash'iyle uyuşmuyor.");
    if (Array.isArray(transfer.warnings))
      for (const warning of transfer.warnings)
        if (typeof warning === "string" && !warnings.includes(warning))
          warnings.push(warning.slice(0, 1000));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  return {
    root,
    files,
    warnings,
    id,
    read,
    sourceItems,
    programItems,
    unitItems,
    applications,
    summary: { outcomes: count, unresolved, verification, coverage },
  };
}

// Explicit aliases only. Other distinct official names remain distinct subjects.
const subjectAliases: Record<string, string> = {
  "İLKOKUL MATEMATİK DERSİ": "Matematik",
  "ORTAOKUL MATEMATİK DERSİ": "Matematik",
  "MATEMATİK DERSİ": "Matematik",
  "İLKOKUL TÜRKÇE DERSİ": "Türkçe",
  "ORTAOKUL TÜRKÇE DERSİ": "Türkçe",
  "TÜRKÇE DERSİ": "Türkçe",
  "FEN BİLİMLERİ DERSİ": "Fen Bilimleri",
  "HAYAT BİLGİSİ DERSİ": "Hayat Bilgisi",
  "BİLİŞİM TEKNOLOJİLERİ VE YAZILIM DERSİ": "Bilişim Teknolojileri ve Yazılım",
};
export async function importCurriculum(input: string) {
  const data = await inspectCurriculum(input);
  await transaction(async (tx, client) => {
    await client.query("SELECT pg_advisory_xact_lock(726352)");
    const old = await tx.query.curriculumCatalogs.findFirst({
      where: eq(catalogs.id, data.id),
    });
    if (!old) {
      await tx.insert(catalogs).values({
        id: data.id,
        status: "staging",
        warnings: data.warnings,
        summary: data.summary,
      });
      for (let i = 0; i < data.sourceItems.length; i += 100)
        await tx
          .insert(sources)
          .values(
            data.sourceItems
              .slice(i, i + 100)
              .map((d) => ({ catalogId: data.id, id: d.id, data: d })),
          );
      for (const p of data.programItems) {
        let subjectId: string | null = null;
        if (p.subjectName && !p.excludedReason) {
          const key = p.subjectName
            .normalize("NFC")
            .trim()
            .replace(/\s+/g, " ");
          const label = subjectAliases[key] ?? key;
          const inserted = await tx
            .insert(taxonomy)
            .values({ kind: "subject", label })
            .onConflictDoNothing()
            .returning();
          subjectId =
            inserted[0]?.id ??
            (
              await client.query(
                "SELECT id FROM taxonomy WHERE kind='subject' AND label=$1",
                [label],
              )
            ).rows[0].id;
        }
        await tx
          .insert(programs)
          .values({ catalogId: data.id, id: p.id, subjectId, data: p });
      }
      for (let i = 0; i < data.unitItems.length; i += 100)
        await tx.insert(units).values(
          data.unitItems.slice(i, i + 100).map((d) => ({
            catalogId: data.id,
            id: d.id,
            programId: d.programId,
            data: d,
          })),
        );
      const unitMap = new Map(data.unitItems.map((u) => [u.id, u]));
      for (const file of data.files.filter((f) => f.startsWith("outcomes/"))) {
        const d = await data.read<CurriculumOutcome>(file);
        for (let i = 0; i < d.items.length; i += 50) {
          const rows = d.items.slice(i, i + 50).map((o) => ({
            catalogId: data.id,
            id: o.id,
            programId: o.programId,
            unitId: o.unitId,
            grades: o.grades ?? [],
            code: o.officialCode ? normalizeCode(o.officialCode) : null,
            text: o.text,
            verificationStatus: o.verificationStatus,
            fingerprint: digest(JSON.stringify(o)),
            searchText: o.text,
            processText: [
              ...(o.processComponents ?? []).map((p) => p.text),
              ...(o.unitVariants ?? []).flatMap((v) =>
                (v.processComponents ?? []).map((p) => p.text),
              ),
            ].join(" "),
            keywordText: (
              unitMap.get(o.unitId ?? "")?.officialKeywords ?? []
            ).join(" "),
            data: o,
          }));
          if (rows.length) await tx.insert(outcomes).values(rows);
          const processes = d.items.slice(i, i + 50).flatMap((o) => [
            ...(o.processComponents ?? []).map((p, j) => ({
              catalogId: data.id,
              outcomeId: o.id,
              contextPath: `/processComponents/${j}`,
              unitId: o.unitId,
              text: p.text,
              data: p,
            })),
            ...(o.unitVariants ?? []).flatMap((v, k) =>
              (v.processComponents ?? []).map((p, j) => ({
                catalogId: data.id,
                outcomeId: o.id,
                contextPath: `/unitVariants/${k}/processComponents/${j}`,
                unitId: v.unitId,
                text: p.text,
                data: p,
              })),
            ),
          ]);
          for (let j = 0; j < processes.length; j += 100)
            await tx.insert(components).values(processes.slice(j, j + 100));
        }
      }
      for (let i = 0; i < data.applications.length; i += 100)
        await tx.insert(applicability).values(
          data.applications.slice(i, i + 100).map((d) => ({
            id: digest(data.id + JSON.stringify(d)),
            catalogId: data.id,
            programId: String(d.programId),
            data: d,
          })),
        );
    }
    await tx
      .update(catalogs)
      .set({ status: "archived" })
      .where(eq(catalogs.status, "active"));
    await tx
      .update(catalogs)
      .set({ status: "active" })
      .where(eq(catalogs.id, data.id));
    await tx.execute(sql`ANALYZE curriculum_outcomes`);
  });
  return {
    id: data.id,
    warnings: data.warnings,
    outcomes: data.summary.outcomes,
  };
}
export async function prepareCurriculum(input: string, output: string) {
  const data = await inspectCurriculum(input);
  const out = path.resolve(output);
  if (out === data.root || out.startsWith(data.root + path.sep))
    throw Error("Kaynak paketin içine yazılamaz.");
  await mkdir(out, { recursive: false });
  const files = [];
  for (const name of [...data.files, "README.md"]) {
    await mkdir(path.dirname(path.join(out, name)), { recursive: true });
    await copyFile(path.join(data.root, name), path.join(out, name));
    const b = await readFile(path.join(out, name));
    files.push({ path: name, bytes: b.length, sha256: digest(b) });
  }
  await writeFile(
    path.join(out, "file-manifest.json"),
    JSON.stringify({ manifestVersion: "1.0.0", files }, null, 2),
  );
  await writeFile(
    path.join(out, "transfer.json"),
    JSON.stringify({ catalogId: data.id, warnings: data.warnings }, null, 2),
  );
  return { id: data.id, output: out };
}
