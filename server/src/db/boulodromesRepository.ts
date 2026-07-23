import type { Pool } from "pg";
import type { Boulodrome } from "../models/boulodrome";

export async function upsertBoulodromes(pool: Pool, boulodromes: Boulodrome[]): Promise<void> {
  for (const boulodrome of boulodromes) {
    await pool.query(
      `INSERT INTO boulodromes
         (id, name, street, postal_code, city, insee_code, coordinates, source, source_id, last_synced_at)
       VALUES
         -- ST_MakePoint(x, y) attend (longitude, latitude), pas l'inverse.
         ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         street = EXCLUDED.street,
         postal_code = EXCLUDED.postal_code,
         city = EXCLUDED.city,
         insee_code = EXCLUDED.insee_code,
         coordinates = EXCLUDED.coordinates,
         last_synced_at = EXCLUDED.last_synced_at`,
      [
        boulodrome.id,
        boulodrome.name,
        boulodrome.address.street,
        boulodrome.address.postalCode,
        boulodrome.address.city,
        boulodrome.address.inseeCode ?? null,
        boulodrome.coordinates.longitude,
        boulodrome.coordinates.latitude,
        boulodrome.source,
        boulodrome.sourceId,
        boulodrome.lastSyncedAt,
      ],
    );
  }
}
