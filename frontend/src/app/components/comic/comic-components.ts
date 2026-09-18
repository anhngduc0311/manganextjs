import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComicCard, ChapterBrief } from '../../core/models';
import { AuthService, ToastService } from '../../core/services/core-services';
import { RatingService, UserService } from '../../core/services/app-services';
import { IconComponent } from '../../shared/components/icon.component';
import { SafeImageComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-comic-card',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, SafeImageComponent],
  template: `
    <div class="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#16161b] transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10">
      <!-- Cover Image Wrapper -->
      <a [routerLink]="['/comic', comic.slug]" class="relative aspect-[3/4] w-full overflow-hidden bg-zinc-800">
        <app-safe-image [src]="comic.coverImage" [alt]="comic.title" />

        <!-- Ambient Bottom Gradient -->
        <div class="absolute inset-0 bg-gradient-to-t from-[#16161b] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition"></div>

        <!-- Top Left Status Badge -->
        <div class="absolute top-2 left-2">
          <span
            class="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md"
            [ngClass]="comic.status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-orange-500'"
          >
            {{ comic.status === 'COMPLETED' ? 'Full' : 'HOT' }}
          </span>
        </div>

        <!-- Top Right Chapter Badge -->
        @if (comic.latestChapterNumber) {
          <div class="absolute top-2 right-2">
            <span class="flex items-center rounded-lg bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 text-[10px] font-bold text-orange-400 shadow-md">
              Ch. {{ comic.latestChapterNumber }}
            </span>
          </div>
        }

        <!-- Bottom Stats Overlay -->
        <div class="absolute bottom-2 inset-x-2 flex items-center justify-between text-[11px] font-bold text-zinc-300">
          <div class="flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-amber-400">
            <app-icon name="star" className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{{ comic.ratingAvg > 0 ? comic.ratingAvg : '5.0' }}</span>
          </div>
          <div class="flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-zinc-300">
            <app-icon name="eye" className="w-3 h-3 text-zinc-400" />
            <span>{{ comic.views > 999 ? (comic.views / 1000 | number:'1.0-1') + 'k' : comic.views }}</span>
          </div>
        </div>
      </a>

      <!-- Title & Details -->
      <div class="flex flex-1 flex-col p-3">
        <a
          [routerLink]="['/comic', comic.slug]"
          class="line-clamp-2 text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-orange-400 transition leading-snug"
          [title]="comic.title"
        >
          {{ comic.title }}
        </a>

        <!-- Categories tags -->
        @if (comic.categories && comic.categories.length > 0) {
          <div class="mt-2 flex flex-wrap gap-1 overflow-hidden max-h-5">
            @for (cat of comic.categories.slice(0, 2); track cat) {
              <span class="rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
                {{ cat }}
              </span>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class ComicCardComponent {
  @Input({ required: true }) comic!: ComicCard;
}

@Component({
  selector: 'app-comic-grid',
  standalone: true,
  imports: [CommonModule, ComicCardComponent, IconComponent],
  template: `
    @if (loading || isLoading) {
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
        @for (i of [1,2,3,4,5,6,7,8,9,10,11,12]; track i) {
          <div class="aspect-[3/4] rounded-2xl bg-zinc-800/60 animate-pulse"></div>
        }
      </div>
    } @else if (comics && comics.length > 0) {
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
        @for (comic of comics; track comic.id) {
          <app-comic-card [comic]="comic" />
        }
      </div>
    } @else {
      <div class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-[#141418] p-12 text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-500 mb-3">
          <app-icon name="book-open" className="w-6 h-6" />
        </div>
        <p class="text-xs sm:text-sm font-bold text-zinc-400">{{ emptyMessage }}</p>
      </div>
    }
  `
})
export class ComicGridComponent {
  @Input() comics: ComicCard[] = [];
  @Input() loading = false;
  @Input() isLoading = false;
  @Input() emptyMessage = 'Chưa có truyện nào trong danh mục này.';
}

@Component({
  selector: 'app-hot-comics-slider',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, SafeImageComponent],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
            <app-icon name="flame" className="w-4 h-4 fill-orange-400/30" />
          </div>
          <h2 class="text-base sm:text-lg font-black uppercase tracking-wider text-zinc-100">
            Truyện Hot Đề Cử
          </h2>
        </div>
      </div>

      <!-- Horizontal Scrollable Container -->
      <div class="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x">
        @for (comic of comics; track comic.id) {
          <div class="w-36 sm:w-44 shrink-0 snap-start">
            <div class="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#16161b] transition-all hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl">
              <a [routerLink]="['/comics', comic.slug]" class="relative aspect-[3/4] w-full overflow-hidden bg-zinc-800">
                <app-safe-image [src]="comic.coverImage" [alt]="comic.title" />
                <div class="absolute inset-0 bg-gradient-to-t from-[#16161b] via-transparent to-transparent opacity-80"></div>
                <div class="absolute top-2 left-2">
                  <span class="rounded-lg bg-orange-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-md">
                    HOT
                  </span>
                </div>
                @if (comic.latestChapterNumber) {
                  <div class="absolute bottom-2 right-2">
                    <span class="rounded-lg bg-black/70 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
                      Ch.{{ comic.latestChapterNumber }}
                    </span>
                  </div>
                }
              </a>
              <div class="p-2.5">
                <a [routerLink]="['/comics', comic.slug]" class="line-clamp-1 text-xs font-bold text-zinc-100 group-hover:text-orange-400 transition" [title]="comic.title">
                  {{ comic.title }}
                </a>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class HotComicsSliderComponent {
  @Input() comics: ComicCard[] = [];
}

@Component({
  selector: 'app-chapter-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-4 rounded-3xl border border-zinc-800 bg-[#16161b] p-5 sm:p-6 shadow-xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div class="flex items-center gap-2">
          <app-icon name="book-open" className="w-5 h-5 text-orange-400" />
          <h3 class="text-base font-black text-white">Danh Sách Chương ({{ chapters.length }})</h3>
        </div>

        <div class="flex items-center gap-2">
          <!-- Search Chapter -->
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Tìm số chương..."
            class="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-orange-500 focus:outline-none w-32 sm:w-40"
          />
          <!-- Sort Button -->
          <button
            (click)="isAscending = !isAscending"
            class="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
          >
            <span>{{ isAscending ? 'Cũ nhất' : 'Mới nhất' }}</span>
            <app-icon [name]="isAscending ? 'chevron-up' : 'chevron-down'" className="w-3.5 h-3.5 text-orange-400" />
          </button>
        </div>
      </div>

      <!-- Chapter Grid / List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto pr-1">
        @for (ch of getFilteredChapters(); track ch.id) {
          <a
            [routerLink]="['/comics', comicSlug, 'chuong-' + ch.chapterNumber]"
            class="group flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 hover:border-orange-500/40 hover:bg-zinc-800/80 transition"
          >
            <div class="flex flex-col min-w-0">
              <span class="text-xs font-bold text-zinc-200 group-hover:text-orange-400 transition truncate">
                Chương {{ ch.chapterNumber }}{{ ch.title ? ': ' + ch.title : '' }}
              </span>
              <span class="text-[10px] text-zinc-500 mt-0.5">{{ ch.createdAt | date:'shortDate' }}</span>
            </div>
            <app-icon name="chevron-right" className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition shrink-0" />
          </a>
        }
      </div>
    </div>
  `
})
export class ChapterListComponent {
  @Input({ required: true }) comicSlug!: string;
  @Input({ required: true }) chapters: ChapterBrief[] = [];

