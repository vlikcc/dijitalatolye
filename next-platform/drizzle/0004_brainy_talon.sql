CREATE TABLE "curriculum_process_components" (
	"catalog_id" text NOT NULL,
	"outcome_id" text NOT NULL,
	"context_path" text NOT NULL,
	"unit_id" text,
	"text" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "curriculum_process_components_catalog_id_outcome_id_context_path_pk" PRIMARY KEY("catalog_id","outcome_id","context_path")
);
--> statement-breakpoint
ALTER TABLE "curriculum_process_components" ADD CONSTRAINT "curriculum_process_components_catalog_id_outcome_id_curriculum_outcomes_catalog_id_id_fk" FOREIGN KEY ("catalog_id","outcome_id") REFERENCES "public"."curriculum_outcomes"("catalog_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Preserve existing catalogs while materializing independently addressable
-- process components, including Turkish program unit-specific variants.
INSERT INTO curriculum_process_components(catalog_id,outcome_id,context_path,unit_id,text,data)
SELECT o.catalog_id,o.id,'/processComponents/'||(p.ordinality-1),o.unit_id,p.value->>'text',p.value
FROM curriculum_outcomes o
CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(o.data->'processComponents')='array' THEN o.data->'processComponents' ELSE '[]'::jsonb END) WITH ORDINALITY p;
--> statement-breakpoint
INSERT INTO curriculum_process_components(catalog_id,outcome_id,context_path,unit_id,text,data)
SELECT o.catalog_id,o.id,'/unitVariants/'||(v.ordinality-1)||'/processComponents/'||(p.ordinality-1),v.value->>'unitId',p.value->>'text',p.value
FROM curriculum_outcomes o
CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(o.data->'unitVariants')='array' THEN o.data->'unitVariants' ELSE '[]'::jsonb END) WITH ORDINALITY v
CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(v.value->'processComponents')='array' THEN v.value->'processComponents' ELSE '[]'::jsonb END) WITH ORDINALITY p;
