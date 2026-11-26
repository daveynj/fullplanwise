import { describe, expect, it } from "vitest";
import { lessonStages, lessonTeaches, lessonDifference } from "../shared/lesson-pedagogy";

const fullLesson = {
  sections: [
    { type: "warmup", questions: ["Q1"] },
    { type: "vocabulary", words: [{ term: "affluence" }, { term: "fulfilment" }, { term: "" }] },
    { type: "reading", paragraphs: ["One.", "Two."] },
    { type: "comprehension", questions: [{}, {}, {}, {}, {}] },
    { type: "sentenceFrames", version: "v2_pedagogical", pedagogicalFrames: [
      { languageFunction: "Comparing viewpoints", tieredFrames: { emerging: { frame: "I think ___" } } },
      { languageFunction: "Giving reasons", tieredFrames: { expanding: { frame: "The main reason is ___" } } },
      { languageFunction: "Empty frame", tieredFrames: {} },
    ] },
    { type: "cloze", text: "x" },
    { type: "discussion", questions: [{}, {}, {}] },
    { type: "quiz", questions: [{}] },
    { type: "discussion", questions: [{}] },
  ],
};

describe("how a public lesson is built", () => {
  it("lists each stage once, in the lesson's order, with counts from the lesson", () => {
    const stages = lessonStages(fullLesson);
    expect(stages.map((s) => s.name)).toEqual([
      "Warm-up", "Key vocabulary", "Reading", "Comprehension", "Sentence frames", "Gap-fill", "Discussion", "Quiz",
    ]);
    expect(stages[1].purpose).toMatch(/^2 new words/);
    expect(stages[3].purpose).toMatch(/^5 questions/);
    expect(stages[4].purpose).toMatch(/^2 speaking patterns, each at three levels/);
    expect(stages[6].purpose).toMatch(/^3 open questions/);
  });

  it("accepts stored lesson text as well as objects", () => {
    expect(lessonStages(JSON.stringify(fullLesson))).toHaveLength(8);
    expect(lessonStages("not json")).toEqual([]);
    expect(lessonStages(null)).toEqual([]);
  });

  it("names the words and speaking functions the lesson teaches", () => {
    expect(lessonTeaches(fullLesson)).toEqual([
      "Vocabulary: affluence", "Vocabulary: fulfilment", "Speaking: Comparing viewpoints", "Speaking: Giving reasons",
    ]);
  });

  it("only claims what the lesson really has", () => {
    expect(lessonDifference(lessonStages(fullLesson), fullLesson)).toBe(
      "Unlike a generic worksheet, the new words are taught before the reading and met again in the activities, the speaking is supported at three levels and most of the time goes on the student talking.",
    );
    const older = { sections: [
      { type: "vocabulary", words: [{ term: "a" }] },
      { type: "reading", paragraphs: ["x"] },
      { type: "sentenceFrames", frames: [{ patternTemplate: "I think ___" }] },
    ] };
    const text = lessonDifference(lessonStages(older), older)!;
    expect(text).not.toContain("three levels");
    expect(text).not.toContain("talking");
    expect(lessonStages(older).find((s) => s.type === "sentenceFrames")?.purpose).not.toContain("three levels");
  });

  it("mentions word families, usage notes and synonyms/antonyms only when present in the lesson", () => {
    const plainVocab = lessonStages(fullLesson).find((s) => s.type === "vocabulary")!.purpose;
    expect(plainVocab).not.toContain("word families");
    expect(plainVocab).not.toContain("usage notes");
    expect(plainVocab).not.toContain("synonyms/antonyms");

    const richLesson = {
      sections: [
        {
          type: "vocabulary",
          words: [
            {
              term: "affluence",
              wordFamily: { words: ["affluent"] },
              usageNotes: "Usually formal.",
              semanticMap: { synonyms: ["wealth"], antonyms: ["poverty"] },
            },
          ],
        },
      ],
    };
    const richVocab = lessonStages(richLesson).find((s) => s.type === "vocabulary")!.purpose;
    expect(richVocab).toContain("word families");
    expect(richVocab).toContain("usage notes");
    expect(richVocab).toContain("recall flashcards and synonyms/antonyms");
  });
});
