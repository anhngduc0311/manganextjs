import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ChapterService, UserService } from '../../core/services/app-services';
import { AuthService } from '../../core/services/core-services';
import { ReaderData, ChapterBrief } from '../../core/models';
import { ReaderSettingsService } from '../../core/services/app-services';
import { IconComponent } from '../../shared/components/icon.component';
import { ReaderToolbarComponent, WebtoonReaderComponent, PageFlipReaderComponent } from '../../components/reader/reader-components';
import { CommentListComponent } from '../../components/comment/comment-components';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconComponent,
    ReaderToolbarComponent,
    WebtoonReaderComponent,
    PageFlipReaderComponent,
    CommentListComponent
  ],
  template: `
    @if (readerData) {
      <div class="min-h-screen bg-black text-zinc-100 pb-20 pt-16">
        <!-- Sticky Top Reader Toolbar -->
        <app-reader-toolbar
          [comicSlug]="readerData.comic.slug"
          [comicTitle]="readerData.comic.title"
          [currentChapter]="readerData.chapter"
          [allChapters]="allChapters"
          [prevChapterNumber]="readerData.prevChapterNumber"
          [nextChapterNumber]="readerData.nextChapterNumber"
        />

        <!-- Main Chapter Reader Mode -->
        <main class="w-full py-4">
          @if (settingsService.settings().mode === 'webtoon') {
            <app-webtoon-reader [pages]="readerData.pages" />
          } @else {
            <app-page-flip-reader [pages]="readerData.pages" />
          }
        </main>

        <!-- Bottom Chapter Switcher Navigation -->
        <div class="mx-auto max-w-2xl px-4 py-8">
          <div class="flex flex-wrap items-center justify-center gap-3">
            @if (readerData.prevChapterNumber !== null && readerData.prevChapterNumber !== undefined) {
              <a
                [routerLink]="['/comics', readerData.comic.slug, 'chuong-' + readerData.prevChapterNumber]"
                class="flex items-center gap-2 rounded-xl bg-zinc-800/90 border border-zinc-700/60 px-4 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 hover:text-white transition shadow-sm"
              >
                <app-icon name="chevron-left" className="w-4 h-4" />
                <span>Chương trước</span>
              </a>
            } @else {
              <button disabled class="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800/40 px-4 py-2.5 text-xs font-bold text-zinc-600 cursor-not-allowed">
                <app-icon name="chevron-left" className="w-4 h-4" />
                <span>Chương trước</span>
              </button>
            }

            <a
              [routerLink]="['/comics', readerData.comic.slug]"
              class="flex items-center gap-2 rounded-xl bg-zinc-800/90 border border-zinc-700/60 px-4 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 hover:text-white transition shadow-sm"
            >
              <app-icon name="book-open" className="w-4 h-4 text-orange-400" />
              <span>Mục lục</span>
            </a>

            @if (readerData.nextChapterNumber !== null && readerData.nextChapterNumber !== undefined) {
              <a
                [routerLink]="['/comics', readerData.comic.slug, 'chuong-' + readerData.nextChapterNumber]"
                class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:brightness-110 transition"
              >
                <span>Chương tiếp</span>
                <app-icon name="chevron-right" className="w-4 h-4" />
              </a>
            } @else {
              <button disabled class="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800/40 px-5 py-2.5 text-xs font-bold text-zinc-600 cursor-not-allowed">
                <span>Hết chương</span>
              </button>
            }
          </div>
        </div>

        <!-- Comments on this chapter -->
        <div class="mx-auto max-w-4xl px-4 pt-6">
          <app-comment-list [comicId]="readerData.comic.id" [chapterId]="readerData.chapter.id" />
        </div>
      </div>
    } @else if (isLoading) {
      <div class="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-sm">
        Đang tải trang đọc truyện...
      </div>
    } @else {
      <div class="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-400 gap-4">
        <p>Không tìm thấy chương truyện này.</p>
        <a routerLink="/comics" class="rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white">
          Quay lại danh sách truyện
        </a>
      </div>
    }
  `
})
export class ReaderComponent {
  private chapterService = inject(ChapterService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  public settingsService = inject(ReaderSettingsService);
  private route = inject(ActivatedRoute);

  readerData: ReaderData | null = null;
  allChapters: ChapterBrief[] = [];
  isLoading = true;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      const chapterParam = params.get('chapter');
      if (slug && chapterParam) {
        const chNum = this.parseChapterNumber(chapterParam);
        if (chNum !== null) {
          this.loadReader(slug, chNum);
        }
      }
    });
  }

  private parseChapterNumber(str: string): number | null {
    const match = str.match(/(?:chuong-)?([0-9]+(?:\.[0-9]+)?)/i);
    if (!match || !match[1]) return null;
    const num = parseFloat(match[1]);
    return isNaN(num) ? null : num;
  }

  private loadReader(slug: string, chapterNumber: number) {
    this.isLoading = true;
    this.chapterService.getReaderData(slug, chapterNumber).subscribe({
      next: data => {
        this.readerData = data;
        this.isLoading = false;

        // Auto Record History
        if (this.authService.isLoggedIn()) {
          this.userService.recordHistory(data.comic.id, data.chapter.id, 1).subscribe();
        }

        // Fetch all chapters of comic
        this.chapterService.listChaptersByComicId(data.comic.id).subscribe({
          next: chs => this.allChapters = chs
        });
      },
      error: () => {
        this.readerData = null;
        this.isLoading = false;
      }
    });
  }
}
