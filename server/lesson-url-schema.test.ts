// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("./db", () => ({ db: mocks }));
const dialect = new PgDialect();

beforeEach(() => {
  vi.resetModules();
  mocks.transaction.mockReset();
});

function database(rows: Array<Record<string, any>>, fail = false) {
  const queries: string[] = [];
  const writes: unknown[][] = [];
  mocks.transaction.mockImplementation(async (run) => {
    return run({ execute: async (statement: any) => {
      const { sql, params } = dialect.sqlToQuery(statement);
      queries.push(sql);
      if (fail) throw new Error("database unavailable");
      if (sql.includes("information_schema.columns")) return { rows: [{ column_name: "public_slug" }, { column_name: "public_level" }] };
      if (sql.includes("SELECT public_slug")) return { rows: rows.filter((r) => r.public_slug).map((r) => ({ public_slug: r.public_slug })) };
      if (sql.includes("SELECT id, title")) return { rows: rows.filter((r) => r.is_public && !r.public_slug).sort((a, b) => a.id - b.id) };
      if (sql.includes("UPDATE lessons")) writes.push(params);
      return { rows: [] };
    } });
  });
  return { queries, writes };
}

describe("safe public URL backfill", () => {
  it("assigns deterministic unique slugs only to public rows missing them", async () => {
    const { queries, writes } = database([
      { id: 1, title: "Travel Plans", cefr_level: "B1", is_public: true },
      { id: 2, title: "Travel Plans", cefr_level: "B2", is_public: true },
      { id: 3, title: "Private", cefr_level: "B1", is_public: false },
      { id: 4, title: "Renamed title", cefr_level: "C1", is_public: true, public_slug: "original-title" },
      { id: 5, title: "Travel Plans", cefr_level: "B1", is_public: true },
    ]);
    const { ensureLessonUrlSchema } = await import("./lesson-url-schema");
    await Promise.all([ensureLessonUrlSchema(), ensureLessonUrlSchema()]);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(writes).toEqual([[1, "travel-plans", "b1", 2, "travel-plans-2", "b2", 5, "travel-plans-5", "b1"]]);
    expect(queries[0]).toContain("pg_advisory_xact_lock");
    expect(queries.join("\n")).toContain("CREATE UNIQUE INDEX IF NOT EXISTS");
    expect(queries.join("\n")).not.toMatch(/\btopic\b|\bcontent\b/);
    expect(queries.join("\n")).not.toContain("ALTER TABLE");
  });

  it("does not change existing paths when restarted", async () => {
    const { writes } = database([
      { id: 1, title: "New title", cefr_level: "C2", is_public: true, public_slug: "old-title" },
    ]);
    const { ensureLessonUrlSchema } = await import("./lesson-url-schema");
    await ensureLessonUrlSchema();
    expect(writes).toEqual([]);
  });

  it("fails explicitly and retries after a failed migration", async () => {
    database([], true);
    const { ensureLessonUrlSchema } = await import("./lesson-url-schema");
    await expect(ensureLessonUrlSchema()).rejects.toThrow("database unavailable");
    database([]);
    await expect(ensureLessonUrlSchema()).resolves.toBeUndefined();
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
  });
});
