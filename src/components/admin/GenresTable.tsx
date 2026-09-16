"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Search, BookOpen, ExternalLink } from "lucide-react";
import { GenreModalForm, type GenreFormData } from "./GenreModalForm";
import { deleteGenreAction } from "@/actions/comic.actions";
import { toast } from "@/stores/toast-store";

export interface GenreRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  comicCount: number;
}

export interface GenresTableProps {
  genres: GenreRow[];
}

export function GenresTable({ genres }: GenresTableProps) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<GenreFormData | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = genres.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingGenre(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (g: GenreRow) => {
    setEditingGenre({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description || "",
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string, name: string, comicCount: number) => {
    if (comicCount > 0) {
      if (
        !window.confirm(
          `Thể loại "${name}" đang được gắn với ${comicCount} bộ truyện. Bạn có chắc muốn xóa không?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Bạn có chắc muốn xóa thể loại "${name}" không?`)) {
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await deleteGenreAction(id);
        if (res.ok) {
          toast.success(`Đã xóa thể loại "${name}" thành công!`);
        } else {
          toast.error(res.error || "Không thể xóa thể loại");
        }
      } catch {
        toast.error("Lỗi khi xóa thể loại");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên thể loại, slug..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Add Genre Button */}
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" /> Thêm thể loại mới
        </button>
      </div>

      {/* Genres Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4">Tên thể loại</th>
                <th className="py-3.5 px-4">Đường dẫn (Slug)</th>
                <th className="py-3.5 px-4">Mô tả</th>
                <th className="py-3.5 px-4">Số bộ truyện</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    Không tìm thấy thể loại nào phù hợp
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-zinc-800/40 transition">
                    {/* Name */}
                    <td className="py-3 px-4 font-bold text-zinc-100">
                      {g.name}
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4 font-mono text-[11px] text-orange-400">
                      /{g.slug}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-zinc-400 max-w-sm">
                      {g.description || <span className="text-zinc-600 italic">Chưa có mô tả</span>}
                    </td>

                    {/* Comic Count */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-300">
                        <BookOpen className="h-3 w-3 text-orange-400" /> {g.comicCount} truyện
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View in client */}
                        <Link
                          href={`/comics?genres=${g.slug}`}
                          target="_blank"
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                          title="Xem truyện theo thể loại này"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(g)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:text-orange-400 hover:bg-orange-500/10 transition cursor-pointer"
                          title="Chỉnh sửa thể loại"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(g.id, g.name, g.comicCount)}
                          disabled={isPending}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer disabled:opacity-50"
                          title="Xóa thể loại"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <GenreModalForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingGenre}
      />
    </div>
  );
}
