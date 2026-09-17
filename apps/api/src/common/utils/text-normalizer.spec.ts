import { describe, it, expect } from "vitest";
import { toSlug, toUnaccent } from "./text-normalizer";

describe("Text Normalizer Utility", () => {
  it("should convert vietnamese text with accents to unaccented lowercase text for search", () => {
    expect(toUnaccent("Đại Quản Gia Là Ma Hoàng")).toBe("dai quan gia la ma hoang");
    expect(toUnaccent("Truyện Tranh Hay Nhất 2025")).toBe("truyen tranh hay nhat 2025");
  });

  it("should generate clean URL slugs", () => {
    expect(toSlug("Đại Quản Gia Là Ma Hoàng!")).toBe("dai-quan-gia-la-ma-hoang");
    expect(toSlug("One Piece: Đảo Hải Tặc - Chapter 1100")).toBe("one-piece-dao-hai-tac-chapter-1100");
  });
});
