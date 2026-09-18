import { Component, inject, signal, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, ThemeService } from '../../core/services/core-services';
import { SearchService, NotificationService } from '../../core/services/app-services';
import { ComicCard, NotificationItem } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { SafeImageComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="relative" #menuRef>
      <button
        (click)="isOpen = !isOpen"
        class="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-orange-500/50 hover:bg-zinc-800 hover:text-orange-400 transition"
        title="Đổi giao diện màu"
      >
        <app-icon [name]="themeService.currentTheme() === 'light' ? 'sun' : 'moon'" className="w-4 h-4" />
      </button>

      @if (isOpen) {
        <div class="absolute right-0 mt-2 w-36 rounded-2xl border border-zinc-800 bg-[#17171d] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <button
            (click)="selectTheme('dark')"
            class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition"
            [ngClass]="themeService.currentTheme() === 'dark' ? 'bg-orange-500 text-white' : 'text-zinc-300 hover:bg-zinc-800/80'"
          >
            <app-icon name="moon" className="w-3.5 h-3.5" />
            <span>Tối (Dark)</span>
          </button>
          <button
            (click)="selectTheme('light')"
            class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition"
            [ngClass]="themeService.currentTheme() === 'light' ? 'bg-orange-500 text-white' : 'text-zinc-300 hover:bg-zinc-800/80'"
          >
            <app-icon name="sun" className="w-3.5 h-3.5" />
            <span>Sáng (Light)</span>
          </button>
          <button
            (click)="selectTheme('sepia')"
            class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition"
            [ngClass]="themeService.currentTheme() === 'sepia' ? 'bg-orange-500 text-white' : 'text-zinc-300 hover:bg-zinc-800/80'"
          >
            <app-icon name="sparkles" className="w-3.5 h-3.5" />
            <span>Sepia (Vàng dịu)</span>
          </button>
          <button
            (click)="selectTheme('amoled')"
            class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition"
            [ngClass]="themeService.currentTheme() === 'amoled' ? 'bg-orange-500 text-white' : 'text-zinc-300 hover:bg-zinc-800/80'"
          >
            <app-icon name="moon" className="w-3.5 h-3.5 text-zinc-400" />
            <span>AMOLED (Đen)</span>
          </button>
        </div>
      }
    </div>
  `
})
export class ThemeSelectorComponent {
  public themeService = inject(ThemeService);
  isOpen = false;

  selectTheme(theme: string) {
    this.themeService.setTheme(theme);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const el = event.target as HTMLElement;
    if (!el.closest('app-theme-selector')) {
      this.isOpen = false;
    }
  }
}

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="relative" #menuRef>
      <button
        (click)="toggle()"
        class="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-orange-500/50 hover:bg-zinc-800 hover:text-orange-400 transition"
      >
        <app-icon name="bell" className="w-4 h-4" />
        @if (unreadCount > 0) {
          <span class="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white shadow-sm">
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        }
      </button>

      @if (isOpen) {
        <div class="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border border-zinc-800 bg-[#16161b] p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-800 mb-2">
            <h4 class="text-sm font-black text-white">Thông báo</h4>
            @if (unreadCount > 0) {
              <button (click)="markAllRead()" class="text-xs text-orange-400 hover:underline">
                Đánh dấu đã đọc
              </button>
            }
          </div>

          <div class="max-h-80 overflow-y-auto space-y-2">
            @if (notifications.length === 0) {
              <div class="py-6 text-center text-xs text-zinc-500">
                Không có thông báo mới nào.
              </div>
            } @else {
              @for (item of notifications; track item.id) {
                <div
                  (click)="onNotificationClick(item)"
                  class="flex items-start gap-3 rounded-2xl p-2.5 transition cursor-pointer"
                  [ngClass]="item.isRead ? 'bg-zinc-900/40 hover:bg-zinc-900' : 'bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15'"
                >
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 mt-0.5">
                    <app-icon name="sparkles" className="w-4 h-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h5 class="text-xs font-bold text-zinc-200 truncate">{{ item.title }}</h5>
                    <p class="text-xs text-zinc-400 line-clamp-2 mt-0.5">{{ item.message }}</p>
                    <span class="text-[10px] text-zinc-500 mt-1 block">{{ item.createdAt | date:'short' }}</span>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
  `
})
export class NotificationDropdownComponent {
  private notifService = inject(NotificationService);
  private router = inject(Router);

  isOpen = false;
  unreadCount = 0;
  notifications: NotificationItem[] = [];

