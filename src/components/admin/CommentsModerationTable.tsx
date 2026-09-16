"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Trash2, Shield, Trophy, ExternalLink, Heart, AlertOctagon } from "lucide-react";
import { deleteCommentAction } from "@/actions/comment.actions";
import { toast } from "@/stores/toast-store";

export interface CommentModerationRow {
  id: string;
  content: string;
  isSpoiler: boolean;
  likes: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    role: string;
    level: number;
  };
  comic: {
    title: string;
    slug: string;
  };
  chapter?: {
    chapterNumber: number;
  } | null;
}

export interface CommentsModerationTableProps {
  comments: CommentModerationRow[];
}

export function CommentsModerationTable({ comments }: CommentsModerationTableProps) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = comments.filter(
    (c) =>
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      c.user.username.toLowerCase().includes(search.toLowerCase()) ||
      c.comic.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string, username: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bình luận của "${username}" không?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteCommentAction(id);
        if (res.ok) {
          toast.success("Đã xóa bình luận khỏi hệ thống! ✅");
        } else {
          toast.error(res.error || "Không thể xóa bình luận");
        }
      } catch {
        toast.error("Lỗi khi xóa bình luận");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo nội dung, người bình luận, tên truyện..."
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500 transition"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4">Người dùng</th>
                <th className="py-3.5 px-4">Vị trí</th>
                <th className="py-3.5 px-4">Nội dung bình luận</th>
                <th className="py-3.5 px-4">Lượt thích</th>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    Không tìm thấy bình luận nào
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/40 transition">
                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                          {c.user.avatar ? (
                            <Image src={c.user.avatar} alt={c.user.username} fill sizes="32px" className="object-cover" />
                          ) : (
                            c.user.username[0]?.toUpperCase() || "U"
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-200">{c.user.username}</p>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                            <span>Lv.{c.user.level || 1}</span>
                            <span>•</span>
                            <span className="font-semibold text-orange-400">{c.user.role}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4">
                      <div className="min-w-0 max-w-[160px]">
                        <Link
                          href={`/comics/${c.comic.slug}`}
                          target="_blank"
                          className="font-semibold text-zinc-200 hover:text-orange-400 truncate block"
                          title={c.comic.title}
                        >
                          {c.comic.title}
                        </Link>
                        <p className="text-[11px] text-zinc-500">
                          {c.chapter ? `Chương ${c.chapter.chapterNumber}` : "Toàn bộ truyện"}
                        </p>
                      </div>
                    </td>

                    {/* Content */}
                    <td className="py-3 px-4 max-w-md">
                      <div className="space-y-1">
                        {c.isSpoiler && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-400">
                            <AlertOctagon className="h-2.5 w-2.5" /> Spoiler
                          </span>
                        )}
                        <p className="text-zinc-300 leading-relaxed break-words">{c.content}</p>
                      </div>
                    </td>

                    {/* Likes */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-zinc-400">
                        <Heart className="h-3 w-3 text-rose-500" /> {c.likes}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-zinc-500 text-[11px] whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(c.id, c.user.username)}
                        disabled={isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer ml-auto disabled:opacity-50"
                        title="Xóa bình luận vi phạm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
