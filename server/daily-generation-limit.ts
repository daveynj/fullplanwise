/**
 * A daily ceiling on lessons for accounts that don't pay (a teacher's own
 * trial, the free period for everyone, or free credits). The hourly limit
 * alone allows 480 lessons a day; at a few cents a lesson, one throwaway
 * account could run up a real bill. Paying teachers and admins are not capped
 * here (the hourly limit still applies to them).
 *
 * Configurable with LESSON_GENERATION_FREE_DAILY_LIMIT (default 25; 0 turns
 * the cap off).
 */
export const DEFAULT_FREE_DAILY_LIMIT = 25;
export const DAY_MS = 24 * 60 * 60 * 1000;

export function freeDailyLimit(env: NodeJS.ProcessEnv = process.env): number | null {
  const raw = env.LESSON_GENERATION_FREE_DAILY_LIMIT;
  if (raw === undefined || raw.trim() === "") return DEFAULT_FREE_DAILY_LIMIT;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0) return DEFAULT_FREE_DAILY_LIMIT;
  return value === 0 ? null : value;
}

/** The cap that applies to this account, or null when it has none. */
export function dailyGenerationLimitFor(
  user: { isAdmin?: boolean | null; subscriptionTier?: string | null } | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): number | null {
  if (!user) return freeDailyLimit(env);
  if (user.isAdmin || user.subscriptionTier === "unlimited") return null;
  return freeDailyLimit(env);
}

/** Whole hours until the oldest lesson in the window is a day old (at least 1). */
export function hoursUntilNextLesson(oldestMs: number | null, now: number = Date.now()): number {
  if (oldestMs === null || !Number.isFinite(oldestMs)) return 1;
  return Math.min(24, Math.max(1, Math.ceil((oldestMs + DAY_MS - now) / (60 * 60 * 1000))));
}

export function dailyLimitMessage(limit: number, hours: number): string {
  return `You've made ${limit} lessons in the last 24 hours, which is the limit on a free account. You can make more in about ${hours} hour${hours === 1 ? "" : "s"}, or subscribe to Unlimited to keep going now.`;
}
