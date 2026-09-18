import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ComicService } from '../../core/services/app-services';
import { ToastService } from '../../core/services/core-services';
import { ComicCard, Genre } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { SafeImageComponent, PaginationComponent, ModalComponent } from '../../shared/components/ui-components';
import { ComicModalFormComponent } from '../../components/admin/admin-components';

@Component({
  selector: 'app-admin-comics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IconComponent,
    SafeImageComponent,
    PaginationComponent,
    ModalComponent,
    ComicModalFormComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-white">Quản lý Truyện tranh</h1>
          <p class="text-xs text-zinc-400 mt-1">Danh sách tất cả các bộ truyện trên hệ thống</p>
        </div>

        <button
          (click)="openCreateModal()"
          class="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-[var(--accent)]/20"
        >
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Thêm truyện mới</span>
        </button>
      </div>

      <!-- Filters & Search -->
      <div class="bg-[#14141a] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="relative w-full sm:w-80">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadComics(1)"
            placeholder="Tìm theo tên truyện..."
            class="w-full bg-zinc-900 border border-zinc-700/80 focus:border-[var(--accent)] text-xs text-zinc-200 rounded-xl pl-9 pr-4 py-2.5 outline-none"
          />
          <app-icon name="search" [size]="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"></app-icon>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <select
            [(ngModel)]="selectedStatus"
            (change)="loadComics(1)"
            class="bg-zinc-900 border border-zinc-700/80 text-zinc-300 text-xs rounded-xl px-3 py-2.5 outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ONGOING">Đang tiến hành</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="DROPPED">Tạm ngưng</option>
          </select>

          <select
            [(ngModel)]="selectedSort"
            (change)="loadComics(1)"
            class="bg-zinc-900 border border-zinc-700/80 text-zinc-300 text-xs rounded-xl px-3 py-2.5 outline-none"
          >
            <option value="updated">Mới cập nhật</option>
            <option value="views">Nhiều lượt xem nhất</option>
            <option value="rating">Đánh giá cao nhất</option>
          </select>
        </div>
      </div>

      <!-- Comics Table -->
      <div class="bg-[#14141a] border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-zinc-400 uppercase border-b border-zinc-800 bg-zinc-900/50">
              <tr>
                <th class="py-3.5 px-4">Truyện</th>
                <th class="py-3.5 px-3">Thể loại</th>
                <th class="py-3.5 px-3">Trạng thái</th>
                <th class="py-3.5 px-3">Số chương</th>
                <th class="py-3.5 px-3">Lượt xem</th>
                <th class="py-3.5 px-3">Đánh giá</th>
                <th class="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60">
              @if (loading()) {
                <tr>
                  <td colspan="7" class="py-12 text-center text-zinc-500">
                    <div class="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              } @else if (comics().length === 0) {
                <tr>
                  <td colspan="7" class="py-12 text-center text-zinc-500">
                    Không tìm thấy bộ truyện nào.
                  </td>
                </tr>
              } @else {
                @for (comic of comics(); track comic.id) {
                  <tr class="hover:bg-zinc-800/30 transition">
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                          <app-safe-image [src]="comic.coverImage" [alt]="comic.title" className="w-full h-full object-cover"></app-safe-image>
                        </div>
                        <div class="min-w-0 max-w-xs">
                          <p class="font-bold text-zinc-200 truncate">{{ comic.title }}</p>
                          <p class="text-[10px] text-zinc-500 truncate">/comic/{{ comic.slug }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-3">
                      <div class="flex flex-wrap gap-1 max-w-[140px]">
                        @for (cat of comic.categories?.slice(0, 2); track cat) {
                          <span class="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded">
                            {{ cat }}
                          </span>
                        }
                      </div>
                    </td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold" [ngClass]="comic.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'">
                        {{ comic.status }}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-zinc-300 font-semibold">{{ comic.chapterCount }}</td>
                    <td class="py-3 px-3 text-zinc-400">{{ comic.views | number }}</td>
                    <td class="py-3 px-3 text-amber-400 font-semibold">★ {{ comic.ratingAvg || 5 }}</td>
                    <td class="py-3 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <a
                          [routerLink]="['/admin/comics', comic.id, 'chapters']"
                          class="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
                          title="Quản lý chương"
                        >
                          <app-icon name="list" [size]="14"></app-icon>
                        </a>
                        <button
                          (click)="openEditModal(comic)"
                          class="p-1.5 rounded-lg bg-zinc-800 text-blue-400 hover:bg-zinc-700 transition"
                          title="Sửa thông tin"
                        >
                          <app-icon name="edit" [size]="14"></app-icon>
                        </button>
                        <button
                          (click)="confirmDelete(comic)"
                          class="p-1.5 rounded-lg bg-zinc-800 text-rose-400 hover:bg-zinc-700 transition"
                          title="Xóa truyện"
                        >
                          <app-icon name="trash" [size]="14"></app-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="p-4 border-t border-zinc-800 flex justify-end">
          <app-pagination
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            (pageChange)="loadComics($event)"
          ></app-pagination>
        </div>
      </div>

      <!-- Create / Edit Modal -->
      <app-comic-modal-form
        [isOpen]="isModalOpen"
        [comicId]="editingComicId"
        [initialData]="editingComicData"
        [availableGenres]="genres()"
        (close)="isModalOpen = false"
        (saved)="onComicSaved()"
      ></app-comic-modal-form>

      <!-- Delete Confirm Modal -->
      <app-modal [isOpen]="isDeleteModalOpen" title="Xác nhận xoá truyện" (close)="isDeleteModalOpen = false">
        <div class="space-y-4">
          <p class="text-xs text-zinc-300">
            Bạn có chắc chắn muốn xoá bộ truyện <strong class="text-white">{{ comicToDelete?.title }}</strong>? Mọi dữ liệu chương và bình luận liên quan cũng sẽ bị xoá hoàn toàn!
          </p>
          <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button (click)="isDeleteModalOpen = false" class="px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-xl">
              Huỷ
            </button>
            <button (click)="deleteComic()" class="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md">
              Xác nhận xoá
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `
})
export class AdminComicsComponent implements OnInit {
  private comicService = inject(ComicService);
  private toast = inject(ToastService);

  comics = signal<ComicCard[]>([]);
  genres = signal<Genre[]>([]);
  loading = signal<boolean>(true);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);

  searchQuery = '';
  selectedStatus = '';
  selectedSort = 'updated';

  isModalOpen = false;
  editingComicId?: string;
  editingComicData?: any;

  isDeleteModalOpen = false;
  comicToDelete?: ComicCard;

  ngOnInit() {
    this.comicService.listCategories().subscribe({
      next: data => this.genres.set(data || [])
    });
    this.loadComics(1);
  }

  loadComics(page: number) {
    this.loading.set(true);
    this.currentPage.set(page);
    this.comicService.listComics({
      status: this.selectedStatus || undefined,
      sort: this.selectedSort,
      page,
      perPage: 15
    }).subscribe({
      next: res => {
        this.comics.set(res.items || []);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal() {
    this.editingComicId = undefined;
    this.editingComicData = undefined;
    this.isModalOpen = true;
  }

  openEditModal(comic: ComicCard) {
    this.comicService.getBySlug(comic.slug).subscribe({
      next: detail => {
        this.editingComicId = detail.id;
        this.editingComicData = detail;
        this.isModalOpen = true;
      }
    });
  }

  onComicSaved() {
    this.isModalOpen = false;
    this.loadComics(this.currentPage());
  }

  confirmDelete(comic: ComicCard) {
    this.comicToDelete = comic;
    this.isDeleteModalOpen = true;
  }

  deleteComic() {
    if (!this.comicToDelete) return;
    this.comicService.deleteComic(this.comicToDelete.id).subscribe({
      next: () => {
        this.toast.success('Đã xoá truyện thành công');
        this.isDeleteModalOpen = false;
        this.loadComics(this.currentPage());
      },
      error: () => {
        this.toast.error('Không thể xoá truyện');
      }
    });
  }
}
