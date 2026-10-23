import { describe, it, expect } from "vitest";
import {
  checkLesson,
  checkLessonSection,
  findSection,
  fixLessonInPlace,
  fixSection,
  lessonSectionContext,
  targetWordsOf,
} from "./lesson-check";
import { CLOZE_TEXT, TARGET_WORDS, choiceQuestion, completeLesson, range, sectionOf, sentenceFrame } from "./lesson-check.fixture";

const check = (lesson: ReturnType<typeof completeLesson>, type: Parameters<typeof checkLessonSection>[0]) =>
  checkLessonSection(type, findSection(lesson, type));

/** Fixes the section like a new lesson, then checks it. */
const fixAndCheck = (lesson: ReturnType<typeof completeLesson>, type: Parameters<typeof checkLessonSection>[0]) => {
  const fixes = fixSection(type, sectionOf(lesson, type));
  return { fixes, result: check(lesson, type) };
};

describe("lesson check", () => {
  it("passes a complete lesson and changes nothing", () => {
    const lesson = completeLesson();
    expect(fixLessonInPlace(lesson)).toEqual([]);
    expect(lesson).toEqual(completeLesson());
    expect(checkLesson(lesson).map((result) => result.status)).toEqual(Array(9).fill("ok"));
  });

  it("finds a missing section", () => {
    const lesson = completeLesson();
    lesson.sections = lesson.sections.filter((section) => section.type !== "vocabulary");
    expect(check(lesson, "vocabulary")).toMatchObject({ status: "missing", usableItems: 0 });
  });

  it.each([
    ["vocabulary", "words", 4, "4 of 5 words"],
    ["sentenceFrames", "pedagogicalFrames", 1, "1 of 3 frames"],
    ["discussion", "questions", 3, "3 of 5 questions"],
    ["quiz", "questions", 2, "2 of 5 questions"],
  ] as const)("counts the items in the %s section", (type, key, keep, detail) => {
    const lesson = completeLesson();
    sectionOf(lesson, type)[key] = sectionOf(lesson, type)[key].slice(0, keep);
    expect(check(lesson, type)).toEqual({ type, status: "incomplete", usableItems: keep, detail });

    sectionOf(lesson, type)[key] = [];
    expect(check(lesson, type).status).toBe("broken");
  });

  it("only needs one usable item in sections without a set count", () => {
    const lesson = completeLesson();
    sectionOf(lesson, "warmup").questions = ["Just one?"];
    sectionOf(lesson, "reading").paragraphs = ["Just one paragraph."];
    sectionOf(lesson, "sentenceUnscramble").sentences.splice(1);
    for (const type of ["warmup", "reading", "sentenceUnscramble"] as const) expect(check(lesson, type).status).toBe("ok");

    sectionOf(lesson, "reading").paragraphs = ["", "  "];
    expect(fixAndCheck(lesson, "reading").result).toMatchObject({ status: "broken", detail: "no paragraphs" });
  });

  it("removes items the lesson page cannot show and counts what is left", () => {
    const lesson = completeLesson();
    const frames = sectionOf(lesson, "sentenceFrames").pedagogicalFrames;
    delete frames[1].grammarFocus; // the page crashes without it
    delete frames[2].tieredFrames.expanding;
    sectionOf(lesson, "vocabulary").words[4].definition = "";
    sectionOf(lesson, "discussion").questions[0] = "A plain string question?"; // the page skips these

    const fixes = fixLessonInPlace(lesson);
    expect(fixes).toEqual([
      "vocabulary: removed 1 unusable word",
      "sentence frames: removed 2 unusable frames",
      "discussion questions: removed 1 unusable question",
    ]);
    expect(check(lesson, "sentenceFrames")).toMatchObject({ status: "incomplete", usableItems: 1, detail: "1 of 3 frames" });
    expect(check(lesson, "vocabulary").detail).toBe("4 of 5 words");
    expect(check(lesson, "discussion").detail).toBe("4 of 5 questions");
  });

  it("sets the sentence frames format version when it is missing", () => {
    const lesson = completeLesson();
    delete sectionOf(lesson, "sentenceFrames").version;
    expect(fixAndCheck(lesson, "sentenceFrames")).toEqual({
      fixes: ["sentence frames: set the missing format version"],
      result: expect.objectContaining({ status: "ok" }),
    });
    expect(sectionOf(lesson, "sentenceFrames").version).toBe("v2_pedagogical");
  });
});

