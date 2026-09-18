import { Component, Input, Output, EventEmitter, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChapterBrief, ChapterPage, ReaderSettings } from '../../core/models';
import { ReaderSettingsService, RealtimeService, ReportService } from '../../core/services/app-services';
import { ToastService, ThemeService } from '../../core/services/core-services';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent, SafeImageComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-reader-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen" title="Cài Đặt Bộ Đọc" (close)="close.emit()">
      <div class="space-y-6">
        <!-- 1. Reading Mode -->
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-wider text-zinc-400">Chế độ đọc</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              (click)="settingsService.setMode('webtoon')"
              class="flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition"
              [ngClass]="settingsService.settings().mode === 'webtoon' ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'"
            >
              <app-icon name="layers" className="w-4 h-4" />
              <span>Dọc (Webtoon)</span>
            </button>
            <button
              (click)="settingsService.setMode('single')"
              class="flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition"
              [ngClass]="settingsService.settings().mode === 'single' ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'"
            >
              <app-icon name="book-open" className="w-4 h-4" />
              <span>Từng Trang (Flip)</span>
            </button>
          </div>
        </div>

        <!-- 2. Reader Theme Background -->
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-wider text-zinc-400">Màu nền bộ đọc</label>
          <div class="grid grid-cols-4 gap-2 text-center text-xs font-bold">
            <button
              (click)="setReaderTheme('dark')"
              class="rounded-xl border p-2.5 transition"
              [ngClass]="themeService.currentTheme() === 'dark' ? 'border-orange-500 bg-zinc-900 text-orange-400 ring-2 ring-orange-500/20' : 'border-zinc-800 bg-zinc-900 text-zinc-400'"
            >
              Dark
            </button>
            <button
              (click)="setReaderTheme('light')"
              class="rounded-xl border p-2.5 transition"
              [ngClass]="themeService.currentTheme() === 'light' ? 'border-orange-500 bg-zinc-100 text-zinc-900 ring-2 ring-orange-500/20' : 'border-zinc-300 bg-white text-zinc-800'"
            >
              Light
            </button>
            <button
              (click)="setReaderTheme('sepia')"
              class="rounded-xl border p-2.5 transition"
              [ngClass]="themeService.currentTheme() === 'sepia' ? 'border-orange-500 bg-[#f4ecd8] text-[#433422] ring-2 ring-orange-500/20' : 'border-[#e8dcc4] bg-[#f4ecd8] text-[#7f6a52]'"
            >
              Sepia
            </button>
            <button
              (click)="setReaderTheme('amoled')"
              class="rounded-xl border p-2.5 transition"
              [ngClass]="themeService.currentTheme() === 'amoled' ? 'border-orange-500 bg-black text-white ring-2 ring-orange-500/20' : 'border-zinc-900 bg-black text-zinc-500'"
            >
              AMOLED
            </button>
          </div>
        </div>

        <!-- 3. Brightness Slider -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-zinc-400">
            <span class="uppercase tracking-wider">Độ sáng hình ảnh</span>
            <span class="text-orange-400 font-mono">{{ settingsService.settings().brightness }}%</span>
          </div>
          <input
            type="range"
            min="30"
            max="100"
            [ngModel]="settingsService.settings().brightness"
            (ngModelChange)="settingsService.setBrightness($event)"
            class="w-full accent-orange-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        <!-- 4. Fit Width Toggle -->
        <div class="flex items-center justify-between border-t border-zinc-800/80 pt-4">
          <span class="text-xs font-bold text-zinc-300">Tự động căn vừa chiều rộng</span>
          <button
            (click)="settingsService.setFitWidth(!settingsService.settings().fitWidth)"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            [ngClass]="settingsService.settings().fitWidth ? 'bg-orange-500' : 'bg-zinc-800'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              [ngClass]="settingsService.settings().fitWidth ? 'translate-x-6' : 'translate-x-1'"
            ></span>
          </button>
        </div>
      </div>
    </app-modal>
  `
})
export class ReaderSettingsModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  public settingsService = inject(ReaderSettingsService);
  public themeService = inject(ThemeService);

  setReaderTheme(theme: 'dark' | 'light' | 'sepia' | 'amoled') {
    this.themeService.setTheme(theme);
    this.settingsService.setTheme(theme);
  }
}

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen" title="Báo Cáo Sự Cố Chương" (close)="close.emit()">
      <div class="space-y-4">
        <p class="text-xs text-zinc-400">
          Hãy chọn lý do sự cố để đội ngũ quản trị kiểm tra và sửa lỗi nhanh nhất:
        </p>

        <div class="space-y-2">
          @for (r of reasons; track r) {
            <label class="flex items-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 hover:border-orange-500/40 cursor-pointer transition">
              <input type="radio" name="reportReason" [(ngModel)]="selectedReason" [value]="r" class="accent-orange-500" />
              <span class="text-xs font-semibold text-zinc-200">{{ r }}</span>
            </label>
          }
        </div>

        <div>
          <textarea
            [(ngModel)]="customReason"
            placeholder="Mô tả chi tiết hơn (nếu có)..."
            rows="3"
            class="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button (click)="close.emit()" class="rounded-xl px-4 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition">
            Huỷ
          </button>
          <button
            (click)="submitReport()"
            class="rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition"
          >
            Gửi Báo Cáo
          </button>
        </div>
      </div>
    </app-modal>
  `
})
export class ReportModalComponent {
  @Input() isOpen = false;
  @Input({ required: true }) chapterId!: string;
  @Output() close = new EventEmitter<void>();

