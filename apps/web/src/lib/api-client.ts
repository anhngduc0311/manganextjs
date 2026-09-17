import type {
  ComicCardDTO,
  ComicDetailDTO,
  CategoryDTO,
  ChapterDTO,
  ReaderDataDTO,
  CommentDTO,
  NotificationDTO,
  SessionUser,
  AuthResponseDTO,
  ComicStatus,
  RankingPeriod,
} from "@truyenkomi/types";

const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api";

interface FetchOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined | string[]>;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | string[]>): string {
    const url = new URL(`${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val === undefined || val === null || val === "") return;
        if (Array.isArray(val)) {
          val.forEach((item) => url.searchParams.append(key, String(item)));
        } else {
          url.searchParams.set(key, String(val));
        }
      });
    }
    return url.toString();
  }

  private async request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { token, params, headers, ...rest } = options;
    const url = this.buildUrl(path, params);

    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
    };

    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...rest,
      headers: reqHeaders,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // --- AUTH ---
  async login(identifier: string, password: string): Promise<AuthResponseDTO> {
    return this.request<AuthResponseDTO>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  }

  async register(username: string, email: string, password: string): Promise<AuthResponseDTO> {
    return this.request<AuthResponseDTO>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  }

  async getMe(token: string): Promise<SessionUser> {
    return this.request<SessionUser>("/auth/me", { token });
  }

  // --- COMICS ---
  async getHomeFeed(): Promise<{ hot: ComicCardDTO[]; latest: ComicCardDTO[] }> {
    return this.request<{ hot: ComicCardDTO[]; latest: ComicCardDTO[] }>("/comics/home-feed");
  }

  async getComicBySlug(slug: string): Promise<ComicDetailDTO | null> {
    try {
      return await this.request<ComicDetailDTO>(`/comics/${slug}`);
    } catch {
      return null;
    }
  }

  async listComics(params: {
    genres?: string[];
    status?: ComicStatus | "";
    sort?: "views" | "rating" | "updated" | "new";
    page?: number;
    perPage?: number;
  }): Promise<{ items: ComicCardDTO[]; total: number; page: number; perPage: number; totalPages: number }> {
    return this.request("/comics", { params: params as any });
  }

  async getRankings(period: RankingPeriod = "daily"): Promise<ComicCardDTO[]> {
    return this.request<ComicCardDTO[]>("/comics/ranking", { params: { period } });
  }

  async listGenres(): Promise<CategoryDTO[]> {
    return this.request<CategoryDTO[]>("/comics/genres");
  }

  // --- CHAPTERS & READER ---
  async getReaderData(comicSlug: string, chapterNumber: number): Promise<ReaderDataDTO | null> {
    try {
      return await this.request<ReaderDataDTO>(`/chapters/reader/${comicSlug}/${chapterNumber}`);
    } catch {
      return null;
    }
  }

  async listChaptersByComicId(comicId: string): Promise<ChapterDTO[]> {
    return this.request<ChapterDTO[]>(`/chapters/comic/${comicId}`);
  }

  // --- COMMENTS ---
  async listComments(comicId: string, chapterId?: string | null, page = 1, perPage = 20): Promise<{ items: CommentDTO[]; total: number; page: number; perPage: number; totalPages: number }> {
    return this.request("/comments", {
      params: { comicId, chapterId: chapterId || undefined, page, perPage },
    });
  }

  async createComment(token: string, data: { comicId: string; chapterId?: string | null; content: string; parentId?: string | null }): Promise<CommentDTO> {
    return this.request<CommentDTO>("/comments", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  }

  async likeComment(commentId: string): Promise<{ likes: number }> {
    return this.request<{ likes: number }>(`/comments/${commentId}/like`, { method: "POST" });
  }

  // --- RATINGS ---
  async rateComic(token: string, comicId: string, score: number): Promise<{ ratingAvg: number; ratingCount: number }> {
    return this.request<{ ratingAvg: number; ratingCount: number }>("/ratings", {
      method: "POST",
      token,
      body: JSON.stringify({ comicId, score }),
    });
  }

  // --- SEARCH ---
  async search(q: string, limit = 24, offset = 0): Promise<{ items: ComicCardDTO[]; total: number }> {
    return this.request("/search", { params: { q, limit, offset } });
  }

  async searchSuggest(q: string, limit = 5): Promise<ComicCardDTO[]> {
    return this.request<ComicCardDTO[]>("/search/suggest", { params: { q, limit } });
  }

  // --- VIEWS ---
  async recordView(comicId: string, chapterId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>("/views", {
      method: "POST",
      body: JSON.stringify({ comicId, chapterId }),
    });
  }

  // --- USER PROFILE & ACTIONS ---
  async getProfile(token: string) {
    return this.request("/users/profile", { token });
  }

  async toggleFollow(token: string, comicId: string): Promise<{ following: boolean }> {
    return this.request<{ following: boolean }>(`/users/follows/${comicId}`, {
      method: "POST",
      token,
    });
  }

  async isFollowing(token: string, comicId: string): Promise<{ following: boolean }> {
    return this.request<{ following: boolean }>(`/users/follows/${comicId}/status`, { token });
  }

  async getFollows(token: string, page = 1, perPage = 20) {
    return this.request("/users/follows", { token, params: { page, perPage } });
  }

  async getHistory(token: string, page = 1, perPage = 20) {
    return this.request("/users/history", { token, params: { page, perPage } });
  }

  async recordHistory(token: string, data: { comicId: string; chapterId: string; lastReadPage: number }) {
    return this.request("/users/history", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
