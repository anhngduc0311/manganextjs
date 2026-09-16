import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { chapterService } from "@/services/chapter.service";
import { commentService } from "@/services/comment.service";
import { ReaderView } from "@/components/reader/ReaderView";
import { ReaderToolbar } from "@/components/reader/ReaderToolbar";
import { CommentList } from "@/components/comment/CommentList";

interface ReaderPageProps {
  params: Promise<{
    slug: string;
    chapter: string;
  }>;
}

function parseChapterNumber(param: string): number | null {
  const match = param.match(/(?:chuong-)?([0-9]+(?:\.[0-9]+)?)/i);
  if (!match || !match[1]) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

export async function generateMetadata({ params }: ReaderPageProps): Promise<Metadata> {
  const { slug, chapter } = await params;
  const chapterNumber = parseChapterNumber(chapter);
  if (chapterNumber === null) return { title: "Không tìm thấy chương — TruyenKomi" };

  const data = await chapterService.getReaderData(slug, chapterNumber);
  if (!data) return { title: "Không tìm thấy chương — TruyenKomi" };

  return {
    title: `Đọc ${data.comic.title} Chương ${data.chapter.chapterNumber} — TruyenKomi`,
    description: `Đọc truyện ${data.comic.title} chương ${data.chapter.chapterNumber} mới nhất, tải trang nhanh không quảng cáo tại TruyenKomi.`,
  };
}

export default async function ChapterReaderPage({ params }: ReaderPageProps) {
  const { slug, chapter } = await params;
  const chapterNumber = parseChapterNumber(chapter);

  if (chapterNumber === null) {
    notFound();
  }

  const data = await chapterService.getReaderData(slug, chapterNumber);
  if (!data) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id;

  // Track reading history in background if user is logged in
  if (userId) {
    prisma.history
      .upsert({
        where: { userId_comicId: { userId, comicId: data.comic.id } },
        create: { userId, comicId: data.comic.id, chapterId: data.chapter.id, lastReadPage: 1 },
        update: { chapterId: data.chapter.id, updatedAt: new Date() },
      })
      .catch(() => {});
  }

  // Fetch all chapters of this comic for the toolbar dropdown & chapter comments in parallel
  const [allChaptersRows, commentsData] = await Promise.all([
    prisma.chapter.findMany({
      where: { comicId: data.comic.id },
      select: { id: true, chapterNumber: true, title: true, views: true, createdAt: true },
      orderBy: { chapterNumber: "desc" },
    }),
    commentService.list(data.comic.id, data.chapter.id, 1, 30).catch(() => ({ items: [], total: 0 })),
  ]);

  const allChapters = allChaptersRows.map((ch) => ({
    id: ch.id,
    chapterNumber: ch.chapterNumber,
    title: ch.title,
    views: Number(ch.views),
    createdAt: ch.createdAt.toISOString(),
  }));

  const pageImageUrls = data.pages.map((p) => p.imageUrl);

  return (
    <div className="space-y-8 pb-20">
      {/* Top Breadcrumb Nav */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Link
            href={`/comics/${data.comic.slug}`}
            className="flex items-center gap-1 font-semibold text-zinc-200 hover:text-orange-400 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="truncate max-w-[200px] sm:max-w-xs">{data.comic.title}</span>
          </Link>
          <span>/</span>
          <span className="font-bold text-orange-400">Chương {data.chapter.chapterNumber}</span>
        </div>

        <Link
          href={`/comics/${data.comic.slug}`}
          className="flex items-center gap-1 rounded-lg bg-zinc-800/80 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
        >
          <BookOpen className="h-3.5 w-3.5 text-orange-400" />
          <span>Danh sách chương</span>
        </Link>
      </div>

      {/* Chapter Reader View (Webtoon / Single / RTL) */}
      <div className="min-h-[60vh]">
        <ReaderView
          comicSlug={data.comic.slug}
          chapterId={data.chapter.id}
          pages={data.pages}
          prevChapterNumber={data.prevChapterNumber}
          nextChapterNumber={data.nextChapterNumber}
        />
      </div>

      {/* Chapter Comments Section */}
      <section className="mx-auto max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
        <CommentList
          comicId={data.comic.id}
          chapterId={data.chapter.id}
          comments={commentsData.items}
          isLoggedIn={!!userId}
        />
      </section>

      {/* Floating Reader HUD Toolbar */}
      <ReaderToolbar
        comicSlug={data.comic.slug}
        comicTitle={data.comic.title}
        currentChapter={{
          id: data.chapter.id,
          chapterNumber: data.chapter.chapterNumber,
          title: data.chapter.title,
          views: data.chapter.views,
          createdAt: new Date().toISOString(),
        }}
        allChapters={allChapters}
        pageUrls={pageImageUrls}
      />
    </div>
  );
}
