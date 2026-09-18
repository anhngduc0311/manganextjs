import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../core/services/app-services';
import { ToastService } from '../../core/services/core-services';
import { ReportItem } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { PaginationComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-white">Quản lý Báo lỗi</h1>
          <p class="text-xs text-zinc-400 mt-1">Xử lý các báo cáo về lỗi ảnh hỏng, sai chương từ phía người đọc</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-[#14141a] border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
        <span class="text-xs text-zinc-400 font-semibold uppercase">Trạng thái:</span>
        <div class="flex gap-2">
          @for (s of statusFilters; track s.value) {
            <button
              (click)="setStatus(s.value)"
              [class.bg-[var(--accent)]]="selectedStatus === s.value"
              [class.text-white]="selectedStatus === s.value"
              [class.bg-zinc-900]="selectedStatus !== s.value"
              [class.text-zinc-400]="selectedStatus !== s.value"
              class="text-xs px-3 py-1.5 rounded-lg border border-zinc-700/80 font-medium transition"
            >
              {{ s.label }}
            </button>
          }
        </div>
      </div>

      <!-- Reports Table -->
      <div class="bg-[#14141a] border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-zinc-400 uppercase border-b border-zinc-800 bg-zinc-900/50">
              <tr>
                <th class="py-3.5 px-4">Truyện / Chương</th>
                <th class="py-3.5 px-4">Lý do báo lỗi</th>
                <th class="py-3.5 px-3">Người báo cáo</th>
                <th class="py-3.5 px-3">Trạng thái</th>
                <th class="py-3.5 px-3">Thời gian</th>
                <th class="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60">
              @if (loading()) {
                <tr>
                  <td colspan="6" class="py-12 text-center text-zinc-500">
                    <div class="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải danh sách báo lỗi...
                  </td>
                </tr>
              } @else if (reports().length === 0) {
                <tr>
                  <td colspan="6" class="py-12 text-center text-zinc-500">
                    Không có báo cáo lỗi nào.
                  </td>
                </tr>
              } @else {
                @for (r of reports(); track r.id) {
                  <tr class="hover:bg-zinc-800/30 transition">
                    <td class="py-3.5 px-4">
                      <div>
                        <a [routerLink]="['/comic', r.comicSlug]" target="_blank" class="font-bold text-zinc-200 hover:text-[var(--accent)] transition">
                          {{ r.comicTitle }}
                        </a>
                        <p class="text-[10px] text-orange-400 font-semibold">Chương {{ r.chapterNumber }}</p>
                      </div>
                    </td>
                    <td class="py-3.5 px-4 max-w-sm">
                      <p class="text-zinc-300 font-medium break-words">{{ r.reason }}</p>
                    </td>
                    <td class="py-3.5 px-3 text-zinc-400">
                      {{ r.username || 'Ẩn danh' }}
                    </td>
                    <td class="py-3.5 px-3">
                      <span
                        [ngClass]="{
                          'bg-amber-500/20 text-amber-400': r.status === 'PENDING',
                          'bg-emerald-500/20 text-emerald-400': r.status === 'RESOLVED',
                          'bg-rose-500/20 text-rose-400': r.status === 'REJECTED'
                        }"
                        class="px-2 py-0.5 rounded-md text-[10px] font-bold"
                      >
                        {{ r.status }}
                      </span>
                    </td>
                    <td class="py-3.5 px-3 text-zinc-500">{{ r.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td class="py-3.5 px-4 text-right">
                      @if (r.status === 'PENDING') {
                        <div class="flex items-center justify-end gap-2">
                          <button
                            (click)="resolveReport(r, 'RESOLVED')"
                            class="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition font-semibold text-[11px]"
                          >
                            Đã sửa
                          </button>
                          <button
                            (click)="resolveReport(r, 'REJECTED')"
                            class="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white transition font-semibold text-[11px]"
                          >
                            Bỏ qua
                          </button>
                        </div>
                      } @else {
                        <span class="text-[11px] text-zinc-600 italic">Đã xử lý</span>
                      }
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
            (pageChange)="loadReports($event)"
          ></app-pagination>
        </div>
      </div>
    </div>
  `
})
export class AdminReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private toast = inject(ToastService);

  reports = signal<ReportItem[]>([]);
  loading = signal<boolean>(true);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  selectedStatus = 'PENDING';

  statusFilters = [
    { label: 'Chờ xử lý', value: 'PENDING' },
    { label: 'Đã giải quyết', value: 'RESOLVED' },
    { label: 'Đã bác bỏ', value: 'REJECTED' },
    { label: 'Tất cả', value: '' }
  ];

  ngOnInit() {
    this.loadReports(1);
  }

  setStatus(status: string) {
    this.selectedStatus = status;
    this.loadReports(1);
  }

  loadReports(page: number) {
    this.loading.set(true);
    this.currentPage.set(page);
    this.reportService.listReports(page, 20, this.selectedStatus || undefined).subscribe({
      next: res => {
        this.reports.set(res.items || []);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  resolveReport(report: ReportItem, status: string) {
    this.reportService.resolveReport(report.id, status).subscribe({
      next: () => {
        this.toast.success('Đã cập nhật trạng thái báo lỗi');
        this.loadReports(this.currentPage());
      },
      error: () => this.toast.error('Lỗi khi cập nhật báo cáo')
    });
  }
}
