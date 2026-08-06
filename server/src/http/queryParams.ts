import type { BoundingBox } from "../db/boulodromesRepository";

// Recherche libre (`?q=...`) : chaine vide/absente -> pas de filtre.
export function parseSearchParam(value: unknown): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : undefined;
}

// Accepte `?groundType=Sable&groundType=Stabilisé/cendrée` (repetition du
// parametre, gere nativement par Express) ou `?groundType=Sable,Stabilisé/cendrée`
// (liste separee par virgules), pour rester simple a construire cote front.
export function parseListParam(value: unknown): string[] | undefined {
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
export function parseBooleanParam(value: unknown): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

// `?bbox=west,south,east,north` (WGS84, meme ordre que le bbox GeoJSON).
// Mal forme (mauvais nombre de valeurs, NaN, rectangle degenere) -> pas de
// filtre, meme choix "tolerant" que les autres parametres ci-dessus.
export function parseBoundingBoxParam(value: unknown): BoundingBox | undefined {
  if (typeof value !== "string") return undefined;
  const parts = value.split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return undefined;
  const [west, south, east, north] = parts;
  if (west >= east || south >= north) return undefined;
  return { west, south, east, north };
}
