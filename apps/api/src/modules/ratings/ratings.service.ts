import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { computeLevel, EXP_PER_RATING } from "@/common/utils/leveling";
import { RateComicDto } from "./dto/ratings.dto";

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async rateComic(userId: string, dto: RateComicDto) {
    const comic = await this.prisma.comic.findUnique({ where: { id: dto.comicId } });
    if (!comic) {
      throw new NotFoundException("Truyện không tồn tại");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.comicRating.upsert({
        where: { userId_comicId: { userId, comicId: dto.comicId } },
        create: { userId, comicId: dto.comicId, score: dto.score },
        update: { score: dto.score },
      });

      const agg = await tx.comicRating.aggregate({
        where: { comicId: dto.comicId },
        _avg: { score: true },
        _count: { score: true },
      });

      const updated = await tx.comic.update({
        where: { id: dto.comicId },
        data: { ratingAvg: agg._avg.score ?? 0, ratingCount: agg._count.score },
        select: { id: true, slug: true, ratingAvg: true, ratingCount: true },
      });

      const u = await tx.user.update({
        where: { id: userId },
        data: { exp: { increment: EXP_PER_RATING } },
        select: { exp: true },
      });
      await tx.user.update({
        where: { id: userId },
        data: { level: computeLevel(u.exp) },
      });

      return updated;
    });

    await this.redis.invalidateTags(`comic-detail-${result.slug}`, `comic-${result.slug}`, "home-feed", "comic-list");
    return {
      ratingAvg: result.ratingAvg,
      ratingCount: result.ratingCount,
    };
  }

  async getUserRating(userId: string, comicId: string) {
    const rating = await this.prisma.comicRating.findUnique({
      where: { userId_comicId: { userId, comicId } },
      select: { score: true },
    });
    return { score: rating?.score ?? 0 };
  }
}
