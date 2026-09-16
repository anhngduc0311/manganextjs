import React from "react";
import { auth } from "@/auth";
import { authService } from "@/services/auth.service";
import { notificationService } from "@/services/notification.service";
import { comicService } from "@/services/comic.service";
import { MainLayoutClient } from "@/components/common/MainLayoutClient";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let fullUser = null;
  let userNotifications = undefined;

  const categories = await comicService.listCategories().catch(() => []);
  const [dbUser, notifications] = session?.user?.id
    ? await Promise.all([
        authService.findById(session.user.id),
        notificationService.listRecent(session.user.id, 10).catch(() => []),
      ])
    : [null, []];

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

  return (
    <MainLayoutClient
      user={fullUser}
      notifications={userNotifications}
      categories={categories}
    >
      {children}
    </MainLayoutClient>
  );
}
