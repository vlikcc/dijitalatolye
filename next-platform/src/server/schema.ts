import type { TechnicalReport, CoverState, ReviewSnapshot } from "../modules/review-types";
import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  uuid,
  index,
  uniqueIndex,
  primaryKey,
  foreignKey,
} from "drizzle-orm/pg-core";
import type {
  CurriculumSource,
  CurriculumProgram,
  CurriculumUnit,
  CurriculumOutcome,
  ExtractionReport,
  OutcomeRef,
} from "../modules/curriculum-types";
const created = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
export const user = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("teacher").notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  createdAt: created(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const session = pgTable("sessions", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: created(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
export const account = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: created(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const verification = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: created(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const twoFactor = pgTable("two_factors", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  verified: boolean("verified").default(false),
  failedVerificationCount: integer("failed_verification_count").default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
export const taxonomy = pgTable(
  "taxonomy",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    parentId: uuid("parent_id"),
    active: boolean("active").default(true).notNull(),
  },
  (t) => [uniqueIndex("taxonomy_kind_label").on(t.kind, t.label)],
);
export const grades = pgTable("grades", {
  value: integer("value").primaryKey(),
  active: boolean("active").default(true).notNull(),
});
export const contents = pgTable("contents", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id),
  slug: text("slug").unique().notNull(),
  draftVersionId: uuid("draft_version_id"),
  publishedVersionId: uuid("published_version_id"),
  createdAt: created(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export type Metadata = {
  title: string;
  description: string;
  grade: number;
  subjectId: string;
  outcomeIds: string[];
  outcomeRefs?: OutcomeRef[];
  catalogId?: string;
  programId?: string;
  academicYear?: string;
  schoolType?: string;
  entrypoint?: string;
  demo?: boolean;
};
export type FileRecord = { path: string; size: number; sha256: string };
export type ScanReport = {
  status: "clean" | "rejected" | "error";
  engine: string;
  message: string;
  at: string;
};
export type ArchivedAiReport = {
  status: "complete" | "unavailable";
  summary: string;
  findings: string[];
  model?: string;
};
export const versions = pgTable(
  "content_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id),
    sha256: text("sha256").notNull(),
    format: text("format").notNull(),
    metadata: jsonb("metadata").$type<Metadata>().notNull(),
    draftMetadata: jsonb("draft_metadata")
      .$type<Partial<Metadata>>()
      .default({})
      .notNull(),
    metadataRevision: integer("metadata_revision").default(0).notNull(),
    metadataConfirmedAt: timestamp("metadata_confirmed_at", {
      withTimezone: true,
    }),
    originalFilename: text("original_filename"),
    extraction: jsonb("extraction").$type<ExtractionReport>(),
    excludedOutcomeIds: jsonb("excluded_outcome_ids")
      .$type<string[]>()
      .default([])
      .notNull(),
    state: text("state").notNull().default("queued"),
    entrypoint: text("entrypoint"),
    technicalReport: jsonb("technical_report").$type<TechnicalReport>(),
    cover: jsonb("cover").$type<CoverState>(),
    reviewSnapshot: jsonb("review_snapshot").$type<ReviewSnapshot>(),
    thumbnail: boolean("thumbnail").default(false).notNull(),
    tracking: boolean("tracking").default(false).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    candidates: jsonb("candidates").$type<string[]>().default([]).notNull(),
    manifest: jsonb("manifest").$type<FileRecord[]>().default([]).notNull(),
    scanReport: jsonb("scan_report").$type<ScanReport>(),
    archivedAiReport: jsonb("ai_report").$type<ArchivedAiReport>(),
    reviewNote: text("review_note"),
    jobId: text("job_id"),
    error: text("error"),
    createdAt: created(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("versions_content").on(t.contentId),
    index("versions_state").on(t.state),
  ],
);
export const decisions = pgTable("decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  versionId: uuid("version_id")
    .notNull()
    .references(() => versions.id),
  sha256: text("sha256").notNull(),
  actorId: text("actor_id")
    .notNull()
    .references(() => user.id),
  snapshot: jsonb("snapshot").$type<ReviewSnapshot>(),
  decision: text("decision").notNull(),
  note: text("note").notNull(),
  createdAt: created(),
});
export const audit = pgTable("audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  targetId: text("target_id"),
  details: jsonb("details"),
  createdAt: created(),
});
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  window: timestamp("window", { withTimezone: true }).notNull(),
});

export const studentProfiles = pgTable("student_profiles", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  recoveryTeacherId: text("recovery_teacher_id").references(() => user.id, { onDelete: "set null" }),
});
export const classrooms = pgTable("classrooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: text("teacher_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  joinCode: text("join_code").notNull().unique(),
  archived: boolean("archived").default(false).notNull(),
  createdAt: created(),
});
export const classroomMembers = pgTable("classroom_members", {
  classId: uuid("class_id").notNull().references(() => classrooms.id),
  studentId: text("student_id").notNull().references(() => studentProfiles.userId),
  status: text("status").default("pending").notNull(),
  createdAt: created(),
}, t => [primaryKey({ columns: [t.classId, t.studentId] }), index("members_student").on(t.studentId)]);
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").notNull().references(() => classrooms.id),
  versionId: uuid("version_id").notNull().references(() => versions.id),
  title: text("title").notNull(),
  instructions: text("instructions").default("").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  closed: boolean("closed").default(false).notNull(),
  createdAt: created(),
}, t => [index("assignments_class").on(t.classId)]);
export const assignmentStudents = pgTable("assignment_students", {
  assignmentId: uuid("assignment_id").notNull().references(() => assignments.id),
  studentId: text("student_id").notNull().references(() => studentProfiles.userId),
}, t => [primaryKey({ columns: [t.assignmentId, t.studentId] }), index("recipients_student").on(t.studentId)]);
export const gameAttempts = pgTable("game_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id").notNull().references(() => studentProfiles.userId),
  versionId: uuid("version_id").notNull().references(() => versions.id),
  assignmentId: uuid("assignment_id").references(() => assignments.id),
  state: jsonb("state"),
  revision: integer("revision").default(0).notNull(),
  progress: integer("progress"),
  score: integer("score"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: created(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, t => [index("attempts_student").on(t.studentId, t.versionId), index("attempts_assignment").on(t.assignmentId, t.studentId)]);
export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").notNull().references(() => gameAttempts.id),
  authSessionId: text("auth_session_id").notNull().references(() => session.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  requestId: uuid("request_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: created(),
}, t => [uniqueIndex("game_session_request").on(t.authSessionId, t.requestId)]);
export const gameEvents = pgTable("game_events", {
  sessionId: uuid("session_id").notNull().references(() => gameSessions.id, { onDelete: "cascade" }),
  requestId: uuid("request_id").notNull(),
  digest: text("digest").notNull(),
  revision: integer("revision").notNull(),
}, t => [primaryKey({ columns: [t.sessionId, t.requestId] })]);
export const studentResets = pgTable("student_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id").notNull().references(() => studentProfiles.userId),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: created(),
});

