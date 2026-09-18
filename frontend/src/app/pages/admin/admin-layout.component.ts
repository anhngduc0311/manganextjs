import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/core-services';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="min-h-screen bg-[#0d0d11] text-zinc-100 flex flex-col md:flex-row">
      <!-- Sidebar -->
      <aside class="w-full md:w-64 bg-[#14141a] border-r border-zinc-800/80 flex flex-col justify-between shrink-0">
        <div>
          <!-- Admin Brand -->
          <div class="p-6 border-b border-zinc-800/80 flex items-center justify-between">
            <a routerLink="/admin" class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-linear-to-tr from-[var(--accent)] to-pink-500 flex items-center justify-center text-white shadow-md shadow-[var(--accent)]/30">
                <app-icon name="shield" [size]="18"></app-icon>
              </div>
              <div>
                <span class="font-black text-sm tracking-tight text-white block">Komi<span class="text-[var(--accent)]">Admin</span></span>
                <span class="text-[10px] text-zinc-400">Control Panel</span>
              </div>
            </a>
            <a routerLink="/" class="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800" title="Về trang chủ">
              <app-icon name="home" [size]="16"></app-icon>
            </a>
          </div>

          <!-- Navigation Links -->
          <nav class="p-4 space-y-1.5">
            @for (item of navItems; track item.link) {
              <a
                [routerLink]="item.link"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                routerLinkActive="bg-[var(--accent)] text-white font-bold shadow-lg shadow-[var(--accent)]/20"
                class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all group font-medium"
              >
                <app-icon [name]="item.icon" [size]="18" class="shrink-0"></app-icon>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
        </div>

        <!-- Current User Profile in Sidebar -->
        @if (auth.currentUser(); as user) {
          <div class="p-4 m-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center font-bold text-xs shrink-0">
                {{ user.username.charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-white truncate">{{ user.username }}</p>
                <p class="text-[10px] text-[var(--accent)] font-semibold">{{ user.role }}</p>
              </div>
            </div>
            <button (click)="auth.logout()" class="text-zinc-500 hover:text-red-400 p-1 rounded-lg" title="Đăng xuất">
              <app-icon name="log-out" [size]="16"></app-icon>
            </button>
          </div>
        }
      </aside>

      <!-- Main Admin Content Area -->
      <main class="flex-1 flex flex-col min-w-0 bg-[#0e0e12] overflow-y-auto min-h-screen">
        <header class="h-16 border-b border-zinc-800/80 bg-[#14141a]/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div class="flex items-center gap-3">
            <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hệ thống quản trị TruyenKomi</span>
          </div>
          <div class="flex items-center gap-3">
            <a
              routerLink="/"
              target="_blank"
              class="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition"
            >
              <app-icon name="external-link" [size]="14"></app-icon>
              <span>Xem trang chính</span>
            </a>
          </div>
        </header>

        <div class="p-6 md:p-8 flex-1">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class AdminLayoutComponent {
  auth = inject(AuthService);

  navItems = [
    { label: 'Tổng quan (Dashboard)', link: '/admin', icon: 'bar-chart', exact: true },
    { label: 'Quản lý Truyện', link: '/admin/comics', icon: 'book-open', exact: false },
    { label: 'Quản lý Thể loại', link: '/admin/genres', icon: 'grid', exact: false },
    { label: 'Duyệt Bình luận', link: '/admin/comments', icon: 'message-square', exact: false },
    { label: 'Báo lỗi & Phản hồi', link: '/admin/reports', icon: 'alert-triangle', exact: false },
    { label: 'Quản lý Người dùng', link: '/admin/users', icon: 'users', exact: false }
  ];
}
