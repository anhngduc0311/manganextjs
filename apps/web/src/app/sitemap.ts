import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXTAUTH_URL || "https://truyenkomi.site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/comics`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/rankings`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const [comics, categories] = await Promise.all([
      prisma.comic.findMany({
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
      prisma.category.findMany({
        select: {
          slug: true,
        },
      }),
    ]);

    const comicRoutes: MetadataRoute.Sitemap = comics.map((comic) => ({
      url: `${SITE_URL}/comics/${comic.slug}`,
      lastModified: comic.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${SITE_URL}/comics?genres=${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...comicRoutes, ...categoryRoutes];
  } catch (err) {
    console.error("[Sitemap Generation Error]:", err);
    return staticRoutes;
  }
}