  private reportService = inject(ReportService);
  private toast = inject(ToastService);

  reasons = [
    'Ảnh bị lỗi hoặc không tải được',
    'Chương bị trùng hoặc sai thứ tự trang',
    'Dịch sai / chất lượng hình ảnh quá mờ',
    'Lỗi khác'
  ];

  selectedReason = 'Ảnh bị lỗi hoặc không tải được';
  customReason = '';

  submitReport() {
    const reason = this.customReason.trim() ? `${this.selectedReason}: ${this.customReason.trim()}` : this.selectedReason;
    this.reportService.createReport(this.chapterId, reason).subscribe({
      next: () => {
        this.toast.success('Báo cáo thành công', 'Cảm ơn bạn đã hỗ trợ hoàn thiện nội dung!');
        this.close.emit();
      },
      error: () => this.toast.error('Lỗi', 'Không thể gửi báo cáo vào lúc này.')
    });
  }
}

@Component({
  selector: 'app-reader-toolbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, ReaderSettingsModalComponent, ReportModalComponent],
  template: `
    <header class="fixed top-0 inset-x-0 z-40 border-b border-zinc-800 bg-[#0e0e12]/95 backdrop-blur-xl transition-all">
      <div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
        <!-- Left: Back to Comic & Title -->
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <a
            [routerLink]="['/comics', comicSlug]"
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-orange-500/50 hover:bg-zinc-800 hover:text-white transition shrink-0"
            title="Về trang chi tiết truyện"
          >
            <app-icon name="chevron-left" className="w-4 h-4" />
          </a>

          <div class="flex flex-col min-w-0">
            <a [routerLink]="['/comics', comicSlug]" class="text-xs sm:text-sm font-black text-white hover:text-orange-400 transition truncate max-w-[150px] sm:max-w-xs md:max-w-md">
              {{ comicTitle }}
            </a>
            <span class="text-[10px] text-zinc-400 font-bold truncate">
              Chương {{ currentChapter.chapterNumber }}{{ currentChapter.title ? ': ' + currentChapter.title : '' }}
            </span>
          </div>
        </div>

        <!-- Center: Chapter Switcher -->
        <div class="flex items-center gap-1.5">
          <!-- Prev Button -->
          <button
            [disabled]="prevChapterNumber === null || prevChapterNumber === undefined"
            (click)="goToChapter(prevChapterNumber!)"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
            title="Chương trước"
          >
            <app-icon name="chevron-left" className="w-3.5 h-3.5" />
          </button>

          <!-- Chapter Select Dropdown -->
          <select
            [ngModel]="currentChapter.chapterNumber"
            (ngModelChange)="onChapterSelectChange($event)"
            class="h-8 rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-xs font-bold text-zinc-200 focus:border-orange-500 focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[140px]"
          >
            @for (ch of allChapters; track ch.id) {
              <option [value]="ch.chapterNumber">Ch. {{ ch.chapterNumber }}</option>
            }
          </select>

          <!-- Next Button -->
          <button
            [disabled]="nextChapterNumber === null || nextChapterNumber === undefined"
            (click)="goToChapter(nextChapterNumber!)"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
            title="Chương sau"
          >
            <app-icon name="chevron-right" className="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Right: Actions (Live Readers, Settings, Report) -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- Live Readers Badge -->
          <div class="hidden sm:flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{{ liveCount }} đang đọc</span>
          </div>

          <!-- Report Button -->
          <button
            (click)="isReportOpen = true"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-rose-500/50 hover:bg-rose-950/30 hover:text-rose-400 transition"
            title="Báo lỗi chương"
          >
            <app-icon name="flag" className="w-3.5 h-3.5" />
          </button>

          <!-- Settings Button -->
          <button
            (click)="isSettingsOpen = true"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-orange-500/50 hover:bg-zinc-800 hover:text-orange-400 transition"
            title="Cài đặt bộ đọc"
          >
            <app-icon name="sliders" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>

    <!-- Modals -->
    <app-reader-settings-modal [isOpen]="isSettingsOpen" (close)="isSettingsOpen = false" />
    <app-report-modal [isOpen]="isReportOpen" [chapterId]="currentChapter.id" (close)="isReportOpen = false" />
  `
})
export class ReaderToolbarComponent {
  @Input({ required: true }) comicSlug!: string;
  @Input({ required: true }) comicTitle!: string;
  @Input({ required: true }) currentChapter!: { id: string; chapterNumber: number; title?: string };
  @Input() allChapters: ChapterBrief[] = [];
  @Input() prevChapterNumber?: number | null;
  @Input() nextChapterNumber?: number | null;

