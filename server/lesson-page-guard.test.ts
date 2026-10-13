// @vitest-environment node
//
// Guards the /lessons/:id route in server/routes.ts against soft 404s:
// - non-numeric ids, missing lessons and private (neither public nor shared)
//   lessons must return a real HTTP 404, never the SPA shell with 200;
// - public and link-shared lessons pass through to the page renderer;
// - a failed database lookup returns 503 + Retry-After (so crawlers retry
//   instead of indexing an empty page or dropping a real lesson).
//
// Heavy dependencies are mocked; the real route handlers run over HTTP
// against an ephemeral server. A sentinel handler registered after
// registerRoutes stands in for the prerender/SPA handler, so reaching it
// proves the guard called next().
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type { Server } from "http";

const mockStorage = vi.hoisted(() => ({
  getUser: vi.fn(),
  getLesson: vi.fn(),
}));

const mockLessonJobs = vi.hoisted(() => ({
  recordJobStartOrRefund: vi.fn(async () => {}),
  completeJobWithLesson: vi.fn(),
  settleJobError: vi.fn(async () => false),
  getPersistedJob: vi.fn(async () => null),
  startJobRecoveryWithRetry: vi.fn(),
  pruneOldJobs: vi.fn(async () => {}),
}));

vi.mock("./storage", () => ({ storage: mockStorage }));
vi.mock("./lesson-jobs", () => mockLessonJobs);
vi.mock("./auth", () => ({
  setupAuth: vi.fn(),
  hashPassword: vi.fn(),
}));
vi.mock("./db", () => ({
  db: {
    execute: vi.fn(async () => ({ rows: [] })),
    transaction: vi.fn(async (cb: (t: any) => Promise<unknown>) =>
      cb({ execute: vi.fn(async () => ({ rows: [{ id: 1 }] })) })),
  },
  pool: { end: vi.fn() },
}));
vi.mock("./services/openRouter", () => ({
  openRouterService: {},
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
  isFreeTrialActive: () => false,
  getFreeTrialEndDate: () => null,
}));

const PASSED_THROUGH = "PASSED_THROUGH_TO_RENDERER";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const express = (await import("express")).default;
  const { registerRoutes } = await import("./routes");

  const app = express();
  app.use(express.json());
  // Visitors to public lesson pages are not signed in.
  app.use((req: any, _res, next) => {
    req.isAuthenticated = () => false;
    next();
  });

  server = await registerRoutes(app);
  // Stand-in for the prerender / SPA shell handler that runs after the guard.
  app.get("/lessons/:id", (_req, res) => {
    res.status(200).type("html").send(PASSED_THROUGH);
  });

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

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const lesson = (overrides: Record<string, unknown>) => ({
  id: 42,
  title: "Travel Plans",
  isPublic: false,
  isShared: false,
  ...overrides,
});

async function expectRealNotFound(path: string) {
  const res = await fetch(`${baseUrl}${path}`);
  const body = await res.text();
  expect(res.status).toBe(404);
  expect(body).not.toContain(PASSED_THROUGH);
  expect(body).toContain("noindex");
}

describe("GET /lessons/:id returns a real 404 for pages that do not exist", () => {
  it("404s a non-numeric id without touching the database", async () => {
    await expectRealNotFound("/lessons/abc");
    expect(mockStorage.getLesson).not.toHaveBeenCalled();
  });

  it("404s a mixed id like 12abc instead of reading it as lesson 12", async () => {
    await expectRealNotFound("/lessons/12abc");
    expect(mockStorage.getLesson).not.toHaveBeenCalled();
  });

  it("404s an id beyond the safe integer range", async () => {
    await expectRealNotFound(`/lessons/${"9".repeat(30)}`);
    expect(mockStorage.getLesson).not.toHaveBeenCalled();
  });

  it("404s a lesson id that does not exist", async () => {
    mockStorage.getLesson.mockResolvedValue(undefined);
    await expectRealNotFound("/lessons/99999999");
    expect(mockStorage.getLesson).toHaveBeenCalledWith(99999999);
  });

  it("404s a private lesson that is neither public nor shared", async () => {
    mockStorage.getLesson.mockResolvedValue(lesson({ isPublic: false, isShared: false }));
    await expectRealNotFound("/lessons/42");
  });
});

describe("GET /lessons/:id lets viewable lessons through", () => {
  it("passes a public lesson through to the page renderer", async () => {
    mockStorage.getLesson.mockResolvedValue(lesson({ isPublic: true }));
    const res = await fetch(`${baseUrl}/lessons/42`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(PASSED_THROUGH);
    expect(mockStorage.getLesson).toHaveBeenCalledWith(42);
  });

  it("passes a lesson shared by link (not public) through to the page renderer", async () => {
    mockStorage.getLesson.mockResolvedValue(lesson({ isShared: true }));
    const res = await fetch(`${baseUrl}/lessons/42`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(PASSED_THROUGH);
  });
});

describe("GET /lessons/:id when the database fails", () => {
  it("returns 503 with Retry-After instead of a 200 shell or a 404", async () => {
    mockStorage.getLesson.mockRejectedValue(new Error("db down"));
    const res = await fetch(`${baseUrl}/lessons/42`);
    const body = await res.text();
    expect(res.status).toBe(503);
    expect(res.headers.get("retry-after")).toBe("120");
    expect(body).not.toContain(PASSED_THROUGH);
    expect(body).toContain("noindex");
  });
});
