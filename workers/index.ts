import { getTcpRedis } from "@/lib/redis";
import { createCrawlerWorker } from "./crawler.worker";
import { syncBufferedViews, checkPeriodicReset } from "./view-sync.worker";

async function main() {
  console.log("=========================================");
  console.log("🚀 TruyenKomi Background Workers Starting");
  console.log("=========================================");

  const tcpRedis = await getTcpRedis();
  let crawlerWorker: ReturnType<typeof createCrawlerWorker> | null = null;

  if (tcpRedis) {
    console.log("✅ Connected to Redis TCP. Initializing BullMQ Ingestion Worker...");
    crawlerWorker = createCrawlerWorker(tcpRedis);
  } else {
    console.warn("⚠️ No UPSTASH_REDIS_URL_TCP found. Running in REST view-sync mode.");
  }

  // 2. Start View Sync Worker Loop (every 30 seconds)
  console.log("⏱️ View Sync Worker started (Interval: 30s)...");

  // Initial sync immediately
  await syncBufferedViews().catch(console.error);

  const syncInterval = setInterval(async () => {
    try {
      await syncBufferedViews();
      await checkPeriodicReset();
    } catch (err) {
      console.error("[Worker Loop] View sync error:", err);
    }
  }, 30000);

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down TruyenKomi workers gracefully...`);
    clearInterval(syncInterval);

    if (crawlerWorker) {
      await crawlerWorker.close();
      console.log("💤 Crawler BullMQ worker stopped.");
    }

    if (tcpRedis) {
      await tcpRedis.quit();
      console.log("🔌 Redis TCP connection closed.");
    }

    console.log("👋 All workers terminated successfully.");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Fatal Worker Error:", err);
  process.exit(1);
});
