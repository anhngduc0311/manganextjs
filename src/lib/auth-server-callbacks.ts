import type { NextAuthConfig } from "next-auth";
import { authConfig } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// Keep database access out of the Edge middleware configuration.
export const authServerCallbacks = {
  ...authConfig.callbacks,
  async jwt(params) {
    const token = authConfig.callbacks.jwt(params);
    if (typeof token.id !== "string" || !token.id) return null;
    const user = await prisma.user.findUnique({
      where: { id: token.id },
      select: { role: true, avatar: true },
    });
    if (!user) return null;
    token.role = user.role;
    token.avatar = user.avatar ?? undefined;
    return token;
  },
} satisfies NonNullable<NextAuthConfig["callbacks"]>;
