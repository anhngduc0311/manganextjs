"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerAction } from "@/actions/auth.actions";
import type { ActionResult } from "@/types";

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(registerAction, null);

  useEffect(() => {
    if (state?.ok) {
      router.replace("/");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{state.error}</div>
      )}
      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-medium text-zinc-300">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-orange-500"
          placeholder="vd: doc_truyen_pro"
        />
        <p className="mt-1 text-xs text-zinc-500">Chỉ gồm chữ, số, dấu gạch dưới (3-30 ký tự)</p>
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-orange-500"
          placeholder="ban@email.com"
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
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-orange-500"
          placeholder="tối thiểu 8 ký tự"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Đang tạo tài khoản..." : "Đăng ký"}
      </button>
      <p className="text-center text-sm text-zinc-400">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-orange-400 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
