import { describe, expect, it } from "vitest";
import { availableLessonSlug, lessonPath, lessonTitleSlug } from "@shared/lesson-url";

describe("public lesson URL rules", () => {
  it("uses titles only and normalizes punctuation and accents", () => {
    expect(lessonTitleSlug("  Café: Travel & Plans! ")).toBe("cafe-travel-plans");
    expect(lessonTitleSlug("🎉 中文")).toBe("lesson");
    expect(lessonTitleSlug("!")).toBe("lesson");
    expect(lessonTitleSlug("long ".repeat(100)).length).toBeLessThanOrEqual(90);
  });

  it("resolves duplicate titles, including already suffixed titles", () => {
    const used = new Set(["travel-plans", "travel-plans-42", "travel-plans-42-1"]);
    expect(availableLessonSlug("Travel Plans", 42, used)).toBe("travel-plans-42-2");
    expect(availableLessonSlug("New title", 1, used)).toBe("new-title");
  });

  it("uses only the stored public identity, never a changed title or CEFR level", () => {
    expect(lessonPath({ id: 42, publicSlug: "travel-plans", publicLevel: "b1" }))
      .toBe("/esl-lessons/b1/travel-plans");
    expect(lessonPath({ id: 42 })).toBe("/lessons/42");
  });
});
