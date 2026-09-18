import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/core-services';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div class="absolute w-96 h-96 bg-[var(--accent)]/15 rounded-full blur-3xl pointer-events-none -translate-y-12"></div>

      <div class="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <div class="text-center mb-8">
          <a routerLink="/" class="inline-flex items-center gap-2.5 group mb-4">
            <div class="w-11 h-11 rounded-2xl bg-linear-to-tr from-[var(--accent)] to-pink-500 flex items-center justify-center text-white shadow-lg shadow-[var(--accent)]/30">
              <app-icon name="book-open" [size]="22"></app-icon>
            </div>
            <span class="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              Truyen<span class="text-[var(--accent)]">Komi</span>
            </span>
          </a>
          <h1 class="text-2xl font-bold text-[var(--text-primary)]">Quên mật khẩu</h1>
          <p class="text-xs text-[var(--text-muted)] mt-1">Nhập email đăng ký để nhận hướng dẫn khôi phục mật khẩu</p>
        </div>

        @if (sent()) {
          <div class="text-center py-6">
            <div class="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-4">
              <app-icon name="check" [size]="32"></app-icon>
            </div>
            <h3 class="text-lg font-bold text-[var(--text-primary)] mb-2">Đã gửi email khôi phục</h3>
            <p class="text-xs text-[var(--text-muted)] mb-6">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong>{{ email }}</strong>. Vui lòng kiểm tra hòm thư của bạn.
            </p>
            <a
              routerLink="/auth/login"
              class="inline-flex items-center justify-center w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-[var(--accent)]/25 text-sm"
            >
              Quay lại đăng nhập
            </a>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5">Địa chỉ Email</label>
              <div class="relative">
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="VD: user@example.com"
                  class="w-full bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--accent)]/20"
                />
                <app-icon name="mail" [size]="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></app-icon>
              </div>
            </div>

            <button
              type="submit"
              [disabled]="loading() || !email"
              class="w-full mt-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-[var(--accent)]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              @if (loading()) {
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Đang xử lý...</span>
              } @else {
                <span>Gửi yêu cầu đặt lại</span>
              }
            </button>
          </form>

          <div class="mt-6 text-center pt-6 border-t border-[var(--border)]">
            <p class="text-xs text-[var(--text-muted)]">
              Nhớ lại mật khẩu?
              <a routerLink="/auth/login" class="text-[var(--accent)] font-semibold hover:underline ml-1">Đăng nhập</a>
            </p>
          </div>
        }
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private toast = inject(ToastService);

  email = '';
  loading = signal<boolean>(false);
  sent = signal<boolean>(false);

  onSubmit() {
    if (!this.email) return;
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.sent.set(true);
      this.toast.success('Yêu cầu đã được gửi!');
    }, 800);
  }
}
