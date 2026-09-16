import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { PWARegister } from "@/components/common/PWARegister";
import { NavigationProgress } from "@/components/common/NavigationProgress";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TruyenKomi — Nền tảng đọc truyện tranh online",
    template: "%s | TruyenKomi",
  },
  description: "Đọc truyện tranh manga, manhwa, manhua online mượt mà, tốc độ cao, hỗ trợ đọc offline PWA.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-orange-500 selection:text-white">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}

