// @vitest-environment node
//
// Public lesson privacy and admin removal:
//  - visitors never receive the teacher's original request (topic), private
//    notes or student link for a public / link-shared lesson,
//  - the owner and admins still see everything,
//  - only admins can remove a lesson from the public library.
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type { Server } from "http";

const OWNER_ID = 4100;
const OTHER_ID = 4200;
const ADMIN_ID = 4300;

const PRIVATE_TOPIC = "This student is very intelligent and works in treasury";

const mockStorage = {
  getUser: vi.fn(async (id: number) => ({ id, isAdmin: id === ADMIN_ID })),
  getLesson: vi.fn(),
  updateLesson: vi.fn(async (id: number, data: any) => ({ id, ...data })),
};

vi.mock("./storage", () => ({ storage: mockStorage }));
vi.mock("./lesson-jobs", () => ({
  recordJobStartOrRefund: vi.fn(),
  completeJobWithLesson: vi.fn(),
  settleJobError: vi.fn(),
  getPersistedJob: vi.fn(),
  startJobRecovery: vi.fn(),
  pruneOldJobs: vi.fn(async () => {}),
}));
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
vi.mock("./indexnow", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./indexnow")>()),
  notifyIndexNow: vi.fn(),
}));

let server: Server;
let baseUrl: string;
let currentUserId: number | null = null;

beforeAll(async () => {
  const express = (await import("express")).default;
  const { registerRoutes } = await import("./routes");
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.isAuthenticated = () => currentUserId !== null;
    req.user = currentUserId === null ? undefined : { id: currentUserId, isAdmin: currentUserId === ADMIN_ID };
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
  mockStorage.getLesson.mockResolvedValue({
    id: 1795,
    teacherId: OWNER_ID,
    studentId: 12,
    title: "A Month in the Life of a Treasurer",
    topic: PRIVATE_TOPIC,
    notes: "Private teacher note",
    cefrLevel: "C1",
    content: { sections: [] },
    category: "general",
    tags: [],
    isPublic: true,
    isShared: false,
    publicCategory: "business-english",
    grammarSpotlight: null,
    createdAt: new Date().toISOString(),
  });
});

async function getLessonAs(userId: number | null) {
  currentUserId = userId;
  const res = await fetch(`${baseUrl}/api/lessons/1795`);
  return { status: res.status, text: await res.text() };
}

describe("public lesson view", () => {
  it("hides the original request, notes and student from a logged-out visitor", async () => {
    const { status, text } = await getLessonAs(null);
    expect(status).toBe(200);
    expect(text).not.toContain("very intelligent");
    expect(text).not.toContain("Private teacher note");
    const body = JSON.parse(text);
    expect(body.topic).toBe("A Month in the Life of a Treasurer");
    expect(body.studentId).toBeNull();
  });

  it("hides them from another logged-in teacher too", async () => {
    const { text } = await getLessonAs(OTHER_ID);
    expect(text).not.toContain("very intelligent");
  });

  it("still shows the owner and admins the full lesson", async () => {
    expect(JSON.parse((await getLessonAs(OWNER_ID)).text).topic).toBe(PRIVATE_TOPIC);
    expect(JSON.parse((await getLessonAs(ADMIN_ID)).text).topic).toBe(PRIVATE_TOPIC);
  });

  it("does not leak the request when another teacher copies the lesson", async () => {
    currentUserId = OTHER_ID;
    const res = await fetch(`${baseUrl}/api/lessons/1795/copy`, { method: "POST" });
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).not.toContain("very intelligent");
  });
});

describe("removing a lesson from the public library", () => {
  async function removeAs(userId: number | null) {
    currentUserId = userId;
    return fetch(`${baseUrl}/api/lessons/1795/public`, { method: "DELETE" });
  }

  it("lets an admin remove it", async () => {
    const res = await removeAs(ADMIN_ID);
    expect(res.status).toBe(200);
    expect(mockStorage.updateLesson).toHaveBeenCalledWith(1795, { isPublic: false, publicCategory: null });
  });

  it("refuses other teachers, including the owner", async () => {
    expect((await removeAs(OTHER_ID)).status).toBe(403);
    expect((await removeAs(OWNER_ID)).status).toBe(403);
    expect(mockStorage.updateLesson).not.toHaveBeenCalled();
  });

  it("refuses logged-out visitors", async () => {
    expect((await removeAs(null)).status).toBe(401);
    expect(mockStorage.updateLesson).not.toHaveBeenCalled();
  });
});
