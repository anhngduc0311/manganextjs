"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, UserCheck, Sparkles } from "lucide-react";
import { loginAction } from "@/actions/auth.actions";
import type { ActionResult } from "@/types";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(loginAction, null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (state?.ok) {
      router.replace(searchParams.get("next") || "/");
      router.refresh();
    }
  }, [state, router, searchParams]);

  const handleFillAdmin = () => {
    setIdentifier("admin@truyenkomi.local");
    setPassword("Admin@123456");
  };

  const handleFillDemoUser = () => {
    setIdentifier("reader@truyenkomi.local");
    setPassword("User@123456");
  };

  return (
    <form action={formAction} className="space-y-4">
      {/* Quick Fill Accounts */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-orange-400" />
          <span>Điền nhanh tài khoản mẫu:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleFillAdmin}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1.5 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 active:scale-95 transition cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>TK Admin</span>
          </button>
          <button
            type="button"
            onClick={handleFillDemoUser}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 active:scale-95 transition cursor-pointer"
          >
            <UserCheck className="h-3.5 w-3.5 text-sky-400" />
            <span>TK Demo</span>
          </button>
        </div>
      </div>

      {state && !state.ok && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{state.error}</div>
      )}
      <div>
        <label htmlFor="identifier" className="mb-1 block text-sm font-medium text-zinc-300">
          Email hoặc Username
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-orange-500"
          placeholder="nhap email hoac username"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-300">
          Mật khẩu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-orange-500"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] cursor-pointer"
      >
        {pending ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
      <div className="flex justify-between text-sm text-zinc-400">
        <Link href="/register" className="hover:text-orange-400">
          Tạo tài khoản mới
        </Link>
        <Link href="/forgot-password" className="hover:text-orange-400">
          Quên mật khẩu?
        </Link>
      </div>
    </form>
  );
}