  ngOnInit() {
    this.fetchCount();
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.fetchNotifications();
    }
  }

  fetchCount() {
    this.notifService.countUnread().subscribe({
      next: res => this.unreadCount = res.count,
      error: () => {}
    });
  }

  fetchNotifications() {
    this.notifService.listRecent(10).subscribe({
      next: list => {
        this.notifications = list;
        this.unreadCount = list.filter(n => !n.isRead).length;
      },
      error: () => {}
    });
  }

  markAllRead() {
    this.notifService.markAllRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
      }
    });
  }

  onNotificationClick(item: NotificationItem) {
    if (!item.isRead) {
      this.notifService.markRead(item.id).subscribe();
      item.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }
    this.isOpen = false;
    if (item.linkUrl) {
      this.router.navigateByUrl(item.linkUrl);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const el = event.target as HTMLElement;
    if (!el.closest('app-notification-dropdown')) {
      this.isOpen = false;
    }
  }
}

@Component({
  selector: 'app-user-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, SafeImageComponent],
  template: `
    @if (authService.isLoggedIn()) {
      <div class="relative" #menuRef>
        <button
          (click)="isOpen = !isOpen"
          class="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5 pr-3 hover:border-orange-500/50 hover:bg-zinc-800 transition"
        >
          <div class="relative h-7 w-7 rounded-xl overflow-hidden bg-zinc-800">
            <app-safe-image [src]="authService.currentUser()?.avatar || ''" alt="Avatar" />
          </div>
          <div class="flex flex-col text-left">
            <span class="text-xs font-bold text-zinc-200 truncate max-w-[100px]">
              {{ authService.currentUser()?.username }}
            </span>
            <span class="text-[10px] font-black text-orange-400">
              Lv.{{ authService.currentUser()?.level || 1 }}
            </span>
          </div>
          <app-icon name="chevron-down" className="w-3.5 h-3.5 text-zinc-500" />
        </button>

        @if (isOpen) {
          <div class="absolute right-0 mt-2 w-48 rounded-2xl border border-zinc-800 bg-[#17171d] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
            <a
              routerLink="/profile"
              (click)="isOpen = false"
              class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              <app-icon name="user" className="w-4 h-4 text-orange-400" />
              <span>Hồ sơ cá nhân</span>
            </a>

            <a
              routerLink="/followed"
              (click)="isOpen = false"
              class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              <app-icon name="bookmark" className="w-4 h-4 text-amber-400" />
              <span>Truyện theo dõi</span>
            </a>

            <a
              routerLink="/history"
              (click)="isOpen = false"
              class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              <app-icon name="history" className="w-4 h-4 text-sky-400" />
              <span>Lịch sử đọc</span>
            </a>

            @if (authService.isModerator()) {
              <div class="my-1 border-t border-zinc-800/80"></div>
              <a
                routerLink="/admin"
                (click)="isOpen = false"
                class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-orange-400 hover:bg-orange-500/10 transition"
              >
                <app-icon name="shield" className="w-4 h-4 text-orange-400" />
                <span>Trang Quản Trị</span>
              </a>
            }

            <div class="my-1 border-t border-zinc-800/80"></div>
            <button
              (click)="logout()"
              class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition text-left"
            >
              <app-icon name="log-out" className="w-4 h-4 text-rose-400" />
              <span>Đăng xuất</span>
            </button>
          </div>
        }
      </div>
    } @else {
      <div class="flex items-center gap-2">
        <a
          routerLink="/login"
          class="rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 transition"
        >
          Đăng nhập
        </a>
        <a
          routerLink="/register"
          class="rounded-xl bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition"
        >
          Đăng ký
        </a>
      </div>
    }
  `
})
export class UserNavComponent {
  public authService = inject(AuthService);
  isOpen = false;

  logout() {
    this.isOpen = false;
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const el = event.target as HTMLElement;
    if (!el.closest('app-user-nav')) {
      this.isOpen = false;
    }
  }
}

