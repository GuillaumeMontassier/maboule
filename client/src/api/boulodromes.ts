import type { FeatureCollection, Point } from "geojson";

export interface BoulodromeProperties {
  id: string;
  name: string;
  street: string;
  postalCode: string;
  city: string;
  inseeCode: string | null;
  siteName: string | null;
  equipmentType: string | null;
  groundType: string | null;
  source: string;
  lastSyncedAt: string;
}

export type BoulodromesFeatureCollection = FeatureCollection<Point, BoulodromeProperties>;

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function fetchBoulodromes(): Promise<BoulodromesFeatureCollection> {
  const response = await fetch(`${API_URL}/api/boulodromes`);
  if (!response.ok) {
    throw new Error(`Erreur lors du chargement des boulodromes (${response.status})`);
  }
  return response.json();
}
