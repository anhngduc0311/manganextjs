import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, ToastService } from '../../core/services/core-services';
import { StorageService, ComicService } from '../../core/services/app-services';
import { Genre, ComicDetail } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent, SafeImageComponent } from '../../shared/components/ui-components';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="rounded-3xl border border-zinc-800 bg-[#16161b] p-5 shadow-xl">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-zinc-400">{{ title }}</span>
        <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400">
          <app-icon [name]="icon" className="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3">
        <h3 class="text-2xl font-black text-white tracking-tight">{{ value }}</h3>
        @if (subtext) {
          <p class="text-[11px] text-zinc-500 mt-0.5">{{ subtext }}</p>
        }
      </div>
    </div>
  `
})
export class StatsCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string | number;
  @Input() icon = 'sparkles';
  @Input() subtext?: string;
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="space-y-3">
      <!-- Drop Area -->
      <div
        (dragover)="$event.preventDefault()"
        (drop)="onFileDrop($event)"
        class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-6 text-center hover:border-orange-500/50 hover:bg-zinc-900 transition cursor-pointer"
        (click)="fileInput.click()"
      >
        <input #fileInput type="file" [multiple]="multiple" (change)="onFileSelect($event)" class="hidden" accept="image/*" />
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 mb-2">
          <app-icon name="upload" className="w-5 h-5" />
        </div>
        <p class="text-xs font-bold text-zinc-200">
          {{ isUploading ? 'Đang tải ảnh lên...' : (multiple ? 'Kéo thả hoặc nhấn để chọn nhiều ảnh' : 'Kéo thả hoặc nhấn để chọn ảnh') }}
        </p>
        <p class="text-[10px] text-zinc-500 mt-0.5">Hỗ trợ PNG, JPG, WEBP</p>
      </div>

      <!-- Uploaded List Preview -->
      @if (urls.length > 0) {
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1">
          @for (url of urls; track url; let i = $index) {
            <div class="group relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
              <img [src]="url" alt="Preview" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                <span class="text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded absolute top-1 left-1">{{ i + 1 }}</span>
                <button
                  type="button"
                  (click)="removeImage(i)"
                  class="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
                  title="Xoá ảnh"
                >
                  <app-icon name="trash" className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ImageUploaderComponent {
  @Input() multiple = false;
  @Input() urls: string[] = [];
  @Output() urlsChange = new EventEmitter<string[]>();

  private storageService = inject(StorageService);
  private toast = inject(ToastService);

  isUploading = false;

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.uploadFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.uploadFiles(Array.from(input.files));
    }
  }

  private async uploadFiles(files: File[]) {
    if (files.length === 0) return;
    this.isUploading = true;

    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        // Get presigned URL
        const presign = await this.storageService.getPresignedUrl(file.name, file.type).toPromise();
        if (presign) {
          // Direct PUT to R2 / S3
          await fetch(presign.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file
          });
          uploadedUrls.push(presign.publicUrl);
        }
      }

      if (this.multiple) {
        this.urls = [...this.urls, ...uploadedUrls];
      } else {
        this.urls = uploadedUrls.slice(0, 1);
      }
      this.urlsChange.emit(this.urls);
      this.toast.success(`Đã tải lên ${uploadedUrls.length} ảnh thành công!`);
    } catch (err) {
      this.toast.error('Lỗi tải ảnh', 'Không thể hoàn tất quá trình upload.');
    } finally {
      this.isUploading = false;
    }
  }

  removeImage(index: number) {
    this.urls.splice(index, 1);
    this.urlsChange.emit(this.urls);
  }
}

@Component({
  selector: 'app-comic-modal-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen" [title]="comicId ? 'Cập Nhật Truyện' : 'Thêm Truyện Mới'" modalClass="max-w-2xl" (close)="close.emit()">
      <form (ngSubmit)="saveComic()" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Tên truyện *</label>
            <input type="text" [(ngModel)]="form.title" name="title" required class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Slug (Đường dẫn tĩnh)</label>
            <input type="text" [(ngModel)]="form.slug" name="slug" placeholder="Tự sinh nếu để trống" class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Tên gọi khác</label>
            <input type="text" [(ngModel)]="form.otherNames" name="otherNames" class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Tác giả</label>
            <input type="text" [(ngModel)]="form.author" name="author" class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Trạng thái</label>
            <select [(ngModel)]="form.status" name="status" class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none">
              <option value="ONGOING">Đang tiến hành</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="DROPPED">Tạm ngưng</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Ảnh bìa (Cover URL) *</label>
            <input type="text" [(ngModel)]="form.coverImage" name="coverImage" required class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none" />
          </div>
        </div>

        <!-- Categories multi-select -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Thể loại</label>
          <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-2xl border border-zinc-800 bg-zinc-900">
            @for (cat of availableGenres; track cat.id) {
              <button
                type="button"
                (click)="toggleGenre(cat.id)"
                class="rounded-lg px-2.5 py-1 text-xs font-semibold transition"
                [ngClass]="form.categoryIds.includes(cat.id) ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'"
              >
                {{ cat.name }}
              </button>
            }
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Tóm tắt mô tả</label>
          <textarea [(ngModel)]="form.description" name="description" rows="3" class="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <button type="button" (click)="close.emit()" class="rounded-xl px-4 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition">
            Huỷ
          </button>
          <button type="submit" [disabled]="!form.title.trim()" class="rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition">
            {{ comicId ? 'Lưu Thay Đổi' : 'Tạo Truyện' }}
          </button>
        </div>
      </form>
    </app-modal>
  `
})
export class ComicModalFormComponent {
  @Input() isOpen = false;
  @Input() comicId?: string;
  @Input() initialData?: any;
  @Input() availableGenres: Genre[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private comicService = inject(ComicService);
  private toast = inject(ToastService);

  form = {
    title: '',
    slug: '',
    otherNames: '',
    author: '',
    status: 'ONGOING',
    coverImage: '',
    bannerImage: '',
    description: '',
    categoryIds: [] as string[]
  };

  ngOnChanges() {
    if (this.initialData) {
      this.form = {
        title: this.initialData.title || '',
        slug: this.initialData.slug || '',
        otherNames: this.initialData.otherNames || '',
        author: this.initialData.author || '',
        status: this.initialData.status || 'ONGOING',
        coverImage: this.initialData.coverImage || '',
        bannerImage: this.initialData.bannerImage || '',
        description: this.initialData.description || '',
        categoryIds: this.initialData.categories?.map((c: any) => c.id) || []
      };
    } else {
      this.form = {
        title: '',
        slug: '',
        otherNames: '',
        author: '',
        status: 'ONGOING',
        coverImage: '',
        bannerImage: '',
        description: '',
        categoryIds: []
      };
    }
  }

  toggleGenre(catId: string) {
    const idx = this.form.categoryIds.indexOf(catId);
    if (idx > -1) {
      this.form.categoryIds.splice(idx, 1);
    } else {
      this.form.categoryIds.push(catId);
    }
  }

  saveComic() {
    if (this.comicId) {
      this.comicService.updateComic(this.comicId, this.form).subscribe({
        next: () => {
          this.toast.success('Cập nhật truyện thành công!');
          this.saved.emit();
          this.close.emit();
        },
        error: () => this.toast.error('Lỗi cập nhật truyện.')
      });
    } else {
      this.comicService.createComic(this.form).subscribe({
        next: () => {
          this.toast.success('Tạo truyện mới thành công!');
          this.saved.emit();
          this.close.emit();
        },
        error: () => this.toast.error('Lỗi tạo truyện mới.')
      });
    }
  }
}
