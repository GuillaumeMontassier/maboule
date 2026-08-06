import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Cafe } from "../models/cafe";
import { cafes } from "./schema";
import type * as schema from "./schema";

export interface CafeRow {
  id: string;
  name: string;
  amenityType: string;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  longitude: number;
  latitude: number;
  source: string;
  sourceId: string;
  lastSyncedAt: Date;
}

export async function findAllCafes(db: NodePgDatabase<typeof schema>): Promise<CafeRow[]> {
  return db
    .select({
      id: cafes.id,
      name: cafes.name,
      amenityType: cafes.amenityType,
      street: cafes.street,
      postalCode: cafes.postalCode,
      city: cafes.city,
      longitude: sql<number>`ST_X(${cafes.coordinates}::geometry)`,
      latitude: sql<number>`ST_Y(${cafes.coordinates}::geometry)`,
      source: cafes.source,
      sourceId: cafes.sourceId,
      lastSyncedAt: cafes.lastSyncedAt,
    })
    .from(cafes);
}

export async function upsertCafes(db: NodePgDatabase<typeof schema>, items: Cafe[]): Promise<void> {
  for (const item of items) {
    const coordinates = sql`ST_SetSRID(ST_MakePoint(${item.coordinates.longitude}, ${item.coordinates.latitude}), 4326)::geography`;

    await db
      .insert(cafes)
      .values({
        id: item.id,
        name: item.name,
        amenityType: item.amenityType,
        street: item.address?.street ?? null,
        postalCode: item.address?.postalCode ?? null,
        city: item.address?.city ?? null,
        coordinates,
        source: item.source,
        sourceId: item.sourceId,
        lastSyncedAt: item.lastSyncedAt,
      })
      .onConflictDoUpdate({
        target: cafes.id,
        set: {
          name: item.name,
          amenityType: item.amenityType,
          street: item.address?.street ?? null,
          postalCode: item.address?.postalCode ?? null,
          city: item.address?.city ?? null,
          coordinates,
          lastSyncedAt: item.lastSyncedAt,
        },
      });
  }
}
