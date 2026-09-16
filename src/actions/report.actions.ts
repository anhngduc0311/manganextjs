"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema, reportResolveSchema } from "@/types/schemas";
import { checkRateLimit, writeLimiter } from "@/lib/rate-limiter";
import type { ActionResult } from "@/types";

export async function reportChapterAction(chapterId: string, reason: string): Promise<ActionResult> {
  const session = await auth();

  const limit = await checkRateLimit(writeLimiter, `report:${session?.user?.id ?? "anon"}`);
  if (!limit.success) return { ok: false, error: `Gửi quá nhanh, thử lại sau ${limit.retryAfter}s` };

  const parsed = reportSchema.safeParse({ chapterId, reason });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  await prisma.report.create({
    data: { chapterId: parsed.data.chapterId, reason: parsed.data.reason, userId: session?.user?.id ?? null },
  });
  return { ok: true };
}

export async function resolveReportAction(reportId: string, status: "RESOLVED" | "REJECTED"): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "MODERATOR" && session?.user?.role !== "ADMIN") {
    return { ok: false, error: "Không có quyền" };
  }
  const parsed = reportResolveSchema.safeParse({ reportId, status });
  if (!parsed.success) return { ok: false, error: "Dữ liệu không hợp lệ" };

  await prisma.report.update({ where: { id: parsed.data.reportId }, data: { status: parsed.data.status } });
  revalidatePath("/admin/reports");
  return { ok: true };
}
