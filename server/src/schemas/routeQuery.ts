import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { GeoCoordinates } from "../models/geo";

extendZodWithOpenApi(z);

// `?from=latitude,longitude` : point de depart de l'itineraire. Contrairement
// a `q`/`groundType` (boulodromesQuery.ts), une valeur absente ou mal formee
// est une erreur - il n'y a pas d'itineraire "par defaut" sans point de
// depart.
export const routeQuerySchema = z.object({
  from: z
    .string()
    .transform((value, ctx): GeoCoordinates | typeof z.NEVER => {
      const rawParts = value.split(",");
      // Number("") vaut 0, pas NaN - on rejette donc explicitement les
      // segments vides/blancs (ex. "48.8566,") avant la conversion, sinon
      // une coordonnee manquante passerait silencieusement comme 0.
      const isBlank = (part: string) => part.trim() === "";
      const parts = rawParts.map(Number);
      if (rawParts.length !== 2 || rawParts.some(isBlank) || parts.some((n) => Number.isNaN(n))) {
        ctx.addIssue({
          code: "custom",
          message: "from doit être au format latitude,longitude (2 nombres séparés par une virgule)",
        });
        return z.NEVER;
      }
      const [latitude, longitude] = parts;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        ctx.addIssue({
          code: "custom",
          message: "from contient des coordonnées hors limites (latitude ±90, longitude ±180)",
        });
        return z.NEVER;
      }
      return new GeoCoordinates(latitude, longitude);
    })
    .openapi({
      description: "Point de départ de l'itinéraire, au format latitude,longitude (WGS84)",
      example: "48.8566,2.3522",
    }),
});

export type RouteQuery = z.infer<typeof routeQuerySchema>;
