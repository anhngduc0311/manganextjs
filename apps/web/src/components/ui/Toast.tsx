"use client";

import React from "react";
import { useToastStore, type ToastType } from "@/stores/toast-store";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
  };

  const bgColors: Record<ToastType, string> = {
    success: "bg-zinc-900 border-emerald-500/40 text-emerald-100",
    error: "bg-zinc-900 border-red-500/40 text-red-100",
    info: "bg-zinc-900 border-sky-500/40 text-sky-100",
    warning: "bg-zinc-900 border-amber-500/40 text-amber-100",
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 ${bgColors[t.type]}`}
        >
          <div className="flex items-center gap-2.5">
            {icons[t.type]}
            <p className="text-sm font-medium leading-snug">{t.message}</p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="text-zinc-400 hover:text-zinc-200 transition p-0.5 rounded"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
