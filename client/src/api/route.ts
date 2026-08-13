import type { Feature, LineString } from "geojson";

export interface RouteProperties {
  distanceMeters: number;
  durationSeconds: number;
}

export type RouteFeature = Feature<LineString, RouteProperties>;

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function fetchRoute(
  boulodromeId: string,
  from: { latitude: number; longitude: number },
): Promise<RouteFeature> {
  const params = new URLSearchParams({ from: `${from.latitude},${from.longitude}` });

  const response = await fetch(
    `${API_URL}/api/boulodromes/${encodeURIComponent(boulodromeId)}/route?${params.toString()}`,
  );
  if (response.status === 404) {
    throw new Error("Aucun itinéraire trouvé jusqu'à ce boulodrome.");
  }
  if (response.status === 502 || response.status === 503) {
    throw new Error("Le service d'itinéraire est momentanément indisponible. Réessayez plus tard.");
  }
  if (!response.ok) {
    throw new Error(`Erreur lors du calcul de l'itinéraire (${response.status})`);
  }
  return response.json();
}
