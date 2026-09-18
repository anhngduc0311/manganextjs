import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/app-services';
import { ToastService } from '../../core/services/core-services';
import { FollowItem } from '../../core/models';
import { SafeImageComponent, PaginationComponent, SkeletonComponent } from '../../shared/components/ui-components';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-followed-page',
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
            <span class="text-[var(--text-primary)]">Truyện đang theo dõi</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-[var(--text-primary)] flex items-center gap-3">
            <app-icon name="bookmark" [size]="28" class="text-[var(--accent)]"></app-icon>
            Truyện đang theo dõi
          </h1>
        </div>
      </div>

      <!-- Followed Content -->
      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          @for (i of [1,2,3,4,5,6,7,8,9,10,11,12]; track i) {
            <app-skeleton class="aspect-[2/3] rounded-2xl"></app-skeleton>
          }
        </div>
      } @else if (items().length === 0) {
        <div class="text-center py-20 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] max-w-lg mx-auto p-8">
          <div class="w-16 h-16 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mx-auto mb-4">
            <app-icon name="bookmark" [size]="32"></app-icon>
          </div>
          <h3 class="text-lg font-bold text-[var(--text-primary)] mb-2">Chưa theo dõi truyện nào</h3>
          <p class="text-sm text-[var(--text-muted)] mb-6">Nhấn "Theo dõi" ở bất kỳ truyện nào bạn thích để nhận thông báo chương mới nhất!</p>
          <a
            routerLink="/"
            class="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-md shadow-[var(--accent)]/20"
          >
            <app-icon name="compass" [size]="16"></app-icon>
            <span>Khám phá truyện mới</span>
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          @for (item of items(); track item.comicId) {
            <div class="group relative bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/40 rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
              <!-- Cover image -->
              <a [routerLink]="['/comic', item.comicSlug]" class="relative aspect-[2/3] overflow-hidden bg-[var(--bg-secondary)]">
                <app-safe-image
                  [src]="item.comicCover"
                  [alt]="item.comicTitle"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                ></app-safe-image>
                
                @if (item.latestChapterNumber) {
                  <div class="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-md border border-white/10">
                    Chương {{ item.latestChapterNumber }}
                  </div>
                }

                <button
                  (click)="unfollow(item, $event)"
                  title="Bỏ theo dõi"
                  class="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600/90 text-white backdrop-blur-md flex items-center justify-center transition-colors opacity-80 hover:opacity-100"
                >
                  <app-icon name="trash" [size]="14"></app-icon>
                </button>
              </a>

              <!-- Info -->
              <div class="p-3 flex-1 flex flex-col justify-between">
                <a [routerLink]="['/comic', item.comicSlug]" class="font-bold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] line-clamp-2 transition-colors">
                  {{ item.comicTitle }}
                </a>
                <p class="text-[10px] text-[var(--text-muted)] mt-2">
                  Cập nhật {{ item.comicUpdatedAt | date:'dd/MM/yyyy' }}
                </p>
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
export class FollowedPageComponent implements OnInit {
  private userService = inject(UserService);
  private toast = inject(ToastService);

  items = signal<FollowItem[]>([]);
  loading = signal<boolean>(true);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);

  ngOnInit() {
    this.loadFollows(1);
  }

  loadFollows(page: number) {
    this.loading.set(true);
    this.currentPage.set(page);
    this.userService.getFollows(page, 24).subscribe({
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

  unfollow(item: FollowItem, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.userService.toggleFollow(item.comicId).subscribe({
      next: res => {
        this.items.update(list => list.filter(x => x.comicId !== item.comicId));
        this.toast.info('Đã bỏ theo dõi truyện', item.comicTitle);
      }
    });
  }

  onPageChange(page: number) {
    this.loadFollows(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
