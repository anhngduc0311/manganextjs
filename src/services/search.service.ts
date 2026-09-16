import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toUnaccent } from "@/lib/text-normalizer";
import { logger } from "@/lib/logger";
import type { ComicCardDTO } from "@/types";

interface RawSearchRow {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  status: "ONGOING" | "COMPLETED" | "DROPPED";
  views: bigint | number;
  ratingAvg: number;
  ratingCount: number;
  chapterCount: number;
  updatedAt: Date;
  score: number;
}

function mapRow(row: RawSearchRow): ComicCardDTO & { score: number } {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    coverImage: row.coverImage,
    status: row.status,
    views: Number(row.views),
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
    chapterCount: Number(row.chapterCount),
    updatedAt: row.updatedAt.toISOString(),
    categories: [],
    score: Number(row.score ?? 0),
  };
}

export const searchService = {
  async searchComics(query: string, limit = 24, offset = 0): Promise<ComicCardDTO[]> {
    const trimmed = query.trim();
    if (trimmed.length === 0) return [];
    const normalized = toUnaccent(trimmed);
    const like = `%${normalized}%`;
    const rawLike = `%${trimmed.toLowerCase()}%`;
    const started = Date.now();

    const rows = await prisma.$queryRaw<RawSearchRow[]>(Prisma.sql`
      SELECT c."id", c."title", c."slug", c."coverImage", c."status", c."views", c."ratingAvg", c."ratingCount",
             c."updatedAt", COUNT(ch."id")::int AS "chapterCount",
             similarity(c."titleUnaccent", ${normalized}) AS "score"
      FROM "Comic" c
      LEFT JOIN "Chapter" ch ON ch."comicId" = c."id"
      WHERE c."titleUnaccent" % ${normalized}
         OR c."titleUnaccent" ILIKE ${like}
         OR LOWER(c."title") ILIKE ${rawLike}
      GROUP BY c."id", "score"
      ORDER BY "score" DESC, c."views" DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    logger.debug({ took: Date.now() - started, query: trimmed, results: rows.length }, "search timing");
    return rows.map(mapRow);
  },

  async quickSuggest(query: string, limit = 5): Promise<ComicCardDTO[]> {
    return this.searchComics(query, limit, 0);
  },

  async totalMatches(query: string): Promise<number> {
    const trimmed = query.trim();
    if (trimmed.length === 0) return 0;
    const normalized = toUnaccent(trimmed);
    const like = `%${normalized}%`;
    const rawLike = `%${trimmed.toLowerCase()}%`;
    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*) as count
      FROM "Comic" c
      WHERE c."titleUnaccent" % ${normalized}
         OR c."titleUnaccent" ILIKE ${like}
         OR LOWER(c."title") ILIKE ${rawLike}
    `);
    return Number(rows[0]?.count ?? 0);
  },
};
