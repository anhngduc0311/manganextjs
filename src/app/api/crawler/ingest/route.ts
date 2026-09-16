import { NextRequest, NextResponse } from "next/server";
import { Queue } from "bullmq";
import { prisma } from "@/lib/prisma";
import { getTcpRedis } from "@/lib/redis";
import { comicService } from "@/services/comic.service";
import { translateMangaDexGenre } from "@/services/mangadex.service";
import { toSlug } from "@/lib/text-normalizer";
import { ingestSchema } from "@/types/schemas";
import type { ChapterJobData } from "@/../workers/crawler.worker";

let ingestQueue: Queue<ChapterJobData> | null = null;

async function getIngestQueue() {
  if (ingestQueue) return ingestQueue;
  const tcp = await getTcpRedis();
  if (tcp) {
    ingestQueue = new Queue<ChapterJobData>("ingestion", { connection: tcp as any });
  }
  return ingestQueue;
}

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

    // 5. Enqueue Chapter Ingestion Jobs to BullMQ
    const queue = await getIngestQueue();
    if (!queue) {
      return NextResponse.json(
        {
          ok: false,
          error: "Hàng đợi xử lý ảnh (BullMQ / Redis) hiện không khả dụng. Vui lòng kiểm tra dịch vụ Redis.",
        },
        { status: 503 }
      );
    }

    const jobIds: string[] = [];

    for (const ch of chaptersData) {
      const jobData: ChapterJobData = {
        comicId: comic.id,
        comicSlug: comic.slug,
        comicTitle: comic.title,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        sourcePageUrls: ch.pages,
      };

      const job = await queue.add(`ingest-${comic.slug}-ch-${ch.chapterNumber}`, jobData, {
        jobId: `job_${comic.id}_${ch.chapterNumber}`,
        removeOnComplete: 100,
        removeOnFail: 200,
      });
      jobIds.push(String(job.id));
    }

    return NextResponse.json({
      ok: true,
      comicId: comic.id,
      comicSlug: comic.slug,
      jobIds,
      queued: chaptersData.length,
      message: `Đã nạp metadata "${comic.title}" và đẩy ${chaptersData.length} chương vào hàng đợi xử lý ảnh.`,
    });
  } catch (error: any) {
    console.error("[Ingest API Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Lỗi khi xử lý dữ liệu ingest" },
      { status: 500 }
    );
  }
}
