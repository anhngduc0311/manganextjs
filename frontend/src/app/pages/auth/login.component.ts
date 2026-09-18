import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService, ToastService } from '../../core/services/core-services';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <!-- Glow background -->
      <div class="absolute w-96 h-96 bg-[var(--accent)]/15 rounded-full blur-3xl pointer-events-none -translate-y-12"></div>

      <div class="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <!-- Logo / Header -->
        <div class="text-center mb-8">
          <a routerLink="/" class="inline-flex items-center gap-2.5 group mb-4">
            <div class="w-11 h-11 rounded-2xl bg-linear-to-tr from-[var(--accent)] to-pink-500 flex items-center justify-center text-white shadow-lg shadow-[var(--accent)]/30">
              <app-icon name="book-open" [size]="22"></app-icon>
            </div>
            <span class="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              Truyen<span class="text-[var(--accent)]">Komi</span>
            </span>
          </a>
          <h1 class="text-2xl font-bold text-[var(--text-primary)]">Đăng nhập</h1>
          <p class="text-xs text-[var(--text-muted)] mt-1">Chào mừng bạn quay trở lại với thế giới truyện tranh</p>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5">Tên đăng nhập hoặc Email</label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="identifier"
                name="identifier"
                required
                placeholder="Nhập username hoặc email"
                class="w-full bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--accent)]/20"
              />
              <app-icon name="user" [size]="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></app-icon>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-semibold text-[var(--text-muted)] uppercase">Mật khẩu</label>
              <a routerLink="/auth/forgot-password" class="text-xs text-[var(--accent)] hover:underline">Quên mật khẩu?</a>
            </div>
            <div class="relative">
              <input
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="••••••••"
                class="w-full bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text-primary)] rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--accent)]/20"
              />
              <app-icon name="lock" [size]="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></app-icon>
              <button
                type="button"
                (click)="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <app-icon [name]="showPassword ? 'eye-off' : 'eye'" [size]="16"></app-icon>
              </button>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="loading() || !identifier || !password"
            class="w-full mt-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-[var(--accent)]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (loading()) {
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Đang đăng nhập...</span>
            } @else {
              <span>Đăng nhập</span>
            }
          </button>
        </form>

        <!-- Footer link -->
        <div class="mt-6 text-center pt-6 border-t border-[var(--border)]">
          <p class="text-xs text-[var(--text-muted)]">
            Chưa có tài khoản?
            <a routerLink="/auth/register" class="text-[var(--accent)] font-semibold hover:underline ml-1">Đăng ký ngay</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  identifier = '';
  password = '';
  showPassword = false;
  loading = signal<boolean>(false);

  onSubmit() {
    if (!this.identifier || !this.password) return;

    this.loading.set(true);
    this.auth.login(this.identifier, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác';
        this.toast.error('Đăng nhập thất bại', msg);
      }
    });
  }
}
