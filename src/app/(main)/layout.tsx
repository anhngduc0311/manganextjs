import React from "react";
import { auth } from "@/auth";
import { authService } from "@/services/auth.service";
import { notificationService } from "@/services/notification.service";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { ToastContainer } from "@/components/ui/Toast";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let fullUser = null;
  let userNotifications = undefined;

  if (session?.user?.id) {
    const [dbUser, notifications] = await Promise.all([
      authService.findById(session.user.id),
      notificationService.listRecent(session.user.id, 10).catch(() => []),
    ]);

    if (dbUser) {
      fullUser = {
        id: dbUser.id,
        name: dbUser.username,
        email: dbUser.email,
        image: dbUser.avatar,
        role: dbUser.role,
        level: dbUser.level,
        dailyStreak: dbUser.dailyStreak,
      };
      userNotifications = notifications;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 selection:bg-orange-500 selection:text-white">
      <Navbar user={fullUser} notifications={userNotifications} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}
