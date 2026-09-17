import React from "react";
import { Heart, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { PrefetchLink } from "@/components/common/PrefetchLink";

export function Footer() {
  const topKeywords = [
    { label: "Truyện Tranh Online", href: "/comics" },
    { label: "Manhwa Hay", href: "/comics?genres=manhwa" },
    { label: "Manga Nhật Bản", href: "/comics?genres=manga" },
    { label: "Manhua Trung Quốc", href: "/comics?genres=manhua" },
    { label: "Chuyển Sinh", href: "/comics?genres=chuyen-sinh" },
    { label: "Tu Tiên", href: "/comics?genres=tu-tien" },
    { label: "Hành Động", href: "/comics?genres=action" },
    { label: "Ngôn Tình", href: "/comics?genres=romance" },
    { label: "Đô Thị", href: "/comics?genres=do-thi" },
    { label: "Hài Hước", href: "/comics?genres=comedy" },
    { label: "Truyện Full", href: "/comics?status=COMPLETED" },
  ];

  return (
    <footer className="mt-16 border-t border-zinc-800/80 bg-[#121216] py-12 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Keywords / Genre Tags */}
        <div className="rounded-2xl border border-zinc-800 bg-[#16161b] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Từ Khóa Tìm Kiếm Nổi Bật
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {topKeywords.map((item) => (
              <PrefetchLink
                key={item.label}
                href={item.href}
                className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:bg-orange-500/20 hover:text-orange-400 transition"
              >
                {item.label}
              </PrefetchLink>
            ))}
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <PrefetchLink href="/" className="flex items-center gap-2 font-black text-xl text-zinc-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/25">
                <span className="font-black text-lg">K</span>
              </div>
              <span className="text-lg">
                Truyen<span className="text-orange-500">Komi</span>
              </span>
            </PrefetchLink>
            <p className="max-w-md text-xs leading-relaxed text-zinc-400">
              Nền tảng đọc truyện tranh trực tuyến hiện đại. Cung cấp hàng ngàn bộ truyện tranh Manhwa, Manga, Manhua hot nhất mỗi ngày với tốc độ tải siêu tốc không quảng cáo chen ngang.
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Tải trang siêu tốc
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Server Edge Caching
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Khám Phá</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <PrefetchLink href="/comics" className="hover:text-orange-400 transition">
                  Tất cả truyện tranh
                </PrefetchLink>
              </li>
              <li>
                <PrefetchLink href="/categories" className="hover:text-orange-400 transition">
                  Danh mục thể loại
                </PrefetchLink>
              </li>
              <li>
                <PrefetchLink href="/comics?sort=views" className="hover:text-orange-400 transition">
                  Bảng xếp hạng Top
                </PrefetchLink>
              </li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Chính Sách & Hỗ Trợ</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mọi nội dung trên website đều được tổng hợp và sưu tầm phi thương mại từ cộng đồng. Nếu có vấn đề bản quyền, vui lòng liên hệ ban quản trị.
            </p>
            <p className="text-xs text-zinc-400">
              Email liên hệ: <span className="text-orange-400">contact@truyenkomi.com</span>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-800/80 pt-6 text-xs text-zinc-400 sm:flex-row">
          <p>© {new Date().getFullYear()} TruyenKomi. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Thiết kế giao diện phong cách TruyenGG với <Heart className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}

