import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Boulodrome } from "../models/boulodrome";
import { boulodromes } from "./schema";
import type * as schema from "./schema";

export interface BoulodromeRow {
  id: string;
  name: string;
  street: string;
  postalCode: string;
  city: string;
  inseeCode: string | null;
  longitude: number;
  latitude: number;
  siteName: string | null;
  equipmentType: string | null;
  groundType: string | null;
  source: string;
  sourceId: string;
  lastSyncedAt: Date;
}

export async function findAllBoulodromes(
  db: NodePgDatabase<typeof schema>,
): Promise<BoulodromeRow[]> {
  return db
    .select({
      id: boulodromes.id,
      name: boulodromes.name,
      street: boulodromes.street,
      postalCode: boulodromes.postalCode,
      city: boulodromes.city,
      inseeCode: boulodromes.inseeCode,
      // La colonne est stockee en `geography` : on la reprojette en
      // `geometry` pour en extraire lon/lat via ST_X/ST_Y, que Drizzle ne
      // modelise pas nativement (cf. commentaire dans schema.ts).
      longitude: sql<number>`ST_X(${boulodromes.coordinates}::geometry)`,
      latitude: sql<number>`ST_Y(${boulodromes.coordinates}::geometry)`,
      siteName: boulodromes.siteName,
      equipmentType: boulodromes.equipmentType,
      groundType: boulodromes.groundType,
      source: boulodromes.source,
      sourceId: boulodromes.sourceId,
      lastSyncedAt: boulodromes.lastSyncedAt,
    })
    .from(boulodromes);
}

export async function upsertBoulodromes(
  db: NodePgDatabase<typeof schema>,
  items: Boulodrome[],
): Promise<void> {
  for (const item of items) {
    // ST_MakePoint(x, y) attend (longitude, latitude), pas l'inverse.
    // La colonne etant en customType, on passe par du SQL brut pour la
    // valeur : Drizzle ne modelise pas les fonctions PostGIS.
    const coordinates = sql`ST_SetSRID(ST_MakePoint(${item.coordinates.longitude}, ${item.coordinates.latitude}), 4326)::geography`;

    await db
      .insert(boulodromes)
      .values({
        id: item.id,
        name: item.name,
        street: item.address.street,
        postalCode: item.address.postalCode,
        city: item.address.city,
        inseeCode: item.address.inseeCode ?? null,
        coordinates,
        siteName: item.siteName,
        equipmentType: item.equipmentType,
        groundType: item.groundType,
        source: item.source,
        sourceId: item.sourceId,
        lastSyncedAt: item.lastSyncedAt,
      })
      .onConflictDoUpdate({
        target: boulodromes.id,
        set: {
          name: item.name,
          street: item.address.street,
          postalCode: item.address.postalCode,
          city: item.address.city,
          inseeCode: item.address.inseeCode ?? null,
          coordinates,
          siteName: item.siteName,
          equipmentType: item.equipmentType,
          groundType: item.groundType,
          lastSyncedAt: item.lastSyncedAt,
        },
      });
  }
}
