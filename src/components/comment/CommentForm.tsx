"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Send, Loader2, AlertTriangle } from "lucide-react";
import { addCommentAction } from "@/actions/comment.actions";
import { toast } from "@/stores/toast-store";

export interface CommentFormProps {
  comicId: string;
  chapterId?: string | null;
  parentId?: string | null;
  isLoggedIn?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  comicId,
  chapterId,
  parentId,
  isLoggedIn = false,
  onSuccess,
  onCancel,
  placeholder = "Viết bình luận của bạn về bộ truyện...",
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-center">
        <p className="text-xs text-zinc-400">
          Vui lòng{" "}
          <Link href="/login" className="font-bold text-orange-400 hover:underline">
            Đăng nhập
          </Link>{" "}
          hoặc{" "}
          <Link href="/register" className="font-bold text-orange-400 hover:underline">
            Đăng ký
          </Link>{" "}
          để tham gia bình luận thảo luận!
        </p>
      </div>
    );
  }

  const handleInsertSpoiler = () => {
    setContent((prev) => `${prev}[spoil]Nội dung spoiler ở đây[/spoil]`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        const res = await addCommentAction({
          comicId,
          chapterId: chapterId ?? null,
          parentId: parentId ?? null,
          content: content.trim(),
        });

        if (res.ok) {
          setContent("");
          toast.success("Đã đăng bình luận thành công! (+5 EXP) 🎉");
          onSuccess?.();
        } else {
          toast.error(res.error || "Không thể gửi bình luận");
        }
      } catch {
        toast.error("Có lỗi xảy ra khi gửi bình luận");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          {parentId ? "Trả lời bình luận" : "Bình luận"}
        </span>
        <button
          type="button"
          onClick={handleInsertSpoiler}
          className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
          title="Chèn tag spoiler [spoil]...[/spoil]"
        >
          <AlertTriangle className="h-3 w-3" /> Tag Spoiler
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={1000}
        rows={parentId ? 2 : 3}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 p-3 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-500">{content.length}/1000 ký tự</span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 transition cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang gửi...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" /> Gửi bình luận
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
