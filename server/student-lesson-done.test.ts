// @vitest-environment node
//
// A lesson assigned to a student is planned; its words join the student's
// list only when the teacher marks it done ("We did this"), and leave it
// again if that is undone (shared/student-page.ts).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { calls, db, query } = vi.hoisted(() => {
  const calls: string[] = [];
  /** A stand-in for a drizzle query: every builder call returns itself; awaiting it gives `result`. */
  const query = (result: unknown, name: string) => {
    const builder: any = {};
    for (const step of ["values", "set", "where", "returning", "from", "limit", "orderBy"]) {
      builder[step] = vi.fn((...args: unknown[]) => {
        calls.push(`${name}.${step}${step === "set" || step === "values" ? ` ${JSON.stringify(args[0])}` : ""}`);
        return builder;
      });
    }
    builder.then = (resolve: (value: unknown) => void) => resolve(result);
    return builder;
  };
  const db: Record<string, ReturnType<typeof vi.fn>> = {
    insert: vi.fn(() => query([{ id: 77, status: "assigned" }], "insert")),
    update: vi.fn(() => query([{ id: 77, status: "updated" }], "update")),
    delete: vi.fn(() => query(undefined, "delete")),
    select: vi.fn(() => query([], "select")),
  };
  return { calls, db, query };
});

vi.mock("./db", () => ({ db, pool: { end: vi.fn() } }));
vi.mock("./session-store", () => ({ createSessionStore: vi.fn(() => ({})) }));
vi.mock("./lesson-word-details", () => ({
  lessonWordDetails: vi.fn(async (lessonId: number) => (lessonId === 42 ? [{ term: "strength " }, { term: "follow up" }] : [])),
}));

import { storage } from "./storage";

const PLANNED = { id: 77, studentId: 5, lessonId: 42, teacherId: 1, status: "assigned", completedAt: null };
const DONE = { ...PLANNED, status: "completed", completedAt: new Date() };

beforeEach(() => {
  calls.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("planning and finishing a student's lesson", () => {
  it("plans a lesson without adding its words", async () => {
    const extract = vi.spyOn(storage, "extractAndSaveVocabulary");
    await storage.assignLessonToStudent(5, 42, 1);
    expect(calls).toContain('insert.values {"studentId":5,"lessonId":42,"teacherId":1,"notes":null,"status":"assigned"}');
    expect(extract).not.toHaveBeenCalled();
  });

  it("adds the words first, then marks the lesson done", async () => {
    vi.spyOn(storage, "getStudentLessonAssignment").mockResolvedValue(PLANNED as any);
    const extract = vi.spyOn(storage, "extractAndSaveVocabulary").mockImplementation(async () => {
      calls.push("extract");
      return 6;
    });

    const { wordsAdded } = await storage.markStudentLessonDone(77);

    expect(wordsAdded).toBe(6);
    expect(extract).toHaveBeenCalledWith(5, 42);
    expect(calls[0]).toBe("extract");
    expect(calls[1]).toMatch(/^update\.set \{"status":"completed","completedAt":"/);
  });

  it("leaves a lesson that is already done as it is", async () => {
    vi.spyOn(storage, "getStudentLessonAssignment").mockResolvedValue(DONE as any);
    const extract = vi.spyOn(storage, "extractAndSaveVocabulary");
    expect(await storage.markStudentLessonDone(77)).toEqual({ assignment: DONE, wordsAdded: 0 });
    expect(extract).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("undoes \"We did this\": the lesson's words leave the list and it is planned again", async () => {
    vi.spyOn(storage, "getStudentLessonAssignment").mockResolvedValue(DONE as any);
    await storage.markStudentLessonPlanned(77);
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(calls).toContain('update.set {"status":"assigned","completedAt":null}');
  });
});

describe("words new lessons avoid", () => {
  it("includes the words of planned lessons", async () => {
    db.select.mockImplementation(() => query([{ lessonId: 42 }, { lessonId: 43 }], "select"));
    expect(await storage.getPlannedLessonWords(5)).toEqual(["strength", "follow up"]);
  });
});