@Component({
  selector: 'app-search-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, SafeImageComponent],
  template: `
    <!-- Trigger Button / Search Input Trigger -->
    <button
      (click)="openModal()"
      class="flex items-center gap-2.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-400 hover:border-orange-500/40 hover:text-zinc-200 transition shadow-inner w-full max-w-[220px] sm:max-w-[280px]"
    >
      <app-icon name="search" className="w-4 h-4 text-zinc-500" />
      <span class="truncate">Tìm kiếm truyện...</span>
      <kbd class="ml-auto hidden sm:inline-block rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
        /
      </kbd>
    </button>

    <!-- Modal Dialog -->
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" (click)="closeModal()"></div>

        <!-- Search Box -->
        <div class="relative w-full max-w-xl rounded-3xl border border-zinc-800 bg-[#16161b] shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95">
          <!-- Search Header -->
          <div class="flex items-center gap-3 p-4 border-b border-zinc-800/80">
            <app-icon name="search" className="w-5 h-5 text-orange-400" />
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onQueryChange($event)"
              (keydown.enter)="onEnterSearch()"
              placeholder="Nhập tên truyện không dấu, tác giả..."
              class="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
              autofocus
            />
            <button (click)="closeModal()" class="rounded-xl p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition">
              <app-icon name="x" className="w-4 h-4" />
            </button>
          </div>

          <!-- Suggestions List -->
          <div class="max-h-96 overflow-y-auto p-2">
            @if (isLoading) {
              <div class="py-8 text-center text-xs text-zinc-500">Đang tìm kiếm...</div>
            } @else if (results.length > 0) {
              @for (comic of results; track comic.id) {
                <a
                  [routerLink]="['/comics', comic.slug]"
                  (click)="closeModal()"
                  class="flex items-center gap-3 rounded-2xl p-2 hover:bg-zinc-900 transition group"
                >
                  <div class="relative aspect-[3/4] w-11 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                    <app-safe-image [src]="comic.coverImage" [alt]="comic.title" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-orange-400 transition truncate">
                      {{ comic.title }}
                    </h4>
                    <div class="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                      @if (comic.latestChapterNumber) {
                        <span class="text-orange-400 font-semibold">Ch.{{ comic.latestChapterNumber }}</span>
                        <span>•</span>
                      }
                      <span class="flex items-center gap-0.5 text-amber-400">
                        <app-icon name="star" className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {{ comic.ratingAvg }}
                      </span>
                      <span>•</span>
                      <span class="flex items-center gap-0.5">
                        <app-icon name="eye" className="w-3 h-3" />
                        {{ comic.views }}
                      </span>
                    </div>
                  </div>
                  <app-icon name="chevron-right" className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition" />
                </a>
              }
            } @else if (searchQuery.trim().length > 1) {
              <div class="py-8 text-center text-xs text-zinc-500">
                Không tìm thấy truyện phù hợp với từ khoá.
              </div>
            } @else {
              <div class="py-6 px-4 text-xs text-zinc-500 text-center">
                Gõ từ khoá tìm kiếm không dấu (vd: "dao hai tac", "solo leveling")...
              </div>
            }
          </div>

          <!-- Search Footer -->
          @if (searchQuery.trim().length > 0) {
            <div class="p-3 border-t border-zinc-800/80 bg-zinc-950/40 text-center">
              <button
                (click)="onEnterSearch()"
                class="text-xs font-bold text-orange-400 hover:underline inline-flex items-center gap-1.5"
              >
                <span>Xem tất cả kết quả cho "{{ searchQuery }}"</span>
                <app-icon name="arrow-right" className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class SearchAutocompleteComponent {
  private searchService = inject(SearchService);
  private router = inject(Router);

  isOpen = false;
  searchQuery = '';
  results: ComicCard[] = [];
  isLoading = false;
  private debounceTimer: any;

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === '/' && !this.isOpen && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
      event.preventDefault();
      this.openModal();
    } else if (event.key === 'Escape' && this.isOpen) {
      this.closeModal();
    }
  }

  openModal() {
    this.isOpen = true;
    this.searchQuery = '';
    this.results = [];
  }

  closeModal() {
    this.isOpen = false;
  }

  onQueryChange(q: string) {
    clearTimeout(this.debounceTimer);
    if (!q || q.trim().length < 2) {
      this.results = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.debounceTimer = setTimeout(() => {
      this.searchService.quickSuggest(q.trim(), 6).subscribe({
        next: list => {
          this.results = list;
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
    }, 250);
  }

  onEnterSearch() {
    if (this.searchQuery.trim()) {
      this.closeModal();
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconComponent,
    ThemeSelectorComponent,
    NotificationDropdownComponent,
    UserNavComponent,
    SearchAutocompleteComponent
  ],
  template: `
    <header class="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#0e0e12]/90 backdrop-blur-xl transition-colors">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <!-- Left: Logo & Navigation -->
        <div class="flex items-center gap-6">
          <a routerLink="/" class="flex items-center gap-2 group">
            <div class="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 group-hover:scale-105 transition">
              <app-icon name="book-open" className="w-5 h-5" />
            </div>
            <div class="flex flex-col">
              <span class="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-orange-400 transition leading-none">
                Truyen<span class="text-orange-500">Komi</span>
              </span>
              <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-0.5">
                Manga Hub
              </span>
            </div>
          </a>

          <!-- Desktop Nav Links -->
          <nav class="hidden md:flex items-center gap-1 text-xs font-bold text-zinc-300">
            <a
              routerLink="/"
              routerLinkActive="text-orange-400 bg-zinc-900"
              [routerLinkActiveOptions]="{ exact: true }"
              class="rounded-xl px-3 py-2 hover:text-orange-400 hover:bg-zinc-900/60 transition"
            >
              Trang chủ
            </a>
            <a
              routerLink="/comics"
              routerLinkActive="text-orange-400 bg-zinc-900"
              class="rounded-xl px-3 py-2 hover:text-orange-400 hover:bg-zinc-900/60 transition"
            >
              Danh sách truyện
            </a>
            <a
              routerLink="/categories"
              routerLinkActive="text-orange-400 bg-zinc-900"
              class="rounded-xl px-3 py-2 hover:text-orange-400 hover:bg-zinc-900/60 transition"
            >
              Thể loại
            </a>
            <a
              routerLink="/followed"
              routerLinkActive="text-orange-400 bg-zinc-900"
              class="rounded-xl px-3 py-2 hover:text-orange-400 hover:bg-zinc-900/60 transition"
            >
              Theo dõi
            </a>
            <a
              routerLink="/history"
              routerLinkActive="text-orange-400 bg-zinc-900"
              class="rounded-xl px-3 py-2 hover:text-orange-400 hover:bg-zinc-900/60 transition"
            >
              Lịch sử
            </a>
          </nav>
        </div>

        <!-- Center / Right: Search & User Controls -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Autocomplete Search Trigger -->
          <app-search-autocomplete />

          <!-- Theme Selector -->
          <app-theme-selector />

          <!-- Notification Dropdown -->
          <app-notification-dropdown />

          <!-- User Nav / Auth Buttons -->
          <app-user-nav />

          <!-- Mobile Menu Button -->
          <button
            (click)="isMobileMenuOpen = !isMobileMenuOpen"
            class="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
          >
            <app-icon [name]="isMobileMenuOpen ? 'x' : 'menu'" className="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Navigation -->
      @if (isMobileMenuOpen) {
        <div class="md:hidden border-t border-zinc-800/80 bg-[#121217] p-4 space-y-2 animate-in slide-in-from-top-3">
          <a
            routerLink="/"
            (click)="isMobileMenuOpen = false"
            class="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
          >
            <app-icon name="sparkles" className="w-4 h-4 text-orange-400" />
            <span>Trang chủ</span>
          </a>
          <a
            routerLink="/comics"
            (click)="isMobileMenuOpen = false"
            class="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
          >
            <app-icon name="book-open" className="w-4 h-4 text-amber-400" />
            <span>Danh sách truyện</span>
          </a>
          <a
            routerLink="/categories"
            (click)="isMobileMenuOpen = false"
            class="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
          >
            <app-icon name="sliders" className="w-4 h-4 text-sky-400" />
            <span>Thể loại</span>
          </a>
          <a
            routerLink="/followed"
            (click)="isMobileMenuOpen = false"
            class="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
          >
            <app-icon name="bookmark" className="w-4 h-4 text-rose-400" />
            <span>Truyện theo dõi</span>
          </a>
          <a
            routerLink="/history"
            (click)="isMobileMenuOpen = false"
            class="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
          >
            <app-icon name="history" className="w-4 h-4 text-emerald-400" />
            <span>Lịch sử đọc</span>
          </a>
        </div>
      }
    </header>
  `
})
export class NavbarComponent {
  isMobileMenuOpen = false;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <footer class="border-t border-zinc-800/80 bg-[#0a0a0d] py-12 text-zinc-400 mt-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Col 1: Brand Info -->
          <div class="space-y-3 md:col-span-2">
            <div class="flex items-center gap-2">
              <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md">
                <app-icon name="book-open" className="w-4 h-4" />
              </div>
              <span class="text-lg font-black text-white">Truyen<span class="text-orange-500">Komi</span></span>
            </div>
            <p class="text-xs text-zinc-400 leading-relaxed max-w-md">
              Nền tảng đọc truyện tranh trực tuyến hiện đại với tốc độ tải siêu tốc, trải nghiệm đọc tối ưu trên mọi thiết bị và hệ thống cộng đồng độc giả năng động.
            </p>
            <p class="text-[11px] text-zinc-500">
              © 2026 TruyenKomi. Toàn bộ nội dung truyện được tổng hợp và sưu tầm tự động.
            </p>
          </div>

          <!-- Col 2: Quick Links -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-200">Khám Phá</h4>
            <ul class="space-y-2 text-xs">
              <li><a routerLink="/comics" class="hover:text-orange-400 transition">Truyện mới cập nhật</a></li>
              <li><a routerLink="/categories" class="hover:text-orange-400 transition">Danh mục thể loại</a></li>
              <li><a routerLink="/comics" [queryParams]="{ sort: 'views' }" class="hover:text-orange-400 transition">Bảng xếp hạng Top</a></li>
              <li><a routerLink="/history" class="hover:text-orange-400 transition">Lịch sử đọc truyện</a></li>
            </ul>
          </div>

          <!-- Col 3: Legal & Disclaimer -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-200">Thông Tin</h4>
            <p class="text-[11px] text-zinc-500 leading-relaxed">
              Mọi bản quyền truyện thuộc về các tác giả và nhà xuất bản gốc. Vui lòng liên hệ nếu có vấn đề về bản quyền nội dung.
            </p>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}
