import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Đăng nhập — TruyenKomi" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-zinc-100">Đăng nhập</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
