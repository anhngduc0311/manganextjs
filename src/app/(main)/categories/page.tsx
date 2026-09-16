import React from "react";
import Link from "next/link";
import { Layers, BookOpen, ArrowRight } from "lucide-react";
import { comicService } from "@/services/comic.service";

export const metadata = {
  title: "Danh Mục Thể Loại Truyện Tranh — TruyenKomi",
  description: "Tổng hợp tất cả các thể loại truyện tranh phong phú nhất: Hành động, Phiêu lưu, Chuyển sinh, Ngôn tình, Trinh thám...",
};

export default async function CategoriesPage() {
  const categories = await comicService.listCategories().catch(() => []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-orange-500/10 via-zinc-900 to-zinc-900 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">
          <Layers className="h-4 w-4" /> Danh mục tổng hợp
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">Tất Cả Thể Loại</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Khám phá và chọn lọc truyện tranh theo sở thích cá nhân từ hơn {categories.length} thể loại đặc sắc.
        </p>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/comics?genres=${cat.slug}`}
            className="group flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:bg-zinc-800/60 hover:shadow-xl hover:shadow-orange-500/5"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-100 group-hover:text-orange-400 transition">
                  {cat.name}
                </h3>
                <span className="flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-0.5 text-[11px] font-bold text-orange-400">
                  <BookOpen className="h-3 w-3" /> {cat.comicCount || 0}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {cat.description || `Tổng hợp các bộ truyện tranh thể loại ${cat.name} hay nhất.`}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-orange-400 group-hover:text-orange-300 transition">
              <span>Khám phá ngay</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
