import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { RecordViewDto } from "./dto/views.dto";

@Injectable()
export class ViewsService {
  private readonly logger = new Logger(ViewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async recordView(dto: RecordViewDto) {
    // Increment in PostgreSQL
    await this.prisma.$transaction([
      this.prisma.comic.update({
        where: { id: dto.comicId },
        data: {
          views: { increment: 1 },
          weeklyViews: { increment: 1 },
          monthlyViews: { increment: 1 },
        },
      }),
      this.prisma.chapter.update({
        where: { id: dto.chapterId },
        data: {
          views: { increment: 1 },
        },
      }),
    ]);

    return { success: true };
  }
}
