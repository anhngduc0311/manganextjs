import { describe, it, expect, beforeEach, vi } from "vitest";
import { isCacheStorageAvailable, getCachedImageUrl, preloadImage } from "../reader-cache";

describe("Reader Cache & Preloading Utilities", () => {
  it("should safely check CacheStorage availability", () => {
    const isAvail = isCacheStorageAvailable();
    expect(typeof isAvail).toBe("boolean");
  });

  it("should return null for empty or nonexistent image urls", async () => {
    const result = await getCachedImageUrl("");
    expect(result).toBeNull();
  });

  it("should safely preload image urls without throwing", async () => {
    await expect(preloadImage("https://example.com/test-page.jpg")).resolves.not.toThrow();
  });
});
