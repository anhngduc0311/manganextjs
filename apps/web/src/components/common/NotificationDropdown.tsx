"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { Bell, Check, ExternalLink, Loader2 } from "lucide-react";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/actions/notification.actions";
import type { NotificationDTO } from "@/types";

const EMPTY_NOTIFICATIONS: NotificationDTO[] = [];

interface NotificationDropdownProps {
  notifications?: NotificationDTO[];
}

export function NotificationDropdown({ notifications = EMPTY_NOTIFICATIONS }: NotificationDropdownProps) {
  const [items, setItems] = useState<NotificationDTO[]>(notifications);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  };

  const handleItemClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      startTransition(async () => {
        await markNotificationReadAction(id);
      });
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-zinc-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Thông báo mới</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="flex items-center gap-1 text-[11px] font-medium text-orange-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Đã đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/50 py-1">
            {items.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">Bạn chưa có thông báo nào</div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n.id, n.isRead)}
                  className={`p-2.5 transition rounded-xl ${
                    n.isRead ? "opacity-75 hover:bg-zinc-800/50" : "bg-orange-500/5 hover:bg-orange-500/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-zinc-200">{n.title}</p>
                    {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500 mt-1" />}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{n.message}</p>
                  {n.linkUrl && (
                    <Link
                      href={n.linkUrl}
                      onClick={() => setIsOpen(false)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-orange-400 hover:underline"
                    >
                      Xem chi tiết <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

