import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComicService } from '../../core/services/app-services';
import { ComicCard, HomeFeed } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ComicGridComponent, HotComicsSliderComponent } from '../../components/comic/comic-components';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, ComicGridComponent, HotComicsSliderComponent],
  template: `
    <div class="space-y-8">
      <!-- 📢 Pinned Notice Banner -->
      <div class="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-[#17171d] p-3.5 sm:px-4 text-xs sm:text-sm text-zinc-300 shadow-lg">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
          <app-icon name="sparkles" className="w-4 h-4" />
        </div>
        <p class="flex-1 leading-snug">
          <strong class="text-orange-400 font-bold">Chào mừng đến với TruyenKomi:</strong> Đọc
          truyện tranh Manhwa, Manga, Manhua hoàn toàn miễn phí, cập nhật nhanh chóng với chất lượng hình ảnh sắc nét.
        </p>
      </div>

      <!-- 🔥 TRUYỆN HOT ĐỀ CỬ (Horizontal Slider) -->
      @if (hotComics.length > 0) {
        <section>
          <app-hot-comics-slider [comics]="hotComics" />
        </section>
      }

      <!-- Main Section: Truyện Mới Cập Nhật -->
      <section class="space-y-6">
        <!-- Header & Quick Genre Filters -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div class="flex items-center gap-2">
            <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <app-icon name="zap" className="w-4 h-4 fill-sky-400/30" />
            </div>
            <h2 class="text-base sm:text-lg font-black uppercase tracking-wider text-zinc-100">
              Truyện Mới Cập Nhật
            </h2>
          </div>

          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <a
              routerLink="/comics"
              [queryParams]="{ sort: 'updated' }"
              class="rounded-lg bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm"
            >
              Tất cả
            </a>
            <a
              routerLink="/comics"
              [queryParams]="{ genres: 'manhwa' }"
              class="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-orange-400 transition"
            >
              Manhwa
            </a>
            <a
              routerLink="/comics"
              [queryParams]="{ genres: 'manga' }"
              class="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-orange-400 transition"
            >
              Manga
            </a>
            <a
              routerLink="/comics"
              [queryParams]="{ genres: 'manhua' }"
              class="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-orange-400 transition"
            >
              Manhua
            </a>
          </div>
        </div>

        <!-- Comic Grid -->
        <app-comic-grid [comics]="latestComics" emptyMessage="Chưa có truyện mới cập nhật." />

        <!-- Xem Thêm Button -->
        <div class="text-center pt-2">
          <a
            routerLink="/comics"
            [queryParams]="{ sort: 'updated' }"
            class="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-800 px-8 py-3 text-sm font-bold text-zinc-200 hover:border-orange-500/50 hover:bg-zinc-800/80 hover:text-orange-400 transition shadow-lg active:scale-[0.98]"
          >
            <span>Xem Thêm Nhiều Truyện Mới Cập Nhật</span>
            <app-icon name="arrow-right" className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  `
})
export class HomeComponent {
  private comicService = inject(ComicService);

  hotComics: ComicCard[] = [];
  latestComics: ComicCard[] = [];

  ngOnInit() {
    this.comicService.getHomeFeed().subscribe({
      next: feed => {
        this.hotComics = feed.hot || [];
        this.latestComics = feed.latest || [];
      },
      error: () => {}
    });
  }
}
