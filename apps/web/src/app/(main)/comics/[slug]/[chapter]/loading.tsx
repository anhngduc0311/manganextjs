import React from "react";
import { Loader2 } from "lucide-react";

export default function ReaderLoading() {
  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center space-y-4">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-orange-500/30 shadow-2xl">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-zinc-200">Đang tải trang đọc...</p>
        <p className="text-xs text-zinc-500">Tối ưu hóa hình ảnh sắc nét</p>
      </div>
    </div>
  );
}
