// Test-only editor evidence. Never imported by application/worker code.
import { eq } from "drizzle-orm";
import { db } from "../../src/server/db";
import { versions, type Metadata } from "../../src/server/schema";
import { decide } from "../../src/modules/content";
import { renderCover } from "../../src/modules/covers";
import { initStorage } from "../../src/modules/storage";
import {
  TECHNICAL_RULES_VERSION,
  warningRules,
  type TechnicalReport,
  type Assessment,
} from "../../src/modules/review-types";
export function testAssessment(
  report: TechnicalReport,
  refs: { catalogId: string; outcomeId: string }[] = [],
  excluded: string[] = [],
): Assessment {
  const suitable = {
    status: "suitable" as const,
    note: "TEST ONLY: test scenario manually approved.",
  };
  return {
    science: suitable,
    age: suitable,
    education: suitable,
    accessibility: suitable,
    cover: suitable,
    warnings: warningRules(report).map((rule) => ({
      rule,
      disposition: "accepted_limitation",
      note: "TEST ONLY: expected fixture limitation.",
    })),
    outcomes: refs.map((r) => ({
      ...r,
      status: excluded.includes(r.outcomeId) ? "exclude" : "suitable",
      note: "TEST ONLY: outcome fixture decision.",
    })),
  };
}
export async function decideForTest(...args: Parameters<typeof decide>) {
  const v = (await db.query.versions.findFirst({
    where: eq(versions.id, args[0]),
  }))!;
  args[5] ??= v.metadataRevision;
  if (v.technicalReport && v.cover?.artifact)
    args[7] ??= {
      technicalReportId: v.technicalReport.id,
      coverId: v.cover.artifact.id,
      assessment: testAssessment(
        v.technicalReport,
        v.metadata.outcomeRefs,
        args[6],
      ),
    };
  return decide(...args);
}
export async function prepareReviewFixture(
  id: string,
  sha256: string,
  metadata: Partial<Metadata>,
) {
  await initStorage();
  const current = (await db.query.versions.findFirst({
    where: eq(versions.id, id),
  }))!;
  const report: TechnicalReport = {
    id: crypto.randomUUID(),
    versionId: id,
    sha256,
    entrypoint: "index.html",
    rulesVersion: TECHNICAL_RULES_VERSION,
    status: "complete",
    at: new Date().toISOString(),
    filesChecked: [],
    completedChecks: ["TEST ONLY: isolated curriculum rules fixture"],
    findings: [],
    accessibility: "complete",
    limitations: [],
  };
  const rendered = await renderCover({
    versionId: id,
    selection: { mode: "generated" },
    manifest: [],
    metadata,
    metadataRevision: current.metadataRevision,
    subject: "Test",
  });
  await db
    .update(versions)
    .set({
      technicalReport: report,
      cover: {
        revision: (current.cover?.revision ?? 0) + 1,
        selection: { mode: "generated" },
        status: "ready",
        artifact: rendered.artifact,
      },
    })
    .where(eq(versions.id, id));
}
