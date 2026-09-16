"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/text-normalizer";
import { comicService } from "@/services/comic.service";
import { gamificationService } from "@/services/gamification.service";
import { EXP_PER_RATING } from "@/lib/leveling";
import { checkRateLimit, writeLimiter } from "@/lib/rate-limiter";
import { chapterUpsertSchema, comicUpsertSchema, genreUpsertSchema, ratingSchema } from "@/types/schemas";
import type { ActionResult } from "@/types";

async function requireRole(roles: Array<"USER" | "MODERATOR" | "ADMIN">): Promise<
  | { ok: false; error: string }
  | { ok: true; userId: string; role: "USER" | "MODERATOR" | "ADMIN" }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Bạn cần đăng nhập" };
  if (!roles.includes(session.user.role)) return { ok: false, error: "Không có quyền thực hiện" };
  return { ok: true, userId: session.user.id, role: session.user.role };
}

export async function followComicAction(comicId: string): Promise<ActionResult<{ following: boolean }>> {
  const authz = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };

  const existing = await prisma.follow.findUnique({
    where: { userId_comicId: { userId: authz.userId, comicId } },
  });
  if (existing) {
    await prisma.follow.delete({ where: { userId_comicId: { userId: authz.userId, comicId } } });
    return { ok: true, data: { following: false } };
  }
  await prisma.follow.create({ data: { userId: authz.userId, comicId } });
  return { ok: true, data: { following: true } };
}

