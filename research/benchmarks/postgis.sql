\set ON_ERROR_STOP on
\timing on

CREATE EXTENSION IF NOT EXISTS postgis;
DROP TABLE IF EXISTS research_farm_plot_geometries;
CREATE TABLE research_farm_plot_geometries (
  id bigint PRIMARY KEY,
  polygon geometry(Polygon, 4326) NOT NULL
);
CREATE INDEX research_farm_plot_geometries_gix
  ON research_farm_plot_geometries USING GIST (polygon);

-- Generate 100,000 non-overlapping square plots. Prefix subsets are benchmarked
-- at 10^2, 10^3, 10^4 and 10^5 rows without changing the query shape.
INSERT INTO research_farm_plot_geometries (id, polygon)
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

VACUUM (ANALYZE) research_farm_plot_geometries;

\echo 'N=100'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id FROM research_farm_plot_geometries
WHERE id <= 100
  AND ST_Contains(polygon, ST_SetSRID(ST_Point(107.0504, 11.0004), 4326));

\echo 'N=1000'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id FROM research_farm_plot_geometries
WHERE id <= 1000
  AND ST_Contains(polygon, ST_SetSRID(ST_Point(107.5004, 11.0004), 4326));

\echo 'N=10000'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id FROM research_farm_plot_geometries
WHERE id <= 10000
  AND ST_Contains(polygon, ST_SetSRID(ST_Point(107.5004, 11.0054), 4326));

\echo 'N=100000'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id FROM research_farm_plot_geometries
WHERE id <= 100000
  AND ST_Contains(polygon, ST_SetSRID(ST_Point(107.5004, 11.0504), 4326));
