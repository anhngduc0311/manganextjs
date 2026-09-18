import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComicService, SearchService } from '../../core/services/app-services';
import { ComicCard, Genre } from '../../core/models';
import { ComicGridComponent } from '../../components/comic/comic-components';
import { PaginationComponent } from '../../shared/components/ui-components';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ComicGridComponent, PaginationComponent, IconComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Search Title & Filter Box -->
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 mb-8 shadow-sm">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
            <app-icon name="search" [size]="22"></app-icon>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-[var(--text-primary)]">Tìm kiếm nâng cao</h1>
            <p class="text-xs text-[var(--text-muted)]">Lọc và tìm kiếm truyện theo từ khóa, thể loại và trạng thái</p>
          </div>
        </div>

        <!-- Keyword input -->
        <div class="relative mb-6">
          <input
            type="text"
            [(ngModel)]="keyword"
            (keyup.enter)="applyFilters()"
            placeholder="Nhập tên truyện, tác giả, hoặc từ khóa cần tìm..."
            class="w-full bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text-primary)] rounded-xl pl-11 pr-28 py-3 outline-none text-sm transition-all focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <app-icon name="search" [size]="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></app-icon>
          <button
            (click)="applyFilters()"
            class="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>Tìm kiếm</span>
          </button>
        </div>

        <!-- Filter rows -->
        <div class="space-y-4 pt-4 border-t border-[var(--border)]/50">
          <!-- Status filter -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider w-24">Trạng thái:</span>
            <div class="flex flex-wrap gap-2">
              <button
                (click)="setStatus('')"
                [class.bg-[var(--accent)]]="selectedStatus() === ''"
                [class.text-white]="selectedStatus() === ''"
                [class.bg-[var(--bg-secondary)]]="selectedStatus() !== ''"
                [class.text-[var(--text-secondary)]]="selectedStatus() !== ''"
                class="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors font-medium hover:border-[var(--accent)]"
              >
                Tất cả
              </button>
              <button
                (click)="setStatus('ONGOING')"
                [class.bg-[var(--accent)]]="selectedStatus() === 'ONGOING'"
                [class.text-white]="selectedStatus() === 'ONGOING'"
                [class.bg-[var(--bg-secondary)]]="selectedStatus() !== 'ONGOING'"
                [class.text-[var(--text-secondary)]]="selectedStatus() !== 'ONGOING'"
                class="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors font-medium hover:border-[var(--accent)]"
              >
                Đang tiến hành
              </button>
              <button
                (click)="setStatus('COMPLETED')"
                [class.bg-[var(--accent)]]="selectedStatus() === 'COMPLETED'"
                [class.text-white]="selectedStatus() === 'COMPLETED'"
                [class.bg-[var(--bg-secondary)]]="selectedStatus() !== 'COMPLETED'"
                [class.text-[var(--text-secondary)]]="selectedStatus() !== 'COMPLETED'"
                class="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors font-medium hover:border-[var(--accent)]"
              >
                Đã hoàn thành
              </button>
            </div>
          </div>

          <!-- Sort filter -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider w-24">Sắp xếp:</span>
            <div class="flex flex-wrap gap-2">
              @for (option of sortOptions; track option.value) {
                <button
                  (click)="setSort(option.value)"
                  [class.bg-[var(--accent)]]="selectedSort() === option.value"
                  [class.text-white]="selectedSort() === option.value"
                  [class.bg-[var(--bg-secondary)]]="selectedSort() !== option.value"
                  [class.text-[var(--text-secondary)]]="selectedSort() !== option.value"
                  class="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors font-medium hover:border-[var(--accent)]"
                >
                  {{ option.label }}
                </button>
              }
            </div>
          </div>

          <!-- Genre filter tags -->
          <div class="flex flex-col sm:flex-row sm:items-start gap-2 pt-2">
            <span class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider w-24 sm:pt-2">Thể loại:</span>
            <div class="flex-1 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              @for (g of genres(); track g.id) {
                <button
                  (click)="toggleGenre(g.slug)"
                  [class.bg-[var(--accent)]]="isGenreSelected(g.slug)"
                  [class.text-white]="isGenreSelected(g.slug)"
                  [class.border-[var(--accent)]]="isGenreSelected(g.slug)"
                  [class.bg-[var(--bg-secondary)]]="!isGenreSelected(g.slug)"
                  [class.text-[var(--text-secondary)]]="!isGenreSelected(g.slug)"
                  class="text-xs px-2.5 py-1 rounded-md border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors"
                >
                  {{ g.name }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Results Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span>Kết quả tìm kiếm</span>
          <span class="text-xs font-normal text-[var(--text-muted)] bg-[var(--bg-card)] px-2.5 py-1 rounded-full border border-[var(--border)]">
            {{ total() }} truyện
          </span>
        </h2>
      </div>

      <!-- Comics Grid -->
      <app-comic-grid [comics]="comics()" [loading]="loading()"></app-comic-grid>

      <!-- Pagination -->
      <div class="mt-8">
        <app-pagination
          [currentPage]="currentPage()"
          [totalPages]="totalPages()"
          (pageChange)="onPageChange($event)"
        ></app-pagination>
      </div>
    </div>
  `
})
export class SearchPageComponent implements OnInit {
  private comicService = inject(ComicService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  keyword = '';
  selectedStatus = signal<string>('');
  selectedSort = signal<string>('views');
  selectedGenres = signal<string[]>([]);
  genres = signal<Genre[]>([]);

  comics = signal<ComicCard[]>([]);
  loading = signal<boolean>(true);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  total = signal<number>(0);

  sortOptions = [
    { label: 'Lượt xem nhiều nhất', value: 'views' },
    { label: 'Mới cập nhật', value: 'updated' },
    { label: 'Đánh giá cao', value: 'rating' },
    { label: 'Truyện mới nhất', value: 'newest' }
  ];

  ngOnInit() {
    this.comicService.listCategories().subscribe({
      next: data => this.genres.set(data || [])
    });

    this.route.queryParams.subscribe(params => {
      this.keyword = params['q'] || '';
      this.selectedStatus.set(params['status'] || '');
      this.selectedSort.set(params['sort'] || 'views');
      
      const gParam = params['genre'];
      if (gParam) {
        this.selectedGenres.set(Array.isArray(gParam) ? gParam : [gParam]);
      } else {
        this.selectedGenres.set([]);
      }

      this.currentPage.set(parseInt(params['page'] || '1', 10));
      this.fetchResults();
    });
  }

  setStatus(status: string) {
    this.selectedStatus.set(status);
    this.applyFilters();
  }

  setSort(sort: string) {
    this.selectedSort.set(sort);
    this.applyFilters();
  }

  toggleGenre(slug: string) {
    const current = this.selectedGenres();
    if (current.includes(slug)) {
      this.selectedGenres.set(current.filter(s => s !== slug));
    } else {
      this.selectedGenres.set([...current, slug]);
    }
    this.applyFilters();
  }

  isGenreSelected(slug: string): boolean {
    return this.selectedGenres().includes(slug);
  }

  applyFilters() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.keyword || null,
        status: this.selectedStatus() || null,
        sort: this.selectedSort() || null,
        genre: this.selectedGenres().length > 0 ? this.selectedGenres() : null,
        page: 1
      },
      queryParamsHandling: 'merge'
    });
  }

  onPageChange(page: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  private fetchResults() {
    this.loading.set(true);
    this.comicService.listComics({
      genres: this.selectedGenres(),
      status: this.selectedStatus() || undefined,
      sort: this.selectedSort(),
      page: this.currentPage(),
      perPage: 24
    }).subscribe({
      next: res => {
        this.comics.set(res.items || []);
        this.total.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
