import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth-config";
import { authService } from "@/services/auth.service";
import { loginSchema } from "@/types/schemas";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email hoặc Username", type: "text" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await authService.login(parsed.data.identifier, parsed.data.password);
        if (!user) return null;
        return { id: user.id, name: user.username, email: user.email, image: user.avatar, role: user.role };
      },
    }),
  ],
});
