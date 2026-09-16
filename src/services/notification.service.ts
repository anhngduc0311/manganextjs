import { prisma } from "@/lib/prisma";
import type { NotificationDTO } from "@/types";

function mapNotification(n: {
  id: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date;
}): NotificationDTO {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    linkUrl: n.linkUrl,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

export const notificationService = {
  async notify(userId: string, data: { title: string; message: string; linkUrl?: string | null }): Promise<void> {
    await prisma.notification.create({
      data: { userId, title: data.title, message: data.message, linkUrl: data.linkUrl ?? null },
    });
  },

  async notifyFollowers(comicId: string, data: { title: string; message: string; linkUrl: string }): Promise<number> {
    const followers = await prisma.follow.findMany({ where: { comicId }, select: { userId: true } });
    if (followers.length === 0) return 0;
    const result = await prisma.notification.createMany({
      data: followers.map((f) => ({ userId: f.userId, title: data.title, message: data.message, linkUrl: data.linkUrl })),
    });
    return result.count;
  },

  async listRecent(userId: string, limit = 10): Promise<NotificationDTO[]> {
    const items = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return items.map(mapNotification);
  },

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  async markRead(userId: string, notificationId: string): Promise<void> {
    await prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { isRead: true } });
  },

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },
};
