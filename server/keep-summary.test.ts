// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ db: {} }));
import { shapeKeepSummary } from "./keep-summary";

describe("shapeKeepSummary", () => {
  it("lists the students with the most words first, as numbers", () => {
    const summary = shapeKeepSummary("7", [
      { id: "1", name: "Tom", cefr_level: "A2", lessons: "1", words: "5" },
      { id: 2, name: "Maria", cefr_level: "B1", lessons: 3, words: 18 },
      { id: 3, name: "Ken", cefr_level: "B2", lessons: 2, words: 5 },
    ]);
    expect(summary.lessons).toBe(7);
    expect(summary.studentCount).toBe(3);
    expect(summary.students.map((s) => s.name)).toEqual(["Maria", "Ken", "Tom"]);
    expect(summary.students[0]).toEqual({ id: 2, name: "Maria", cefrLevel: "B1", lessons: 3, words: 18 });
  });

  it("shows at most four students but counts them all", () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `S${i + 1}`, cefr_level: "B1", lessons: i, words: i }));
    const summary = shapeKeepSummary(10, rows);
    expect(summary.students).toHaveLength(4);
    expect(summary.studentCount).toBe(6);
  });

  it("copes with a teacher who has no students or lessons", () => {
    expect(shapeKeepSummary(0, [])).toEqual({ lessons: 0, studentCount: 0, students: [] });
    expect(shapeKeepSummary("x" as any, [{ id: 1, name: "  ", cefr_level: "B1", lessons: null, words: null }]))
      .toEqual({ lessons: 0, studentCount: 0, students: [] });
  });
});
