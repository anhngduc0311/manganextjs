import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Role } from "@truyenkomi/database";
import { computeLevel, computeStreak, levelProgress, EXP_PER_READ, DAILY_STREAK_BONUS } from "@/common/utils/leveling";
import { UpdateProfileDto, RecordHistoryDto } from "./dto/users.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        exp: true,
        level: true,
        dailyStreak: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Người dùng không tồn tại");
    }

    const progress = levelProgress(user.exp);
    return {
      ...user,
      progress,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        avatar: dto.avatar,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        exp: true,
        level: true,
        dailyStreak: true,
      },
    });
  }

  async getFollows(userId: string, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;
    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { userId },
        skip,
        take: perPage,
        orderBy: { createdAt: "desc" },
        include: {
          comic: {
            include: {
              categories: { include: { category: true } },
            },
          },
        },
      }),
      this.prisma.follow.count({ where: { userId } }),
    ]);

    const items = follows.map((f) => ({
      ...f.comic,
      views: Number(f.comic.views),
      monthlyViews: Number(f.comic.monthlyViews),
      weeklyViews: Number(f.comic.weeklyViews),
      categories: f.comic.categories.map((c) => ({ name: c.category.name, slug: c.category.slug })),
      followedAt: f.createdAt.toISOString(),
    }));

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async toggleFollow(userId: string, comicId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: { userId_comicId: { userId, comicId } },
    });

    if (existing) {
      await this.prisma.follow.delete({
        where: { userId_comicId: { userId, comicId } },
      });
      return { following: false };
    }

    await this.prisma.follow.create({
      data: { userId, comicId },
    });
    return { following: true };
  }

  async isFollowing(userId: string, comicId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: { userId_comicId: { userId, comicId } },
    });
    return { following: !!follow };
  }

  async getHistory(userId: string, page = 1, perPage = 20) {
    const skip = (page - 1) * perPage;
    const [histories, total] = await Promise.all([
      this.prisma.history.findMany({
        where: { userId },
        skip,
        take: perPage,
        orderBy: { updatedAt: "desc" },
        include: {
          comic: {
            include: {
              categories: { include: { category: true } },
            },
          },
          chapter: {
            select: {
              id: true,
              chapterNumber: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.history.count({ where: { userId } }),
    ]);

    const items = histories.map((h) => ({
      comic: {
        ...h.comic,
        views: Number(h.comic.views),
        categories: h.comic.categories.map((c) => ({ name: c.category.name, slug: c.category.slug })),
      },
      chapter: h.chapter,
      lastReadPage: h.lastReadPage,
      updatedAt: h.updatedAt.toISOString(),
    }));

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async recordHistory(userId: string, dto: RecordHistoryDto) {
    return this.prisma.$transaction(async (tx) => {
      const chapter = await tx.chapter.findUnique({
        where: { id: dto.chapterId },
        select: { comicId: true },
      });

      if (!chapter || chapter.comicId !== dto.comicId) {
        throw new BadRequestException("Chương không thuộc truyện hoặc không tồn tại");
      }

      await tx.history.upsert({
        where: { userId_comicId: { userId, comicId: dto.comicId } },
        create: {
          userId,
          comicId: dto.comicId,
          chapterId: dto.chapterId,
          lastReadPage: dto.lastReadPage,
        },
        update: {
          chapterId: dto.chapterId,
          lastReadPage: dto.lastReadPage,
          updatedAt: new Date(),
        },
      });

      const reward = await tx.readingReward.createMany({
        data: [{ userId, chapterId: dto.chapterId }],
        skipDuplicates: true,
      });

      if (reward.count > 0) {
        const u = await tx.user.update({
          where: { id: userId },
          data: { exp: { increment: EXP_PER_READ } },
          select: { exp: true },
        });
        await tx.user.update({
          where: { id: userId },
          data: { level: computeLevel(u.exp) },
        });
      }

      return { success: true };
    });
  }

  async listUsersAdmin(page = 1, perPage = 20, search = "", role?: Role) {
    const skip = (page - 1) * perPage;
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          avatar: true,
          exp: true,
          level: true,
          dailyStreak: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async updateUserRole(adminUserId: string, targetUserId: string, role: Role) {
    if (adminUserId === targetUserId) {
      throw new ForbiddenException("Không thể tự đổi quyền của chính mình");
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });
  }
}
