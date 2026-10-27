ALTER TABLE "two_factors" ADD COLUMN "failed_verification_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "two_factors" ADD COLUMN "locked_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "content_versions" ADD COLUMN "thumbnail" boolean DEFAULT false NOT NULL;