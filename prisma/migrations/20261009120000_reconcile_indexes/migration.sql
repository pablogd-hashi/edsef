-- Schema declared this index but no migration created it.
CREATE INDEX IF NOT EXISTS "Attachment_storyId_idx" ON "Attachment"("storyId");
