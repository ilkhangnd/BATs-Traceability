CREATE TABLE IF NOT EXISTS actors (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  zalo_user_id text UNIQUE,
  role text NOT NULL,
  organization text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text NOT NULL REFERENCES actors(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_target_idx ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);

ALTER TABLE farm_plot_geometries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
