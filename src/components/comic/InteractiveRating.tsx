"use client";

import React, { useState, useTransition } from "react";
import { RatingStar } from "@/components/ui/RatingStar";
import { rateComicAction } from "@/actions/rating.actions";
import { toast } from "@/stores/toast-store";
import { useRouter } from "next/navigation";

export interface InteractiveRatingProps {
  comicId: string;
  initialScore: number;
  initialCount: number;
  userScore?: number | null;
  isLoggedIn?: boolean;
}

export function InteractiveRating({
  comicId,
  initialScore,
  initialCount,
  userScore,
  isLoggedIn = false,
}: InteractiveRatingProps) {
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [count, setCount] = useState(initialCount);
  const [myScore, setMyScore] = useState<number | null>(userScore ?? null);
  const [isPending, startTransition] = useTransition();

  const handleRate = (newScore: number) => {
    if (!isLoggedIn) {
      toast.warning("Vui lòng đăng nhập để đánh giá truyện!");
      router.push("/login");
      return;
    }

    setMyScore(newScore);

    startTransition(async () => {
      try {
        const res = await rateComicAction(comicId, newScore);
        if (res.ok && res.data) {
          setScore(res.data.ratingAvg);
          setCount(res.data.ratingCount);
          toast.success(`Đã đánh giá ${newScore} sao thành công! (+10 EXP) ⭐`);
        } else {
          toast.error(res.error || "Không thể gửi đánh giá");
        }
      } catch {
        toast.error("Có lỗi xảy ra khi đánh giá");
      }
    });
  };

  return (
    <div className="flex flex-col items-center sm:items-start gap-1.5">
      <div className="flex items-center gap-2">
        <RatingStar
          score={myScore !== null ? myScore : score}
          count={count}
          interactive
          onRate={handleRate}
          size="md"
        />
        {isPending && <span className="text-xs text-orange-400 animate-pulse font-medium">Đang lưu...</span>}
      </div>
      {myScore !== null ? (
        <span className="text-[11px] text-orange-400 font-medium">
          Bạn đã đánh giá {myScore} sao (Click để thay đổi)
        </span>
      ) : (
        <span className="text-[11px] text-zinc-500">
          Chấm điểm cho bộ truyện này (Click vào số sao)
        </span>
      )}
    </div>
  );
}
