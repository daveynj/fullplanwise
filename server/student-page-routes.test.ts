// @vitest-environment node
//
// The student's own page and the teacher's controls for it:
//  - only the student's teacher can create, switch off or replace the link,
//    mark lessons done, or attach lessons;
//  - the page answers only to a live page code, and never sends the
//    teacher's notes about the student, their email or a lesson request;
//  - a planned lesson shows only its reading and new words; a finished one
//    comes whole, without anything written for the teacher;
//  - lesson pictures load through the page code;
//  - students suggest topics, and students of Unlimited teachers make lessons
//    at their level, never with the teacher's notes, within the waiting limits.
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
  canMakeLessons: true,
  nextLessonId: null as number | null,
};

/** The teacher's plan in each test: "free" unless a test says otherwise. */
let teacherTier = "free";

const lessonMeta = (id: number, title: string, teacherId = OWNER_ID) => ({
  id, teacherId, title, topic: "Lesson request about Shingo", notes: "Private lesson note", cefrLevel: "B2", isPublic: false,
});

const ASSIGNMENTS = [
  { id: 77, studentId: 5, lessonId: 42, teacherId: OWNER_ID, assignedAt: new Date("2026-10-29T00:00:00Z"), status: "assigned", completedAt: null, notes: null, madeByStudent: false, lesson: lessonMeta(42, "Job Interviews") },
  { id: 78, studentId: 5, lessonId: 43, teacherId: OWNER_ID, assignedAt: new Date("2026-10-20T00:00:00Z"), status: "completed", completedAt: new Date("2026-10-21T00:00:00Z"), notes: null, madeByStudent: false, lesson: lessonMeta(43, "Working from Home") },
  { id: 79, studentId: 5, lessonId: 99, teacherId: OWNER_ID, assignedAt: new Date("2026-10-01T00:00:00Z"), status: "completed", completedAt: new Date("2026-10-02T00:00:00Z"), notes: null, madeByStudent: false, lesson: lessonMeta(99, "Someone else's lesson", OTHER_ID) },
  { id: 80, studentId: 5, lessonId: 44, teacherId: OWNER_ID, assignedAt: new Date("2026-10-30T00:00:00Z"), status: "assigned", completedAt: null, notes: null, madeByStudent: true, lesson: lessonMeta(44, "Talking About Hobbies") },
];
const JOB_ID = "sjob_0b7c6a52-7d8e-4b1f-9a3c-5e2d1f0a9b8c";
const IDEA = { id: 9, studentId: 5, teacherId: OWNER_ID, topic: "Films I like", status: "waiting", lessonId: null, createdAt: new Date("2026-10-25T00:00:00Z"), resolvedAt: null };

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
  getUser: vi.fn(async (id: number) => ({
    id, fullName: "Dave Jackson", username: "davej", email: "dave@example.com", isAdmin: false, subscriptionTier: teacherTier, preferredAiModel: null,
  })),
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
  getStudentMakingJob: vi.fn(async () => undefined as { id: string; topic: string } | undefined),
  getWaitingIdeas: vi.fn(async () => [IDEA]),
  countStudentLessonsToday: vi.fn(async () => 0),
  addStudentIdea: vi.fn(async (_student: unknown, topic: string) => ({ ...IDEA, id: 10, topic, createdAt: new Date("2026-10-30T00:00:00Z") }) as typeof IDEA | null),
  removeStudentIdea: vi.fn(async (_studentId: number, ideaId: number) => ideaId === 9),
  setStudentIdeaDismissed: vi.fn(async () => ({ ...IDEA, status: "dismissed" })),
  getIdeaLessonIds: vi.fn(async () => [42]),
  setStudentNextLesson: vi.fn(async (_studentId: number, lessonId: number) => lessonId === 42 || lessonId === 44),
  removeStudentMadeLesson: vi.fn(async (_student: unknown, lessonId: number) => (lessonId === 44 ? { lessonDeleted: true } : null)),
  reserveStudentLessonJob: vi.fn(async (): Promise<any> => ({ status: "reserved" })),
  completeStudentLessonJob: vi.fn(async (_jobId: string, _student: unknown, lesson: any) => ({ ...lesson, id: 45 })),
  failStudentLessonJob: vi.fn(async () => {}),
  getStudentLessonJob: vi.fn(async (): Promise<any> => undefined),
  getStudentRequestCounts: vi.fn(async () => ({ 5: { ideas: 1, madeLessons: 1 } })),
  getStudentMadeLessons: vi.fn(async () => [{ lessonId: 44, studentId: 5 }]),
  getPlannedLessonWords: vi.fn(async () => ["interview"]),
  updateLesson: vi.fn(async () => ({})),
};
const generateLesson = vi.fn(async (params: any) => ({ title: `Lesson: ${params.topic}`, sections: [] }));
const generateImagesForLesson = vi.fn(async () => {});
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
  openRouterService: { generateLesson, generateImagesForLesson },
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
  teacherTier = "free";
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
    expect(home.comingUp.map((l: any) => [l.title, l.madeByYou])).toEqual([["Job Interviews", false], ["Talking About Hobbies", true]]);
    expect(home.finished.map((l: any) => l.title)).toEqual(["Working from Home"]);
    expect(home.stats).toEqual({ lessonsDone: 1, words: 1, expressions: 0 });
    expect(home).toMatchObject({ nextLessonId: null, canMakeLessons: false, making: null });
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

