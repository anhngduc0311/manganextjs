import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { randomBytes, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { gamificationService } from "@/services/gamification.service";
import type { Role } from "@/types";

const REFRESH_TOKEN_TTL_DAYS = 30;

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatar: string | null;
  exp: number;
  level: number;
  dailyStreak: number;
}

const safeUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  avatar: true,
  exp: true,
  level: true,
  dailyStreak: true,
} as const;

export const authService = {
  hashPassword(password: string): Promise<string> {
    return argonHash(password);
  },

  verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return argonVerify(passwordHash, password);
  },

  async findById(id: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({ where: { id }, select: safeUserSelect });
  },

  async register(username: string, email: string, password: string): Promise<SafeUser | null> {
    const exists = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: email.toLowerCase() }] },
      select: { id: true },
    });
    if (exists) return null;

    const passwordHash = await this.hashPassword(password);
    const user = await prisma.user.create({
      data: { username, email: email.toLowerCase(), passwordHash },
      select: safeUserSelect,
    });
    await this.issueRefreshToken(user.id);
    return user;
  },

  async login(identifier: string, password: string): Promise<SafeUser | null> {
    const ident = identifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: ident }, { username: identifier.trim() }] },
    });
    if (!user) return null;

    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) return null;

    await this.issueRefreshToken(user.id);
    await gamificationService.touchDailyStreak(user.id);
    return prisma.user.findUnique({ where: { id: user.id }, select: safeUserSelect });
  },

  async issueRefreshToken(userId: string): Promise<string> {
    const token = `${randomUUID()}.${randomBytes(24).toString("hex")}`;
    const refreshExpiry = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: token, refreshExpiry } });
    return token;
  },

  async revokeRefreshToken(userId: string): Promise<void> {
    await prisma.user.updateMany({
      where: { id: userId },
      data: { refreshToken: null, refreshExpiry: null },
    });
  },
};
