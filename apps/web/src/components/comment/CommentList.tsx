"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import type { CommentDTO } from "@/types";

export interface CommentListProps {
  comicId: string;
  chapterId?: string | null;
  comments: CommentDTO[];
  isLoggedIn?: boolean;
}

export function CommentList({ comicId, chapterId, comments, isLoggedIn = false }: CommentListProps) {
  return (
    <section id="comments-section" className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <MessageSquare className="h-5 w-5 text-orange-500" />
        <h3 className="text-base font-bold text-zinc-100">Bình luận & Thảo luận</h3>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-400">
          {comments.length}
        </span>
      </div>

      {/* Top Comment Box */}
      <CommentForm comicId={comicId} chapterId={chapterId} isLoggedIn={isLoggedIn} />

      {/* Comment Entries */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
            Chưa có bình luận nào. Hãy là người đầu tiên để lại cảm nghĩ về bộ truyện này nhé!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              comicId={comicId}
              chapterId={chapterId}
              isLoggedIn={isLoggedIn}
            />
          ))
        )}
      </div>
    </section>
  );
}
