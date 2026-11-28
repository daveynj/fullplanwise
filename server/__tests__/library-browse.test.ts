import { describe, expect, it } from "vitest";
import {
  LEVEL_TOPIC_MIN_LESSONS,
  hasLevelTopicPage,
  levelTopicCounts,
  levelTopicDescription,
  levelTopicPages,
  levelTopicPath,
  parseLevelTopicPath,
  relatedLessonGroups,
  themeHrefFor,
} from "@shared/library-browse";

const lesson = (id: number, cefrLevel: string, tags: string[], title = `Lesson ${id}`) => ({ id, title, cefrLevel, tags });

const library = [
  lesson(1, "B1", ["work"]),
  lesson(2, "B1", ["work", "money"]),
  lesson(3, "B1", ["work"]),
  lesson(4, "B1", ["travel"]),
  lesson(5, "B1", []),
  lesson(6, "A2", ["work"]),
  lesson(7, "C1", ["work"]),
  lesson(8, "B2", ["travel"]),
];

describe("level-by-theme pages", () => {
  it("exist only where a level and theme have enough lessons", () => {
    const counts = levelTopicCounts(library);
    expect(LEVEL_TOPIC_MIN_LESSONS).toBe(3);
    expect(hasLevelTopicPage(counts, "B1", "work")).toBe(true);
    expect(hasLevelTopicPage(counts, "B1", "travel")).toBe(false);
    expect(hasLevelTopicPage(counts, "A2", "work")).toBe(false);
    expect(levelTopicPages(library)).toEqual([{ level: "B1", tag: "work", count: 3, path: "/esl-lessons/b1/topics/work" }]);
  });

  it("sends readers to the level page where it exists and to the all-levels hub otherwise", () => {
    const counts = levelTopicCounts(library);
    expect(themeHrefFor(counts, "B1", "work")).toBe("/esl-lessons/b1/topics/work");
    expect(themeHrefFor(counts, "B1", "travel")).toBe("/esl-lessons/topics/travel");
  });

  it("parses only real levels and themes from the URL", () => {
    expect(parseLevelTopicPath("/esl-lessons/b1/topics/work")).toEqual({ level: "B1", tag: "work" });
    expect(parseLevelTopicPath("/esl-lessons/B1/topics/WORK/")).toEqual({ level: "B1", tag: "work" });
    expect(parseLevelTopicPath("/esl-lessons/b7/topics/work")).toBeNull();
    expect(parseLevelTopicPath("/esl-lessons/b1/topics/not-a-theme")).toBeNull();
    expect(parseLevelTopicPath("/esl-lessons/b1/some-lesson")).toBeNull();
    expect(levelTopicPath("B1", "work")).toBe("/esl-lessons/b1/topics/work");
  });

  it("writes a short, true description that fits a meta tag", () => {
    const d = levelTopicDescription("B1", "work", 12);
    expect(d).toBe("12 free B1 (intermediate) ESL conversation lessons about work & careers: five words, a reading, practice and discussion questions. No login.");
    expect(d.length).toBeLessThanOrEqual(160);
  });
});

describe("related lesson groups for a lesson page", () => {
  it("puts the same theme at the same level first, then the rest of the level, never the lesson itself", () => {
    const groups = relatedLessonGroups(lesson(1, "B1", ["work"]), library);
    expect(groups.sameLevel.map((l) => l.id)).toEqual([2, 3, 4, 5]);
    expect(groups.sameLevel.some((l) => l.id === 1)).toBe(false);
  });

  it("finds the main theme at other levels, nearest first, one per level", () => {
    const groups = relatedLessonGroups(lesson(1, "B1", ["work"]), library);
    expect(groups.otherLevels.map((l) => `${l.cefrLevel}:${l.id}`)).toEqual(["A2:6", "C1:7"]);
  });

  it("links the level-by-theme page where it exists, the hub otherwise, and the level page", () => {
    const groups = relatedLessonGroups(lesson(2, "B1", ["work", "money"]), library);
    expect(groups.browse).toEqual([
      { label: "B1 Work & careers lessons", href: "/esl-lessons/b1/topics/work" },
      { label: "All Money lessons", href: "/esl-lessons/topics/money" },
      { label: "All B1 lessons", href: "/esl-lessons/b1" },
    ]);
  });

  it("caps the same-level list and copes with untagged lessons", () => {
    const many = Array.from({ length: 10 }, (_, i) => lesson(100 + i, "A1", []));
    const groups = relatedLessonGroups(lesson(100, "A1", null as any), many);
    expect(groups.sameLevel).toHaveLength(6);
    expect(groups.otherLevels).toEqual([]);
    expect(groups.browse).toEqual([{ label: "All A1 lessons", href: "/esl-lessons/a1" }]);
  });
});
