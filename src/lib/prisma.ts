import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  let client: PrismaClient;
  if (process.env.DATABASE_URL) {
    let connectionString = process.env.DATABASE_URL;
    if (connectionString.includes("sslmode=require") && !connectionString.includes("uselibpqcompat")) {
      connectionString = connectionString.replace(/([?&])sslmode=require(&|$)/, "$1sslmode=verify-full$2");
    }
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    client = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  } else {
    client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
