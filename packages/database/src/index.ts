import { PrismaClient, Prisma, Role, ComicStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export * from "@prisma/client";

export function getPrismaAdapter(dbUrl?: string): PrismaPg {
  let connectionString =
    dbUrl ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/truyenkomi";

  if (connectionString.includes("sslmode=require") && !connectionString.includes("uselibpqcompat")) {
    connectionString = connectionString.replace(/([?&])sslmode=require(&|$)/, "$1sslmode=verify-full$2");
  }

  const pool = new Pool({ connectionString });
  return new PrismaPg(pool);
}

export function createPrismaClient(dbUrl?: string): PrismaClient {
  const adapter = getPrismaAdapter(dbUrl);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
