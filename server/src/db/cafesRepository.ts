import { eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Cafe } from "../models/cafe";
import { boulodromes, cafes } from "./schema";
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

export interface CafeWithDistanceRow extends CafeRow {
  distanceMeters: number;
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

// Jointure ciblee sur un seul boulodrome (id unique, PK) : equivaut a
// croiser `cafes` avec ce boulodrome precis, puis a ne garder que les cafes
// dans le rayon donne.
//
// ST_DWithin(geography, geography, metres) plutot que
// `ST_Distance(...) < radiusMeters` : meme resultat, mais ST_DWithin peut
// s'appuyer sur l'index GiST de `cafes.coordinates` pour eliminer d'abord
// les lignes hors bbox approximative avant le calcul de distance exact,
// alors que ST_Distance doit etre evalue pour chaque ligne avant comparaison
// - c'est la fonction PostGIS idiomatique pour "a X metres de".
export async function findCafesNearBoulodrome(
  db: NodePgDatabase<typeof schema>,
  boulodromeId: string,
  radiusMeters: number,
): Promise<CafeWithDistanceRow[]> {
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
      // ST_Distance sur deux `geography` renvoie directement des metres
      // (calcul spherique) : pas de reprojection a faire, contrairement a
      // ST_X/ST_Y ci-dessus.
      distanceMeters: sql<number>`ST_Distance(${cafes.coordinates}, ${boulodromes.coordinates})`,
    })
    .from(cafes)
    .innerJoin(boulodromes, eq(boulodromes.id, boulodromeId))
    .where(sql`ST_DWithin(${cafes.coordinates}, ${boulodromes.coordinates}, ${radiusMeters})`)
    .orderBy(sql`ST_Distance(${cafes.coordinates}, ${boulodromes.coordinates})`);
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
