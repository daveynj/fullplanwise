import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import type { LessonGenerateParams } from "@shared/schema";
import { expressionItemsOf } from "@shared/lesson-expressions";
import { lessonSectionContext } from "./lesson-check";
import {
  addExpressionsSection,
  checkExpressionsSection,
  fixExpressionsSection,
  type ExpressionsSectionWriter,
} from "./lesson-expressions";
import { buildExpressionsPrompt, LESSON_SECTION_TYPES, type LessonSectionContext } from "./lesson-prompt";
import { OpenRouterService } from "./openRouter";
import { completeLesson, sectionOf, type TestLesson } from "./lesson-check.fixture";

const OFF = {
  cefrLevel: "B1",
  topic: "getting to work",
  focus: "general",
  lessonLength: 60,
  components: ["warm-up", "vocabulary", "reading", "comprehension", "sentences", "discussion", "quiz"],
  generateImages: true,
} as LessonGenerateParams;

const ON = { ...OFF, components: [...OFF.components, "expressions"] } as LessonGenerateParams;

const READING = [
  "Sam used to commute for an hour every day. Now he works from home, and his routine is very different.",
  "He gets up at seven and turns on his computer before breakfast.",
  "Some days he puts off small jobs until the evening, and then he misses a deadline.",
  "His boss is flexible, but Sam still finds it hard to switch off after work.",
  "Finding a good balance between work and rest takes practice.",
];

function lessonWithReading(): TestLesson {
  const lesson = completeLesson();
  sectionOf(lesson, "reading").paragraphs = [...READING];
  return lesson;
}

const EXPRESSIONS = [
  {
    expression: "put off",
    kind: "phrasal verb",
    fromText: "Some days he **puts off** small jobs until the evening, and then he misses a deadline.",
    meaning: "to decide to do something later than you planned",
    similar: "postpone",
    example: "I always **put off** going to the dentist.",
    notes: [{ text: "You can split it:", right: "put it off", wrong: "put off it" }],
    tone: "",
    yourTurn: "What do you often put off? Why?",
  },
  {
    expression: "switch off",
    kind: "phrasal verb",
    fromText: "His boss is flexible, but Sam still finds it hard to **switch off** after work.",
    meaning: "to stop thinking about work and relax",
    similar: "relax",
    example: "A long walk helps me **switch off**.",
    notes: [{ text: "No object in this meaning." }],
    tone: "informal",
    yourTurn: "What helps you switch off after a busy day?",
  },
  {
    expression: "turn on",
    kind: "phrasal verb",
    fromText: "He gets up at seven and **turns on** his computer before breakfast.",
    meaning: "to make a machine start working",
    similar: "start",
    example: "Can you **turn on** the light, please?",
    notes: [{ text: "The opposite is turn off." }],
    tone: "",
    yourTurn: "What do you turn on first in the morning?",
  },
  {
    expression: "get up",
    kind: "phrasal verb",
    fromText: "He **gets up** at seven and turns on his computer before breakfast.",
    meaning: "to get out of bed",
    similar: "",
    example: "I **get up** late on Sundays.",
    notes: [],
    tone: "",
    yourTurn: "What time do you get up on work days?",
  },
];

const QUIZ_QUESTION = {
  question: "What does “put off” mean?",
  options: ["to do something later", "to do something now", "to stop something", "to finish something"],
  answer: "to do something later",
  correctAnswer: "to do something later",
  explanation: "If you put something off, you decide to do it later.",
};

function reply(count = 3, overrides: Record<string, unknown> = {}) {
  return {
    type: "expressions",
    title: "Some title",
    items: structuredClone(EXPRESSIONS.slice(0, count)),
    quizQuestion: structuredClone(QUIZ_QUESTION),
    ...overrides,
  };
}

interface Call {
  lesson: LessonSectionContext;
  studentVocabulary?: string[];
  model?: string;
}

/** Stands in for the OpenRouter service: answers each request with the next reply. */
function stubWriter(...replies: unknown[]) {
  const calls: Call[] = [];
  const writer: ExpressionsSectionWriter = {
    async writeExpressionsSection(_params, lesson, studentVocabulary, model) {
      calls.push({ lesson: structuredClone(lesson), studentVocabulary, model });
      const next = replies.shift();
      if (next instanceof Error) throw next;
      if (next === undefined) throw new Error("No reply");
      return structuredClone(next);
    },
  };
  return { calls, writer };
}

const add = (lesson: TestLesson, writer: ExpressionsSectionWriter, params = ON, studentVocabulary?: string[]) =>
  addExpressionsSection(lesson, { params, writer, studentVocabulary, model: "test-model", logPrefix: "[Job test]" });

const types = (lesson: { sections: Record<string, unknown>[] }) => lesson.sections.map((section) => section.type);

