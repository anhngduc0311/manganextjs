import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { storageService } from "@/services/storage.service";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ ok: false, error: "Không có quyền thực hiện" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { filename, contentType = "image/jpeg", folder = "uploads" } = body;

    if (!filename) {
      return NextResponse.json({ ok: false, error: "Thiếu tên file" }, { status: 400 });
    }

    const key = storageService.buildKey(folder, filename);
    const uploadUrl = await storageService.getPresignedPutUrl(key, contentType);
    const publicUrl = storageService.publicUrl(key);

    return NextResponse.json({
      ok: true,
      data: {
        uploadUrl,
        publicUrl,
        key,
      },
    });
  } catch (error) {
    console.error("Upload presigned URL error:", error);
    return NextResponse.json(
      { ok: false, error: (error instanceof Error ? error.message : "Lỗi khi tạo URL tải lên") },
      { status: 500 }
    );
  }
}
