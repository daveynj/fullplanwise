// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lessons, studentLessons, studentVocabulary } from "@shared/schema";
import { PgDialect } from "drizzle-orm/pg-core";

const mocks = vi.hoisted(() => ({
  delete: vi.fn(), transaction: vi.fn(), notify: vi.fn(),
}));
vi.mock("./db", () => ({ db: mocks, pool: {} }));
vi.mock("./session-store", () => ({ createSessionStore: () => ({}) }));
vi.mock("./indexnow", async (original) => ({
  ...await original<typeof import("./indexnow")>(),
  notifyIndexNow: mocks.notify,
}));
import { storage } from "./storage";

const published = {
  id: 42, isPublic: true, publicSlug: "original-title", publicLevel: "b1",
  // The teacher changed the level after publication; the URL stays at B1.
  cefrLevel: "C1",
};
const paths = ["/esl-lessons/b1/original-title", "/esl-lessons", "/esl-lessons/c1"];
const strategies = ["delete_all", "keep_vocabulary"] as const;
let rows: typeof published[];
let returning: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetAllMocks();
  rows = [{ ...published }];
  returning = vi.fn(async () => rows);
  mocks.delete.mockReturnValue({ where: () => ({ returning }) });
  vi.spyOn(storage, "getLessonDeletionInfo").mockResolvedValue({
    lessonTitle: "Changed title", assignmentCount: 2, affectedStudentIds: [1, 2],
  });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

function strategyTransaction(commitFailure = false) {
  const remove = vi.fn((table) => ({
    where: () => table === lessons ? { returning } : Promise.resolve([]),
  }));
  const update = vi.fn(() => ({ set: () => ({ where: async () => [] }) }));
  mocks.transaction.mockImplementation(async (run) => {
    const result = await run({ delete: remove, update });
    // A statement can succeed but COMMIT can still fail. No early notifications.
    expect(mocks.notify).not.toHaveBeenCalled();
    if (commitFailure) throw new Error("commit failed");
    return result;
  });
  return { remove, update };
}

describe("public lesson deletion notifications", () => {
  it("captures only persisted discovery fields and notifies after a direct deletion", async () => {
    returning.mockImplementation(async () => {
      expect(mocks.notify).not.toHaveBeenCalled();
      return rows;
    });
    expect(await storage.deleteLesson(42)).toBe(true);
    expect(mocks.delete).toHaveBeenCalledWith(lessons);
    expect(Object.keys(returning.mock.calls[0][0]).sort()).toEqual(
      ["id", "isPublic", "publicSlug", "publicLevel", "cefrLevel"].sort(),
    );
    expect(mocks.notify).toHaveBeenCalledExactlyOnceWith(paths);
  });

  it("uses the numeric URL for a legacy public lesson", async () => {
    rows = [{ ...published, publicSlug: null, publicLevel: null } as any];
    expect(await storage.deleteLesson(42)).toBe(true);
    expect(mocks.notify).toHaveBeenCalledExactlyOnceWith(
      ["/lessons/42", "/esl-lessons", "/esl-lessons/c1"],
    );
  });

  it.each(["private", "missing", "failed"])("does not notify for a %s direct deletion", async (kind) => {
    if (kind === "private") rows = [{ ...published, isPublic: false }];
    if (kind === "missing") rows = [];
    if (kind === "failed") {
      returning.mockRejectedValue(new Error("delete failed"));
      await expect(storage.deleteLesson(42)).rejects.toThrow("delete failed");
    } else {
      expect(await storage.deleteLesson(42)).toBe(kind === "private");
    }
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  describe.each(strategies)("%s strategy", (strategy) => {
    it("notifies once only after commit and preserves the vocabulary strategy", async () => {
      const tx = strategyTransaction();
      expect(await storage.deleteLessonWithStrategy(42, strategy)).toBe(true);
      expect(tx.remove).toHaveBeenCalledWith(studentLessons);
      expect(tx.remove).toHaveBeenCalledWith(lessons);
      if (strategy === "delete_all") {
        expect(tx.remove).toHaveBeenCalledWith(studentVocabulary);
        expect(tx.update).not.toHaveBeenCalled();
      } else {
        expect(tx.update).toHaveBeenCalledWith(studentVocabulary);
        expect(tx.remove).not.toHaveBeenCalledWith(studentVocabulary);
      }
      expect(mocks.notify).toHaveBeenCalledExactlyOnceWith(paths);
    });

    it.each(["private", "missing", "statement failure", "commit failure"])(
      "sends nothing on %s", async (kind) => {
        strategyTransaction(kind === "commit failure");
        if (kind === "private") rows = [{ ...published, isPublic: false }];
        if (kind === "missing") rows = [];
        if (kind === "statement failure") returning.mockRejectedValue(new Error("delete failed"));
        if (kind.endsWith("failure")) {
          await expect(storage.deleteLessonWithStrategy(42, strategy)).rejects.toThrow();
        } else {
          expect(await storage.deleteLessonWithStrategy(42, strategy)).toBe(kind === "private");
        }
        expect(mocks.notify).not.toHaveBeenCalled();
      },
    );

    it("notifies just once through the no-assignment fallback", async () => {
      vi.mocked(storage.getLessonDeletionInfo).mockResolvedValue({
        lessonTitle: "Changed title", assignmentCount: 0, affectedStudentIds: [],
      });
      expect(await storage.deleteLessonWithStrategy(42, strategy)).toBe(true);
      expect(mocks.transaction).not.toHaveBeenCalled();
      expect(mocks.notify).toHaveBeenCalledExactlyOnceWith(paths);
    });
  });

  it("never deletes a public lesson through student draft removal", async () => {
    let condition: any;
    mocks.transaction.mockImplementation(async (run) => run({
      delete: (table: unknown) => ({ where: (where: unknown) => {
        if (table === lessons) condition = where;
        return { returning: async () => table === studentLessons ? [{ id: 1 }] : [] };
      } }),
      update: () => ({ set: () => ({ where: async () => [] }) }),
    }));
    expect(await storage.removeStudentMadeLesson({ id: 1, teacherId: 2 }, 42))
      .toEqual({ lessonDeleted: false });
    const query = new PgDialect().sqlToQuery(condition);
    expect(query.sql).toContain('"lessons"."is_public" =');
    expect(query.params).toEqual([42, 2, false, false, 42]);
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});
