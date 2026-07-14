CREATE TABLE IF NOT EXISTS farm_plots (
  id text PRIMARY KEY,
  farmer_id text NOT NULL,
  farmer_name text NOT NULL,
  planting_area_code text NOT NULL UNIQUE,
  crop text NOT NULL,
  variety text NOT NULL,
  area_ha numeric(12,4) NOT NULL CHECK (area_ha > 0),
  province text NOT NULL,
  district text NOT NULL,
  commune text NOT NULL,
  polygon_geojson jsonb NOT NULL,
  polygon geometry(Polygon, 4326) NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS farm_plots_status_idx ON farm_plots(status);
CREATE INDEX IF NOT EXISTS farm_plots_farmer_id_idx ON farm_plots(farmer_id);
CREATE INDEX IF NOT EXISTS farm_plots_polygon_gix ON farm_plots USING GIST(polygon);

CREATE TABLE IF NOT EXISTS batches (
  id text PRIMARY KEY,
  gtin text NOT NULL,
  lot text NOT NULL,
  serial text NOT NULL,
  farm_plot_id text NOT NULL REFERENCES farm_plots(id),
  farmer_id text NOT NULL,
  crop text NOT NULL,
  variety text NOT NULL,
  quantity_kg numeric(14,3) NOT NULL CHECK (quantity_kg > 0),
  status text NOT NULL,
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  risk_band text NOT NULL DEFAULT 'green',
  accepted boolean NOT NULL DEFAULT true,
  issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(gtin, lot, serial)
);

CREATE INDEX IF NOT EXISTS batches_farm_plot_created_idx
  ON batches(farm_plot_id, created_at);
CREATE INDEX IF NOT EXISTS batches_status_idx ON batches(status);

CREATE TABLE IF NOT EXISTS epcis_events (
  id text PRIMARY KEY,
  batch_id text NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  status text NOT NULL,
  event_time timestamptz NOT NULL,
  actor_id text NOT NULL,
  payload jsonb NOT NULL,
  event_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS epcis_events_event_time_idx ON epcis_events(event_time);
CREATE INDEX IF NOT EXISTS epcis_events_batch_time_idx
  ON epcis_events(batch_id, event_time);

CREATE TABLE IF NOT EXISTS evidence_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text REFERENCES epcis_events(id) ON DELETE SET NULL,
  sha256 text NOT NULL UNIQUE,
  type text NOT NULL,
  storage_ref text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS evidence_files_event_id_idx ON evidence_files(event_id);

CREATE TABLE IF NOT EXISTS validation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id text NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  event_id text,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  band text NOT NULL,
  accepted boolean NOT NULL,
  issues jsonb NOT NULL,
  rule_set text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS validation_results_batch_created_idx
  ON validation_results(batch_id, created_at);

CREATE TABLE IF NOT EXISTS anchors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_date date NOT NULL UNIQUE,
  merkle_root text NOT NULL,
  schema_version text NOT NULL,
  chain_id text,
  contract_address text,
  tx_hash text,
  block_number bigint,
  status text NOT NULL DEFAULT 'pending',
  anchored_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS anchors_status_idx ON anchors(status);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key text PRIMARY KEY,
  actor_id text NOT NULL,
  endpoint text NOT NULL,
  request_hash text NOT NULL,
  response_code integer NOT NULL,
  response_body jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idempotency_keys_expires_at_idx
  ON idempotency_keys(expires_at);
