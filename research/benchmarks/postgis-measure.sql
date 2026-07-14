\set ON_ERROR_STOP on

DROP TABLE IF EXISTS research_postgis_measurements;
CREATE TEMP TABLE research_postgis_measurements (
  polygon_count integer NOT NULL,
  run integer NOT NULL,
  execution_ms double precision NOT NULL,
  found boolean NOT NULL
);

DO $$
DECLARE
  target_count integer;
  iteration integer;
  longitude double precision;
  latitude double precision;
  started_at timestamptz;
  matched_id bigint;
BEGIN
  FOREACH target_count IN ARRAY ARRAY[100, 1000, 10000, 100000]
  LOOP
    longitude := CASE target_count
      WHEN 100 THEN 107.0504
      ELSE 107.5004
    END;
    latitude := CASE target_count
      WHEN 100 THEN 11.0004
      WHEN 1000 THEN 11.0004
      WHEN 10000 THEN 11.0054
      ELSE 11.0504
    END;
    FOR iteration IN 1..13
    LOOP
      started_at := clock_timestamp();
      SELECT id INTO matched_id
      FROM research_farm_plot_geometries
      WHERE id <= target_count
        AND ST_Contains(
          polygon,
          ST_SetSRID(ST_Point(longitude, latitude), 4326)
        )
      LIMIT 1;
      IF iteration > 3 THEN
        INSERT INTO research_postgis_measurements
        VALUES (
          target_count,
          iteration - 3,
          EXTRACT(EPOCH FROM (clock_timestamp() - started_at)) * 1000.0,
          matched_id IS NOT NULL
        );
      END IF;
    END LOOP;
  END LOOP;
END
$$;

\copy (SELECT polygon_count, run, execution_ms, found FROM research_postgis_measurements ORDER BY polygon_count, run) TO STDOUT WITH CSV HEADER
