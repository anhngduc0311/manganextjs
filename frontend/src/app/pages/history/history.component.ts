import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/app-services';
import { ToastService } from '../../core/services/core-services';
import { HistoryItem } from '../../core/models';
import { SafeImageComponent, PaginationComponent, SkeletonComponent } from '../../shared/components/ui-components';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SafeImageComponent, PaginationComponent, SkeletonComponent, IconComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border)]">
        <div>
          <div class="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-1">
            <a routerLink="/" class="hover:text-[var(--accent)] transition-colors">Trang chủ</a>
            <span>/</span>
            <span class="text-[var(--text-primary)]">Lịch sử đọc truyện</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-[var(--text-primary)] flex items-center gap-3">
            <app-icon name="history" [size]="28" class="text-[var(--accent)]"></app-icon>
            Lịch sử đọc truyện
          </h1>
        </div>
      </div>

      <!-- History Content -->
      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (i of [1,2,3,4,5,6]; track i) {
            <app-skeleton class="h-28 rounded-2xl"></app-skeleton>
          }
        </div>
      } @else if (items().length === 0) {
        <div class="text-center py-20 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] max-w-lg mx-auto p-8">
          <div class="w-16 h-16 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mx-auto mb-4">
            <app-icon name="book-open" [size]="32"></app-icon>
          </div>
          <h3 class="text-lg font-bold text-[var(--text-primary)] mb-2">Chưa có lịch sử đọc truyện</h3>
          <p class="text-sm text-[var(--text-muted)] mb-6">Bạn chưa đọc bộ truyện nào. Hãy khám phá kho truyện đặc sắc của chúng tôi!</p>
          <a
            routerLink="/"
            class="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-md shadow-[var(--accent)]/20"
          >
            <app-icon name="compass" [size]="16"></app-icon>
            <span>Khám phá ngay</span>
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (item of items(); track item.comicId) {
            <div class="bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/40 rounded-2xl p-4 flex gap-4 transition-all hover:shadow-md group">
              <!-- Cover image -->
              <a [routerLink]="['/comic', item.comicSlug]" class="relative w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0 bg-[var(--bg-secondary)] shadow-sm">
                <app-safe-image
                  [src]="item.comicCover"
                  [alt]="item.comicTitle"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                ></app-safe-image>
              </a>

              <!-- Details & Action -->
              <div class="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <a [routerLink]="['/comic', item.comicSlug]" class="font-bold text-sm sm:text-base text-[var(--text-primary)] hover:text-[var(--accent)] line-clamp-1 transition-colors">
                    {{ item.comicTitle }}
                  </a>
                  <div class="flex items-center gap-2 mt-1.5 text-xs text-[var(--text-muted)]">
                    <span class="bg-[var(--bg-secondary)] px-2 py-0.5 rounded-md border border-[var(--border)] text-[var(--accent)] font-medium">
                      Đang đọc Chapter {{ item.chapterNumber }}
                    </span>
                    @if (item.lastReadPage > 1) {
                      <span>• Trang {{ item.lastReadPage }}</span>
                    }
                  </div>
                  <p class="text-xs text-[var(--text-muted)] mt-2">
                    {{ item.updatedAt | date:'dd/MM/yyyy HH:mm' }}
                  </p>
                </div>

                <div class="flex items-center justify-between pt-3 border-t border-[var(--border)]/50 mt-2">
                  <a
                    [routerLink]="['/comic', item.comicSlug, 'chapter', item.chapterNumber]"
                    class="inline-flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    <app-icon name="book-open" [size]="14"></app-icon>
                    <span>Đọc tiếp</span>
                  </a>
                  <a
                    [routerLink]="['/comic', item.comicSlug]"
                    class="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Chi tiết truyện
                  </a>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        <div class="mt-8">
          <app-pagination
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            (pageChange)="onPageChange($event)"
          ></app-pagination>
        </div>
      }
    </div>
  `
})
export class HistoryPageComponent implements OnInit {
  private userService = inject(UserService);
  private toast = inject(ToastService);

  items = signal<HistoryItem[]>([]);
  loading = signal<boolean>(true);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);

  ngOnInit() {
    this.loadHistory(1);
  }

  loadHistory(page: number) {
    this.loading.set(true);
    this.currentPage.set(page);
    this.userService.getHistory(page, 20).subscribe({
      next: res => {
        this.items.set(res.items || []);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.loadHistory(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
