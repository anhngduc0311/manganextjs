import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChapterService, ComicService, StorageService } from '../../core/services/app-services';
import { ToastService } from '../../core/services/core-services';
import { ComicDetail, ChapterDetail } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent, SafeImageComponent } from '../../shared/components/ui-components';
import { ImageUploaderComponent } from '../../components/admin/admin-components';

@Component({
  selector: 'app-admin-chapters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IconComponent,
    ModalComponent,
    SafeImageComponent,
    ImageUploaderComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Breadcrumb & Back -->
      <div class="flex items-center gap-2 text-xs text-zinc-400">
        <a routerLink="/admin/comics" class="hover:text-white transition">Quản lý truyện</a>
        <span>/</span>
        <span class="text-zinc-200">Quản lý chương</span>
      </div>

      <!-- Comic Header Card -->
      @if (comic(); as c) {
        <div class="bg-[#14141a] border border-zinc-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div class="flex items-center gap-4">
            <div class="w-16 h-22 rounded-2xl overflow-hidden shrink-0 bg-zinc-800 shadow-md">
              <app-safe-image [src]="c.coverImage" [alt]="c.title" className="w-full h-full object-cover"></app-safe-image>
            </div>
            <div>
              <h1 class="text-xl font-black text-white">{{ c.title }}</h1>
              <p class="text-xs text-zinc-400 mt-1">Tổng cộng: <strong class="text-orange-400">{{ chapters().length }}</strong> chương</p>
            </div>
          </div>

          <button
            (click)="openAddChapterModal()"
            class="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-[var(--accent)]/20"
          >
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Thêm chương mới</span>
          </button>
        </div>
      }

      <!-- Chapters List Table -->
      <div class="bg-[#14141a] border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-zinc-400 uppercase border-b border-zinc-800 bg-zinc-900/50">
              <tr>
                <th class="py-3.5 px-4">Chương số</th>
                <th class="py-3.5 px-3">Tiêu đề</th>
                <th class="py-3.5 px-3">Số trang ảnh</th>
                <th class="py-3.5 px-3">Lượt đọc</th>
                <th class="py-3.5 px-3">Ngày tạo</th>
                <th class="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60">
              @if (loading()) {
                <tr>
                  <td colspan="6" class="py-12 text-center text-zinc-500">
                    <div class="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải danh sách chương...
                  </td>
                </tr>
              } @else if (chapters().length === 0) {
                <tr>
                  <td colspan="6" class="py-12 text-center text-zinc-500">
                    Chưa có chương nào được tạo cho bộ truyện này.
                  </td>
                </tr>
              } @else {
                @for (ch of chapters(); track ch.id) {
                  <tr class="hover:bg-zinc-800/30 transition">
                    <td class="py-3.5 px-4 font-bold text-white">
                      Chapter {{ ch.chapterNumber }}
                    </td>
                    <td class="py-3.5 px-3 text-zinc-300">
                      {{ ch.title || '(Không có tiêu đề)' }}
                    </td>
                    <td class="py-3.5 px-3 text-zinc-400">
                      <span class="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md font-medium">
                        {{ ch.pages?.length || 0 }} trang
                      </span>
                    </td>
                    <td class="py-3.5 px-3 text-zinc-400">{{ ch.views | number }}</td>
                    <td class="py-3.5 px-3 text-zinc-500">{{ ch.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          (click)="openEditChapterModal(ch)"
                          class="p-1.5 rounded-lg bg-zinc-800 text-blue-400 hover:bg-zinc-700 transition"
                          title="Sửa chương"
                        >
                          <app-icon name="edit" [size]="14"></app-icon>
                        </button>
                        <button
                          (click)="confirmDeleteChapter(ch)"
                          class="p-1.5 rounded-lg bg-zinc-800 text-rose-400 hover:bg-zinc-700 transition"
                          title="Xóa chương"
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

      <!-- Add / Edit Chapter Modal -->
      <app-modal [isOpen]="isChapterModalOpen" [title]="editingChapterId ? 'Cập nhật chương' : 'Thêm chương mới'" modalClass="max-w-3xl" (close)="isChapterModalOpen = false">
        <form (ngSubmit)="saveChapter()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Chương số *</label>
              <input
                type="number"
                step="0.5"
                [(ngModel)]="chapterForm.chapterNumber"
                name="chapterNumber"
                required
                class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Tiêu đề chương (tuỳ chọn)</label>
              <input
                type="text"
                [(ngModel)]="chapterForm.title"
                name="title"
                placeholder="VD: Sự trở lại của dũng giả"
                class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Upload Multiple Pages or Enter URL List -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400">Trang ảnh chương (Pages)</label>
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="pageMode = 'upload'"
                  [class.text-[var(--accent)]]="pageMode === 'upload'"
                  class="text-xs text-zinc-400 font-semibold hover:underline"
                >
                  Tải ảnh trực tiếp
                </button>
                <span class="text-zinc-600">|</span>
                <button
                  type="button"
                  (click)="pageMode = 'urls'"
                  [class.text-[var(--accent)]]="pageMode === 'urls'"
                  class="text-xs text-zinc-400 font-semibold hover:underline"
                >
                  Nhập danh sách URLs
                </button>
              </div>
            </div>

            @if (pageMode === 'upload') {
              <app-image-uploader [multiple]="true" [urls]="chapterForm.pageUrls" (urlsChange)="chapterForm.pageUrls = $event"></app-image-uploader>
            } @else {
              <textarea
                [(ngModel)]="pageUrlsText"
                (ngModelChange)="onPageUrlsTextChange($event)"
                name="pageUrlsText"
                rows="8"
                placeholder="Dán mỗi đường dẫn URL ảnh trên một dòng..."
                class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-white focus:border-orange-500 focus:outline-none font-mono"
              ></textarea>
              <p class="text-[10px] text-zinc-500 mt-1">Đã nhận diện: {{ chapterForm.pageUrls.length }} ảnh</p>
            }
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button type="button" (click)="isChapterModalOpen = false" class="rounded-xl px-4 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-800">
              Huỷ
            </button>
            <button
              type="submit"
              [disabled]="chapterForm.pageUrls.length === 0"
              class="rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition disabled:opacity-50"
            >
              {{ editingChapterId ? 'Lưu cập nhật' : 'Tạo chương' }}
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Delete Confirm Modal -->
      <app-modal [isOpen]="isDeleteModalOpen" title="Xác nhận xoá chương" (close)="isDeleteModalOpen = false">
        <div class="space-y-4">
          <p class="text-xs text-zinc-300">
            Bạn có chắc chắn muốn xoá <strong class="text-white">Chapter {{ chapterToDelete?.chapterNumber }}</strong>?
          </p>
          <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button (click)="isDeleteModalOpen = false" class="px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-xl">
              Huỷ
            </button>
            <button (click)="deleteChapter()" class="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
              Xác nhận xoá
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `
})
export class AdminChaptersComponent implements OnInit {
  private chapterService = inject(ChapterService);
  private comicService = inject(ComicService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  comicId!: string;
  comic = signal<ComicDetail | null>(null);
  chapters = signal<ChapterDetail[]>([]);
  loading = signal<boolean>(true);

  isChapterModalOpen = false;
  editingChapterId?: string;
  pageMode: 'upload' | 'urls' = 'upload';
  pageUrlsText = '';

  chapterForm = {
    chapterNumber: 1,
    title: '',
    pageUrls: [] as string[]
  };

  isDeleteModalOpen = false;
  chapterToDelete?: ChapterDetail;

  ngOnInit() {
    this.comicId = this.route.snapshot.paramMap.get('id')!;
    if (this.comicId) {
      this.loadComicAndChapters();
    }
  }

  loadComicAndChapters() {
    this.loading.set(true);
    this.chapterService.listChaptersAdmin(this.comicId).subscribe({
      next: chs => {
        this.chapters.set(chs || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openAddChapterModal() {
    this.editingChapterId = undefined;
    const nextNum = (this.chapters().length > 0)
      ? Math.max(...this.chapters().map(c => c.chapterNumber)) + 1
      : 1;

    this.chapterForm = {
      chapterNumber: nextNum,
      title: '',
      pageUrls: []
    };
    this.pageUrlsText = '';
    this.isChapterModalOpen = true;
  }

  openEditChapterModal(ch: ChapterDetail) {
    this.editingChapterId = ch.id;
    const urls = (ch.pages || []).sort((a, b) => a.pageIndex - b.pageIndex).map(p => p.imageUrl);
    this.chapterForm = {
      chapterNumber: ch.chapterNumber,
      title: ch.title || '',
      pageUrls: urls
    };
    this.pageUrlsText = urls.join('\n');
    this.isChapterModalOpen = true;
  }

  onPageUrlsTextChange(text: string) {
    this.chapterForm.pageUrls = text
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  saveChapter() {
    this.chapterService.upsertChapter({
      id: this.editingChapterId,
      comicId: this.comicId,
      chapterNumber: this.chapterForm.chapterNumber,
      title: this.chapterForm.title,
      pageUrls: this.chapterForm.pageUrls
    }).subscribe({
      next: () => {
        this.toast.success('Lưu chương thành công!');
        this.isChapterModalOpen = false;
        this.loadComicAndChapters();
      },
      error: () => {
        this.toast.error('Lỗi khi lưu chương');
      }
    });
  }

  confirmDeleteChapter(ch: ChapterDetail) {
    this.chapterToDelete = ch;
    this.isDeleteModalOpen = true;
  }

  deleteChapter() {
    if (!this.chapterToDelete) return;
    this.chapterService.deleteChapter(this.chapterToDelete.id).subscribe({
      next: () => {
        this.toast.success('Đã xoá chương');
        this.isDeleteModalOpen = false;
        this.loadComicAndChapters();
      },
      error: () => {
        this.toast.error('Không thể xoá chương');
      }
    });
  }
}
