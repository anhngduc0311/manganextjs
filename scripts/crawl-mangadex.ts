/**
 * TruyenKomi - MangaDex Vietnamese Crawler & Sync Script
 * 
 * Usage:
 *   npx tsx scripts/crawl-mangadex.ts [options]
 *   npm run crawl:mangadex -- [options]
 * 
 * Options:
 *   --mode=<mode>        Mode: hybrid (default in daemon), updates (only new updates), backlog (checkpoint sync)
 *   --updates-limit=<num> Max number of updated manga to check in updates mode (default: 20)
 *   --limit=<number>     Max number of manga to crawl for backlog (default: 20)
 *   --all                Crawl all available Vietnamese manga on MangaDex
 *   --order=<order>      Order: latest (default), created, updated
 *   --quality=<quality>  Quality: original (default), dataSaver
 *   --skip-existing      Skip manga if it already exists with chapters
 *   --force              Force re-download all chapters & pages even if they exist
 *   --resume             Resume from last saved checkpoint (.mangadex-checkpoint.json)
 *   --manga=<id>         Crawl a specific MangaDex Manga UUID
 *   --max-chapters=<num> Limit max chapters per manga (e.g. --max-chapters=5)
 *   --continuous         Run continuously as a background daemon
 *   --interval=<minutes> Interval in minutes between crawl cycles (default: 10)
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import { prisma } from "../src/lib/prisma";
import { mangadexService, sleep, translateMangaDexGenre, type NormalizedManga } from "../src/services/mangadex.service";
import { toSlug, toUnaccent } from "../src/lib/text-normalizer";

const CHECKPOINT_FILE = process.env.CHECKPOINT_FILE || path.join(process.cwd(), ".mangadex-checkpoint.json");

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
    const dir = path.dirname(CHECKPOINT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("⚠️ Failed to write checkpoint file:", err);
  }
}

// Parse CLI Arguments & Environment Variables
const args = process.argv.slice(2);
const getArg = (name: string, fallback = ""): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : fallback;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const isContinuous = hasFlag("continuous") || process.env.CRAWLER_CONTINUOUS === "true";
const intervalMinutes = parseInt(getArg("interval", process.env.CRAWLER_INTERVAL_MINUTES || "10"), 10);
const modeArg = getArg("mode", process.env.CRAWLER_MODE || (isContinuous ? "hybrid" : "backlog")) as "updates" | "backlog" | "hybrid";
const updatesLimitArg = parseInt(getArg("updates-limit", process.env.CRAWLER_UPDATES_LIMIT || "20"), 10);
const isAll = hasFlag("all") || process.env.CRAWLER_ALL === "true";
const isResume = hasFlag("resume") || process.env.CRAWLER_RESUME === "true" || isContinuous;
const isSkipExisting = hasFlag("skip-existing") || process.env.CRAWLER_SKIP_EXISTING === "true";
const isForce = hasFlag("force") || process.env.CRAWLER_FORCE === "true";
const targetMangaId = getArg("manga", process.env.CRAWLER_MANGA_ID || "");
const orderArg = (getArg("order", process.env.CRAWLER_ORDER || "latest") as "latest" | "created" | "updated");
const qualityArg = (getArg("quality", process.env.CRAWLER_QUALITY || "original") as "original" | "dataSaver");
const limitArg = isAll ? 99999 : parseInt(getArg("limit", process.env.CRAWLER_LIMIT || "20"), 10);
const maxChaptersArg = getArg("max-chapters", process.env.CRAWLER_MAX_CHAPTERS || "")
  ? parseInt(getArg("max-chapters", process.env.CRAWLER_MAX_CHAPTERS || ""), 10)
  : undefined;

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
    force?: boolean;
    maxChapters?: number;
  }
): Promise<{ success: boolean; chaptersCount: number; pagesCount: number; newChaptersCount?: number }> {
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

  if (existingComic && options.skipExisting && existingComic._count.chapters > 0 && !options.force) {
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

  // 5. Pre-fetch existing chapters for this comic to avoid re-crawling
  const existingChapters = await prisma.chapter.findMany({
    where: { comicId: comic.id },
    select: {
      chapterNumber: true,
      _count: { select: { pages: true } },
    },
  });

  const existingPagesMap = new Map<number, number>();
  for (const ech of existingChapters) {
    existingPagesMap.set(ech.chapterNumber, ech._count.pages);
  }

  // Check if all chapters already exist with pages
  const missingOrEmptyChapters = chapters.filter((ch) => {
    if (options.force) return true;
    const pageCount = existingPagesMap.get(ch.chapterNumber);
    return pageCount === undefined || pageCount === 0;
  });

  if (missingOrEmptyChapters.length === 0 && !options.force) {
    console.log(`⚡ Toàn bộ ${chapters.length} chương của truyện "${manga.title}" đã có trong DB với đầy đủ trang ảnh. Bỏ qua cào lại.`);
    const totalExistingPages = existingChapters.reduce((sum, c) => sum + c._count.pages, 0);
    return { success: true, chaptersCount: existingChapters.length, pagesCount: totalExistingPages };
  }

  console.log(`📖 Tìm thấy ${chapters.length} chương (${missingOrEmptyChapters.length} chương mới cần tải ảnh). Bắt đầu xử lý...`);

  let totalPagesSynced = 0;
  let chaptersSynced = 0;
  let newlySyncedCount = 0;

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const progressStr = `[${i + 1}/${chapters.length}]`;
    const existingPageCount = existingPagesMap.get(ch.chapterNumber);

    // Skip if chapter already exists in DB with pages
    if (existingPageCount !== undefined && existingPageCount > 0 && !options.force) {
      console.log(`  ${progressStr} ⏩ Chương ${ch.chapterNumber}: Đã có ${existingPageCount} trang trong DB. Bỏ qua.`);
      chaptersSynced++;
      totalPagesSynced += existingPageCount;
      continue;
    }

    try {
      // Fetch pages from MangaDex @Home Network
      const atHomeData = await mangadexService.getChapterPages(ch.id, options.quality);
      const pages = atHomeData.pages;

      if (pages.length === 0) {
        console.warn(`  ${progressStr} ⚠️ Chương ${ch.chapterNumber}: Không có trang ảnh nào!`);
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
      newlySyncedCount++;
      totalPagesSynced += pages.length;

      // Rate limit cooling pause between chapters
      await sleep(400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ${progressStr} ❌ Lỗi khi lấy chương ${ch.chapterNumber} (MangaDex Chapter ID: ${ch.id}):`, msg);
    }
  }

  // Update comic timestamp, chapterCount and latestChapterNumber
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

  // Notify followers & Invalidate Cache if new chapters were added
  if (newlySyncedCount > 0) {
    try {
      const followers = await prisma.follow.findMany({
        where: { comicId: comic.id },
        select: { userId: true },
      });
      if (followers.length > 0) {
        await prisma.notification.createMany({
          data: followers.map((f) => ({
            userId: f.userId,
            title: `Chương mới: ${comic.title}`,
            message: `Chương ${latest?.chapterNumber} vừa được cập nhật. Đọc ngay!`,
            linkUrl: `/comics/${comic.slug}/chuong-${latest?.chapterNumber}`,
          })),
        });
        console.log(`  🔔 Đã gửi thông báo chương mới đến ${followers.length} người theo dõi truyện!`);
      }
    } catch {
      // Non-blocking notification fallback
    }
  }

  // Index into Meilisearch if configured
  try {
    const { meiliService } = await import("../src/lib/meilisearch");
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
        chapterCount: chaptersSynced,
        categories: manga.categories.map((c) => translateMangaDexGenre(c)),
        updatedAt: new Date().toISOString(),
        createdAt: manga.createdAt || new Date().toISOString(),
      },
    ]);
  } catch {
    // Non-blocking fallback
  }

  console.log(`🎉 Hoàn tất truyện "${manga.title}": ${chaptersSynced}/${chapters.length} chương (${totalPagesSynced} trang, +${newlySyncedCount} mới).`);
  return { success: true, chaptersCount: chaptersSynced, pagesCount: totalPagesSynced, newChaptersCount: newlySyncedCount };
}

/**
 * Scan top recently updated manga on MangaDex and sync only their new chapters
 */
