import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mangadexService, translateMangaDexGenre, sleep } from "@/services/mangadex.service";
import { toSlug, toUnaccent } from "@/lib/text-normalizer";
import { notificationService } from "@/services/notification.service";
import { cacheService } from "@/services/cache.service";

export async function POST(req: NextRequest) {
  // 1. Check Authorization (Bearer Token OR Admin Session)
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRAWLER_SECRET_KEY || "dev-crawler-secret";
  let isAuthorized = false;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token === secret) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    const session = await auth();
    if (session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR") {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { ok: false, error: "Không có quyền thực hiện. Yêu cầu Bearer Secret hoặc quyền Quản trị viên." },
      { status: 401 }
    );
  }

  // 2. Parse Options
  let body: { limit?: number; quality?: "original" | "dataSaver" } = {};
  try {
    body = await req.json();
  } catch {
    // Body optional
  }

  const scanLimit = Math.min(50, Math.max(1, body.limit || 20));
  const quality = body.quality === "dataSaver" ? "dataSaver" : "original";

  try {
    // 3. Fetch latest updated manga from MangaDex
    const mangaRes = await mangadexService.getVietnameseMangaList({
      offset: 0,
      limit: scanLimit,
      order: "latest",
    });

    const mangaList = mangaRes.data;
    const results: Array<{ title: string; slug: string; newChaptersCount: number; pagesCount: number }> = [];
    let totalNewChapters = 0;
    let totalNewPages = 0;

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

      // Get chapters
      const chapters = await mangadexService.getVietnameseChapters(manga.id);
      if (chapters.length === 0) continue;

      // Existing chapters map
      const existingChapters = await prisma.chapter.findMany({
        where: { comicId: comic.id },
        select: { chapterNumber: true, _count: { select: { pages: true } } },
      });

      const existingPagesMap = new Map<number, number>();
      for (const ech of existingChapters) {
        existingPagesMap.set(ech.chapterNumber, ech._count.pages);
      }

      // Filter only new chapters
      const missingChapters = chapters.filter((ch) => {
        const pCount = existingPagesMap.get(ch.chapterNumber);
        return pCount === undefined || pCount === 0;
      });

      if (missingChapters.length === 0) {
        continue; // No new chapters -> skip instantly
      }

      let newlySyncedPages = 0;
      let newlySyncedCount = 0;

      for (const ch of missingChapters) {
        try {
          const atHomeData = await mangadexService.getChapterPages(ch.id, quality);
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
          newlySyncedPages += pages.length;
          await sleep(350);
        } catch (err) {
          console.warn(`[Scan Updates API] Lỗi nạp chương ${ch.chapterNumber}:`, err);
        }
      }

      if (newlySyncedCount > 0) {
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

        // Notify followers
        try {
          await notificationService.notifyFollowers(comic.id, {
            title: `Chương mới: ${comic.title}`,
            message: `Chương ${latest?.chapterNumber} vừa được cập nhật. Đọc ngay!`,
            linkUrl: `/comics/${comic.slug}/chuong-${latest?.chapterNumber}`,
          });
        } catch {}

        // Invalidate cache
        try {
          await Promise.allSettled([
            cacheService.del(`comic:${comic.slug}`, `comic:${comic.id}:chapters`, "home-feed"),
            cacheService.scanDelete(`chapter:*`),
            cacheService.scanDelete("comics:list:*"),
          ]);
        } catch {}

        // Meilisearch index
        try {
          const { meiliService } = await import("@/lib/meilisearch");
          await meiliService.indexComics([
            {
              id: comic.id,
              title: manga.title,
              titleUnaccent: toUnaccent(manga.title),
              slug: comic.slug,
              otherNames: manga.otherNames,
              author: manga.author,
              status: manga.status,
              coverImage: manga.coverUrl,
              views: 0,
              ratingAvg: 5.0,
              ratingCount: 1,
              chapterCount: existingChapters.length + newlySyncedCount,
              categories: manga.categories.map((c) => translateMangaDexGenre(c)),
              updatedAt: new Date().toISOString(),
              createdAt: manga.createdAt || new Date().toISOString(),
            },
          ]);
        } catch {}

        totalNewChapters += newlySyncedCount;
        totalNewPages += newlySyncedPages;
        results.push({
          title: manga.title,
          slug: comic.slug,
          newChaptersCount: newlySyncedCount,
          pagesCount: newlySyncedPages,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      scannedCount: mangaList.length,
      updatedCount: results.length,
      newChaptersCount: totalNewChapters,
      totalPagesCount: totalNewPages,
      updatedComics: results,
      message: `Đã quét ${mangaList.length} truyện từ MangaDex: Phát hiện và nạp ${totalNewChapters} chương mới cho ${results.length} bộ truyện!`,
    });
  } catch (error) {
    console.error("[Scan Updates Error]:", error);
    return NextResponse.json(
      { ok: false, error: (error instanceof Error ? error.message : "Lỗi khi quét cập nhật từ MangaDex") },
      { status: 500 }
    );
  }
}
