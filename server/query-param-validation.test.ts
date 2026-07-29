// @vitest-environment node
//
// Guards the numeric query-param validation in server/routes.ts:
// - Unit tests for parseQueryInt / parseIdParam (non-numeric -> default/null,
//   negative/zero -> clamped, huge -> clamped or rejected).
// - API-level tests: GET /api/lessons and GET /api/blog/posts with bad
//   page/pageSize still return 200 with safe defaults reaching storage, and a
//   bad teacherId on /api/lessons returns 400.
//
// Heavy dependencies (auth, storage, db, AI services, Stripe, Mailchimp) are
// mocked; the real route handlers run over HTTP against an ephemeral server.
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type { Server } from "http";

// ---- module mocks (hoisted by vitest) ----

const mockStorage = vi.hoisted(() => ({
  getUser: vi.fn(),
  getLessons: vi.fn(),
  getAllBlogPosts: vi.fn(),
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

import { parseQueryInt, parseIdParam } from "./routes";

// ---- unit tests ----

describe("parseQueryInt", () => {
  it("returns the parsed value when in range", () => {
    expect(parseQueryInt("5", 1, 1, 100)).toBe(5);
  });
  it("returns the fallback for missing/undefined values", () => {
    expect(parseQueryInt(undefined, 7, 1, 100)).toBe(7);
  });
  it("returns the fallback for non-numeric strings", () => {
    expect(parseQueryInt("abc", 3, 1, 100)).toBe(3);
    expect(parseQueryInt("12abc", 3, 1, 100)).toBe(3);
    expect(parseQueryInt("1e5", 3, 1, 100)).toBe(3);
    expect(parseQueryInt("1.5", 3, 1, 100)).toBe(3);
    expect(parseQueryInt("", 3, 1, 100)).toBe(3);
  });
  it("returns the fallback for non-string values (arrays/objects from qs)", () => {
    expect(parseQueryInt(["1", "2"], 4, 1, 100)).toBe(4);
    expect(parseQueryInt({ page: "1" }, 4, 1, 100)).toBe(4);
  });
  it("returns the fallback for negative values (regex rejects '-')", () => {
    expect(parseQueryInt("-5", 2, 1, 100)).toBe(2);
  });
  it("clamps zero up to min", () => {
    expect(parseQueryInt("0", 10, 1, 100)).toBe(1);
  });
  it("clamps huge values down to max", () => {
    expect(parseQueryInt("99999999", 10, 1, 100)).toBe(100);
  });
  it("returns the fallback for values beyond safe-integer range", () => {
    expect(parseQueryInt("9".repeat(30), 10, 1, 100)).toBe(10);
  });
});

describe("parseIdParam", () => {
  it("parses plain non-negative integers", () => {
    expect(parseIdParam("42")).toBe(42);
    expect(parseIdParam("0")).toBe(0);
  });
  it("rejects non-numeric, mixed, scientific, and negative input", () => {
    expect(parseIdParam("abc")).toBeNull();
    expect(parseIdParam("12abc")).toBeNull();
    expect(parseIdParam("1e5")).toBeNull();
    expect(parseIdParam("-1")).toBeNull();
    expect(parseIdParam("1.5")).toBeNull();
    expect(parseIdParam("")).toBeNull();
  });
  it("rejects values beyond Number.MAX_SAFE_INTEGER", () => {
    expect(parseIdParam("9".repeat(30))).toBeNull();
  });
});

// ---- API-level tests ----

let server: Server;
let baseUrl: string;
const USER_ID = 555001;

beforeAll(async () => {
  const express = (await import("express")).default;
  const { registerRoutes } = await import("./routes");

  const app = express();
  app.use(express.json());
  // Fake an authenticated session for routes behind ensureAuthenticated.
  app.use((req: any, _res, next) => {
    req.isAuthenticated = () => true;
    req.user = { id: USER_ID, isAdmin: false };
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

beforeEach(() => {
  vi.clearAllMocks();
  mockStorage.getLessons.mockResolvedValue({ lessons: [], total: 0 });
  mockStorage.getAllBlogPosts.mockResolvedValue({ posts: [], total: 0 });
});

describe("GET /api/lessons query-param handling", () => {
  it("falls back to defaults for non-numeric page/pageSize", async () => {
    const res = await fetch(`${baseUrl}/api/lessons?page=abc&pageSize=zzz`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ lessons: [], total: 0 });
    // storage.getLessons(teacherId, page, pageSize, ...)
    const args = mockStorage.getLessons.mock.calls[0];
    expect(args[0]).toBe(USER_ID);
    expect(args[1]).toBe(1); // default page
    expect(args[2]).toBe(10); // default pageSize
  });

  it("clamps huge pageSize to the max and zero page up to 1", async () => {
    const res = await fetch(`${baseUrl}/api/lessons?page=0&pageSize=99999`);
    expect(res.status).toBe(200);
    const args = mockStorage.getLessons.mock.calls[0];
    expect(args[1]).toBe(1); // page clamped to min
    expect(args[2]).toBe(100); // pageSize clamped to MAX_PAGE_SIZE
  });

  it("rejects a non-numeric teacherId with 400 before touching storage", async () => {
    const res = await fetch(`${baseUrl}/api/lessons?teacherId=abc`);
    expect(res.status).toBe(400);
    expect(mockStorage.getLessons).not.toHaveBeenCalled();
  });

  it("rejects a mixed alphanumeric teacherId with 400", async () => {
    const res = await fetch(`${baseUrl}/api/lessons?teacherId=12abc`);
    expect(res.status).toBe(400);
    expect(mockStorage.getLessons).not.toHaveBeenCalled();
  });

  it("allows a user to pass their own numeric teacherId", async () => {
    const res = await fetch(`${baseUrl}/api/lessons?teacherId=${USER_ID}`);
    expect(res.status).toBe(200);
    expect(mockStorage.getLessons.mock.calls[0][0]).toBe(USER_ID);
  });

  it("forbids a non-admin requesting another teacher's lessons", async () => {
    const res = await fetch(`${baseUrl}/api/lessons?teacherId=${USER_ID + 1}`);
    expect(res.status).toBe(403);
    expect(mockStorage.getLessons).not.toHaveBeenCalled();
  });
});

describe("GET /api/blog/posts query-param handling", () => {
  it("falls back to defaults for non-numeric page/pageSize", async () => {
    const res = await fetch(`${baseUrl}/api/blog/posts?page=abc&pageSize=-3`);
    expect(res.status).toBe(200);
    // storage.getAllBlogPosts(page, pageSize, category, featured, publishedOnly)
    const args = mockStorage.getAllBlogPosts.mock.calls[0];
    expect(args[0]).toBe(1); // default page
    expect(args[1]).toBe(20); // default pageSize
  });

  it("clamps huge pageSize to the max", async () => {
    const res = await fetch(`${baseUrl}/api/blog/posts?page=2&pageSize=100000`);
    expect(res.status).toBe(200);
    const args = mockStorage.getAllBlogPosts.mock.calls[0];
    expect(args[0]).toBe(2);
    expect(args[1]).toBe(100); // clamped to MAX_PAGE_SIZE
  });
});
