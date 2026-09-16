import React from "react";
import Link from "next/link";
import { Flame, Clock, Compass, ArrowRight } from "lucide-react";
import { comicService } from "@/services/comic.service";
import { ComicCarousel } from "@/components/comic/ComicCarousel";
import { ComicGrid } from "@/components/comic/ComicGrid";
import type { ComicCardDTO } from "@/types";

export const revalidate = 60; // ISR cache 60s

export const metadata = {
  title: "TruyenKomi — Nền Tảng Đọc Truyện Tranh Online Hàng Đầu",
  description: "Trang chủ TruyenKomi - Cập nhật hàng ngàn bộ truyện tranh Manga, Manhwa, Manhua hot nhất mỗi ngày với tốc độ tải siêu tốc.",
};

export default async function HomePage() {
  let feed: { hot: ComicCardDTO[]; latest: ComicCardDTO[] } = { hot: [], latest: [] };

  try {
    feed = await comicService.getHomeFeed();
  } catch (error) {
    console.error("Home feed fetch error:", error);
  }


  const { hot = [], latest = [] } = feed;

  return (
    <div className="space-y-12">
      {/* Hero Banner Carousel */}
      {hot.length > 0 && (
        <section>
          <ComicCarousel comics={hot.slice(0, 5)} />
        </section>
      )}

      {/* Hot Comics Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
              <Flame className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-zinc-100 sm:text-xl">
              Truyện Hot Đang Thịnh Hành
            </h2>
          </div>
          <Link
            href="/comics?sort=views"
            className="group flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 transition"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <ComicGrid comics={hot} emptyMessage="Chưa có truyện hot nào." />
      </section>

      {/* Latest Updates Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
              <Clock className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-zinc-100 sm:text-xl">
              Mới Cập Nhật Hôm Nay
            </h2>
          </div>
          <Link
            href="/comics?sort=updatedAt"
            className="group flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 transition"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <ComicGrid comics={latest} emptyMessage="Chưa có truyện mới cập nhật." />
      </section>

      {/* Quick Navigation Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
        <Link
          href="/categories"
          className="group flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-orange-500/40 hover:bg-zinc-800/60"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 group-hover:scale-110 transition-transform">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 group-hover:text-orange-400 transition">
              Khám Phá Theo Thể Loại
            </h3>
            <p className="mt-1 text-xs text-zinc-400">Hành động, Chuyển sinh, Tình cảm, Hài hước...</p>
          </div>
        </Link>

        <Link
          href="/comics?status=COMPLETED"
          className="group flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-orange-500/40 hover:bg-zinc-800/60"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-transform">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition">
              Truyện Đã Hoàn Thành
            </h3>
            <p className="mt-1 text-xs text-zinc-400">Đọc trọn bộ từ đầu đến cuối không cần chờ chương mới</p>
          </div>
        </Link>

        <Link
          href="/offline"
          className="group flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-orange-500/40 hover:bg-zinc-800/60 sm:col-span-2 md:col-span-1"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 group-hover:scale-110 transition-transform">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 group-hover:text-purple-400 transition">
              Tủ Truyện Offline PWA
            </h3>
            <p className="mt-1 text-xs text-zinc-400">Tải các chương về máy và đọc mượt mà khi không có mạng</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
