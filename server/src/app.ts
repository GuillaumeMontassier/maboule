import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { db } from "./db/client";
import { findAllBoulodromes, findBoulodromeById } from "./db/boulodromesRepository";
import { findCafesNearBoulodrome } from "./db/cafesRepository";
import { toBoulodromeFeatureCollection } from "./geojson/boulodromes";
import { toCafeFeatureCollection } from "./geojson/cafes";
import { GeoCoordinates } from "./models/geo";
import { generateOpenApiDocument } from "./openapi/document";
import {
  AddressNotFoundError,
  fetchGeocodeCandidates,
  fetchWalkingRoute,
  OpenRouteServiceUnavailableError,
  RouteNotFoundError,
} from "./routing/openRouteServiceClient";
import { boulodromeIdParamSchema, cafesNearBoulodromeQuerySchema } from "./schemas/cafesNearBoulodromeQuery";
import { boulodromesQuerySchema } from "./schemas/boulodromesQuery";
import { geocodeQuerySchema } from "./schemas/geocodeQuery";
import { routeQuerySchema } from "./schemas/routeQuery";

export const app = express();

// Meme "shape" de resultat que zod `safeParse` (success + error.issues) -
// type structurel plutot qu'un import direct du type zod pour rester
// insensible a la version exacte de la lib.
interface SafeParseLike {
  success: boolean;
  error?: { issues: Array<{ path: PropertyKey[]; message: string }> };
}

// Fusionne les resultats de plusieurs `safeParse` (params + query) et repond
// 400 si l'un d'eux echoue - factorise le bloc identique entre les endpoints
// `/api/boulodromes/:id/*`, qui valident tous params + query separement.
function rejectIfInvalid(res: express.Response, results: SafeParseLike[]): boolean {
  const issues = results.flatMap((result) => (result.success ? [] : (result.error?.issues ?? [])));
  if (issues.length === 0) return false;

  res.status(400).json({
    error: "Paramètres de requête invalides",
    details: issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  });
  return true;
}

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
  if (rejectIfInvalid(res, [parsedParams, parsedQuery])) return;
  if (!parsedParams.success || !parsedQuery.success) return;

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

app.get("/api/boulodromes/:id/route", async (req, res) => {
  const parsedParams = boulodromeIdParamSchema.safeParse(req.params);
  const parsedQuery = routeQuerySchema.safeParse(req.query);
  if (rejectIfInvalid(res, [parsedParams, parsedQuery])) return;
  if (!parsedParams.success || !parsedQuery.success) return;

  const { id } = parsedParams.data;
  const { from } = parsedQuery.data;

  try {
    const boulodrome = await findBoulodromeById(db, id);
    if (!boulodrome) {
      res.status(404).json({ error: "Boulodrome introuvable" });
      return;
    }

    const destination = new GeoCoordinates(boulodrome.latitude, boulodrome.longitude);
    const route = await fetchWalkingRoute(from, destination);
    res.json(route);
  } catch (error) {
    if (error instanceof RouteNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    // 502 (Bad Gateway) plutot que 500 : l'erreur vient du fournisseur
    // externe, pas d'un bug de notre cote - meme convention pour panne,
    // timeout et quota depasse (cf. spec, pas de distinction utile pour
    // l'appelant entre ces trois cas).
    if (error instanceof OpenRouteServiceUnavailableError) {
      res.status(502).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Erreur lors du calcul de l'itinéraire" });
  }
});

app.get("/api/geocode", async (req, res) => {
  const parsed = geocodeQuerySchema.safeParse(req.query);
  if (rejectIfInvalid(res, [parsed])) return;
  if (!parsed.success) return;

  const { q } = parsed.data;

  try {
    const candidates = await fetchGeocodeCandidates(q);
    res.json(candidates);
  } catch (error) {
    if (error instanceof AddressNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    // Meme convention 502 que /route : erreur cote fournisseur, pas cote nous.
    if (error instanceof OpenRouteServiceUnavailableError) {
      res.status(502).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Erreur lors du géocodage de l'adresse" });
  }
});
