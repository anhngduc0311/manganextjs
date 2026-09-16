"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { Heart, MessageSquare, Trophy, Shield } from "lucide-react";
import { SpoilerBadge } from "./SpoilerBadge";
import { CommentForm } from "./CommentForm";
import { likeCommentAction } from "@/actions/comment.actions";
import { toast } from "@/stores/toast-store";
import type { CommentDTO } from "@/types";

export interface CommentItemProps {
  comment: CommentDTO;
  comicId: string;
  chapterId?: string | null;
  isLoggedIn?: boolean;
}

export function CommentItem({ comment, comicId, chapterId, isLoggedIn = false }: CommentItemProps) {
  const [likes, setLikes] = useState(comment.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [replying, setReplying] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    if (!isLoggedIn) {
      toast.warning("Vui lòng đăng nhập để thích bình luận!");
      return;
    }

    const nextLikes = isLiked ? likes - 1 : likes + 1;
    setLikes(nextLikes);
    setIsLiked(!isLiked);

    startTransition(async () => {
      try {
        const res = await likeCommentAction(comment.id);
        if (res.ok && res.data) {
          setLikes(res.data.likes);
        }
      } catch {
        // Rollback
        setLikes(likes);
        setIsLiked(isLiked);
      }
    });
  };

  const roleBadges: Record<string, string> = {
    ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
    MODERATOR: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    USER: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 transition-colors">
      {/* User Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
            {comment.user.avatar ? (
              <Image src={comment.user.avatar} alt={comment.user.username} fill sizes="32px" className="object-cover" />
            ) : (
              comment.user.username[0]?.toUpperCase() || "U"
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-200">{comment.user.username}</span>
              {comment.user.role && comment.user.role !== "USER" && (
                <span className={`flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold border ${roleBadges[comment.user.role] || roleBadges.USER}`}>
                  <Shield className="h-2.5 w-2.5" /> {comment.user.role}
                </span>
              )}
              <span className="flex items-center gap-0.5 rounded bg-orange-500/10 px-1.5 py-0.2 text-[9px] font-bold text-orange-400 border border-orange-500/20">
                <Trophy className="h-2.5 w-2.5" /> Lv.{comment.user.level || 1}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">
              {new Date(comment.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="text-xs text-zinc-200 leading-relaxed pl-10">
        {comment.isSpoiler ? (
          <SpoilerBadge content={comment.content} />
        ) : (
          <p className="whitespace-pre-wrap">{comment.content}</p>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-4 pl-10 text-xs text-zinc-400">
        <button
          onClick={handleLike}
          disabled={isPending}
          className={`flex items-center gap-1 transition cursor-pointer ${
            isLiked ? "text-rose-400 font-bold" : "hover:text-rose-400"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-rose-400 text-rose-400" : ""}`} />
          <span>{likes > 0 ? likes : "Thích"}</span>
        </button>

        <button
          onClick={() => setReplying(!replying)}
          className="flex items-center gap-1 hover:text-orange-400 transition cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Trả lời</span>
        </button>
      </div>

      {/* Reply Form */}
      {replying && (
        <div className="mt-3 pl-10">
          <CommentForm
            comicId={comicId}
            chapterId={chapterId}
            parentId={comment.id}
            isLoggedIn={isLoggedIn}
            onSuccess={() => setReplying(false)}
            onCancel={() => setReplying(false)}
            placeholder={`Trả lời @${comment.user.username}...`}
          />
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-zinc-800 pl-4 ml-6">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              comicId={comicId}
              chapterId={chapterId}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
