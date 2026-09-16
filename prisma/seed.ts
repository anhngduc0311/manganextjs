import { prisma } from "../src/lib/prisma";
import { hash } from "@node-rs/argon2";
import dotenv from "dotenv";

dotenv.config();

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeTitle(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .trim();
}

async function main() {
  console.log("🌱 Starting TruyenKomi Database Seeding...");

  // 1. Create Default Admin & Demo Users
  console.log("👤 Creating default admin user (admin@truyenkomi.local)...");
  const adminPasswordHash = await hash("Admin@123456");
  const userPasswordHash = await hash("User@123456");

  const admin = await prisma.user.upsert({
    where: { email: "admin@truyenkomi.local" },
    create: {
      username: "admin",
      email: "admin@truyenkomi.local",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      level: 99,
      exp: 999999,
      dailyStreak: 30,
    },
    update: {
      role: "ADMIN",
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "reader@truyenkomi.local" },
    create: {
      username: "reader_demo",
      email: "reader@truyenkomi.local",
      passwordHash: userPasswordHash,
      role: "USER",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      level: 12,
      exp: 3450,
      dailyStreak: 7,
    },
    update: {},
  });

  console.log("✅ TruyenKomi Seeding Completed Successfully!");
  console.log("ℹ️ Thể loại và truyện sẽ được tạo tự động khi cào dữ liệu (Crawler).");
  console.log("-----------------------------------------------");
  console.log("🔑 Default Admin Account:");
  console.log("   Email:    admin@truyenkomi.local");
  console.log("   Password: Admin@123456");
  console.log("🔑 Demo Reader Account:");
  console.log("   Email:    reader@truyenkomi.local");
  console.log("   Password: User@123456");
  console.log("-----------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

