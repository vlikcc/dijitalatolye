import { and, eq } from "drizzle-orm";
import { db, pool, transaction } from "../server/db";
import {
  curriculumCatalogs,
  curriculumPrograms,
  curriculumOutcomes,
  curriculumReviews,
  curriculumSources,
  audit,
  type Metadata,
} from "../server/schema";
import type {
  CurriculumOutcome,
  ExtractionReport,
  OutcomeRef,
  SourceRef,
} from "./curriculum-types";
import { fail } from "../server/errors";
import { normalizeCode } from "./curriculum-import";
import { ensureSource } from "./curriculum-source";
export async function activeCatalog() {
  return db.query.curriculumCatalogs.findFirst({
    where: eq(curriculumCatalogs.status, "active"),
  });
}
export async function curriculumOptions(
  grade?: number,
  subjectId?: string,
  catalogId?: string,
) {
  const catalog = catalogId
    ? await db.query.curriculumCatalogs.findFirst({
        where: eq(curriculumCatalogs.id, catalogId),
      })
    : await activeCatalog();
  if (!catalog) return { catalog: null, programs: [] };
  const result = await pool.query(
    `SELECT p.id,p.subject_id AS "subjectId",p.data,
    COALESCE((SELECT jsonb_agg(a.data) FROM curriculum_applicability a WHERE a.catalog_id=p.catalog_id AND a.program_id=p.id),'[]') AS applicability
    FROM curriculum_programs p JOIN taxonomy t ON t.id=p.subject_id AND t.active
    WHERE p.catalog_id=$1 AND ($2::uuid IS NULL OR p.subject_id=$2) AND ($3::int IS NULL OR p.data->'grades' @> to_jsonb(ARRAY[$3::int]))
    AND COALESCE(p.data->>'excludedReason','')='' ORDER BY p.data->>'officialName'`,
    [catalog.id, subjectId || null, grade || null],
  );
  return {
    catalog: {
      id: catalog.id,
      status: catalog.status,
      summary: catalog.summary,
    },
    programs: result.rows,
  };
}
const stop = new Set(
  "oyun oyunu oyunlar öğrenme öğrenir öğrenci öğrenciler etkinlik ders sınıf kazanım kazanımlar başla başlat doğru yanlış puan tekrar tıkla seç devam et the and of to is a an in on with for you your game click start".split(
    " ",
  ),
);
export function searchWords(text: string) {
  return [
    ...new Set(
      (
        text
          .normalize("NFC")
          .toLocaleLowerCase("tr-TR")
          .match(/[\p{L}\p{N}]{3,}/gu) ?? []
      ).filter((w) => !stop.has(w)),
    ),
  ].slice(0, 80);
}
export type OutcomeCandidate = {
  id: string;
  catalogId: string;
  data: CurriculumOutcome;
  locallyVerified: boolean;
  reason: string;
  evidence: { file: string; location: string; text: string } | null;
};
export async function searchOutcomes(input: {
  catalogId: string;
  programId: string;
  grade: number;
  subjectId: string;
  q?: string;
  page?: number;
  report?: ExtractionReport;
}): Promise<{ items: OutcomeCandidate[]; hasMore: boolean }> {
  const program = await db.query.curriculumPrograms.findFirst({
    where: and(
      eq(curriculumPrograms.catalogId, input.catalogId),
      eq(curriculumPrograms.id, input.programId),
    ),
  });
  if (
    !program ||
    program.subjectId !== input.subjectId ||
    !program.data.grades?.includes(input.grade)
  )
    fail(400, "Program, ders ve sınıf eşleşmiyor.");
  const auto = Boolean(input.report);
  const codes = (input.report?.codes ?? []).map((c) => normalizeCode(c.code));
  const raw = auto
    ? [
        input.report?.fields.title?.value,
        input.report?.fields.description?.value,
        ...input.report!.passages.map((p) => p.text),
      ].join(" ")
    : (input.q ?? "");
  const words = searchWords(raw);
  if (auto && !codes.length && words.length < 2)
    return { items: [], hasMore: false };
  const query = words.map((w) => `'${w}'`).join(" | ");
  const limit = auto ? 10 : 20,
    offset = auto ? 0 : Math.min(input.page ?? 0, 1000) * limit;
  const rows = await pool.query(
    `WITH query AS (SELECT CASE WHEN $5='' THEN NULL ELSE to_tsquery('turkish',$5) END AS ts,
      tsvector_to_array(to_tsvector('turkish',$6)) AS terms)
    SELECT o.id,o.data,o.catalog_id AS "catalogId",o.code,
      EXISTS(SELECT 1 FROM curriculum_reviews r WHERE r.catalog_id=o.catalog_id AND r.outcome_id=o.id AND r.fingerprint=o.fingerprint) AS "locallyVerified",
      o.code=ANY($7::text[]) AS exact,
      (SELECT count(*) FROM unnest(tsvector_to_array(to_tsvector('turkish',o.search_text||' '||o.process_text))) w WHERE w=ANY(query.terms)) AS hits,
      ts_rank_cd(setweight(to_tsvector('turkish',o.search_text),'A') || setweight(to_tsvector('turkish',o.process_text),'B') || setweight(to_tsvector('turkish',o.keyword_text),'D'),query.ts) AS rank
    FROM curriculum_outcomes o CROSS JOIN query
    WHERE o.catalog_id=$1 AND o.program_id=$2 AND $3=ANY(o.grades)
      AND ($4::boolean AND (o.code=ANY($7::text[]) OR (query.ts IS NOT NULL AND to_tsvector('turkish',o.search_text||' '||o.process_text) @@ query.ts
        AND (SELECT count(*) FROM unnest(tsvector_to_array(to_tsvector('turkish',o.search_text||' '||o.process_text))) w WHERE w=ANY(query.terms))>=2))
      OR NOT $4::boolean AND ($6='' OR o.code=$8 OR to_tsvector('turkish',o.search_text||' '||o.process_text||' '||o.keyword_text) @@ query.ts OR ($9::boolean AND word_similarity($6,lower(o.text))>0.5)))
    ORDER BY exact DESC NULLS LAST,rank DESC NULLS LAST,o.code,o.id LIMIT $10 OFFSET $11`,
    [
      input.catalogId,
      input.programId,
      input.grade,
      auto,
      query,
      words.join(" "),
      codes,
      normalizeCode(input.q ?? ""),
      !auto && (input.q?.length ?? 0) < 80,
      limit + 1,
      offset,
    ],
  );
  const items = rows.rows.slice(0, limit).map((row) => {
    const exact = input.report?.codes.find(
      (c) => normalizeCode(c.code) === row.code,
    );
    const terms = searchWords(
      row.data.text +
        " " +
        (row.data.processComponents ?? [])
          .map((c: { text: string }) => c.text)
          .join(" "),
    );
    const ranked = [
      ...Object.values(input.report?.fields ?? {}).map((f) => f.evidence),
      ...(input.report?.passages ?? []),
    ]
      .map((p) => ({
        p,
        n: searchWords(p.text).filter((w) =>
          terms.some(
            (t) =>
              t === w ||
              (t.length >= 4 && w.startsWith(t)) ||
              (w.length >= 4 && t.startsWith(w)),
          ),
        ).length,
      }))
      .sort((a, b) => b.n - a.n);
    const evidence = exact?.evidence ?? (ranked[0]?.n ? ranked[0].p : null);
    return {
      id: row.id,
      catalogId: row.catalogId,
      data: row.data,
      locallyVerified: row.locallyVerified,
      reason: exact
        ? "Pakette belirtilmiş"
        : auto
          ? "Metin eşleşmesi"
          : "Katalog araması",
      evidence,
    };
  });
  return {
    hasMore: rows.rows.length > limit,
    items: auto ? items.filter((item) => item.evidence !== null) : items,
  };
}
export async function validateCurriculumMetadata(m: Metadata) {
  if (!m.outcomeRefs?.length && !m.programId) return;
  if (!m.catalogId || !m.programId) fail(400, "Kazanımlar için program seçin.");
  const program = await db.query.curriculumPrograms.findFirst({
    where: and(
      eq(curriculumPrograms.catalogId, m.catalogId),
      eq(curriculumPrograms.id, m.programId),
    ),
  });
  if (
    !program ||
    program.subjectId !== m.subjectId ||
    !program.data.grades?.includes(m.grade)
  )
    fail(400, "Program, sınıf ve ders uyuşmuyor.");
  if (
    program.data.schoolTypes?.length &&
    (!m.schoolType || !program.data.schoolTypes.includes(m.schoolType))
  )
    fail(400, "Programın okul türünü seçin.");
  for (const ref of m.outcomeRefs ?? []) {
    if (ref.catalogId !== m.catalogId)
      fail(400, "Kazanım katalog sürümü farklı.");
    const o = await db.query.curriculumOutcomes.findFirst({
      where: and(
        eq(curriculumOutcomes.catalogId, ref.catalogId),
        eq(curriculumOutcomes.id, ref.outcomeId),
      ),
    });
    if (!o || o.programId !== m.programId || !o.grades.includes(m.grade))
      fail(400, "Kazanım seçilen program ve sınıfa ait değil.");
  }
}
export async function selectedOutcomes(refs: OutcomeRef[] = []) {
  const list = [];
  for (const ref of refs) {
    const o = await db.query.curriculumOutcomes.findFirst({
      where: and(
        eq(curriculumOutcomes.catalogId, ref.catalogId),
        eq(curriculumOutcomes.id, ref.outcomeId),
      ),
    });
    if (!o) continue;
    const reviews = await db
      .select()
      .from(curriculumReviews)
      .where(
        and(
          eq(curriculumReviews.catalogId, ref.catalogId),
          eq(curriculumReviews.outcomeId, o.id),
          eq(curriculumReviews.fingerprint, o.fingerprint),
        ),
      );
    list.push({ ...o, locallyVerified: reviews.length > 0 });
  }
  return list;
}
export function collectSourceRefs(value: unknown): SourceRef[] {
  const refs: SourceRef[] = [];
  const visit = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) {
      v.forEach(visit);
      return;
    }
    const o = v as Record<string, unknown>;
    if (typeof o.sourceId === "string") refs.push(o as SourceRef);
    Object.values(o).forEach(visit);
  };
  visit(value);
  return refs;
}
export async function outcomeEvidence(catalogId: string, outcomeId: string) {
  const o = await db.query.curriculumOutcomes.findFirst({
    where: and(
      eq(curriculumOutcomes.catalogId, catalogId),
      eq(curriculumOutcomes.id, outcomeId),
    ),
  });
  if (!o) fail(404, "Kazanım bulunamadı.");
  const program = await db.query.curriculumPrograms.findFirst({
    where: and(
      eq(curriculumPrograms.catalogId, catalogId),
      eq(curriculumPrograms.id, o.programId),
    ),
  });
  const refs = collectSourceRefs(o.data);
  const ids = [
    ...new Set([
      ...refs.map((r) => r.sourceId),
      ...collectSourceRefs(program?.data).map((r) => r.sourceId),
    ]),
  ];
  const sources = [];
  for (const id of ids) {
    const s = await db.query.curriculumSources.findFirst({
      where: and(
        eq(curriculumSources.catalogId, catalogId),
        eq(curriculumSources.id, id),
      ),
    });
    if (s) sources.push(s.data);
  }
  return { outcome: o, program: program?.data, sources, refs };
}
export async function reviewOutcome(
  catalogId: string,
  outcomeId: string,
  fingerprint: string,
  actorId: string,
  note: string,
) {
  const evidence = await outcomeEvidence(catalogId, outcomeId);
  if (evidence.outcome.fingerprint !== fingerprint)
    fail(409, "Kazanım değişti; kaynağı yeniden inceleyin.");
  if (!evidence.outcome.grades.length || !evidence.program?.grades?.length)
    fail(400, "Sınıf kapsamı çözülmeden kaynak onaylanamaz.");
  const sourceHashes: Record<string, string> = {};
  if (!evidence.sources.length) fail(400, "Doğrulanabilir kaynak yok.");
  for (const s of evidence.sources) {
    if (!s.sha256 || !s.documentType.endsWith("pdf"))
      fail(409, "Kaynak belgesi hash ile doğrulanamıyor.");
    await ensureSource(s);
    sourceHashes[s.id] = s.sha256;
  }
  await transaction(async (tx) => {
    await tx.insert(curriculumReviews).values({
      catalogId,
      outcomeId,
      fingerprint,
      actorId,
      sourceHashes,
      note,
    });
    await tx.insert(audit).values({
      actorId,
      action: "curriculum.source_verified",
      targetId: outcomeId,
      details: { catalogId, fingerprint, sourceHashes },
    });
  });
}
