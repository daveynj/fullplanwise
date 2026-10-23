import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import type { LessonGenerateParams } from "@shared/schema";
import { lessonSectionContext } from "./lesson-check";
import { parseSectionJson, repairLesson, type LessonSectionRegenerator } from "./lesson-repair";
import { buildLessonSectionPrompt, LESSON_SECTION_TYPES, type LessonSectionContext, type LessonSectionType } from "./lesson-prompt";
import { OpenRouterService } from "./openRouter";
import {
  TARGET_WORDS,
  choiceQuestion,
  completeLesson,
  range,
  sectionOf,
  sentenceFrame,
  vocabularyWord,
  type TestLesson,
} from "./lesson-check.fixture";

const PARAMS = {
  cefrLevel: "B1",
  topic: "getting to work",
  focus: "general",
  lessonLength: 60,
  components: [],
  generateImages: true,
} as LessonGenerateParams;

interface Call {
  type: LessonSectionType;
  lesson: LessonSectionContext;
  studentVocabulary?: string[];
  model?: string;
}

/** Stands in for the OpenRouter service: answers each section request from `replies`. */
function stubRegenerator(replies: Partial<Record<LessonSectionType, unknown>>) {
  const calls: Call[] = [];
  const regenerator: LessonSectionRegenerator = {
    async regenerateLessonSection(type, _params, lesson, studentVocabulary, model) {
      calls.push({ type, lesson: structuredClone(lesson), studentVocabulary, model });
      const reply = replies[type];
      if (reply instanceof Error) throw reply;
      if (reply === undefined) throw new Error(`No reply for ${type}`);
      return structuredClone(reply);
    },
  };
  return { calls, regenerator };
}

const repair = (lesson: TestLesson, regenerator: LessonSectionRegenerator, studentVocabulary?: string[]) =>
  repairLesson(lesson, { params: PARAMS, regenerator, studentVocabulary, model: "test-model", logPrefix: "[Job test]" });

const types = (lesson: TestLesson) => lesson.sections.map((section) => section.type);

const framesSection = (count: number) => ({
  ...sectionOf(completeLesson(), "sentenceFrames"),
  pedagogicalFrames: range(count).map(sentenceFrame),
});

let logs: Record<"log" | "warn" | "error", string[]>;

