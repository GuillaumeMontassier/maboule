import type { Feature, LineString } from "geojson";
import { GeoCoordinates } from "../models/geo";

const ORS_DIRECTIONS_API = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";
const ORS_GEOCODE_SEARCH_API = "https://api.openrouteservice.org/geocode/search";

// Au-dela de ce delai on considere ORS en panne plutot que d'attendre
// indefiniment - garde le endpoint reactif meme si le fournisseur externe
// traine (cf. user story "l'app reste utilisable si le routage est down").
const REQUEST_TIMEOUT_MS = 10_000;

export interface RouteProperties {
  distanceMeters: number;
  durationSeconds: number;
}

export type RouteFeature = Feature<LineString, RouteProperties>;

export class RouteNotFoundError extends Error {}
export class OpenRouteServiceUnavailableError extends Error {}

export interface OrsDirectionsRequestBody {
  coordinates: [number, number][];
}

export function buildDirectionsRequestBody(
  origin: GeoCoordinates,
  destination: GeoCoordinates,
): OrsDirectionsRequestBody {
  return {
    // ORS attend [longitude, latitude] (convention GeoJSON), pas l'inverse.
    coordinates: [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude],
    ],
  };
}

export interface OrsDirectionsResponse {
  features: Array<{
    geometry: { type: "LineString"; coordinates: [number, number][] };
    properties: { summary: { distance: number; duration: number } };
  }>;
}

interface OrsErrorResponse {
  error?: { code: number; message: string } | string;
}

// Codes d'erreur ORS documentes sous "PointNotFound" (extremite trop loin de
// tout troncon routable, cf. https://giscience.github.io/openrouteservice) -
// c'est aussi la maniere dont ORS signale "aucun itineraire entre ces deux
// points" (reseau routier non connecte), il n'y a pas de code distinct pour
// ce cas. Les deux se traduisent cote utilisateur par le meme message :
// "impossible de relier ces deux points a pied".
const ORS_ROUTE_NOT_FOUND_CODES = new Set([2009, 2010]);

export function toRouteFeature(response: OrsDirectionsResponse): RouteFeature {
  const feature = response.features[0];
  if (!feature) {
    throw new RouteNotFoundError("Aucun itinéraire trouvé entre ces deux points");
  }

  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      // Arrondi au metre/seconde : la precision brute d'ORS n'a pas de sens
      // pour l'utilisateur final (meme logique que distanceMeters cote cafes).
      distanceMeters: Math.round(feature.properties.summary.distance),
      durationSeconds: Math.round(feature.properties.summary.duration),
    },
  };
}

export async function fetchWalkingRoute(origin: GeoCoordinates, destination: GeoCoordinates): Promise<RouteFeature> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Un seul try/catch autour de fetch() + lecture du corps : le timeout doit
  // couvrir tout le cycle de vie de la requete, pas seulement la reception
  // des en-tetes - sinon un corps de reponse qui traine (ORS lent a streamer
  // le JSON) n'est jamais annule par l'AbortController.
  try {
    const response = await fetch(ORS_DIRECTIONS_API, {
      method: "POST",
      headers: {
        // ORS attend la cle brute dans Authorization, sans prefixe "Bearer".
        Authorization: process.env.ORS_API_KEY ?? "",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(buildDirectionsRequestBody(origin, destination)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => undefined)) as OrsErrorResponse | undefined;
      const code = typeof body?.error === "object" ? body.error.code : undefined;
      if (code !== undefined && ORS_ROUTE_NOT_FOUND_CODES.has(code)) {
        throw new RouteNotFoundError("Aucun itinéraire trouvé entre ces deux points");
      }
      throw new OpenRouteServiceUnavailableError(`OpenRouteService a renvoyé une erreur (${response.status})`);
    }

    const body = (await response.json()) as OrsDirectionsResponse;
    return toRouteFeature(body);
  } catch (error) {
    // RouteNotFoundError est un signal metier deliberement leve ci-dessus
    // (aucun itineraire), pas une panne fournisseur - on le laisse remonter
    // tel quel. Tout le reste (panne reseau, timeout/AbortError, JSON
    // invalide) traduit un fournisseur en cause.
    if (error instanceof RouteNotFoundError) {
      throw error;
    }
    throw new OpenRouteServiceUnavailableError("OpenRouteService est injoignable ou a échoué", { cause: error });
  } finally {
    clearTimeout(timeout);
  }
}

export interface GeocodeCandidate {
  label: string;
  coordinates: GeoCoordinates;
}

export class AddressNotFoundError extends Error {}

export interface OrsGeocodeSearchParams {
  text: string;
}

export function buildGeocodeSearchParams(query: string): OrsGeocodeSearchParams {
  return { text: query };
}

export interface OrsGeocodeResponse {
  features: Array<{
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: { label: string };
  }>;
}

export function toGeocodeCandidates(response: OrsGeocodeResponse): GeocodeCandidate[] {
  // Contrairement aux directions (une reponse sans feature = "aucun
  // itineraire", cas metier explicite cote ORS), Pelias renvoie ici un 200
  // avec une liste vide quand aucune adresse ne correspond - c'est nous qui
  // choisissons de traduire cette liste vide en 404 cote appelant.
  if (response.features.length === 0) {
    throw new AddressNotFoundError("Aucune adresse trouvée");
  }

  return response.features.map((feature) => ({
    label: feature.properties.label,
    // GeoJSON = [longitude, latitude], l'inverse de notre GeoCoordinates.
    coordinates: new GeoCoordinates(feature.geometry.coordinates[1], feature.geometry.coordinates[0]),
  }));
}

export async function fetchGeocodeCandidates(query: string): Promise<GeocodeCandidate[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Endpoint GET (contrairement aux directions, en POST) : ORS attend la cle
  // API en query param `api_key`, pas dans l'en-tete Authorization.
  const url = new URL(ORS_GEOCODE_SEARCH_API);
  const params = buildGeocodeSearchParams(query);
  url.searchParams.set("text", params.text);
  url.searchParams.set("api_key", process.env.ORS_API_KEY ?? "");

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new OpenRouteServiceUnavailableError(`OpenRouteService a renvoyé une erreur (${response.status})`);
    }

    const body = (await response.json()) as OrsGeocodeResponse;
    return toGeocodeCandidates(body);
  } catch (error) {
    // AddressNotFoundError est un signal metier (aucune adresse trouvee),
    // pas une panne fournisseur - on le laisse remonter tel quel, meme
    // logique que RouteNotFoundError ci-dessus.
    if (error instanceof AddressNotFoundError || error instanceof OpenRouteServiceUnavailableError) {
      throw error;
    }
    throw new OpenRouteServiceUnavailableError("OpenRouteService est injoignable ou a échoué", { cause: error });
  } finally {
    clearTimeout(timeout);
  }
}
