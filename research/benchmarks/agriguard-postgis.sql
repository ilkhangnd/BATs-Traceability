\set ON_ERROR_STOP on

CREATE EXTENSION IF NOT EXISTS postgis;
DROP TABLE IF EXISTS research_agriguard_covers_geometries;
CREATE UNLOGGED TABLE research_agriguard_covers_geometries (
  id bigint PRIMARY KEY,
  polygon geometry(Polygon, 4326) NOT NULL
);

INSERT INTO research_agriguard_covers_geometries (id, polygon)
SELECT
  value,
  ST_MakeEnvelope(
    107.0 + ((value - 1) % 1000) * 0.001,
    11.0 + floor((value - 1) / 1000) * 0.001,
    107.0 + ((value - 1) % 1000) * 0.001 + 0.0008,
    11.0 + floor((value - 1) / 1000) * 0.001 + 0.0008,
    4326
  )
FROM generate_series(1, 100000) AS value;

CREATE INDEX research_agriguard_covers_geometries_gix
  ON research_agriguard_covers_geometries USING GIST (polygon);
VACUUM (ANALYZE) research_agriguard_covers_geometries;
