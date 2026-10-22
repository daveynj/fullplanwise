import { describe, it, expect } from "vitest";
import type { LessonGenerateParams } from "@shared/schema";
import { buildLessonPrompt, buildGrammarSpotlightPrompt, getLevelGuidance } from "./lesson-prompt";
import { OpenRouterService } from "./openRouter";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function params(cefrLevel: string, topic = "Daily routines"): LessonGenerateParams {
  return { cefrLevel, topic, focus: "general", lessonLength: 60, components: [], generateImages: true } as LessonGenerateParams;
}

const occurrences = (haystack: string, needle: string) => haystack.split(needle).length - 1;

describe("lesson prompt", () => {
  it.each(LEVELS)("%s prompt describes the class, the student and the level", (level) => {
    const prompt = buildLessonPrompt(params(level));
    const g = getLevelGuidance(level);

    expect(prompt).toContain("relaxed one-to-one conversation class");
    expect(prompt).toContain(`A ${level} student ${g.canUnderstand}`);
    expect(prompt).toContain("The five target words are the new language in this lesson");
    expect(prompt).toContain(`pitched at a ${level} student's level`);
    expect(prompt).toContain(g.languageNote);
    expect(prompt).toContain(g.vocabularyGuidance);
    expect(prompt).toContain(g.definitionGuidance);
    expect(prompt).toContain(`reading text of ${g.readingLength}`);
    expect(prompt).toContain(g.readingGuidance);
    expect(prompt).toContain(g.discussionGuidance);
    expect(prompt).toContain("Conversation style:");
  });

  it.each(LEVELS)("%s prompt keeps the structural rules the app depends on", (level) => {
    const prompt = buildLessonPrompt(params(level));

    expect(prompt).toContain("Return ONLY valid JSON");
    for (const type of ["warmup", "reading", "vocabulary", "comprehension", "sentenceFrames", "cloze", "sentenceUnscramble", "discussion", "quiz"]) {
      expect(prompt).toContain(`"type": "${type}"`);
    }
    expect(prompt).toContain("exactly 5 blanks");
    expect(prompt).toContain("Format blanks as [1:word], [2:word]");
    expect(prompt).toContain("never underscores");
    expect(prompt).toContain("The words array must contain every single word from the correctSentence");
    expect(prompt).toContain("The pedagogicalFrames array must contain all 3 frames");
    expect(occurrences(prompt, '"languageFunction"')).toBe(3);
    expect(prompt).toContain('ending with "No text visible"');
    expect(prompt).toContain(`"level": "${level}"`);
    expect(prompt.trimEnd().endsWith("BEGIN JSON:")).toBe(true);

    const scaffolding = prompt.includes('"lowerLevelScaffolding"');
    expect(scaffolding).toBe(getLevelGuidance(level).needsLowerLevelScaffolding);
  });

  it("no longer steers higher levels toward academic language", () => {
    for (const level of ["B2", "C1", "C2"]) {
      const prompt = buildLessonPrompt(params(level));
      expect(prompt).not.toContain("academic discussions");
      expect(prompt).not.toContain("argumentation");
      expect(prompt).not.toContain("analytical content");
      expect(prompt).not.toContain("sophisticated analysis");
    }
  });

  it("keeps advanced levels demanding", () => {
    expect(buildLessonPrompt(params("C1"))).toContain("Keep the lesson genuinely challenging");
    expect(buildLessonPrompt(params("C1"))).toContain("Avoid words a B2 student would already know");
    expect(buildLessonPrompt(params("C2"))).toContain("Make the lesson demanding");
    for (const level of ["C1", "C2"]) expect(buildLessonPrompt(params(level))).toContain("do not simplify");
    for (const level of ["A1", "A2", "B1", "B2"]) expect(buildLessonPrompt(params(level))).not.toContain("do not simplify");
  });

  it("tells beginner and intermediate lessons to choose the simpler option when unsure", () => {
    for (const level of ["A1", "A2", "B1"]) {
      expect(buildLessonPrompt(params(level))).toContain("use a simpler one");
    }
  });

  it("includes the teacher's request once and never as a title template", () => {
    const topic = "everyday heroes (this student is only 11 years old so no adult questions)";
    const prompt = buildLessonPrompt(params("A2", topic));

    expect(occurrences(prompt, topic)).toBe(1);
    expect(prompt).toContain(`The teacher's request: "${topic}"`);
    expect(prompt).toContain("do not repeat the notes themselves in the lesson");
    expect(prompt).toContain('"title": "Language Practice: [short topic name]"');
  });

  it("adds the student's vocabulary history and required words when given", () => {
    const prompt = buildLessonPrompt({ ...params("B1"), targetVocabulary: "commute, deadline" }, ["habit", "routine"]);
    expect(prompt).toContain("This student has already learned these words: habit, routine");
    expect(prompt).toContain("REQUIRED VOCABULARY: Include these specific words: commute, deadline");

    const plain = buildLessonPrompt(params("B1"));
    expect(plain).not.toContain("STUDENT'S PREVIOUS VOCABULARY");
    expect(plain).not.toContain("REQUIRED VOCABULARY");
  });

  it("falls back to B1 guidance for an unknown level", () => {
    expect(getLevelGuidance("Z9")).toEqual(getLevelGuidance("B1"));
  });

  it("is the prompt the OpenRouter service sends", () => {
    const service = new OpenRouterService("test-key") as unknown as {
      constructLessonPrompt(p: LessonGenerateParams, v: string[]): string;
    };
    expect(service.constructLessonPrompt(params("B2"), ["habit"])).toBe(buildLessonPrompt(params("B2"), ["habit"]));
  });
});

describe("grammar spotlight prompt", () => {
  it.each(LEVELS)("%s spotlight prompt shares the class and level description", (level) => {
    const topic = "Fast food (this is for a 13 year old boy so no adult questions)";
    const prompt = buildGrammarSpotlightPrompt(topic, level);

    expect(prompt).toContain("relaxed one-to-one conversation lesson");
    expect(prompt).toContain(`A ${level} student ${getLevelGuidance(level).canUnderstand}`);
    expect(prompt).toContain(`natural English that a ${level} student can follow`);
    expect(prompt).toContain("do not repeat the notes themselves in the lesson");
    expect(occurrences(prompt, topic)).toBe(1);
    for (const key of ['"grammarType"', '"examples"', '"highlighted"', '"logicExplanation"', '"communicationImpact"']) {
      expect(prompt).toContain(key);
    }
  });
});
