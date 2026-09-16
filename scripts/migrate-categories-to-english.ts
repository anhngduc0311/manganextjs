import { prisma } from "../src/lib/prisma";
import { translateMangaDexGenre } from "../src/services/mangadex.service";
import { toSlug } from "../src/lib/text-normalizer";

async function migrateCategoriesToEnglish() {
  console.log("🔄 Starting migration: Convert all Categories to English...");

  const allCategories = await prisma.category.findMany({
    include: {
      _count: { select: { comics: true } },
    },
  });

  console.log(`📊 Found ${allCategories.length} categories in database.`);

  let updatedCount = 0;
  let mergedCount = 0;

  for (const cat of allCategories) {
    const englishName = translateMangaDexGenre(cat.name);
    const englishSlug = toSlug(englishName);

    if (cat.name === englishName && cat.slug === englishSlug) {
      // Already English
      continue;
    }

    console.log(`🔄 Migrating "${cat.name}" (${cat.slug}) -> "${englishName}" (${englishSlug})...`);

    // Check if target category already exists
    const existingTarget = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: englishSlug },
          { name: englishName },
        ],
      },
    });

    if (existingTarget && existingTarget.id !== cat.id) {
      // Target already exists: merge comic associations to existing target category
      const comicLinks = await prisma.comicCategory.findMany({
        where: { categoryId: cat.id },
      });

      for (const link of comicLinks) {
        await prisma.comicCategory.upsert({
          where: {
            comicId_categoryId: {
              comicId: link.comicId,
              categoryId: existingTarget.id,
            },
          },
          create: {
            comicId: link.comicId,
            categoryId: existingTarget.id,
          },
          update: {},
        });
      }

      // Delete old category
      await prisma.comicCategory.deleteMany({
        where: { categoryId: cat.id },
      });
      await prisma.category.delete({
        where: { id: cat.id },
      });

      console.log(`  ✅ Merged "${cat.name}" into existing "${englishName}" (${comicLinks.length} comics linked)`);
      mergedCount++;
    } else {
      // Update in-place
      await prisma.category.update({
        where: { id: cat.id },
        data: {
          name: englishName,
          slug: englishSlug,
          description: `Thể loại truyện tranh ${englishName}`,
        },
      });
      console.log(`  ✅ Renamed "${cat.name}" -> "${englishName}" (slug: "${englishSlug}")`);
      updatedCount++;
    }
  }

  // Update Meilisearch index if configured
  try {
    const { meiliService } = await import("../src/lib/meilisearch");
    const comics = await prisma.comic.findMany({
      include: {
        categories: { include: { category: true } },
      },
    });

    if (comics.length > 0) {
      await meiliService.indexComics(
        comics.map((c) => ({
          id: c.id,
          title: c.title,
          titleUnaccent: c.titleUnaccent,
          slug: c.slug,
          otherNames: c.otherNames,
          author: c.author,
          status: c.status,
          coverImage: c.coverImage,
          views: Number(c.views),
          ratingAvg: c.ratingAvg,
          ratingCount: c.ratingCount,
          chapterCount: c.chapterCount,
          categories: c.categories.map((cc) => cc.category.name),
          updatedAt: c.updatedAt.toISOString(),
          createdAt: c.createdAt.toISOString(),
        }))
      );
      console.log(`🔍 Updated Meilisearch index for ${comics.length} comics.`);
    }
  } catch {
    // Non-blocking fallback
  }

  console.log("\n=======================================================");
  console.log(`🎉 HOÀN TẤT CHUYỂN ĐỔI THỂ LOẠI SANG TIẾNG ANH:`);
  console.log(` - Số thể loại đã đổi tên: ${updatedCount}`);
  console.log(` - Số thể loại đã gộp: ${mergedCount}`);
  console.log("=======================================================\n");
}

migrateCategoriesToEnglish()
  .catch((err) => {
    console.error("❌ Migration error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
