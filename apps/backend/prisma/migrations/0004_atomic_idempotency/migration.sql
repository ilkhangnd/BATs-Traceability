ALTER TABLE idempotency_keys
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

ALTER TABLE idempotency_keys
  ALTER COLUMN response_code DROP NOT NULL,
  ALTER COLUMN response_body DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idempotency_keys_status_created_idx
  ON idempotency_keys(status, created_at);

CREATE SEQUENCE IF NOT EXISTS bats_batch_sequence;
SELECT setval(
  'bats_batch_sequence',
  GREATEST((SELECT count(*)::bigint + 1 FROM batches), 1),
  false
);
