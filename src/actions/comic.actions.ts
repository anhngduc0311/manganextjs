"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/text-normalizer";
import { comicService } from "@/services/comic.service";
import { gamificationService } from "@/services/gamification.service";
import { EXP_PER_RATING } from "@/lib/leveling";
import { checkRateLimit, writeLimiter } from "@/lib/rate-limiter";
import { chapterUpsertSchema, comicUpsertSchema, genreUpsertSchema, ratingSchema } from "@/types/schemas";
import type { ActionResult } from "@/types";

async function requireRole(roles: Array<"USER" | "MODERATOR" | "ADMIN">): Promise<
  | { ok: false; error: string }
  | { ok: true; userId: string; role: "USER" | "MODERATOR" | "ADMIN" }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Bạn cần đăng nhập" };
  if (!roles.includes(session.user.role)) return { ok: false, error: "Không có quyền thực hiện" };
  return { ok: true, userId: session.user.id, role: session.user.role };
}

export async function followComicAction(comicId: string): Promise<ActionResult<{ following: boolean }>> {
  const authz = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };

  const existing = await prisma.follow.findUnique({
    where: { userId_comicId: { userId: authz.userId, comicId } },
  });
  if (existing) {
    await prisma.follow.delete({ where: { userId_comicId: { userId: authz.userId, comicId } } });
    return { ok: true, data: { following: false } };
  }
  await prisma.follow.create({ data: { userId: authz.userId, comicId } });
  return { ok: true, data: { following: true } };
}

export async function rateComicAction(comicId: string, score: number): Promise<ActionResult<{ ratingAvg: number; ratingCount: number }>> {
  const authz = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };


  const limit = await checkRateLimit(writeLimiter, `rate:${authz.userId}`);
  if (!limit.success) return { ok: false, error: `Thao tác quá nhanh, thử lại sau ${limit.retryAfter}s` };

  const parsed = ratingSchema.safeParse({ comicId, score });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const result = await prisma.$transaction(async (tx) => {
    await tx.comicRating.upsert({
      where: { userId_comicId: { userId: authz.userId, comicId } },
      create: { userId: authz.userId, comicId, score: parsed.data.score },
      update: { score: parsed.data.score },
    });
    const agg = await tx.comicRating.aggregate({
      where: { comicId },
      _avg: { score: true },
      _count: { score: true },
    });
    return tx.comic.update({
      where: { id: comicId },
      data: { ratingAvg: agg._avg.score ?? 0, ratingCount: agg._count.score },
      select: { slug: true, ratingAvg: true, ratingCount: true },
    });
  });

  await gamificationService.awardExp(authz.userId, EXP_PER_RATING).catch(() => {});
  revalidateTag(`comic-detail-${result.slug}`);
  return { ok: true, data: { ratingAvg: result.ratingAvg, ratingCount: result.ratingCount } };
}