describe("fill-in-the-blank check", () => {
  const withText = (text: string, wordBank = TARGET_WORDS) => {
    const lesson = completeLesson();
    Object.assign(sectionOf(lesson, "cloze"), { text, wordBank: [...wordBank] });
    return lesson;
  };

  it("accepts five gaps that each have their own word-bank word, word forms included", () => {
    const text = CLOZE_TEXT.replace("[1:commute]", "[1:commuting]").replace("[2:deadline]", "[2:deadline]s");
    expect(check(withText(text), "cloze")).toEqual({ type: "cloze", status: "ok", usableItems: 5, detail: "5 gaps" });
  });

  it("finds gaps written as underscores", () => {
    const text = CLOZE_TEXT.replace(/\[(\d):[a-z]+\]/g, "[$1:___]");
    expect(check(withText(text), "cloze")).toMatchObject({
      status: "broken",
      detail: "no word-bank word fits [5:___], [1:___], [3:___], [2:___], [4:___]",
    });
  });

  it("finds empty gap markers, which the exercise does not show as gaps", () => {
    const text = CLOZE_TEXT.replace(/\[(\d):[a-z]+\]/g, "[$1:]");
    expect(check(withText(text), "cloze")).toMatchObject({ status: "broken", detail: 'no gaps, only 5 empty markers like "[1:]"' });
    expect(check(withText("A paragraph with no gaps at all."), "cloze")).toMatchObject({ status: "broken", detail: "no gaps in the text" });
  });

  it("finds a gap number used twice", () => {
    const text = CLOZE_TEXT.replace("[4:balance]", "[2:balance]");
    expect(check(withText(text), "cloze")).toMatchObject({ status: "broken", detail: "gap 2 appears twice" });
  });

  it("finds two gaps that need the same word, since a placed word can't be used again", () => {
    const text = CLOZE_TEXT.replace("[4:balance]", "[4:routine]");
    expect(check(withText(text), "cloze")).toMatchObject({ status: "broken", detail: "two gaps need the same word-bank word" });
  });

  it("finds a gap whose answer is not in the word bank", () => {
    const text = CLOZE_TEXT.replace("[4:balance]", "[4:boost]");
    expect(check(withText(text), "cloze")).toMatchObject({ status: "broken", detail: "no word-bank word fits [4:boost]" });
  });

  it("finds a missing or repeated word bank", () => {
    expect(check(withText(CLOZE_TEXT, []), "cloze")).toMatchObject({ status: "broken", detail: "no word bank" });
    expect(check(withText(CLOZE_TEXT, [...TARGET_WORDS, "Routine"]), "cloze")).toMatchObject({
      status: "broken",
      detail: "the word bank lists a word twice",
    });
  });

  it("counts fewer than five gaps as incomplete", () => {
    const text = CLOZE_TEXT.replace("[4:balance]", "balance");
    expect(check(withText(text), "cloze")).toEqual({ type: "cloze", status: "incomplete", usableItems: 4, detail: "4 gaps instead of 5" });
  });

  it("uses gapped text from another field when the text has no gaps", () => {
    const lesson = withText("Read the paragraph and fill in the blanks.");
    sectionOf(lesson, "cloze").activity = { instructions: "Drag the words", cloze: CLOZE_TEXT };

    expect(fixAndCheck(lesson, "cloze")).toEqual({
      fixes: ['fill-in-the-blank: used the gapped text from "activity.cloze" in place of "text", which was broken (no gaps in the text)'],
      result: expect.objectContaining({ status: "ok", usableItems: 5 }),
    });
    expect(sectionOf(lesson, "cloze").text).toBe(CLOZE_TEXT);
  });

  it("does not use an answer list as the text", () => {
    const lesson = withText("Read the paragraph and fill in the blanks.");
    sectionOf(lesson, "cloze").teacherNotes = "Answers: [1:commute], [2:deadline], [3:flexible], [4:balance], [5:routine]";
    expect(fixAndCheck(lesson, "cloze")).toEqual({ fixes: [], result: expect.objectContaining({ status: "broken" }) });
  });

  it("leaves good text alone even when another field repeats it", () => {
    const lesson = completeLesson();
    sectionOf(lesson, "cloze").answerKey = CLOZE_TEXT.replace("[4:balance]", "[4:balance] [6:routine]");
    expect(fixAndCheck(lesson, "cloze").fixes).toEqual([]);
    expect(sectionOf(lesson, "cloze").text).toBe(CLOZE_TEXT);
  });
});

