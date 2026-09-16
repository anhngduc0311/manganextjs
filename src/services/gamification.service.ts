import { prisma } from "@/lib/prisma";
import { computeLevel, computeStreak, DAILY_STREAK_BONUS } from "@/lib/leveling";

export const gamificationService = {
  async awardExp(userId: string, amount: number): Promise<{ exp: number; level: number }> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { exp: true } });
    if (!user) throw new Error("User khong ton tai");
    const newExp = user.exp + amount;
    const newLevel = computeLevel(newExp);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { exp: newExp, level: newLevel },
      select: { exp: true, level: true },
    });
    return updated;
  },

  async touchDailyStreak(userId: string): Promise<{ streak: number; awarded: boolean; level: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dailyStreak: true, lastActiveAt: true },
    });
    if (!user) throw new Error("User khong ton tai");

    const result = computeStreak(user.lastActiveAt, user.dailyStreak);
    await prisma.user.update({
      where: { id: userId },
      data: { dailyStreak: result.streak, lastActiveAt: new Date() },
    });

    let level = 0;
    if (result.awarded) {
      const after = await this.awardExp(userId, DAILY_STREAK_BONUS);
      level = after.level;
    }
    return { streak: result.streak, awarded: result.awarded, level };
  },
};
