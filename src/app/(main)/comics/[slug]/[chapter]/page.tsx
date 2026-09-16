import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
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
  const [allChapters, commentsData] = await Promise.all([
    chapterService.listChaptersByComicId(data.comic.id).catch(() => []),
    commentService.list(data.comic.id, data.chapter.id, 1, 30).catch(() => ({ items: [], total: 0 })),
  ]);

  const pageImageUrls = data.pages.map((p) => p.imageUrl);

  return (
    <div className="min-h-screen bg-black text-zinc-100 pb-20 pt-14">
      {/* Sticky Top Reader Navigation Bar (TruyenKomi Style) */}
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

      {/* Main Chapter Reader Images */}
      <main className="w-full">
        <ReaderView
          comicId={data.comic.id}
          comicSlug={data.comic.slug}
          chapterId={data.chapter.id}
          pages={data.pages}
          prevChapterNumber={data.prevChapterNumber}
          nextChapterNumber={data.nextChapterNumber}
        />
      </main>

      {/* Bottom Chapter Switcher Controls */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {data.prevChapterNumber !== null && data.prevChapterNumber !== undefined ? (
            <Link
              href={`/comics/${data.comic.slug}/chuong-${data.prevChapterNumber}`}
              className="flex items-center gap-2 rounded-xl bg-zinc-800/90 border border-zinc-700/60 px-4 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 hover:text-white transition shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Chương trước</span>
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800/40 px-4 py-2.5 text-xs font-bold text-zinc-600 cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Chương trước</span>
            </button>
          )}

          <Link
            href={`/comics/${data.comic.slug}`}
            className="flex items-center gap-2 rounded-xl bg-zinc-800/90 border border-zinc-700/60 px-4 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 hover:text-white transition shadow-sm"
          >
            <BookOpen className="h-4 w-4 text-orange-400" />
            <span>Mục lục</span>
          </Link>

          {data.nextChapterNumber !== null && data.nextChapterNumber !== undefined ? (
            <Link
              href={`/comics/${data.comic.slug}/chuong-${data.nextChapterNumber}`}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:brightness-110 transition"
            >
              <span>Chương tiếp</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800/40 px-5 py-2.5 text-xs font-bold text-zinc-600 cursor-not-allowed"
            >
              <span>Hết chương</span>
            </button>
          )}
        </div>
      </div>

      {/* Chapter Comments Section */}
      <section id="comments-section" className="mx-auto max-w-3xl px-4 pt-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6 shadow-2xl backdrop-blur-sm">
          <h3 className="text-sm font-bold text-zinc-200 mb-4 flex items-center gap-2">
            💬 Bình luận chương {data.chapter.chapterNumber}
          </h3>
          <CommentList
            comicId={data.comic.id}
            chapterId={data.chapter.id}
            comments={commentsData.items}
            isLoggedIn={!!userId}
          />
        </div>
      </section>
    </div>
  );
}
