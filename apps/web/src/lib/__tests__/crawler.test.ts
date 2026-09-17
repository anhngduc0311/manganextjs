import { describe, it, expect, vi } from "vitest";
import { ingestSchema } from "@/types/schemas";
import { optimizeToWebP } from "../../../workers/image-processor";
import sharp from "sharp";

describe("Phase 8 - Ingestion Pipeline & Image Processor", () => {
  it("ingestSchema validates complete valid comic & chapter payload", () => {
    const payload = {
      comic: {
        title: "Đảo Hải Tạc (One Piece)",
        slug: "dao-hai-tac",
        author: "Eiichiro Oda",
        status: "ONGOING",
        categories: ["Hành Động", "Phiêu Lưu", "Hài Hước"],
        description: "Hành trình tìm kiếm kho báu One Piece",
      },
      chapters: [
        {
          chapterNumber: 1,
          title: "Khởi đầu",
          pages: [
            "https://cdn.example.com/p1.jpg",
            "https://cdn.example.com/p2.jpg",
          ],
        },
        {
          chapterNumber: 1.5,
          title: "Ngoại truyện",
          pages: ["https://cdn.example.com/p1_5.jpg"],
        },
      ],
    };

    const parsed = ingestSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.comic.title).toBe("Đảo Hải Tạc (One Piece)");
      expect(parsed.data.chapters.length).toBe(2);
      expect(parsed.data.chapters[1].chapterNumber).toBe(1.5);
    }
  });

  it("ingestSchema rejects payload with missing chapter pages", () => {
    const invalidPayload = {
      comic: {
        title: "Test Comic",
      },
      chapters: [
        {
          chapterNumber: 1,
          pages: [], // Empty pages -> must fail
        },
      ],
    };

    const parsed = ingestSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it("optimizeToWebP converts image buffer to WebP format", async () => {
    // Generate a simple test PNG buffer using sharp
    // 1x1 valid PNG buffer
    const testPngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );

    const webpBuffer = await optimizeToWebP(testPngBuffer, 1600, 80);
    expect(Buffer.isBuffer(webpBuffer)).toBe(true);
    expect(webpBuffer.length).toBeGreaterThan(0);

    // Verify metadata of generated WebP
    const metadata = await sharp(webpBuffer).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(1);
    expect(metadata.height).toBe(1);
  });
});

describe("MangaDex Dynamic Category Translation & Extraction", () => {
  it("normalizes known MangaDex tags into English and handles unmapped tags gracefully", async () => {
    const { translateMangaDexGenre } = await import("@/services/mangadex.service");
    expect(translateMangaDexGenre("Action")).toBe("Action");
    expect(translateMangaDexGenre("Hành Động")).toBe("Action");
    expect(translateMangaDexGenre("Chuyển Sinh")).toBe("Isekai");
    expect(translateMangaDexGenre("isekai")).toBe("Isekai");
    expect(translateMangaDexGenre("Martial Arts")).toBe("Martial Arts");
    expect(translateMangaDexGenre("Đời Thường")).toBe("Slice of Life");
    expect(translateMangaDexGenre("Slice of Life")).toBe("Slice of Life");
    expect(translateMangaDexGenre("Shounen")).toBe("Shounen");
    expect(translateMangaDexGenre("Custom New Genre")).toBe("Custom New Genre");
  });


  it("normalizeManga automatically includes tags, demographics, and format/country", async () => {
    const { mangadexService } = await import("@/services/mangadex.service");
    const mockManga: Parameters<typeof mangadexService.normalizeManga>[0] = {
      id: "uuid-1234",
      type: "manga",
      attributes: {
        title: { en: "Solo Leveling", vi: "Tôi Thăng Cấp Một Mình" },
        altTitles: [{ ko: "나 혼자만 레벨업" }],
        description: { vi: "Mô tả truyện" },
        status: "completed",
        publicationDemographic: "shounen",
        originalLanguage: "ko",
        tags: [
          {
            id: "tag-1",
            type: "tag",
            attributes: { name: { en: "Action" }, group: "genre" },
          },
          {
            id: "tag-2",
            type: "tag",
            attributes: { name: { en: "Fantasy" }, group: "genre" },
          },
        ],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      },
      relationships: [
        { id: "author-1", type: "author", attributes: { name: "Chugong" } },
      ],
    };

    const normalized = mangadexService.normalizeManga(mockManga);
    expect(normalized.title).toBe("Tôi Thăng Cấp Một Mình");
    expect(normalized.status).toBe("COMPLETED");
    expect(normalized.author).toBe("Chugong");
    expect(normalized.categories).toContain("Action");
    expect(normalized.categories).toContain("Fantasy");
    expect(normalized.categories).toContain("Shounen");
    expect(normalized.categories).toContain("Manhwa");
  });
});

describe("Crawler Worker - processChapterJob", () => {
  it("processes chapter payload, handles upsert transaction, notification and cache invalidation", async () => {
    const { processChapterJob } = await import("../../../workers/crawler.worker");
    const { prisma } = await import("@/lib/prisma");

    // Mock prisma transaction
    const mockChapter = { id: "ch-uuid-123", comicId: "comic-uuid-1", chapterNumber: 10 };
    const mockTx = {
      chapter: {
        upsert: vi.fn().mockResolvedValue(mockChapter),
        count: vi.fn().mockResolvedValue(10),
        findFirst: vi.fn().mockResolvedValue({ chapterNumber: 10 }),
      },
      comic: {
        update: vi.fn().mockResolvedValue({ id: "comic-uuid-1" }),
      },
    };

    const spyTransaction = vi.spyOn(prisma, "$transaction").mockImplementation(async (cb) => {
      return cb(mockTx as unknown as import("@prisma/client").Prisma.TransactionClient);
    });

    const result = await processChapterJob({
      data: {
        comicId: "comic-uuid-1",
        comicSlug: "test-manga",
        comicTitle: "Test Manga",
        chapterNumber: 10,
        title: "Chapter 10 Title",
        sourcePageUrls: ["https://example.com/p1.jpg", "https://example.com/p2.jpg"],
      },
    });

    expect(result.chapterId).toBe("ch-uuid-123");
    expect(result.pagesCount).toBe(2);
    expect(spyTransaction).toHaveBeenCalled();
    expect(mockTx.chapter.upsert).toHaveBeenCalled();
    expect(mockTx.comic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "comic-uuid-1" },
        data: expect.objectContaining({
          chapterCount: 10,
          latestChapterNumber: 10,
        }),
      })
    );

    spyTransaction.mockRestore();
  });

  it("skips processing and image download if chapter already exists with pages", async () => {
    const { processChapterJob } = await import("../../../workers/crawler.worker");
    const { prisma } = await import("@/lib/prisma");

    const spyFindUnique = vi.spyOn(prisma.chapter, "findUnique").mockResolvedValue({
      id: "existing-ch-id",
      _count: { pages: 15 },
    } as unknown as Awaited<ReturnType<typeof prisma.chapter.findUnique>>);

    const spyTransaction = vi.spyOn(prisma, "$transaction");

    const result = await processChapterJob({
      data: {
        comicId: "comic-1",
        comicSlug: "manga-slug",
        comicTitle: "Manga Title",
        chapterNumber: 5,
        sourcePageUrls: ["https://example.com/p1.jpg"],
      },
    });

    expect(result.chapterId).toBe("existing-ch-id");
    expect(result.pagesCount).toBe(15);
    expect(spyTransaction).not.toHaveBeenCalled();

    spyFindUnique.mockRestore();
    spyTransaction.mockRestore();
  });
});
