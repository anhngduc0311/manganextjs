"use client";

import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && <div className="absolute left-3 text-zinc-400 pointer-events-none">{leftIcon}</div>}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-lg border bg-zinc-900/90 text-sm text-zinc-100 placeholder-zinc-500 transition-all duration-200 outline-none focus:ring-2 focus:ring-orange-500/20 ${
              leftIcon ? "pl-9" : "pl-3.5"
            } ${rightIcon ? "pr-9" : "pr-3.5"} py-2.5 ${
              error
                ? "border-red-500/80 focus:border-red-500"
                : "border-zinc-700/80 focus:border-orange-500 hover:border-zinc-600"
            } ${className}`}
            {...props}
          />
          {rightIcon && <div className="absolute right-3 text-zinc-400">{rightIcon}</div>}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {!error && helperText && <p className="text-xs text-zinc-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
