export type SourceRef = {
  sourceId: string;
  pdfPage: number | null;
  printedPage?: string | null;
  section?: string | null;
  anchor?: string | null;
};
export type CurriculumSource = {
  id: string;
  title: string | null;
  url: string;
  sha256: string | null;
  documentType: string;
  pageCount: number | null;
  localPath?: string | null;
  [key: string]: unknown;
};
export type CurriculumProgram = {
  id: string;
  officialName: string;
  subjectName: string | null;
  grades: number[] | null;
  schoolTypes: string[] | null;
  curriculumFamily: string;
  versionLabel: string | null;
  sourceIds: string[];
  excludedReason?: string | null;
  [key: string]: unknown;
};
export type CurriculumUnit = {
  id: string;
  programId: string;
  parentId: string | null;
  title: string;
  grades: number[] | null;
  officialKeywords: string[] | null;
  [key: string]: unknown;
};
export type CurriculumOutcome = {
  id: string;
  programId: string;
  unitId: string | null;
  grades: number[] | null;
  officialCode: string | null;
  normalizedCode?: string | null;
  text: string;
  verificationStatus: "verified" | "needs_review";
  sourceRefs: SourceRef[];
  processComponents:
    { label: string | null; text: string; sourceRefs: SourceRef[] }[] | null;
  unitVariants?:
    | {
        unitId: string;
        text?: string;
        processComponents?: { text: string }[] | null;
        [key: string]: unknown;
      }[]
    | null;
  [key: string]: unknown;
};
export type OutcomeRef = { catalogId: string; outcomeId: string };
export type Evidence = { file: string; location: string; text: string };
export type ExtractedField = { value: string | number; evidence: Evidence };
export type ExtractionReport = {
  status: "complete" | "partial" | "error";
  versionId: string;
  sha256: string;
  entrypoint: string;
  extractorVersion: string;
  catalogId: string | null;
  fields: Partial<
    Record<
      "title" | "description" | "grade" | "subject" | "programId",
      ExtractedField
    >
  >;
  codes: { code: string; evidence: Evidence }[];
  passages: Evidence[];
  warnings: string[];
};
