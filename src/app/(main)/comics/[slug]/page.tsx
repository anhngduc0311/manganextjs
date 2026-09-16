import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Star, Eye, User, Clock, Bookmark, Play } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { comicService } from "@/services/comic.service";
import { commentService } from "@/services/comment.service";
import { ChapterList } from "@/components/comic/ChapterList";
import { FollowButton } from "@/components/comic/FollowButton";
import { InteractiveRating } from "@/components/comic/InteractiveRating";
import { RatingStar } from "@/components/ui/RatingStar";
import { CommentList } from "@/components/comment/CommentList";

interface ComicDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ComicDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const comic = await comicService.getBySlug(slug);

  if (!comic) {
    return { title: "Không tìm thấy truyện — TruyenKomi" };
  }

  return {
    title: `${comic.title} | Đọc Truyện Tranh Online`,
    description: comic.description?.slice(0, 160) || `Đọc truyện tranh ${comic.title} mới nhất, hình ảnh sắc nét, load nhanh tại TruyenKomi.`,
    openGraph: {
      title: `${comic.title} — TruyenKomi`,
      description: comic.description?.slice(0, 160) || `Đọc truyện ${comic.title} online`,
      images: comic.coverImage ? [{ url: comic.coverImage }] : [],
    },
  };
}

export default async function ComicDetailPage({ params }: ComicDetailPageProps) {
  const { slug } = await params;
  const comic = await comicService.getBySlug(slug);

  if (!comic) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id;

  // Check following status, user rating, and last read history in parallel
  const [followingCount, userRating, lastHistory, commentsData] = await Promise.all([
    userId
      ? prisma.follow.count({ where: { userId, comicId: comic.id } })
      : Promise.resolve(0),
    userId
      ? prisma.comicRating.findUnique({ where: { userId_comicId: { userId, comicId: comic.id } }, select: { score: true } })
      : Promise.resolve(null),
    userId
      ? prisma.history.findFirst({
          where: { userId, comicId: comic.id },
          orderBy: { updatedAt: "desc" },
          include: { chapter: { select: { chapterNumber: true } } },
        })
      : Promise.resolve(null),
    commentService.list(comic.id, null, 1, 30).catch(() => ({ items: [], total: 0 })),
  ]);

  const isFollowing = followingCount > 0;
  const lastReadChapterId = lastHistory?.chapterId || null;
  const lastReadChapterNumber = lastHistory?.chapter?.chapterNumber || null;

  // Find first & latest chapters
  const sortedChapters = [...comic.chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
  const firstChapter = sortedChapters[0];
  const latestChapter = sortedChapters[sortedChapters.length - 1];

  return (
    <div className="space-y-10">
      {/* Hero Header Banner with Backdrop */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 sm:p-8 md:p-10">
        {/* Background Ambient Blur */}
        <div className="absolute inset-0 overflow-hidden opacity-20 blur-3xl pointer-events-none">
          <Image
            src={comic.coverImage || "/icons/icon-192.png"}
            alt={comic.title}
            fill
            sizes="100vw"
            className="object-cover scale-125"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
          {/* Cover Poster */}
          <div className="relative aspect-[3/4] w-48 sm:w-56 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 shadow-2xl ring-1 ring-white/10">
            <Image
              src={comic.coverImage || "/icons/icon-192.png"}
              alt={comic.title}
              fill
              priority
              sizes="224px"
              className="object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col items-center md:items-start space-y-4 text-center md:text-left">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                {comic.title}
              </h1>
              {comic.otherNames && (
                <p className="text-xs sm:text-sm text-zinc-400">Tên khác: {comic.otherNames}</p>
              )}
            </div>

            {/* Interactive Rating Component */}
            <div className="pt-1">
              <InteractiveRating
                comicId={comic.id}
                initialScore={comic.ratingAvg}
                initialCount={comic.ratingCount}
                userScore={userRating?.score}
                isLoggedIn={!!userId}
              />
            </div>

            {/* Metadata Stats */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-zinc-300">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-zinc-400" />
                <span>{comic.views.toLocaleString()} lượt xem</span>
              </div>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-orange-400" />
                <span>{comic.chapters.length} chương</span>
              </div>
              {comic.author && (
                <>
                  <span className="text-zinc-600">•</span>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <User className="h-4 w-4" />
                    <span>{comic.author}</span>
                  </div>
                </>
              )}
            </div>

            {/* Categories Tags */}
            {comic.categories && comic.categories.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                {comic.categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/comics?genres=${c.slug}`}
                    className="rounded-lg bg-zinc-800/90 hover:bg-orange-500/20 hover:text-orange-300 border border-zinc-700/60 px-2.5 py-1 text-xs font-semibold text-zinc-300 transition"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              {lastReadChapterNumber !== null ? (
                <Link
                  href={`/comics/${comic.slug}/chuong-${lastReadChapterNumber}`}
                  prefetch={true}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition active:scale-95"
                >
                  <Play className="h-4 w-4 fill-white" /> Đọc tiếp (Ch. {lastReadChapterNumber})
                </Link>
              ) : firstChapter ? (
                <Link
                  href={`/comics/${comic.slug}/chuong-${firstChapter.chapterNumber}`}
                  prefetch={true}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition active:scale-95"
                >
                  <Play className="h-4 w-4 fill-white" /> Đọc từ đầu (Ch. {firstChapter.chapterNumber})
                </Link>
              ) : null}

              {latestChapter && (
                <Link
                  href={`/comics/${comic.slug}/chuong-${latestChapter.chapterNumber}`}
                  prefetch={true}
                  className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/90 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition active:scale-95"
                >
                  Đọc mới nhất (Ch. {latestChapter.chapterNumber})
                </Link>
              )}

              <FollowButton
                comicId={comic.id}
                initialFollowing={isFollowing}
                isLoggedIn={!!userId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Description / Synopsis Section */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">Giới Thiệu Nội Dung</h3>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {comic.description || "Bộ truyện hiện chưa có phần tóm tắt nội dung."}
        </p>
      </section>

      {/* Chapter List Section */}
      <section>
        <ChapterList
          comicSlug={comic.slug}
          chapters={comic.chapters}
          lastReadChapterId={lastReadChapterId}
        />
      </section>

      {/* Comments Section */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
        <CommentList
          comicId={comic.id}
          comments={commentsData.items}
          isLoggedIn={!!userId}
        />
      </section>
    </div>
  );
}
