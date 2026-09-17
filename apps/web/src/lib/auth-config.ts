import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "supersecretjwtkey_truyenkomi_fullstack_2026",
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: "USER" | "MODERATOR" | "ADMIN" }).role ?? "USER";
        token.avatar = user.image ?? undefined;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as "USER" | "MODERATOR" | "ADMIN") ?? "USER";
        session.user.avatar = (token.avatar as string | undefined) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
