CREATE TABLE "cafes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amenity_type" text NOT NULL,
	"street" text,
	"postal_code" text,
	"city" text,
	"coordinates" geography(Point, 4326) NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"last_synced_at" timestamp with time zone NOT NULL,
	CONSTRAINT "cafes_source_source_id_unique" UNIQUE("source","source_id"),
	CONSTRAINT "cafes_source_check" CHECK ("cafes"."source" in ('osm', 'manual')),
	CONSTRAINT "cafes_amenity_type_check" CHECK ("cafes"."amenity_type" in ('cafe', 'bar', 'pub'))
);
--> statement-breakpoint
CREATE INDEX "cafes_coordinates_idx" ON "cafes" USING gist ("coordinates");