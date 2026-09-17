"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordReading } from "@/services/history.service";
import { notificationService } from "@/services/notification.service";
import { historySchema, userRoleSchema } from "@/types/schemas";
import { checkRateLimit, writeLimiter } from "@/lib/rate-limiter";
import type { ActionResult } from "@/types";

export async function updateHistoryAction(input: {
  comicId: string;
  chapterId: string;
  lastReadPage: number;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Bạn cần đăng nhập" };

  const limit = await checkRateLimit(writeLimiter, `history:${session.user.id}`);
  if (!limit.success) return { ok: true };

  const parsed = historySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dữ liệu không hợp lệ" };

  const saved = await recordReading(session.user.id, parsed.data);
  if (!saved) return { ok: false, error: "Chương không thuộc truyện hoặc không tồn tại" };
  return { ok: true };
}

export async function setUserRoleAction(userId: string, role: "USER" | "MODERATOR" | "ADMIN"): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { ok: false, error: "Chỉ ADMIN mới được phân quyền" };

  const parsed = userRoleSchema.safeParse({ userId, role });
  if (!parsed.success) return { ok: false, error: "Dữ liệu không hợp lệ" };
  if (userId === session.user.id) return { ok: false, error: "Không thể tự đổi role của chính mình" };

  await prisma.user.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function markNotificationReadAction(notificationId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Bạn cần đăng nhập" };
  await notificationService.markRead(session.user.id, notificationId);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Bạn cần đăng nhập" };
  await notificationService.markAllRead(session.user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}
