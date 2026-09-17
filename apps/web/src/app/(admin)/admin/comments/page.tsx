import React from "react";
import { prisma } from "@/lib/prisma";
import {
  CommentsModerationTable,
  type CommentModerationRow,
} from "@/components/admin/CommentsModerationTable";

export const metadata = {
  title: "Kiểm Duyệt Bình Luận — TruyenKomi Admin",
};

export default async function AdminCommentsPage() {
  const commentsRows = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: { id: true, username: true, avatar: true, role: true, level: true },
      },
      comic: {
        select: { title: true, slug: true },
      },
      chapter: {
        select: { chapterNumber: true },
      },
    },
  });

  const comments: CommentModerationRow[] = commentsRows.map((c) => ({
    id: c.id,
    content: c.content,
    isSpoiler: c.isSpoiler,
    likes: c.likes,
    createdAt: c.createdAt.toISOString(),
    user: c.user
      ? {
          id: c.user.id,
          username: c.user.username,
          avatar: c.user.avatar,
          role: c.user.role,
          level: c.user.level,
        }
      : {
          id: "anon",
          username: "Ẩn danh",
          avatar: null,
          role: "USER",
          level: 1,
        },
    comic: {
      title: c.comic.title,
      slug: c.comic.slug,
    },
    chapter: c.chapter ? { chapterNumber: c.chapter.chapterNumber } : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Kiểm Duyệt Bình Luận
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Theo dõi các thảo luận cộng đồng, xử lý ngôn từ không phù hợp và xóa bình luận vi phạm chính sách.
        </p>
      </div>

      <CommentsModerationTable comments={comments} />
    </div>
  );
}
