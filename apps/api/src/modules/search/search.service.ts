import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { Prisma } from "@truyenkomi/database";
import { toUnaccent } from "@/common/utils/text-normalizer";

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

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private meiliClient: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    const host = this.config.get<string>("MEILISEARCH_HOST");
    const apiKey = this.config.get<string>("MEILISEARCH_ADMIN_KEY") || this.config.get<string>("MEILISEARCH_MASTER_KEY");
    if (host && apiKey) {
      try {
        const { MeiliSearch } = require("meilisearch");
        this.meiliClient = new MeiliSearch({ host, apiKey });
      } catch (err) {
        this.logger.warn(`Failed to initialize Meilisearch client: ${(err as Error).message}`);
      }
    }
  }

  async searchComics(query: string, limit = 24, offset = 0) {
    const trimmed = query.trim();
    if (trimmed.length === 0) return { items: [], total: 0 };
    const normalized = toUnaccent(trimmed);
    const cacheKey = `search:${normalized}:${limit}:${offset}`;

    return this.redis.cached(cacheKey, ["search", "comic-list"], 300, async () => {
      // 1. Try Meilisearch first if configured
      if (this.meiliClient) {
        try {
          const index = this.meiliClient.index("comics");
          const meiliRes = await index.search(trimmed, { limit, offset });
          if (meiliRes && meiliRes.hits.length > 0) {
            const items = meiliRes.hits.map((h: any) => ({
              id: h.id,
              title: h.title,
              slug: h.slug,
              coverImage: h.coverImage,
              status: h.status,
              views: Number(h.views || 0),
              ratingAvg: Number(h.ratingAvg || 0),
              ratingCount: Number(h.ratingCount || 0),
              chapterCount: Number(h.chapterCount || 0),
              updatedAt: h.updatedAt || new Date().toISOString(),
              categories: (h.categories || []).map((catName: string) => ({
                name: catName,
                slug: toUnaccent(catName),
              })),
            }));
            return { items, total: meiliRes.estimatedTotalHits || items.length };
          }
        } catch (err) {
          this.logger.warn(`Meilisearch query failed: ${(err as Error).message}, falling back to PostgreSQL`);
        }
      }

      // 2. Fallback to PostgreSQL pg_trgm / ILIKE query
      const like = `%${normalized}%`;
      const rawLike = `%${trimmed.toLowerCase()}%`;

      const [rows, countRows] = await Promise.all([
        this.prisma.$queryRaw<RawSearchRow[]>(Prisma.sql`
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
        `),
        this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
          SELECT COUNT(*) as count
          FROM "Comic" c
          WHERE c."titleUnaccent" % ${normalized}
             OR c."titleUnaccent" ILIKE ${like}
             OR LOWER(c."title") ILIKE ${rawLike}
        `),
      ]);

      const items = rows.map((row) => ({
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
      }));

      const total = Number(countRows[0]?.count ?? items.length);
      return { items, total };
    });
  }

  async quickSuggest(query: string, limit = 5) {
    const res = await this.searchComics(query, limit, 0);
    return res.items;
  }
}
