import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../server/db";
import { contents, versions, taxonomy, grades } from "../server/schema";
import { can } from "../lib/permissions";
import { PUBLICATION_ATTENTION_STATES } from "../lib/publication-progress";
import {
  listPage,
  readWorkspaceFilters,
  type WorkspaceParams,
} from "../lib/workspace-list";
import { fail } from "../server/errors";

const searchPattern = (query: string) =>
  `%${query.replace(/[\\%_]/g, "\\$&")}%`;
export async function teacherContents(
  actor: { id: string; role: string },
  params: WorkspaceParams,
) {
  if (!can(actor.role, "create"))
    fail(403, "İçerik oluşturma yetkisi gerekli.");
  const f = readWorkspaceFilters(params);
  const publication = alias(versions, "current_publication");
  const title = sql<string>`coalesce(nullif(case when ${versions.metadataConfirmedAt} is not null then ${versions.metadata}->>'title' else coalesce(nullif(${versions.draftMetadata}->>'title',''),nullif(${versions.extraction}->'fields'->'title'->>'value',''),${versions.originalFilename}) end,''),'Yüklemesi tamamlanmamış içerik')`;
  const where = and(
    eq(contents.ownerId, actor.id),
    f.query ? ilike(title, searchPattern(f.query)) : undefined,
    f.status === "attention"
      ? or(
          isNull(versions.id),
          isNotNull(versions.revokedAt),
          inArray(versions.state, PUBLICATION_ATTENTION_STATES),
        )
      : f.status === "review"
        ? and(eq(versions.state, "review"), isNull(versions.revokedAt))
        : f.status === "live"
          ? and(
              eq(publication.state, "published"),
              isNull(publication.revokedAt),
            )
          : undefined,
  );
  const [{ total }] = await db
    .select({ total: count() })
    .from(contents)
    .leftJoin(versions, eq(contents.draftVersionId, versions.id))
    .leftJoin(publication, eq(contents.publishedVersionId, publication.id))
    .where(where);
  const { page, offset } = listPage(total, f.page);
  const rows = await db
    .select({
      content: contents,
      version: versions,
      publishedVersion: publication,
      title,
    })
    .from(contents)
    .leftJoin(versions, eq(contents.draftVersionId, versions.id))
    .leftJoin(publication, eq(contents.publishedVersionId, publication.id))
    .where(where)
    .orderBy(desc(contents.updatedAt), asc(contents.id))
    .limit(25)
    .offset(offset);
  return { rows, total, page, filters: f };
}
export async function reviewQueue(
  actor: { role: string },
  params: WorkspaceParams,
) {
  if (!can(actor.role, "review")) fail(403, "İnceleme yetkisi gerekli.");
  const f = readWorkspaceFilters(params);
  const where = and(
    eq(versions.state, "review"),
    isNull(versions.revokedAt),
    f.query
      ? ilike(sql`${versions.metadata}->>'title'`, searchPattern(f.query))
      : undefined,
    f.grade ? sql`${versions.metadata}->>'grade' = ${f.grade}` : undefined,
    f.subject
      ? sql`${versions.metadata}->>'subjectId' = ${f.subject}`
      : undefined,
  );
  const [{ total }] = await db
    .select({ total: count() })
    .from(versions)
    .innerJoin(contents, eq(contents.draftVersionId, versions.id))
    .where(where);
  const { page, offset } = listPage(total, f.page);
  const rows = await db
    .select({ v: versions, subject: taxonomy.label })
    .from(versions)
    .innerJoin(contents, eq(contents.draftVersionId, versions.id))
    .leftJoin(
      taxonomy,
      sql`${taxonomy.id}::text = ${versions.metadata}->>'subjectId'`,
    )
    .where(where)
    .orderBy(
      f.sort === "newest" ? desc(versions.createdAt) : asc(versions.createdAt),
      asc(versions.id),
    )
    .limit(25)
    .offset(offset);
  const [subjects, gradeOptions] = await Promise.all([
    db
      .select({ id: taxonomy.id, label: taxonomy.label })
      .from(taxonomy)
      .where(eq(taxonomy.kind, "subject"))
      .orderBy(asc(taxonomy.label)),
    db.select({ value: grades.value }).from(grades).orderBy(asc(grades.value)),
  ]);
  return { rows, total, page, filters: f, subjects, grades: gradeOptions };
}
