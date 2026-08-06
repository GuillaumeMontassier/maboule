import { sql } from "drizzle-orm";
import { boolean, check, customType, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

// Drizzle n'a pas de type PostGIS natif : customType nous laisse declarer
// une colonne dont le type SQL est ecrit a la main. On garde `geography`
// (plutot que `geometry`) pour les memes raisons que dans l'ancienne
// migration node-pg-migrate : calcul de distances en metres sur un modele
// spherique, sans reprojection manuelle pour des requetes type ST_DWithin.
// Attention : `drizzle-kit generate` entoure ce dataType de guillemets dans
// le SQL genere (`"geography(Point, 4326)"`), ce que Postgres interprete
// comme un identifiant et non un type -> erreur "type does not exist". Il
// faut retirer les guillemets a la main dans le fichier de migration genere
// avant de la jouer.
const geographyPoint = customType<{ data: string }>({
  dataType() {
    return "geography(Point, 4326)";
  },
});

export const boulodromes = pgTable(
  "boulodromes",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    street: text("street").notNull(),
    postalCode: text("postal_code").notNull(),
    city: text("city").notNull(),
    inseeCode: text("insee_code"),
    coordinates: geographyPoint("coordinates").notNull(),
    siteName: text("site_name"),
    equipmentType: text("equipment_type"),
    groundType: text("ground_type"),
    freeAccess: boolean("free_access"),
    source: text("source").notNull(),
    sourceId: text("source_id").notNull(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    // Index GIST : structure standard PostGIS pour indexer une colonne
    // geography/geometry, necessaire pour que ST_DWithin/ST_Distance restent
    // rapides une fois la table remplie (sinon scan complet a chaque requete).
    index("boulodromes_coordinates_idx").using("gist", table.coordinates),
    unique().on(table.source, table.sourceId),
    check(
      "boulodromes_source_check",
      sql`${table.source} in ('opendata-paris', 'data-es', 'manual')`,
    ),
  ],
);

export const cafes = pgTable(
  "cafes",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    amenityType: text("amenity_type").notNull(),
    // Tags `addr:*` OSM : pas systematiquement renseignes, contrairement a
    // l'adresse des boulodromes (source gouvernementale, toujours complete).
    street: text("street"),
    postalCode: text("postal_code"),
    city: text("city"),
    coordinates: geographyPoint("coordinates").notNull(),
    source: text("source").notNull(),
    sourceId: text("source_id").notNull(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("cafes_coordinates_idx").using("gist", table.coordinates),
    unique().on(table.source, table.sourceId),
    check("cafes_source_check", sql`${table.source} in ('osm', 'manual')`),
    check("cafes_amenity_type_check", sql`${table.amenityType} in ('cafe', 'bar', 'pub')`),
  ],
);