export const curriculumCatalogs = pgTable("curriculum_catalogs", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  warnings: jsonb("warnings").$type<string[]>().default([]).notNull(),
  summary: jsonb("summary").$type<Record<string, unknown>>().notNull(),
  createdAt: created(),
});
export const curriculumSources = pgTable(
  "curriculum_sources",
  {
    catalogId: text("catalog_id")
      .notNull()
      .references(() => curriculumCatalogs.id),
    id: text("id").notNull(),
    data: jsonb("data").$type<CurriculumSource>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.catalogId, t.id] })],
);
export const curriculumPrograms = pgTable(
  "curriculum_programs",
  {
    catalogId: text("catalog_id")
      .notNull()
      .references(() => curriculumCatalogs.id),
    id: text("id").notNull(),
    subjectId: uuid("subject_id").references(() => taxonomy.id),
    data: jsonb("data").$type<CurriculumProgram>().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.catalogId, t.id] }),
    index("curriculum_program_subject").on(t.subjectId),
  ],
);
export const curriculumUnits = pgTable(
  "curriculum_units",
  {
    catalogId: text("catalog_id")
      .notNull()
      .references(() => curriculumCatalogs.id),
    id: text("id").notNull(),
    programId: text("program_id").notNull(),
    data: jsonb("data").$type<CurriculumUnit>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.catalogId, t.id] })],
);
export const curriculumOutcomes = pgTable(
  "curriculum_outcomes",
  {
    catalogId: text("catalog_id")
      .notNull()
      .references(() => curriculumCatalogs.id),
    id: text("id").notNull(),
    programId: text("program_id").notNull(),
    unitId: text("unit_id"),
    grades: integer("grades").array().notNull(),
    code: text("code"),
    text: text("text").notNull(),
    verificationStatus: text("verification_status").notNull(),
    fingerprint: text("fingerprint").notNull(),
    searchText: text("search_text").notNull(),
    processText: text("process_text").notNull(),
    keywordText: text("keyword_text").notNull(),
    data: jsonb("data").$type<CurriculumOutcome>().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.catalogId, t.id] }),
    index("curriculum_outcome_program").on(t.catalogId, t.programId),
  ],
);
export const curriculumComponents = pgTable(
  "curriculum_process_components",
  {
    catalogId: text("catalog_id").notNull(),
    outcomeId: text("outcome_id").notNull(),
    contextPath: text("context_path").notNull(),
    unitId: text("unit_id"),
    text: text("text").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.catalogId, t.outcomeId, t.contextPath] }),
    foreignKey({
      columns: [t.catalogId, t.outcomeId],
      foreignColumns: [curriculumOutcomes.catalogId, curriculumOutcomes.id],
    }),
  ],
);
export const curriculumApplicability = pgTable(
  "curriculum_applicability",
  {
    id: text("id").primaryKey(),
    catalogId: text("catalog_id")
      .notNull()
      .references(() => curriculumCatalogs.id),
    programId: text("program_id").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  },
  (t) => [index("curriculum_application_program").on(t.catalogId, t.programId)],
);
export const curriculumReviews = pgTable(
  "curriculum_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    catalogId: text("catalog_id")
      .notNull()
      .references(() => curriculumCatalogs.id),
    outcomeId: text("outcome_id").notNull(),
    fingerprint: text("fingerprint").notNull(),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id),
    sourceHashes: jsonb("source_hashes")
      .$type<Record<string, string>>()
      .notNull(),
    note: text("note").notNull(),
    createdAt: created(),
  },
  (t) => [
    index("curriculum_review_outcome").on(
      t.catalogId,
      t.outcomeId,
      t.fingerprint,
    ),
  ],
);
