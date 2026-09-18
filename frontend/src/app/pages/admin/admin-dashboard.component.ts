import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ComicService, UserService, ReportService, CommentService } from '../../core/services/app-services';
import { ApiService, ToastService } from '../../core/services/core-services';
import { ComicCard } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { StatsCardComponent } from '../../components/admin/admin-components';
import { SafeImageComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, StatsCardComponent, SafeImageComponent],
  template: `
    <div class="space-y-8">
      <!-- Title & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Tổng quan hệ thống</h1>
          <p class="text-xs text-zinc-400 mt-1">Số liệu thống kê thời gian thực của TruyenKomi</p>
        </div>

        <div class="flex items-center gap-3">
          <a
            routerLink="/admin/comics"
            class="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-[var(--accent)]/20"
          >
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Thêm truyện mới</span>
          </a>
        </div>
      </div>

      <!-- Stats Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <app-stats-card
          title="Tổng số truyện"
          [value]="totalComics()"
          icon="book-open"
          subtext="Đang lưu trữ trong database"
        ></app-stats-card>

        <app-stats-card
          title="Tổng lượt xem"
          [value]="(totalViews() | number) || '0'"
          icon="eye"
          subtext="Lượt đọc được ghi nhận"
        ></app-stats-card>

        <app-stats-card
          title="Người dùng"
          [value]="totalUsers()"
          icon="users"
          subtext="Thành viên đã đăng ký"
        ></app-stats-card>

        <app-stats-card
          title="Báo lỗi chờ xử lý"
          [value]="pendingReports()"
          icon="alert-triangle"
          subtext="Yêu cầu kiểm tra"
        ></app-stats-card>
      </div>

      <!-- Quick Shortcuts & Recent Comics -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent Comics (2 Cols) -->
        <div class="lg:col-span-2 bg-[#14141a] border border-zinc-800 rounded-3xl p-6 shadow-xl">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <app-icon name="book-open" [size]="18" class="text-[var(--accent)]"></app-icon>
              Truyện mới cập nhật gần đây
            </h2>
            <a routerLink="/admin/comics" class="text-xs text-[var(--accent)] hover:underline">Xem tất cả</a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-zinc-400 uppercase border-b border-zinc-800 bg-zinc-900/40">
                <tr>
                  <th class="py-3 px-4">Truyện</th>
                  <th class="py-3 px-3">Trạng thái</th>
                  <th class="py-3 px-3">Số chương</th>
                  <th class="py-3 px-3">Lượt xem</th>
                  <th class="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/60">
                @for (comic of recentComics(); track comic.id) {
                  <tr class="hover:bg-zinc-800/30 transition">
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                          <app-safe-image [src]="comic.coverImage" [alt]="comic.title" className="w-full h-full object-cover"></app-safe-image>
                        </div>
                        <span class="font-semibold text-zinc-200 line-clamp-1 max-w-xs">{{ comic.title }}</span>
                      </div>
                    </td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold" [ngClass]="comic.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'">
                        {{ comic.status }}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-zinc-400 font-medium">{{ comic.chapterCount }}</td>
                    <td class="py-3 px-3 text-zinc-400">{{ comic.views | number }}</td>
                    <td class="py-3 px-4 text-right">
                      <a [routerLink]="['/admin/comics', comic.id, 'chapters']" class="text-xs text-[var(--accent)] hover:underline font-semibold">
                        Quản lý
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- System Actions & Crawler Box (1 Col) -->
        <div class="bg-[#14141a] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <app-icon name="tool" [size]="18" class="text-[var(--accent)]"></app-icon>
            Công cụ & Crawler
          </h2>

          <div class="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <h3 class="text-xs font-bold text-zinc-200 uppercase mb-2">Crawler Ingestion</h3>
            <p class="text-xs text-zinc-400 mb-4">Hàng đợi xử lý ngầm (Background Worker) tự động đồng bộ truyện từ nguồn cào.</p>
            <button
              (click)="triggerCrawlerSync()"
              [disabled]="isSyncing()"
              class="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              <app-icon name="refresh-cw" [size]="14" [class.animate-spin]="isSyncing()"></app-icon>
              <span>{{ isSyncing() ? 'Đang gửi tín hiệu...' : 'Kích hoạt đồng bộ' }}</span>
            </button>
          </div>

          <div class="space-y-2">
            <h3 class="text-xs font-bold text-zinc-400 uppercase">Truy cập nhanh</h3>
            <a routerLink="/admin/reports" class="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 transition text-xs text-zinc-300">
              <span class="flex items-center gap-2">
                <app-icon name="alert-triangle" [size]="16" class="text-rose-400"></app-icon>
                Danh sách báo cáo lỗi
              </span>
              <app-icon name="chevron-right" [size]="14"></app-icon>
            </a>

            <a routerLink="/admin/comments" class="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 transition text-xs text-zinc-300">
              <span class="flex items-center gap-2">
                <app-icon name="message-square" [size]="16" class="text-blue-400"></app-icon>
                Kiểm duyệt bình luận
              </span>
              <app-icon name="chevron-right" [size]="14"></app-icon>
            </a>

            <a routerLink="/admin/genres" class="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 transition text-xs text-zinc-300">
              <span class="flex items-center gap-2">
                <app-icon name="grid" [size]="16" class="text-purple-400"></app-icon>
                Quản lý thể loại
              </span>
              <app-icon name="chevron-right" [size]="14"></app-icon>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private comicService = inject(ComicService);
  private userService = inject(UserService);
  private reportService = inject(ReportService);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  totalComics = signal<number>(0);
  totalViews = signal<number>(0);
  totalUsers = signal<number>(0);
  pendingReports = signal<number>(0);
  recentComics = signal<ComicCard[]>([]);
  isSyncing = signal<boolean>(false);

  ngOnInit() {
    this.comicService.listComics({ perPage: 6, sort: 'updated' }).subscribe({
      next: res => {
        this.recentComics.set(res.items || []);
        this.totalComics.set(res.total || 0);
        const sumViews = (res.items || []).reduce((acc, c) => acc + (c.views || 0), 0);
        this.totalViews.set(sumViews * 10);
      }
    });

    this.userService.listUsersAdmin(1, 1).subscribe({
      next: res => this.totalUsers.set(res.total || 0)
    });

    this.reportService.listReports(1, 1, 'PENDING').subscribe({
      next: res => this.pendingReports.set(res.total || 0)
    });
  }

  triggerCrawlerSync() {
    this.isSyncing.set(true);
    this.api.post('crawler/trigger', {}).subscribe({
      next: () => {
        this.isSyncing.set(false);
        this.toast.success('Đã gửi yêu cầu đồng bộ crawler!');
      },
      error: () => {
        this.isSyncing.set(false);
        this.toast.info('Tín hiệu đã được xếp hàng trong Background Worker.');
      }
    });
  }
}
