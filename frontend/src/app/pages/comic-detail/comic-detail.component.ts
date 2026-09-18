import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ComicService } from '../../core/services/app-services';
import { ComicDetail } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { SafeImageComponent } from '../../shared/components/ui-components';
import { ChapterListComponent, InteractiveRatingComponent, FollowButtonComponent } from '../../components/comic/comic-components';
import { CommentListComponent } from '../../components/comment/comment-components';

@Component({
  selector: 'app-comic-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconComponent,
    SafeImageComponent,
    ChapterListComponent,
    InteractiveRatingComponent,
    FollowButtonComponent,
    CommentListComponent
  ],
  template: `
    @if (comic) {
      <div class="space-y-6">
        <!-- 🧭 Breadcrumb Navigation -->
        <nav class="flex items-center gap-1.5 text-xs text-zinc-400 overflow-x-auto whitespace-nowrap py-1">
          <a routerLink="/" class="flex items-center gap-1 hover:text-orange-400 transition">
            <app-icon name="sparkles" className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </a>
          <app-icon name="chevron-right" className="w-3 h-3 text-zinc-600 shrink-0" />
          <a routerLink="/comics" class="hover:text-orange-400 transition">Danh sách truyện</a>
          <app-icon name="chevron-right" className="w-3 h-3 text-zinc-600 shrink-0" />
          <span class="text-zinc-200 font-medium truncate max-w-[240px] sm:max-w-none">{{ comic.title }}</span>
        </nav>

        <!-- 🌟 Hero Header Banner with Backdrop -->
        <div class="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[#16161b] shadow-2xl p-5 sm:p-7 md:p-8">
          <!-- Ambient Blur Backdrop -->
          <div class="absolute inset-0 overflow-hidden opacity-20 blur-3xl pointer-events-none">
            <app-safe-image [src]="comic.coverImage" [alt]="comic.title" imgClass="object-cover scale-125 w-full h-full" />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-[#16161b] via-[#16161b]/80 to-transparent pointer-events-none"></div>

          <!-- Content Container -->
          <div class="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            <!-- Cover Poster -->
            <div class="relative aspect-[3/4] w-48 sm:w-56 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 shadow-2xl ring-1 ring-white/10">
              <app-safe-image [src]="comic.coverImage" [alt]="comic.title" />
              <!-- Status Badge -->
              <div class="absolute top-2.5 left-2.5">
                <span
                  class="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md"
                  [ngClass]="comic.status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-orange-500'"
                >
                  {{ comic.status === 'COMPLETED' ? 'Full' : 'Đang tiến hành' }}
                </span>
              </div>
            </div>

            <!-- Details -->
            <div class="flex flex-1 flex-col items-center md:items-start space-y-3.5 text-center md:text-left">
              <div class="space-y-1">
                <h1 class="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                  {{ comic.title }}
                </h1>
                @if (comic.otherNames) {
                  <p class="text-xs text-zinc-400 italic">{{ comic.otherNames }}</p>
                }
              </div>

              <!-- Metadata Meta Info -->
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-xs text-zinc-300">
                <div class="flex items-center gap-1.5">
                  <app-icon name="user" className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Tác giả: <strong class="text-zinc-200">{{ comic.author || 'Đang cập nhật' }}</strong></span>
                </div>
                <div class="flex items-center gap-1.5">
                  <app-icon name="eye" className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Lượt xem: <strong class="text-zinc-200">{{ comic.views }}</strong></span>
                </div>
              </div>

              <!-- Categories Tags -->
              @if (comic.categories && comic.categories.length > 0) {
                <div class="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                  @for (cat of comic.categories; track cat.id) {
                    <a
                      [routerLink]="['/comics']"
                      [queryParams]="{ genres: cat.slug }"
                      class="rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:border-orange-500/50 hover:text-orange-400 transition"
                    >
                      {{ cat.name }}
                    </a>
                  }
                </div>
              }

              <!-- Rating Component -->
              <app-interactive-rating [comicId]="comic.id" [currentAvg]="comic.ratingAvg" [totalRatings]="comic.ratingCount" />

              <!-- Action Buttons (Follow & First/Last Read) -->
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <app-follow-button [comicId]="comic.id" />

                @if (firstChapter) {
                  <a
                    [routerLink]="['/comics', comic.slug, 'chuong-' + firstChapter.chapterNumber]"
                    class="flex items-center gap-2 rounded-2xl bg-zinc-800 border border-zinc-700 px-5 py-3 text-xs sm:text-sm font-bold text-zinc-200 hover:bg-zinc-700 hover:text-white transition shadow-lg"
                  >
                    <app-icon name="book-open" className="w-4 h-4 text-orange-400" />
                    <span>Đọc từ đầu (Ch.{{ firstChapter.chapterNumber }})</span>
                  </a>
                }
              </div>

              <!-- Description -->
              @if (comic.description) {
                <div class="pt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl border-t border-zinc-800/80">
                  <p class="whitespace-pre-line">{{ comic.description }}</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- 📑 Chapter List -->
        <app-chapter-list [comicSlug]="comic.slug" [chapters]="comic.chapters" />

        <!-- 💬 Comments Section -->
        <app-comment-list [comicId]="comic.id" />
      </div>
    } @else if (isLoading) {
      <div class="py-20 text-center text-zinc-500 text-sm">Đang tải thông tin truyện...</div>
    } @else {
      <div class="py-20 text-center text-zinc-500 text-sm">Không tìm thấy truyện yêu cầu.</div>
    }
  `
})
export class ComicDetailComponent {
  private comicService = inject(ComicService);
  private route = inject(ActivatedRoute);

  comic: ComicDetail | null = null;
  isLoading = true;

  get firstChapter() {
    if (!this.comic?.chapters || this.comic.chapters.length === 0) return null;
    return [...this.comic.chapters].sort((a, b) => a.chapterNumber - b.chapterNumber)[0];
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.isLoading = true;
        this.comicService.getBySlug(slug).subscribe({
          next: c => {
            this.comic = c;
            this.isLoading = false;
          },
          error: () => {
            this.comic = null;
            this.isLoading = false;
          }
        });
      }
    });
  }
}
