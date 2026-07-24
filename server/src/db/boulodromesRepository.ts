import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Boulodrome } from "../models/boulodrome";
import { boulodromes } from "./schema";
import type * as schema from "./schema";

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
          lastSyncedAt: item.lastSyncedAt,
        },
      });
  }
}