  searchQuery = '';
  isAscending = false;

  getFilteredChapters(): ChapterBrief[] {
    let list = [...this.chapters];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(ch => ch.chapterNumber.toString().includes(q) || (ch.title && ch.title.toLowerCase().includes(q)));
    }
    return list.sort((a, b) => this.isAscending ? a.chapterNumber - b.chapterNumber : b.chapterNumber - a.chapterNumber);
  }
}

@Component({
  selector: 'app-interactive-rating',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="flex items-center gap-1">
      @for (star of [1, 2, 3, 4, 5]; track star) {
        <button
          (mouseenter)="hoverStar = star"
          (mouseleave)="hoverStar = 0"
          (click)="onRate(star)"
          class="p-0.5 text-zinc-600 transition hover:scale-125 focus:outline-none"
          [title]="'Đánh giá ' + star + ' sao'"
        >
          <app-icon
            name="star"
            className="w-5 h-5 transition-colors"
            [ngClass]="(hoverStar ? star <= hoverStar : star <= (userScore || currentAvg)) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'"
          />
        </button>
      }
      <span class="ml-2 text-xs font-bold text-amber-400">
        {{ currentAvg | number:'1.1-1' }}
      </span>
      <span class="text-[11px] text-zinc-500">({{ totalRatings }} đánh giá)</span>
    </div>
  `
})
export class InteractiveRatingComponent {
  @Input({ required: true }) comicId!: string;
  @Input() currentAvg = 5.0;
  @Input() totalRatings = 0;

  private ratingService = inject(RatingService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  userScore: number | null = null;
  hoverStar = 0;

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.ratingService.getUserRating(this.comicId).subscribe({
        next: res => this.userScore = res.score
      });
    }
  }

  onRate(score: number) {
    if (!this.authService.isLoggedIn()) {
      this.toast.warning('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để đánh giá truyện.');
      return;
    }

    this.ratingService.rateComic(this.comicId, score).subscribe({
      next: res => {
        this.userScore = score;
        this.currentAvg = res.ratingAvg;
        this.toast.success('Thành công', `Bạn đã đánh giá ${score} sao (+10 EXP)!`);
      },
      error: () => this.toast.error('Lỗi', 'Không thể lưu đánh giá.')
    });
  }
}

@Component({
  selector: 'app-follow-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <button
      (click)="toggleFollow()"
      class="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold transition shadow-lg"
      [ngClass]="isFollowing ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/20 hover:brightness-110'"
    >
      <app-icon name="bookmark" className="w-4 h-4" [ngClass]="{ 'fill-orange-400 text-orange-400': isFollowing }" />
      <span>{{ isFollowing ? 'Đang Theo Dõi' : 'Theo Dõi Truyện' }}</span>
    </button>
  `
})
export class FollowButtonComponent {
  @Input({ required: true }) comicId!: string;

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  isFollowing = false;

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.userService.isFollowing(this.comicId).subscribe({
        next: res => this.isFollowing = res.following
      });
    }
  }

  toggleFollow() {
    if (!this.authService.isLoggedIn()) {
      this.toast.warning('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để theo dõi truyện.');
      return;
    }

    this.userService.toggleFollow(this.comicId).subscribe({
      next: res => {
        this.isFollowing = res.following;
        this.toast.success('Thông báo', res.following ? 'Đã thêm truyện vào danh sách theo dõi!' : 'Đã huỷ theo dõi truyện.');
      }
    });
  }
}
