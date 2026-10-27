CREATE TABLE "grades" (
	"value" integer PRIMARY KEY NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
INSERT INTO "grades" ("value") SELECT generate_series(1, 12);
