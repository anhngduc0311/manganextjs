import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  UsersManagementTable,
  type UserRow,
} from "@/components/admin/UsersManagementTable";

export const metadata = {
  title: "Quản Lý Người Dùng — TruyenKomi Admin",
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/admin/users");
  }

  const usersRows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      exp: true,
      level: true,
      dailyStreak: true,
      createdAt: true,
    },
  });

  const users: UserRow[] = usersRows.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    exp: u.exp,
    level: u.level,
    dailyStreak: u.dailyStreak,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Quản Lý Người Dùng & Phân Quyền
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Theo dõi danh sách thành viên, cấp bậc trải nghiệm (EXP) và điều chỉnh vai trò quản trị viên (Admin / Moderator).
        </p>
      </div>

      <UsersManagementTable
        users={users}
        currentAdminRole={session.user.role}
        currentUserId={session.user.id}
      />
    </div>
  );
}