describe("quiz and vocabulary check answers", () => {
  it("turns a letter answer into the option text", () => {
    const lesson = completeLesson();
    Object.assign(sectionOf(lesson, "quiz").questions[0], { correctAnswer: "B", answer: undefined });
    Object.assign(sectionOf(lesson, "comprehension").questions[2], { correctAnswer: "C" });

    expect(fixLessonInPlace(lesson)).toEqual([
      'vocabulary check: the correct answer to question 3 was not one of its options; set it to "Third option"',
      'quiz: the correct answer to question 1 was not one of its options; set it to "Second option"',
    ]);
    expect(sectionOf(lesson, "quiz").questions[0]).toMatchObject({ correctAnswer: "Second option", answer: "Second option" });
    expect(checkLesson(lesson).every((result) => result.status === "ok")).toBe(true);
  });

  it("leaves a question alone when its marked answer is one of the options", () => {
    const lesson = completeLesson();
    sectionOf(lesson, "quiz").questions[0].answer = "First option"; // the page reads correctAnswer first
    expect(fixLessonInPlace(lesson)).toEqual([]);
  });

  it("accepts true/false quiz questions without options, which the quiz shows as True and False", () => {
    const lesson = completeLesson();
    sectionOf(lesson, "quiz").questions[0] = { question: "Is it true?", answer: "False", correctAnswer: "False" };
    expect(fixAndCheck(lesson, "quiz").result.status).toBe("ok");

    // The vocabulary check shows no buttons for a question without options.
    sectionOf(lesson, "comprehension").questions[0] = { question: "Is it true?", answer: "False", correctAnswer: "False" };
    expect(fixAndCheck(lesson, "comprehension")).toEqual({
      fixes: ["vocabulary check: removed 1 unusable question"],
      result: expect.objectContaining({ status: "ok", detail: "4 questions" }),
    });
  });

  it("removes a question whose answer is not an option", () => {
    const lesson = completeLesson();
    sectionOf(lesson, "quiz").questions[4] = { ...choiceQuestion(5), answer: "Something else", correctAnswer: "Something else" };
    expect(fixAndCheck(lesson, "quiz")).toEqual({
      fixes: ["quiz: removed 1 unusable question"],
      result: expect.objectContaining({ status: "incomplete", detail: "4 of 5 questions" }),
    });
  });
});

describe("sentence unscramble", () => {
  it.each([
    ["a missing word", ["My", "commute", "long"]],
    ["words split differently", ["My", "com", "mute", "is", "long"]],
    ["an extra word", ["My", "commute", "is", "very", "long"]],
  ])("rebuilds the words from the correct sentence when there is %s", (_, words) => {
    const lesson = completeLesson();
    sectionOf(lesson, "sentenceUnscramble").sentences[0].words = words;

    expect(fixAndCheck(lesson, "sentenceUnscramble")).toEqual({
      fixes: ["sentence unscramble: rebuilt the words of sentence 1 from its correct sentence"],
      result: expect.objectContaining({ status: "ok", usableItems: 3 }),
    });
    expect(sectionOf(lesson, "sentenceUnscramble").sentences[0].words).toEqual(["My", "commute", "is", "long"]);
  });

  it("keeps punctuation inside the sentence and drops it from the end", () => {
    const lesson = completeLesson();
    sectionOf(lesson, "sentenceUnscramble").sentences[0] = { words: [], correctSentence: "Well,  it's a well-known  route!" };
    fixSection("sentenceUnscramble", sectionOf(lesson, "sentenceUnscramble"));
    expect(sectionOf(lesson, "sentenceUnscramble").sentences[0]).toEqual({
      words: ["Well,", "it's", "a", "well-known", "route"],
      correctSentence: "Well, it's a well-known route!",
    });
  });
});

describe("lesson context for a new section", () => {
  it("reads the target words, the reading text and the discussion questions", () => {
    expect(lessonSectionContext(completeLesson())).toEqual({
      title: "Getting to Work",
      targetWords: TARGET_WORDS,
      readingParagraphs: range(5).map((n) => `Paragraph ${n}.`),
      discussionQuestions: range(5).map((n) => `Discussion question ${n}?`),
    });
  });

  it("takes the target words from the warm-up or the word bank when the vocabulary lacks them", () => {
    const lesson = completeLesson();
    sectionOf(lesson, "vocabulary").words.splice(2);
    expect(targetWordsOf(lesson)).toEqual(TARGET_WORDS);

    lesson.sections = lesson.sections.filter((section) => section.type !== "vocabulary");
    sectionOf(lesson, "warmup").targetVocabulary = [];
    sectionOf(lesson, "cloze").wordBank = ["routine", "commute", "deadline", "flexible", "balance"];
    expect(targetWordsOf(lesson)).toEqual(["routine", "commute", "deadline", "flexible", "balance"]);

    sectionOf(lesson, "cloze").wordBank = [];
    expect(targetWordsOf(lesson)).toEqual([]);
  });

  it("counts a word without a definition as a target word", () => {
    const lesson = completeLesson();
    sectionOf(lesson, "vocabulary").words[0].definition = "";
    sectionOf(lesson, "warmup").targetVocabulary = [];
    expect(targetWordsOf(lesson)).toEqual(TARGET_WORDS);
  });

  it("keeps the frames a lesson already has when there are more than three", () => {
    const lesson = completeLesson();
    sectionOf(lesson, "sentenceFrames").pedagogicalFrames = range(4).map(sentenceFrame);
    expect(check(lesson, "sentenceFrames")).toMatchObject({ status: "ok", detail: "4 frames" });
  });
});
