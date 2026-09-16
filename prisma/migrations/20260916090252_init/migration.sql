-- DropIndex
DROP INDEX "comics_title_trgm_idx";

-- AlterTable
ALTER TABLE "Comic" ADD COLUMN     "chapterCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "latestChapterNumber" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Comic_updatedAt_idx" ON "Comic"("updatedAt" DESC);
