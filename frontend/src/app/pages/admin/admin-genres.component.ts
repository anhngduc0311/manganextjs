import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComicService } from '../../core/services/app-services';
import { ToastService } from '../../core/services/core-services';
import { Genre } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-admin-genres',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-white">Quản lý Thể loại</h1>
          <p class="text-xs text-zinc-400 mt-1">Danh mục thể loại phân loại cho các bộ truyện</p>
        </div>

        <button
          (click)="openCreateModal()"
          class="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-[var(--accent)]/20"
        >
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Thêm thể loại</span>
        </button>
      </div>

      <!-- Genres Table -->
      <div class="bg-[#14141a] border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-zinc-400 uppercase border-b border-zinc-800 bg-zinc-900/50">
              <tr>
                <th class="py-3.5 px-4">Tên thể loại</th>
                <th class="py-3.5 px-3">Đường dẫn (Slug)</th>
                <th class="py-3.5 px-3">Mô tả</th>
                <th class="py-3.5 px-3">Số lượng truyện</th>
                <th class="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60">
              @if (loading()) {
                <tr>
                  <td colspan="5" class="py-12 text-center text-zinc-500">
                    <div class="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải danh sách thể loại...
                  </td>
                </tr>
              } @else if (genres().length === 0) {
                <tr>
                  <td colspan="5" class="py-12 text-center text-zinc-500">
                    Chưa có thể loại nào được tạo.
                  </td>
                </tr>
              } @else {
                @for (genre of genres(); track genre.id) {
                  <tr class="hover:bg-zinc-800/30 transition">
                    <td class="py-3.5 px-4 font-bold text-zinc-200">
                      {{ genre.name }}
                    </td>
                    <td class="py-3.5 px-3 text-zinc-400 font-mono">
                      {{ genre.slug }}
                    </td>
                    <td class="py-3.5 px-3 text-zinc-400 max-w-sm truncate">
                      {{ genre.description || '—' }}
                    </td>
                    <td class="py-3.5 px-3 text-zinc-300 font-semibold">
                      {{ genre.comicCount ?? 0 }}
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          (click)="openEditModal(genre)"
                          class="p-1.5 rounded-lg bg-zinc-800 text-blue-400 hover:bg-zinc-700 transition"
                          title="Sửa thể loại"
                        >
                          <app-icon name="edit" [size]="14"></app-icon>
                        </button>
                        <button
                          (click)="confirmDelete(genre)"
                          class="p-1.5 rounded-lg bg-zinc-800 text-rose-400 hover:bg-zinc-700 transition"
                          title="Xoá thể loại"
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
      </div>

      <!-- Add / Edit Modal -->
      <app-modal [isOpen]="isModalOpen" [title]="editingGenreId ? 'Cập nhật thể loại' : 'Thêm thể loại mới'" (close)="isModalOpen = false">
        <form (ngSubmit)="saveGenre()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Tên thể loại *</label>
            <input
              type="text"
              [(ngModel)]="form.name"
              name="name"
              required
              class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Slug (Đường dẫn tĩnh)</label>
            <input
              type="text"
              [(ngModel)]="form.slug"
              name="slug"
              placeholder="Tự sinh từ tên nếu để trống"
              class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Mô tả thể loại</label>
            <textarea
              [(ngModel)]="form.description"
              name="description"
              rows="3"
              class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button type="button" (click)="isModalOpen = false" class="rounded-xl px-4 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-800">
              Huỷ
            </button>
            <button
              type="submit"
              [disabled]="!form.name.trim()"
              class="rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition disabled:opacity-50"
            >
              {{ editingGenreId ? 'Lưu cập nhật' : 'Tạo mới' }}
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Delete Confirm Modal -->
      <app-modal [isOpen]="isDeleteModalOpen" title="Xác nhận xoá thể loại" (close)="isDeleteModalOpen = false">
        <div class="space-y-4">
          <p class="text-xs text-zinc-300">
            Bạn có chắc chắn muốn xoá thể loại <strong class="text-white">{{ genreToDelete?.name }}</strong>?
          </p>
          <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button (click)="isDeleteModalOpen = false" class="px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-xl">
              Huỷ
            </button>
            <button (click)="deleteGenre()" class="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
              Xác nhận xoá
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `
})
export class AdminGenresComponent implements OnInit {
  private comicService = inject(ComicService);
  private toast = inject(ToastService);

  genres = signal<Genre[]>([]);
  loading = signal<boolean>(true);

  isModalOpen = false;
  editingGenreId?: string;
  form = {
    name: '',
    slug: '',
    description: ''
  };

  isDeleteModalOpen = false;
  genreToDelete?: Genre;

  ngOnInit() {
    this.loadGenres();
  }

  loadGenres() {
    this.loading.set(true);
    this.comicService.listCategories().subscribe({
      next: data => {
        this.genres.set(data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal() {
    this.editingGenreId = undefined;
    this.form = { name: '', slug: '', description: '' };
    this.isModalOpen = true;
  }

  openEditModal(genre: Genre) {
    this.editingGenreId = genre.id;
    this.form = {
      name: genre.name,
      slug: genre.slug,
      description: genre.description || ''
    };
    this.isModalOpen = true;
  }

  saveGenre() {
    if (!this.form.name.trim()) return;

    if (this.editingGenreId) {
      this.comicService.updateCategory(this.editingGenreId, this.form).subscribe({
        next: () => {
          this.toast.success('Cập nhật thể loại thành công');
          this.isModalOpen = false;
          this.loadGenres();
        },
        error: () => this.toast.error('Lỗi khi cập nhật thể loại')
      });
    } else {
      this.comicService.createCategory(this.form).subscribe({
        next: () => {
          this.toast.success('Thêm thể loại mới thành công');
          this.isModalOpen = false;
          this.loadGenres();
        },
        error: () => this.toast.error('Lỗi khi thêm thể loại')
      });
    }
  }

  confirmDelete(genre: Genre) {
    this.genreToDelete = genre;
    this.isDeleteModalOpen = true;
  }

  deleteGenre() {
    if (!this.genreToDelete) return;
    this.comicService.deleteCategory(this.genreToDelete.id).subscribe({
      next: () => {
        this.toast.success('Đã xoá thể loại');
        this.isDeleteModalOpen = false;
        this.loadGenres();
      },
      error: () => this.toast.error('Không thể xoá thể loại')
    });
  }
}
