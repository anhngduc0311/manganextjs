import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SafeImage } from "@/components/common/SafeImage";
import { BookOpen, Eye, User, Play, ChevronRight, Home, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { comicService } from "@/services/comic.service";
import { commentService } from "@/services/comment.service";
import { ChapterList } from "@/components/comic/ChapterList";
import { FollowButton } from "@/components/comic/FollowButton";
import { InteractiveRating } from "@/components/comic/InteractiveRating";
import { CommentList } from "@/components/comment/CommentList";
import { PrefetchLink } from "@/components/common/PrefetchLink";

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
    description:
      comic.description?.slice(0, 160) ||
      `Đọc truyện tranh ${comic.title} mới nhất, hình ảnh sắc nét, load nhanh tại TruyenKomi.`,
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
      ? prisma.comicRating.findUnique({
          where: { userId_comicId: { userId, comicId: comic.id } },
          select: { score: true },
        })
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

  const isCompleted = comic.status === "COMPLETED";

  return (
    <div className="space-y-6">
      {/* 🧭 Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400 overflow-x-auto whitespace-nowrap py-1">
        <PrefetchLink
          href="/"
          className="flex items-center gap-1 hover:text-orange-400 transition"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Trang chủ</span>
        </PrefetchLink>
        <ChevronRight className="h-3 w-3 text-zinc-600 shrink-0" />
        <PrefetchLink
          href="/comics"
          className="hover:text-orange-400 transition"
        >
          Danh sách truyện
        </PrefetchLink>
        <ChevronRight className="h-3 w-3 text-zinc-600 shrink-0" />
        <span className="text-zinc-200 font-medium truncate max-w-[240px] sm:max-w-none">
          {comic.title}
        </span>
      </nav>

      {/* 🌟 Hero Header Banner with TruyenGG Backdrop */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[#16161b] shadow-2xl p-5 sm:p-7 md:p-8">
        {/* Ambient Blur Backdrop */}
        <div className="absolute inset-0 overflow-hidden opacity-20 blur-3xl pointer-events-none">
          <SafeImage
            src={comic.coverImage || "/icons/icon-192.png"}
            alt={comic.title}
            fill
            sizes="100vw"
            className="object-cover scale-125"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#16161b] via-[#16161b]/80 to-transparent pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          {/* Cover Poster */}
          <div className="relative aspect-[3/4] w-48 sm:w-56 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 shadow-2xl ring-1 ring-white/10">
            <SafeImage
              src={comic.coverImage || "/icons/icon-192.png"}
              alt={comic.title}
              fill
              priority
              sizes="224px"
              className="object-cover"
            />
            {/* Status Badge */}
            <div className="absolute top-2.5 left-2.5">
              <span
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md ${
                  isCompleted ? "bg-emerald-600" : "bg-orange-500"
                }`}
              >
                {isCompleted ? "Full" : "Đang tiến hành"}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col items-center md:items-start space-y-3.5 text-center md:text-left">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                {comic.title}
              </h1>
              {comic.otherNames && (
                <p className="text-xs sm:text-sm text-zinc-400">
                  <span className="font-semibold text-zinc-300">Tên khác:</span> {comic.otherNames}
                </p>
              )}
            </div>

            {/* Interactive Rating Component */}
            <div>
              <InteractiveRating
                comicId={comic.id}
                initialScore={comic.ratingAvg}
                initialCount={comic.ratingCount}
                userScore={userRating?.score}
                isLoggedIn={!!userId}
              />
            </div>

            {/* Metadata Stats Table/Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full text-xs text-zinc-300 pt-1">
              <div className="flex items-center gap-2 rounded-xl bg-zinc-900/60 p-2 border border-zinc-800/80">
                <Eye className="h-4 w-4 text-orange-400 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-[10px] text-zinc-400">Lượt xem</p>
                  <p className="font-bold truncate">{comic.views.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-zinc-900/60 p-2 border border-zinc-800/80">
                <BookOpen className="h-4 w-4 text-sky-400 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-[10px] text-zinc-400">Số chương</p>
                  <p className="font-bold truncate">{comic.chapters.length} chương</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-zinc-900/60 p-2 border border-zinc-800/80 col-span-2 sm:col-span-1">
                <User className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-[10px] text-zinc-400">Tác giả</p>
                  <p className="font-bold truncate">{comic.author || "Đang cập nhật"}</p>
                </div>
              </div>
            </div>

            {/* Categories Tags */}
            {comic.categories && comic.categories.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
                {comic.categories.map((c) => (
                  <PrefetchLink
                    key={c.slug}
                    href={`/comics?genres=${c.slug}`}
                    className="rounded-lg bg-zinc-900/80 hover:bg-orange-500/20 hover:text-orange-300 border border-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300 transition active:scale-95"
                  >
                    {c.name}
                  </PrefetchLink>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              {lastReadChapterNumber !== null ? (
                <PrefetchLink
                  href={`/comics/${comic.slug}/chuong-${lastReadChapterNumber}`}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition active:scale-95"
                >
                  <Play className="h-4 w-4 fill-white" /> Đọc tiếp (Ch. {lastReadChapterNumber})
                </PrefetchLink>
              ) : firstChapter ? (
                <PrefetchLink
                  href={`/comics/${comic.slug}/chuong-${firstChapter.chapterNumber}`}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition active:scale-95"
                >
                  <Play className="h-4 w-4 fill-white" /> Đọc từ đầu (Ch. {firstChapter.chapterNumber})
                </PrefetchLink>
              ) : null}

              {latestChapter && (
                <PrefetchLink
                  href={`/comics/${comic.slug}/chuong-${latestChapter.chapterNumber}`}
                  className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition active:scale-95"
                >
                  Đọc mới nhất (Ch. {latestChapter.chapterNumber})
                </PrefetchLink>
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
      <section className="rounded-2xl border border-zinc-800 bg-[#16161b] p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2.5">
          <Sparkles className="h-4 w-4 text-orange-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            Giới Thiệu Nội Dung
          </h3>
        </div>
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
      <section className="rounded-2xl border border-zinc-800 bg-[#16161b] p-5 sm:p-6 shadow-xl">
        <CommentList
          comicId={comic.id}
          comments={commentsData.items}
          isLoggedIn={!!userId}
        />
      </section>
    </div>
  );
}

