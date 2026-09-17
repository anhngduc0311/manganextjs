"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  Flame,
  Trophy,
  Compass,
  Bookmark,
  History,
  Layers,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Star,
  Clock,
} from "lucide-react";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import { SearchAutocomplete } from "./SearchAutocomplete";
import { ThemeSelector } from "./ThemeSelector";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserNav } from "./UserNav";
import type { Role, NotificationDTO, CategoryDTO } from "@/types";

interface NavbarProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: Role;
    level?: number;
    dailyStreak?: number;
  } | null;
  notifications?: NotificationDTO[];
  categories?: CategoryDTO[];
}

export function Navbar({ user, notifications, categories = [] }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const rankingRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
      if (rankingRef.current && !rankingRef.current.contains(e.target as Node)) {
        setRankingOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setCategoryOpen(false);
    setRankingOpen(false);
  }, [pathname]);

  const rankingItems = [
    {
      label: "Top Toàn Thời Gian",
      href: "/comics?sort=views",
      icon: <TrendingUp className="h-4 w-4 text-orange-400" />,
      desc: "Nhiều lượt đọc nhất",
    },
    {
      label: "Top Ngày",
      href: "/comics?sort=daily_views",
      icon: <Flame className="h-4 w-4 text-rose-400" />,
      desc: "Thịnh hành hôm nay",
    },
    {
      label: "Top Tuần",
      href: "/comics?sort=weekly_views",
      icon: <Calendar className="h-4 w-4 text-amber-400" />,
      desc: "Nổi bật 7 ngày qua",
    },
    {
      label: "Top Tháng",
      href: "/comics?sort=monthly_views",
      icon: <Trophy className="h-4 w-4 text-yellow-400" />,
      desc: "Bảng vàng tháng này",
    },
    {
      label: "Đánh Giá Cao",
      href: "/comics?sort=rating",
      icon: <Star className="h-4 w-4 text-amber-400" />,
      desc: "Điểm rating cao nhất",
    },
    {
      label: "Mới Cập Nhật",
      href: "/comics?sort=updatedAt",
      icon: <Clock className="h-4 w-4 text-sky-400" />,
      desc: "Chương mới nhất",
    },
    {
      label: "Truyện Đã Hoàn Thành",
      href: "/comics?status=COMPLETED",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      desc: "Đọc trọn bộ",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#121216]/95 backdrop-blur-xl shadow-lg transition-colors">
      {/* Top Header Bar: Brand, Search, User/Auth */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <PrefetchLink
            href="/"
            className="flex items-center gap-2 font-black tracking-tight text-xl text-zinc-100 group active:scale-95 transition-transform"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
              <span className="font-black text-xl">K</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight leading-none text-zinc-100 sm:text-xl">
                Truyen<span className="text-orange-500">Komi</span>
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase hidden sm:block">
                Truyện Tranh Online
              </span>
            </div>
          </PrefetchLink>
        </div>

        {/* Center: Live Search Box */}
        <div className="flex-1 max-w-xl mx-2 hidden md:block">
          <SearchAutocomplete />
        </div>

        {/* Right: Actions (Theme, Notification, User / Auth, Mobile Toggle) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeSelector />
          <NotificationDropdown notifications={notifications} />
          <UserNav user={user} />

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-300 md:hidden hover:bg-zinc-800 transition"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Bottom Header Bar: Desktop Nav Menu (TruyenGG Style) */}
      <div className="hidden md:block border-t border-zinc-800/60 bg-[#16161b]">
        <div className="mx-auto flex h-11 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 text-[13px] font-bold">
            {/* Trang Chủ */}
            <PrefetchLink
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                pathname === "/"
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Trang Chủ</span>
            </PrefetchLink>

            {/* Thể Loại Mega Dropdown */}
            <div
              ref={categoryRef}
              className="relative"
              onMouseEnter={() => setCategoryOpen(true)}
              onMouseLeave={() => setCategoryOpen(false)}
            >
              <button
                type="button"
                onClick={() => setCategoryOpen(!categoryOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                  categoryOpen || pathname.startsWith("/categories")
                    ? "bg-orange-500/15 text-orange-400"
                    : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Thể Loại</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    categoryOpen ? "rotate-180 text-orange-400" : "text-zinc-400"
                  }`}
                />
              </button>

              {/* Mega Menu Dropdown Box */}
              {categoryOpen && (
                <div className="absolute left-0 top-full pt-1.5 z-50 w-[680px] origin-top-left animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="rounded-2xl border border-zinc-700/80 bg-[#18181e] p-4 shadow-2xl shadow-black/80 backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase tracking-wider">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Danh Sách Thể Loại ({categories.length})</span>
                      </div>
                      <PrefetchLink
                        href="/categories"
                        className="text-[11px] font-semibold text-zinc-400 hover:text-orange-400 transition"
                      >
                        Xem tất cả thể loại &rarr;
                      </PrefetchLink>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 max-h-[360px] overflow-y-auto pr-1">
                      {categories.map((cat) => (
                        <PrefetchLink
                          key={cat.id}
                          href={`/comics?genres=${cat.slug}`}
                          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-orange-400 transition group"
                        >
                          <span className="truncate">{cat.name}</span>
                          {cat.comicCount !== undefined && (
                            <span className="text-[10px] text-zinc-400 group-hover:text-zinc-400">
                              {cat.comicCount}
                            </span>
                          )}
                        </PrefetchLink>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Xếp Hạng Dropdown */}
            <div
              ref={rankingRef}
              className="relative"
              onMouseEnter={() => setRankingOpen(true)}
              onMouseLeave={() => setRankingOpen(false)}
            >
              <button
                type="button"
                onClick={() => setRankingOpen(!rankingOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                  rankingOpen
                    ? "bg-orange-500/15 text-orange-400"
                    : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                }`}
              >
                <Trophy className="h-4 w-4" />
                <span>Xếp Hạng</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    rankingOpen ? "rotate-180 text-orange-400" : "text-zinc-400"
                  }`}
                />
              </button>

              {/* Ranking Dropdown Menu */}
              {rankingOpen && (
                <div className="absolute left-0 top-full pt-1.5 z-50 w-64 origin-top-left animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="rounded-2xl border border-zinc-700/80 bg-[#18181e] p-2 shadow-2xl shadow-black/80 space-y-0.5">
                    {rankingItems.map((item) => (
                      <PrefetchLink
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 rounded-xl p-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800/90 hover:text-orange-400 transition group"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 group-hover:bg-zinc-700/80 transition">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate leading-none">{item.label}</p>
                          <p className="text-[10px] text-zinc-400 mt-1 font-normal">{item.desc}</p>
                        </div>
                      </PrefetchLink>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tìm Truyện (Advanced Filter) */}
            <PrefetchLink
              href="/comics"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                pathname === "/comics"
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Tìm Truyện</span>
            </PrefetchLink>

            {/* Manhwa */}
            <PrefetchLink
              href="/comics?genres=manhwa"
              className="px-3 py-1.5 rounded-md text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition"
            >
              Manhwa
            </PrefetchLink>

            {/* Manga */}
            <PrefetchLink
              href="/comics?genres=manga"
              className="px-3 py-1.5 rounded-md text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition"
            >
              Manga
            </PrefetchLink>

            {/* Manhua */}
            <PrefetchLink
              href="/comics?genres=manhua"
              className="px-3 py-1.5 rounded-md text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition"
            >
              Manhua
            </PrefetchLink>

            {/* Theo Dõi */}
            <PrefetchLink
              href="/followed"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                pathname === "/followed"
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
              }`}
            >
              <Bookmark className="h-4 w-4" />
              <span>Theo Dõi</span>
            </PrefetchLink>

            {/* Lịch Sử */}
            <PrefetchLink
              href="/history"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                pathname === "/history"
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
              }`}
            >
              <History className="h-4 w-4" />
              <span>Lịch Sử</span>
            </PrefetchLink>
          </nav>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-zinc-800 bg-[#141419] px-4 py-4 md:hidden space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Mobile Search Bar */}
          <div>
            <SearchAutocomplete />
          </div>

          {/* Quick Primary Links */}
          <div className="grid grid-cols-2 gap-2">
            <PrefetchLink
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-zinc-900/80 p-3 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
            >
              <Home className="h-4 w-4 text-orange-400" />
              <span>Trang Chủ</span>
            </PrefetchLink>
            <PrefetchLink
              href="/comics"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-zinc-900/80 p-3 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
            >
              <Compass className="h-4 w-4 text-sky-400" />
              <span>Tìm Truyện</span>
            </PrefetchLink>
            <PrefetchLink
              href="/followed"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-zinc-900/80 p-3 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
            >
              <Bookmark className="h-4 w-4 text-emerald-400" />
              <span>Theo Dõi</span>
            </PrefetchLink>
            <PrefetchLink
              href="/history"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-zinc-900/80 p-3 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
            >
              <History className="h-4 w-4 text-amber-400" />
              <span>Lịch Sử</span>
            </PrefetchLink>
          </div>

          {/* Quick Category tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <span>Thể loại hot</span>
              <PrefetchLink
                href="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="text-orange-400"
              >
                Tất cả &rarr;
              </PrefetchLink>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.slice(0, 12).map((cat) => (
                <PrefetchLink
                  key={cat.id}
                  href={`/comics?genres=${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:bg-orange-500/20 hover:text-orange-400 transition"
                >
                  {cat.name}
                </PrefetchLink>
              ))}
            </div>
          </div>

          {/* Rankings Section */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Bảng Xếp Hạng
            </span>
            <div className="grid grid-cols-2 gap-2">
              {rankingItems.slice(0, 4).map((item) => (
                <PrefetchLink
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg bg-zinc-900/60 p-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </PrefetchLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

