import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

// Pas de "row" Drizzle a partir de laquelle generer ce schema (contrairement
// a BoulodromePropertiesSchema/CafePropertiesSchema) : l'itineraire n'est
// pas stocke en base, il est calcule a la volee par OpenRouteService.
export const LineStringGeometrySchema = z
  .object({
    type: z.literal("LineString"),
    // [longitude, latitude] par point, convention GeoJSON.
    coordinates: z.array(z.tuple([z.number(), z.number()])).openapi({
      example: [
        [2.3522, 48.8566],
        [2.353, 48.857],
      ],
    }),
  })
  .openapi("LineStringGeometry");

export const RoutePropertiesSchema = z
  .object({
    distanceMeters: z.number().openapi({
      description: "Distance totale du trajet à pied, en mètres",
      example: 846,
    }),
    durationSeconds: z.number().openapi({
      description: "Durée estimée du trajet à pied, en secondes",
      example: 639,
    }),
  })
  .openapi("RouteProperties");

export const RouteFeatureSchema = z
  .object({
    type: z.literal("Feature"),
    geometry: LineStringGeometrySchema,
    properties: RoutePropertiesSchema,
  })
  .openapi("RouteFeature");
