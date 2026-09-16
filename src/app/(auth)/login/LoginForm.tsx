"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/actions/auth.actions";
import type { ActionResult } from "@/types";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(loginAction, null);

  useEffect(() => {
    if (state?.ok) {
      router.replace(searchParams.get("next") || "/");
      router.refresh();
    }
  }, [state, router, searchParams]);

  return (
    <form action={formAction} className="space-y-4">
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
          autoComplete="current-password"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-orange-500"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
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