export async function scanLatestUpdates(scanLimit = 20): Promise<{
  checked: number;
  updated: number;
  newChapters: number;
  totalPages: number;
}> {
  console.log("\n=============================================================");
  console.log(`🔍 [SCAN UPDATES] Đang quét ${scanLimit} truyện vừa có chương mới trên MangaDex...`);
  console.log("=============================================================");

  try {
    const res = await mangadexService.getVietnameseMangaList({
      offset: 0,
      limit: scanLimit,
      order: "latest", // latestUploadedChapter desc
    });

    const mangaList = res.data;
    console.log(`📥 Đã nhận danh sách ${mangaList.length} truyện cập nhật mới nhất.`);

    let updatedCount = 0;
    let newChaptersTotal = 0;
    let newPagesTotal = 0;

    for (let i = 0; i < mangaList.length; i++) {
      const item = mangaList[i];
      const normalized = mangadexService.normalizeManga(item);
      console.log(`\n[Quét cập nhật ${i + 1}/${mangaList.length}] "${normalized.title}"...`);

      const result = await syncSingleManga(normalized, {
        quality: qualityArg,
        skipExisting: false,
        force: isForce,
        maxChapters: maxChaptersArg,
      });

      if ((result.newChaptersCount ?? 0) > 0) {
        updatedCount++;
        newChaptersTotal += (result.newChaptersCount ?? 0);
        newPagesTotal += result.pagesCount;
      }

      await sleep(350);
    }

    console.log("\n=============================================================");
    console.log(`✨ KẾT QUẢ QUÉT CẬP NHẬT:`);
    console.log(` - Số truyện đã kiểm tra: ${mangaList.length}`);
    console.log(` - Số truyện có chương mới: ${updatedCount}`);
    console.log(` - Tổng số chương mới đã nạp: ${newChaptersTotal}`);
    console.log(` - Tổng số trang ảnh đã lưu: ${newPagesTotal}`);
    console.log("=============================================================\n");

    return {
      checked: mangaList.length,
      updated: updatedCount,
      newChapters: newChaptersTotal,
      totalPages: newPagesTotal,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Lỗi trong quá trình quét cập nhật mới:", msg);
    return { checked: 0, updated: 0, newChapters: 0, totalPages: 0 };
  }
}

async function runCrawlBatch() {
  console.log("=============================================================");
  console.log("🚀 TRUYENKOMI - MANGADEX VIETNAMESE CRAWLER & SYNC");
  console.log("=============================================================");
  console.log(`Options:`);
  console.log(` - Chế độ: ${isContinuous ? `Chạy định kỳ (mỗi ${intervalMinutes} phút)` : "Chạy 1 lần"}`);
  console.log(` - Mode hoạt động: ${modeArg.toUpperCase()}`);
  console.log(` - Giới hạn truyện: ${isAll ? "TOÀN BỘ (Tất cả)" : limitArg}`);
  console.log(` - Sắp xếp: ${orderArg}`);
  console.log(` - Chất lượng ảnh: ${qualityArg}`);
  console.log(` - Bỏ qua truyện đã có: ${isSkipExisting ? "Bật" : "Tắt"}`);
  console.log(` - Cào đè (Force): ${isForce ? "Bật" : "Tắt"}`);
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
        force: isForce,
        maxChapters: maxChaptersArg,
      });
      console.log("\n✅ Hoàn thành crawl 1 truyện thành công!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("❌ Lỗi khi crawl truyện đơn:", msg);
    }
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
          force: isForce,
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
  console.log(`💾 Checkpoint đã lưu tại: ${CHECKPOINT_FILE} (Offset: ${currentOffset})`);
  console.log("=============================================================\n");
}

