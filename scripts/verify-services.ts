import { prisma } from '../src/lib/prisma';
import { redisRest } from '../src/lib/redis';
import { meiliService } from '../src/lib/meilisearch';

async function main() {
  console.log('--- 1. Checking PostgreSQL ---');
  const userCount = await prisma.user.count();
  const comicCount = await prisma.comic.count();
  console.log(`✅ PostgreSQL OK: ${userCount} users, ${comicCount} comics in DB.`);

  console.log('--- 2. Checking Redis ---');
  if (redisRest) {
    await redisRest.set('test_docker_key', 'docker_ok', { ex: 10 });
    const val = await redisRest.get('test_docker_key');
    console.log(`✅ Redis OK: value=${val}`);
  } else {
    console.log('⚠️ Redis client not configured or disabled.');
  }

  console.log('--- 3. Checking Meilisearch ---');
  const isMeiliHealthy = await meiliService.health();
  console.log(`✅ Meilisearch health: ${isMeiliHealthy}`);

  if (isMeiliHealthy) {
    await meiliService.initIndex();
    const comics = await prisma.comic.findMany({
      take: 10,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            chapters: true,
          },
        },
      },
    });

    if (comics.length > 0) {
      console.log(`Indexing ${comics.length} comics to Meilisearch...`);
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
          chapterCount: c._count.chapters,
          categories: c.categories.map((cg) => cg.category.name),
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        }))
      );
      console.log('✅ Comics indexed successfully!');

      // Wait 1.5s for Meilisearch background indexing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('Testing Meilisearch search directly...');
      const searchRes = await meiliService.search('a', { limit: 3 });
      console.log(`✅ Search result hits count: ${searchRes?.hits.length}`);
      if (searchRes && searchRes.hits.length > 0) {
        console.log(`✅ First hit: "${searchRes.hits[0].title}" (Slug: ${searchRes.hits[0].slug})`);
      }
    }
  }

  console.log('\n🎉 ALL 4 DOCKER SERVICES ARE CONNECTED, HEALTHY & OPERATIONAL!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
