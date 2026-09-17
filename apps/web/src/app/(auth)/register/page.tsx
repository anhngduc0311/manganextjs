import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Đăng ký — TruyenKomi" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-zinc-100">Tạo tài khoản</h1>
      <RegisterForm />
    </div>
  );
}
