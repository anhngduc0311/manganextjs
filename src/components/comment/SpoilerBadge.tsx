"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface SpoilerBadgeProps {
  content: string;
}

export function SpoilerBadge({ content }: SpoilerBadgeProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative my-1.5 overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-500/20 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
        <span className="flex items-center gap-1">⚠️ Bình luận chứa nội dung tiết lộ (Spoiler)</span>
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
        >
          {revealed ? (
            <>
              <EyeOff className="h-3 w-3" /> Ẩn lại
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" /> Bấm để xem
            </>
          )}
        </button>
      </div>

      <div className={`text-xs text-zinc-200 transition-all duration-300 ${revealed ? "blur-none" : "blur-xs select-none opacity-40"}`}>
        {content}
      </div>
    </div>
  );
}
