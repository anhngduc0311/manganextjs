import React from "react";
import type { LucideIcon } from "lucide-react";

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  color?: "orange" | "blue" | "emerald" | "purple" | "rose" | "amber";
}

const COLOR_MAP = {
  orange: {
    bg: "from-orange-500/10 to-orange-500/5",
    border: "border-orange-500/20",
    iconBg: "bg-orange-500/20 text-orange-400",
    text: "text-orange-400",
  },
  blue: {
    bg: "from-blue-500/10 to-blue-500/5",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/20 text-blue-400",
    text: "text-blue-400",
  },
  emerald: {
    bg: "from-emerald-500/10 to-emerald-500/5",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/20 text-emerald-400",
    text: "text-emerald-400",
  },
  purple: {
    bg: "from-purple-500/10 to-purple-500/5",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/20 text-purple-400",
    text: "text-purple-400",
  },
  rose: {
    bg: "from-rose-500/10 to-rose-500/5",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/20 text-rose-400",
    text: "text-rose-400",
  },
  amber: {
    bg: "from-amber-500/10 to-amber-500/5",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/20 text-amber-400",
    text: "text-amber-400",
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = "orange",
}: StatsCardProps) {
  const styles = COLOR_MAP[color] || COLOR_MAP.orange;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${styles.border} bg-gradient-to-br ${styles.bg} bg-zinc-900/60 p-5 shadow-xl transition-transform hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${styles.iconBg} shadow-inner`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(description || trend) && (
        <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-xs text-zinc-400">
          <span>{description}</span>
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
