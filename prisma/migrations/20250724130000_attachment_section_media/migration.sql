-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN "parentNoteId" TEXT;
ALTER TABLE "Attachment" ADD COLUMN "sectionType" "SectionType";

-- CreateIndex
CREATE INDEX "Attachment_parentNoteId_idx" ON "Attachment"("parentNoteId");
CREATE INDEX "Attachment_yearbookId_sectionType_idx" ON "Attachment"("yearbookId", "sectionType");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_parentNoteId_fkey" FOREIGN KEY ("parentNoteId") REFERENCES "ParentNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
