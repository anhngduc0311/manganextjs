"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X, ArrowUp, ArrowDown, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { toast } from "@/stores/toast-store";

export interface ImageUploaderProps {
  value?: string | string[];
  onChange: (urls: string | string[]) => void;
  multiple?: boolean;
  folder?: "covers" | "banners" | "chapters" | "uploads";
  label?: string;
  helperText?: string;
}

export function ImageUploader({
  value,
  onChange,
  multiple = false,
  folder = "uploads",
  label,
  helperText,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // Normalize items to string[]
  const items: string[] = Array.isArray(value) ? value : value ? [value] : [];

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (validFiles.length === 0) {
      toast.warning("Vui lòng chọn file hình ảnh hợp lệ (.jpg, .png, .webp)!");
      return;
    }

    setUploading(true);
    setProgress(0);

    const uploadedUrls: string[] = [];
    let completedCount = 0;

    try {
      for (const file of validFiles) {
        // 1. Get presigned PUT URL from /api/upload
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || "image/jpeg",
            folder,
          }),
        });

        const data = await res.json();
        if (!data.ok || !data.data?.uploadUrl) {
          throw new Error(data.error || "Không thể tạo liên kết tải ảnh lên R2");
        }

        const { uploadUrl, publicUrl } = data.data;

        // 2. Direct PUT to Cloudflare R2
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "image/jpeg",
          },
          body: file,
        });

        if (!putRes.ok) {
          throw new Error(`Tải ảnh ${file.name} thất bại (${putRes.status})`);
        }

        uploadedUrls.push(publicUrl);
        completedCount++;
        setProgress(Math.round((completedCount / validFiles.length) * 100));
      }

      if (multiple) {
        onChange([...items, ...uploadedUrls]);
        toast.success(`Đã tải lên thành công ${uploadedUrls.length} ảnh! ✅`);
      } else {
        onChange(uploadedUrls[0]);
        toast.success("Đã tải ảnh lên thành công! ✅");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Có lỗi xảy ra trong quá trình tải ảnh");
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (index: number) => {
    if (multiple) {
      const next = items.filter((_, i) => i !== index);
      onChange(next);
    } else {
      onChange("");
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!multiple) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const next = [...items];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {label && <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">{label}</label>}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
        className="hidden"
      />

      {/* Drop Zone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
          isDragOver
            ? "border-orange-500 bg-orange-500/10"
            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            <p className="text-xs font-bold text-zinc-200">Đang tải ảnh lên Cloudflare R2... ({progress}%)</p>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-orange-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400 shadow-inner">
              <UploadCloud className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200">
                Nhấp để chọn ảnh hoặc kéo thả vào đây
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {helperText || (multiple ? "Hỗ trợ tải lên cùng lúc nhiều ảnh (.jpg, .png, .webp)" : "Hỗ trợ 1 ảnh (.jpg, .png, .webp)")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Previews (Single or Multi) */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Đã tải: <strong className="text-zinc-200">{items.length}</strong> ảnh</span>
            {multiple && <span className="text-[11px] text-zinc-500">Dùng nút mũi tên để đổi thứ tự trang</span>}
          </div>

          <div
            className={
              multiple
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-1"
                : "relative aspect-[3/4] w-36 overflow-hidden rounded-xl border border-zinc-700 shadow-xl"
            }
          >
            {items.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-md"
              >
                <Image
                  src={url}
                  alt={`Preview ${idx + 1}`}
                  fill
                  sizes="160px"
                  className="object-cover transition group-hover:scale-105"
                />

                {/* Index badge for chapters */}
                {multiple && (
                  <span className="absolute top-1.5 left-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-md bg-black/80 px-1 text-[10px] font-bold text-white backdrop-blur-sm">
                    {idx + 1}
                  </span>
                )}

                {/* Action buttons overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 group-hover:opacity-100 transition backdrop-blur-xs">
                  {multiple && idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "up")}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                      title="Lên trên"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {multiple && idx < items.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "down")}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                      title="Xuống dưới"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/80 text-white hover:bg-red-600"
                    title="Xóa ảnh"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
