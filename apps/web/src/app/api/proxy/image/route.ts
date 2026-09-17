import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const ALLOWED_HOST_PATTERNS = [
  "mangadex.network",
  "mangadex.org",
  "uploads.mangadex.org",
  "r2.cloudflarestorage.com",
  "r2.dev",
  "images.unsplash.com",
  "picsum.photos",
  "fastly.picsum.photos",
  "workers.dev",
  "cdn.truyenkomi.com",
];

function isHostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_HOST_PATTERNS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");
  const qualityParam = searchParams.get("quality") || searchParams.get("q") || "auto"; // auto | saver | high | original

  if (!targetUrl) {
    return new NextResponse("Thiếu tham số url", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return new NextResponse("URL không hợp lệ", { status: 400 });
  }

  if (!isHostAllowed(parsed.hostname)) {
    return new NextResponse("Host không được phép proxy", { status: 403 });
  }

  const urlsToTry = [targetUrl];

  // If it's a temporary mangadex.network node, add canonical uploads.mangadex.org as candidate
  if (targetUrl.includes(".mangadex.network/data/") || targetUrl.includes(".mangadex.network/data-saver/")) {
    const canonical = targetUrl.replace(
      /^https?:\/\/[^/]+\.mangadex\.network\/(data(?:-saver)?\/)/i,
      "https://uploads.mangadex.org/$1"
    );
    if (!urlsToTry.includes(canonical)) {
      urlsToTry.push(canonical);
    }
  }

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://mangadex.org/",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        // Cache in Next.js data cache for 14 days
        next: { revalidate: 1209600 },
      });

      if (res.ok) {
        const rawBuffer = Buffer.from(await res.arrayBuffer());

        if (qualityParam === "original") {
          const originalType = res.headers.get("content-type") || "image/jpeg";
          return new NextResponse(rawBuffer, {
            status: 200,
            headers: {
              "Content-Type": originalType,
              "Cache-Control": "public, max-age=31536000, immutable, stale-while-revalidate=86400",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        try {
          // Sharp Progressive WebP optimization
          const isSaver = qualityParam === "saver";
          const quality = isSaver ? 70 : 82;
          let pipeline = sharp(rawBuffer).rotate();

          if (isSaver) {
            pipeline = pipeline.resize({ width: 900, withoutEnlargement: true });
          }

          const webpBuffer = await pipeline
            .webp({ quality, effort: 3 })
            .toBuffer();

          return new NextResponse(webpBuffer, {
            status: 200,
            headers: {
              "Content-Type": "image/webp",
              "Cache-Control": "public, max-age=31536000, immutable, stale-while-revalidate=86400",
              "Access-Control-Allow-Origin": "*",
              "X-Image-Transcoded": "sharp-webp",
            },
          });
        } catch {
          // Fallback to raw buffer if sharp fails on unusual formats
          const contentType = res.headers.get("content-type") || "image/jpeg";
          return new NextResponse(rawBuffer, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000, immutable, stale-while-revalidate=86400",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      }
    } catch {
      // Try next url candidate
    }
  }

  return new NextResponse("Không thể tải ảnh từ máy chủ gốc", { status: 502 });
}
