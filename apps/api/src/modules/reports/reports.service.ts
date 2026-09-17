import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateReportDto, ResolveReportDto } from "./dto/reports.dto";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(userId: string | null, dto: CreateReportDto) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: dto.chapterId },
      select: { id: true },
    });
    if (!chapter) {
      throw new NotFoundException("Chương không tồn tại");
    }

    return this.prisma.report.create({
      data: {
        chapterId: dto.chapterId,
        reason: dto.reason,
        userId: userId ?? null,
      },
    });
  }

  async listReports(page = 1, perPage = 30, status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: { select: { id: true, username: true } },
          chapter: {
            select: {
              id: true,
              chapterNumber: true,
              comic: { select: { title: true, slug: true } },
            },
          },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  }

  async resolveReport(reportId: string, dto: ResolveReportDto) {
    const existing = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!existing) {
      throw new NotFoundException("Báo cáo không tồn tại");
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: { status: dto.status },
    });
  }
}