  private router = inject(Router);
  private realtimeService = inject(RealtimeService);

  liveCount = 1;
  isSettingsOpen = false;
  isReportOpen = false;
  private unsubscribeSse?: () => void;

  ngOnInit() {
    this.unsubscribeSse = this.realtimeService.listenLiveReaders(this.currentChapter.id, count => {
      this.liveCount = count;
    });
  }

  ngOnDestroy() {
    if (this.unsubscribeSse) this.unsubscribeSse();
  }

  onChapterSelectChange(chNum: number) {
    this.goToChapter(chNum);
  }

  goToChapter(num: number) {
    this.router.navigate(['/comics', this.comicSlug, 'chuong-' + num]);
  }
}

@Component({
  selector: 'app-webtoon-reader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="mx-auto flex flex-col items-center select-none"
      [style.maxWidth.px]="settingsService.settings().fitWidth ? 900 : null"
      [style.filter]="'brightness(' + settingsService.settings().brightness + '%)'"
    >
      @for (page of pages; track page.id) {
        <div class="relative w-full flex justify-center bg-black min-h-[400px]">
          <img
            [src]="page.imageUrl"
            [alt]="'Trang ' + page.pageIndex"
            class="w-full h-auto object-contain block"
            loading="lazy"
          />
        </div>
      }
    </div>
  `
})
export class WebtoonReaderComponent {
  @Input({ required: true }) pages: ChapterPage[] = [];
  public settingsService = inject(ReaderSettingsService);
}

@Component({
  selector: 'app-page-flip-reader',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div
      class="mx-auto flex flex-col items-center select-none max-w-4xl px-4"
      [style.filter]="'brightness(' + settingsService.settings().brightness + '%)'"
    >
      <!-- Main Page Image -->
      <div class="relative w-full aspect-[3/4] max-h-[85vh] flex items-center justify-center bg-black rounded-2xl overflow-hidden shadow-2xl">
        @if (currentPageData) {
          <img
            [src]="currentPageData.imageUrl"
            [alt]="'Trang ' + currentPageData.pageIndex"
            class="max-w-full max-h-full object-contain"
          />
        }

        <!-- Left / Right Click Areas -->
        <div class="absolute inset-y-0 left-0 w-1/3 cursor-pointer" (click)="prevPage()"></div>
        <div class="absolute inset-y-0 right-0 w-1/3 cursor-pointer" (click)="nextPage()"></div>
      </div>

      <!-- Bottom Paging Indicator -->
      <div class="flex items-center justify-center gap-4 mt-6">
        <button
          [disabled]="currentPageIndex <= 0"
          (click)="prevPage()"
          class="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition"
        >
          <app-icon name="chevron-left" className="w-4 h-4" />
          <span>Trang trước</span>
        </button>

        <span class="text-xs font-mono font-bold text-orange-400">
          {{ currentPageIndex + 1 }} / {{ pages.length }}
        </span>

        <button
          [disabled]="currentPageIndex >= pages.length - 1"
          (click)="nextPage()"
          class="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition"
        >
          <span>Trang sau</span>
          <app-icon name="chevron-right" className="w-4 h-4" />
        </button>
      </div>
    </div>
  `
})
export class PageFlipReaderComponent {
  @Input({ required: true }) pages: ChapterPage[] = [];
  public settingsService = inject(ReaderSettingsService);

  currentPageIndex = 0;

  get currentPageData(): ChapterPage | undefined {
    return this.pages[this.currentPageIndex];
  }

  prevPage() {
    if (this.currentPageIndex > 0) this.currentPageIndex--;
  }

  nextPage() {
    if (this.currentPageIndex < this.pages.length - 1) this.currentPageIndex++;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
      this.prevPage();
    } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
      this.nextPage();
    }
  }
}
