CREATE TABLE "curriculum_applicability" (
	"id" text PRIMARY KEY NOT NULL,
	"catalog_id" text NOT NULL,
	"program_id" text NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_catalogs" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_outcomes" (
	"catalog_id" text NOT NULL,
	"id" text NOT NULL,
	"program_id" text NOT NULL,
	"unit_id" text,
	"grades" integer[] NOT NULL,
	"code" text,
	"text" text NOT NULL,
	"verification_status" text NOT NULL,
	"fingerprint" text NOT NULL,
	"search_text" text NOT NULL,
	"process_text" text NOT NULL,
	"keyword_text" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "curriculum_outcomes_catalog_id_id_pk" PRIMARY KEY("catalog_id","id")
);
--> statement-breakpoint
CREATE TABLE "curriculum_programs" (
	"catalog_id" text NOT NULL,
	"id" text NOT NULL,
	"subject_id" uuid,
	"data" jsonb NOT NULL,
	CONSTRAINT "curriculum_programs_catalog_id_id_pk" PRIMARY KEY("catalog_id","id")
);
--> statement-breakpoint
CREATE TABLE "curriculum_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_id" text NOT NULL,
	"outcome_id" text NOT NULL,
	"fingerprint" text NOT NULL,
	"actor_id" text NOT NULL,
	"source_hashes" jsonb NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_sources" (
	"catalog_id" text NOT NULL,
	"id" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "curriculum_sources_catalog_id_id_pk" PRIMARY KEY("catalog_id","id")
);
--> statement-breakpoint
CREATE TABLE "curriculum_units" (
	"catalog_id" text NOT NULL,
	"id" text NOT NULL,
	"program_id" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "curriculum_units_catalog_id_id_pk" PRIMARY KEY("catalog_id","id")
);
--> statement-breakpoint
ALTER TABLE "content_versions" ADD COLUMN "draft_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "content_versions" ADD COLUMN "metadata_revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "content_versions" ADD COLUMN "metadata_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "content_versions" ADD COLUMN "original_filename" text;--> statement-breakpoint
ALTER TABLE "content_versions" ADD COLUMN "extraction" jsonb;--> statement-breakpoint
ALTER TABLE "content_versions" ADD COLUMN "excluded_outcome_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "curriculum_applicability" ADD CONSTRAINT "curriculum_applicability_catalog_id_curriculum_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."curriculum_catalogs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_outcomes" ADD CONSTRAINT "curriculum_outcomes_catalog_id_curriculum_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."curriculum_catalogs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_programs" ADD CONSTRAINT "curriculum_programs_catalog_id_curriculum_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."curriculum_catalogs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_programs" ADD CONSTRAINT "curriculum_programs_subject_id_taxonomy_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."taxonomy"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_reviews" ADD CONSTRAINT "curriculum_reviews_catalog_id_curriculum_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."curriculum_catalogs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_reviews" ADD CONSTRAINT "curriculum_reviews_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_sources" ADD CONSTRAINT "curriculum_sources_catalog_id_curriculum_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."curriculum_catalogs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_units" ADD CONSTRAINT "curriculum_units_catalog_id_curriculum_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."curriculum_catalogs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "curriculum_application_program" ON "curriculum_applicability" USING btree ("catalog_id","program_id");--> statement-breakpoint
CREATE INDEX "curriculum_outcome_program" ON "curriculum_outcomes" USING btree ("catalog_id","program_id");--> statement-breakpoint
CREATE INDEX "curriculum_program_subject" ON "curriculum_programs" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "curriculum_review_outcome" ON "curriculum_reviews" USING btree ("catalog_id","outcome_id","fingerprint");
--> statement-breakpoint
CREATE UNIQUE INDEX curriculum_one_active ON curriculum_catalogs(status) WHERE status='active';
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX curriculum_fts ON curriculum_outcomes USING gin(to_tsvector('turkish',search_text || ' ' || process_text || ' ' || keyword_text));
--> statement-breakpoint
CREATE INDEX curriculum_text_trgm ON curriculum_outcomes USING gin(lower(text) gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX curriculum_code ON curriculum_outcomes(catalog_id,code);
--> statement-breakpoint
ALTER TABLE curriculum_units ADD CONSTRAINT curriculum_unit_program_fk FOREIGN KEY(catalog_id,program_id) REFERENCES curriculum_programs(catalog_id,id);
--> statement-breakpoint
ALTER TABLE curriculum_outcomes ADD CONSTRAINT curriculum_outcome_program_fk FOREIGN KEY(catalog_id,program_id) REFERENCES curriculum_programs(catalog_id,id);
--> statement-breakpoint
ALTER TABLE curriculum_outcomes ADD CONSTRAINT curriculum_outcome_unit_fk FOREIGN KEY(catalog_id,unit_id) REFERENCES curriculum_units(catalog_id,id);
--> statement-breakpoint
ALTER TABLE curriculum_reviews ADD CONSTRAINT curriculum_review_outcome_fk FOREIGN KEY(catalog_id,outcome_id) REFERENCES curriculum_outcomes(catalog_id,id);
--> statement-breakpoint
UPDATE content_versions SET metadata_confirmed_at=created_at WHERE state='published';
--> statement-breakpoint
UPDATE content_versions SET draft_metadata=metadata,state=CASE WHEN entrypoint IS NULL THEN 'needs_entry' ELSE 'extracting' END WHERE state IN ('assessing','review','publishing','publish_error');
