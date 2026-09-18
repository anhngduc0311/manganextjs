import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './core-services';
import {
  ComicCard,
  ComicDetail,
  HomeFeed,
  Genre,
  ChapterBrief,
  ChapterDetail,
  ReaderData,
  CommentItem,
  HistoryItem,
  FollowItem,
  ReportItem,
  NotificationItem,
  PagedResult,
  ReaderSettings,
  ReaderMode,
  ReaderTheme
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ComicService {
  private api = inject(ApiService);

  getHomeFeed(): Observable<HomeFeed> {
    return this.api.get<HomeFeed>('comics/home-feed');
  }

  getRankings(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Observable<ComicCard[]> {
    return this.api.get<ComicCard[]>('comics/ranking', { period });
  }

  listCategories(): Observable<Genre[]> {
    return this.api.get<Genre[]>('comics/genres');
  }

  listComics(filters: {
    genres?: string[];
    status?: string;
    sort?: string;
    page?: number;
    perPage?: number;
  }): Observable<PagedResult<ComicCard>> {
    return this.api.get<PagedResult<ComicCard>>('comics', filters);
  }

  getBySlug(slug: string): Observable<ComicDetail> {
    return this.api.get<ComicDetail>(`comics/${slug}`);
  }

  createComic(data: any): Observable<ComicDetail> {
    return this.api.post<ComicDetail>('comics', data);
  }

  updateComic(id: string, data: any): Observable<ComicDetail> {
    return this.api.put<ComicDetail>(`comics/${id}`, data);
  }

  deleteComic(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`comics/${id}`);
  }

  createCategory(data: { name: string; slug?: string; description?: string }): Observable<Genre> {
    return this.api.post<Genre>('comics/genres', data);
  }

  updateCategory(id: string, data: { name?: string; slug?: string; description?: string }): Observable<Genre> {
    return this.api.put<Genre>(`comics/genres/${id}`, data);
  }

  deleteCategory(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`comics/genres/${id}`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ChapterService {
  private api = inject(ApiService);

  getReaderData(comicSlug: string, chapterNumber: number): Observable<ReaderData> {
    return this.api.get<ReaderData>(`chapters/reader/${comicSlug}/${chapterNumber}`);
  }

  listChaptersByComicId(comicId: string): Observable<ChapterBrief[]> {
    return this.api.get<ChapterBrief[]>(`chapters/comic/${comicId}`);
  }

  listChaptersAdmin(comicId: string): Observable<ChapterDetail[]> {
    return this.api.get<ChapterDetail[]>(`chapters/admin/comic/${comicId}`);
  }

  upsertChapter(data: { id?: string; comicId: string; chapterNumber: number; title?: string; pageUrls: string[] }): Observable<ChapterDetail> {
    return this.api.post<ChapterDetail>('chapters', data);
  }

  deleteChapter(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`chapters/${id}`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private api = inject(ApiService);

  list(comicId: string, chapterId?: string, page = 1, perPage = 20): Observable<PagedResult<CommentItem>> {
    return this.api.get<PagedResult<CommentItem>>('comments', { comicId, chapterId, page, perPage });
  }

  create(data: { comicId: string; chapterId?: string; parentId?: string; content: string; isSpoiler?: boolean }): Observable<CommentItem> {
    return this.api.post<CommentItem>('comments', data);
  }

  like(id: string): Observable<{ likes: number }> {
    return this.api.post<{ likes: number }>(`comments/${id}/like`, {});
  }

  remove(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`comments/${id}`);
  }

  listForModeration(page = 1, perPage = 30, search = ''): Observable<PagedResult<CommentItem>> {
    return this.api.get<PagedResult<CommentItem>>('comments/admin/moderation', { page, perPage, search });
  }
}

@Injectable({
  providedIn: 'root'
})
export class RatingService {
  private api = inject(ApiService);

  rateComic(comicId: string, score: number): Observable<{ ratingAvg: number }> {
    return this.api.post<{ ratingAvg: number }>('ratings', { comicId, score });
  }

  getUserRating(comicId: string): Observable<{ score: number | null }> {
    return this.api.get<{ score: number | null }>(`ratings/${comicId}/me`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private api = inject(ApiService);

  getProfile(): Observable<any> {
    return this.api.get('users/profile');
  }

  updateProfile(data: { avatar?: string }): Observable<any> {
    return this.api.patch('users/profile', data);
  }

  getFollows(page = 1, perPage = 20): Observable<PagedResult<FollowItem>> {
    return this.api.get<PagedResult<FollowItem>>('users/follows', { page, perPage });
  }

  toggleFollow(comicId: string): Observable<{ following: boolean }> {
    return this.api.post<{ following: boolean }>(`users/follows/${comicId}`, {});
  }

  isFollowing(comicId: string): Observable<{ following: boolean }> {
    return this.api.get<{ following: boolean }>(`users/follows/${comicId}/status`);
  }

  getHistory(page = 1, perPage = 20): Observable<PagedResult<HistoryItem>> {
    return this.api.get<PagedResult<HistoryItem>>('users/history', { page, perPage });
  }

  recordHistory(comicId: string, chapterId: string, lastReadPage = 1): Observable<{ success: boolean }> {
    return this.api.post<{ success: boolean }>('users/history', { comicId, chapterId, lastReadPage });
  }

  listUsersAdmin(page = 1, perPage = 20, search = '', role?: string): Observable<PagedResult<any>> {
    return this.api.get<PagedResult<any>>('users/admin/list', { page, perPage, search, role });
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.api.patch(`users/admin/${userId}/role`, { role });
  }
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private api = inject(ApiService);

  searchComics(query: string, limit = 24, offset = 0): Observable<PagedResult<ComicCard>> {
    return this.api.get<PagedResult<ComicCard>>('search', { q: query, limit, offset });
  }

  quickSuggest(query: string, limit = 5): Observable<ComicCard[]> {
    return this.api.get<ComicCard[]>('search/suggest', { q: query, limit });
  }
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private api = inject(ApiService);

  listRecent(limit = 10): Observable<NotificationItem[]> {
    return this.api.get<NotificationItem[]>('notifications', { limit });
  }

  countUnread(): Observable<{ count: number }> {
    return this.api.get<{ count: number }>('notifications/unread-count');
  }

  markRead(id: string): Observable<{ success: boolean }> {
    return this.api.patch<{ success: boolean }>(`notifications/${id}/read`, {});
  }

  markAllRead(): Observable<{ success: boolean }> {
    return this.api.patch<{ success: boolean }>('notifications/read-all', {});
  }
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private api = inject(ApiService);

  createReport(chapterId: string, reason: string): Observable<ReportItem> {
    return this.api.post<ReportItem>('reports', { chapterId, reason });
  }

  listReports(page = 1, perPage = 30, status?: string): Observable<PagedResult<ReportItem>> {
    return this.api.get<PagedResult<ReportItem>>('reports/admin/list', { page, perPage, status });
  }

  resolveReport(id: string, status: string): Observable<ReportItem> {
    return this.api.patch<ReportItem>(`reports/admin/${id}/resolve`, { status });
  }
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private api = inject(ApiService);

  getPresignedUrl(filename: string, contentType: string): Observable<{ uploadUrl: string; publicUrl: string; key: string }> {
    return this.api.post<{ uploadUrl: string; publicUrl: string; key: string }>('upload/presign', { filename, contentType });
  }
}

@Injectable({
  providedIn: 'root'
})
export class ReaderSettingsService {
  private settingsSignal = signal<ReaderSettings>({
    mode: 'webtoon',
    theme: 'dark',
    brightness: 100,
    fitWidth: true,
    zoom: 100,
    isAutoScroll: false,
    autoScrollSpeed: 2,
    preloadAheadCount: 4
  });

  public settings = computed(() => this.settingsSignal());

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('truyenkomi-reader-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settingsSignal.set({ ...this.settingsSignal(), ...parsed });
      }
    } catch {}
  }

  private saveSettings(updated: ReaderSettings) {
    this.settingsSignal.set(updated);
    try {
      localStorage.setItem('truyenkomi-reader-settings', JSON.stringify(updated));
    } catch {}
  }

  setMode(mode: ReaderMode) {
    this.saveSettings({ ...this.settingsSignal(), mode });
  }

  setTheme(theme: ReaderTheme) {
    this.saveSettings({ ...this.settingsSignal(), theme });
  }

  setBrightness(brightness: number) {
    this.saveSettings({ ...this.settingsSignal(), brightness });
  }

  setFitWidth(fitWidth: boolean) {
    this.saveSettings({ ...this.settingsSignal(), fitWidth });
  }

  setZoom(zoom: number) {
    this.saveSettings({ ...this.settingsSignal(), zoom: Math.max(50, Math.min(200, zoom)) });
  }

  toggleAutoScroll() {
    this.saveSettings({ ...this.settingsSignal(), isAutoScroll: !this.settingsSignal().isAutoScroll });
  }

  setAutoScrollSpeed(autoScrollSpeed: number) {
    this.saveSettings({ ...this.settingsSignal(), autoScrollSpeed });
  }
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  listenLiveReaders(chapterId: string, onUpdate: (count: number) => void): () => void {
    const eventSource = new EventSource(`/api/realtime/sse?chapterId=${encodeURIComponent(chapterId)}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && typeof data.liveCount === 'number') {
          onUpdate(data.liveCount);
        }
      } catch {}
    };

    return () => {
      eventSource.close();
    };
  }
}
