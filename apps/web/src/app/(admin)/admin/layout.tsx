import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { SessionUser } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Trang Quản Trị — TruyenKomi Admin",
  description: "Hệ thống quản trị nội dung truyện tranh, phân quyền và kiểm duyệt TruyenKomi.",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?next=/admin");
  }

  const role = session.user.role;
  if (role !== "MODERATOR" && role !== "ADMIN") {
    redirect("/login?error=unauthorized");
  }

  const user: SessionUser = {
    id: session.user.id,
    username: session.user.name || session.user.email?.split("@")[0] || "Admin",
    email: session.user.email || "",
    role: session.user.role,
    level: 1,
    avatar: session.user.image,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Fixed Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <AdminHeader user={user} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
