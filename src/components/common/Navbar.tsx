"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, Layers, Bookmark, History, Menu, X } from "lucide-react";
import { SearchAutocomplete } from "./SearchAutocomplete";
import { ThemeSelector } from "./ThemeSelector";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserNav } from "./UserNav";
import type { Role, NotificationDTO } from "@/types";

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
}

export function Navbar({ user, notifications }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Trang chủ", icon: <BookOpen className="h-4 w-4" /> },
    { href: "/comics", label: "Khám phá", icon: <Compass className="h-4 w-4" /> },
    { href: "/categories", label: "Thể loại", icon: <Layers className="h-4 w-4" /> },
    { href: "/followed", label: "Theo dõi", icon: <Bookmark className="h-4 w-4" /> },
    { href: "/history", label: "Lịch sử", icon: <History className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Main Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-black tracking-tight text-xl text-zinc-100 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              K
            </span>
            <span className="hidden sm:inline-block">
              Truyen<span className="text-orange-500">Komi</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                    isActive
                      ? "bg-orange-500/10 text-orange-400"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-md hidden sm:block">
          <SearchAutocomplete />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <ThemeSelector />
          <NotificationDropdown notifications={notifications} />
          <UserNav user={user} />

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 md:hidden"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden space-y-3">
          <div className="sm:hidden">
            <SearchAutocomplete />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  pathname === link.href
                    ? "bg-orange-500/10 text-orange-400"
                    : "text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
