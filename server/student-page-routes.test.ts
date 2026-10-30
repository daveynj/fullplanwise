// @vitest-environment node
//
// The student's own page and the teacher's controls for it:
//  - only the student's teacher can create, switch off or replace the link,
//    mark lessons done, or attach lessons;
//  - the page answers only to a live page code, and never sends the
//    teacher's notes about the student, their email or a lesson request;
//  - a planned lesson shows only its reading and new words; a finished one
//    comes whole, without anything written for the teacher;
//  - lesson pictures load through the page code.
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type { Server } from "http";

const OWNER_ID = 4100;
const OTHER_ID = 4200;
const TOKEN = "k7Qm2xV9pLr4Tz8eR2t8Wq5n";
const PRIVATE = ["shingo@example.com", "Shingo works at the bank and is shy", "Lesson request about Shingo", "Private lesson note"];

const STUDENT = {
  id: 5,
  teacherId: OWNER_ID,
  name: "Shingo",
  cefrLevel: "B2",
  email: "shingo@example.com",
  notes: "Shingo works at the bank and is shy",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  pageToken: TOKEN,
  pageEnabled: true,
};

const lessonMeta = (id: number, title: string, teacherId = OWNER_ID) => ({
  id, teacherId, title, topic: "Lesson request about Shingo", notes: "Private lesson note", cefrLevel: "B2", isPublic: false,
});

const ASSIGNMENTS = [
  { id: 77, studentId: 5, lessonId: 42, teacherId: OWNER_ID, assignedAt: new Date("2026-10-29T00:00:00Z"), status: "assigned", completedAt: null, notes: null, lesson: lessonMeta(42, "Job Interviews") },
  { id: 78, studentId: 5, lessonId: 43, teacherId: OWNER_ID, assignedAt: new Date("2026-10-20T00:00:00Z"), status: "completed", completedAt: new Date("2026-10-21T00:00:00Z"), notes: null, lesson: lessonMeta(43, "Working from Home") },
  { id: 79, studentId: 5, lessonId: 99, teacherId: OWNER_ID, assignedAt: new Date("2026-10-01T00:00:00Z"), status: "completed", completedAt: new Date("2026-10-02T00:00:00Z"), notes: null, lesson: lessonMeta(99, "Someone else's lesson", OTHER_ID) },
];

const CONTENT = {
  title: "Job Interviews",
  level: "B2",
  sections: [
    { type: "warmup", questions: ["What job would you like?"], procedure: "Ask about the bank job", teacherNotes: "Go slowly" },
    { type: "reading", paragraphs: ["Most people feel nervous."], teacherNotes: "Read aloud" },
    { type: "vocabulary", words: [{ term: "strength", definition: "a good quality", imageUrl: "/api/images/lesson-images/42/abc.png", teachingTips: "Mime it" }] },
    { type: "quiz", questions: [{ question: "What is a strength?", answer: "a good quality" }] },
    { type: "notes", content: "Private teacher notes" },
  ],
};

const mockStorage = {
  getUser: vi.fn(async (id: number) => ({ id, fullName: "Dave Jackson", username: "davej", email: "dave@example.com", isAdmin: false })),
  getStudent: vi.fn(async (id: number) => (id === STUDENT.id ? { ...STUDENT } : undefined)),
  updateStudent: vi.fn(async (id: number, data: any) => ({ ...STUDENT, id, ...data })),
  getStudentByPageToken: vi.fn(async (token: string) => (token === TOKEN ? { ...STUDENT } : undefined)),
  getStudentLessons: vi.fn(async () => ASSIGNMENTS),
  getStudentVocabulary: vi.fn(async () => [
    { id: 3, studentId: 5, lessonId: 43, word: "commute", definition: "the journey to work", kind: "word", learnedAt: new Date("2026-10-21T00:00:00Z"), originLessonTitle: null, practiceLevel: 0, nextPracticeAt: null, lastPractisedAt: null },
  ]),
  checkLessonAssignment: vi.fn(async (_studentId: number, lessonId: number) => ASSIGNMENTS.find((a) => a.lessonId === lessonId)),
  getLesson: vi.fn(async (id: number) => ({ ...ASSIGNMENTS.find((a) => a.lessonId === id)!.lesson, grammarSpotlight: null, content: CONTENT })),
  getLessonAccess: vi.fn(async (id: number) => {
    const lesson = ASSIGNMENTS.find((a) => a.lessonId === id)?.lesson;
    return lesson ? { teacherId: lesson.teacherId, isPublic: lesson.isPublic } : undefined;
  }),
  getStudentLessonAssignment: vi.fn(async (id: number) => ASSIGNMENTS.find((a) => a.id === id)),
  markStudentLessonDone: vi.fn(async (id: number) => ({ assignment: { id, status: "completed" }, wordsAdded: 6 })),
  markStudentLessonPlanned: vi.fn(async (id: number) => ({ id, status: "assigned" })),
  assignLessonToStudent: vi.fn(),
  recordStudentPractice: vi.fn(async (_studentId: number, wordId: number) => (wordId === 3 ? { id: 3 } : undefined)),
  getStudentPracticeStats: vi.fn(async () => ({ lastPractisedAt: null, cardsThisWeek: 0, daysPractisedThisWeek: 0, stillLearning: [] })),
};
const downloadStoredImage = vi.fn(async () => ({ buffer: Buffer.from("png-bytes"), mime: "image/png" }));
const lessonHasImage = vi.fn(async () => false);

