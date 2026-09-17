import { prisma } from "@/lib/prisma";
import { computeLevel, EXP_PER_READ } from "@/lib/leveling";

export async function recordReading(userId: string, data: {
  comicId: string;
  chapterId: string;
  lastReadPage: number;
}): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const chapter = await tx.chapter.findUnique({
      where: { id: data.chapterId }, select: { comicId: true },
    });
    if (!chapter || chapter.comicId !== data.comicId) return false;

    await tx.history.upsert({
      where: { userId_comicId: { userId, comicId: data.comicId } },
      create: { userId, ...data },
      update: { chapterId: data.chapterId, lastReadPage: data.lastReadPage, updatedAt: new Date() },
    });
    // The unique key also prevents duplicate rewards from concurrent requests.
    const reward = await tx.readingReward.createMany({
      data: [{ userId, chapterId: data.chapterId }], skipDuplicates: true,
    });
    if (reward.count > 0) {
      const user = await tx.user.update({
        where: { id: userId }, data: { exp: { increment: EXP_PER_READ } }, select: { exp: true },
      });
      await tx.user.update({ where: { id: userId }, data: { level: computeLevel(user.exp) } });
    }
    return true;
  });
}
