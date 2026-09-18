import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ComicService } from '../../core/services/app-services';
import { Genre } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { SkeletonComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, SkeletonComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Breadcrumb / Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-2">
          <a routerLink="/" class="hover:text-[var(--accent)] transition-colors">Trang chủ</a>
          <span>/</span>
          <span class="text-[var(--text-primary)]">Thể loại</span>
        </div>
        <h1 class="text-3xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
          <app-icon name="grid" [size]="28" class="text-[var(--accent)]"></app-icon>
          Tất cả thể loại truyện
        </h1>
        <p class="text-[var(--text-muted)] mt-1">Khám phá hàng ngàn bộ truyện tranh phong phú được phân loại theo thể loại</p>
      </div>

      <!-- Categories Grid -->
      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          @for (i of [1,2,3,4,5,6,7,8,9,10,11,12]; track i) {
            <app-skeleton class="h-24 rounded-xl"></app-skeleton>
          }
        </div>
      } @else if (genres().length === 0) {
        <div class="text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <app-icon name="info" [size]="48" class="mx-auto text-[var(--text-muted)] mb-3"></app-icon>
          <p class="text-lg text-[var(--text-muted)]">Chưa có thể loại nào được tạo.</p>
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          @for (genre of genres(); track genre.id) {
            <a
              [routerLink]="['/comics']"
              [queryParams]="{ genre: genre.slug }"
              class="group relative overflow-hidden bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] hover:border-[var(--accent)]/50 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div class="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-15 transition-opacity text-[var(--accent)]">
                <app-icon name="book-open" [size]="64"></app-icon>
              </div>

              <div class="relative z-10 flex flex-col justify-between h-full">
                <h3 class="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  {{ genre.name }}
                </h3>
                @if (genre.description) {
                  <p class="text-xs text-[var(--text-muted)] line-clamp-2 mt-1">{{ genre.description }}</p>
                }
                <div class="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border)]/50 text-xs text-[var(--text-muted)]">
                  <span>{{ genre.comicCount ?? 0 }} bộ truyện</span>
                  <app-icon name="chevron-right" [size]="14" class="group-hover:translate-x-1 transition-transform text-[var(--accent)]"></app-icon>
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `
})
export class CategoriesPageComponent implements OnInit {
  private comicService = inject(ComicService);

  genres = signal<Genre[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.comicService.listCategories().subscribe({
      next: data => {
        this.genres.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
