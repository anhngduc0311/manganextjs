"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, LogOut, Shield, Bookmark, History, Flame, Trophy } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import type { Role } from "@/types";

interface UserNavProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: Role;
    level?: number;
    dailyStreak?: number;
  } | null;
}

export function UserNav({ user }: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg border border-zinc-700/80 bg-zinc-800/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
        >
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-orange-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 transition"
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  const isAdminOrMod = user.role === "ADMIN" || user.role === "MODERATOR";

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-800/80 p-1 pr-2.5 text-xs text-zinc-200 hover:border-zinc-600 transition cursor-pointer"
        aria-label="Tùy chọn người dùng"
      >
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
          {user.image ? (
            <Image src={user.image} alt={user.name || "User"} fill sizes="28px" className="object-cover" />
          ) : (
            (user.name?.[0] || "U").toUpperCase()
          )}
        </div>
        <span className="max-w-[100px] truncate font-semibold">{user.name || "Độc giả"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-56 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur-xl">
          {/* User Info Header */}
          <div className="border-b border-zinc-800/80 px-3 py-2.5 mb-1">
            <p className="truncate text-xs font-bold text-zinc-100">{user.name}</p>
            <p className="truncate text-[11px] text-zinc-400">{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-md bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/30">
                <Trophy className="h-2.5 w-2.5" /> Lv.{user.level || 1}
              </span>
              {(user.dailyStreak ?? 0) > 0 && (
                <span className="flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                  <Flame className="h-2.5 w-2.5" /> {user.dailyStreak} ngày
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-0.5">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              <User className="h-3.5 w-3.5 text-zinc-400" /> Hồ sơ cá nhân
            </Link>
            <Link
              href="/followed"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              <Bookmark className="h-3.5 w-3.5 text-zinc-400" /> Truyện theo dõi
            </Link>
            <Link
              href="/history"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              <History className="h-3.5 w-3.5 text-zinc-400" /> Lịch sử đọc
            </Link>

            {isAdminOrMod && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition"
              >
                <Shield className="h-3.5 w-3.5" /> Trang quản trị (Admin)
              </Link>
            )}
          </div>

          {/* Logout Button */}
          <div className="mt-1 border-t border-zinc-800/80 pt-1">
            <button
              onClick={async () => {
                setIsOpen(false);
                await logoutAction();
                window.location.href = "/";
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
