import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toSlug, toUnaccent } from "@/lib/text-normalizer";
import { cacheService } from "@/services/cache.service";
import type { CategoryDTO, ComicCardDTO, ComicDetailDTO, ComicStatus, RankingPeriod } from "@/types";

const cardInclude = {
  categories: { include: { category: true } },
} satisfies Prisma.ComicInclude;

type ComicWithCard = Prisma.ComicGetPayload<{ include: typeof cardInclude }>;

function mapCard(c: ComicWithCard): ComicCardDTO {
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    coverImage: c.coverImage,
    status: c.status,
    views: Number(c.views),
    ratingAvg: c.ratingAvg,
    ratingCount: c.ratingCount,
    chapterCount: c.chapterCount,
    latestChapterNumber: c.latestChapterNumber ?? (c.chapterCount > 0 ? c.chapterCount : null),
    updatedAt: c.updatedAt.toISOString(),
    categories: c.categories.map((gc) => ({ name: gc.category.name, slug: gc.category.slug })),
  };
}

export interface ListComicsParams {
  genres?: string[];
  status?: ComicStatus | "";
  sort?: "views" | "rating" | "updated" | "new";
  page?: number;
  perPage?: number;
}

export const comicService = {
  getHomeFeed: cache(async (): Promise<{ hot: ComicCardDTO[]; latest: ComicCardDTO[] }> => {
    return cacheService.cached("home-feed", ["home-feed", "comic-list"], 60, async () => {
      const [hot, latest] = await Promise.all([
        prisma.comic.findMany({ orderBy: { views: "desc" }, take: 12, include: cardInclude }),
        prisma.comic.findMany({ orderBy: { updatedAt: "desc" }, take: 12, include: cardInclude }),
      ]);
      return { hot: hot.map(mapCard), latest: latest.map(mapCard) };
    });
  }),

  getBySlug: cache(async (slug: string): Promise<ComicDetailDTO | null> => {
    return cacheService.cached(`comic:${slug}`, [`comic-detail-${slug}`, `comic-${slug}`], 300, async () => {
      const comic = await prisma.comic.findUnique({
        where: { slug },
        include: {
          ...cardInclude,
          chapters: { orderBy: { chapterNumber: "desc" }, select: { id: true, chapterNumber: true, title: true, views: true, createdAt: true } },
        },
      });
      if (!comic) return null;
      return {
        ...mapCard(comic),
        otherNames: comic.otherNames,
        author: comic.author,
        bannerImage: comic.bannerImage,
        description: comic.description,
        monthlyViews: Number(comic.monthlyViews),
        weeklyViews: Number(comic.weeklyViews),
        createdAt: comic.createdAt.toISOString(),
        chapters: comic.chapters.map((ch) => ({
          id: ch.id,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          views: Number(ch.views),
          createdAt: ch.createdAt.toISOString(),
        })),
      };
    });
  }),

  listComics: cache(async (params: ListComicsParams): Promise<{ items: ComicCardDTO[]; total: number; page: number; perPage: number; totalPages: number }> => {
    const page = Math.max(1, params.page ?? 1);
    const perPage = Math.min(48, params.perPage ?? 24);
    const genreKey = (params.genres || []).slice().sort().join(",");
    const statusKey = params.status || "all";
    const sortKey = params.sort || "updated";
    const cacheKey = `comics:list:${genreKey}:${statusKey}:${sortKey}:${page}:${perPage}`;

    return cacheService.cached(cacheKey, ["comic-list"], 60, async () => {
      const where: Prisma.ComicWhereInput = {};
      if (params.genres && params.genres.length > 0) {
        where.categories = { some: { category: { slug: { in: params.genres } } } };
      }
      if (params.status) {
        where.status = params.status;
      }

      const orderBy: Prisma.ComicOrderByWithRelationInput =
        params.sort === "views"
          ? { views: "desc" }
          : params.sort === "rating"
            ? { ratingAvg: "desc" }
            : params.sort === "new"
              ? { createdAt: "desc" }
              : { updatedAt: "desc" };

      const [items, total] = await Promise.all([
        prisma.comic.findMany({ where, orderBy, skip: (page - 1) * perPage, take: perPage, include: cardInclude }),
        prisma.comic.count({ where }),
      ]);

      return {
        items: items.map(mapCard),
        total,
        page,
        perPage,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      };
    });
  }),

  getRankings: cache(async (period: RankingPeriod): Promise<ComicCardDTO[]> => {
    const cacheKey = `ranking:${period}`;
    return cacheService.cached(cacheKey, ["rankings", `ranking-${period}`], 300, async () => {
      const orderBy: Prisma.ComicOrderByWithRelationInput =
        period === "daily" ? { views: "desc" } : period === "weekly" ? { weeklyViews: "desc" } : { monthlyViews: "desc" };

      const items = await prisma.comic.findMany({ orderBy, take: 10, include: cardInclude });
      return items.map(mapCard);
    });
  }),

  listCategories: cache(async (): Promise<CategoryDTO[]> => {
    return cacheService.cached("categories:all", ["categories"], 600, async () => {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { comics: true } } },
      });
      return categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, comicCount: c._count.comics }));
    });
  }),

  async uniqueSlug(title: string, currentId?: string): Promise<string> {
    const base = toSlug(title) || `comic-${Date.now()}`;
    let slug = base;
    let i = 1;
    for (;;) {
      const existing = await prisma.comic.findUnique({ where: { slug }, select: { id: true } });
      if (!existing || existing.id === currentId) return slug;
      slug = `${base}-${++i}`;
    }
  },

  normalizeTitle(title: string): string {
    return toUnaccent(title);
  },
};
