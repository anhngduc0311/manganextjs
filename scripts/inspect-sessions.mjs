import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const direct = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });

const act = await direct.$queryRawUnsafe(
  "SELECT pid, usename, application_name, state, (now()-state_change) AS idle_for, LEFT(query, 80) AS q FROM pg_stat_activity WHERE datname = current_database()",
);
console.log("SESSIONS:", JSON.stringify(act, (_, v) => (typeof v === "bigint" ? String(v) : v), 1));

const holders = await direct.$queryRawUnsafe(
  "SELECT pid FROM pg_locks WHERE locktype='advisory' AND (classid = 72707369 >> 32 AND objid = (72707369 & 4294967295))",
);
for (const h of holders) {
  await direct.$queryRawUnsafe(`SELECT pg_terminate_backend(${h.pid})`);
  console.log("TERMINATED", h.pid);
}
await direct.$disconnect();
console.log("DONE");
