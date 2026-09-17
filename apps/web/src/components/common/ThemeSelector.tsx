"use client";

import React, { useState, useRef, useEffect } from "react";
import { useThemeStore, type ThemeMode } from "@/stores/theme-store";
import { Palette, Moon, Sun, Eye, Zap } from "lucide-react";

export function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();
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

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode; color: string }[] = [
    { mode: "dark", label: "Tối (Dark)", icon: <Moon className="h-4 w-4" />, color: "bg-zinc-900 border-zinc-700" },
    { mode: "light", label: "Sáng (Light)", icon: <Sun className="h-4 w-4 text-amber-500" />, color: "bg-zinc-100 text-zinc-900 border-zinc-300" },
    { mode: "sepia", label: "Vàng dịu (Sepia)", icon: <Eye className="h-4 w-4 text-amber-700" />, color: "bg-[#f4ecd8] text-[#433422] border-[#dfd2b8]" },
    { mode: "amoled", label: "AMOLED Đen sâu", icon: <Zap className="h-4 w-4 text-orange-500" />, color: "bg-black border-zinc-800" },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
        title="Đổi giao diện màu nền"
        aria-label="Đổi giao diện màu nền"
      >
        <Palette className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-48 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur-xl">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Chủ đề màu nền
          </div>
          {themeOptions.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => {
                setTheme(opt.mode);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition cursor-pointer ${
                theme === opt.mode
                  ? "bg-orange-500 text-white font-semibold"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
