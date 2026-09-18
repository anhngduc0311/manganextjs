import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/app-services';
import { ToastService, AuthService } from '../../core/services/core-services';
import { User, Role } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { PaginationComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, PaginationComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-white">Quản lý Người dùng</h1>
          <p class="text-xs text-zinc-400 mt-1">Danh sách tất cả thành viên và phân quyền hệ thống</p>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="bg-[#14141a] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="relative w-full sm:w-80">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadUsers(1)"
            placeholder="Tìm theo username hoặc email..."
            class="w-full bg-zinc-900 border border-zinc-700/80 focus:border-[var(--accent)] text-xs text-zinc-200 rounded-xl pl-9 pr-4 py-2.5 outline-none"
          />
          <app-icon name="search" [size]="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"></app-icon>
        </div>

        <select
          [(ngModel)]="selectedRole"
          (change)="loadUsers(1)"
          class="bg-zinc-900 border border-zinc-700/80 text-zinc-300 text-xs rounded-xl px-3 py-2.5 outline-none w-full sm:w-auto"
        >
          <option value="">Tất cả quyền hạn</option>
          <option value="USER">USER</option>
          <option value="MODERATOR">MODERATOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      <!-- Users Table -->
      <div class="bg-[#14141a] border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-zinc-400 uppercase border-b border-zinc-800 bg-zinc-900/50">
              <tr>
                <th class="py-3.5 px-4">Thành viên</th>
                <th class="py-3.5 px-4">Email</th>
                <th class="py-3.5 px-3">Cấp độ & EXP</th>
                <th class="py-3.5 px-3">Streak</th>
                <th class="py-3.5 px-4 text-right">Phân quyền (Role)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60">
              @if (loading()) {
                <tr>
                  <td colspan="5" class="py-12 text-center text-zinc-500">
                    <div class="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải danh sách thành viên...
                  </td>
                </tr>
              } @else if (users().length === 0) {
                <tr>
                  <td colspan="5" class="py-12 text-center text-zinc-500">
                    Không tìm thấy thành viên nào.
                  </td>
                </tr>
              } @else {
                @for (u of users(); track u.id) {
                  <tr class="hover:bg-zinc-800/30 transition">
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center font-bold text-xs shrink-0">
                          {{ u.username?.charAt(0)?.toUpperCase() }}
                        </div>
                        <div>
                          <p class="font-bold text-zinc-200">{{ u.username }}</p>
                          <p class="text-[10px] text-zinc-500">ID: {{ u.id | slice:0:8 }}...</p>
                        </div>
                      </div>
                    </td>
                    <td class="py-3.5 px-4 text-zinc-300">{{ u.email }}</td>
                    <td class="py-3.5 px-3">
                      <div class="flex items-center gap-1.5 text-zinc-300">
                        <span class="font-bold text-[var(--accent)]">Lv. {{ u.level || 1 }}</span>
                        <span class="text-[10px] text-zinc-500">({{ u.exp || 0 }} EXP)</span>
                      </div>
                    </td>
                    <td class="py-3.5 px-3 text-zinc-400 font-medium">🔥 {{ u.dailyStreak || 1 }} ngày</td>
                    <td class="py-3.5 px-4 text-right">
                      <select
                        [ngModel]="u.role"
                        (ngModelChange)="changeRole(u, $event)"
                        [disabled]="u.id === auth.currentUser()?.id"
                        class="bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[var(--accent)] disabled:opacity-50"
                      >
                        <option value="USER">USER</option>
                        <option value="MODERATOR">MODERATOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="p-4 border-t border-zinc-800 flex justify-end">
          <app-pagination
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            (pageChange)="loadUsers($event)"
          ></app-pagination>
        </div>
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  auth = inject(AuthService);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  users = signal<User[]>([]);
  loading = signal<boolean>(true);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);

  searchQuery = '';
  selectedRole = '';

  ngOnInit() {
    this.loadUsers(1);
  }

  loadUsers(page: number) {
    this.loading.set(true);
    this.currentPage.set(page);
    this.userService.listUsersAdmin(page, 20, this.searchQuery, this.selectedRole || undefined).subscribe({
      next: res => {
        this.users.set(res.items || []);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  changeRole(user: User, newRole: Role) {
    this.userService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        this.toast.success(`Đã đổi quyền của ${user.username} thành ${newRole}`);
        user.role = newRole;
      },
      error: () => {
        this.toast.error('Lỗi khi cập nhật quyền');
        this.loadUsers(this.currentPage());
      }
    });
  }
}
