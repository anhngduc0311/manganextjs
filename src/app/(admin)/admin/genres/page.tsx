import React from "react";
import { prisma } from "@/lib/prisma";
import { GenresTable, type GenreRow } from "@/components/admin/GenresTable";

export const metadata = {
  title: "Quản Lý Thể Loại — TruyenKomi Admin",
};

export default async function AdminGenresPage() {
  const categoriesRows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { comics: true } },
    },
  });

  const genres: GenreRow[] = categoriesRows.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    comicCount: cat._count.comics,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Quản Lý Thể Loại Truyện
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Thiết lập hệ thống phân loại, gắn nhãn thể loại cho truyện tranh và tự động đồng bộ bộ lọc tìm kiếm.
        </p>
      </div>

      <GenresTable genres={genres} />
    </div>
  );
}
