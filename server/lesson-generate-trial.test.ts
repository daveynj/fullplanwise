// @vitest-environment node
//
// Integration-style test for the 5-day unlimited trial in the
// /api/lessons/generate route:
//   - a user inside their trial window generates WITHOUT spending a credit
//   - a user past their trial with 0 credits gets a 402 paywall
//   - a user past their trial with credits spends exactly one
// Heavy dependencies are mocked; the real route handler runs over HTTP.
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type { Server } from "http";

// ---- module mocks (hoisted by vitest) ----

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
  recordJobStartOrRefund: vi.fn(async () => {}),
  completeJobWithLesson: vi.fn(async (_jobId: string, lesson: any) => ({ id: 42, ...lesson })),
  settleJobError: vi.fn(async () => false),
  getPersistedJob: vi.fn(async () => null),
  startJobRecoveryWithRetry: vi.fn(),
  pruneOldJobs: vi.fn(async () => {}),
};

const mockOpenRouterService = {
  generateLesson: vi.fn(async () => ({
    title: "Trial Test Lesson",
    warmUp: { questions: ["Hi?"] },
    vocabulary: [{ word: "journey", definition: "a trip" }],
  })),
  regenerateGrammarSpotlight: vi.fn(),
  // Never resolves — keeps the post-save image update from racing our asserts.
  generateImagesForLesson: vi.fn(() => new Promise<void>(() => {})),
};

vi.mock("./storage", () => ({ storage: mockStorage }));
vi.mock("./lesson-jobs", () => mockLessonJobs);

vi.mock("./auth", () => ({
  setupAuth: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("./db", () => {
  const tx = {
    execute: vi.fn(async () => ({ rows: [{ id: 1 }] })), // rate-limit insert succeeds
  };
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
vi.mock("./services/image-generation.service", () => ({
  testImageGeneration: vi.fn(async () => true),
}));
vi.mock("./stripeClient", () => ({
  getUncachableStripeClient: vi.fn(async () => {
    throw new Error("stripe disabled in tests");
  }),
}));
vi.mock("./features", () => ({
  isFreeTrialActive: () => false, // global trial OFF — we test personal trials
  getFreeTrialEndDate: () => null,
}));

// ---- server setup ----

let server: Server;
let baseUrl: string;
let teacherIdCounter = 2000;
let teacherId: number;

const generateBody = {
  cefrLevel: "B1",
  topic: "travel",
  components: ["vocabulary"],
  generateImages: false,
};

beforeAll(async () => {
  const express = (await import("express")).default;
  const { registerRoutes } = await import("./routes");

  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.isAuthenticated = () => true;
    req.user = { id: teacherId };
    next();
  });

  server = await registerRoutes(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

beforeEach(() => {
  teacherId = ++teacherIdCounter; // fresh teacher per test — avoids the pending-job guard
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

async function postGenerate() {
  return fetch(`${baseUrl}/api/lessons/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(generateBody),
  });
}

describe("lesson generation 5-day unlimited trial", () => {
  it("user inside trial window generates without spending a credit, even with 0 credits", async () => {
    mockStorage.getUser.mockImplementation(async (id: number) => ({
      id,
      isAdmin: false,
      subscriptionTier: "free",
      trialExpiresAt: daysFromNow(3),
      freeCreditsRemaining: 0,
    }));

    const res = await postGenerate();

    expect(res.status).toBe(200);
    const { jobId } = await res.json();
    expect(jobId).toBeTruthy();
    // No credit touched, and the job was recorded with creditSpent = false.
    expect(mockStorage.tryDecrementUserCredits).not.toHaveBeenCalled();
    expect(mockLessonJobs.recordJobStartOrRefund).toHaveBeenCalledWith(jobId, teacherId, false);
  });

  it("user past trial with 0 credits hits the paywall (402)", async () => {
    mockStorage.getUser.mockImplementation(async (id: number) => ({
      id,
      isAdmin: false,
      subscriptionTier: "free",
      trialExpiresAt: daysFromNow(-1), // expired yesterday
      freeCreditsRemaining: 0,
    }));
    mockStorage.tryDecrementUserCredits.mockResolvedValue(false);

    const res = await postGenerate();

    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.trialExpired).toBe(true);
    // No job was started — nothing to recover or refund.
    expect(mockLessonJobs.recordJobStartOrRefund).not.toHaveBeenCalled();
  });

  it("user past trial with credits spends exactly one", async () => {
    mockStorage.getUser.mockImplementation(async (id: number) => ({
      id,
      isAdmin: false,
      subscriptionTier: "free",
      trialExpiresAt: daysFromNow(-1),
      freeCreditsRemaining: 2,
    }));
    mockStorage.tryDecrementUserCredits.mockResolvedValue(true);

    const res = await postGenerate();

    expect(res.status).toBe(200);
    const { jobId } = await res.json();
    expect(mockStorage.tryDecrementUserCredits).toHaveBeenCalledTimes(1);
    expect(mockLessonJobs.recordJobStartOrRefund).toHaveBeenCalledWith(jobId, teacherId, true);
  });
});
