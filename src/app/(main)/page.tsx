import React from "react";
import { Zap, ArrowRight, Sparkles } from "lucide-react";
import { comicService } from "@/services/comic.service";
import { HotComicsSlider } from "@/components/comic/HotComicsSlider";
import { ComicGrid } from "@/components/comic/ComicGrid";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import type { ComicCardDTO } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TruyenKomi — Đọc Truyện Tranh Manhwa, Manga, Manhua Online Hay Nhất",
  description:
    "Đọc truyện tranh Manhwa, Manga, Manhua online chất lượng cao, cập nhật chương mới nhất liên tục mỗi ngày tại TruyenKomi với tốc độ tải siêu tốc.",
};

export default async function HomePage() {
  const feed = await comicService.getHomeFeed().catch(() => ({
    hot: [] as ComicCardDTO[],
    latest: [] as ComicCardDTO[],
  }));

  const { hot = [], latest = [] } = feed;

  return (
    <div className="space-y-8">
      {/* 📢 Pinned Notice Banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-[#17171d] p-3.5 sm:px-4 text-xs sm:text-sm text-zinc-300 shadow-lg">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <p className="flex-1 leading-snug">
          <strong className="text-orange-400 font-bold">Chào mừng đến với TruyenKomi:</strong> Đọc
          truyện tranh Manhwa, Manga, Manhua hoàn toàn miễn phí, cập nhật nhanh chóng với chất lượng hình ảnh sắc nét.
        </p>
      </div>

      {/* 🔥 TRUYỆN HOT ĐỀ CỬ (Horizontal Slider) */}
      {hot.length > 0 && (
        <section>
          <HotComicsSlider comics={hot} />
        </section>
      )}

      {/* Main Section: Truyện Mới Cập Nhật (Full Width) */}
      <section className="space-y-6">
        {/* Header & Quick Genre Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <Zap className="h-4 w-4 fill-sky-400/30" />
            </div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-zinc-100">
              Truyện Mới Cập Nhật
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <PrefetchLink
              href="/comics?sort=updatedAt"
              className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm"
            >
              Tất cả
            </PrefetchLink>
            <PrefetchLink
              href="/comics?genres=manhwa"
              className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-orange-400 transition"
            >
              Manhwa
            </PrefetchLink>
            <PrefetchLink
              href="/comics?genres=manga"
              className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-orange-400 transition"
            >
              Manga
            </PrefetchLink>
            <PrefetchLink
              href="/comics?genres=manhua"
              className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-orange-400 transition"
            >
              Manhua
            </PrefetchLink>
          </div>
        </div>

        {/* Comic Grid (Full Width 2 to 6 columns) */}
        <ComicGrid comics={latest} emptyMessage="Chưa có truyện mới cập nhật." />

        {/* Xem Thêm Button */}
        <div className="text-center pt-2">
          <PrefetchLink
            href="/comics?sort=updatedAt"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-800 px-8 py-3 text-sm font-bold text-zinc-200 hover:border-orange-500/50 hover:bg-zinc-800/80 hover:text-orange-400 transition shadow-lg active:scale-[0.98]"
          >
            <span>Xem Thêm Nhiều Truyện Mới Cập Nhật</span>
            <ArrowRight className="h-4 w-4" />
          </PrefetchLink>
        </div>
      </section>
    </div>
  );
}



