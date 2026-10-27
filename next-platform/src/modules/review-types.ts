export const TECHNICAL_RULES_VERSION = "2.0.0";
export const COVER_RENDERER_VERSION = "1.0.0";
export type Finding = {
  rule: string;
  severity: "blocker" | "warning" | "info";
  group:
    "malware" | "package" | "resources" | "code" | "accessibility" | "coverage";
  file: string;
  location: string;
  evidence: string;
  message: string;
  remedy: string;
};
export type TechnicalReport = {
  id: string;
  versionId: string;
  sha256: string;
  entrypoint: string | null;
  rulesVersion: string;
  status: "complete" | "blocked" | "error";
  at: string;
  filesChecked: string[];
  completedChecks: string[];
  scanner?: string;
  findings: Finding[];
  accessibility: "complete" | "unavailable";
  limitations: string[];
};
export type CoverSelection =
  | { mode: "auto" }
  | { mode: "generated" }
  | { mode: "package"; path: string }
  | { mode: "upload"; inputId: string; sha256: string };
export type CoverArtifact = {
  id: string;
  source: "generated" | "package" | "upload";
  sourceHash: string;
  sourcePath?: string;
  rendererVersion: string;
  metadataRevision: number;
  metadataKey: string;
  smallHash: string;
  largeHash: string;
};
export type CoverState = {
  revision: number;
  selection: CoverSelection;
  status: "pending" | "ready" | "error";
  artifact?: CoverArtifact;
  warning?: string;
  error?: string;
};
export type AssessmentStatus =
  "suitable" | "revise" | "unassessed" | "not_applicable";
export type Assessment = {
  science: { status: AssessmentStatus; note: string };
  age: { status: AssessmentStatus; note: string };
  education: { status: AssessmentStatus; note: string };
  accessibility: { status: AssessmentStatus; note: string };
  cover: { status: AssessmentStatus; note: string };
  warnings: {
    rule: string;
    disposition: "not_confirmed" | "accepted_limitation" | "revise";
    note: string;
  }[];
  outcomes: {
    catalogId: string;
    outcomeId: string;
    status: "suitable" | "exclude" | "unassessed";
    note: string;
  }[];
};
export type ReviewSnapshot = {
  technicalReportId: string;
  coverId: string;
  metadataRevision: number;
  assessment: Assessment;
};
export function warningRules(report: TechnicalReport | null | undefined) {
  return [
    ...new Set(
      report?.findings
        .filter((f) => f.severity === "warning")
        .map((f) => f.rule) ?? [],
    ),
  ];
}
