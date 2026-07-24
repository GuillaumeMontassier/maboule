import express from "express";
import { db } from "./db/client";
import { findAllBoulodromes } from "./db/boulodromesRepository";
import { toBoulodromeFeatureCollection } from "./geojson/boulodromes";

export const app = express();

app.get("/api/boulodromes", async (_req, res) => {
  try {
    const rows = await findAllBoulodromes(db);
    res.json(toBoulodromeFeatureCollection(rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des boulodromes" });
  }
});