export async function rateComicAction(comicId: string, score: number): Promise<ActionResult<{ ratingAvg: number; ratingCount: number }>> {
  const authz = await requireRole(["USER", "MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };


  const limit = await checkRateLimit(writeLimiter, `rate:${authz.userId}`);
  if (!limit.success) return { ok: false, error: `Thao tác quá nhanh, thử lại sau ${limit.retryAfter}s` };

  const parsed = ratingSchema.safeParse({ comicId, score });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const result = await prisma.$transaction(async (tx) => {
    await tx.comicRating.upsert({
      where: { userId_comicId: { userId: authz.userId, comicId } },
      create: { userId: authz.userId, comicId, score: parsed.data.score },
      update: { score: parsed.data.score },
    });
    const agg = await tx.comicRating.aggregate({
      where: { comicId },
      _avg: { score: true },
      _count: { score: true },
    });
    return tx.comic.update({
      where: { id: comicId },
      data: { ratingAvg: agg._avg.score ?? 0, ratingCount: agg._count.score },
      select: { slug: true, ratingAvg: true, ratingCount: true },
    });
  });

  await gamificationService.awardExp(authz.userId, EXP_PER_RATING).catch(() => {});
  revalidateTag(`comic-detail-${result.slug}`);
  return { ok: true, data: { ratingAvg: result.ratingAvg, ratingCount: result.ratingCount } };
}

export async function upsertComicAction(_prev: ActionResult<{ id: string; slug: string }> | null, formData: FormData): Promise<ActionResult<{ id: string; slug: string }>> {
  const authz = await requireRole(["MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };

  const parsed = comicUpsertSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    otherNames: formData.get("otherNames") || undefined,
    author: formData.get("author") || undefined,
    status: formData.get("status") || undefined,
    coverImage: formData.get("coverImage"),
    bannerImage: formData.get("bannerImage") || undefined,
    description: formData.get("description") || undefined,
    categoryIds: formData.getAll("categoryIds"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const data = parsed.data;
  const slug = data.slug || (await comicService.uniqueSlug(data.title, data.id));

  const comic = await prisma.comic.upsert({
    where: { id: data.id ?? "00000000-0000-0000-0000-000000000000" },
    create: {
      title: data.title,
      titleUnaccent: comicService.normalizeTitle(data.title),
      slug,
      otherNames: data.otherNames || null,
      author: data.author || null,
      status: data.status,
      coverImage: data.coverImage,
      bannerImage: data.bannerImage || null,
      description: data.description || null,
      categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) },
    },
    update: {
      title: data.title,
      titleUnaccent: comicService.normalizeTitle(data.title),
      slug,
      otherNames: data.otherNames || null,
      author: data.author || null,
      status: data.status,
      coverImage: data.coverImage,
      bannerImage: data.bannerImage || null,
      description: data.description || null,
      categories: {
        deleteMany: {},
        create: data.categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
    select: { id: true, slug: true },
  });

  revalidateTag(`comic-detail-${comic.slug}`);
  revalidateTag("comic-list");
  revalidateTag("home-feed");
  revalidatePath("/admin/comics");
  return { ok: true, data: comic };
}

export async function deleteComicAction(comicId: string): Promise<ActionResult> {
  const authz = await requireRole(["ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };
  const comic = await prisma.comic.delete({ where: { id: comicId }, select: { slug: true } });
  revalidateTag("comic-list");
  revalidateTag("home-feed");
  revalidatePath("/admin/comics");
  void comic;
  return { ok: true };
}

export async function upsertChapterAction(_prev: ActionResult<{ id: string }> | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const authz = await requireRole(["MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };

  let pages: Array<{ pageIndex: number; imageUrl: string }> = [];
  try {
    pages = JSON.parse(String(formData.get("pages") ?? "[]"));
  } catch {
    return { ok: false, error: "Danh sách trang ảnh không hợp lệ" };
  }

  const parsed = chapterUpsertSchema.safeParse({
    id: formData.get("id") || undefined,
    comicId: formData.get("comicId"),
    chapterNumber: formData.get("chapterNumber"),
    title: formData.get("title") || undefined,
    pages,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const data = parsed.data;
  const pagesOrdered = [...data.pages].sort((a, b) => a.pageIndex - b.pageIndex).map((p, i) => ({ pageIndex: i, imageUrl: p.imageUrl }));

  const chapter = await prisma.$transaction(async (tx) => {
    const upserted = await tx.chapter.upsert({
      where: { comicId_chapterNumber: { comicId: data.comicId, chapterNumber: data.chapterNumber } },
      create: {
        comicId: data.comicId,
        chapterNumber: data.chapterNumber,
        title: data.title || null,
        pages: { create: pagesOrdered },
      },
      update: {
        title: data.title || null,
        pages: { deleteMany: {}, create: pagesOrdered },
      },
      select: { id: true, comicId: true },
    });
    await tx.comic.update({ where: { id: data.comicId }, data: { updatedAt: new Date() } });
    return upserted;
  });

  const comic = await prisma.comic.findUnique({ where: { id: data.comicId }, select: { slug: true } });
  if (comic) {
    revalidateTag(`comic-detail-${comic.slug}`);
    revalidateTag("home-feed");
  }
  revalidatePath("/admin/chapters");
  return { ok: true, data: { id: chapter.id } };
}

export async function deleteChapterAction(chapterId: string): Promise<ActionResult> {
  const authz = await requireRole(["MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };
  const chapter = await prisma.chapter.delete({ where: { id: chapterId }, select: { comic: { select: { slug: true } } } });
  if (chapter.comic) revalidateTag(`comic-detail-${chapter.comic.slug}`);
  revalidatePath("/admin/chapters");
  return { ok: true };
}

export async function upsertGenreAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const authz = await requireRole(["MODERATOR", "ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };

  const parsed = genreUpsertSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  const data = parsed.data;
  const slug = data.slug || toSlug(data.name);

  const exists = await prisma.category.findFirst({
    where: { OR: [{ name: data.name }, { slug }], NOT: data.id ? { id: data.id } : undefined },
    select: { id: true },
  });
  if (exists) return { ok: false, error: "Tên hoặc slug thể loại đã tồn tại" };

  await prisma.category.upsert({
    where: { id: data.id ?? "00000000-0000-0000-0000-000000000000" },
    create: { name: data.name, slug, description: data.description || null },
    update: { name: data.name, slug, description: data.description || null },
  });

  revalidateTag("categories");
  revalidatePath("/admin/genres");
  return { ok: true };
}

export async function deleteGenreAction(genreId: string): Promise<ActionResult> {
  const authz = await requireRole(["ADMIN"]);
  if (!authz.ok) return { ok: false, error: authz.error };
  await prisma.category.delete({ where: { id: genreId } });
  revalidateTag("categories");
  revalidatePath("/admin/genres");
  return { ok: true };
}

