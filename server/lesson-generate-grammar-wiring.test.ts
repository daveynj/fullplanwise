// @vitest-environment node
//
// Integration-style test for the lesson-generation background job wiring in
// server/routes.ts: when resolveGrammarSpotlight drops the grammar section
// (returns null), the lesson must still save cleanly with the grammarSpotlight
// key removed from the content JSON and a null grammarSpotlight column. When
// the spotlight is valid, it must be stored in BOTH the content JSON and the
// grammarSpotlight column.
//
// Heavy dependencies (auth, storage, db, AI services, Stripe, Mailchimp) are
// mocked; the real /api/lessons/generate route handler runs end-to-end over
// HTTP against an ephemeral server.
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

const mockOpenRouterService = {
  generateLesson: vi.fn(),
  regenerateGrammarSpotlight: vi.fn(),
  // Never resolves — keeps the post-save image update from racing our asserts.
  generateImagesForLesson: vi.fn(() => new Promise<void>(() => {})),
};

vi.mock("./storage", () => ({ storage: mockStorage }));

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

vi.mock("./services/mailchimp.service", () => ({
  mailchimpService: {},
}));

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

// ---- fixtures ----

const validSpotlight = {
  grammarType: "present_perfect",
  title: "Present Perfect",
  description: "Talking about experiences",
  examples: [
    {
      sentence: "I have visited Paris.",
      highlighted: "I **have visited** Paris.",
      explanation: "Experience up to now.",
    },
  ],
  logicExplanation: {
    communicationNeed: "Talk about past events relevant now",
    logicalSolution: "have + past participle",
    usagePattern: "Unfinished time periods",
    communicationImpact: "Connects past to present",
  },
};

// Fails validateGrammarSpotlightForStorage: no renderable content.
const malformedSpotlight = { grammarType: 12345, examples: "not-an-array" };

function makeLessonContent(grammarSpotlight: unknown) {
  return {
    title: "Test Lesson",
    warmUp: { questions: ["How are you?"] },
    vocabulary: [{ word: "journey", definition: "a trip" }],
    grammarSpotlight,
  };
}

const generateBody = {
  cefrLevel: "B1",
  topic: "travel",
  components: ["vocabulary"],
  generateImages: false,
};

// ---- server setup ----

let server: Server;
let baseUrl: string;
let teacherIdCounter = 1000;
let teacherId: number;

beforeAll(async () => {
  const express = (await import("express")).default;
  const { registerRoutes } = await import("./routes");

  const app = express();
  app.use(express.json());
  // Fake an authenticated session; a fresh teacher id per request batch keeps
  // the route's per-teacher pending-job guard from tripping across tests.
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

beforeEach(() => {
  teacherId = ++teacherIdCounter;
  vi.clearAllMocks();
  mockStorage.getUser.mockImplementation(async (id: number) => ({
    id,
    isAdmin: true, // skips credit spending — irrelevant to this test
    subscriptionTier: "free",
    trialExpiresAt: null,
  }));
  mockStorage.createLesson.mockImplementation(async (lesson: any) => ({
    id: 42,
    ...lesson,
  }));
  mockOpenRouterService.generateImagesForLesson.mockImplementation(
    () => new Promise<void>(() => {}),
  );
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

async function generateAndWaitForSave(): Promise<any> {
  const res = await fetch(`${baseUrl}/api/lessons/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(generateBody),
  });
  expect(res.status).toBe(200);
  const { jobId } = await res.json();
  expect(jobId).toBeTruthy();

  await vi.waitFor(() => {
    expect(mockStorage.createLesson).toHaveBeenCalledTimes(1);
  });
  return mockStorage.createLesson.mock.calls[0][0];
}

describe("lesson generation grammar-spotlight wiring", () => {
  it("saves the lesson with grammarSpotlight dropped from content and a null column when the spotlight is unusable", async () => {
    mockOpenRouterService.generateLesson.mockResolvedValue(
      makeLessonContent(malformedSpotlight),
    );
    // Retry also produces junk — resolveGrammarSpotlight returns null.
    mockOpenRouterService.regenerateGrammarSpotlight.mockResolvedValue(
      malformedSpotlight,
    );

    const saved = await generateAndWaitForSave();

    // Column must be null
    expect(saved.grammarSpotlight).toBeNull();

    // Content JSON must not contain the grammarSpotlight key at all
    const content = JSON.parse(saved.content);
    expect("grammarSpotlight" in content).toBe(false);
    // ...and the rest of the lesson content survives intact
    expect(content.title).toBe("Test Lesson");
    expect(content.vocabulary).toHaveLength(1);

    // The retry path was actually exercised
    expect(
      mockOpenRouterService.regenerateGrammarSpotlight,
    ).toHaveBeenCalledTimes(1);
  });

  it("stores a valid spotlight in both the content JSON and the grammarSpotlight column", async () => {
    mockOpenRouterService.generateLesson.mockResolvedValue(
      makeLessonContent(validSpotlight),
    );

    const saved = await generateAndWaitForSave();

    // Column holds the validated spotlight as JSON
    expect(saved.grammarSpotlight).toBeTypeOf("string");
    const column = JSON.parse(saved.grammarSpotlight);
    expect(column.title).toBe("Present Perfect");

    // Content JSON keeps the (validated) spotlight
    const content = JSON.parse(saved.content);
    expect(content.grammarSpotlight).toBeTruthy();
    expect(content.grammarSpotlight.title).toBe("Present Perfect");

    // No retry needed for a valid payload
    expect(
      mockOpenRouterService.regenerateGrammarSpotlight,
    ).not.toHaveBeenCalled();
  });
});
