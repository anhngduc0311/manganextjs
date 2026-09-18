export type Role = 'USER' | 'MODERATOR' | 'ADMIN';
export type ComicStatus = 'ONGOING' | 'COMPLETED' | 'DROPPED';
export type ReaderMode = 'webtoon' | 'single';
export type ReaderTheme = 'dark' | 'light' | 'sepia' | 'amoled';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatar?: string;
  exp: number;
  level: number;
  dailyStreak: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  comicCount?: number;
}

export interface ComicCard {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  status: ComicStatus;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  chapterCount: number;
  latestChapterNumber?: number;
  updatedAt: string;
  categories: string[];
}

export interface ChapterBrief {
  id: string;
  chapterNumber: number;
  title?: string;
  views: number;
  createdAt: string;
}

export interface ChapterPage {
  id: string;
  pageIndex: number;
  imageUrl: string;
}

export interface ChapterDetail {
  id: string;
  comicId: string;
  chapterNumber: number;
  title?: string;
  views: number;
  createdAt: string;
  pages: ChapterPage[];
}

export interface ComicDetail {
  id: string;
  title: string;
  slug: string;
  otherNames?: string;
  author?: string;
  status: ComicStatus;
  coverImage: string;
  bannerImage?: string;
  description?: string;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  chapterCount: number;
  latestChapterNumber?: number;
  createdAt: string;
  updatedAt: string;
  categories: Genre[];
  chapters: ChapterBrief[];
}

export interface HomeFeed {
  hot: ComicCard[];
  latest: ComicCard[];
}

export interface ReaderData {
  comic: ComicCard;
  chapter: ChapterDetail;
  pages: ChapterPage[];
  prevChapterNumber?: number;
  nextChapterNumber?: number;
}

export interface CommentUser {
  id: string;
  username: string;
  avatar?: string;
  level: number;
}

export interface CommentItem {
  id: string;
  content: string;
  isSpoiler: boolean;
  likes: number;
  userId: string;
  user?: CommentUser;
  comicId: string;
  chapterId?: string;
  parentId?: string;
  createdAt: string;
  replies?: CommentItem[];
}

export interface HistoryItem {
  comicId: string;
  comicTitle: string;
  comicSlug: string;
  comicCover: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle?: string;
  lastReadPage: number;
  updatedAt: string;
}

export interface FollowItem {
  comicId: string;
  comicTitle: string;
  comicSlug: string;
  comicCover: string;
  latestChapterNumber?: number;
  followedAt: string;
  comicUpdatedAt: string;
}

export interface ReportItem {
  id: string;
  userId?: string;
  username?: string;
  chapterId: string;
  chapterNumber: number;
  comicId: string;
  comicTitle: string;
  comicSlug: string;
  reason: string;
  status: string; // PENDING, RESOLVED, REJECTED
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ReaderSettings {
  mode: ReaderMode;
  theme: ReaderTheme;
  brightness: number; // 30 -> 100 (%)
  fitWidth: boolean;
  zoom: number; // 50 -> 200 (%)
  isAutoScroll: boolean;
  autoScrollSpeed: number; // 0.5 -> 5
  preloadAheadCount: number;
}
