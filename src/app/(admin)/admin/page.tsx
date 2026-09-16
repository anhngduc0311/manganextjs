import React from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Layers, Users, MessageSquare, AlertTriangle, Eye, TrendingUp, ArrowRight, CheckCircle, Flame } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/admin/StatsCard";

export const metadata = {
  title: "Tổng Quan Quản Trị — TruyenKomi Admin",
};

export default async function AdminDashboardPage() {
  // Fetch high level statistics in parallel
  const [
    totalComics,
    totalChapters,
    totalUsers,
    pendingReports,
    topComics,
    latestReports,
    latestComments,
  ] = await Promise.all([
    prisma.comic.count(),
    prisma.chapter.count(),
    prisma.user.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.comic.findMany({
      orderBy: { views: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true, coverImage: true, views: true, ratingAvg: true },
    }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        chapter: {
          select: { chapterNumber: true, comic: { select: { title: true, slug: true } } },
        },
      },
    }),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        user: { select: { username: true, avatar: true } },
        comic: { select: { title: true, slug: true } },
      },
    }),
  ]);


  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-r from-orange-500/15 via-zinc-900 to-zinc-900 p-6 sm:p-8">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/30">
            <Flame className="h-3.5 w-3.5" /> Hệ Thống Vận Hành Serverless
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Trung Tâm Quản Trị TruyenKomi
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Theo dõi tổng quan tài nguyên truyện, các chương mới, báo cáo lỗi từ độc giả và hoạt động bình luận trong ngày.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Tổng Bộ Truyện"
          value={totalComics.toLocaleString()}
          icon={BookOpen}
          color="orange"
          description="Đang hoạt động trong kho"
          trend={{ value: "+100% cloud", isPositive: true }}
        />
        <StatsCard
          title="Tổng Số Chương"
          value={totalChapters.toLocaleString()}
          icon={Layers}
          color="blue"
          description="Lưu trữ trên R2 CDN"
        />
        <StatsCard
          title="Thành Viên"
          value={totalUsers.toLocaleString()}
          icon={Users}
          color="emerald"
          description="Đã đăng ký tài khoản"
        />
        <StatsCard
          title="Báo Lỗi Chờ Duyệt"
          value={pendingReports.toLocaleString()}
          icon={AlertTriangle}
          color={pendingReports > 0 ? "rose" : "purple"}
          description={pendingReports > 0 ? "Cần quản trị xử lý ngay" : "Tất cả đã được giải quyết"}
          trend={pendingReports > 0 ? { value: "Cần duyệt", isPositive: false } : undefined}
        />
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Read Comics Column (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Comics Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-bold text-zinc-100">Truyện Xem Nhiều Nhất</h3>
              </div>
              <Link
                href="/admin/comics"
                className="text-xs font-semibold text-orange-400 hover:underline flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {topComics.map((comic, idx) => (
                <div key={comic.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-400">
                      {idx + 1}
                    </span>
                    <div className="relative aspect-[3/4] w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                      <Image
                        src={comic.coverImage || "/icons/icon-192.png"}
                        alt={comic.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/comics/${comic.slug}`}
                        className="truncate block text-xs font-bold text-zinc-200 hover:text-orange-400 transition"
                      >
                        {comic.title}
                      </Link>
                      <p className="text-[11px] text-zinc-500">Đánh giá: ⭐ {comic.ratingAvg.toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-zinc-300 shrink-0">
                    <Eye className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{Number(comic.views).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/admin/comics"
              className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-orange-500/40 hover:bg-zinc-800/50 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 group-hover:scale-110 transition">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-200">Thêm Truyện Mới</p>
                <p className="text-[11px] text-zinc-500">Tạo metadata & bìa</p>
              </div>
            </Link>

            <Link
              href="/admin/chapters"
              className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-blue-500/40 hover:bg-zinc-800/50 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-200">Upload Chương</p>
                <p className="text-[11px] text-zinc-500">Đăng trang ảnh R2</p>
              </div>
            </Link>

            <Link
              href="/admin/reports"
              className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-rose-500/40 hover:bg-zinc-800/50 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-200">Xem Báo Lỗi</p>
                <p className="text-[11px] text-zinc-500">{pendingReports} mục cần xử lý</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Sidebar Activity Feeds */}
        <div className="space-y-6">
          {/* Pending Reports Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <h3 className="text-sm font-bold text-zinc-100">Báo Lỗi Gần Đây</h3>
              </div>
              <Link href="/admin/reports" className="text-[11px] font-semibold text-rose-400 hover:underline">
                Chi tiết
              </Link>
            </div>

            {latestReports.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 flex flex-col items-center gap-1">
                <CheckCircle className="h-6 w-6 text-emerald-500/80 mb-1" />
                Không có báo lỗi nào đang chờ xử lý!
              </div>
            ) : (
              <div className="space-y-2.5">
                {latestReports.map((r) => (
                  <div key={r.id} className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-400 truncate max-w-[150px]">
                        {r.chapter.comic.title}
                      </span>
                      <span className="text-[10px] text-zinc-500">Ch. {r.chapter.chapterNumber}</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] line-clamp-1">{r.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Comments Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-bold text-zinc-100">Bình Luận Mới</h3>
              </div>
              <Link href="/admin/comments" className="text-[11px] font-semibold text-orange-400 hover:underline">
                Quản lý
              </Link>
            </div>

            {latestComments.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">Chưa có bình luận nào</div>
            ) : (
              <div className="space-y-2.5">
                {latestComments.map((c) => (
                  <div key={c.id} className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-200">{c.user?.username || "Ẩn danh"}</span>
                      <span className="text-[10px] text-zinc-500 truncate max-w-[100px]">{c.comic.title}</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] line-clamp-2">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