async function main() {
  if (!isContinuous) {
    if (modeArg === "updates") {
      await scanLatestUpdates(updatesLimitArg);
    } else {
      await runCrawlBatch();
    }
    await prisma.$disconnect();
    return;
  }

  console.log(`\n🔄 Kích hoạt chế độ CRAWLER DAEMON trong Docker (Mode: ${modeArg.toUpperCase()}, Tần suất: mỗi ${intervalMinutes} phút)...\n`);
  let cycle = 1;

  const runLoop = async () => {
    while (true) {
      console.log(`\n=============================================================`);
      console.log(`⏱️ BẮT ĐẦU CHU KỲ CRAWL #${cycle} - ${new Date().toLocaleString("vi-VN")}`);
      console.log(`=============================================================`);
      try {
        if (modeArg === "updates") {
          // Mode 1: Chỉ quét các truyện có chương mới cập nhật
          await scanLatestUpdates(updatesLimitArg);
        } else if (modeArg === "backlog") {
          // Mode 2: Chỉ quét kho truyện theo checkpoint
          await runCrawlBatch();
        } else {
          // Mode 3: Hybrid - Quét nhanh cập nhật mới trước, sau đó quét kho truyện
          await scanLatestUpdates(updatesLimitArg);
          await runCrawlBatch();
        }
      } catch (err) {
        console.error(`❌ Lỗi chu kỳ crawl #${cycle}:`, err);
      }
      console.log(`💤 Hoàn thành chu kỳ #${cycle}. Nghỉ ${intervalMinutes} phút trước đợt tiếp theo...`);
      cycle++;
      await sleep(intervalMinutes * 60 * 1000);
    }
  };

  const handleShutdown = async () => {
    console.log("\n🛑 Đang dừng Crawler Container gracefully...");
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);

  await runLoop();
}

main().catch(async (e) => {
  console.error("❌ Fatal Crawler Error:", e);
  await prisma.$disconnect();
  process.exit(1);
});


