import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { db } from "./db/client";
import { findAllBoulodromes, findBoulodromeById } from "./db/boulodromesRepository";
import { findCafesNearBoulodrome } from "./db/cafesRepository";
import { toBoulodromeFeatureCollection } from "./geojson/boulodromes";
import { toCafeFeatureCollection } from "./geojson/cafes";
import { generateOpenApiDocument } from "./openapi/document";
import { boulodromeIdParamSchema, cafesNearBoulodromeQuerySchema } from "./schemas/cafesNearBoulodromeQuery";
import { boulodromesQuerySchema } from "./schemas/boulodromesQuery";

export const app = express();

// Le front (Vercel) et le back (Railway) sont sur des domaines differents,
// donc CORS est necessaire meme en prod. CORS_ORIGIN restreint aux domaines
// listes une fois connus ; sans cette variable (dev local), on reste ouvert
// a toutes origines - endpoint public en lecture seule, sans authentification
// ni donnee sensible.
const corsOrigin = process.env.CORS_ORIGIN?.split(",");
app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined));

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

// Doc genere depuis les memes schemas Zod que la validation ci-dessous -
// une seule source de verite, pas de doc a la main qui risque de diverger.
const openApiDocument = generateOpenApiDocument();
app.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.get("/api/boulodromes", async (req, res) => {
  const parsed = boulodromesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: "Paramètres de requête invalides",
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const { q, groundType, equipmentType, freeAccess, bbox } = parsed.data;

  try {
    const rows = await findAllBoulodromes(db, {
      ...(q ? { search: q } : {}),
      ...(groundType ? { groundTypes: groundType } : {}),
      ...(equipmentType ? { equipmentTypes: equipmentType } : {}),
      ...(freeAccess !== undefined ? { freeAccess } : {}),
      ...(bbox ? { boundingBox: bbox } : {}),
    });
    res.json(toBoulodromeFeatureCollection(rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des boulodromes" });
  }
});

app.get("/api/boulodromes/:id/cafes", async (req, res) => {
  const parsedParams = boulodromeIdParamSchema.safeParse(req.params);
  const parsedQuery = cafesNearBoulodromeQuerySchema.safeParse(req.query);
  if (!parsedParams.success || !parsedQuery.success) {
    const issues = [
      ...(parsedParams.success ? [] : parsedParams.error.issues),
      ...(parsedQuery.success ? [] : parsedQuery.error.issues),
    ];
    res.status(400).json({
      error: "Paramètres de requête invalides",
      details: issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
    return;
  }

  const { id } = parsedParams.data;
  const { radius } = parsedQuery.data;

  try {
    // Necessaire pour distinguer "boulodrome inconnu" (404) de "boulodrome
    // existant mais sans café dans le rayon" (200 + FeatureCollection vide) —
    // findCafesNearBoulodrome seul ne fait pas la difference (jointure sans
    // resultat dans les deux cas).
    const boulodrome = await findBoulodromeById(db, id);
    if (!boulodrome) {
      res.status(404).json({ error: "Boulodrome introuvable" });
      return;
    }

    const rows = await findCafesNearBoulodrome(db, id, radius);
    res.json(toCafeFeatureCollection(rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des cafés à proximité" });
  }
});
