// @vitest-environment node
//
// The daily ceiling on lessons for accounts that don't pay. The hourly limit
// alone allows 480 lessons a day; a free or trial account now stops at 25 in
// 24 hours. Paying teachers and admins are not capped, and a failure to count
// never blocks a lesson. The real route handler runs over HTTP; the database
// and the AI services are mocked.
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type { Server } from "http";
import {
  dailyGenerationLimitFor, dailyLimitMessage, freeDailyLimit, hoursUntilNextLesson, DAY_MS,
} from "./daily-generation-limit";

vi.mock("./lesson-url-schema", () => ({ ensureLessonUrlSchema: vi.fn(async () => {}) }));

const mockStorage = {
  getUser: vi.fn(),
  createLesson: vi.fn(),
  updateLesson: vi.fn(),
  assignLessonToStudent: vi.fn(),
  getStudentVocabulary: vi.fn(),
  tryDecrementUserCredits: vi.fn(),
  incrementUserCredits: vi.fn(),
};
const mockLessonJobs = {
  reserveGenerationJob: vi.fn(async () => ({ status: "reserved" })),
  spendCreditForJob: vi.fn(async () => true),
  releaseJobReservation: vi.fn(async () => {}),
  completeJobWithLesson: vi.fn(async (_jobId: string, lesson: any) => ({ id: 42, ...lesson })),
  settleJobError: vi.fn(async () => false),
  getPersistedJob: vi.fn(async () => null),
  startJobRecovery: vi.fn(),
  pruneOldJobs: vi.fn(async () => {}),
  generationsInLastDay: vi.fn(async () => ({ count: 1, oldestMs: Date.now() as number | null })),
};
const mockOpenRouterService = {
  generateLesson: vi.fn(async () => ({ title: "Cap Test Lesson", vocabulary: [{ word: "journey", definition: "a trip" }] })),
  regenerateGrammarSpotlight: vi.fn(),
  generateImagesForLesson: vi.fn(() => new Promise<void>(() => {})),
};
vi.mock("./storage", () => ({ storage: mockStorage }));
vi.mock("./lesson-jobs", () => mockLessonJobs);
vi.mock("./auth", () => ({ setupAuth: vi.fn(), hashPassword: vi.fn() }));
vi.mock("./db", () => {
  const tx = { execute: vi.fn(async () => ({ rows: [{ id: 1 }] })) };
  return {
    db: {
      execute: vi.fn(async () => ({ rows: [] })),
      transaction: vi.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
    },
    pool: { end: vi.fn() },
  };
});
vi.mock("./services/openRouter", () => ({
  openRouterService: mockOpenRouterService,
  testOpenRouterConnection: vi.fn(async () => true),
}));
vi.mock("./services/mailchimp.service", () => ({ mailchimpService: {} }));
vi.mock("./services/image-generation.service", () => ({ testImageGeneration: vi.fn(async () => true) }));
vi.mock("./stripeClient", () => ({
  getUncachableStripeClient: vi.fn(async () => { throw new Error("stripe disabled in tests"); }),
}));
// The free period for everyone is ON: nobody spends credits, so only the cap can stop a lesson.
vi.mock("./features", () => ({
  isFreeTrialActive: () => true,
  getFreeTrialEndDate: () => new Date(Date.now() + 10 * DAY_MS),
}));

let server: Server;
let baseUrl: string;
let teacherIdCounter = 5000;
let sessionUser: { id: number; isAdmin: boolean; subscriptionTier: string };

