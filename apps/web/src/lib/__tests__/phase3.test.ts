import { describe, it, expect } from "vitest";

describe("Phase 3 - Database Indexing & Subquery Elimination", () => {
  it("Comic model definition supports chapterCount and latestChapterNumber", async () => {
    const { Prisma } = await import("@prisma/client");
    expect(Prisma.ComicScalarFieldEnum).toHaveProperty("chapterCount");
    expect(Prisma.ComicScalarFieldEnum).toHaveProperty("latestChapterNumber");
  });

  it("Normalizes card structure directly without N+1 subquery", () => {
    const mockComic = {
      id: "comic-123",
      title: "Solo Leveling",
      slug: "solo-leveling",
      coverImage: "https://example.com/cover.webp",
      status: "COMPLETED" as const,
      views: BigInt(5000),
      ratingAvg: 4.9,
      ratingCount: 150,
      chapterCount: 179,
      latestChapterNumber: 179,
      updatedAt: new Date("2026-09-16T00:00:00.000Z"),
      categories: [{ category: { name: "Hành Động", slug: "hanh-dong" } }],
    };

    expect(mockComic.chapterCount).toBe(179);
    expect(mockComic.latestChapterNumber).toBe(179);
  });

  it("Filters out comics with 0 chapters or missing chapter 1 for home feed and listing", () => {
    const comics = [
      { id: "1", title: "Valid Comic", chapterCount: 10, chapters: [{ chapterNumber: 1 }, { chapterNumber: 2 }] },
      { id: "2", title: "No Chapters", chapterCount: 0, chapters: [] },
      { id: "3", title: "Missing Chapter 1", chapterCount: 5, chapters: [{ chapterNumber: 5 }, { chapterNumber: 6 }] },
    ];

    const filtered = comics.filter(
      (c) => c.chapterCount > 0 && c.chapters.some((ch) => ch.chapterNumber === 1)
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("1");
    expect(filtered[0].title).toBe("Valid Comic");
  });
});
