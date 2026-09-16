import React from "react";
import Link from "next/link";
import { Heart, ShieldCheck, Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-zinc-800/80 bg-zinc-950/60 py-12 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-black text-xl text-zinc-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-base">
                K
              </span>
              <span>
                Truyen<span className="text-orange-500">Komi</span>
              </span>
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-zinc-400">
              Nền tảng đọc truyện tranh trực tuyến hiện đại. Trải nghiệm đọc mượt mà, tối ưu SEO, hỗ trợ đọc offline PWA
              và tải trang siêu tốc.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> TTFB &lt; 50ms
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Cloudflare Edge
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Khám phá</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/comics" className="hover:text-orange-400 transition">
                  Tất cả truyện tranh
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-orange-400 transition">
                  Thể loại truyện
                </Link>
              </li>
              <li>
                <Link href="/comics?sort=views" className="hover:text-orange-400 transition">
                  Bảng xếp hạng Top
                </Link>
              </li>
              <li>
                <Link href="/offline" className="hover:text-orange-400 transition">
                  Tủ truyện Offline
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Chính sách & Hỗ trợ</h4>
            <p className="text-xs text-zinc-400">
              Mọi nội dung trên website đều được sưu tầm và chia sẻ phi thương mại. Nếu có vi phạm bản quyền, vui lòng
              liên hệ ban quản trị.
            </p>
            <p className="text-xs text-zinc-400">
              Email hỗ trợ: <span className="text-zinc-300">contact@truyenkomi.com</span>
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-800/80 pt-6 text-xs text-zinc-400 sm:flex-row">
          <p>© {new Date().getFullYear()} TruyenKomi. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Thiết kế với <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> bởi TruyenKomi Team
          </p>
        </div>
      </div>
    </footer>
  );
}
