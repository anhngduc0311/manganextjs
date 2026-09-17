/**
 * TruyenKomi Reader Cache Manager
 * Uses browser CacheStorage (or Memory Blob Cache fallback) to store read images
 * for 0ms re-reads, instant page flips, and offline reading.
 */

const CACHE_NAME = "truyenkomi-reader-v1";
const MAX_CACHE_ENTRIES = 120;

const memoryBlobCache = new Map<string, string>();

export function isCacheStorageAvailable(): boolean {
  return typeof window !== "undefined" && "caches" in window;
}

export async function getCachedImageUrl(url: string): Promise<string | null> {
  if (typeof window === "undefined" || !url) return null;

  // 1. Check in-memory object URL
  if (memoryBlobCache.has(url)) {
    return memoryBlobCache.get(url)!;
  }

  // 2. Check CacheStorage
  if (isCacheStorageAvailable()) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const match = await cache.match(url);
      if (match) {
        const blob = await match.blob();
        const objectUrl = URL.createObjectURL(blob);
        memoryBlobCache.set(url, objectUrl);
        return objectUrl;
      }
    } catch {
      // Non-blocking fallback
    }
  }

  return null;
}

export async function cacheImageBlob(url: string, response: Response): Promise<string | null> {
  if (typeof window === "undefined" || !url) return null;

  try {
    const clone = response.clone();
    const blob = await clone.blob();
    const objectUrl = URL.createObjectURL(blob);
    memoryBlobCache.set(url, objectUrl);

    if (isCacheStorageAvailable()) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(url, response);
      // Trim old entries asynchronously
      trimCache(cache);
    }

    return objectUrl;
  } catch {
    return null;
  }
}

async function trimCache(cache: Cache) {
  try {
    const keys = await cache.keys();
    if (keys.length > MAX_CACHE_ENTRIES) {
      const toDelete = keys.slice(0, keys.length - MAX_CACHE_ENTRIES);
      for (const req of toDelete) {
        await cache.delete(req);
      }
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Preload and pre-decode an image into browser memory
 */
export function preloadImage(url: string): Promise<void> {
  if (typeof window === "undefined" || !url) return Promise.resolve();

  return new Promise((resolve) => {
    // If already in memory blob cache, decode immediately
    const img = new Image();
    img.decoding = "async";
    img.src = url;

    if (img.complete) {
      resolve();
      return;
    }

    img.onload = () => resolve();
    img.onerror = () => resolve(); // Non-blocking
  });
}
