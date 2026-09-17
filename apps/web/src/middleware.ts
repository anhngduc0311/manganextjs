import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth-config";

const { auth } = NextAuth(authConfig);

const CRAWLER_PATHS = ["/api/crawler", "/api/revalidate"];

import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  if (nextUrl.pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("next", nextUrl.pathname);
      return Response.redirect(loginUrl);
    }
    // The server layout/actions authorize against the current database role.
  }

  if (CRAWLER_PATHS.some((p) => nextUrl.pathname.startsWith(p))) {
    const authorization = req.headers.get("authorization");
    if (!process.env.CRAWLER_SECRET_KEY || authorization !== `Bearer ${process.env.CRAWLER_SECRET_KEY}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("x-request-id", requestId);
  return response;
});

export const config = {
  matcher: ["/admin/:path*", "/api/crawler/:path*", "/api/revalidate/:path*"],
};
