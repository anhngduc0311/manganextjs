import { describe, it, expect } from "vitest";
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
  it("translates known MangaDex tags into Vietnamese and handles unmapped tags gracefully", async () => {
    const { translateMangaDexGenre } = await import("@/services/mangadex.service");
    expect(translateMangaDexGenre("Action")).toBe("Hành Động");
    expect(translateMangaDexGenre("isekai")).toBe("Chuyển Sinh");
    expect(translateMangaDexGenre("Martial Arts")).toBe("Võ Thuật");
    expect(translateMangaDexGenre("Slice of Life")).toBe("Đời Thường");
    expect(translateMangaDexGenre("Shounen")).toBe("Shounen");
    expect(translateMangaDexGenre("Custom New Genre")).toBe("Custom New Genre");
  });

  it("normalizeManga automatically includes tags, demographics, and format/country", async () => {
    const { mangadexService } = await import("@/services/mangadex.service");
    const mockManga: any = {
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

