import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXTAUTH_URL || "https://truyenkomi.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/profile/",
        "/history/",
        "/followed/",
        "/login",
        "/register",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
