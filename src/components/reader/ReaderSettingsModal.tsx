"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { useReaderStore, type ReaderMode, type ReaderTheme } from "@/stores/reader-store";
import { useThemeStore } from "@/stores/theme-store";
import { Sliders, Sun, Moon, Eye, Zap, BookOpen, FileText, Columns, Keyboard } from "lucide-react";

export interface ReaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReaderSettingsModal({ isOpen, onClose }: ReaderSettingsModalProps) {
  const { mode, setMode, brightness, setBrightness, fitWidth, setFitWidth } = useReaderStore();
  const { theme, setTheme } = useThemeStore();

  const modeOptions: { id: ReaderMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: "webtoon", label: "Webtoon (Cuộn dọc)", icon: <BookOpen className="h-4 w-4" />, desc: "Cuộn từ trên xuống liên tục" },
    { id: "single", label: "Trang đơn (Lật trang)", icon: <FileText className="h-4 w-4" />, desc: "Click hoặc bấm phím để qua trang" },
    { id: "double", label: "Song trang (Manga RTL)", icon: <Columns className="h-4 w-4" />, desc: "Đọc 2 trang song song từ Phải sang Trái" },
  ];

  const themeOptions: { id: ReaderTheme; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "dark", label: "Tối (Dark)", icon: <Moon className="h-4 w-4" />, color: "bg-zinc-900 border-zinc-700" },
    { id: "light", label: "Sáng (Light)", icon: <Sun className="h-4 w-4 text-amber-500" />, color: "bg-zinc-100 text-zinc-900 border-zinc-300" },
    { id: "sepia", label: "Vàng dịu (Sepia)", icon: <Eye className="h-4 w-4 text-amber-700" />, color: "bg-[#f4ecd8] text-[#433422] border-[#dfd2b8]" },
    { id: "amoled", label: "AMOLED Đen sâu", icon: <Zap className="h-4 w-4 text-orange-500" />, color: "bg-black border-zinc-800" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cài Đặt Trình Đọc" maxWidth="md">
      <div className="space-y-6 py-1">
        {/* Chế độ đọc */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Chế độ đọc (Phím M)</label>
          <div className="grid grid-cols-1 gap-2">
            {modeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMode(opt.id)}
                className={`flex items-center justify-between rounded-xl p-3 text-left transition cursor-pointer border ${
                  mode === opt.id
                    ? "border-orange-500 bg-orange-500/10 text-orange-400"
                    : "border-zinc-800 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${mode === opt.id ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                    {opt.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[11px] text-zinc-500">{opt.desc}</p>
                  </div>
                </div>
                {mode === opt.id && <span className="text-xs font-bold text-orange-400">Đang chọn</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Màu nền đọc */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Màu nền đọc truyện (Theme)</label>
          <div className="grid grid-cols-2 gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${
                  theme === opt.id
                    ? "border-orange-500 ring-2 ring-orange-500/20 text-orange-400"
                    : "border-zinc-800 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Độ sáng màn hình */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
            <span>Độ sáng truyện</span>
            <span className="text-orange-400">{brightness}%</span>
          </div>
          <div className="flex items-center gap-3">
            <Sun className="h-4 w-4 text-zinc-500" />
            <input
              type="range"
              min={30}
              max={100}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-orange-500"
            />
            <Sun className="h-5 w-5 text-amber-400" />
          </div>
        </div>

        {/* Phím tắt hỗ trợ */}
        <div className="rounded-xl bg-zinc-800/40 p-3 text-xs text-zinc-400 border border-zinc-800">
          <div className="flex items-center gap-1.5 font-bold text-zinc-300 mb-2">
            <Keyboard className="h-4 w-4 text-orange-400" /> Phím tắt nhanh:
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><kbd className="rounded bg-zinc-700 px-1.5 py-0.5 font-mono text-white">A</kbd> hoặc <kbd className="rounded bg-zinc-700 px-1.5 py-0.5 font-mono text-white">←</kbd>: Lùi trang</div>
            <div><kbd className="rounded bg-zinc-700 px-1.5 py-0.5 font-mono text-white">D</kbd> hoặc <kbd className="rounded bg-zinc-700 px-1.5 py-0.5 font-mono text-white">→</kbd>: Tiến trang</div>
            <div><kbd className="rounded bg-zinc-700 px-1.5 py-0.5 font-mono text-white">F</kbd>: Toàn màn hình</div>
            <div><kbd className="rounded bg-zinc-700 px-1.5 py-0.5 font-mono text-white">M</kbd>: Đổi chế độ đọc</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
