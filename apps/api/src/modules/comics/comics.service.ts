import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { Prisma, ComicStatus } from "@truyenkomi/database";
import { toSlug, toUnaccent } from "@/common/utils/text-normalizer";
import { CreateComicDto, UpdateComicDto, CreateGenreDto, UpdateGenreDto } from "./dto/comics.dto";

const cardInclude = {
  categories: { include: { category: true } },
} satisfies Prisma.ComicInclude;

type ComicWithCard = Prisma.ComicGetPayload<{ include: typeof cardInclude }>;

function mapCard(c: ComicWithCard) {
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

@Injectable()
export class ComicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getHomeFeed() {
    return this.redis.cached("home-feed", ["home-feed", "comic-list"], 60, async () => {
      const where: Prisma.ComicWhereInput = {
        chapterCount: { gt: 0 },
        chapters: {
          some: {
            chapterNumber: 1,
          },
        },
      };

      const [hot, latest] = await Promise.all([
        this.prisma.comic.findMany({ where, orderBy: { views: "desc" }, take: 12, include: cardInclude }),
        this.prisma.comic.findMany({ where, orderBy: { updatedAt: "desc" }, take: 12, include: cardInclude }),
      ]);

      return {
        hot: hot.map(mapCard),
        latest: latest.map(mapCard),
      };
    });
  }

  async getBySlug(slug: string) {
    return this.redis.cached(`comic:${slug}`, [`comic-detail-${slug}`, `comic-${slug}`], 300, async () => {
      const comic = await this.prisma.comic.findUnique({
        where: { slug },
        include: {
          ...cardInclude,
          chapters: {
            orderBy: { chapterNumber: "desc" },
            select: { id: true, chapterNumber: true, title: true, views: true, createdAt: true },
          },
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
  }

  async listComics(params: {
    genres?: string[];
    status?: ComicStatus | "";
    sort?: "views" | "rating" | "updated" | "new";
    page?: number;
    perPage?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const perPage = Math.min(48, params.perPage ?? 24);
    const genreKey = (params.genres || []).slice().sort().join(",");
    const statusKey = params.status || "all";
    const sortKey = params.sort || "updated";
    const cacheKey = `comics:list:${genreKey}:${statusKey}:${sortKey}:${page}:${perPage}`;

    return this.redis.cached(cacheKey, ["comic-list"], 60, async () => {
      const where: Prisma.ComicWhereInput = {
        chapterCount: { gt: 0 },
        chapters: {
          some: {
            chapterNumber: 1,
          },
        },
      };

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
        this.prisma.comic.findMany({ where, orderBy, skip: (page - 1) * perPage, take: perPage, include: cardInclude }),
        this.prisma.comic.count({ where }),
      ]);

      return {
        items: items.map(mapCard),
        total,
        page,
        perPage,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      };
    });
  }

  async getRankings(period: "daily" | "weekly" | "monthly") {
    const cacheKey = `ranking:${period}`;
    return this.redis.cached(cacheKey, ["rankings", `ranking-${period}`], 300, async () => {
      const orderBy: Prisma.ComicOrderByWithRelationInput =
        period === "daily" ? { views: "desc" } : period === "weekly" ? { weeklyViews: "desc" } : { monthlyViews: "desc" };

      const items = await this.prisma.comic.findMany({
        where: {
          chapterCount: { gt: 0 },
          chapters: {
            some: {
              chapterNumber: 1,
            },
          },
        },
        orderBy,
        take: 10,
        include: cardInclude,
      });
      return items.map(mapCard);
    });
  }

  async listCategories() {
    return this.redis.cached("categories:all", ["categories"], 600, async () => {
      const categories = await this.prisma.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { comics: true } } },
      });
      return categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        comicCount: c._count.comics,
      }));
    });
  }

  async createComic(dto: CreateComicDto) {
    const slug = dto.slug?.trim() || (await this.uniqueSlug(dto.title));
    const titleUnaccent = toUnaccent(dto.title);

    const comic = await this.prisma.comic.create({
      data: {
        title: dto.title.trim(),
        titleUnaccent,
        slug,
        otherNames: dto.otherNames?.trim() || null,
        author: dto.author?.trim() || null,
        status: dto.status || "ONGOING",
        coverImage: dto.coverImage.trim(),
        bannerImage: dto.bannerImage?.trim() || null,
        description: dto.description?.trim() || null,
        categories: dto.categoryIds?.length
          ? { create: dto.categoryIds.map((cid) => ({ categoryId: cid })) }
          : undefined,
      },
      include: cardInclude,
    });

    await this.redis.invalidateTags("home-feed", "comic-list", "rankings", "categories");
    return mapCard(comic);
  }

  async updateComic(id: string, dto: UpdateComicDto) {
    const existing = await this.prisma.comic.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Truyện không tồn tại");
    }

    const slug = dto.slug?.trim() || (await this.uniqueSlug(dto.title, id));
    const titleUnaccent = toUnaccent(dto.title);

    if (dto.categoryIds) {
      await this.prisma.comicCategory.deleteMany({ where: { comicId: id } });
    }

    const updated = await this.prisma.comic.update({
      where: { id },
      data: {
        title: dto.title.trim(),
        titleUnaccent,
        slug,
        otherNames: dto.otherNames?.trim() || null,
        author: dto.author?.trim() || null,
        status: dto.status || existing.status,
        coverImage: dto.coverImage.trim(),
        bannerImage: dto.bannerImage?.trim() || null,
        description: dto.description?.trim() || null,
        categories: dto.categoryIds?.length
          ? { create: dto.categoryIds.map((cid) => ({ categoryId: cid })) }
          : undefined,
      },
      include: cardInclude,
    });

    await this.redis.invalidateTags("home-feed", "comic-list", "rankings", `comic-${existing.slug}`, `comic-${slug}`);
    return mapCard(updated);
  }

  async deleteComic(id: string) {
    const existing = await this.prisma.comic.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Truyện không tồn tại");
    }

    await this.prisma.comic.delete({ where: { id } });
    await this.redis.invalidateTags("home-feed", "comic-list", "rankings", `comic-${existing.slug}`);
    return { success: true };
  }

  async createCategory(dto: CreateGenreDto) {
    const slug = dto.slug?.trim() || toSlug(dto.name);
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ name: dto.name.trim() }, { slug }] },
    });
    if (existing) {
      throw new ConflictException("Thể loại đã tồn tại");
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
      },
    });

    await this.redis.invalidateTags("categories");
    return category;
  }

  async updateCategory(id: string, dto: UpdateGenreDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Thể loại không tồn tại");
    }

    const slug = dto.slug?.trim() || toSlug(dto.name);
    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
      },
    });

    await this.redis.invalidateTags("categories");
    return updated;
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Thể loại không tồn tại");
    }

    await this.prisma.category.delete({ where: { id } });
    await this.redis.invalidateTags("categories");
    return { success: true };
  }

  async uniqueSlug(title: string, currentId?: string): Promise<string> {
    const base = toSlug(title) || `comic-${Date.now()}`;
    let slug = base;
    let i = 1;
    for (;;) {
      const existing = await this.prisma.comic.findUnique({ where: { slug }, select: { id: true } });
      if (!existing || existing.id === currentId) return slug;
      slug = `${base}-${++i}`;
    }
  }
}