beforeEach(() => {
  logs = { log: [], warn: [], error: [] };
  for (const level of ["log", "warn", "error"] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      logs[level].push(args.map(String).join(" "));
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("lesson repair", () => {
  it("asks for nothing when the lesson is complete", async () => {
    const lesson = completeLesson();
    const { calls, regenerator } = stubRegenerator({});

    const report = await repair(lesson, regenerator);

    expect(calls).toEqual([]);
    expect(report).toEqual({ fixedInPlace: [], problems: [], repaired: [], failed: [] });
    expect(lesson).toEqual(completeLesson());
    expect(logs.log).toContain("[Job test] Lesson check passed: all 9 sections are complete");
  });

  it("asks for just the incomplete section and puts the new one in its place", async () => {
    const lesson = completeLesson();
    sectionOf(lesson, "sentenceFrames").pedagogicalFrames.splice(1);
    const { calls, regenerator } = stubRegenerator({ sentenceFrames: framesSection(3) });

    const report = await repair(lesson, regenerator, ["habit"]);

    expect(calls).toEqual([
      { type: "sentenceFrames", lesson: lessonSectionContext(completeLesson()), studentVocabulary: ["habit"], model: "test-model" },
    ]);
    expect(lesson).toEqual(completeLesson());
    expect(report.problems).toEqual([{ type: "sentenceFrames", status: "incomplete", usableItems: 1, detail: "1 of 3 frames" }]);
    expect(report.repaired).toEqual(["sentenceFrames"]);
    expect(report.failed).toEqual([]);
    expect(logs.warn).toEqual([
      "[Job test] Lesson check: sentence frames section is incomplete (1 of 3 frames) — requesting this section again",
    ]);
    expect(logs.log).toContain("[Job test] Lesson check: sentence frames section repaired with a retry (3 frames)");
    expect(logs.error).toEqual([]);
  });

  it("adds a missing section in its usual place", async () => {
    const lesson = completeLesson();
    lesson.sections = lesson.sections.filter((section) => section.type !== "vocabulary");
    const vocabulary = sectionOf(completeLesson(), "vocabulary");
    const { calls, regenerator } = stubRegenerator({ vocabulary });

    await repair(lesson, regenerator);

    expect(calls.map((call) => call.lesson.targetWords)).toEqual([TARGET_WORDS]);
    expect(types(lesson)).toEqual([...LESSON_SECTION_TYPES]);
    expect(sectionOf(lesson, "vocabulary")).toEqual(vocabulary);
  });

  it("fixes simple slips without asking the AI again", async () => {
    const lesson = completeLesson();
    const cloze = sectionOf(lesson, "cloze");
    cloze.activity = { cloze: cloze.text };
    cloze.text = "Fill in the blanks.";
    sectionOf(lesson, "quiz").questions[1].correctAnswer = "C";
    const { calls, regenerator } = stubRegenerator({});

    const report = await repair(lesson, regenerator);

    expect(calls).toEqual([]);
    expect(report.problems).toEqual([]);
    expect(report.fixedInPlace).toHaveLength(2);
    expect(logs.log).toContain(
      '[Job test] Lesson check: fixed in place: quiz: the correct answer to question 2 was not one of its options; set it to "Third option"',
    );
    expect(sectionOf(lesson, "cloze").text).toBe(sectionOf(completeLesson(), "cloze").text);
  });

  it("keeps the incomplete section and logs the failure when the request fails", async () => {
    const lesson = completeLesson();
    sectionOf(lesson, "sentenceFrames").pedagogicalFrames.splice(1);
    const { regenerator } = stubRegenerator({ sentenceFrames: new Error("timeout of 60000ms exceeded") });

    const report = await repair(lesson, regenerator);

    expect(sectionOf(lesson, "sentenceFrames").pedagogicalFrames).toHaveLength(1);
    expect(report.failed).toEqual([{ type: "sentenceFrames", outcome: "kept original", detail: "1 of 3 frames" }]);
    expect(logs.error).toEqual([
      "[Job test] Lesson repair FAILED for the sentence frames section: the retry request failed: timeout of 60000ms exceeded. Keeping the original section, which has 1 of 3 frames.",
    ]);
  });

  it("keeps the more complete version when the retry is still short", async () => {
    const shortRetry = completeLesson();
    sectionOf(shortRetry, "sentenceFrames").pedagogicalFrames.splice(1);
    const better = stubRegenerator({ sentenceFrames: framesSection(2) });
    const betterReport = await repair(shortRetry, better.regenerator);
    expect(sectionOf(shortRetry, "sentenceFrames").pedagogicalFrames).toHaveLength(2);
    expect(betterReport.failed).toEqual([{ type: "sentenceFrames", outcome: "kept retry", detail: "2 of 3 frames" }]);

    const brokenRetry = completeLesson();
    sectionOf(brokenRetry, "discussion").questions.splice(3);
    const worse = stubRegenerator({ discussion: { type: "discussion", questions: ["Plain strings are skipped by the page?"] } });
    const worseReport = await repair(brokenRetry, worse.regenerator);
    expect(sectionOf(brokenRetry, "discussion").questions).toHaveLength(3);
    expect(worseReport.failed).toEqual([{ type: "discussion", outcome: "kept original", detail: "3 of 5 questions" }]);
  });

  it("leaves out a broken section that the retry could not fix", async () => {
    const lesson = completeLesson();
    const cloze = sectionOf(lesson, "cloze");
    cloze.text = cloze.text.replace(/\[(\d):[a-z]+\]/g, "[$1:]");
    const { calls, regenerator } = stubRegenerator({ cloze: { ...cloze } });

    const report = await repair(lesson, regenerator);

    expect(calls).toHaveLength(1);
    expect(types(lesson)).not.toContain("cloze");
    expect(report.failed).toEqual([{ type: "cloze", outcome: "left out", detail: 'no gaps, only 5 empty markers like "[1:]"' }]);
    expect(logs.error).toEqual([
      '[Job test] Lesson repair FAILED for the fill-in-the-blank section: the retry was broken: no gaps, only 5 empty markers like "[1:]". The lesson is saved without this section (the original was broken: no gaps, only 5 empty markers like "[1:]").',
    ]);
  });

  it("logs a section that is still missing after the retry", async () => {
    const lesson = completeLesson();
    lesson.sections = lesson.sections.filter((section) => section.type !== "quiz");
    const { regenerator } = stubRegenerator({ quiz: "not a section" });

    const report = await repair(lesson, regenerator);

    expect(types(lesson)).not.toContain("quiz");
    expect(report.failed).toEqual([{ type: "quiz", outcome: "left out", detail: "missing" }]);
    expect(logs.error).toEqual([
      "[Job test] Lesson repair FAILED for the quiz section: the retry reply had no section. The lesson is saved without this section.",
    ]);
  });

  it.each([
    ["the section itself, without a type", ({ type: _type, ...section }: Record<string, unknown>) => section],
    ["a section wrapper", (section: Record<string, unknown>) => ({ section })],
    ["a lesson wrapper", (section: Record<string, unknown>) => ({ title: "Lesson", sections: [section] })],
    ["a wrapper named after the section", (section: Record<string, unknown>) => ({ sentenceFrames: section })],
  ])("accepts %s as the reply", async (_, wrap) => {
    const lesson = completeLesson();
    sectionOf(lesson, "sentenceFrames").pedagogicalFrames.splice(2);
    const { regenerator } = stubRegenerator({ sentenceFrames: wrap(framesSection(3)) });

    const report = await repair(lesson, regenerator);

    expect(report.repaired).toEqual(["sentenceFrames"]);
    expect(lesson).toEqual(completeLesson());
  });

  it("asks for each broken section once, together", async () => {
    const lesson = completeLesson();
    sectionOf(lesson, "sentenceFrames").pedagogicalFrames.splice(1);
    sectionOf(lesson, "discussion").questions.splice(4);
    sectionOf(lesson, "quiz").questions = [];
    const { calls, regenerator } = stubRegenerator({
      sentenceFrames: framesSection(3),
      discussion: sectionOf(completeLesson(), "discussion"),
      quiz: sectionOf(completeLesson(), "quiz"),
    });

    const report = await repair(lesson, regenerator);

    expect(calls.map((call) => call.type).sort()).toEqual(["discussion", "quiz", "sentenceFrames"]);
    expect(report.repaired.sort()).toEqual(["discussion", "quiz", "sentenceFrames"]);
    expect(lesson).toEqual(completeLesson());
  });

  it("fixes simple slips in the retry too", async () => {
    const lesson = completeLesson();
    sectionOf(lesson, "quiz").questions.splice(2);
    const retry = { type: "quiz", title: "Knowledge Check", questions: range(5).map((n) => ({ ...choiceQuestion(n), correctAnswer: "C" })) };
    const { regenerator } = stubRegenerator({ quiz: retry });

    const report = await repair(lesson, regenerator);

    expect(report.repaired).toEqual(["quiz"]);
    expect(lesson).toEqual(completeLesson());
    expect(logs.log.filter((line) => line.includes("fixed in place (retry)"))).toHaveLength(5);
  });

  it("keeps the original title when the retry has none", async () => {
    const lesson = completeLesson();
    sectionOf(lesson, "sentenceFrames").pedagogicalFrames.splice(1);
    const { title: _title, ...untitled } = framesSection(3);
    const { regenerator } = stubRegenerator({ sentenceFrames: untitled });

    await repair(lesson, regenerator);

    expect(sectionOf(lesson, "sentenceFrames").title).toBe("Language Practice: Work");
  });

  it("passes on target words even when their vocabulary entries are removed", async () => {
    const lesson = completeLesson();
    sectionOf(lesson, "vocabulary").words[0].definition = "";
    sectionOf(lesson, "warmup").targetVocabulary = [];
    const { calls, regenerator } = stubRegenerator({ vocabulary: sectionOf(completeLesson(), "vocabulary") });

    await repair(lesson, regenerator);

    expect(calls.map((call) => [call.type, call.lesson.targetWords])).toEqual([["vocabulary", TARGET_WORDS]]);
  });

  it("writes the vocabulary first when no section names the target words", async () => {
    const lesson = completeLesson();
    lesson.sections = lesson.sections.filter((section) => section.type !== "vocabulary");
    sectionOf(lesson, "warmup").targetVocabulary = [];
    sectionOf(lesson, "cloze").wordBank = [];
    const { calls, regenerator } = stubRegenerator({
      vocabulary: { type: "vocabulary", title: "Key Vocabulary", words: TARGET_WORDS.map(vocabularyWord) },
      cloze: sectionOf(completeLesson(), "cloze"),
    });

    const report = await repair(lesson, regenerator, ["habit"]);

    expect(calls.map((call) => [call.type, call.lesson.targetWords])).toEqual([
      ["vocabulary", []],
      ["cloze", TARGET_WORDS],
    ]);
    expect(report.repaired).toEqual(["vocabulary", "cloze"]);
    expect(calls[0].studentVocabulary).toEqual(["habit"]);
  });
});

describe("reading the section reply", () => {
  const section = { type: "quiz", questions: [] };

  it.each([
    ["plain JSON", JSON.stringify(section)],
    ["a code fence", "```json\n" + JSON.stringify(section, null, 2) + "\n```"],
    ["an introduction", "Here is the quiz section:\n" + JSON.stringify(section)],
    ["a closing line", JSON.stringify(section) + "\nHope this helps!"],
  ])("reads %s", (_, text) => {
    expect(parseSectionJson(text)).toEqual(section);
  });

  it("throws when there is no JSON", () => {
    expect(() => parseSectionJson("Sorry, I can't help with that.")).toThrow("The reply contains no JSON object");
  });
});

describe("OpenRouter section request", () => {
  const reply = (content: string | null) => ({ status: 200, data: { choices: [{ message: { content } }] } });

  it("uses the lesson's model and settings", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValue(reply('```json\n{"type": "quiz", "questions": []}\n```'));
    const lesson = lessonSectionContext(completeLesson());

    const result = await new OpenRouterService("test-key").regenerateLessonSection("quiz", PARAMS, lesson, ["habit"], "z-ai/glm-5.3-flash");

    expect(result).toEqual({ type: "quiz", questions: [] });
    expect(post).toHaveBeenCalledTimes(1);
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(body).toEqual({
      model: "z-ai/glm-5.3-flash",
      messages: [{ role: "user", content: buildLessonSectionPrompt("quiz", PARAMS, lesson, ["habit"]) }],
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: 16384,
      reasoning: { effort: "low" },
    });
    expect(config).toMatchObject({ timeout: 60000, headers: { Authorization: "Bearer test-key" } });
  });

  it("only adds the reasoning setting for models that need it", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValue(reply('{"type": "quiz"}'));
    await new OpenRouterService("test-key").regenerateLessonSection("quiz", PARAMS, lessonSectionContext(completeLesson()), [], "openai/gpt-4o");
    expect(post.mock.calls[0][1]).not.toHaveProperty("reasoning");
  });

  it("fails when the reply is empty", async () => {
    vi.spyOn(axios, "post").mockResolvedValue(reply(null));
    await expect(
      new OpenRouterService("test-key").regenerateLessonSection("quiz", PARAMS, lessonSectionContext(completeLesson())),
    ).rejects.toThrow("The quiz section request returned no content");
  });
});

describe("lesson generation", () => {
  const reply = (content: unknown) => ({ status: 200, data: { choices: [{ message: { content: JSON.stringify(content) } }] } });

  it("repairs an incomplete section before returning the lesson", async () => {
    const lesson = completeLesson();
    sectionOf(lesson, "sentenceFrames").pedagogicalFrames.splice(1);
    const post = vi
      .spyOn(axios, "post")
      .mockResolvedValueOnce(reply(lesson))
      .mockResolvedValueOnce(reply(framesSection(3)));

    const result = await new OpenRouterService("test-key").generateLesson(PARAMS, [], "z-ai/glm-5.3-flash", { logPrefix: "[Job 42]" });

    expect(post).toHaveBeenCalledTimes(2);
    const sectionRequest = post.mock.calls[1][1] as { messages: { content: string }[] };
    expect(sectionRequest.messages[0].content).toContain("Write the sentence frames section of this lesson.");
    expect(result.provider).toBe("openrouter");
    expect(sectionOf(result, "sentenceFrames").pedagogicalFrames).toHaveLength(3);
    expect(logs.log).toContain("[Job 42] Lesson check: sentence frames section repaired with a retry (3 frames)");
  });

  it("makes one request for a complete lesson", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValueOnce(reply(completeLesson()));

    const result = await new OpenRouterService("test-key").generateLesson(PARAMS);

    expect(post).toHaveBeenCalledTimes(1);
    expect(types(result)).toEqual([...LESSON_SECTION_TYPES]);
    expect(logs.log).toContain("Lesson check passed: all 9 sections are complete");
  });
});
