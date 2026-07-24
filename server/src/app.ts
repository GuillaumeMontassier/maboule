import cors from "cors";
import express from "express";
import { db } from "./db/client";
import { findAllBoulodromes } from "./db/boulodromesRepository";
import { toBoulodromeFeatureCollection } from "./geojson/boulodromes";

export const app = express();

// Le front et le back seront deployes sur des domaines differents (voir
// roadmap Phase 1 : front sur Vercel/Netlify, back sur Railway/Render), donc
// CORS sera necessaire meme en prod. Ouvert a toutes origines pour l'instant :
// endpoint public en lecture seule, sans authentification ni donnee sensible.
app.use(cors());

app.get("/api/boulodromes", async (_req, res) => {
  try {
    const rows = await findAllBoulodromes(db);
    res.json(toBoulodromeFeatureCollection(rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des boulodromes" });
  }
});
