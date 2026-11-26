// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("./db", () => ({ db: mocks, pool: {} }));
vi.mock("./session-store", () => ({ createSessionStore: () => ({}) }));
vi.mock("./lesson-url-schema", () => ({
  ensureLessonUrlSchema: vi.fn(async () => {}),
  LESSON_URL_LOCK: 420003,
}));
import { storage } from "./storage";

beforeEach(() => { mocks.transaction.mockReset(); });

function transaction(current: Record<string, unknown>, existing: Array<{ slug: string | null }> = []) {
  let changes: Record<string, unknown> = {};
  const execute = vi.fn(async (_statement: any) => {});
  const select = vi.fn()
    .mockReturnValueOnce({ from: () => ({ where: async () => [current] }) })
    .mockReturnValueOnce({ from: async () => existing });
  const tx = {
    execute, select,
    update: () => ({ set: (value: Record<string, unknown>) => {
      changes = value;
      return { where: () => ({ returning: async () => [{ id: 42, ...current, ...value }] }) };
    } }),
  };
  mocks.transaction.mockImplementation(async (run) => run(tx));
  return { execute, select, changes: () => changes };
}

describe("immutable publication URLs", () => {
  it("reserves a unique title-based slug under the shared database lock", async () => {
    const tx = transaction({ title: "Travel Plans", cefrLevel: "B1", isPublic: false, publicSlug: null },
      [{ slug: "travel-plans" }, { slug: "travel-plans-42" }]);
    const published = await storage.updateLesson(42, { isPublic: true });
    expect(published.publicSlug).toBe("travel-plans-42-1");
    expect(published.publicLevel).toBe("b1");
    expect(new PgDialect().sqlToQuery(tx.execute.mock.calls[0][0]).params).toEqual([420003]);
  });

  it("never rewrites reserved URLs on edits, removal, or republication", async () => {
    const current = { title: "New title", cefrLevel: "C2", isPublic: false, publicSlug: "travel-plans", publicLevel: "b1" };
    const tx = transaction(current);
    const published = await storage.updateLesson(42, {
      isPublic: true, title: "Another title", cefrLevel: "B2",
      publicSlug: "malicious-replacement", publicLevel: "c2",
    });
    expect(published.publicSlug).toBe("travel-plans");
    expect(published.publicLevel).toBe("b1");
    expect(tx.changes()).not.toHaveProperty("publicSlug");
    expect(tx.changes()).not.toHaveProperty("publicLevel");
    expect(tx.select).toHaveBeenCalledTimes(1);
  });

  it("does not assign public slugs to link-only lessons", async () => {
    const tx = transaction({ title: "Travel Plans", cefrLevel: "B1", isPublic: false, publicSlug: null });
    await storage.updateLesson(42, { isShared: true });
    expect(tx.changes()).toEqual({ isShared: true });
  });
});
