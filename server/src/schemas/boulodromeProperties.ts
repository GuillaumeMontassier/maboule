import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { boulodromes } from "../db/schema";

extendZodWithOpenApi(z);

// Schema du "row" DB genere depuis Drizzle (drizzle-zod lit schema.ts) :
// source de verite pour les types de colonnes, plutot que de les
// redeclarer a la main et risquer une divergence avec schema.ts.
// `coordinates` (customType PostGIS) n'est pas modelisable par drizzle-zod
// (-> z.any()) : la position exposee publiquement passe par la geometrie
// GeoJSON (cf. BoulodromeFeatureSchema), pas par les properties.
const boulodromeRowSchema = createSelectSchema(boulodromes);

export const BoulodromePropertiesSchema = boulodromeRowSchema
  .omit({ coordinates: true, sourceId: true, lastSyncedAt: true })
  .extend({
    // Serialise en ISO 8601 par `toBoulodromeFeatureCollection` (Date -> string).
    lastSyncedAt: z.iso.datetime().openapi({ example: "2026-08-06T15:18:11.000Z" }),
  })
  .openapi("BoulodromeProperties");

const PointGeometrySchema = z
  .object({
    type: z.literal("Point"),
    // [longitude, latitude], convention GeoJSON.
    coordinates: z.tuple([z.number(), z.number()]).openapi({ example: [2.3522, 48.8566] }),
  })
  .openapi("PointGeometry");

export const BoulodromeFeatureSchema = z
  .object({
    type: z.literal("Feature"),
    geometry: PointGeometrySchema,
    properties: BoulodromePropertiesSchema,
  })
  .openapi("BoulodromeFeature");

export const BoulodromeFeatureCollectionSchema = z
  .object({
    type: z.literal("FeatureCollection"),
    features: z.array(BoulodromeFeatureSchema),
  })
  .openapi("BoulodromeFeatureCollection");
