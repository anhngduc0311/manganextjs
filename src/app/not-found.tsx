import React from "react";
import Link from "next/link";
import { Home, Compass, Search, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6">
        {/* Glowing Background Ring */}
        <div className="absolute inset-0 -z-10 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="flex items-center justify-center h-28 w-28 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
          <BookOpen className="h-14 w-14 text-orange-500 animate-pulse" />
        </div>
      </div>

      <span className="rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/20 mb-3">
        Lỗi 404 • Không tìm thấy
      </span>

      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
        Trang không tồn tại
      </h1>

      <p className="max-w-md text-sm sm:text-base text-zinc-400 mb-8 leading-relaxed">
        Trang truyện hoặc đường dẫn bạn đang truy cập có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition"
        >
          <Home className="h-4 w-4" /> Về Trang Chủ
        </Link>
        <Link
          href="/comics"
          className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
        >
          <Compass className="h-4 w-4" /> Khám Phá Truyện
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
        >
          <Search className="h-4 w-4" /> Tìm Kiếm
        </Link>
      </div>
    </div>
  );
}
