import { describe, expect, it } from "vitest";
import { computeLevel, computeStreak, expForLevel, levelProgress } from "@/lib/leveling";

describe("computeLevel", () => {
  it("exp 0 -> level 1", () => {
    expect(computeLevel(0)).toBe(1);
  });
  it("exp 100 -> level 2", () => {
    expect(computeLevel(100)).toBe(2);
  });
  it("exp 400 -> level 3", () => {
    expect(computeLevel(400)).toBe(3);
  });
  it("exp am -> level 1", () => {
    expect(computeLevel(-50)).toBe(1);
  });
  it("expForLevel doi xung voi computeLevel", () => {
    expect(computeLevel(expForLevel(5))).toBe(5);
  });
});

describe("levelProgress", () => {
  it("tien do trong khoang 0-100", () => {
    const p = levelProgress(150);
    expect(p.level).toBe(2);
    expect(p.currentFloor).toBe(100);
    expect(p.nextFloor).toBe(400);
    expect(p.progressPct).toBe(17);
  });
});

describe("computeStreak", () => {
  it("cung ngay -> khong tang, khong thuong", () => {
    const now = new Date("2026-09-16T10:00:00Z");
    const last = new Date("2026-09-16T01:00:00Z");
    expect(computeStreak(last, 5, now)).toEqual({ streak: 5, awarded: false });
  });
  it("hom qua -> tang 1 va thuong", () => {
    const now = new Date("2026-09-16T10:00:00Z");
    const last = new Date("2026-09-15T23:00:00Z");
    expect(computeStreak(last, 5, now)).toEqual({ streak: 6, awarded: true });
  });
  it("bo trong 1 ngay -> reset ve 1 va thuong", () => {
    const now = new Date("2026-09-16T10:00:00Z");
    const last = new Date("2026-09-13T10:00:00Z");
    expect(computeStreak(last, 5, now)).toEqual({ streak: 1, awarded: true });
  });
});
