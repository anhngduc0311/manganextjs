export const EXP_PER_DAY_LOGIN = 20;
export const EXP_PER_COMMENT = 10;
export const EXP_PER_RATING = 10;
export const EXP_PER_READ = 5;
export const DAILY_STREAK_BONUS = 20;

export function computeLevel(exp: number): number {
  return Math.floor(Math.sqrt(Math.max(exp, 0) / 100)) + 1;
}

export function expForLevel(level: number): number {
  return Math.pow(Math.max(level - 1, 0), 2) * 100;
}

export interface LevelProgress {
  level: number;
  exp: number;
  currentFloor: number;
  nextFloor: number;
  progressPct: number;
}

export function levelProgress(exp: number): LevelProgress {
  const level = computeLevel(exp);
  const currentFloor = expForLevel(level);
  const nextFloor = expForLevel(level + 1);
  const progressPct = Math.min(100, Math.round(((exp - currentFloor) / (nextFloor - currentFloor)) * 100));
  return { level, exp, currentFloor, nextFloor, progressPct };
}

function startOfDay(d: Date): number {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy.getTime();
}

const DAY_MS = 86_400_000;

export interface StreakResult {
  streak: number;
  awarded: boolean;
}

export function computeStreak(lastActiveAt: Date, currentStreak: number, now: Date = new Date()): StreakResult {
  const last = startOfDay(lastActiveAt);
  const today = startOfDay(now);
  if (today === last) return { streak: currentStreak, awarded: false };
  if (today - last === DAY_MS) return { streak: currentStreak + 1, awarded: true };
  return { streak: 1, awarded: true };
}
