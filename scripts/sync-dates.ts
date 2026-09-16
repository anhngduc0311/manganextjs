import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../src/lib/prisma";
import { mangadexService } from "../src/services/mangadex.service";
import { cacheService } from "../src/services/cache.service";

async function main() {
  console.log("==================================================");
  console.log("🕒 TruyenKomi - Đồng bộ thời gian phát hành MangaDex");
  console.log("==================================================");

  // Fetch list of Vietnamese manga from MangaDex (up to 100)
  const mdRes = await mangadexService.getVietnameseMangaList({ limit: 100, order: "latest" });
  console.log(`Đã tải ${mdRes.data.length} truyện từ MangaDex.`);

  const dbComics = await prisma.comic.findMany({
    select: { id: true, title: true, slug: true },
  });

  console.log(`Tìm thấy ${dbComics.length} truyện trong database.`);

  for (const comic of dbComics) {
    console.log(`\n🔍 Đang tra cứu MangaDex cho: "${comic.title}"...`);
    
    // Find matching manga in mdRes
    const matched = mdRes.data.find((m) => {
      const titles = Object.values(m.attributes.title);
      const altTitles = m.attributes.altTitles.flatMap((alt) => Object.values(alt));
      const allTitles = [...titles, ...altTitles].map((t) => t.toLowerCase());
      return allTitles.includes(comic.title.toLowerCase()) || comic.title.toLowerCase().includes(titles[0]?.toLowerCase());
    });

    if (!matched) {
      console.warn(`  ⚠️ Không tìm thấy trên MangaDex list.`);
      continue;
    }

    const normalized = mangadexService.normalizeManga(matched);
    const chapters = await mangadexService.getVietnameseChapters(matched.id);

    console.log(`  📅 MangaDex Manga Updated: ${normalized.updatedAt}`);
    console.log(`  📖 MangaDex Vietnamese Chapters: ${chapters.length}`);

    // Sync each chapter createdAt
    for (const ch of chapters) {
      if (ch.publishedAt) {
        const chDate = new Date(ch.publishedAt);
        await prisma.chapter.updateMany({
          where: { comicId: comic.id, chapterNumber: ch.chapterNumber },
          data: { createdAt: chDate },
        });
      }
    }

    // Calculate latest update time
    let latestUpdateTime = normalized.updatedAt ? new Date(normalized.updatedAt) : new Date();
    for (const ch of chapters) {
      if (ch.publishedAt) {
        const pDate = new Date(ch.publishedAt);
        if (!isNaN(pDate.getTime()) && pDate.getTime() > latestUpdateTime.getTime()) {
          latestUpdateTime = pDate;
        }
      }
    }

    const comicCreatedAt = normalized.createdAt ? new Date(normalized.createdAt) : undefined;

    await prisma.comic.update({
      where: { id: comic.id },
      data: {
        updatedAt: latestUpdateTime,
        ...(comicCreatedAt ? { createdAt: comicCreatedAt } : {}),
      },
    });

    console.log(`  ✅ Đã cập nhật "${comic.title}" -> updatedAt: ${latestUpdateTime.toISOString()}`);
  }

  // Clear Redis home-feed cache
  try {
    await cacheService.del("home-feed", "comic-list");
    await cacheService.scanDelete("comic:*");
    console.log("\n🧹 Đã xóa cache home-feed và comic list.");
  } catch {}

  console.log("\n🎉 Hoàn tất đồng bộ thời gian phát hành!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
