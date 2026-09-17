"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Tag,
  MessageSquare,
  AlertTriangle,
  Users,
  Home,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { label: "Quản lý truyện", href: "/admin/comics", icon: BookOpen },
  { label: "Quản lý chương", href: "/admin/chapters", icon: Layers },
  { label: "Thể loại truyện", href: "/admin/genres", icon: Tag },
  { label: "Kiểm duyệt bình luận", href: "/admin/comments", icon: MessageSquare },
  { label: "Xử lý báo lỗi", href: "/admin/reports", icon: AlertTriangle },
  { label: "Người dùng & Quyền", href: "/admin/users", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="fixed top-3 left-3 z-50 md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 shadow-xl"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-zinc-800 bg-zinc-950 p-4 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">TruyenKomi</h2>
              <p className="text-[11px] font-semibold text-orange-400 uppercase tracking-widest">Admin Control</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-sm"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-orange-400" : "text-zinc-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Link to Public Website */}
        <div className="border-t border-zinc-800 pt-4 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <Home className="h-4 w-4 text-orange-400" />
            <span>Xem trang người đọc</span>
          </Link>
          <div className="px-2 text-[10px] text-zinc-600">
            TruyenKomi Engine v1.0.0 (Serverless)
          </div>
        </div>
      </aside>
    </>
  );
}
