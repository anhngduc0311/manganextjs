/**
 * TruyenKomi - MangaDex Vietnamese Crawler & Sync Script
 * 
 * Usage:
 *   npx tsx scripts/crawl-mangadex.ts [options]
 *   npm run crawl:mangadex -- [options]
 * 
 * Options:
 *   --limit=<number>     Max number of manga to crawl (default: 10)
 *   --all                Crawl all available Vietnamese manga on MangaDex
 *   --order=<order>      Order: latest (default), created, updated
 *   --quality=<quality>  Quality: original (default), dataSaver
 *   --skip-existing      Skip manga if it already exists with chapters
 *   --resume             Resume from last saved checkpoint (.mangadex-checkpoint.json)
 *   --manga=<id>         Crawl a specific MangaDex Manga UUID
 *   --max-chapters=<num> Limit max chapters per manga (e.g. --max-chapters=5)
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import { prisma } from "../src/lib/prisma";
import {
  mangadexService,
  sleep,
  translateMangaDexGenre,
  type NormalizedManga,
} from "../src/services/mangadex.service";
import { toSlug, toUnaccent } from "../src/lib/text-normalizer";

const CHECKPOINT_FILE = path.join(process.cwd(), ".mangadex-checkpoint.json");

interface CheckpointData {
  lastOffset: number;
  order: string;
  totalSyncedManga: number;
  totalSyncedChapters: number;
  lastRunAt: string;
}

function loadCheckpoint(): CheckpointData {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const raw = fs.readFileSync(CHECKPOINT_FILE, "utf-8");
      return JSON.parse(raw);
    } catch {
      // Fallback
    }
  }
  return {
    lastOffset: 0,
    order: "latest",
    totalSyncedManga: 0,
    totalSyncedChapters: 0,
    lastRunAt: new Date().toISOString(),
  };
}

function saveCheckpoint(data: CheckpointData) {
  try {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("⚠️ Failed to write checkpoint file:", err);
  }
}

// Parse CLI Arguments
const args = process.argv.slice(2);
const getArg = (name: string, fallback = ""): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : fallback;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const isAll = hasFlag("all");
const isResume = hasFlag("resume");
const isSkipExisting = hasFlag("skip-existing");
const targetMangaId = getArg("manga");
const orderArg = (getArg("order", "latest") as "latest" | "created" | "updated");
const qualityArg = (getArg("quality", "original") as "original" | "dataSaver");
const limitArg = isAll ? 99999 : parseInt(getArg("limit", "10"), 10);
const maxChaptersArg = getArg("max-chapters") ? parseInt(getArg("max-chapters"), 10) : undefined;

async function getOrCreateCategories(tags: string[]): Promise<string[]> {
  const categoryIds: string[] = [];
  const seenSlugs = new Set<string>();

  for (const rawTag of tags) {
    if (!rawTag || !rawTag.trim()) continue;
    const vietnameseName = translateMangaDexGenre(rawTag);
    const slug = toSlug(vietnameseName);
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    try {
      const category = await prisma.category.upsert({
        where: { slug },
        create: {
          name: vietnameseName,
          slug,
          description: `Thể loại truyện tranh ${vietnameseName}`,
        },
        update: {
          name: vietnameseName,
        },
        select: { id: true },
      });
      categoryIds.push(category.id);
    } catch (err) {
      console.warn(`[Category] Failed to upsert category "${vietnameseName}":`, err);
    }
  }

  return categoryIds;
}

async function generateUniqueSlug(title: string): Promise<string> {
  let base = toSlug(title);
  if (!base || base.length < 2) {
    base = `comic-${Date.now()}`;
  }
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.comic.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    counter++;
    slug = `${base}-${counter}`;
  }
}

async function syncSingleManga(
  manga: NormalizedManga,
  options: {
    quality: "original" | "dataSaver";
    skipExisting: boolean;
    maxChapters?: number;
  }
): Promise<{ success: boolean; chaptersCount: number; pagesCount: number }> {
  console.log(`\n=============================================================`);
  console.log(`📚 Đang xử lý truyện: "${manga.title}"`);
  console.log(`   MangaDex ID: ${manga.id}`);
  console.log(`   Tác giả: ${manga.author} | Trạng thái: ${manga.status}`);
  console.log(`   Thể loại: ${manga.categories.join(", ") || "N/A"}`);
  console.log(`=============================================================`);

  // 1. Prepare Categories
  const categoryIds = await getOrCreateCategories(manga.categories);

  // 2. Check if comic already exists in DB (by slug or title)
  let comicSlug = toSlug(manga.title);
  let existingComic = await prisma.comic.findUnique({
    where: { slug: comicSlug },
    include: { _count: { select: { chapters: true } } },
  });

  if (!existingComic) {
    // Try finding by unaccented title
    existingComic = await prisma.comic.findFirst({
      where: { titleUnaccent: toUnaccent(manga.title) },
      include: { _count: { select: { chapters: true } } },
    });
  }

  if (existingComic && options.skipExisting && existingComic._count.chapters > 0) {
    console.log(`⏭️ Truyện "${manga.title}" đã tồn tại trong DB (${existingComic._count.chapters} chương). Bỏ qua do --skip-existing.`);
    return { success: true, chaptersCount: existingComic._count.chapters, pagesCount: 0 };
  }

  if (!existingComic) {
    comicSlug = await generateUniqueSlug(manga.title);
  } else {
    comicSlug = existingComic.slug;
  }

  // 3. Upsert Comic Record
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
      categories: {
        create: categoryIds.map((categoryId) => ({ categoryId })),
      },
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

  console.log(`✅ Đã lưu thông tin truyện (ID: ${comic.id})`);

  // 4. Fetch Vietnamese Chapters for this manga
  console.log(`🔍 Đang tải danh sách chương tiếng Việt từ MangaDex...`);
  let chapters = await mangadexService.getVietnameseChapters(manga.id);

  if (chapters.length === 0) {
    console.log(`⚠️ Không tìm thấy chương tiếng Việt nào cho "${manga.title}".`);
    return { success: true, chaptersCount: 0, pagesCount: 0 };
  }

  if (options.maxChapters && options.maxChapters > 0) {
    console.log(`ℹ️ Giới hạn lấy tối đa ${options.maxChapters} chương.`);
    chapters = chapters.slice(0, options.maxChapters);
  }

  console.log(`📖 Tìm thấy ${chapters.length} chương tiếng Việt. Bắt đầu lấy API link ảnh từng trang...`);

  let totalPagesSynced = 0;
  let chaptersSynced = 0;

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const progressStr = `[${i + 1}/${chapters.length}]`;

    try {
      // Check if chapter already exists in DB with pages
      const existingChapter = await prisma.chapter.findUnique({
        where: {
          comicId_chapterNumber: {
            comicId: comic.id,
            chapterNumber: ch.chapterNumber,
          },
        },
        include: { _count: { select: { pages: true } } },
      });

      if (existingChapter && existingChapter._count.pages > 0 && options.skipExisting) {
        console.log(`  ${progressStr} Chương ${ch.chapterNumber}: Đã có ${existingChapter._count.pages} trang. Bỏ qua.`);
        chaptersSynced++;
        totalPagesSynced += existingChapter._count.pages;
        continue;
      }

      // Fetch pages from MangaDex @Home Network
      const atHomeData = await mangadexService.getChapterPages(ch.id, options.quality);
      const pages = atHomeData.pages;

      if (pages.length === 0) {
        console.warn(`  ${progressStr} Chương ${ch.chapterNumber}: Không có trang ảnh nào!`);
        continue;
      }

      // Upsert Chapter & Pages into Database
      await prisma.$transaction(async (tx) => {
        const savedChapter = await tx.chapter.upsert({
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
        return savedChapter;
      });

      console.log(`  ${progressStr} ✅ Chương ${ch.chapterNumber} ("${ch.title}"): Đã lưu ${pages.length} trang ảnh.`);
      chaptersSynced++;
      totalPagesSynced += pages.length;

      // Rate limit cooling pause between chapters
      await sleep(400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ${progressStr} ❌ Lỗi khi lấy chương ${ch.chapterNumber} (MangaDex Chapter ID: ${ch.id}):`, msg);
    }
  }

  // Update comic timestamp
  await prisma.comic.update({
    where: { id: comic.id },
    data: { updatedAt: new Date() },
  });

  console.log(`🎉 Hoàn tất truyện "${manga.title}": ${chaptersSynced}/${chapters.length} chương (${totalPagesSynced} trang).`);
  return { success: true, chaptersCount: chaptersSynced, pagesCount: totalPagesSynced };
}

async function main() {
  console.log("=============================================================");
  console.log("🚀 TRUYENKOMI - MANGADEX VIETNAMESE CRAWLER & SYNC");
  console.log("=============================================================");
  console.log(`Options:`);
  console.log(` - Giới hạn truyện: ${isAll ? "TOÀN BỘ (Tất cả)" : limitArg}`);
  console.log(` - Sắp xếp: ${orderArg} (từ mới nhất)`);
  console.log(` - Chất lượng ảnh: ${qualityArg}`);
  console.log(` - Bỏ qua truyện đã có: ${isSkipExisting ? "Bật" : "Tắt"}`);
  console.log(` - Chế độ Resume: ${isResume ? "Bật" : "Tắt"}`);
  if (maxChaptersArg) console.log(` - Giới hạn số chương / truyện: ${maxChaptersArg}`);
  console.log("=============================================================\n");

  const checkpoint = isResume ? loadCheckpoint() : { lastOffset: 0, order: orderArg, totalSyncedManga: 0, totalSyncedChapters: 0, lastRunAt: new Date().toISOString() };

  let currentOffset = checkpoint.lastOffset || 0;
  let totalProcessed = 0;
  let grandTotalChapters = checkpoint.totalSyncedChapters || 0;
  let grandTotalPages = 0;

  // Single Manga crawl mode
  if (targetMangaId) {
    console.log(`🎯 Đang crawl 1 truyện cụ thể theo MangaDex ID: ${targetMangaId}`);
    try {
      const res = await fetch(`https://api.mangadex.org/manga/${targetMangaId}?includes[]=cover_art&includes[]=author&includes[]=tag`);
      const json = await res.json();
      if (!json.data) throw new Error("Không tìm thấy truyện!");
      const normalized = mangadexService.normalizeManga(json.data);
      await syncSingleManga(normalized, {
        quality: qualityArg,
        skipExisting: isSkipExisting,
        maxChapters: maxChaptersArg,
      });
      console.log("\n✅ Hoàn thành crawl 1 truyện thành công!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("❌ Lỗi khi crawl truyện đơn:", msg);
    }
    await prisma.$disconnect();
    return;
  }

  // Multi / Batch / All Manga crawl mode
  let hasMore = true;

  while (hasMore && totalProcessed < limitArg) {
    const batchLimit = Math.min(20, limitArg - totalProcessed);
    console.log(`\n📥 Đang lấy danh sách truyện tiếng Việt từ MangaDex (Offset: ${currentOffset}, Limit: ${batchLimit})...`);

    try {
      const mangaListRes = await mangadexService.getVietnameseMangaList({
        offset: currentOffset,
        limit: batchLimit,
        order: orderArg,
      });

      const mangaItems = mangaListRes.data;
      const totalAvailable = mangaListRes.total;

      console.log(`📊 Tổng số truyện tiếng Việt có trên MangaDex: ${totalAvailable} truyện.`);
      console.log(`👉 Lô hiện tại: ${mangaItems.length} truyện (từ vị trí ${currentOffset + 1} đến ${currentOffset + mangaItems.length}).`);

      if (mangaItems.length === 0) {
        console.log("✨ Đã quét hết toàn bộ danh sách truyện tiếng Việt trên MangaDex!");
        hasMore = false;
        break;
      }

      for (let idx = 0; idx < mangaItems.length; idx++) {
        if (totalProcessed >= limitArg) break;

        const rawItem = mangaItems[idx];
        const normalized = mangadexService.normalizeManga(rawItem);

        console.log(`\n[Tiến độ: ${totalProcessed + 1}/${limitArg} - Vị trí: ${currentOffset + idx + 1}/${totalAvailable}]`);
        const result = await syncSingleManga(normalized, {
          quality: qualityArg,
          skipExisting: isSkipExisting,
          maxChapters: maxChaptersArg,
        });

        totalProcessed++;
        if (result.success) {
          grandTotalChapters += result.chaptersCount;
          grandTotalPages += result.pagesCount;
        }

        // Save progress checkpoint
        saveCheckpoint({
          lastOffset: currentOffset + idx + 1,
          order: orderArg,
          totalSyncedManga: (checkpoint.totalSyncedManga || 0) + totalProcessed,
          totalSyncedChapters: grandTotalChapters,
          lastRunAt: new Date().toISOString(),
        });

        // Small delay between manga
        await sleep(500);
      }

      currentOffset += mangaItems.length;
      if (currentOffset >= totalAvailable) {
        hasMore = false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Lỗi trong quá trình quét danh sách manga tại offset ${currentOffset}:`, msg);
      console.log("⏳ Đang tạm dừng 5 giây trước khi thử lại...");
      await sleep(5000);
    }
  }

  console.log("\n=============================================================");
  console.log("🎉 TỔNG KẾT QUÁ TRÌNH CRAWL MANGADEX TIẾNG VIỆT");
  console.log("=============================================================");
  console.log(`✅ Số truyện đã xử lý: ${totalProcessed}`);
  console.log(`✅ Tổng số chương đã lưu: ${grandTotalChapters}`);
  console.log(`✅ Tổng số trang ảnh đã lưu: ${grandTotalPages}`);
  console.log(`💾 Checkpoint đã lưu tại: .mangadex-checkpoint.json (Offset: ${currentOffset})`);
  console.log("=============================================================\n");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Fatal Crawler Error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
