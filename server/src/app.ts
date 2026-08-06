import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { db } from "./db/client";
import { findAllBoulodromes } from "./db/boulodromesRepository";
import { toBoulodromeFeatureCollection } from "./geojson/boulodromes";
import { generateOpenApiDocument } from "./openapi/document";
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