const fixContext = (required = 3, knownWords: string[] = []) => ({ readingParagraphs: READING, knownWords, required });

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

describe("expressions check", () => {
  it("accepts a complete section without changes", () => {
    const section = reply(3);
    expect(fixExpressionsSection(section, fixContext())).toEqual([]);
    expect(section).toEqual(reply(3));
    expect(checkExpressionsSection(section, 3)).toEqual({ status: "ok", usableItems: 3, detail: "3 expressions" });
  });

  it("matches the reading in spite of curly quotes, extra spaces and the ** marks", () => {
    const section = reply(2);
    section.items[1].fromText = "“His boss is flexible, but Sam can't  always **switch off**\nafter work.”";
    const reading = [...READING];
    reading[3] = "His boss is flexible, but Sam can’t always switch off after work.";
    expect(fixExpressionsSection(section, { readingParagraphs: reading, knownWords: [], required: 2 })).toEqual([]);
    expect(section.items[1].fromText).not.toBe("");
  });

  it("drops a quoted sentence that is not in the reading but keeps the expression", () => {
    const section = reply(3);
    section.items[0].fromText = "He always **puts off** his homework.";
    expect(fixExpressionsSection(section, fixContext())).toEqual([
      'idioms and phrasal verbs: the sentence quoted for "put off" is not in the reading text; removed the quote',
    ]);
    expect(section.items[0].fromText).toBe("");
    expect(checkExpressionsSection(section, 3).status).toBe("ok");
  });

  it("removes expressions that repeat a target word, a learned word or another expression", () => {
    const section = reply(3);
    section.items[1].expression = "Commute";
    section.items.push(structuredClone(EXPRESSIONS[0]), structuredClone(EXPRESSIONS[3]));

    const fixes = fixExpressionsSection(section, fixContext(3, ["commute", "deadline", "Get up"]));

    expect(fixes).toEqual([
      'idioms and phrasal verbs: removed "Commute", which is a target word or a word the student has already learned',
      'idioms and phrasal verbs: removed a second "put off"',
      'idioms and phrasal verbs: removed "get up", which is a target word or a word the student has already learned',
    ]);
    expect(section.items.map((item) => item.expression)).toEqual(["put off", "turn on"]);
    expect(checkExpressionsSection(section, 3)).toEqual({ status: "incomplete", usableItems: 2, detail: "2 of 3 expressions" });
  });

  it("removes expressions the lesson page cannot show", () => {
    const section = reply(3);
    section.items[0].yourTurn = "";
    delete (section.items[1] as Record<string, unknown>).meaning;
    (section.items as unknown[]).push("not an expression");

    expect(fixExpressionsSection(section, fixContext())).toEqual([
      'idioms and phrasal verbs: removed "put off", which has no meaning, example or speaking question',
      'idioms and phrasal verbs: removed "switch off", which has no meaning, example or speaking question',
      "idioms and phrasal verbs: removed item 4, which was not an expression",
    ]);
    expect(checkExpressionsSection(section, 3)).toEqual({ status: "incomplete", usableItems: 1, detail: "1 of 3 expressions" });
  });

  it("tidies kinds, tones, similar words and unpaired marks", () => {
    const section = reply(3);
    const [first, second, third] = section.items as Record<string, unknown>[];
    first.kind = "Phrasal Verbs";
    first.tone = "Informal";
    second.kind = "collocation";
    second.tone = "neutral";
    second.similar = ["relax", "unwind"];
    third.example = "Can you **turn on the light, please?";

    expect(fixExpressionsSection(section, fixContext())).toEqual([
      'idioms and phrasal verbs: "switch off" had no known kind; labelled it an expression',
      'idioms and phrasal verbs: removed unpaired ** marks from the example of "turn on"',
    ]);
    expect([first.kind, first.tone]).toEqual(["phrasal verb", "informal"]);
    expect([second.kind, second.tone, second.similar]).toEqual(["expression", "", "relax, unwind"]);
    expect(third.example).toBe("Can you turn on the light, please?");
  });

  it("keeps only as many expressions as the level asks for", () => {
    const section = reply(4);
    expect(fixExpressionsSection(section, fixContext(3))).toEqual(["idioms and phrasal verbs: kept the first 3 of 4 expressions"]);
    expect(section.items).toHaveLength(3);
  });

  it("reports a missing or empty section", () => {
    expect(checkExpressionsSection(undefined, 3)).toEqual({ status: "missing", usableItems: 0, detail: "missing" });
    expect(checkExpressionsSection({ items: [] }, 3)).toEqual({ status: "broken", usableItems: 0, detail: "no expressions" });
    expect(checkExpressionsSection({ items: [{ expression: "x" }] }, 3)).toEqual({
      status: "broken",
      usableItems: 0,
      detail: "no usable expressions (1 unusable)",
    });
  });
});

