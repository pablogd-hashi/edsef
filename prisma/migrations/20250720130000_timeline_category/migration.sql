-- Timeline categories for PDF-style yearbook sections
CREATE TYPE "TimelineCategory" AS ENUM ('PARENTS_BEFORE_BIRTH', 'PARENTS_DURING_YEAR', 'VIDEO', 'GENERAL');

ALTER TABLE "TimelineEntry" ADD COLUMN "category" "TimelineCategory" NOT NULL DEFAULT 'GENERAL';

CREATE INDEX "TimelineEntry_yearbookId_category_idx" ON "TimelineEntry"("yearbookId", "category");
