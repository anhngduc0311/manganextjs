import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

function mapNotification(n: {
  id: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date;
}) {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    linkUrl: n.linkUrl,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async notify(userId: string, data: { title: string; message: string; linkUrl?: string | null }) {
    return this.prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        linkUrl: data.linkUrl ?? null,
      },
    });
  }

  async notifyFollowers(comicId: string, data: { title: string; message: string; linkUrl: string }) {
    const followers = await this.prisma.follow.findMany({
      where: { comicId },
      select: { userId: true },
    });
    if (followers.length === 0) return 0;

    const result = await this.prisma.notification.createMany({
      data: followers.map((f) => ({
        userId: f.userId,
        title: data.title,
        message: data.message,
        linkUrl: data.linkUrl,
      })),
    });
    return result.count;
  }

  async listRecent(userId: string, limit = 10) {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return items.map(mapNotification);
  }

  async countUnread(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }
}
