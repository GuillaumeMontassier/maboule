-- Up Migration

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE boulodromes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  street TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  insee_code TEXT,
  -- geography (vs geometry) calcule les distances en metres sur un modele
  -- spherique de la Terre, ce qui evite d'avoir a reprojeter manuellement
  -- pour des requetes du type "boulodromes a moins de 500m de X".
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('opendata-paris', 'data-es', 'manual')),
  source_id TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL,
  UNIQUE (source, source_id)
);

-- Index GIST : structure standard de PostGIS pour indexer une colonne
-- geography/geometry, necessaire pour que ST_DWithin/ST_Distance restent
-- rapides une fois la table remplie (sinon scan complet a chaque requete).
CREATE INDEX boulodromes_coordinates_idx ON boulodromes USING GIST (coordinates);

-- Down Migration

DROP TABLE IF EXISTS boulodromes;