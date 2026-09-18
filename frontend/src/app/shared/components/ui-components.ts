import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../core/services/core-services';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5"
          [ngClass]="{
            'bg-emerald-950/90 border-emerald-500/30 text-emerald-100': toast.type === 'success',
            'bg-rose-950/90 border-rose-500/30 text-rose-100': toast.type === 'error',
            'bg-amber-950/90 border-amber-500/30 text-amber-100': toast.type === 'warning',
            'bg-zinc-900/95 border-zinc-700 text-zinc-100': toast.type === 'info'
          }"
        >
          <div class="mt-0.5 shrink-0">
            @if (toast.type === 'success') { <app-icon name="check" className="w-5 h-5 text-emerald-400" /> }
            @else if (toast.type === 'error') { <app-icon name="alert-circle" className="w-5 h-5 text-rose-400" /> }
            @else if (toast.type === 'warning') { <app-icon name="alert-circle" className="w-5 h-5 text-amber-400" /> }
            @else { <app-icon name="sparkles" className="w-5 h-5 text-sky-400" /> }
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-xs sm:text-sm font-bold leading-snug">{{ toast.title }}</h4>
            @if (toast.message) {
              <p class="text-xs opacity-90 mt-0.5 leading-relaxed">{{ toast.message }}</p>
            }
          </div>
          <button (click)="toastService.remove(toast.id)" class="text-zinc-400 hover:text-white transition">
            <app-icon name="x" className="w-4 h-4" />
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  public toastService = inject(ToastService);
}

@Component({
  selector: 'app-safe-image',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="relative overflow-hidden w-full h-full" [ngClass]="containerClass">
      <img
        [src]="currentSrc"
        [alt]="alt"
        [class]="imgClass"
        (load)="isLoaded = true"
        (error)="handleError()"
        [ngClass]="{ 'opacity-0': !isLoaded, 'opacity-100': isLoaded, 'transition-opacity duration-300': true }"
      />
      @if (!isLoaded) {
        <div class="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center text-zinc-600">
          <app-icon name="sparkles" className="w-6 h-6 opacity-30" />
        </div>
      }
    </div>
  `
})
export class SafeImageComponent {
  @Input({ required: true }) src!: string;
  @Input() alt = 'Image';
  @Input() imgClass = 'object-cover w-full h-full';
  @Input() containerClass = '';
  @Input() fallback = '/icons/icon-192.png';

  currentSrc = '';
  isLoaded = false;

  ngOnChanges() {
    this.currentSrc = this.src || this.fallback;
    this.isLoaded = false;
  }

  handleError() {
    if (this.currentSrc !== this.fallback) {
      this.currentSrc = this.fallback;
    }
  }
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (totalPages > 1) {
      <div class="flex items-center justify-center gap-1.5 pt-4">
        <button
          [disabled]="page <= 1"
          (click)="pageChange.emit(page - 1)"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-orange-500/50 hover:bg-zinc-800 hover:text-orange-400 disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <app-icon name="chevron-left" className="w-4 h-4" />
        </button>

        @for (p of getPages(); track p) {
          @if (p === -1) {
            <span class="px-2 text-zinc-600">...</span>
          } @else {
            <button
              (click)="pageChange.emit(p)"
              class="flex h-9 min-w-[36px] px-2 items-center justify-center rounded-xl text-xs font-bold transition"
              [ngClass]="p === page ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white'"
            >
              {{ p }}
            </button>
          }
        }

        <button
          [disabled]="page >= totalPages"
          (click)="pageChange.emit(page + 1)"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-orange-500/50 hover:bg-zinc-800 hover:text-orange-400 disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <app-icon name="chevron-right" className="w-4 h-4" />
        </button>
      </div>
    }
  `
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() set currentPage(val: number) { this.page = val; }
  @Input({ required: true }) totalPages!: number;
  @Output() pageChange = new EventEmitter<number>();

  getPages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.page;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push(-1);
      pages.push(total);
    }

    return pages;
  }
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" (click)="onClose()"></div>

        <!-- Modal Box -->
        <div
          class="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#16161b] p-6 shadow-2xl transition-all z-10 max-h-[90vh] overflow-y-auto"
          [ngClass]="modalClass"
        >
          <div class="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-4">
            <h3 class="text-base sm:text-lg font-black tracking-tight text-white">{{ title }}</h3>
            <button (click)="onClose()" class="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition">
              <app-icon name="x" className="w-4 h-4" />
            </button>
          </div>

          <ng-content></ng-content>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() modalClass = '';
  @Output() close = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  onClose() {
    this.close.emit();
    this.closed.emit();
  }
}

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-pulse bg-zinc-800/60 rounded-2xl" [attr.class]="className"></div>
  `
})
export class SkeletonComponent {
  @Input() className = 'w-full h-24';
}