vi.mock("./storage", () => ({ storage: mockStorage }));
vi.mock("./student-page-schema", () => ({ ensureStudentPageSchema: vi.fn(async () => {}) }));
vi.mock("./lesson-word-details", () => ({
  lessonWordDetails: vi.fn(async () => [{ term: "commute", example: "My commute is long.", partOfSpeech: "noun", imageUrl: "/api/images/lesson-images/43/c.png" }]),
  lessonHasImage,
}));
vi.mock("./services/image-storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./services/image-storage")>()),
  downloadStoredImage,
}));
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
    req.user = currentUserId === null ? undefined : { id: currentUserId, isAdmin: false };
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
  currentUserId = null;
});

const send = (method: string, path: string, body?: unknown) =>
  fetch(`${baseUrl}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const expectNothingPrivate = (text: string) => {
  for (const secret of PRIVATE) expect(text).not.toContain(secret);
};

describe("the teacher's controls", () => {
  it("creates a page link with a long random code, only for the student's own teacher", async () => {
    currentUserId = OWNER_ID;
    const res = await send("POST", "/api/students/5/page");
    expect(res.status).toBe(200);
    const update = mockStorage.updateStudent.mock.calls[0][1];
    expect(update.pageEnabled).toBe(true);
    expect(update.pageToken).toMatch(/^[A-Za-z0-9_-]{24}$/);

    currentUserId = OTHER_ID;
    expect((await send("POST", "/api/students/5/page")).status).toBe(404);
    expect((await send("PUT", "/api/students/5/page", { enabled: false })).status).toBe(404);
    expect(mockStorage.updateStudent).toHaveBeenCalledTimes(1);
  });

  it("switches the page off and on", async () => {
    currentUserId = OWNER_ID;
    expect((await send("PUT", "/api/students/5/page", { enabled: false })).status).toBe(200);
    expect(mockStorage.updateStudent).toHaveBeenCalledWith(5, { pageEnabled: false });
    expect((await send("PUT", "/api/students/5/page", { enabled: "no" })).status).toBe(400);
  });

  it("never lets a profile edit set the page code or the owner", async () => {
    currentUserId = OWNER_ID;
    const res = await send("PUT", "/api/students/5", { name: "Shingo K", pageToken: "short", pageEnabled: true, teacherId: OTHER_ID });
    expect(res.status).toBe(200);
    expect(mockStorage.updateStudent).toHaveBeenCalledWith(5, { name: "Shingo K" });
  });

  it("marks a lesson done (adding its words) or planned again, only for the lesson's teacher", async () => {
    currentUserId = OWNER_ID;
    const done = await send("PUT", "/api/students/lessons/77/status", { status: "completed" });
    expect(done.status).toBe(200);
    expect(await done.json()).toMatchObject({ wordsAdded: 6 });
    expect(mockStorage.markStudentLessonDone).toHaveBeenCalledWith(77);

    expect((await send("PUT", "/api/students/lessons/78/status", { status: "assigned" })).status).toBe(200);
    expect(mockStorage.markStudentLessonPlanned).toHaveBeenCalledWith(78);
    expect((await send("PUT", "/api/students/lessons/77/status", { status: "in-progress" })).status).toBe(400);

    currentUserId = OTHER_ID;
    expect((await send("PUT", "/api/students/lessons/77/status", { status: "completed" })).status).toBe(404);
    expect(mockStorage.markStudentLessonDone).toHaveBeenCalledTimes(1);
  });

  it("won't attach another teacher's lesson to a student", async () => {
    currentUserId = OWNER_ID;
    const res = await send("POST", "/api/students/5/lessons", { lessonId: 99 });
    expect(res.status).toBe(403);
    expect(mockStorage.assignLessonToStudent).not.toHaveBeenCalled();
  });
});

describe("the student's page", () => {
  it("answers only to a live page code", async () => {
    expect((await send("GET", "/api/student-page/short")).status).toBe(404);
    expect((await send("GET", "/api/student-page/xxxxxxxxxxxxxxxxxxxxxxxx")).status).toBe(404);
    expect(mockStorage.getStudentByPageToken).toHaveBeenCalledTimes(1);
  });

  it("shows the student's lessons and words without anything private", async () => {
    const res = await send("GET", `/api/student-page/${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    const text = await res.text();
    expectNothingPrivate(text);
    expect(text).not.toContain("Someone else's lesson");
    const home = JSON.parse(text);
    expect(home.student).toEqual({ name: "Shingo", cefrLevel: "B2" });
    expect(home.teacherName).toBe("Dave");
    expect(home.comingUp.map((l: any) => l.title)).toEqual(["Job Interviews"]);
    expect(home.finished.map((l: any) => l.title)).toEqual(["Working from Home"]);
    expect(home.stats).toEqual({ lessonsDone: 1, words: 1, expressions: 0 });
  });

  it("shows a planned lesson's reading and new words only, with pictures through the page", async () => {
    const res = await send("GET", `/api/student-page/${TOKEN}/lessons/42`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expectNothingPrivate(text);
    for (const hidden of ["Go slowly", "Read aloud", "Mime it", "What is a strength?", "Private teacher notes", "bank job"]) {
      expect(text).not.toContain(hidden);
    }
    const lesson = JSON.parse(text);
    expect(lesson.status).toBe("planned");
    expect(lesson.content.sections.map((s: any) => s.type)).toEqual(["reading", "vocabulary"]);
    expect(lesson.lockedActivities).toEqual(["Warm-up", "Quiz"]);
    expect(lesson.content.sections[1].words[0].imageUrl).toBe(`/api/student-page/${TOKEN}/lessons/42/images/lesson-images/42/abc.png`);
  });

  it("shows a finished lesson whole, without the teacher's parts", async () => {
    const lesson = await (await send("GET", `/api/student-page/${TOKEN}/lessons/43`)).json();
    expect(lesson.status).toBe("done");
    expect(lesson.date).toBe("2026-10-21T00:00:00.000Z");
    expect(lesson.content.sections.map((s: any) => s.type)).toEqual(["warmup", "reading", "vocabulary", "quiz"]);
    expect(JSON.stringify(lesson)).not.toContain("teacherNotes");
  });

  it("won't show a lesson that isn't the student's, or another teacher's private lesson", async () => {
    expect((await send("GET", `/api/student-page/${TOKEN}/lessons/500`)).status).toBe(404);
    expect((await send("GET", `/api/student-page/${TOKEN}/lessons/99`)).status).toBe(404);
  });

  it("builds flashcards from the student's words, with examples and pictures from their lessons", async () => {
    const deck = await (await send("GET", `/api/student-page/${TOKEN}/flashcards`)).json();
    expect(deck.due).toBe(1);
    expect(deck.cards).toEqual([{
      id: 3,
      word: "commute",
      meaning: "the journey to work",
      kind: "word",
      example: "My commute is long.",
      partOfSpeech: "noun",
      lessonTitle: "Working from Home",
      imageUrl: `/api/student-page/${TOKEN}/lessons/43/images/lesson-images/43/c.png`,
    }]);
  });

  it("saves flashcard answers for the student's own words only", async () => {
    expect((await send("POST", `/api/student-page/${TOKEN}/flashcards/3`, { result: "maybe" })).status).toBe(400);
    expect((await send("POST", `/api/student-page/${TOKEN}/flashcards/3`, { result: "got" })).status).toBe(200);
    expect(mockStorage.recordStudentPractice).toHaveBeenCalledWith(5, 3, "got");
    expect((await send("POST", `/api/student-page/${TOKEN}/flashcards/4`, { result: "again" })).status).toBe(404);
  });

  it("serves the pictures of the student's lessons, and nothing else", async () => {
    const ok = await send("GET", `/api/student-page/${TOKEN}/lessons/42/images/lesson-images/42/abc.png`);
    expect(ok.status).toBe(200);
    expect(await ok.text()).toBe("png-bytes");
    expect(downloadStoredImage).toHaveBeenCalledWith("lesson-images/42/abc.png");

    // Stored under another lesson and not used by this one.
    expect((await send("GET", `/api/student-page/${TOKEN}/lessons/42/images/lesson-images/7/other.png`)).status).toBe(404);
    expect(lessonHasImage).toHaveBeenCalledWith(42, "/api/images/lesson-images/7/other.png");
    // Another teacher's lesson, and a wrong code.
    expect((await send("GET", `/api/student-page/${TOKEN}/lessons/99/images/lesson-images/99/a.png`)).status).toBe(404);
    expect((await send("GET", `/api/student-page/xxxxxxxxxxxxxxxxxxxxxxxx/lessons/42/images/lesson-images/42/abc.png`)).status).toBe(404);
    expect(downloadStoredImage).toHaveBeenCalledTimes(1);
  });

  it("keeps the page itself out of search engines", async () => {
    const res = await send("GET", `/s/${TOKEN}`);
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
  });
});
