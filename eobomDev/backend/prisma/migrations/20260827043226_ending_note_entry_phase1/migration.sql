-- AlterTable
ALTER TABLE "EndingNote" ADD COLUMN     "sectionState" JSONB;

-- CreateTable
CREATE TABLE "EndingNoteEntry" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT,
    "bodyEnc" TEXT NOT NULL,
    "releaseTiming" TEXT,
    "recipientId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EndingNoteEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EndingNoteEntry_noteId_idx" ON "EndingNoteEntry"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "EndingNoteEntry_noteId_section_key" ON "EndingNoteEntry"("noteId", "section");

-- AddForeignKey
ALTER TABLE "EndingNoteEntry" ADD CONSTRAINT "EndingNoteEntry_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "EndingNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EndingNoteEntry" ADD CONSTRAINT "EndingNoteEntry_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "FamilyDesignation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
