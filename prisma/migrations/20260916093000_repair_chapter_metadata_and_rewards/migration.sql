BEGIN;

-- Repair existing installations without changing previously applied migrations.
CREATE INDEX IF NOT EXISTS "comics_title_trgm_idx"
ON "Comic" USING gin ("titleUnaccent" gin_trgm_ops);

UPDATE "Comic" c
SET "chapterCount" = totals.count,
    "latestChapterNumber" = totals.latest
FROM (
  SELECT c2."id", COUNT(ch."id")::integer AS count,
         MAX(ch."chapterNumber") AS latest
  FROM "Comic" c2 LEFT JOIN "Chapter" ch ON ch."comicId" = c2."id"
  GROUP BY c2."id"
) totals
WHERE c."id" = totals."id";

CREATE TABLE "ReadingReward" (
  "userId" TEXT NOT NULL,
  "chapterId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadingReward_pkey" PRIMARY KEY ("userId", "chapterId"),
  CONSTRAINT "ReadingReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReadingReward_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Preserve the known reading history without granting EXP again.
INSERT INTO "ReadingReward" ("userId", "chapterId")
SELECT "userId", "chapterId" FROM "History"
ON CONFLICT DO NOTHING;

COMMIT;