beforeAll(async () => {
  const express = (await import("express")).default;
  const { registerRoutes } = await import("./routes");
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.isAuthenticated = () => true;
    req.user = sessionUser;
    next();
  });
  server = await registerRoutes(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  baseUrl = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
});
beforeEach(() => {
  sessionUser = { id: ++teacherIdCounter, isAdmin: false, subscriptionTier: "free" };
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockStorage.getUser.mockImplementation(async (id: number) => ({ ...sessionUser, id, trialExpiresAt: null, freeCreditsRemaining: 0 }));
  mockLessonJobs.generationsInLastDay.mockResolvedValue({ count: 1, oldestMs: Date.now() });
});
const postGenerate = () => fetch(`${baseUrl}/api/lessons/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ cefrLevel: "B1", topic: "travel", components: ["vocabulary"], generateImages: false }),
});

describe("daily lesson cap for accounts that don't pay", () => {
  it("lets a free account make its 25th lesson of the day", async () => {
    mockLessonJobs.generationsInLastDay.mockResolvedValue({ count: 25, oldestMs: Date.now() - 3 * 60 * 60 * 1000 });
    const res = await postGenerate();
    expect(res.status).toBe(200);
    expect((await res.json()).jobId).toBeTruthy();
    expect(mockLessonJobs.generationsInLastDay).toHaveBeenCalledWith(sessionUser.id);
    expect(mockLessonJobs.releaseJobReservation).not.toHaveBeenCalled();
  });

  it("refuses the 26th, frees the slot it reserved, and says when to come back", async () => {
    mockLessonJobs.generationsInLastDay.mockResolvedValue({ count: 26, oldestMs: Date.now() - 20 * 60 * 60 * 1000 });
    const res = await postGenerate();
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.dailyLimit).toBe(25);
    expect(body.retryAfterMinutes).toBe(240);
    expect(body.message).toContain("25 lessons in the last 24 hours");
    expect(body.message).toContain("about 4 hours");
    const reservedJobId = (mockLessonJobs.reserveGenerationJob.mock.calls[0] as any[])[0];
    expect(mockLessonJobs.releaseJobReservation).toHaveBeenCalledWith(reservedJobId);
    expect(mockOpenRouterService.generateLesson).not.toHaveBeenCalled();
    expect(mockLessonJobs.spendCreditForJob).not.toHaveBeenCalled();
  });

  it("does not cap paying teachers or admins", async () => {
    mockLessonJobs.generationsInLastDay.mockResolvedValue({ count: 400, oldestMs: Date.now() });
    sessionUser = { ...sessionUser, subscriptionTier: "unlimited" };
    expect((await postGenerate()).status).toBe(200);
    sessionUser = { id: ++teacherIdCounter, isAdmin: true, subscriptionTier: "free" };
    expect((await postGenerate()).status).toBe(200);
    expect(mockLessonJobs.generationsInLastDay).not.toHaveBeenCalled();
  });

  it("makes the lesson anyway when the count can't be read", async () => {
    mockLessonJobs.generationsInLastDay.mockRejectedValue(new Error("database unavailable"));
    const res = await postGenerate();
    expect(res.status).toBe(200);
    expect(mockLessonJobs.releaseJobReservation).not.toHaveBeenCalled();
  });

  it("leaves a lesson already being made alone (the pending job is resumed, not counted)", async () => {
    mockLessonJobs.reserveGenerationJob.mockResolvedValueOnce({ status: "duplicate", jobId: "job_existing" } as any);
    const res = await postGenerate();
    expect(res.status).toBe(409);
    expect(mockLessonJobs.generationsInLastDay).not.toHaveBeenCalled();
  });
});

describe("daily limit rules", () => {
  it("is 25 by default, can be changed, and 0 turns it off", () => {
    expect(freeDailyLimit({})).toBe(25);
    expect(freeDailyLimit({ LESSON_GENERATION_FREE_DAILY_LIMIT: "40" })).toBe(40);
    expect(freeDailyLimit({ LESSON_GENERATION_FREE_DAILY_LIMIT: "0" })).toBeNull();
    expect(freeDailyLimit({ LESSON_GENERATION_FREE_DAILY_LIMIT: "abc" })).toBe(25);
    expect(freeDailyLimit({ LESSON_GENERATION_FREE_DAILY_LIMIT: "-5" })).toBe(25);
  });

  it("applies to free and trial accounts only", () => {
    expect(dailyGenerationLimitFor({ isAdmin: false, subscriptionTier: "free" }, {})).toBe(25);
    expect(dailyGenerationLimitFor({ subscriptionTier: null }, {})).toBe(25);
    expect(dailyGenerationLimitFor(undefined, {})).toBe(25);
    expect(dailyGenerationLimitFor({ subscriptionTier: "unlimited" }, {})).toBeNull();
    expect(dailyGenerationLimitFor({ isAdmin: true, subscriptionTier: "free" }, {})).toBeNull();
  });

  it("works out the wait in whole hours, between 1 and 24", () => {
    const now = Date.UTC(2026, 11, 2, 12);
    expect(hoursUntilNextLesson(now - 20 * 3600_000, now)).toBe(4);
    expect(hoursUntilNextLesson(now - 23.9 * 3600_000, now)).toBe(1);
    expect(hoursUntilNextLesson(now, now)).toBe(24);
    expect(hoursUntilNextLesson(now - 30 * 3600_000, now)).toBe(1);
    expect(hoursUntilNextLesson(null, now)).toBe(1);
    expect(dailyLimitMessage(25, 1)).toContain("about 1 hour,");
  });
});
