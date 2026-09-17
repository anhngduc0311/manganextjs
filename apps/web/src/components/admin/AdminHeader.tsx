"use client";

import React from "react";
import { LogOut, Shield, User } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { ThemeSelector } from "@/components/common/ThemeSelector";
import type { SessionUser } from "@/types";

interface AdminHeaderProps {
  user: SessionUser;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-md">
      {/* Left title info */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-zinc-400">Bảng điều khiển</span>
        <span className="text-zinc-600">/</span>
        <span className="text-xs font-bold text-zinc-200">Trang quản trị</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <ThemeSelector />

        {/* User Role & Profile Pill */}
        <div className="flex items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900/90 py-1.5 px-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">
            {user.username ? user.username[0].toUpperCase() : <User className="h-3.5 w-3.5" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-zinc-200 leading-tight">{user.username}</p>
            <p className="text-[10px] font-semibold text-orange-400 flex items-center gap-0.5">
              <Shield className="h-2.5 w-2.5" /> {user.role}
            </p>
          </div>
        </div>

        {/* Logout button */}
        <form action={async () => { await logoutAction(); }}>
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
