-- Dedupe lookups by file checksum.
CREATE INDEX IF NOT EXISTS "MediaAsset_checksum_idx" ON "MediaAsset"("checksum");

-- One live yearbook per child per life-year (inbox and dashboard could race).
-- Skipped with a notice if an existing database already has duplicates to merge by hand.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Yearbook"
    WHERE "deletedAt" IS NULL AND "yearNumber" IS NOT NULL
    GROUP BY "childId", "yearNumber" HAVING count(*) > 1
  ) THEN
    RAISE NOTICE 'Duplicate yearbooks found; unique index Yearbook_child_year_live_key not created';
  ELSE
    CREATE UNIQUE INDEX "Yearbook_child_year_live_key"
      ON "Yearbook"("childId", "yearNumber")
      WHERE "deletedAt" IS NULL AND "yearNumber" IS NOT NULL;
  END IF;
END $$;
