"use client";

import React, { useState, useTransition } from "react";

import { Search, Trophy, Flame } from "lucide-react";
import { setUserRoleAction } from "@/actions/user.actions";
import { toast } from "@/stores/toast-store";
import type { Role } from "@/types";

export interface UserRow {
  id: string;
  username: string;
  email: string;
  role: Role;
  exp: number;
  level: number;
  dailyStreak: number;
  createdAt: string;
}

export interface UsersManagementTableProps {
  users: UserRow[];
  currentAdminRole: Role;
  currentUserId: string;
}

export function UsersManagementTable({
  users,
  currentAdminRole,
  currentUserId,
}: UsersManagementTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  const filtered = users.filter((u) => {
    const matchSearch =
      !search.trim() ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleRoleChange = (userId: string, username: string, nextRole: Role) => {
    if (currentAdminRole !== "ADMIN") {
      toast.warning("Chỉ tài khoản ADMIN mới có quyền phân cấp bậc người dùng!");
      return;
    }

    if (userId === currentUserId) {
      toast.warning("Bạn không thể tự đổi quyền của chính mình!");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn chuyển quyền của "${username}" sang ${nextRole}?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await setUserRoleAction(userId, nextRole);
        if (res.ok) {
          toast.success(`Đã nâng/hạ quyền của "${username}" thành ${nextRole}! ✅`);
        } else {
          toast.error(res.error || "Không thể cập nhật quyền người dùng");
        }
      } catch {
        toast.error("Lỗi khi cập nhật quyền");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo username, email..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Role Filter */}
        <div className="relative shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 text-xs font-semibold text-zinc-300 outline-none focus:border-orange-500 transition"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="USER">USER (Thành viên)</option>
            <option value="MODERATOR">MODERATOR (Kiểm duyệt viên)</option>
            <option value="ADMIN">ADMIN (Quản trị viên tối cao)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4">Tài khoản</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Cấp bậc</th>
                <th className="py-3.5 px-4">EXP</th>
                <th className="py-3.5 px-4">Chuỗi Streak</th>
                <th className="py-3.5 px-4">Ngày tham gia</th>
                <th className="py-3.5 px-4 text-right">Phân quyền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Không tìm thấy người dùng nào phù hợp
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/40 transition">
                    {/* Username & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs">
                          {u.username[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-200">{u.username}</p>
                          <span
                            className={`inline-flex rounded px-1.5 py-0.2 text-[9px] font-bold border ${
                              u.role === "ADMIN"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : u.role === "MODERATOR"
                                ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                      {u.email}
                    </td>

                    {/* Level */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-400 border border-orange-500/20">
                        <Trophy className="h-3 w-3" /> Lv.{u.level || 1}
                      </span>
                    </td>

                    {/* EXP */}
                    <td className="py-3 px-4 font-semibold text-zinc-300">
                      {u.exp.toLocaleString()} EXP
                    </td>

                    {/* Streak */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-orange-400 font-semibold">
                        <Flame className="h-3.5 w-3.5" /> {u.dailyStreak} ngày
                      </span>
                    </td>

                    {/* Join date */}
                    <td className="py-3 px-4 text-zinc-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>

                    {/* Role changer dropdown */}
                    <td className="py-3 px-4 text-right">
                      {currentAdminRole === "ADMIN" && u.id !== currentUserId ? (
                        <select
                          value={u.role}
                          disabled={isPending}
                          onChange={(e) => handleRoleChange(u.id, u.username, e.target.value as Role)}
                          className="h-8 rounded-xl border border-zinc-700 bg-zinc-800 px-2 text-[11px] font-bold text-zinc-200 outline-none focus:border-orange-500 transition cursor-pointer disabled:opacity-50"
                        >
                          <option value="USER">USER</option>
                          <option value="MODERATOR">MODERATOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      ) : (
                        <span className="text-[11px] text-zinc-600 italic">
                          {u.id === currentUserId ? "Bạn (Hiện tại)" : "Cố định"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
