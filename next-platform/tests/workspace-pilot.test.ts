import { expect, it } from "vitest";
import {
  reportCounts,
  reportRows,
  reportState,
  studentStartState,
  teacherStartStep,
  type ReportRow,
} from "../src/lib/learning-workspace";
import {
  readWorkspaceFilters,
  listHref,
  listPage,
} from "../src/lib/workspace-list";
import { metadataSchema } from "../src/lib/metadata-schema";
import { assessmentSummary } from "../src/lib/assessment-summary";
import { validateAssessment } from "../src/modules/assessment";
import type { Assessment, TechnicalReport } from "../src/modules/review-types";
const base: ReportRow = {
  id: "1",
  name: "Işık Öğrenci",
  username: "isik",
  membership: "active",
  attempts: 0,
  completed: null,
  progress: null,
  score: null,
  best_score: null,
  last_activity: null,
};
it("keeps completion across retries, latest null scores and mutually exclusive totals", () => {
  const rows = [
    base,
    { ...base, id: "2", attempts: 1, completed: false, score: 0 },
    { ...base, id: "3", attempts: 2, completed: true, best_score: 85 },
  ];
  expect(reportCounts(rows, true)).toEqual({
    not_started: 1,
    in_progress: 1,
    completed: 1,
    opened: 0,
  });
  expect(reportRows(rows, true, "", "completed", "name")[0]).toMatchObject({
    score: null,
    best_score: 85,
    attempts: 2,
  });
  expect(reportCounts(rows, false)).toEqual({
    not_started: 1,
    in_progress: 0,
    completed: 0,
    opened: 2,
  });
  expect(reportState(rows[2], false)).toBe("opened");
});
it("combines Turkish name/user search and status without mutating source order", () => {
  const rows = [
    {
      ...base,
      id: "2",
      name: "Zeynep",
      username: "zeynep",
      attempts: 1,
      last_activity: "2026-10-27T08:00:00Z",
    },
    base,
  ];
  expect(reportRows(rows, true, "ISIK", "not_started", "name")).toEqual([base]);
  expect(reportRows(rows, true, "ISIK", "in_progress", "name")).toEqual([]);
  expect(reportRows(rows, true, "", "all", "activity")[0].id).toBe("2");
  expect(rows.map((r) => r.id)).toEqual(["2", "1"]);
});
it("chooses the next student action from active, pending and inactive memberships", () => {
  const cls = { id: "c", name: "4-A", archived: false };
  expect(studentStartState([])).toBe("join");
  expect(studentStartState([{ ...cls, status: "pending" }])).toBe("pending");
  expect(
    studentStartState([
      { ...cls, status: "pending" },
      { ...cls, id: "b", status: "active" },
    ]),
  ).toBe("waiting_assignment");
  expect(
    studentStartState([{ ...cls, archived: true, status: "active" }]),
  ).toBe("inactive");
  expect(studentStartState([{ ...cls, status: "removed" }])).toBe("inactive");
});
it("does not count archived classes or invent a shared-code completion", () => {
  const cls = { id: "c", name: "4-A", archived: false };
  const member = {
    class_id: "c",
    student_id: "s",
    name: "Öğrenci",
    status: "pending",
  };
  expect(teacherStartStep([], [], []).step).toBe("class");
  expect(teacherStartStep([cls], [], []).step).toBe("code");
  expect(teacherStartStep([cls], [member], []).step).toBe("approve");
  expect(
    teacherStartStep([cls], [{ ...member, status: "active" }], []).step,
  ).toBe("assign");
  expect(
    teacherStartStep([cls], [member], [{ id: "a", class_id: "c" }]),
  ).toEqual({ step: "report", href: "/ogretmen/odevler/a" });
  expect(
    teacherStartStep(
      [{ ...cls, archived: true }],
      [member],
      [{ id: "a", class_id: "c" }],
    ).step,
  ).toBe("class");
});
it("normalizes list URLs and clamps pagination with empty and filtered sets", () => {
  expect(
    readWorkspaceFilters({
      q: ["a", "b"],
      durum: "unknown",
      sinif: "13",
      ders: "bad",
      sayfa: "-5",
      siralama: "drop",
    }),
  ).toMatchObject({
    query: "",
    status: "all",
    grade: "",
    subject: "",
    page: 1,
    sort: "oldest",
  });
  expect(listPage(26, 500)).toEqual({ page: 2, offset: 25 });
  expect(listPage(0, 10)).toEqual({ page: 1, offset: 0 });
  expect(listHref("/editor", { q: "A&B", ders: "", sayfa: "2" })).toBe(
    "/editor?q=A%26B&sayfa=2",
  );
});
it("metadata summary shares actual minimums and allows no curriculum claim", () => {
  const metadata = {
    title: "Kesir",
    description: "Sınıfta kesirleri öğrenmek için oyun.",
    grade: 4,
    subjectId: "bcce292e-5a01-434c-bbeb-4920f01f83c4",
  };
  expect(metadataSchema.safeParse(metadata).success).toBe(true);
  expect(
    metadataSchema.safeParse({ ...metadata, description: "kısa" }).success,
  ).toBe(false);
});
const report = {
  findings: [{ rule: "a11y", severity: "warning" }],
} as TechnicalReport;
const item = { status: "suitable" as const, note: "" };
const assessment = (): Assessment => ({
  science: { ...item },
  age: { ...item },
  education: { ...item },
  accessibility: { ...item },
  cover: { ...item },
  warnings: [{ rule: "a11y", disposition: "revise", note: "" }],
  outcomes: [],
});
it("distinguishes filled decisions from approval readiness and shares required note rules", () => {
  const a = assessment();
  let summary = assessmentSummary(a, report, [], []);
  expect(summary.decisions).toBe(4);
  expect(summary.missing.map((m) => m.id)).toEqual([
    "assessment-accessibility",
    "warning-a11y",
  ]);
  a.accessibility.note = "Klavye kontrol edildi.";
  a.warnings[0].note = "Düzeltme gerekiyor.";
  summary = assessmentSummary(a, report, [], []);
  expect(summary.decisions).toBe(5);
  expect(summary.warnings).toBe(1);
  expect(summary.missing).toEqual([]);
  expect(summary.approvalIssue).toContain("Düzeltme bekleyen uyarı");
  a.warnings[0].disposition = "not_confirmed";
  expect(assessmentSummary(a, report, [], []).approvalIssue).toBe("");
  expect(() => validateAssessment(a, report, [], true, [])).not.toThrow();
});
it("requires a reason for excluded outcomes and not-applicable science", () => {
  const a = assessment();
  a.science.status = "not_applicable";
  a.outcomes = [
    { catalogId: "catalog", outcomeId: "outcome", status: "exclude", note: "" },
  ];
  const refs = [{ catalogId: "catalog", outcomeId: "outcome" }];
  expect(
    assessmentSummary(a, report, refs, ["outcome"]).missing.map((m) => m.id),
  ).toContain("assessment-science");
  expect(assessmentSummary(a, report, refs, ["outcome"]).outcomes).toBe(0);
  a.outcomes[0].note = "Oyunda ilişkili görev yok.";
  expect(assessmentSummary(a, report, refs, ["outcome"]).outcomes).toBe(1);
});
