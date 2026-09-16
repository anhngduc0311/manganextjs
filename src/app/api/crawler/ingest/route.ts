import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comicService } from "@/services/comic.service";
import { translateMangaDexGenre } from "@/services/mangadex.service";
import { toSlug } from "@/lib/text-normalizer";
import { ingestSchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
  // 1. Bearer Secret Verification
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRAWLER_SECRET_KEY || "dev-crawler-secret";

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ ok: false, error: "Thiếu Bearer Token ủy quyền" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (token !== secret) {
    return NextResponse.json({ ok: false, error: "Secret key không hợp lệ" }, { status: 401 });
  }

  // 2. Validate payload
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON payload không hợp lệ" }, { status: 400 });
  }

  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu truyện/chương không hợp lệ" },
      { status: 400 }
    );
  }

  const { comic: comicData, chapters: chaptersData } = parsed.data;

  try {
    // 3. Upsert Categories dynamically
    const uniqueSlugs = new Set<string>();
    const categoryRecords: Array<{ id: string }> = [];

    for (const rawCat of comicData.categories) {
      if (!rawCat || !rawCat.trim()) continue;
      const catName = translateMangaDexGenre(rawCat);
      const slug = toSlug(catName);
      if (!slug || uniqueSlugs.has(slug)) continue;
      uniqueSlugs.add(slug);

      const record = await prisma.category.upsert({
        where: { slug },
        create: { name: catName, slug, description: `Thể loại truyện tranh ${catName}` },
        update: { name: catName },
        select: { id: true },
      });
      categoryRecords.push(record);
    }

    // 4. Synchronously Upsert Comic Metadata
    const comicSlug = comicData.slug || toSlug(comicData.title);

    const comic = await prisma.comic.upsert({
      where: { slug: comicSlug },
      create: {
        title: comicData.title,
        titleUnaccent: comicService.normalizeTitle(comicData.title),
        slug: comicSlug,
        otherNames: comicData.otherNames || null,
        author: comicData.author || null,
        status: comicData.status || "ONGOING",
        coverImage: comicData.coverImage || "/icons/icon-192.png",
        description: comicData.description || null,
        categories: {
          create: categoryRecords.map((cat) => ({ categoryId: cat.id })),
        },
      },
      update: {
        title: comicData.title,
        titleUnaccent: comicService.normalizeTitle(comicData.title),
        otherNames: comicData.otherNames || null,
        author: comicData.author || null,
        status: comicData.status || undefined,
        coverImage: comicData.coverImage || undefined,
        description: comicData.description || undefined,
        categories: {
          deleteMany: {},
          create: categoryRecords.map((cat) => ({ categoryId: cat.id })),
        },
      },
      select: { id: true, slug: true, title: true },
    });

    // 5. Directly Upsert Chapters and Pages into Database (no worker required)
    let savedChaptersCount = 0;
    for (const ch of chaptersData) {
      await prisma.$transaction(async (tx) => {
        await tx.chapter.upsert({
          where: {
            comicId_chapterNumber: {
              comicId: comic.id,
              chapterNumber: ch.chapterNumber,
            },
          },
          create: {
            comicId: comic.id,
            chapterNumber: ch.chapterNumber,
            title: ch.title || null,
            pages: {
              create: ch.pages.map((url, pageIndex) => ({
                pageIndex,
                imageUrl: url,
              })),
            },
          },
          update: {
            title: ch.title || null,
            pages: {
              deleteMany: {},
              create: ch.pages.map((url, pageIndex) => ({
                pageIndex,
                imageUrl: url,
              })),
            },
          },
        });

        const totalChapters = await tx.chapter.count({ where: { comicId: comic.id } });
        const latest = await tx.chapter.findFirst({
          where: { comicId: comic.id },
          orderBy: { chapterNumber: "desc" },
          select: { chapterNumber: true },
        });

        await tx.comic.update({
          where: { id: comic.id },
          data: {
            chapterCount: totalChapters,
            latestChapterNumber: latest?.chapterNumber ?? ch.chapterNumber,
          },
        });
      });
      savedChaptersCount++;
    }

    return NextResponse.json({
      ok: true,
      comicId: comic.id,
      comicSlug: comic.slug,
      savedChapters: savedChaptersCount,
      message: `Đã nạp thành công truyện "${comic.title}" và lưu ${savedChaptersCount} chương trực tiếp vào CSDL.`,
    });
  } catch (error: any) {
    console.error("[Ingest API Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Lỗi khi xử lý dữ liệu ingest" },
      { status: 500 }
    );
  }
}

