"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { signIn, signOut, auth } from "@/auth";
import { authService } from "@/services/auth.service";
import { loginSchema, registerSchema } from "@/types/schemas";
import { checkRateLimit, authLimiter } from "@/lib/rate-limiter";
import type { ActionResult } from "@/types";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const limit = await checkRateLimit(authLimiter, `login:${await clientIp()}`);
  if (!limit.success) {
    return { ok: false, error: `Thao tác quá nhanh, thử lại sau ${limit.retryAfter}s` };
  }

  try {
    await signIn("credentials", { identifier: parsed.data.identifier, password: parsed.data.password, redirect: false });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Email/Username hoặc mật khẩu không đúng" };
    }
    throw err;
  }
}

export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const limit = await checkRateLimit(authLimiter, `register:${await clientIp()}`);
  if (!limit.success) {
    return { ok: false, error: `Thao tác quá nhanh, thử lại sau ${limit.retryAfter}s` };
  }

  const created = await authService.register(parsed.data.username, parsed.data.email, parsed.data.password);
  if (!created) {
    return { ok: false, error: "Username hoặc Email đã tồn tại" };
  }

  try {
    await signIn("credentials", { identifier: parsed.data.username, password: parsed.data.password, redirect: false });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: true };
    }
    throw err;
  }
}

export async function logoutAction(): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.id) {
    await authService.revokeRefreshToken(session.user.id).catch(() => {});
  }
  await signOut({ redirect: false });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function forgotPasswordAction(_prev: ActionResult<string> | null, formData: FormData): Promise<ActionResult<string>> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Email không hợp lệ" };
  }
  return { ok: true, data: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi." };
}

