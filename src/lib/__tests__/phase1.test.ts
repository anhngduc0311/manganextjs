import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { viewSchema, ingestSchema } from "@/types/schemas";

describe("Phase 1 - Prisma Singleton & Database Instance", () => {
  it("exports a defined Prisma instance", () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma).toBe("object");
  });
});

describe("Phase 1 - View Tracking Schema & Validation", () => {
  it("validates correct UUIDs for comicId and chapterId", () => {
    const valid = viewSchema.safeParse({
      comicId: "123e4567-e89b-12d3-a456-426614174000",
      chapterId: "123e4567-e89b-12d3-a456-426614174001",
    });
    expect(valid.success).toBe(true);
  });

  it("fails if comicId or chapterId is invalid or not a UUID", () => {
    const invalid1 = viewSchema.safeParse({
      comicId: "not-a-uuid",
      chapterId: "123e4567-e89b-12d3-a456-426614174001",
    });
    expect(invalid1.success).toBe(false);

    const invalid2 = viewSchema.safeParse({
      comicId: "123e4567-e89b-12d3-a456-426614174000",
      chapterId: "",
    });
    expect(invalid2.success).toBe(false);
  });
});

describe("Phase 1 - Ingest Schema Validation", () => {
  it("validates a full ingest payload correctly", () => {
    const payload = {
      comic: {
        title: "Solo Leveling",
        slug: "solo-leveling",
        author: "Chugong",
        status: "COMPLETED",
        description: "Thợ săn Sung Jin-Woo",
        categories: ["Hành Động", "Giả Tưởng"],
      },
      chapters: [
        {
          chapterNumber: 1,
          title: "Chương 1",
          pages: ["https://example.com/p1.jpg", "https://example.com/p2.jpg"],
        },
      ],
    };
    const parsed = ingestSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });
});
