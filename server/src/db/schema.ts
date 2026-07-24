import { sql } from "drizzle-orm";
import { check, customType, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

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
