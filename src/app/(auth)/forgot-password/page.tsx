"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/actions/auth.actions";
import type { ActionResult } from "@/types";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<ActionResult<string> | null, FormData>(forgotPasswordAction, null);

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-zinc-100">Quên mật khẩu</h1>
      <p className="mb-6 text-sm text-zinc-400">Nhập email đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.</p>
      <form action={formAction} className="space-y-4">
        {state?.ok && state.data && (
          <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">{String(state.data)}</div>
        )}
        {state && !state.ok && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{state.error}</div>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-orange-500"
            placeholder="ban@email.com"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
        >
          {pending ? "Đang gửi..." : "Gửi hướng dẫn"}
        </button>
        <p className="text-center text-sm text-zinc-400">
          <Link href="/login" className="text-orange-400 hover:underline">
            Về trang đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
