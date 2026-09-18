import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, ToastService } from '../../core/services/core-services';
import { UserService } from '../../core/services/app-services';
import { User } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { SafeImageComponent, ModalComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, ModalComponent],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <a routerLink="/" class="hover:text-[var(--accent)] transition-colors">Trang chủ</a>
        <span>/</span>
        <span class="text-[var(--text-primary)]">Hồ sơ cá nhân</span>
      </div>

      @if (auth.currentUser(); as user) {
        <div class="space-y-6">
          <!-- Profile Card -->
          <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
            <!-- Ambient glow -->
            <div class="absolute -right-20 -top-20 w-72 h-72 bg-[var(--accent)]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <!-- Avatar with edit trigger -->
              <div class="relative group cursor-pointer" (click)="openAvatarModal()">
                <div class="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-2 border-[var(--accent)]/40 p-1 bg-[var(--bg-secondary)] shadow-md">
                  @if (user.avatar) {
                    <img [src]="user.avatar" [alt]="user.username" class="w-full h-full object-cover rounded-2xl" />
                  } @else {
                    <div class="w-full h-full rounded-2xl bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center font-black text-3xl">
                      {{ user.username.charAt(0).toUpperCase() }}
                    </div>
                  }
                </div>
                <div class="absolute inset-0 bg-black/50 backdrop-blur-xs rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
                  <app-icon name="edit" [size]="18"></app-icon>
                  <span>Đổi ảnh</span>
                </div>
              </div>

              <!-- User Info -->
              <div class="flex-1 text-center sm:text-left">
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                  <h1 class="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">{{ user.username }}</h1>
                  <span
                    [class.bg-red-500]="user.role === 'ADMIN'"
                    [class.bg-purple-500]="user.role === 'MODERATOR'"
                    [class.bg-blue-600]="user.role === 'USER'"
                    class="text-[11px] font-bold text-white uppercase px-2.5 py-0.5 rounded-full shadow-xs"
                  >
                    {{ user.role }}
                  </span>
                </div>
                <p class="text-sm text-[var(--text-muted)] mb-4">{{ user.email }}</p>

                <!-- Level & Progress Bar -->
                <div class="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 max-w-md">
                  <div class="flex items-center justify-between text-xs font-semibold mb-2">
                    <span class="text-[var(--accent)] flex items-center gap-1.5">
                      <app-icon name="star" [size]="14"></app-icon>
                      Cấp độ {{ user.level || 1 }}
                    </span>
                    <span class="text-[var(--text-muted)]">{{ user.exp || 0 }} / {{ getNextLevelExp(user.level || 1) }} EXP</span>
                  </div>
                  <div class="w-full h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      class="h-full bg-linear-to-r from-[var(--accent)] to-pink-500 rounded-full transition-all duration-500"
                      [style.width.%]="getExpPercent(user.exp || 0, user.level || 1)"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <app-icon name="flame" [size]="24"></app-icon>
              </div>
              <div>
                <p class="text-2xl font-black text-[var(--text-primary)]">{{ user.dailyStreak || 1 }}</p>
                <p class="text-xs text-[var(--text-muted)]">Ngày điểm danh liên tiếp</p>
              </div>
            </div>

            <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <app-icon name="bookmark" [size]="24"></app-icon>
              </div>
              <div>
                <a routerLink="/followed" class="text-2xl font-black text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">Xem</a>
                <p class="text-xs text-[var(--text-muted)]">Truyện đang theo dõi</p>
              </div>
            </div>

            <div class="col-span-2 sm:col-span-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                <app-icon name="history" [size]="24"></app-icon>
              </div>
              <div>
                <a routerLink="/history" class="text-2xl font-black text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">Xem</a>
                <p class="text-xs text-[var(--text-muted)]">Lịch sử đọc truyện</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Avatar Modal -->
        <app-modal [isOpen]="isAvatarModalOpen" title="Đổi ảnh đại diện" (closed)="closeAvatarModal()">
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Đường dẫn hình ảnh (URL)</label>
              <input
                type="text"
                [(ngModel)]="newAvatarUrl"
                placeholder="https://example.com/avatar.png"
                class="w-full bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </div>

            <!-- Avatar Preview -->
            @if (newAvatarUrl) {
              <div class="text-center py-2">
                <p class="text-xs text-[var(--text-muted)] mb-2">Xem trước:</p>
                <img [src]="newAvatarUrl" alt="Preview" class="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-[var(--accent)]" />
              </div>
            }

            <div class="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                (click)="closeAvatarModal()"
                class="px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                (click)="saveAvatar()"
                [disabled]="isSavingAvatar"
                class="px-5 py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {{ isSavingAvatar ? 'Đang lưu...' : 'Cập nhật' }}
              </button>
            </div>
          </div>
        </app-modal>
      }
    </div>
  `
})
export class ProfilePageComponent {
  auth = inject(AuthService);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  isAvatarModalOpen = false;
  newAvatarUrl = '';
  isSavingAvatar = false;

  getNextLevelExp(level: number): number {
    return level * 100;
  }

  getExpPercent(exp: number, level: number): number {
    const needed = this.getNextLevelExp(level);
    return Math.min(100, Math.round((exp / needed) * 100));
  }

  openAvatarModal() {
    this.newAvatarUrl = this.auth.currentUser()?.avatar || '';
    this.isAvatarModalOpen = true;
  }

  closeAvatarModal() {
    this.isAvatarModalOpen = false;
  }

  saveAvatar() {
    if (!this.newAvatarUrl) return;
    this.isSavingAvatar = true;
    this.userService.updateProfile({ avatar: this.newAvatarUrl }).subscribe({
      next: updated => {
        if (this.auth.currentUser()) {
          this.auth.updateCurrentUser({
            ...this.auth.currentUser()!,
            avatar: this.newAvatarUrl
          });
        }
        this.toast.success('Cập nhật ảnh đại diện thành công!');
        this.isSavingAvatar = false;
        this.closeAvatarModal();
      },
      error: () => {
        this.toast.error('Không thể cập nhật ảnh đại diện');
        this.isSavingAvatar = false;
      }
    });
  }
}
