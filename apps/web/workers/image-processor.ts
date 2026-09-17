import sharp from "sharp";
import { storageService } from "@/services/storage.service";

/**
 * Fetch image buffer from a remote URL with timeout and User-Agent
 */
export async function fetchImageBuffer(url: string, timeoutMs = 25000): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: url,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch image from ${url} (HTTP ${res.status})`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Convert an image buffer to optimized WebP
 */
export async function optimizeToWebP(inputBuffer: Buffer, maxWidth = 1600, quality = 80): Promise<Buffer> {
  return sharp(inputBuffer)
    .resize({
      width: maxWidth,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality })
    .toBuffer();
}

/**
 * Process a single chapter page and upload to Cloudflare R2
 */
export async function processAndUploadChapterPage(
  comicSlug: string,
  chapterNumber: number,
  pageIndex: number,
  sourceUrl: string
): Promise<string> {
  // If the image is already on our R2 CDN, return it directly
  if (sourceUrl.includes("r2.cloudflarestorage.com") || sourceUrl.includes("truyenkomi")) {
    return sourceUrl;
  }

  const rawBuffer = await fetchImageBuffer(sourceUrl);
  const webpBuffer = await optimizeToWebP(rawBuffer, 1600, 80);

  const key = `comics/${comicSlug}/ch-${chapterNumber}/${pageIndex}.webp`;
  const uploadedUrl = await storageService.uploadBuffer(key, webpBuffer, "image/webp");
  return uploadedUrl;
}

/**
 * Process a comic cover image and upload to Cloudflare R2
 */
export async function processAndUploadCover(comicSlug: string, sourceUrl: string): Promise<string> {
  if (sourceUrl.includes("r2.cloudflarestorage.com") || sourceUrl.includes("truyenkomi")) {
    return sourceUrl;
  }

  const rawBuffer = await fetchImageBuffer(sourceUrl);
  const webpBuffer = await optimizeToWebP(rawBuffer, 800, 85);

  const key = `covers/${comicSlug}.webp`;
  const uploadedUrl = await storageService.uploadBuffer(key, webpBuffer, "image/webp");
  return uploadedUrl;
}
