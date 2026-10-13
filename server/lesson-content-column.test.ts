import { describe, it, expect } from "vitest";
import { lessons } from "@shared/schema";
import { decodeLessonContent, encodeLessonContent, tryDecodeLessonContent } from "@shared/lesson-content";

const lesson = { title: "Test", sections: [{ type: "warmup", questions: ["Hi?"] }] };
const canonical = JSON.stringify(lesson);
const legacy = JSON.stringify(canonical); // double-encoded rows from before the fix

describe("lessons.content storage format", () => {
  it("declares a text column, matching the real database type", () => {
    expect(lessons.content.getSQLType()).toBe("text");
  });

  it("writes objects as single-encoded JSON", () => {
    const stored = lessons.content.mapToDriverValue(lesson);
    expect(stored).toBe(canonical);
    expect(stored.startsWith("{")).toBe(true);
  });

  it("never double-encodes a string handed to it", () => {
    expect(lessons.content.mapToDriverValue(canonical as any)).toBe(canonical);
    expect(lessons.content.mapToDriverValue(legacy as any)).toBe(canonical);
  });

  it("reads canonical and legacy double-encoded rows as objects", () => {
    expect(lessons.content.mapFromDriverValue(canonical)).toEqual(lesson);
    expect(lessons.content.mapFromDriverValue(legacy)).toEqual(lesson);
  });

  it("rejects values that are not a JSON object", () => {
    expect(() => encodeLessonContent("not json")).toThrow();
    expect(() => decodeLessonContent(JSON.stringify([1, 2]))).toThrow();
    expect(tryDecodeLessonContent("not json")).toBeNull();
  });
});
