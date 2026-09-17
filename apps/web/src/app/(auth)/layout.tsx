import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block text-3xl font-black tracking-tight text-orange-500">
            TruyenKomi
          </Link>
          <p className="mt-2 text-sm text-zinc-400">Đọc truyện tranh online — nhanh, nhẹ, offline</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">{children}</div>
      </div>
    </div>
  );
}
