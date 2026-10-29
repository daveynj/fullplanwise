/**
 * The idioms & phrasal verbs tab: one expression at a time, meaning hidden
 * until the teacher shows it. Only lessons generated with the switch have the
 * section; every other lesson keeps exactly the tabs it had.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { createElement as h } from "react";
import { ExpressionsSection } from "@/components/lesson/expressions-section";
import { LessonContent } from "@/components/lesson/lesson-content";

const SECTION = {
  type: "expressions",
  title: "Idioms & Phrasal Verbs",
  items: [
    {
      expression: "put off",
      kind: "phrasal verb",
      fromText: "Some days he **puts off** small jobs.",
      meaning: "to decide to do something later",
      similar: "postpone",
      example: "I always **put off** going to the dentist.",
      notes: [{ text: "You can split it:", right: "put it off", wrong: "put off it" }],
      tone: "",
      yourTurn: "What do you often put off?",
    },
    {
      expression: "call it a day",
      kind: "idiom",
      fromText: "",
      meaning: "to stop working for the day",
      similar: "",
      example: "We were tired, so we **called it a day**.",
      notes: [],
      tone: "informal",
      yourTurn: "When do you usually call it a day?",
    },
  ],
};

beforeEach(() => {
  // The lesson page logs every step of reading a lesson.
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ExpressionsSection", () => {
  it("shows the sentence from the reading and keeps the meaning hidden until asked", () => {
    const { container } = render(h(ExpressionsSection, { section: SECTION }));

    expect(screen.getByRole("heading", { name: "Idioms & Phrasal Verbs" })).toBeTruthy();
    expect(screen.getByText("Expression 1 of 2")).toBeTruthy();
    expect(screen.getByText("From the reading")).toBeTruthy();
    expect(container.textContent).toContain("“Some days he puts off small jobs.”");
    expect(screen.getByText("puts off").className).toContain("text-pink-700");
    expect(screen.queryByText("to decide to do something later")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show meaning" }));

    expect(screen.getByText("to decide to do something later")).toBeTruthy();
    expect(screen.getByText("postpone")).toBeTruthy();
    expect(container.textContent).toContain("I always put off going to the dentist.");
    expect(container.textContent).toContain("Correct: put it off");
    expect(container.textContent).toContain("Wrong: put off it");
    expect(screen.getByText("Your turn")).toBeTruthy();
    expect(screen.getByText("What do you often put off?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hide meaning" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("hides the meaning again for the next expression, and uses the example when it is not in the reading", () => {
    const { container } = render(h(ExpressionsSection, { section: SECTION }));
    fireEvent.click(screen.getByRole("button", { name: "Show meaning" }));

    fireEvent.click(screen.getByRole("button", { name: "call it a day" }));

    expect(screen.getByText("Expression 2 of 2")).toBeTruthy();
    expect(screen.queryByText("to stop working for the day")).toBeNull();
    expect(screen.getByText("In a sentence")).toBeTruthy();
    expect(container.textContent).toContain("“We were tired, so we called it a day.”");
    expect(screen.getByText("Idiom")).toBeTruthy();
    expect(screen.getByText("Informal")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Next expression/ }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Show meaning" }));
    expect(screen.getByText("to stop working for the day")).toBeTruthy();
    expect(screen.queryByText("Example")).toBeNull();
    expect(screen.queryByText("Good to know")).toBeNull();
  });

  it("says so when the section has no usable expressions", () => {
    render(h(ExpressionsSection, { section: { type: "expressions", items: [{ expression: "put off" }] } }));
    expect(screen.getByText("No idioms or phrasal verbs available")).toBeTruthy();
  });
});

describe("lesson tabs", () => {
  const lesson = (extraSections: Record<string, unknown>[] = []) => ({
    title: "Getting to Work",
    level: "B2",
    focus: "general",
    estimatedTime: 60,
    sections: [
      { type: "warmup", questions: ["How do you get to work?"], targetVocabulary: ["commute"] },
      { type: "reading", paragraphs: ["Sam puts off small jobs."] },
      { type: "vocabulary", words: [{ term: "commute", partOfSpeech: "noun", definition: "a journey to work", example: "My commute is long." }] },
      { type: "comprehension", questions: [{ question: "What is a commute?", options: ["A trip", "A meal"], answer: "A trip", correctAnswer: "A trip" }] },
      ...extraSections,
      {
        type: "sentenceFrames",
        version: "v2_pedagogical",
        pedagogicalFrames: [
          {
            languageFunction: "Giving opinions",
            grammarFocus: ["present simple"],
            tieredFrames: { emerging: { frame: "I like ___." }, developing: { frame: "I like ___ because ___." }, expanding: { frame: "What I enjoy is ___." } },
            modelResponses: { emerging: ["I like trains."], developing: ["I like trains because they are fast."], expanding: ["What I enjoy is reading."] },
            teachingNotes: { modelingTips: "Model it", guidedPractice: "Practise", independentUse: "Use it", fadingStrategy: "Fade" },
          },
        ],
      },
      { type: "cloze", text: "My [1:commute] is long.", wordBank: ["commute"] },
      { type: "sentenceUnscramble", sentences: [{ words: ["My", "commute", "is", "long"], correctSentence: "My commute is long." }] },
      { type: "discussion", questions: [{ question: "Would you like a shorter commute?" }] },
      { type: "quiz", questions: [{ question: "Is a commute a journey?", options: ["True", "False"], answer: "True", correctAnswer: "True" }] },
    ],
  });

  const tabNames = () => screen.getAllByRole("tab").map((tab) => tab.textContent?.trim());

  const EXISTING_TABS = [
    "Warmup", "Vocab Intro", "Reading", "Vocabulary", "Comprehension",
    "Sentence Frames", "Fill in the Blanks", "Sentence Unscramble", "Discussion", "Quiz",
  ];

  it("keeps a lesson without the section exactly as it was", () => {
    render(h(LessonContent, { content: lesson() }));
    expect(tabNames()).toEqual(EXISTING_TABS);
    expect(screen.getByText("Section 1 of 10")).toBeTruthy();
  });

  it("adds the section's tab between Comprehension and Sentence Frames", () => {
    render(h(LessonContent, { content: lesson([SECTION]) }));
    expect(tabNames()).toEqual([
      "Warmup", "Vocab Intro", "Reading", "Vocabulary", "Comprehension", "Idioms & Phrasal Verbs",
      "Sentence Frames", "Fill in the Blanks", "Sentence Unscramble", "Discussion", "Quiz",
    ]);
    expect(screen.getByText("Section 1 of 11")).toBeTruthy();
  });
});
