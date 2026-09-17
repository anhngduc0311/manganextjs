"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var import_adapter_pg = require("@prisma/adapter-pg");
var import_pg = require("pg");
var globalForPrisma = globalThis;
function createPrismaClient() {
  let client;
  if (process.env.DATABASE_URL) {
    let connectionString = process.env.DATABASE_URL;
    if (connectionString.includes("sslmode=require") && !connectionString.includes("uselibpqcompat")) {
      connectionString = connectionString.replace(/([?&])sslmode=require(&|$)/, "$1sslmode=verify-full$2");
    }
    const pool = new import_pg.Pool({ connectionString });
    const adapter = new import_adapter_pg.PrismaPg(pool);
    client = new import_client.PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
    });
  } else {
    client = new import_client.PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
    });
  }
  return client;
}
var prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// prisma/seed.ts
var import_argon2 = require("@node-rs/argon2");
var import_dotenv = __toESM(require("dotenv"));
import_dotenv.default.config();
async function main() {
  console.log("\u{1F331} Starting TruyenKomi Database Seeding...");
  console.log("\u{1F464} Creating default admin user (admin@truyenkomi.local)...");
  const adminPasswordHash = await (0, import_argon2.hash)("Admin@123456");
  const userPasswordHash = await (0, import_argon2.hash)("User@123456");
  await prisma.user.upsert({
    where: { email: "admin@truyenkomi.local" },
    create: {
      username: "admin",
      email: "admin@truyenkomi.local",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      level: 99,
      exp: 999999,
      dailyStreak: 30
    },
    update: {
      role: "ADMIN"
    }
  });
  await prisma.user.upsert({
    where: { email: "reader@truyenkomi.local" },
    create: {
      username: "reader_demo",
      email: "reader@truyenkomi.local",
      passwordHash: userPasswordHash,
      role: "USER",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      level: 12,
      exp: 3450,
      dailyStreak: 7
    },
    update: {}
  });
  console.log("\u2705 TruyenKomi Seeding Completed Successfully!");
  console.log("\u2139\uFE0F Th\u1EC3 lo\u1EA1i v\xE0 truy\u1EC7n s\u1EBD \u0111\u01B0\u1EE3c t\u1EA1o t\u1EF1 \u0111\u1ED9ng khi c\xE0o d\u1EEF li\u1EC7u (Crawler).");
  console.log("-----------------------------------------------");
  console.log("\u{1F511} Default Admin Account:");
  console.log("   Email:    admin@truyenkomi.local");
  console.log("   Password: Admin@123456");
  console.log("\u{1F511} Demo Reader Account:");
  console.log("   Email:    reader@truyenkomi.local");
  console.log("   Password: User@123456");
  console.log("-----------------------------------------------");
}
main().catch((e) => {
  console.error("\u274C Seed Error:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