describe("adding the expressions section", () => {
  it("leaves the lesson untouched when the switch is off", async () => {
    const lesson = lessonWithReading();
    const { calls, writer } = stubWriter(reply());

    const report = await add(lesson, writer, OFF);

    expect(calls).toEqual([]);
    expect(report.outcome).toBe("not requested");
    expect(lesson).toEqual(lessonWithReading());
  });

  it("is never offered for A1", async () => {
    const lesson = lessonWithReading();
    const { calls, writer } = stubWriter(reply());

    const report = await add(lesson, writer, { ...ON, cefrLevel: "A1" });

    expect(calls).toEqual([]);
    expect(report.outcome).toBe("not requested");
    expect(lesson).toEqual(lessonWithReading());
  });

  it("adds the section after the vocabulary check and its question at the end of the quiz", async () => {
    const lesson = lessonWithReading();
    const { calls, writer } = stubWriter(reply(3));

    const report = await add(lesson, writer, ON, ["habit"]);

    expect(calls).toEqual([{ lesson: lessonSectionContext(lessonWithReading()), studentVocabulary: ["habit"], model: "test-model" }]);
    expect(report).toMatchObject({ outcome: "added", retried: false, quizQuestionAdded: true, fixedInPlace: [] });
    expect(types(lesson)).toEqual([
      "warmup", "reading", "vocabulary", "comprehension", "expressions",
      "sentenceFrames", "cloze", "sentenceUnscramble", "discussion", "quiz",
    ]);
    expect(sectionOf(lesson, "expressions")).toEqual({
      type: "expressions",
      title: "Phrasal Verbs & Expressions",
      items: expressionItemsOf(reply(3)),
    });
    const quiz = sectionOf(lesson, "quiz").questions;
    expect(quiz).toHaveLength(6);
    expect(quiz[5]).toEqual(QUIZ_QUESTION);
    expect(logs.log).toContain("[Job test] Lesson check: idioms and phrasal verbs section added (3 expressions, plus a quiz question)");
    expect(logs.warn).toEqual([]);
    expect(logs.error).toEqual([]);
  });

  it("uses the level's title and number of expressions", async () => {
    const lesson = lessonWithReading();
    const { writer } = stubWriter(reply(4));

    await add(lesson, writer, { ...ON, cefrLevel: "C1" });

    const section = sectionOf(lesson, "expressions");
    expect(section.title).toBe("Idioms & Phrasal Verbs");
    expect(section.items).toHaveLength(4);
  });

  it("asks once more when the section is short and uses the better version", async () => {
    const lesson = lessonWithReading();
    const { calls, writer } = stubWriter(reply(1), reply(3));

    const report = await add(lesson, writer);

    expect(calls).toHaveLength(2);
    expect(report).toMatchObject({ outcome: "added", retried: true });
    expect(sectionOf(lesson, "expressions").items).toHaveLength(3);
    expect(logs.warn).toEqual([
      "[Job test] Lesson check: idioms and phrasal verbs section is incomplete (1 of 3 expressions) — requesting this section again",
    ]);
  });

  it("keeps a short section when the retry is no better, and logs the failure", async () => {
    const lesson = lessonWithReading();
    const { writer } = stubWriter(reply(2), new Error("timeout of 60000ms exceeded"));

    const report = await add(lesson, writer);

    expect(report.outcome).toBe("added incomplete");
    expect(sectionOf(lesson, "expressions").items).toHaveLength(2);
    expect(logs.error).toEqual([
      "[Job test] Lesson repair FAILED for the idioms and phrasal verbs section: the first request was incomplete: 2 of 3 expressions; the retry failed: timeout of 60000ms exceeded. Keeping the first version, which has 2 of 3 expressions.",
    ]);
  });

  it("saves the lesson without the section when both requests fail", async () => {
    const lesson = lessonWithReading();
    const { calls, writer } = stubWriter(new Error("Request failed with status code 502"), { type: "expressions", items: [] });

    const report = await add(lesson, writer);

    expect(calls).toHaveLength(2);
    expect(report.outcome).toBe("left out");
    expect(lesson).toEqual(lessonWithReading());
    expect(logs.error).toEqual([
      "[Job test] Lesson repair FAILED for the idioms and phrasal verbs section: the first request failed: Request failed with status code 502; the retry was broken: no expressions. The lesson is saved without this section.",
    ]);
  });

  it("fixes a quiz question that gives its answer as a letter", async () => {
    const lesson = lessonWithReading();
    const { writer } = stubWriter(reply(3, { quizQuestion: { ...QUIZ_QUESTION, answer: "A", correctAnswer: "A" } }));

    const report = await add(lesson, writer);

    expect(report.quizQuestionAdded).toBe(true);
    expect(sectionOf(lesson, "quiz").questions[5].correctAnswer).toBe("to do something later");
  });

  it("leaves the quiz alone when its question could not be marked", async () => {
    const lesson = lessonWithReading();
    const { writer } = stubWriter(reply(3, { quizQuestion: { ...QUIZ_QUESTION, answer: "maybe", correctAnswer: "maybe" } }));

    const report = await add(lesson, writer);

    expect(report).toMatchObject({ outcome: "added", quizQuestionAdded: false });
    expect(sectionOf(lesson, "quiz").questions).toEqual(sectionOf(lessonWithReading(), "quiz").questions);
  });

  it("puts the section in place when some sections were left out", async () => {
    const lesson = lessonWithReading();
    lesson.sections = lesson.sections.filter((section) => section.type !== "comprehension" && section.type !== "quiz");
    const { writer } = stubWriter(reply(3));

    const report = await add(lesson, writer);

    expect(report.quizQuestionAdded).toBe(false);
    expect(types(lesson)).toEqual(["warmup", "reading", "vocabulary", "expressions", "sentenceFrames", "cloze", "sentenceUnscramble", "discussion"]);
  });
});

