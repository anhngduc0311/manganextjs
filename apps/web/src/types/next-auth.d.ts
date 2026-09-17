import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "MODERATOR" | "ADMIN";
      avatar: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "USER" | "MODERATOR" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "USER" | "MODERATOR" | "ADMIN";
    avatar?: string;
  }
}
