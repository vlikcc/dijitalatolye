import { selectedOutcomes } from "./curriculum";
import { cache } from "react";
import { and, eq, or, sql, inArray } from "drizzle-orm";
import { catalog } from "./content";
import { gameUrl } from "./game-access";
import { db } from "../server/db";
import { contents, versions, taxonomy, user, grades } from "../server/schema";
import { demoGames } from "../games/demos";
import {
  filterGames,
  subjectKey,
  subjects,
  type CatalogGame,
  type CatalogFilters,
} from "../lib/catalog-model";
export function demosEnabled() {
  return process.env.DEMO_CATALOG_ENABLED === "true";
}
export const bundledGames = (): CatalogGame[] =>
  demosEnabled()
    ? demoGames.map((g) => ({
        id: g.slug,
        slug: g.slug,
        title: g.title,
        description: g.description,
        subject: subjects.find((s) => s.key === g.subject)!.label,
        subjectKey: g.subject,
        grade: g.grade,
        minutes: g.minutes,
        mechanic: g.mechanic,
        cover: `/game-covers/${g.slug}.webp`,
        kind: "demo",
        author: "Atölye demo ekibi",
        objectives: [g.objective],
        teacherNotes: [g.teacherNote],
        gameUrl: `/demo-games/${g.slug}`,
      }))
    : [];
export const libraryOptions = cache(async () => {
  const [taxa, activeGrades] = await Promise.all([
    db
      .select()
      .from(taxonomy)
      .where(and(eq(taxonomy.kind, "subject"), eq(taxonomy.active, true), or(
        sql`EXISTS (SELECT 1 FROM contents c JOIN content_versions v ON v.id=c.published_version_id WHERE v.metadata->>'subjectId'=${taxonomy.id}::text)`,
        demosEnabled() ? inArray(taxonomy.label, [...new Set(bundledGames().map(g=>g.subject))]) : undefined,
      ))),
    db
      .select()
      .from(grades)
      .where(eq(grades.active, true))
      .orderBy(grades.value),
  ]);
  return {
    subjects: taxa.map((t) => ({
      id: t.id,
      key: subjectKey(t.label) === "other" ? t.id : subjectKey(t.label),
      label: t.label,
    })),
    grades: activeGrades.map((g) => g.value),
  };
});
export async function libraryGames(filters: CatalogFilters = {}) {
  const options = await libraryOptions();
  const selected = options.subjects.find(
    (s) => s.key === filters.subject || s.id === filters.subject,
  );
  if (filters.subject && !selected) return [];
  const published = await catalog({ ...filters, subject: selected?.id });
  const demos = filterGames(bundledGames(), {
    ...filters,
    subject: selected?.key,
  });
  return [
    ...demos,
    ...published.map(({ content, version, subject }): CatalogGame => ({
      id: content.id,
      slug: content.slug,
      title: version.metadata.title,
      description: version.metadata.description ?? "",
      subject: subject ?? "Diğer",
      subjectKey: subjectKey(subject ?? ""),
      subjectId: version.metadata.subjectId,
      grade: version.metadata.grade,
      cover: version.thumbnail ? `/api/thumbnails/${version.id}` : undefined,
      kind: "published",
      author: version.metadata.demo
        ? "Demo öğretmen paylaşımı"
        : "Öğretmen paylaşımı",
      objectives: [],
      teacherNotes: [],
    })),
  ];
}
export async function libraryGame(slug: string): Promise<CatalogGame | null> {
  const demo = bundledGames().find((g) => g.slug === slug);
  if (demo) return demo;
  if (demoGames.some((g) => g.slug === slug)) return null;
  const c = await db.query.contents.findFirst({
    where: eq(contents.slug, slug),
  });
  if (!c?.publishedVersionId) return null;
  const v = await db.query.versions.findFirst({
    where: eq(versions.id, c.publishedVersionId),
  });
  if (!v) return null;
  const [subject, author, outcomes] = await Promise.all([
    db.query.taxonomy.findFirst({
      where: eq(taxonomy.id, v.metadata.subjectId),
    }),
    db.query.user.findFirst({ where: eq(user.id, c.ownerId) }),
    Promise.all(
      v.metadata.outcomeIds.map((id) =>
        db.query.taxonomy.findFirst({ where: eq(taxonomy.id, id) }),
      ),
    ),
  ]);
  return {
    id: c.id,
    slug: c.slug,
    title: v.metadata.title,
    description: v.metadata.description ?? "",
    subject: subject?.label ?? "Diğer",
    subjectKey: subjectKey(subject?.label ?? ""),
    subjectId: v.metadata.subjectId,
    grade: v.metadata.grade,
    cover: v.thumbnail ? `/api/thumbnails/${v.id}` : undefined,
    kind: "published",
    author: author?.name ?? "Öğretmen paylaşımı",
    objectives: [
      ...outcomes.flatMap((o) => (o ? [o.label] : [])),
      ...(await selectedOutcomes(v.metadata.outcomeRefs))
        .filter(
          (o) => o.locallyVerified && !v.excludedOutcomeIds.includes(o.id),
        )
        .map((o) => `${o.data.officialCode ?? ""} ${o.data.text}`),
    ],
    teacherNotes: [],
    gameUrl: v.entrypoint ? gameUrl(v.id, v.entrypoint) : undefined,
  };
}
