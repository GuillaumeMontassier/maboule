import cors from "cors";
import express from "express";
import { db } from "./db/client";
import { findAllBoulodromes } from "./db/boulodromesRepository";
import { toBoulodromeFeatureCollection } from "./geojson/boulodromes";

export const app = express();

// Le front (Vercel) et le back (Railway) sont sur des domaines differents,
// donc CORS est necessaire meme en prod. CORS_ORIGIN restreint aux domaines
// listes une fois connus ; sans cette variable (dev local), on reste ouvert
// a toutes origines - endpoint public en lecture seule, sans authentification
// ni donnee sensible.
const corsOrigin = process.env.CORS_ORIGIN?.split(",");
app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined));

app.get("/api/boulodromes", async (_req, res) => {
  try {
    const rows = await findAllBoulodromes(db);
    res.json(toBoulodromeFeatureCollection(rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des boulodromes" });
  }
});
