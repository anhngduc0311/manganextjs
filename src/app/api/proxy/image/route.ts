import { NextResponse } from "next/server";

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
        // Cache in Next.js data cache for 7 days
        next: { revalidate: 604800 },
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "image/jpeg";
        const buffer = await res.arrayBuffer();

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch {
      // Try next url candidate
    }
  }

  return new NextResponse("Không thể tải ảnh từ máy chủ gốc", { status: 502 });
}
