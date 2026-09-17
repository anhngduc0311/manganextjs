import React from "react";
import { prisma } from "@/lib/prisma";
import {
  ReportsModerationTable,
  type ReportRow,
} from "@/components/admin/ReportsModerationTable";

export const metadata = {
  title: "Xử Lý Báo Lỗi — TruyenKomi Admin",
};

export default async function AdminReportsPage() {
  const reportsRows = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { username: true },
      },
      chapter: {
        select: {
          id: true,
          chapterNumber: true,
          comic: {
            select: { title: true, slug: true },
          },
        },
      },
    },
  });

  const reports: ReportRow[] = reportsRows.map((r) => ({
    id: r.id,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    user: r.user ? { username: r.user.username } : null,
    chapter: {
      id: r.chapter.id,
      chapterNumber: r.chapter.chapterNumber,
      comic: {
        title: r.chapter.comic.title,
        slug: r.chapter.comic.slug,
      },
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Xử Lý Báo Lỗi Từ Độc Giả
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Theo dõi các phản hồi về chương ảnh hỏng, mất trang, sai thứ tự và cập nhật trạng thái xử lý.
        </p>
      </div>

      <ReportsModerationTable reports={reports} />
    </div>
  );
}
