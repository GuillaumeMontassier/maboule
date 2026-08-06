import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
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
  freeAccess: boolean | null;
  source: string;
  sourceId: string;
  lastSyncedAt: Date;
}

export interface FindAllBoulodromesOptions {
  // Recherche texte libre sur le nom (equipement ou site) et l'adresse
  // (rue, ville) ; insensible a la casse (ILIKE), sous-chaine (%terme%).
  search?: string;
  // Filtre exact sur la nature du sol (ex. "Sable", "Stabilisé/cendrée") ;
  // plusieurs valeurs = OR entre elles, combine en AND avec `search`.
  groundTypes?: string[];
  // Filtre exact sur le type d'équipement (ex. "Découvert", "Extérieur
  // couvert") ; memes regles de combinaison que `groundTypes`.
  equipmentTypes?: string[];
  // Filtre exact sur l'accès libre/payant (`acces_libre` cote Data ES).
  freeAccess?: boolean;
  // Restreint aux boulodromes dont les coordonnees tombent dans ce
  // rectangle (ex. viewport de la carte), meme convention que le bbox
  // GeoJSON : [west, south, east, north] en WGS84 (SRID 4326).
  boundingBox?: BoundingBox;
}

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export async function findAllBoulodromes(
  db: NodePgDatabase<typeof schema>,
  options: FindAllBoulodromesOptions = {},
): Promise<BoulodromeRow[]> {
  const query = db
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
      freeAccess: boulodromes.freeAccess,
      source: boulodromes.source,
      sourceId: boulodromes.sourceId,
      lastSyncedAt: boulodromes.lastSyncedAt,
    })
    .from(boulodromes);

  const conditions = [];

  if (options.search) {
    const term = `%${options.search}%`;
    conditions.push(
      or(
        ilike(boulodromes.name, term),
        ilike(boulodromes.siteName, term),
        ilike(boulodromes.street, term),
        ilike(boulodromes.city, term),
      ),
    );
  }

  if (options.groundTypes && options.groundTypes.length > 0) {
    conditions.push(inArray(boulodromes.groundType, options.groundTypes));
  }

  if (options.equipmentTypes && options.equipmentTypes.length > 0) {
    conditions.push(inArray(boulodromes.equipmentType, options.equipmentTypes));
  }

  if (options.freeAccess !== undefined) {
    conditions.push(eq(boulodromes.freeAccess, options.freeAccess));
  }

  if (options.boundingBox) {
    const { west, south, east, north } = options.boundingBox;
    // `&&` = operateur de recouvrement de bounding box PostGIS, accelere
    // par l'index GiST sur `coordinates` (cf. schema.ts) - suffisant pour
    // un point (sa "bbox" est lui-meme), pas besoin de ST_Within/Contains
    // plus couteux ici.
    conditions.push(
      sql`${boulodromes.coordinates} && ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)::geography`,
    );
  }

  if (conditions.length === 0) {
    return query;
  }

  return query.where(and(...conditions));
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
        freeAccess: item.freeAccess,
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
          freeAccess: item.freeAccess,
          lastSyncedAt: item.lastSyncedAt,
        },
      });
  }
}
