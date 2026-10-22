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
  reserveGenerationJob: vi.fn(async () => ({ status: "reserved" })),
  spendCreditForJob: vi.fn(async () => true),
  releaseJobReservation: vi.fn(async () => {}),
  completeJobWithLesson: vi.fn(async (_jobId: string, lesson: any) => ({ id: 42, ...lesson })),
  settleJobError: vi.fn(async () => false),
  getPersistedJob: vi.fn(async () => null),
  startJobRecovery: vi.fn(),
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
    // The job was reserved, and no credit was touched.
    expect(mockLessonJobs.reserveGenerationJob).toHaveBeenCalledWith(jobId, teacherId, expect.any(Number), expect.any(Number));
    expect(mockLessonJobs.spendCreditForJob).not.toHaveBeenCalled();
  });

  it("user past trial with 0 credits hits the paywall (402)", async () => {
    mockStorage.getUser.mockImplementation(async (id: number) => ({
      id,
      isAdmin: false,
      subscriptionTier: "free",
      trialExpiresAt: daysFromNow(-1), // expired yesterday
      freeCreditsRemaining: 0,
    }));
    mockLessonJobs.spendCreditForJob.mockResolvedValue(false);

    const res = await postGenerate();

    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.trialExpired).toBe(true);
    // The reservation was released — nothing to recover or refund, and the
    // teacher is not blocked from trying again.
    const reservedJobId = (mockLessonJobs.reserveGenerationJob.mock.calls[0] as any[])[0];
    expect(mockLessonJobs.releaseJobReservation).toHaveBeenCalledWith(reservedJobId);
    expect(mockOpenRouterService.generateLesson).not.toHaveBeenCalled();
  });

  it("user past trial with credits spends exactly one", async () => {
    mockStorage.getUser.mockImplementation(async (id: number) => ({
      id,
      isAdmin: false,
      subscriptionTier: "free",
      trialExpiresAt: daysFromNow(-1),
      freeCreditsRemaining: 2,
    }));
    mockLessonJobs.spendCreditForJob.mockResolvedValue(true);

    const res = await postGenerate();

    expect(res.status).toBe(200);
    const { jobId } = await res.json();
    // The credit is spent against the reserved job, exactly once.
    expect(mockLessonJobs.spendCreditForJob).toHaveBeenCalledTimes(1);
    expect(mockLessonJobs.spendCreditForJob).toHaveBeenCalledWith(jobId, teacherId);
    expect(mockLessonJobs.releaseJobReservation).not.toHaveBeenCalled();
  });
});

describe("one generation at a time per teacher (shared across servers)", () => {
  it("returns 409 with the existing jobId when another server already holds a pending job", async () => {
    // This server's memory knows nothing about the job — only the database
    // reservation (made by another server) does.
    mockLessonJobs.reserveGenerationJob.mockResolvedValueOnce({ status: "duplicate", jobId: "job_from_other_server" } as any);
    mockStorage.getUser.mockImplementation(async (id: number) => ({
      id, isAdmin: false, subscriptionTier: "free", trialExpiresAt: daysFromNow(-1), freeCreditsRemaining: 2,
    }));

    const res = await postGenerate();

    expect(res.status).toBe(409);
    expect((await res.json()).jobId).toBe("job_from_other_server");
    // Nothing spent, nothing started, nothing released.
    expect(mockLessonJobs.spendCreditForJob).not.toHaveBeenCalled();
    expect(mockOpenRouterService.generateLesson).not.toHaveBeenCalled();
    expect(mockLessonJobs.releaseJobReservation).not.toHaveBeenCalled();
  });

  it("returns 503 without spending anything when the reservation cannot be written", async () => {
    mockLessonJobs.reserveGenerationJob.mockRejectedValueOnce(new Error("db down"));

    const res = await postGenerate();

    expect(res.status).toBe(503);
    expect(mockLessonJobs.spendCreditForJob).not.toHaveBeenCalled();
    expect(mockOpenRouterService.generateLesson).not.toHaveBeenCalled();
  });
});