describe("OpenRouter expressions request", () => {
  const response = (content: string | null) => ({ status: 200, data: { choices: [{ message: { content } }] } });

  it("sends the expressions prompt with the lesson's model and settings", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValue(response("```json\n{\"type\": \"expressions\", \"items\": []}\n```"));
    const lesson = lessonSectionContext(lessonWithReading());

    const result = await new OpenRouterService("test-key").writeExpressionsSection(ON, lesson, ["habit"], "z-ai/glm-5.3-flash");

    expect(result).toEqual({ type: "expressions", items: [] });
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(body).toEqual({
      model: "z-ai/glm-5.3-flash",
      messages: [{ role: "user", content: buildExpressionsPrompt(ON, lesson, ["habit"]) }],
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: 16384,
      reasoning: { effort: "low" },
    });
    expect(config).toMatchObject({ timeout: 60000, headers: { Authorization: "Bearer test-key" } });
  });

  it("fails when the reply is empty", async () => {
    vi.spyOn(axios, "post").mockResolvedValue(response(null));
    await expect(
      new OpenRouterService("test-key").writeExpressionsSection(ON, lessonSectionContext(lessonWithReading())),
    ).rejects.toThrow("The idioms and phrasal verbs section request returned no content");
  });
});

describe("lesson generation with the idioms and phrasal verbs switch", () => {
  const response = (content: unknown) => ({ status: 200, data: { choices: [{ message: { content: JSON.stringify(content) } }] } });

  it("makes one request and adds no section when the switch is off", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValueOnce(response(lessonWithReading()));

    const result = await new OpenRouterService("test-key").generateLesson(OFF);

    expect(post).toHaveBeenCalledTimes(1);
    expect(types(result)).toEqual([...LESSON_SECTION_TYPES]);
    expect(sectionOf(result, "quiz").questions).toHaveLength(5);
  });

  it("writes the section with a second request when the switch is on", async () => {
    const post = vi
      .spyOn(axios, "post")
      .mockResolvedValueOnce(response(lessonWithReading()))
      .mockResolvedValueOnce(response(reply(3)));

    const result = await new OpenRouterService("test-key").generateLesson(ON, [], "z-ai/glm-5.3-flash", { logPrefix: "[Job 42]" });

    expect(post).toHaveBeenCalledTimes(2);
    const request = post.mock.calls[1][1] as { messages: { content: string }[] };
    expect(request.messages[0].content).toContain('Write the "Phrasal Verbs & Expressions" section of this lesson');
    expect(request.messages[0].content).toContain(READING[2]);
    expect(types(result)).toEqual([
      "warmup", "reading", "vocabulary", "comprehension", "expressions",
      "sentenceFrames", "cloze", "sentenceUnscramble", "discussion", "quiz",
    ]);
    expect(sectionOf(result, "quiz").questions).toHaveLength(6);
    expect(logs.log).toContain("[Job 42] Lesson check: idioms and phrasal verbs section added (3 expressions, plus a quiz question)");
  });

  it("returns the lesson without the section when the expressions requests fail", async () => {
    vi.spyOn(axios, "post")
      .mockResolvedValueOnce(response(lessonWithReading()))
      .mockRejectedValueOnce(new Error("Request failed with status code 502"))
      .mockRejectedValueOnce(new Error("Request failed with status code 502"));

    const result = await new OpenRouterService("test-key").generateLesson(ON);

    expect(types(result)).toEqual([...LESSON_SECTION_TYPES]);
    expect(sectionOf(result, "quiz").questions).toHaveLength(5);
    expect(logs.error.some((line) => line.includes("Lesson repair FAILED for the idioms and phrasal verbs section"))).toBe(true);
  });
});
