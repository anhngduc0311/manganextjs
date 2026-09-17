"use client";

import React, { useEffect } from "react";

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Fatal Root Global Error Caught]:", error);
  }, [error]);

  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-3xl">
            ⚠️
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Sự Cố Hệ Thống Nghiêm Trọng
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Ứng dụng gặp lỗi không thể tự phục hồi. Vui lòng thử tải lại trang hoặc truy cập lại sau ít phút.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition cursor-pointer"
          >
            Tải Lại Ứng Dụng
          </button>
        </div>
      </body>
    </html>
  );
}
