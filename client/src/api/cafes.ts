import type { FeatureCollection, Point } from "geojson";

export type CafeAmenityType = "cafe" | "bar" | "pub";

export interface CafeProperties {
  id: string;
  name: string;
  amenityType: CafeAmenityType;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  source: string;
  lastSyncedAt: string;
  distanceMeters: number;
}

export type CafesFeatureCollection = FeatureCollection<Point, CafeProperties>;

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function fetchCafesNearBoulodrome(
  boulodromeId: string,
  radiusMeters?: number,
): Promise<CafesFeatureCollection> {
  const params = new URLSearchParams();
  if (radiusMeters !== undefined) {
    params.append("radius", String(radiusMeters));
  }
  const query = params.toString();

  const response = await fetch(
    `${API_URL}/api/boulodromes/${encodeURIComponent(boulodromeId)}/cafes${query ? `?${query}` : ""}`,
  );
  if (!response.ok) {
    throw new Error(`Erreur lors du chargement des cafés à proximité (${response.status})`);
  }
  return response.json();
}
