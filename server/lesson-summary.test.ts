import { describe, it, expect } from "vitest";
import { extractLessonSummary, LESSON_SUMMARY_SOURCE_CHARS } from "@shared/lesson-content";

const lesson = {
  title: "Can Money Buy Happiness?",
  level: "B2",
  sections: [
    {
      type: "warmup",
      title: "Warm-up Activity",
      content: "Students discuss whether money and happiness are related.",
      questions: ["Would you rather be rich or happy?", "What makes you \"happy\"?"],
    },
    {
      type: "reading",
      title: "Reading Text: The Price of Happiness",
      introduction: "Read this article about what research tells us about money and happiness.",
      paragraphs: ["x".repeat(10000)],
    },
  ],
};
const canonical = JSON.stringify(lesson);
const legacy = JSON.stringify(canonical);
const head = (s: string) => s.slice(0, LESSON_SUMMARY_SOURCE_CHARS);
const intro = "Read this article about what research tells us about money and happiness.";

describe("extractLessonSummary", () => {
  it("reads the reading introduction from canonical rows", () => {
    expect(extractLessonSummary(head(canonical))).toBe(intro);
  });

  it("reads the reading introduction from legacy double-encoded rows", () => {
    expect(legacy.startsWith('"{\\"title')).toBe(true);
    expect(extractLessonSummary(head(legacy))).toBe(intro);
  });

  it("tolerates truncation in the middle of an escape sequence", () => {
    const cutAt = legacy.indexOf('\\"introduction') + 1; // ends with a lone backslash
    const prefix = legacy.slice(0, cutAt);
    expect(prefix.endsWith("\\")).toBe(true);
    // Introduction is cut off, so it falls back to the warm-up description.
    expect(extractLessonSummary(prefix)).toBe("Students discuss whether money and happiness are related.");
  });

  it("falls back to the warm-up content when there is no reading section", () => {
    const warmupOnly = JSON.stringify({ title: "T", sections: [lesson.sections[0]] });
    expect(extractLessonSummary(JSON.stringify(warmupOnly))).toBe(
      "Students discuss whether money and happiness are related.",
    );
  });

  it("truncates long summaries at a word boundary", () => {
    const long = JSON.stringify({
      sections: [{ type: "reading", introduction: "word ".repeat(100) }],
    });
    const summary = extractLessonSummary(long, 50)!;
    expect(summary.length).toBeLessThanOrEqual(51);
    expect(summary.endsWith("word…")).toBe(true);
  });

  it("returns null instead of raw JSON when nothing readable is found", () => {
    expect(extractLessonSummary('{"sections":[]}')).toBeNull();
    expect(extractLessonSummary(JSON.stringify('{"sections":[]}'))).toBeNull();
    expect(extractLessonSummary("")).toBeNull();
    expect(extractLessonSummary(null)).toBeNull();
    expect(extractLessonSummary("not json")).toBeNull();
  });
});
