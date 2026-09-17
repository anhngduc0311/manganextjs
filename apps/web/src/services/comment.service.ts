import sanitizeHtml from "sanitize-html";
import { prisma } from "@/lib/prisma";
import { gamificationService } from "@/services/gamification.service";
import { EXP_PER_COMMENT } from "@/lib/leveling";
import type { CommentDTO } from "@/types";
import type { Prisma } from "@prisma/client";

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

function mapComment(c: CommentWithRelations): CommentDTO {
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

export const commentService = {
  async list(comicId: string, chapterId: string | null, page = 1, perPage = 20) {
    const where: Prisma.CommentWhereInput = chapterId ? { comicId, chapterId } : { comicId, chapterId: null };
    const [items, total] = await Promise.all([
      prisma.comment.findMany({
        where: { ...where, parentId: null },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: commentInclude,
      }),
      prisma.comment.count({ where }),
    ]);
    return {
      items: items.map(mapComment),
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  },

  async create(input: {
    userId: string;
    comicId: string;
    chapterId?: string | null;
    content: string;
    parentId?: string | null;
  }): Promise<CommentDTO> {
    const { content, isSpoiler } = sanitizeComment(input.content);
    if (content.length === 0) throw new Error("Noi dung binh luan khong hop le");

    let comicId = input.comicId;
    if (input.parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: input.parentId }, select: { comicId: true } });
      if (parent) comicId = parent.comicId;
    }

    const created = await prisma.comment.create({
      data: {
        userId: input.userId,
        comicId,
        chapterId: input.chapterId ?? null,
        parentId: input.parentId ?? null,
        content,
        isSpoiler,
      },
      include: commentInclude,
    });
    await gamificationService.awardExp(input.userId, EXP_PER_COMMENT).catch(() => {});
    return mapComment(created);
  },

  async like(commentId: string): Promise<number> {
    const updated = await prisma.comment.update({ where: { id: commentId }, data: { likes: { increment: 1 } }, select: { likes: true } });
    return updated.likes;
  },

  async remove(commentId: string): Promise<void> {
    await prisma.comment.delete({ where: { id: commentId } });
  },

  async listForModeration(page = 1, perPage = 30, search = "") {
    const where: Prisma.CommentWhereInput = search ? { content: { contains: search, mode: "insensitive" } } : {};
    const [items, total] = await Promise.all([
      prisma.comment.findMany({
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
      prisma.comment.count({ where }),
    ]);
    return { items, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
  },
};
