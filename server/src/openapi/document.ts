import { OpenApiGeneratorV31, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { BoulodromeFeatureCollectionSchema } from "../schemas/boulodromeProperties";
import { boulodromesQuerySchema } from "../schemas/boulodromesQuery";

const registry = new OpenAPIRegistry();

const errorSchema = z
  .object({
    error: z.string(),
  })
  .openapi("Error");

const validationErrorSchema = z
  .object({
    error: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })),
  })
  .openapi("ValidationError");

registry.registerPath({
  method: "get",
  path: "/api/boulodromes",
  summary: "Liste des boulodromes parisiens, au format GeoJSON",
  description:
    "Renvoie une FeatureCollection GeoJSON, avec filtres optionnels combinables (recherche texte, " +
    "nature du sol, type d'équipement, accès libre/payant, rectangle englobant).",
  request: {
    query: boulodromesQuerySchema,
  },
  responses: {
    200: {
      description: "FeatureCollection des boulodromes correspondant aux filtres",
      content: { "application/json": { schema: BoulodromeFeatureCollectionSchema } },
    },
    400: {
      description: "Paramètre de requête invalide (ex. bbox ou freeAccess mal formé)",
      content: { "application/json": { schema: validationErrorSchema } },
    },
    500: {
      description: "Erreur inattendue côté serveur",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/health",
  summary: "Healthcheck",
  responses: {
    200: {
      description: "Le service répond",
      content: { "text/plain": { schema: z.literal("ok") } },
    },
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      version: "1.0.0",
      title: "API boulodromes de Paris",
      description:
        "Boulodromes parisiens (open data equipements.sports.gouv.fr) au format GeoJSON, avec filtres.",
    },
  });
}
