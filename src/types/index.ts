export type Role = "USER" | "MODERATOR" | "ADMIN";
export type ComicStatus = "ONGOING" | "COMPLETED" | "DROPPED";
export type RankingPeriod = "daily" | "weekly" | "monthly";
export type ReaderMode = "webtoon" | "single" | "double-rtl";
export type ReaderTheme = "light" | "dark" | "sepia" | "amoled";

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  comicCount?: number;
}

export interface ChapterItemDTO {
  id: string;
  chapterNumber: number;
  title: string | null;
  views: number;
  createdAt: string;
}

export type ChapterDTO = ChapterItemDTO;

export interface ComicCardDTO {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  status: ComicStatus;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  chapterCount: number;
  latestChapterNumber?: number | null;
  updatedAt: string;
  categories: Pick<CategoryDTO, "name" | "slug">[];
}

export interface ComicDetailDTO extends ComicCardDTO {
  otherNames: string | null;
  author: string | null;
  bannerImage: string | null;
  description: string | null;
  monthlyViews: number;
  weeklyViews: number;
  createdAt: string;
  chapters: ChapterItemDTO[];
}

export interface PageDTO {
  pageIndex: number;
  imageUrl: string;
}

export type ChapterPageDTO = PageDTO;

export interface ReaderDataDTO {
  comic: Pick<ComicCardDTO, "id" | "title" | "slug" | "coverImage">;
  chapter: { id: string; chapterNumber: number; title: string | null; views: number };
  pages: PageDTO[];
  prevChapterNumber: number | null;
  nextChapterNumber: number | null;
  totalChapters: number;
}

export interface CommentUserDTO {
  id: string;
  username: string;
  avatar: string | null;
  level: number;
  role?: Role;
}

export interface CommentDTO {
  id: string;
  content: string;
  isSpoiler: boolean;
  likes: number;
  createdAt: string;
  comicId: string;
  chapterId: string | null;
  user: CommentUserDTO;
  replies: CommentDTO[];
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatar?: string | null;
  level: number;
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; error?: string }
  | { ok: false; error: string; data?: T };

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

