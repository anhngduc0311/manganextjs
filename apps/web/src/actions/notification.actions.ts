"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { notificationService } from "@/services/notification.service";
import type { ActionResult, NotificationDTO } from "@/types";

export async function getNotificationsAction(): Promise<{ ok: boolean; data?: NotificationDTO[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Chưa đăng nhập" };
  }

  try {
    const data = await notificationService.listRecent(session.user.id, 20);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Không thể tải thông báo" };
  }
}

export async function markNotificationReadAction(notificationId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Chưa đăng nhập" };
  }

  try {
    await notificationService.markRead(session.user.id, notificationId);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Lỗi khi cập nhật trạng thái thông báo" };
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Chưa đăng nhập" };
  }

  try {
    await notificationService.markAllRead(session.user.id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Lỗi khi cập nhật tất cả thông báo" };
  }
}

