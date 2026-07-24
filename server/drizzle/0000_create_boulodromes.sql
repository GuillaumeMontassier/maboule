CREATE TABLE "boulodromes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"street" text NOT NULL,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"insee_code" text,
	"coordinates" geography(Point, 4326) NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"last_synced_at" timestamp with time zone NOT NULL,
	CONSTRAINT "boulodromes_source_source_id_unique" UNIQUE("source","source_id"),
	CONSTRAINT "boulodromes_source_check" CHECK ("boulodromes"."source" in ('opendata-paris', 'data-es', 'manual'))
);
--> statement-breakpoint
CREATE INDEX "boulodromes_coordinates_idx" ON "boulodromes" USING gist ("coordinates");