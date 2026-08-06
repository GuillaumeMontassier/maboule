import cors from "cors";
import express from "express";
import { db } from "./db/client";
import { findAllBoulodromes } from "./db/boulodromesRepository";
import type { BoundingBox } from "./db/boulodromesRepository";
import { toBoulodromeFeatureCollection } from "./geojson/boulodromes";

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

// Accepte `?groundType=Sable&groundType=Stabilisé/cendrée` (repetition du
// parametre, gere nativement par Express) ou `?groundType=Sable,Stabilisé/cendrée`
// (liste separee par virgules), pour rester simple a construire cote front.
function parseListParam(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value : [value];
  const values = raw
    .filter((v): v is string => typeof v === "string")
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

// "true"/"false" uniquement - toute autre valeur (absente, mal formee) est
// traitee comme "pas de filtre" plutot que de faire echouer la requete.
function parseBooleanParam(value: unknown): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

// `?bbox=west,south,east,north` (WGS84, meme ordre que le bbox GeoJSON).
// Mal forme (mauvais nombre de valeurs, NaN, rectangle degenere) -> pas de
// filtre, meme choix "tolerant" que les autres parametres ci-dessus.
function parseBoundingBoxParam(value: unknown): BoundingBox | undefined {
  if (typeof value !== "string") return undefined;
  const parts = value.split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return undefined;
  const [west, south, east, north] = parts;
  if (west >= east || south >= north) return undefined;
  return { west, south, east, north };
}

app.get("/api/boulodromes", async (req, res) => {
  try {
    // `q` : recherche libre par nom (equipement/site) ou adresse
    // (rue/ville) - cf. findAllBoulodromes. Absent ou vide -> pas de filtre.
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const groundTypes = parseListParam(req.query.groundType);
    const equipmentTypes = parseListParam(req.query.equipmentType);
    const freeAccess = parseBooleanParam(req.query.freeAccess);
    const boundingBox = parseBoundingBoxParam(req.query.bbox);
    const rows = await findAllBoulodromes(db, {
      ...(q ? { search: q } : {}),
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
