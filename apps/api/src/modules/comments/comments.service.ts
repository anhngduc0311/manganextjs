import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@truyenkomi/database";
import sanitizeHtml from "sanitize-html";
import { computeLevel, EXP_PER_COMMENT } from "@/common/utils/leveling";
import { CreateCommentDto } from "./dto/comments.dto";

const commentUserSelect = {
  id: true,
  username: true,
  avatar: true,
  level: true,
} as const;

const replyInclude = { user: { select: commentUserSelect } } satisfies Prisma.CommentInclude;

const commentInclude = {
  user: { select: commentUserSelect },
  replies: { orderBy: { createdAt: "asc" as const }, include: replyInclude },
} satisfies Prisma.CommentInclude;

type CommentWithRelations = Prisma.CommentGetPayload<{ include: typeof commentInclude }>;

function mapComment(c: CommentWithRelations) {
  return {
    id: c.id,
    content: c.content,
    isSpoiler: c.isSpoiler,
    likes: c.likes,
    createdAt: c.createdAt.toISOString(),
    comicId: c.comicId,
    chapterId: c.chapterId,
    user: c.user ?? { id: "", username: "người dùng đã xóa", avatar: null, level: 1 },
    replies: c.replies.map((r) => ({
      id: r.id,
      content: r.content,
      isSpoiler: r.isSpoiler,
      likes: r.likes,
      createdAt: r.createdAt.toISOString(),
      comicId: r.comicId,
      chapterId: r.chapterId,
      user: r.user ?? { id: "", username: "người dùng đã xóa", avatar: null, level: 1 },
      replies: [],
    })),
  };
}

export function sanitizeComment(raw: string): { content: string; isSpoiler: boolean } {
  const cleaned = sanitizeHtml(raw, { allowedTags: [], allowedAttributes: {}, disallowedTagsMode: "escape" });
  const isSpoiler = /\[spoil\]/i.test(cleaned);
  return { content: cleaned.trim().slice(0, 2000), isSpoiler };
}

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(comicId: string, chapterId: string | null = null, page = 1, perPage = 20) {
    const where: Prisma.CommentWhereInput = chapterId ? { comicId, chapterId } : { comicId, chapterId: null };
    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { ...where, parentId: null },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: commentInclude,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      items: items.map(mapComment),
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  }

  async create(userId: string, dto: CreateCommentDto) {
    const { content, isSpoiler } = sanitizeComment(dto.content);
    if (content.length === 0) {
      throw new BadRequestException("Nội dung bình luận không hợp lệ");
    }

    let comicId = dto.comicId;
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { comicId: true },
      });
      if (parent) comicId = parent.comicId;
    }

    const created = await this.prisma.comment.create({
      data: {
        userId,
        comicId,
        chapterId: dto.chapterId ?? null,
        parentId: dto.parentId ?? null,
        content,
        isSpoiler,
      },
      include: commentInclude,
    });

    // Award EXP
    await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { exp: { increment: EXP_PER_COMMENT } },
        select: { exp: true },
      });
      await tx.user.update({
        where: { id: userId },
        data: { level: computeLevel(u.exp) },
      });
    }).catch(() => {});

    return mapComment(created);
  }

  async like(commentId: string) {
    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { likes: { increment: 1 } },
      select: { likes: true },
    });
    return { likes: updated.likes };
  }

  async remove(commentId: string) {
    const existing = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) {
      throw new NotFoundException("Bình luận không tồn tại");
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  }

  async listForModeration(page = 1, perPage = 30, search = "") {
    const where: Prisma.CommentWhereInput = search ? { content: { contains: search, mode: "insensitive" } } : {};
    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: { select: commentUserSelect },
          comic: { select: { title: true, slug: true } },
          chapter: { select: { chapterNumber: true } },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  }
}
