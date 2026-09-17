"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h2 className="text-xl font-bold text-white mb-2">Lỗi Bảng Quản Trị</h2>
      <p className="max-w-md text-xs sm:text-sm text-zinc-400 mb-6">
        Không thể tải dữ liệu quản trị. Kiểm tra kết nối cơ sở dữ liệu hoặc quyền tài khoản.
      </p>

      {error.message && (
        <pre className="mb-6 max-w-md overflow-auto rounded-lg bg-zinc-950 p-3 text-left text-xs text-red-400 border border-zinc-800">
          {error.message}
        </pre>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Thử lại
        </button>
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
        >
          <LayoutDashboard className="h-4 w-4" /> Về Dashboard
        </Link>
      </div>
    </div>
  );
}
