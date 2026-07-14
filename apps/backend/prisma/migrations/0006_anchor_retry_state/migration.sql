ALTER TABLE "anchors"
  ADD COLUMN "attempt_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "last_error" TEXT,
  ADD COLUMN "next_attempt_at" TIMESTAMP(3);

CREATE INDEX "anchors_status_next_attempt_at_idx"
  ON "anchors"("status", "next_attempt_at");
