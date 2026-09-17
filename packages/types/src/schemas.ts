import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Tài khoản tối thiểu 3 ký tự").max(100),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(72),
});

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,30}$/, "Username chỉ gồm chữ, số, dấu gạch dưới (3-30 ký tự)"),
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(72),
});

export const commentSchema = z.object({
  comicId: z.string().uuid(),
  chapterId: z.string().uuid().nullable().optional(),
  content: z.string().trim().min(1, "Bình luận không được trống").max(2000, "Bình luận tối đa 2000 ký tự"),
  parentId: z.string().uuid().nullable().optional(),
});

export const ratingSchema = z.object({
  comicId: z.string().uuid(),
  score: z.coerce.number().int().min(1, "Điểm từ 1 đến 5").max(5, "Điểm từ 1 đến 5"),
});

export const reportSchema = z.object({
  chapterId: z.string().uuid(),
  reason: z.string().trim().min(5, "Lý do tối thiểu 5 ký tự").max(500),
});

export const historySchema = z.object({
  comicId: z.string().uuid(),
  chapterId: z.string().uuid(),
  lastReadPage: z.coerce.number().int().min(1).default(1),
});

export const comicUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Tên truyện không được trống").max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang")
    .optional()
    .or(z.literal("")),
  otherNames: z.string().trim().max(500).optional().or(z.literal("")),
  author: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["ONGOING", "COMPLETED", "DROPPED"]).default("ONGOING"),
  coverImage: z.string().trim().min(1, "Ảnh bìa không được trống"),
  bannerImage: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  categoryIds: z.array(z.string().uuid()).default([]),
});

export const chapterUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  comicId: z.string().uuid(),
  chapterNumber: z.coerce.number().positive("Số chương phải lớn hơn 0"),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  pages: z
    .array(
      z.object({
        pageIndex: z.coerce.number().int().min(0),
        imageUrl: z.string().min(1),
      }),
    )
    .min(1, "Chương cần ít nhất 1 trang ảnh"),
});

export const genreUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Tên thể loại không được trống").max(100),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const userRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["USER", "MODERATOR", "ADMIN"]),
});

export const reportResolveSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["RESOLVED", "REJECTED"]),
});

export const uploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().regex(/^image\/(png|jpe?g|webp|gif|avif)$/, "Chỉ hỗ trợ file ảnh (png, jpg, webp, gif, avif)"),
});

export const ingestSchema = z.object({
  comic: z.object({
    title: z.string().trim().min(1).max(200),
    slug: z.string().trim().regex(/^[a-z0-9-]+$/).optional(),
    author: z.string().trim().max(200).optional(),
    status: z.enum(["ONGOING", "COMPLETED", "DROPPED"]).optional(),
    description: z.string().max(5000).optional(),
    otherNames: z.string().max(500).optional(),
    coverImage: z.string().optional(),
    categories: z.array(z.string().min(1)).default([]),
  }),
  chapters: z
    .array(
      z.object({
        chapterNumber: z.coerce.number().positive(),
        title: z.string().max(200).optional(),
        pages: z.array(z.string().url()).min(1),
      }),
    )
    .min(1),
});

export const revalidateSchema = z.object({
  tags: z.array(z.string().min(1)).max(50).default([]),
  paths: z.array(z.string().min(1)).max(50).default([]),
});

export const viewSchema = z.object({
  comicId: z.string().uuid(),
  chapterId: z.string().uuid(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
export type ComicUpsertInput = z.infer<typeof comicUpsertSchema>;
export type ChapterUpsertInput = z.infer<typeof chapterUpsertSchema>;
export type GenreUpsertInput = z.infer<typeof genreUpsertSchema>;
export type IngestInput = z.infer<typeof ingestSchema>;
export type ViewInput = z.infer<typeof viewSchema>;