describe("ideas and lessons the student makes", () => {
  it("lets every student send a topic idea, tidied, within the waiting limit", async () => {
    const res = await send("POST", `/api/student-page/${TOKEN}/ideas`, { topic: "  Talking about\nmy hobbies " });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 10, topic: "Talking about my hobbies", sentAt: "2026-10-30T00:00:00.000Z" });
    expect(mockStorage.addStudentIdea).toHaveBeenCalledWith(expect.objectContaining({ id: 5, teacherId: OWNER_ID }), "Talking about my hobbies");

    expect((await send("POST", `/api/student-page/${TOKEN}/ideas`, { topic: "  " })).status).toBe(400);
    expect((await send("POST", `/api/student-page/${TOKEN}/ideas`, { topic: "x".repeat(121) })).status).toBe(400);

    mockStorage.addStudentIdea.mockResolvedValueOnce(null);
    const full = await send("POST", `/api/student-page/${TOKEN}/ideas`, { topic: "Travel plans" });
    expect(full.status).toBe(409);
    expect((await full.json()).message).toBe("You have 3 ideas waiting. Remove one to send another.");
  });

  it("removes only the student's own waiting ideas", async () => {
    expect((await send("DELETE", `/api/student-page/${TOKEN}/ideas/9`)).status).toBe(200);
    expect(mockStorage.removeStudentIdea).toHaveBeenCalledWith(5, 9);
    expect((await send("DELETE", `/api/student-page/${TOKEN}/ideas/12`)).status).toBe(404);
  });

  it("won't let students of free teachers make lessons", async () => {
    const res = await send("POST", `/api/student-page/${TOKEN}/lessons`, { topic: "Travel plans" });
    expect(res.status).toBe(403);
    expect(mockStorage.reserveStudentLessonJob).not.toHaveBeenCalled();
    expect(generateLesson).not.toHaveBeenCalled();
  });

  it("makes a lesson for a student of an Unlimited teacher at their level, never with the teacher's notes", async () => {
    teacherTier = "unlimited";
    const res = await send("POST", `/api/student-page/${TOKEN}/lessons`, { topic: "Talking about my hobbies" });
    expect(res.status).toBe(202);
    const { jobId } = await res.json();
    expect(jobId).toMatch(/^sjob_[0-9a-f-]{36}$/);
    expect(mockStorage.reserveStudentLessonJob).toHaveBeenCalledWith(jobId, expect.objectContaining({ id: 5 }), "Talking about my hobbies");

    await vi.waitFor(() => expect(mockStorage.completeStudentLessonJob).toHaveBeenCalled());
    const [params, avoid] = generateLesson.mock.calls[0] as unknown as [any, string[]];
    expect(params).toMatchObject({ cefrLevel: "B2", topic: "Talking about my hobbies", studentId: 5, focus: "general", lessonLength: 60 });
    expect(params.components).toContain("expressions");
    expect(avoid).toEqual(["commute", "interview"]);
    expectNothingPrivate(JSON.stringify(generateLesson.mock.calls));

    const [savedJob, savedFor, lesson] = mockStorage.completeStudentLessonJob.mock.calls[0];
    expect(savedJob).toBe(jobId);
    expect(savedFor).toMatchObject({ id: 5, teacherId: OWNER_ID });
    expect(lesson).toMatchObject({ teacherId: OWNER_ID, studentId: 5, title: "Lesson: Talking about my hobbies", cefrLevel: "B2" });
    await vi.waitFor(() => expect(generateImagesForLesson).toHaveBeenCalledWith(expect.anything(), 45));
  });

  it("says when a lesson is already being made, or a limit is reached", async () => {
    teacherTier = "unlimited";
    mockStorage.reserveStudentLessonJob.mockResolvedValueOnce({ status: "making", jobId: JOB_ID });
    const making = await send("POST", `/api/student-page/${TOKEN}/lessons`, { topic: "Travel plans" });
    expect(making.status).toBe(409);
    expect((await making.json()).jobId).toBe(JOB_ID);

    mockStorage.reserveStudentLessonJob.mockResolvedValueOnce({ status: "full" });
    const full = await send("POST", `/api/student-page/${TOKEN}/lessons`, { topic: "Travel plans" });
    expect(full.status).toBe(409);
    expect((await full.json()).message).toBe("You have 3 lessons waiting. Remove one to make another.");

    mockStorage.reserveStudentLessonJob.mockResolvedValueOnce({ status: "daily_limit" });
    expect((await send("POST", `/api/student-page/${TOKEN}/lessons`, { topic: "Travel plans" })).status).toBe(429);
    expect(generateLesson).not.toHaveBeenCalled();
  });

  it("lets admin accounts' students make lessons too", async () => {
    mockStorage.getUser.mockResolvedValueOnce({ id: OWNER_ID, fullName: "Dave Jackson", isAdmin: true, subscriptionTier: "free", preferredAiModel: null } as any);
    expect((await send("POST", `/api/student-page/${TOKEN}/lessons`, { topic: "Travel plans" })).status).toBe(202);
  });

  it("won't let a student make lessons when their teacher has switched it off", async () => {
    teacherTier = "unlimited";
    mockStorage.getStudentByPageToken.mockResolvedValueOnce({ ...STUDENT, canMakeLessons: false });
    expect((await send("POST", `/api/student-page/${TOKEN}/lessons`, { topic: "Travel plans" })).status).toBe(403);
  });

  it("follows a lesson being made until it is ready", async () => {
    expect((await send("GET", `/api/student-page/${TOKEN}/making/job_123`)).status).toBe(404);
    expect(mockStorage.getStudentLessonJob).not.toHaveBeenCalled();

    mockStorage.getStudentLessonJob.mockResolvedValueOnce({ id: JOB_ID, topic: "Hobbies", status: "pending", lessonId: null, error: null, abandoned: false });
    expect(await (await send("GET", `/api/student-page/${TOKEN}/making/${JOB_ID}`)).json()).toEqual({ status: "pending", topic: "Hobbies" });
    expect(mockStorage.getStudentLessonJob).toHaveBeenCalledWith(JOB_ID, 5);

    mockStorage.getStudentLessonJob.mockResolvedValueOnce({ id: JOB_ID, topic: "Hobbies", status: "complete", lessonId: 44, error: null, abandoned: false });
    expect(await (await send("GET", `/api/student-page/${TOKEN}/making/${JOB_ID}`)).json()).toEqual({
      status: "complete", lesson: { id: 44, title: "Talking About Hobbies", cefrLevel: "B2" },
    });

    mockStorage.getStudentLessonJob.mockResolvedValueOnce({ id: JOB_ID, topic: "Hobbies", status: "pending", lessonId: null, error: null, abandoned: true });
    const stuck = await (await send("GET", `/api/student-page/${TOKEN}/making/${JOB_ID}`)).json();
    expect(stuck).toEqual({ status: "error", message: "Sorry, we couldn't make your lesson. Please try again." });
  });

  it("shows the next-lesson page with the student's ideas and the lessons they made, nothing private", async () => {
    mockStorage.countStudentLessonsToday.mockResolvedValueOnce(10);
    const res = await send("GET", `/api/student-page/${TOKEN}/next`);
    const text = await res.text();
    expectNothingPrivate(text);
    expect(JSON.parse(text)).toEqual({
      student: { name: "Shingo", cefrLevel: "B2" },
      teacherName: "Dave",
      canMakeLessons: false,
      ideas: [{ id: 9, topic: "Films I like", sentAt: "2026-10-25T00:00:00.000Z" }],
      madeLessons: [{ id: 44, title: "Talking About Hobbies", date: "2026-10-30T00:00:00.000Z" }],
      making: null,
      dailyLimitReached: true,
    });
  });

  it("removes only lessons the student made and hasn't done", async () => {
    expect((await send("DELETE", `/api/student-page/${TOKEN}/lessons/44`)).status).toBe(200);
    expect(mockStorage.removeStudentMadeLesson).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }), 44);
    expect((await send("DELETE", `/api/student-page/${TOKEN}/lessons/42`)).status).toBe(404);
  });

  it("stars the coming-up lesson the student wants next", async () => {
    expect((await send("PUT", `/api/student-page/${TOKEN}/next-lesson`, { lessonId: 42 })).status).toBe(200);
    expect(mockStorage.setStudentNextLesson).toHaveBeenCalledWith(5, 42);
    expect((await send("PUT", `/api/student-page/${TOKEN}/next-lesson`, { lessonId: "42" })).status).toBe(400);
    expect((await send("PUT", `/api/student-page/${TOKEN}/next-lesson`, { lessonId: 43 })).status).toBe(404);
  });

  it("marks the lessons a student made or asked for, and their star, on the teacher's page", async () => {
    currentUserId = OWNER_ID;
    mockStorage.getStudent.mockResolvedValueOnce({ ...STUDENT, nextLessonId: 44 });
    const lessons = await (await send("GET", "/api/students/5/lessons")).json();
    expect(lessons.map((l: any) => [l.lessonId, l.madeByStudent, l.fromIdea, l.isNext])).toEqual([
      [42, false, true, false], [43, false, false, false], [99, false, false, false], [44, true, false, true],
    ]);
  });

  it("shows the student's ideas to their teacher only, who can dismiss one", async () => {
    currentUserId = OWNER_ID;
    expect(await (await send("GET", "/api/students/5/ideas")).json()).toEqual([{ id: 9, topic: "Films I like", sentAt: "2026-10-25T00:00:00.000Z" }]);
    expect((await send("PUT", "/api/students/5/ideas/9", { dismissed: true })).status).toBe(200);
    expect(mockStorage.setStudentIdeaDismissed).toHaveBeenCalledWith(OWNER_ID, 5, 9, true);
    expect((await send("PUT", "/api/students/5/ideas/9", { dismissed: "yes" })).status).toBe(400);
    expect(await (await send("GET", "/api/student-requests")).json()).toEqual({ 5: { ideas: 1, madeLessons: 1 } });

    currentUserId = OTHER_ID;
    expect((await send("GET", "/api/students/5/ideas")).status).toBe(404);
    expect((await send("PUT", "/api/students/5/ideas/9", { dismissed: true })).status).toBe(404);
    expect(mockStorage.setStudentIdeaDismissed).toHaveBeenCalledTimes(1);
  });

  it("lets only the student's teacher switch lesson making on or off", async () => {
    currentUserId = OWNER_ID;
    expect((await send("PUT", "/api/students/5/page/lesson-making", { allowed: false })).status).toBe(200);
    expect(mockStorage.updateStudent).toHaveBeenCalledWith(5, { canMakeLessons: false });
    expect((await send("PUT", "/api/students/5/page/lesson-making", { allowed: "no" })).status).toBe(400);
    currentUserId = OTHER_ID;
    expect((await send("PUT", "/api/students/5/page/lesson-making", { allowed: true })).status).toBe(404);
    expect(mockStorage.updateStudent).toHaveBeenCalledTimes(1);
  });
});
