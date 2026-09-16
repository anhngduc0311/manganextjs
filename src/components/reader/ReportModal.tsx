"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { AlertCircle, Loader2 } from "lucide-react";
import { reportChapterAction } from "@/actions/report.actions";
import { toast } from "@/stores/toast-store";

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterNumber: number;
}

export function ReportModal({ isOpen, onClose, chapterId, chapterNumber }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const standardReasons = [
    "Ảnh bị lỗi / không tải được (Broken image)",
    "Chương bị lặp / sai thứ tự trang",
    "Chương bị thiếu trang / mất nội dung",
    "Chất lượng ảnh quá mờ / khó đọc",
    "Khác (Nhập chi tiết bên dưới)",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === "Khác (Nhập chi tiết bên dưới)" ? customReason.trim() : (reason || customReason.trim());

    if (!finalReason) {
      toast.warning("Vui lòng chọn hoặc nhập lý do báo lỗi!");
      return;
    }

    startTransition(async () => {
      try {
        const res = await reportChapterAction(chapterId, finalReason);
        if (res.ok) {
          toast.success("Đã gửi báo lỗi thành công! Ban quản trị sẽ xử lý sớm nhất. Cảm ơn bạn! 🙏");
          onClose();
          setReason("");
          setCustomReason("");
        } else {
          toast.error(res.error || "Không thể gửi báo lỗi");
        }
      } catch {
        toast.error("Có lỗi xảy ra khi gửi báo lỗi");
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Báo Lỗi Chương ${chapterNumber}`} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <p>Báo cáo giúp quản trị viên sửa lỗi chương và re-crawl ảnh hỏng một cách nhanh chóng.</p>
        </div>

        {/* Standard Reasons Radio */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Chọn lý do:</label>
          <div className="space-y-1.5">
            {standardReasons.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs transition cursor-pointer ${
                  reason === r
                    ? "border-orange-500 bg-orange-500/10 text-orange-400 font-semibold"
                    : "border-zinc-800 bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800/80"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-orange-500"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom text if other */}
        {(reason === "Khác (Nhập chi tiết bên dưới)" || !reason) && (
          <div className="space-y-1">
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Mô tả cụ thể lỗi bạn gặp phải (VD: trang 4 và 5 bị trắng)..."
              rows={3}
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 p-3 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 transition cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang gửi...
              </>
            ) : (
              "Gửi báo lỗi"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
