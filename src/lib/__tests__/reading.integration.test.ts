import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { prisma } from "@/lib/prisma";
import { recordReading } from "@/services/history.service";
import { gamificationService } from "@/services/gamification.service";

// Run only against a dedicated empty test database, never the application's DB.
const enabled = Boolean(process.env.READING_TEST_DATABASE_URL);
describe.skipIf(!enabled)("reading rewards and data migration (PostgreSQL)", () => {
  let pool: Pool;
  beforeAll(async () => {
    if (process.env.DATABASE_URL !== process.env.READING_TEST_DATABASE_URL) {
      throw new Error("DATABASE_URL must match the dedicated READING_TEST_DATABASE_URL");
    }
    pool = new Pool({ connectionString: process.env.READING_TEST_DATABASE_URL });
    for (const name of ["20260916014729_init", "20260916020000_search_extensions", "20260916090252_init"]) {
      await pool.query(readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8"));
    }
    await pool.query(`
      INSERT INTO "User" (id, username, email, "passwordHash", "updatedAt", exp)
      VALUES ('reader', 'reader', 'reader@example.test', 'unused', NOW(), 95);
      INSERT INTO "Comic" (id, title, "titleUnaccent", slug, "coverImage", "updatedAt")
      VALUES ('comic', 'Comic', 'comic', 'comic', 'cover', NOW()),
             ('empty', 'Empty', 'empty', 'empty', 'cover', NOW());
      INSERT INTO "Chapter" (id, "comicId", "chapterNumber")
      VALUES ('one', 'comic', 1), ('two', 'comic', 2.5), ('three', 'comic', 10);
      INSERT INTO "History" ("userId", "comicId", "chapterId") VALUES ('reader', 'comic', 'one');
    `);
    await pool.query(readFileSync("prisma/migrations/20260916093000_repair_chapter_metadata_and_rewards/migration.sql", "utf8"));
  });

  afterAll(async () => { await prisma.$disconnect(); await pool?.end(); });

  it("backfills counts and the highest chapter number including empty comics", async () => {
    const comic = await prisma.comic.findUniqueOrThrow({ where: { id: "comic" } });
    expect(comic.chapterCount).toBe(3);
    expect(comic.latestChapterNumber).toBe(10);
    const empty = await prisma.comic.findUniqueOrThrow({ where: { id: "empty" } });
    expect(empty.chapterCount).toBe(0);
    expect(empty.latestChapterNumber).toBeNull();
    const index = await pool.query("SELECT indexdef FROM pg_indexes WHERE indexname = 'comics_title_trgm_idx'");
    expect(index.rows[0].indexdef).toContain("gin_trgm_ops");
  });

  it("rejects mismatched comic/chapter pairs before writing history or EXP", async () => {
    expect(await recordReading("reader", { comicId: "empty", chapterId: "two", lastReadPage: 1 })).toBe(false);
    expect(await recordReading("reader", { comicId: "comic", chapterId: "missing", lastReadPage: 1 })).toBe(false);
    expect(await prisma.readingReward.count()).toBe(1);
  });

  it("does not reward migrated reading history again", async () => {
    await recordReading("reader", { comicId: "comic", chapterId: "one", lastReadPage: 2 });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: "reader" } })).exp).toBe(95);
  });

  it("awards only once under concurrent retries, page changes and revisits", async () => {
    await Promise.all(Array.from({ length: 5 }, () => recordReading("reader", {
      comicId: "comic", chapterId: "two", lastReadPage: 1,
    })));
    await recordReading("reader", { comicId: "comic", chapterId: "two", lastReadPage: 9 });
    await recordReading("reader", { comicId: "comic", chapterId: "one", lastReadPage: 1 });
    await recordReading("reader", { comicId: "comic", chapterId: "two", lastReadPage: 3 });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: "reader" } });
    expect(user.exp).toBe(100);
    expect(user.level).toBe(2);
    expect(await prisma.readingReward.count()).toBe(2);
  });

  it("keeps EXP increments from concurrent reading and other activities", async () => {
    await Promise.all([
      recordReading("reader", { comicId: "comic", chapterId: "three", lastReadPage: 1 }),
      gamificationService.awardExp("reader", 10),
    ]);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: "reader" } })).exp).toBe(115);
  });
});
