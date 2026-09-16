import React from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { User, Trophy, Flame, Bookmark, MessageSquare, Shield, Calendar } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { levelProgress } from "@/lib/leveling";

export const metadata = {
  title: "Hồ Sơ Cá Nhân & Cấp Bậc — TruyenKomi",
  description: "Xem hồ sơ cá nhân, tiến trình EXP, cấp bậc độc giả và chuỗi ngày đọc truyện liên tục.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/profile");
  }

  const [user, followsCount, commentsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        exp: true,
        level: true,
        dailyStreak: true,
        createdAt: true,
        lastActiveAt: true,
      },
    }),
    prisma.follow.count({ where: { userId: session.user.id } }),
    prisma.comment.count({ where: { userId: session.user.id } }),
  ]);

  if (!user) {
    redirect("/login");
  }

  const progress = levelProgress(user.exp);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 p-1 ring-4 ring-orange-500/20 shadow-xl">
            <div className="relative h-full w-full rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center font-bold text-3xl text-orange-400">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.username} fill sizes="96px" className="object-cover" />
              ) : (
                user.username[0]?.toUpperCase() || "U"
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex flex-1 flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-zinc-100">{user.username}</h1>
              <span className="rounded-md bg-orange-500/20 px-2.5 py-0.5 text-xs font-bold text-orange-400 border border-orange-500/30">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-zinc-400">{user.email}</p>
            <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Gia nhập: {new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Level & EXP Progress */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-bold text-zinc-100">Cấp Bậc & Điểm Kinh Nghiệm (EXP)</h2>
          </div>
          <span className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-1 text-xs font-black text-white shadow-md shadow-orange-500/20">
            CẤP {progress.level}
          </span>
        </div>

        {/* EXP Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-400">Tiến trình lên Cấp {progress.level + 1}</span>
            <span className="text-orange-400 font-bold">
              {progress.exp} / {progress.nextFloor} EXP ({progress.progressPct}%)
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
              style={{ width: `${progress.progressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-500 text-right">
            Còn thiếu {progress.nextFloor - progress.exp} EXP để thăng cấp tiếp theo
          </p>
        </div>

        {/* How to get EXP Guide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-800/40 p-3">
            <p className="font-bold text-orange-400">+20 EXP</p>
            <p className="mt-1 text-[11px] text-zinc-400">Đăng nhập mỗi ngày</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-800/40 p-3">
            <p className="font-bold text-amber-400">+5 EXP</p>
            <p className="mt-1 text-[11px] text-zinc-400">Đọc 1 chương truyện</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-800/40 p-3">
            <p className="font-bold text-emerald-400">+10 EXP</p>
            <p className="mt-1 text-[11px] text-zinc-400">Gửi 1 bình luận</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-800/40 p-3">
            <p className="font-bold text-sky-400">+10 EXP</p>
            <p className="mt-1 text-[11px] text-zinc-400">Đánh giá sao truyện</p>
          </div>
        </div>
      </div>

      {/* Activity Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-100">{user.dailyStreak || 0}</p>
            <p className="text-xs text-zinc-400">Chuỗi ngày đọc (Streak)</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
            <Bookmark className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-100">{followsCount}</p>
            <p className="text-xs text-zinc-400">Truyện đang theo dõi</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-100">{commentsCount}</p>
            <p className="text-xs text-zinc-400">Bình luận đã gửi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
