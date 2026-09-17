"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { ToastContainer } from "@/components/ui/Toast";
import type { CategoryDTO, NotificationDTO, Role } from "@/types";

interface MainLayoutClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: Role;
    level?: number;
    dailyStreak?: number;
  } | null;
  notifications?: NotificationDTO[];
  categories: CategoryDTO[];
  children: React.ReactNode;
}

export function MainLayoutClient({ user, notifications, categories, children }: MainLayoutClientProps) {
  const pathname = usePathname();

  // Check if current route is a comic chapter reader page: /comics/[slug]/[chapter]
  const isReaderPage = /^\/comics\/[^/]+\/[^/]+$/.test(pathname);

  if (isReaderPage) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 selection:bg-orange-500 selection:text-white">
        <main className="w-full">
          {children}
        </main>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f12] text-zinc-100 selection:bg-orange-500 selection:text-white">
      <Navbar user={user} notifications={notifications} categories={categories} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}
