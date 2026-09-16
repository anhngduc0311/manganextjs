"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { commentService } from "@/services/comment.service";
import { checkRateLimit, writeLimiter } from "@/lib/rate-limiter";
import { commentSchema } from "@/types/schemas";
import type { ActionResult, CommentDTO } from "@/types";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function addCommentAction(input: {
  comicId: string;
  chapterId?: string | null;
  content: string;
  parentId?: string | null;
}): Promise<ActionResult<CommentDTO>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Bạn cần đăng nhập để bình luận" };

  const limit = await checkRateLimit(writeLimiter, `comment:${session.user.id}`);
  if (!limit.success) return { ok: false, error: `Bình luận quá nhanh, thử lại sau ${limit.retryAfter}s` };

  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  try {
    const created = await commentService.create({
      userId: session.user.id,
      comicId: parsed.data.comicId,
      chapterId: parsed.data.chapterId ?? null,
      content: parsed.data.content,
      parentId: parsed.data.parentId ?? null,
    });
    revalidatePath("/comics", "layout");
    return { ok: true, data: created };
  } catch {
    return { ok: false, error: "Không thể gửi bình luận, thử lại sau" };
  }
}

export async function likeCommentAction(commentId: string): Promise<ActionResult<{ likes: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Bạn cần đăng nhập" };
  try {
    const likes = await commentService.like(commentId);
    return { ok: true, data: { likes } };
  } catch {
    return { ok: false, error: "Không thể thích bình luận" };
  }
}

export async function deleteCommentAction(commentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Bạn cần đăng nhập" };
  if (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN") {
    return { ok: false, error: "Không có quyền" };
  }
  await commentService.remove(commentId);
  revalidatePath("/admin/comments");
  return { ok: true };
}
