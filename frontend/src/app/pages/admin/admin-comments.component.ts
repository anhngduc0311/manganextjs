import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentService } from '../../core/services/app-services';
import { ToastService } from '../../core/services/core-services';
import { CommentItem } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { PaginationComponent, ModalComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-admin-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, PaginationComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-white">Kiểm duyệt Bình luận</h1>
          <p class="text-xs text-zinc-400 mt-1">Quản lý và kiểm duyệt các bình luận của người dùng trên toàn hệ thống</p>
        </div>
      </div>

      <!-- Search Filter -->
      <div class="bg-[#14141a] border border-zinc-800 rounded-2xl p-4">
        <div class="relative max-w-md">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadComments(1)"
            placeholder="Tìm kiếm nội dung bình luận..."
            class="w-full bg-zinc-900 border border-zinc-700/80 focus:border-[var(--accent)] text-xs text-zinc-200 rounded-xl pl-9 pr-4 py-2.5 outline-none"
          />
          <app-icon name="search" [size]="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"></app-icon>
        </div>
      </div>

      <!-- Comments Table -->
      <div class="bg-[#14141a] border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-zinc-400 uppercase border-b border-zinc-800 bg-zinc-900/50">
              <tr>
                <th class="py-3.5 px-4">Người dùng</th>
                <th class="py-3.5 px-4">Nội dung bình luận</th>
                <th class="py-3.5 px-3">Lượt thích</th>
                <th class="py-3.5 px-3">Thời gian</th>
                <th class="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60">
              @if (loading()) {
                <tr>
                  <td colspan="5" class="py-12 text-center text-zinc-500">
                    <div class="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải bình luận...
                  </td>
                </tr>
              } @else if (comments().length === 0) {
                <tr>
                  <td colspan="5" class="py-12 text-center text-zinc-500">
                    Không có bình luận nào.
                  </td>
                </tr>
              } @else {
                @for (c of comments(); track c.id) {
                  <tr class="hover:bg-zinc-800/30 transition">
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center font-bold text-xs shrink-0">
                          {{ c.user?.username?.charAt(0)?.toUpperCase() || 'U' }}
                        </div>
                        <div>
                          <p class="font-bold text-zinc-200">{{ c.user?.username || 'Vô danh' }}</p>
                          <p class="text-[10px] text-zinc-500">Lv. {{ c.user?.level || 1 }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="py-3.5 px-4 max-w-md">
                      @if (c.isSpoiler) {
                        <span class="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5">
                          SPOILER
                        </span>
                      }
                      <span class="text-zinc-300 break-words">{{ c.content }}</span>
                    </td>
                    <td class="py-3.5 px-3 text-zinc-400">{{ c.likes }}</td>
                    <td class="py-3.5 px-3 text-zinc-500">{{ c.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td class="py-3.5 px-4 text-right">
                      <button
                        (click)="confirmDelete(c)"
                        class="p-1.5 rounded-lg bg-zinc-800 text-rose-400 hover:bg-zinc-700 transition"
                        title="Xoá bình luận"
                      >
                        <app-icon name="trash" [size]="14"></app-icon>
                      </button>
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
            (pageChange)="loadComments($event)"
          ></app-pagination>
        </div>
      </div>

      <!-- Delete Confirm Modal -->
      <app-modal [isOpen]="isDeleteModalOpen" title="Xác nhận xoá bình luận" (close)="isDeleteModalOpen = false">
        <div class="space-y-4">
          <p class="text-xs text-zinc-300">
            Bạn có chắc chắn muốn xoá bình luận này?
          </p>
          <div class="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 italic">
            "{{ commentToDelete?.content }}"
          </div>
          <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button (click)="isDeleteModalOpen = false" class="px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-xl">
              Huỷ
            </button>
            <button (click)="deleteComment()" class="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
              Xoá bình luận
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `
})
export class AdminCommentsComponent implements OnInit {
  private commentService = inject(CommentService);
  private toast = inject(ToastService);

  comments = signal<CommentItem[]>([]);
  loading = signal<boolean>(true);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  searchQuery = '';

  isDeleteModalOpen = false;
  commentToDelete?: CommentItem;

  ngOnInit() {
    this.loadComments(1);
  }

  loadComments(page: number) {
    this.loading.set(true);
    this.currentPage.set(page);
    this.commentService.listForModeration(page, 20, this.searchQuery).subscribe({
      next: res => {
        this.comments.set(res.items || []);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  confirmDelete(c: CommentItem) {
    this.commentToDelete = c;
    this.isDeleteModalOpen = true;
  }

  deleteComment() {
    if (!this.commentToDelete) return;
    this.commentService.remove(this.commentToDelete.id).subscribe({
      next: () => {
        this.toast.success('Đã xoá bình luận');
        this.isDeleteModalOpen = false;
        this.loadComments(this.currentPage());
      },
      error: () => this.toast.error('Không thể xoá bình luận')
    });
  }
}
