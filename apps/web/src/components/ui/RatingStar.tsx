"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

export interface RatingStarProps {
  score: number; // 0 to 5
  count?: number;
  interactive?: boolean;
  onRate?: (score: number) => void;
  size?: "sm" | "md" | "lg";
}

export function RatingStar({ score, count, interactive = false, onRate, size = "md" }: RatingStarProps) {
  const [hoverScore, setHoverScore] = useState<number | null>(null);

  const starSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const currentScore = hoverScore !== null ? hoverScore : score;

  return (
    <div className="flex items-center gap-1.5 select-none">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = currentScore >= star;
          const isHalf = currentScore >= star - 0.5 && currentScore < star;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate?.(star)}
              onMouseEnter={() => interactive && setHoverScore(star)}
              onMouseLeave={() => interactive && setHoverScore(null)}
              className={`${interactive ? "cursor-pointer transition-transform hover:scale-115" : "cursor-default"} text-amber-400`}
              aria-label={`Đánh giá ${star} sao`}
            >
              <Star
                className={`${starSizes[size]} ${
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : isHalf
                    ? "fill-amber-400/50 text-amber-400"
                    : "text-zinc-600"
                }`}
              />
            </button>
          );
        })}
      </div>
      {score > 0 && <span className="text-xs font-semibold text-amber-400">{score.toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-zinc-500">({count.toLocaleString()})</span>}
    </div>
  );
}
