import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md";
}

export function Badge({ className = "", variant = "default", size = "sm", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-zinc-800 text-zinc-300 border border-zinc-700/60",
    primary: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
    secondary: "bg-zinc-700/60 text-zinc-200",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    danger: "bg-red-500/15 text-red-400 border border-red-500/30",
    outline: "border border-zinc-700 text-zinc-400 bg-transparent",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
