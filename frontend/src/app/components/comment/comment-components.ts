import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentItem } from '../../core/models';
import { AuthService, ToastService } from '../../core/services/core-services';
import { CommentService } from '../../core/services/app-services';
import { IconComponent } from '../../shared/components/icon.component';
import { SafeImageComponent, PaginationComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="onSubmit()" class="space-y-3">
      <div class="relative rounded-2xl border border-zinc-800 bg-[#141418] p-3 focus-within:border-orange-500/50 transition">
        <textarea
          [(ngModel)]="content"
          name="commentContent"
          rows="3"
          [placeholder]="placeholder"
          class="w-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none"
        ></textarea>

        <div class="flex items-center justify-between border-t border-zinc-800/60 pt-2.5 mt-1">
          <!-- Spoiler Tag Checkbox -->
          <label class="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer select-none">
            <input type="checkbox" [(ngModel)]="isSpoiler" name="isSpoiler" class="accent-orange-500 rounded" />
            <span>Cảnh báo Spoil nội dung</span>
          </label>

          <button
            type="submit"
            [disabled]="!content.trim() || isSubmitting"
            class="rounded-xl bg-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            {{ isSubmitting ? 'Đang gửi...' : 'Gửi Bình Luận' }}
          </button>
        </div>
      </div>
    </form>
  `
})
export class CommentFormComponent {
  @Input() comicId!: string;
  @Input() chapterId?: string;
  @Input() parentId?: string;
  @Input() placeholder = 'Viết bình luận của bạn (nhận +10 EXP)...';
  @Output() commentCreated = new EventEmitter<CommentItem>();

  private commentService = inject(CommentService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  content = '';
  isSpoiler = false;
  isSubmitting = false;

  onSubmit() {
    if (!this.authService.isLoggedIn()) {
      this.toast.warning('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để gửi bình luận.');
      return;
    }

    if (!this.content.trim()) return;

    this.isSubmitting = true;
    this.commentService.create({
      comicId: this.comicId,
      chapterId: this.chapterId,
      parentId: this.parentId,
      content: this.content.trim(),
      isSpoiler: this.isSpoiler
    }).subscribe({
      next: created => {
        this.content = '';
        this.isSpoiler = false;
        this.isSubmitting = false;
        this.toast.success('Bình luận thành công (+10 EXP)!');
        this.commentCreated.emit(created);
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.error('Lỗi', 'Không thể gửi bình luận.');
      }
    });
  }
}

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [CommonModule, IconComponent, SafeImageComponent, CommentFormComponent],
  template: `
    <div class="flex items-start gap-3 p-3 sm:p-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/60 transition">
      <!-- User Avatar -->
      <div class="relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
        <app-safe-image [src]="comment.user?.avatar || ''" alt="Avatar" />
      </div>

      <!-- Comment Content -->
      <div class="flex-1 min-w-0 space-y-1.5">
        <div class="flex items-center gap-2">
          <span class="text-xs sm:text-sm font-bold text-zinc-200 truncate">
            {{ comment.user?.username || 'Độc giả ẩn danh' }}
          </span>
          <span class="rounded-md bg-orange-500/20 border border-orange-500/30 px-1.5 py-0.2 text-[10px] font-black text-orange-400">
            Lv.{{ comment.user?.level || 1 }}
          </span>
          <span class="text-[10px] text-zinc-500 ml-auto">
            {{ comment.createdAt | date:'short' }}
          </span>
        </div>

        <!-- Body / Spoiler Blur -->
        @if (comment.isSpoiler && !revealedSpoiler) {
          <div
            (click)="revealedSpoiler = true"
            class="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5 text-xs text-amber-300/80 cursor-pointer select-none hover:bg-amber-950/30 transition flex items-center justify-between"
          >
            <span>⚠️ Bình luận có chứa Spoiler nội dung. Nhấp để xem.</span>
            <app-icon name="eye" className="w-3.5 h-3.5" />
          </div>
        } @else {
          <p class="text-xs sm:text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
            {{ comment.content }}
          </p>
        }

        <!-- Actions (Like, Reply) -->
        <div class="flex items-center gap-4 pt-1 text-xs text-zinc-400">
          <button
            (click)="likeComment()"
            class="flex items-center gap-1.5 hover:text-orange-400 transition"
          >
            <app-icon name="thumbs-up" className="w-3.5 h-3.5" />
            <span>{{ likes }}</span>
          </button>

          <button
            (click)="showReplyForm = !showReplyForm"
            class="hover:text-zinc-200 transition font-semibold"
          >
            Trả lời
          </button>
        </div>

        <!-- Reply Form -->
        @if (showReplyForm) {
          <div class="pt-3">
            <app-comment-form
              [comicId]="comment.comicId"
              [chapterId]="comment.chapterId"
              [parentId]="comment.id"
              placeholder="Trả lời bình luận..."
              (commentCreated)="onReplyCreated($event)"
            />
          </div>
        }

        <!-- Nested Replies List -->
        @if (comment.replies && comment.replies.length > 0) {
          <div class="mt-3 space-y-2 border-l-2 border-zinc-800 pl-3">
            @for (reply of comment.replies; track reply.id) {
              <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950/50">
                <div class="relative h-7 w-7 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                  <app-safe-image [src]="reply.user?.avatar || ''" alt="Avatar" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-zinc-200">{{ reply.user?.username }}</span>
                    <span class="text-[9px] font-black text-orange-400">Lv.{{ reply.user?.level || 1 }}</span>
                    <span class="text-[10px] text-zinc-500 ml-auto">{{ reply.createdAt | date:'shortDate' }}</span>
                  </div>
                  <p class="text-xs text-zinc-300 mt-1 leading-relaxed">{{ reply.content }}</p>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class CommentItemComponent {
  @Input({ required: true }) comment!: CommentItem;

  private commentService = inject(CommentService);

  likes = 0;
  revealedSpoiler = false;
  showReplyForm = false;

  ngOnInit() {
    this.likes = this.comment.likes || 0;
  }

  likeComment() {
    this.commentService.like(this.comment.id).subscribe({
      next: res => this.likes = res.likes
    });
  }

  onReplyCreated(newReply: CommentItem) {
    if (!this.comment.replies) this.comment.replies = [];
    this.comment.replies.push(newReply);
    this.showReplyForm = false;
  }
}

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [CommonModule, IconComponent, CommentFormComponent, CommentItemComponent, PaginationComponent],
  template: `
    <section class="space-y-6 rounded-3xl border border-zinc-800 bg-[#16161b] p-5 sm:p-6 shadow-xl">
      <div class="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div class="flex items-center gap-2">
          <app-icon name="message-square" className="w-5 h-5 text-orange-400" />
          <h3 class="text-base font-black text-white">Bình Luận ({{ totalComments }})</h3>
        </div>
      </div>

      <!-- New Comment Form -->
      <app-comment-form
        [comicId]="comicId"
        [chapterId]="chapterId"
        (commentCreated)="onNewRootComment($event)"
      />

      <!-- Comments Feed -->
      <div class="space-y-3">
        @if (isLoading) {
          <div class="py-8 text-center text-xs text-zinc-500">Đang tải bình luận...</div>
        } @else if (comments.length > 0) {
          @for (c of comments; track c.id) {
            <app-comment-item [comment]="c" />
          }
          <!-- Pagination -->
          <app-pagination [page]="page" [totalPages]="totalPages" (pageChange)="onPageChange($event)" />
        } @else {
          <div class="py-8 text-center text-xs text-zinc-500">
            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
          </div>
        }
      </div>
    </section>
  `
})
export class CommentListComponent {
  @Input({ required: true }) comicId!: string;
  @Input() chapterId?: string;

  private commentService = inject(CommentService);

  comments: CommentItem[] = [];
  totalComments = 0;
  page = 1;
  totalPages = 1;
  isLoading = false;

  ngOnInit() {
    this.fetchComments();
  }

  fetchComments() {
    this.isLoading = true;
    this.commentService.list(this.comicId, this.chapterId, this.page, 15).subscribe({
      next: res => {
        this.comments = res.items;
        this.totalComments = res.total;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onPageChange(p: number) {
    this.page = p;
    this.fetchComments();
  }

  onNewRootComment(newComment: CommentItem) {
    this.comments.unshift(newComment);
    this.totalComments++;
  }
}
