// @vitest-environment node
//
// The lesson progress check (GET /api/lessons/job/:jobId) when the job is NOT
// in this server's memory. With several autoscale servers running, the job
// may be generating on another server: a young pending job must report
// "pending" (keep polling), and only an abandoned one reports an error.
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type { Server } from "http";

const TEACHER_ID = 3100;

const mockStorage = {
  getUser: vi.fn(),
  getLesson: vi.fn(),
};

const mockLessonJobs = {
  reserveGenerationJob: vi.fn(async () => ({ status: "reserved" })),
  spendCreditForJob: vi.fn(async () => true),
  releaseJobReservation: vi.fn(async () => {}),
  completeJobWithLesson: vi.fn(),
  settleJobError: vi.fn(async () => false),
  getPersistedJob: vi.fn(),
  startJobRecovery: vi.fn(),
  pruneOldJobs: vi.fn(async () => {}),
};

vi.mock("./storage", () => ({ storage: mockStorage }));
vi.mock("./lesson-jobs", () => mockLessonJobs);
vi.mock("./auth", () => ({ setupAuth: vi.fn(), hashPassword: vi.fn() }));
vi.mock("./db", () => ({
  db: { execute: vi.fn(async () => ({ rows: [] })), transaction: vi.fn() },
  pool: { end: vi.fn() },
}));
vi.mock("./services/openRouter", () => ({
  openRouterService: {},
  testOpenRouterConnection: vi.fn(async () => true),
}));
vi.mock("./services/mailchimp.service", () => ({ mailchimpService: {} }));
vi.mock("./services/image-generation.service", () => ({ testImageGeneration: vi.fn(async () => true) }));
vi.mock("./stripeClient", () => ({
  getUncachableStripeClient: vi.fn(async () => {
    throw new Error("stripe disabled in tests");
  }),
}));
vi.mock("./features", () => ({ isFreeTrialActive: () => false, getFreeTrialEndDate: () => null }));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const express = (await import("express")).default;
  const { registerRoutes } = await import("./routes");
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.isAuthenticated = () => true;
    req.user = { id: TEACHER_ID };
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
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function persisted(overrides: Record<string, unknown>) {
  return {
    id: "job_other_server",
    teacherId: TEACHER_ID,
    status: "pending",
    creditSpent: true,
    lessonId: null,
    error: null,
    abandoned: false,
    ...overrides,
  };
}

async function poll() {
  const res = await fetch(`${baseUrl}/api/lessons/job/job_other_server`);
  return { status: res.status, body: await res.json() };
}

describe("lesson progress check for a job on another server", () => {
  it("reports pending while the job may still be generating elsewhere", async () => {
    mockLessonJobs.getPersistedJob.mockResolvedValue(persisted({}));
    expect(await poll()).toEqual({ status: 200, body: { status: "pending" } });
  });

  it("reports an error once the job is old enough to be abandoned", async () => {
    mockLessonJobs.getPersistedJob.mockResolvedValue(persisted({ abandoned: true }));
    const { status, body } = await poll();
    expect(status).toBe(500);
    expect(body.status).toBe("error");
  });

  it("returns the lesson when another server finished it", async () => {
    mockLessonJobs.getPersistedJob.mockResolvedValue(persisted({ status: "complete", lessonId: 77 }));
    mockStorage.getLesson.mockResolvedValue({ id: 77, title: "Done elsewhere" });
    expect(await poll()).toEqual({ status: 200, body: { status: "complete", lesson: { id: 77, title: "Done elsewhere" } } });
  });

  it("does not reveal another teacher's job", async () => {
    mockLessonJobs.getPersistedJob.mockResolvedValue(persisted({ teacherId: TEACHER_ID + 1 }));
    expect((await poll()).status).toBe(404);
  });
});
