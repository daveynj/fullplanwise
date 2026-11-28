import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ db: { execute: vi.fn() } }));

import { buildMemoryNote, targetWordsOf } from "./student-memory-note";

const lesson = {
  sections: [
    { type: "reading", paragraphs: ["Maya had to hedge her forecast.", "The caveat mattered, and the board's scrutiny was intense."] },
    { type: "vocabulary", words: [{ term: "scrutiny" }, { word: "forecast" }] },
  ],
};

describe("student memory note", () => {
  it("reads the lesson's target words", () => {
    expect(targetWordsOf(lesson)).toEqual(["scrutiny", "forecast"]);
    expect(targetWordsOf(JSON.stringify(lesson))).toEqual(["scrutiny", "forecast"]);
  });

  it("counts earlier words not taught again, and finds the ones back in the reading", () => {
    const note = buildMemoryNote(lesson, ["Hedge", "caveat", "contingency", "hedge", "scrutiny"], "Maya");
    // scrutiny is taught again in this lesson, so it isn't counted as built on.
    expect(note).toEqual({ studentName: "Maya", earlierWords: 3, reusedInReading: ["hedge", "caveat"] });
  });

  it("matches whole words only", () => {
    const note = buildMemoryNote({ sections: [{ type: "reading", paragraphs: ["They hedged nothing."] }] }, ["hedge", "edge"], "Sam");
    expect(note.reusedInReading).toEqual([]);
    expect(note.earlierWords).toBe(2);
  });

  it("is empty for a first lesson", () => {
    expect(buildMemoryNote(lesson, [], "Ana")).toEqual({ studentName: "Ana", earlierWords: 0, reusedInReading: [] });
  });
});
