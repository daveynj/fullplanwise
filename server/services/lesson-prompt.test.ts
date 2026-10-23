import { describe, it, expect } from "vitest";
import type { LessonGenerateParams } from "@shared/schema";
import {
  buildLessonPrompt,
  buildGrammarSpotlightPrompt,
  buildLessonSectionPrompt,
  getLevelGuidance,
  LESSON_SECTION_NAMES,
  LESSON_SECTION_TYPES,
  type LessonSectionContext,
} from "./lesson-prompt";
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

describe("lesson section prompt", () => {
  const lesson: LessonSectionContext = {
    title: "Getting to Work",
    targetWords: ["commute", "deadline", "flexible", "balance", "routine"],
    readingParagraphs: ["The first paragraph of the reading.", "The second paragraph of the reading."],
    discussionQuestions: ["How do you get to work?", "Would you like a flexible job?"],
  };
  const topic = "getting to work (she is a nurse, so avoid office examples)";

  it.each(LESSON_SECTION_TYPES)("asks for just the %s section, written for this lesson", (type) => {
    const prompt = buildLessonSectionPrompt(type, params("B1", topic), lesson);

    expect(prompt).toContain("relaxed one-to-one conversation class");
    expect(prompt).toContain("Return ONLY valid JSON");
    expect(occurrences(prompt, topic)).toBe(1);
    expect(prompt).toContain(`Write the ${LESSON_SECTION_NAMES[type]} section of this lesson.`);
    expect(occurrences(prompt, '"type": "')).toBe(1);
    expect(prompt).toContain(`"type": "${type}"`);
    expect(prompt).toContain('Lesson title: "Getting to Work"');
    expect(prompt).toContain("The 5 target words: commute, deadline, flexible, balance, routine");
    expect(prompt.trimEnd().endsWith("BEGIN JSON:")).toBe(true);
  });

  it("uses the lesson prompt's section templates", () => {
    const full = buildLessonPrompt(params("A2"));
    for (const type of LESSON_SECTION_TYPES) {
      const prompt = buildLessonSectionPrompt(type, params("A2"), lesson);
      const template = prompt.slice(prompt.indexOf("{\n"), prompt.indexOf("</json_schema>")).trim();
      const indented = template.split("\n").map((line) => `    ${line}`).join("\n");
      expect(full).toContain(indented);
    }
  });

  it("asks for all 3 sentence frames and shows the discussion questions they support", () => {
    const prompt = buildLessonSectionPrompt("sentenceFrames", params("A2"), lesson);
    expect(prompt).toContain("The pedagogicalFrames array must contain all 3 frames");
    expect(occurrences(prompt, '"languageFunction"')).toBe(3);
    expect(prompt).toContain("- How do you get to work?\n- Would you like a flexible job?");
    expect(prompt).toContain("The first paragraph of the reading.\n\nThe second paragraph of the reading.");
    expect(prompt).toContain('"lowerLevelScaffolding"');
  });

  it("gives the fill-in-the-blank the lesson's words", () => {
    const prompt = buildLessonSectionPrompt("cloze", params("B1"), lesson);
    expect(prompt).toContain("The wordBank must contain exactly these 5 words: commute, deadline, flexible, balance, routine.");
    expect(prompt).toContain("exactly 5 blanks");
    expect(prompt).toContain("never underscores");
  });

  it("writes vocabulary for the lesson's words, or chooses new words when no section names them", () => {
    const known = buildLessonSectionPrompt("vocabulary", params("B1"), lesson, ["habit"]);
    expect(known).toContain("Write the vocabulary entries for exactly these 5 words, in this order: commute, deadline, flexible, balance, routine.");
    expect(known).not.toContain("STUDENT'S PREVIOUS VOCABULARY");

    const unknown = buildLessonSectionPrompt("vocabulary", { ...params("B1"), targetVocabulary: "shift" }, { ...lesson, targetWords: [] }, ["habit"]);
    expect(unknown).toContain("Choose 5 words at B1 level");
    expect(unknown).toContain("This student has already learned these words: habit");
    expect(unknown).toContain("REQUIRED VOCABULARY: Include these specific words: shift");
    expect(unknown).not.toContain("The 5 target words");
  });

  it("does not show the old reading text when rewriting the reading", () => {
    const prompt = buildLessonSectionPrompt("reading", params("B1"), lesson);
    expect(prompt).not.toContain("The first paragraph of the reading.");
    expect(prompt).toContain("exactly 5 paragraphs");
  });
});
