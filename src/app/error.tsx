"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 -z-10 rounded-full bg-red-500/20 blur-3xl" />
        <div className="flex items-center justify-center h-24 w-24 rounded-3xl bg-zinc-900 border border-red-500/30 shadow-2xl">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
      </div>

      <span className="rounded-full bg-red-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400 border border-red-500/20 mb-3">
        Đã có sự cố phát sinh
      </span>

      <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-3">
        Không thể tải trang lúc này
      </h1>

      <p className="max-w-md text-xs sm:text-sm text-zinc-400 mb-8 leading-relaxed">
        Hệ thống vừa gặp sự cố không mong muốn trong quá trình xử lý yêu cầu. Bạn có thể nhấn thử lại hoặc quay về trang chủ.
      </p>

      {/* Dev digest / message (only if available) */}
      {process.env.NODE_ENV !== "production" && (
        <pre className="mb-6 max-w-lg overflow-auto rounded-xl bg-zinc-950 p-4 text-left text-xs text-red-300 border border-zinc-800">
          {error.message}
          {error.digest && `\nDigest: ${error.digest}`}
        </pre>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Thử Lại
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
        >
          <Home className="h-4 w-4" /> Về Trang Chủ
        </Link>
      </div>
    </div>
  );
}