export async function upsertComicAction(_prev: ActionResult<{ id: string; slug: string }> | null, formData: FormData): Promise<ActionResult<{ id: string; slug: string }>> {
  const authz = await requireRole(["MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };

  const parsed = comicUpsertSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    otherNames: formData.get("otherNames") || undefined,
    author: formData.get("author") || undefined,
    status: formData.get("status") || undefined,
    coverImage: formData.get("coverImage"),
    bannerImage: formData.get("bannerImage") || undefined,
    description: formData.get("description") || undefined,
    categoryIds: formData.getAll("categoryIds"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const data = parsed.data;
  const slug = data.slug || (await comicService.uniqueSlug(data.title, data.id));

  const comic = await prisma.comic.upsert({
    where: { id: data.id ?? "00000000-0000-0000-0000-000000000000" },
    create: {
      title: data.title,
      titleUnaccent: comicService.normalizeTitle(data.title),
      slug,
      otherNames: data.otherNames || null,
      author: data.author || null,
      status: data.status,
      coverImage: data.coverImage,
      bannerImage: data.bannerImage || null,
      description: data.description || null,
      categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) },
    },
    update: {
      title: data.title,
      titleUnaccent: comicService.normalizeTitle(data.title),
      slug,
      otherNames: data.otherNames || null,
      author: data.author || null,
      status: data.status,
      coverImage: data.coverImage,
      bannerImage: data.bannerImage || null,
      description: data.description || null,
      categories: {
        deleteMany: {},
        create: data.categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
    select: { id: true, slug: true },
  });

  revalidateTag(`comic-detail-${comic.slug}`);
  revalidateTag("comic-list");
  revalidateTag("home-feed");
  revalidatePath("/admin/comics");
  return { ok: true, data: comic };
}

export async function deleteComicAction(comicId: string): Promise<ActionResult> {
  const authz = await requireRole(["ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };
  const comic = await prisma.comic.delete({ where: { id: comicId }, select: { slug: true } });
  revalidateTag("comic-list");
  revalidateTag("home-feed");
  revalidatePath("/admin/comics");
  void comic;
  return { ok: true };
}

export async function upsertChapterAction(_prev: ActionResult<{ id: string }> | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const authz = await requireRole(["MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };

  let pages: Array<{ pageIndex: number; imageUrl: string }> = [];
  try {
    pages = JSON.parse(String(formData.get("pages") ?? "[]"));
  } catch {
    return { ok: false, error: "Danh sách trang ảnh không hợp lệ" };
  }

  const parsed = chapterUpsertSchema.safeParse({
    id: formData.get("id") || undefined,
    comicId: formData.get("comicId"),
    chapterNumber: formData.get("chapterNumber"),
    title: formData.get("title") || undefined,
    pages,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const data = parsed.data;
  const pagesOrdered = [...data.pages].sort((a, b) => a.pageIndex - b.pageIndex).map((p, i) => ({ pageIndex: i, imageUrl: p.imageUrl }));

  const chapter = await prisma.$transaction(async (tx) => {
    const upserted = await tx.chapter.upsert({
      where: { comicId_chapterNumber: { comicId: data.comicId, chapterNumber: data.chapterNumber } },
      create: {
        comicId: data.comicId,
        chapterNumber: data.chapterNumber,
        title: data.title || null,
        pages: { create: pagesOrdered },
      },
      update: {
        title: data.title || null,
        pages: { deleteMany: {}, create: pagesOrdered },
      },
      select: { id: true, comicId: true },
    });
    const chapterCount = await tx.chapter.count({ where: { comicId: data.comicId } });
    const latest = await tx.chapter.findFirst({
      where: { comicId: data.comicId },
      orderBy: { chapterNumber: "desc" },
      select: { chapterNumber: true },
    });

    await tx.comic.update({
      where: { id: data.comicId },
      data: {
        updatedAt: new Date(),
        chapterCount,
        latestChapterNumber: latest?.chapterNumber ?? data.chapterNumber,
      },
    });
    return upserted;
  });

  const comic = await prisma.comic.findUnique({ where: { id: data.comicId }, select: { slug: true } });
  if (comic) {
    revalidateTag(`comic-detail-${comic.slug}`);
    revalidateTag("home-feed");
    revalidateTag("comic-list");
  }
  revalidatePath("/admin/chapters");
  return { ok: true, data: { id: chapter.id } };
}

export async function deleteChapterAction(chapterId: string): Promise<ActionResult> {
  const authz = await requireRole(["MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };

  const chapter = await prisma.$transaction(async (tx) => {
    const ch = await tx.chapter.delete({
      where: { id: chapterId },
      select: { comicId: true, comic: { select: { slug: true } } },
    });

    const chapterCount = await tx.chapter.count({ where: { comicId: ch.comicId } });
    const latest = await tx.chapter.findFirst({
      where: { comicId: ch.comicId },
      orderBy: { chapterNumber: "desc" },
      select: { chapterNumber: true },
    });

    await tx.comic.update({
      where: { id: ch.comicId },
      data: {
        chapterCount,
        latestChapterNumber: latest?.chapterNumber ?? null,
      },
    });

    return ch;
  });

  if (chapter.comic) {
    revalidateTag(`comic-detail-${chapter.comic.slug}`);
    revalidateTag("home-feed");
    revalidateTag("comic-list");
  }
  revalidatePath("/admin/chapters");
  return { ok: true };
}

export async function upsertGenreAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const authz = await requireRole(["MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };

  const parsed = genreUpsertSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const data = parsed.data;
  const slug = data.slug || toSlug(data.name);

  const exists = await prisma.category.findFirst({
    where: { OR: [{ name: data.name }, { slug }], NOT: data.id ? { id: data.id } : undefined },
    select: { id: true },
  });
  if (exists) return { ok: false, error: "Tên hoặc slug thể loại đã tồn tại" };

  await prisma.category.upsert({
    where: { id: data.id ?? "00000000-0000-0000-0000-000000000000" },
    create: { name: data.name, slug, description: data.description || null },
    update: { name: data.name, slug, description: data.description || null },
  });

  revalidateTag("categories");
  revalidatePath("/admin/genres");
  return { ok: true };
}

export async function deleteGenreAction(genreId: string): Promise<ActionResult> {
  const authz = await requireRole(["ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };
  await prisma.category.delete({ where: { id: genreId } });
  revalidateTag("categories");
  revalidatePath("/admin/genres");
  return { ok: true };
}

export async function scanMangaDexUpdatesAction(limit = 20): Promise<ActionResult<{ scannedCount: number; updatedCount: number; newChaptersCount: number }>> {
  const authz = await requireRole(["MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };

  try {
    const { mangadexService, translateMangaDexGenre, sleep } = await import("@/services/mangadex.service");
    const { toUnaccent } = await import("@/lib/text-normalizer");
    const { notificationService } = await import("@/services/notification.service");
    const { cacheService } = await import("@/services/cache.service");

    const mangaRes = await mangadexService.getVietnameseMangaList({
      offset: 0,
      limit: Math.min(50, Math.max(1, limit)),
      order: "latest",
    });

    const mangaList = mangaRes.data;
    let totalUpdatedComics = 0;
    let totalNewChapters = 0;

    for (const rawItem of mangaList) {
      const manga = mangadexService.normalizeManga(rawItem);

      // Categories
      const categoryIds: string[] = [];
      const seenSlugs = new Set<string>();

      for (const rawTag of manga.categories) {
        if (!rawTag || !rawTag.trim()) continue;
        const vietnameseName = translateMangaDexGenre(rawTag);
        const slug = toSlug(vietnameseName);
        if (!slug || seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);

        try {
          const category = await prisma.category.upsert({
            where: { slug },
            create: { name: vietnameseName, slug, description: `Thể loại truyện tranh ${vietnameseName}` },
            update: { name: vietnameseName },
            select: { id: true },
          });
          categoryIds.push(category.id);
        } catch {}
      }

      // Find or create Comic
      let comicSlug = toSlug(manga.title);
      let existingComic = await prisma.comic.findUnique({
        where: { slug: comicSlug },
        select: { id: true, slug: true, title: true },
      });

      if (!existingComic) {
        existingComic = await prisma.comic.findFirst({
          where: { titleUnaccent: toUnaccent(manga.title) },
          select: { id: true, slug: true, title: true },
        });
      }

      if (!existingComic) {
        comicSlug = `${toSlug(manga.title)}-${Date.now().toString().slice(-4)}`;
      } else {
        comicSlug = existingComic.slug;
      }

      const comic = await prisma.comic.upsert({
        where: { slug: comicSlug },
        create: {
          title: manga.title,
          titleUnaccent: toUnaccent(manga.title),
          slug: comicSlug,
          otherNames: manga.otherNames || null,
          author: manga.author || null,
          status: manga.status,
          coverImage: manga.coverUrl,
          description: manga.description || `Đọc truyện ${manga.title} bản dịch tiếng Việt mới nhất online tại TruyenKomi.`,
          categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
        },
        update: {
          title: manga.title,
          titleUnaccent: toUnaccent(manga.title),
          otherNames: manga.otherNames || null,
          author: manga.author || null,
          status: manga.status,
          coverImage: manga.coverUrl,
          description: manga.description || undefined,
          updatedAt: new Date(),
          categories: {
            deleteMany: {},
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
        select: { id: true, slug: true, title: true },
      });

      const chapters = await mangadexService.getVietnameseChapters(manga.id);
      if (chapters.length === 0) continue;

      const existingChapters = await prisma.chapter.findMany({
        where: { comicId: comic.id },
        select: { chapterNumber: true, _count: { select: { pages: true } } },
      });

      const existingPagesMap = new Map<number, number>();
      for (const ech of existingChapters) {
        existingPagesMap.set(ech.chapterNumber, ech._count.pages);
      }

      const missingChapters = chapters.filter((ch) => {
        const pCount = existingPagesMap.get(ch.chapterNumber);
        return pCount === undefined || pCount === 0;
      });

      if (missingChapters.length === 0) continue;

      let newlySyncedCount = 0;

      for (const ch of missingChapters) {
        try {
          const atHomeData = await mangadexService.getChapterPages(ch.id, "original");
          const pages = atHomeData.pages;
          if (pages.length === 0) continue;

          await prisma.$transaction(async (tx) => {
            await tx.chapter.upsert({
              where: {
                comicId_chapterNumber: {
                  comicId: comic.id,
                  chapterNumber: ch.chapterNumber,
                },
              },
              create: {
                comicId: comic.id,
                chapterNumber: ch.chapterNumber,
                title: ch.title || `Chương ${ch.chapterNumber}`,
                views: BigInt(Math.floor(Math.random() * 200) + 10),
                pages: {
                  create: pages.map((p) => ({
                    pageIndex: p.pageIndex,
                    imageUrl: p.imageUrl,
                  })),
                },
              },
              update: {
                title: ch.title || `Chương ${ch.chapterNumber}`,
                pages: {
                  deleteMany: {},
                  create: pages.map((p) => ({
                    pageIndex: p.pageIndex,
                    imageUrl: p.imageUrl,
                  })),
                },
              },
            });
          });

          newlySyncedCount++;
          await sleep(350);
        } catch (err) {
          console.warn(`[scanMangaDexUpdatesAction] Lỗi chương ${ch.chapterNumber}:`, err);
        }
      }

      if (newlySyncedCount > 0) {
        totalUpdatedComics++;
        totalNewChapters += newlySyncedCount;

        const chapterCount = await prisma.chapter.count({ where: { comicId: comic.id } });
        const latest = await prisma.chapter.findFirst({
          where: { comicId: comic.id },
          orderBy: { chapterNumber: "desc" },
          select: { chapterNumber: true },
        });

        await prisma.comic.update({
          where: { id: comic.id },
          data: {
            updatedAt: new Date(),
            chapterCount,
            latestChapterNumber: latest?.chapterNumber ?? null,
          },
        });

        try {
          await notificationService.notifyFollowers(comic.id, {
            title: `Chương mới: ${comic.title}`,
            message: `Chương ${latest?.chapterNumber} vừa được cập nhật. Đọc ngay!`,
            linkUrl: `/comics/${comic.slug}/chuong-${latest?.chapterNumber}`,
          });
        } catch {}

        try {
          await Promise.allSettled([
            cacheService.del(`comic:${comic.slug}`, `comic:${comic.id}:chapters`, "home-feed"),
            cacheService.scanDelete(`chapter:*`),
            cacheService.scanDelete("comics:list:*"),
          ]);
        } catch {}
      }
    }

    revalidateTag("home-feed");
    revalidateTag("comic-list");
    revalidatePath("/admin/comics");
    revalidatePath("/admin/chapters");

    return {
      ok: true,
      data: {
        scannedCount: mangaList.length,
        updatedCount: totalUpdatedComics,
        newChaptersCount: totalNewChapters,
      },
    };
  } catch (err: any) {
    console.error("[scanMangaDexUpdatesAction Error]:", err);
    return { ok: false, error: err.message || "Lỗi khi quét cập nhật truyện" };
  }
}

