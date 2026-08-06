import cors from "cors";
import express from "express";
import { db } from "./db/client";
import { findAllBoulodromes } from "./db/boulodromesRepository";
import { toBoulodromeFeatureCollection } from "./geojson/boulodromes";
import {
  parseBooleanParam,
  parseBoundingBoxParam,
  parseListParam,
  parseSearchParam,
} from "./http/queryParams";

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

app.get("/api/boulodromes", async (req, res) => {
  try {
    const search = parseSearchParam(req.query.q);
    const groundTypes = parseListParam(req.query.groundType);
    const equipmentTypes = parseListParam(req.query.equipmentType);
    const freeAccess = parseBooleanParam(req.query.freeAccess);
    const boundingBox = parseBoundingBoxParam(req.query.bbox);
    const rows = await findAllBoulodromes(db, {
      ...(search ? { search } : {}),
      ...(groundTypes ? { groundTypes } : {}),
      ...(equipmentTypes ? { equipmentTypes } : {}),
      ...(freeAccess !== undefined ? { freeAccess } : {}),
      ...(boundingBox ? { boundingBox } : {}),
    });
    res.json(toBoulodromeFeatureCollection(rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des boulodromes" });
  }
});
