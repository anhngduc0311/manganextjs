import type { NextConfig } from "next";

const r2Domain = process.env.R2_PUBLIC_DOMAIN
  ? (() => {
      try {
        return new URL(process.env.R2_PUBLIC_DOMAIN);
      } catch {
        return null;
      }
    })()
  : null;

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@node-rs/argon2", "sharp", "pino", "pino-pretty", "bullmq", "ioredis", "sanitize-html"],
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [
      ...(r2Domain ? [{ protocol: r2Domain.protocol.replace(":", "") as "http" | "https", hostname: r2Domain.hostname }] : []),
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "uploads.mangadex.org" },
      { protocol: "https", hostname: "**.mangadex.org" },
      { protocol: "https", hostname: "mangadex.org" },
      { protocol: "https", hostname: "**.mangadex.network" },
      { protocol: "https", hostname: "mangadex.network" },
      { protocol: "http", hostname: "**.mangadex.network" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
