// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { publicTagFingerprint, publicTagEditFingerprint } from "./public-lesson-tags";

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), select: vi.fn() }));
vi.mock("./db", () => ({ db: mocks, pool: {} }));
vi.mock("./session-store", () => ({ createSessionStore: () => ({}) }));
vi.mock("./lesson-url-schema", () => ({ ensureLessonUrlSchema: vi.fn(), LESSON_URL_LOCK: 420003 }));
import { storage } from "./storage";
import { lessons } from "@shared/schema";
import type { PublicLessonTag } from "@shared/public-lesson-tags";

const source = { id: 7, title: "Travel", cefrLevel: "B1", publicReading: "At the airport" };
const approval = { id: 7, fingerprint: publicTagFingerprint(source), tags: ["travel" as const] };

function setup(rows: object[]) {
  const write = vi.fn(async () => {});
  const where = vi.fn(() => ({ orderBy: () => ({ for: async () => rows }) }));
  const update = vi.fn(() => ({ set: (values: unknown) => { write(values); return { where: async () => {} }; } }));
  const select = vi.fn(() => ({ from: () => ({ where }) }));
  mocks.transaction.mockImplementation(async (run) => run({ select, update }));
  return { update, write, select };
}

beforeEach(() => vi.resetAllMocks());

describe("guarded public tag persistence", () => {
  it.each([{ tags: ["culture"] }, { tags: [] }])("replaces or clears approved tags under a row lock: %j", async ({ tags }) => {
    const row = { ...source, tags: ["travel"], isPublic: true };
    const tx = setup([row]);
    await storage.editReviewedPublicTags({ id: 7, fingerprint: publicTagEditFingerprint(row), tags: tags as PublicLessonTag[] });
    expect(tx.write).toHaveBeenCalledWith({ tags });
    expect(Object.keys(tx.select.mock.calls[0][0])).toEqual(["id", "title", "cefrLevel", "publicReading", "tags", "isPublic"]);
  });

  it.each([
    undefined,
    { tags: ["food"] },
    { tags: [] },
    { tags: ["travel", "hidden legacy label"] },
    { title: "Changed" },
    { cefrLevel: "C2" },
    { publicReading: "Changed" },
    { isPublic: false },
  ])("prevents overwriting a concurrently edited or unavailable lesson: %j", async (change) => {
    const row = { ...source, tags: ["travel"], isPublic: true };
    const tx = setup(change ? [{ ...row, ...change }] : []);
    await expect(storage.editReviewedPublicTags({
      id: 7, tags: [], fingerprint: publicTagEditFingerprint(row),
    })).rejects.toThrow("nothing was saved");
    expect(tx.update).not.toHaveBeenCalled();
  });

  it("searches public title/ID only and selects no private source or full content", async () => {
    let selection: any;
    let condition: any;
    const limit = vi.fn(async () => []);
    mocks.select.mockImplementation((columns) => {
      selection = columns;
      return { from: () => ({ where: (sql: any) => {
        condition = sql;
        return { orderBy: () => ({ limit }) };
      } }) };
    });
    await storage.findPublicTagLessons("7", 2, 11);
    expect(Object.keys(selection)).toEqual(["id", "title", "cefrLevel", "tags"]);
    const filters = new PgDialect().sqlToQuery(condition);
    expect(filters.sql).toContain('"lessons"."is_public"');
    expect(filters.sql).toContain('"lessons"."title"');
    expect(filters.sql).toContain('"lessons"."id"::text');
    expect(filters.sql).not.toMatch(/topic|notes|student|teacher|content/i);
    expect(filters.params).toEqual([true, 2, "7", "%7%"]);
    expect(limit).toHaveBeenCalledWith(11);
  });

  it("loads an edit preview through a public-only allowlisted projection", async () => {
    const select = vi.fn((_columns: unknown) => ({ from: () => ({ where: async () => [{ ...source, tags: ["travel"] }] }) }));
    mocks.select.mockImplementation(select);
    expect(await storage.getPublicTagEditSource(7)).toMatchObject({ id: 7, tags: ["travel"] });
    expect(Object.keys(select.mock.calls[0][0])).toEqual(["id", "title", "cefrLevel", "publicReading", "tags"]);
  });

  it("locks and checks the reviewed public source before writing tags only", async () => {
    const tx = setup([{ ...source, tags: [], isPublic: true }]);
    expect(await storage.applyReviewedPublicTags([approval])).toBe(1);
    expect(tx.write).toHaveBeenCalledWith({ tags: ["travel"] });
    const columns = tx.select.mock.calls[0][0];
    expect(Object.keys(columns)).toEqual(["id", "title", "cefrLevel", "publicReading", "tags", "isPublic"]);
  });

  it.each([
    [],
    [{ ...source, tags: [], isPublic: false }],
    [{ ...source, tags: ["food"], isPublic: true }],
    [{ ...source, title: "Changed", tags: [], isPublic: true }],
    [{ ...source, publicReading: "Changed", tags: [], isPublic: true }],
  ])("rejects missing, private, already tagged or edited rows", async (...rows) => {
    const tx = setup(rows);
    await expect(storage.applyReviewedPublicTags([approval])).rejects.toThrow("Preview again");
    expect(tx.update).not.toHaveBeenCalled();
  });

  it("validates every row before writing any of a reviewed batch", async () => {
    const tx = setup([{ ...source, tags: [], isPublic: true }, { ...source, id: 8, tags: ["food"], isPublic: true }]);
    await expect(storage.applyReviewedPublicTags([approval, { ...approval, id: 8 }])).rejects.toThrow();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it("selects public reading only, excludes private requests and existing tags, and uses a bounded cursor", async () => {
    let selection: any;
    let condition: any;
    const limit = vi.fn(async () => []);
    mocks.select.mockImplementation((columns) => {
      selection = columns;
      return { from: () => ({ where: (sql: any) => {
        condition = sql;
        return { orderBy: () => ({ limit }) };
      } }) };
    });
    await storage.getPublicTagCandidates(40, 11);
    expect(Object.keys(selection)).toEqual(["id", "title", "cefrLevel", "publicReading"]);
    const dialect = new PgDialect();
    const reading = dialect.sqlToQuery(selection.publicReading).sql;
    expect(reading).toContain("paragraphs");
    expect(reading).toContain("reading");
    expect(reading).not.toMatch(/topic|notes|student|teacher/i);
    const filters = dialect.sqlToQuery(condition);
    expect(filters.sql).toContain('"lessons"."is_public"');
    expect(filters.sql).toContain('cardinality("lessons"."tags")');
    expect(filters.params).toContain(40);
    expect(limit).toHaveBeenCalledWith(11);
    expect(selection.title).toBe(lessons.title);
  });

  it("exposes only curated tags in public summaries, never arbitrary teacher labels", async () => {
    const rows = [{ ...source, tags: ["travel", "student-specific private label", "travel"] }];
    mocks.select.mockImplementation(() => ({
      from: () => ({ where: () => ({ orderBy: async () => rows }) }),
    }));
    expect((await storage.getPublicLessonSummaries())[0].tags).toEqual(["travel"]);
  });
});
