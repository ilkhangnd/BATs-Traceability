CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS farm_plot_geometries (
  farm_plot_id uuid PRIMARY KEY,
  polygon geometry(Polygon, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS farm_plot_geometries_polygon_gix
  ON farm_plot_geometries USING GIST (polygon);

-- Production geofence query:
-- SELECT ST_Contains(polygon, ST_SetSRID(ST_Point($longitude, $latitude), 4326))
-- FROM farm_plot_geometries WHERE farm_plot_id = $farm_plot_id;
