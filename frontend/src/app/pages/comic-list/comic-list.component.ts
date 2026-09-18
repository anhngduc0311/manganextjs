import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComicService } from '../../core/services/app-services';
import { ComicCard, Genre } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ComicGridComponent } from '../../components/comic/comic-components';
import { PaginationComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-comic-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ComicGridComponent, PaginationComponent],
  template: `
    <div class="space-y-6">
      <!-- Title & Filters Bar -->
      <div class="rounded-3xl border border-zinc-800 bg-[#16161b] p-5 sm:p-6 shadow-xl space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight">Danh Sách Truyện Tranh</h1>
            <p class="text-xs text-zinc-400 mt-0.5">Lọc truyện theo thể loại, trạng thái và bảng xếp hạng</p>
          </div>

          <!-- Sort Select -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-zinc-400 font-bold">Sắp xếp:</span>
            <select
              [ngModel]="selectedSort"
              (ngModelChange)="onSortChange($event)"
              class="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-200 focus:border-orange-500 focus:outline-none"
            >
              <option value="updated">Mới cập nhật</option>
              <option value="views">Lượt xem nhiều nhất</option>
              <option value="rating">Đánh giá cao nhất</option>
              <option value="new">Truyện mới đăng</option>
            </select>
          </div>
        </div>

        <!-- Genres Tag Cloud Filter -->
        <div class="space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-zinc-400">Thể loại:</span>
          <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
            @for (g of genres; track g.id) {
              <button
                (click)="toggleGenre(g.slug)"
                class="rounded-xl px-3 py-1 text-xs font-semibold transition"
                [ngClass]="selectedGenres.includes(g.slug) ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'"
              >
                {{ g.name }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Comic Grid -->
      <app-comic-grid [comics]="comics" emptyMessage="Không tìm thấy bộ truyện nào phù hợp với bộ lọc." />

      <!-- Pagination -->
      <app-pagination [page]="page" [totalPages]="totalPages" (pageChange)="onPageChange($event)" />
    </div>
  `
})
export class ComicListComponent {
  private comicService = inject(ComicService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  comics: ComicCard[] = [];
  genres: Genre[] = [];
  selectedGenres: string[] = [];
  selectedSort = 'updated';
  page = 1;
  totalPages = 1;

  ngOnInit() {
    this.comicService.listCategories().subscribe({
      next: g => this.genres = g
    });

    this.route.queryParams.subscribe(params => {
      this.selectedSort = params['sort'] || 'updated';
      const gParam = params['genres'];
      this.selectedGenres = gParam ? (Array.isArray(gParam) ? gParam : [gParam]) : [];
      this.page = Number(params['page']) || 1;
      this.fetchComics();
    });
  }

  fetchComics() {
    this.comicService.listComics({
      genres: this.selectedGenres,
      sort: this.selectedSort,
      page: this.page,
      perPage: 24
    }).subscribe({
      next: res => {
        this.comics = res.items;
        this.totalPages = res.totalPages;
      }
    });
  }

  toggleGenre(slug: string) {
    const idx = this.selectedGenres.indexOf(slug);
    if (idx > -1) {
      this.selectedGenres.splice(idx, 1);
    } else {
      this.selectedGenres.push(slug);
    }
    this.updateUrl();
  }

  onSortChange(sort: string) {
    this.selectedSort = sort;
    this.page = 1;
    this.updateUrl();
  }

  onPageChange(p: number) {
    this.page = p;
    this.updateUrl();
  }

  private updateUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        genres: this.selectedGenres.length > 0 ? this.selectedGenres : null,
        sort: this.selectedSort,
        page: this.page > 1 ? this.page : null
      },
      queryParamsHandling: 'merge'
    });
  }
}
