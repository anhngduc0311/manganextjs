"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ExternalLink, AlertTriangle, Clock } from "lucide-react";
import { resolveReportAction } from "@/actions/report.actions";
import { toast } from "@/stores/toast-store";

export interface ReportRow {
  id: string;
  reason: string;
  status: "PENDING" | "RESOLVED" | "REJECTED" | string;
  createdAt: string;
  user: {
    username: string;
  } | null;
  chapter: {
    id: string;
    chapterNumber: number;
    comic: {
      title: string;
      slug: string;
    };
  };
}

export interface ReportsModerationTableProps {
  reports: ReportRow[];
}

export function ReportsModerationTable({ reports }: ReportsModerationTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [isPending, startTransition] = useTransition();

  const filtered = reports.filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  const handleResolve = (id: string, status: "RESOLVED" | "REJECTED") => {
    startTransition(async () => {
      try {
        const res = await resolveReportAction(id, status);
        if (res.ok) {
          toast.success(
            status === "RESOLVED"
              ? "Đã chuyển trạng thái báo lỗi thành: ĐÃ XỬ LÝ (RESOLVED)! ✅"
              : "Đã từ chối báo lỗi (REJECTED)!"
          );
        } else {
          toast.error(res.error || "Không thể cập nhật báo lỗi");
        }
      } catch {
        toast.error("Lỗi khi xử lý báo lỗi");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {[
          { key: "PENDING", label: "Chờ xử lý (PENDING)" },
          { key: "RESOLVED", label: "Đã xử lý (RESOLVED)" },
          { key: "REJECTED", label: "Đã từ chối (REJECTED)" },
          { key: "ALL", label: "Tất cả báo cáo" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              statusFilter === tab.key
                ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4">Chương bị lỗi</th>
                <th className="py-3.5 px-4">Lý do báo cáo</th>
                <th className="py-3.5 px-4">Người báo cáo</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    Không có báo lỗi nào ở mục này
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-800/40 transition">
                    {/* Chapter & Comic */}
                    <td className="py-3 px-4">
                      <div className="min-w-0 max-w-[200px]">
                        <p className="font-bold text-zinc-100 truncate">{r.chapter.comic.title}</p>
                        <p className="text-[11px] font-semibold text-orange-400">
                          Chương {r.chapter.chapterNumber}
                        </p>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 max-w-md">
                      <div className="flex items-start gap-1.5 text-zinc-300">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{r.reason}</span>
                      </div>
                    </td>

                    {/* Reporter */}
                    <td className="py-3 px-4 text-zinc-400">
                      {r.user?.username || <span className="text-zinc-600 italic">Khách ẩn danh</span>}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                          r.status === "PENDING"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            : r.status === "RESOLVED"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {r.status === "PENDING" && <Clock className="h-2.5 w-2.5" />}
                        {r.status === "RESOLVED" && <CheckCircle2 className="h-2.5 w-2.5" />}
                        {r.status === "REJECTED" && <XCircle className="h-2.5 w-2.5" />}
                        {r.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-zinc-500 text-[11px] whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Open Reader to check error */}
                        <Link
                          href={`/comics/${r.chapter.comic.slug}/chuong-${r.chapter.chapterNumber}`}
                          target="_blank"
                          className="flex h-8 items-center gap-1 rounded-xl bg-zinc-800 px-2.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                          title="Mở đọc chương để kiểm tra"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="text-[11px]">Kiểm tra</span>
                        </Link>

                        {/* Resolve */}
                        {r.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleResolve(r.id, "RESOLVED")}
                              disabled={isPending}
                              className="flex h-8 items-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-2.5 text-emerald-400 hover:bg-emerald-500 hover:text-white transition cursor-pointer disabled:opacity-50"
                              title="Đã sửa xong lỗi"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="text-[11px]">Đã sửa</span>
                            </button>

                            <button
                              onClick={() => handleResolve(r.id, "REJECTED")}
                              disabled={isPending}
                              className="flex h-8 items-center gap-1 rounded-xl bg-zinc-800 px-2.5 text-zinc-400 hover:bg-zinc-700 hover:text-red-400 transition cursor-pointer disabled:opacity-50"
                              title="Báo cáo không đúng / Bỏ qua"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span className="text-[11px]">Bỏ qua</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
