"use client";

import React, { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { followComicAction } from "@/actions/comic.actions";
import { toast } from "@/stores/toast-store";
import { useRouter } from "next/navigation";

export interface FollowButtonProps {
  comicId: string;
  initialFollowing?: boolean;
  isLoggedIn?: boolean;
}

export function FollowButton({ comicId, initialFollowing = false, isLoggedIn = false }: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    if (!isLoggedIn) {
      toast.warning("Vui lòng đăng nhập để theo dõi truyện!");
      router.push("/login");
      return;
    }

    // Optimistic toggle
    const nextState = !following;
    setFollowing(nextState);

    startTransition(async () => {
      try {
        const res = await followComicAction(comicId);
        if (res.ok && res.data) {
          setFollowing(res.data.following);
          toast.success(res.data.following ? "Đã thêm vào danh sách theo dõi ❤️" : "Đã hủy theo dõi truyện");
        } else {
          setFollowing(!nextState); // Rollback
          toast.error(res.error || "Không thể cập nhật theo dõi");
        }
      } catch {
        setFollowing(!nextState); // Rollback
        toast.error("Có lỗi xảy ra, vui lòng thử lại sau!");
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
        following
          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
          : "bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 hover:text-white"
      }`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : following ? (
        <BookmarkCheck className="h-4 w-4 text-rose-400" />
      ) : (
        <Bookmark className="h-4 w-4 text-zinc-400" />
      )}
      <span>{following ? "Đang theo dõi" : "Theo dõi truyện"}</span>
    </button>
  );
}
