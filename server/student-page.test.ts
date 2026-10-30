// @vitest-environment node
//
// What a student's own page shows (shared/student-page.ts): lessons without
// anything written for the teacher, planned lessons without their activities,
// the home summary, the word list, and flashcards in practice order.
import { describe, it, expect } from "vitest";
import {
  buildStudentPageHome,
  buildStudentWords,
  pickFlashcards,
  studentLessonContent,
  teacherFirstName,
  toFlashcard,
  withStudentImageUrls,
  withoutTeacherContent,
} from "./student-page";
import { nextPractice, wordStatusOf, PRACTICE_INTERVAL_DAYS } from "@shared/student-page";

const NOW = new Date("2026-10-30T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

const LESSON = {
  title: "Working from Home",
  level: "B2",
  teacherNotes: "Shingo is shy; start slowly",
  sections: [
    { type: "warmup", questions: ["Q1?"], procedure: "Ask Shingo about his job at the bank", teacherNotes: "warm-up tip" },
    { type: "reading", paragraphs: ["Paragraph one."], teacherNotes: "Read it aloud" },
    {
      type: "vocabulary",
      words: [{ term: "commute", definition: "the journey to work", teachingTips: "Mime it", imageUrl: "/api/images/lesson-images/42/abc.png" }],
    },
    { type: "expressions", title: "Idioms & Phrasal Verbs", items: [] },
    { type: "sentenceFrames", pedagogicalFrames: [{ teachingNotes: { modelingTips: "Model it" } }] },
    { type: "quiz", questions: [{ question: "Q?", answer: "A" }] },
    { type: "notes", content: "Private teacher notes" },
  ],
};

describe("what a student sees of a lesson", () => {
  it("drops the teacher notes section and every field written for the teacher", () => {
    const visible = JSON.stringify(withoutTeacherContent(LESSON));
    for (const hidden of ["teacherNotes", "procedure", "teachingTips", "teachingNotes", "Private teacher notes", "bank"]) {
      expect(visible).not.toContain(hidden);
    }
    expect(visible).toContain("Paragraph one.");
    expect(visible).toContain("the journey to work");
  });

  it("shows a finished lesson whole, apart from the teacher's parts", () => {
    const { content, lockedActivities } = studentLessonContent(LESSON, true);
    expect((content.sections as Array<{ type: string }>).map((s) => s.type))
      .toEqual(["warmup", "reading", "vocabulary", "expressions", "sentenceFrames", "quiz"]);
    expect(lockedActivities).toEqual([]);
  });

  it("shows only the reading and new words of a planned lesson, naming the activities kept for class", () => {
    const { content, lockedActivities } = studentLessonContent(LESSON, false);
    expect((content.sections as Array<{ type: string }>).map((s) => s.type)).toEqual(["reading", "vocabulary"]);
    expect(JSON.stringify(content)).not.toContain("Q?");
    expect(lockedActivities).toEqual(["Warm-up", "Idioms & Phrasal Verbs", "Sentence frames", "Quiz"]);
  });

  it("points stored pictures at the student page and drops any other picture link", () => {
    const content = withStudentImageUrls(
      { sections: [{ words: [{ imageUrl: "/api/images/lesson-images/42/abc.png" }, { imageUrl: "https://example.com/x.png" }] }] },
      (key) => `/page/${key}`,
    ) as { sections: Array<{ words: Array<{ imageUrl: string | null }> }> };
    expect(content.sections[0].words.map((w) => w.imageUrl)).toEqual(["/page/lesson-images/42/abc.png", null]);
  });
});

const word = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  lessonId: 7,
  word: "commute",
  definition: "the journey to work",
  kind: "word",
  learnedAt: new Date("2026-10-01T00:00:00Z"),
  originLessonTitle: null,
  practiceLevel: 0,
  nextPracticeAt: null,
  lastPractisedAt: null,
  ...overrides,
}) as any;

describe("the student's home page", () => {
  it("splits planned and finished lessons, counts words and idioms, and counts the cards ready", () => {
    const home = buildStudentPageHome({
      student: { name: "Shingo", cefrLevel: "B2" },
      teacherName: "Dave",
      now: NOW,
      assignments: [
        { lessonId: 7, status: "completed", assignedAt: "2026-10-01T00:00:00Z", completedAt: "2026-10-02T00:00:00Z", lesson: { title: "Working from Home", cefrLevel: "B2" } },
        { lessonId: 8, status: "assigned", assignedAt: "2026-10-29T00:00:00Z", completedAt: null, lesson: { title: "Job Interviews", cefrLevel: "B2" } },
        { lessonId: 9, status: "completed", assignedAt: "2026-10-10T00:00:00Z", completedAt: "2026-10-12T00:00:00Z", lesson: { title: "Weekend Trip", cefrLevel: "B2" } },
      ],
      vocabulary: [
        word({ id: 1 }),
        word({ id: 2, word: "put off", kind: "phrasal verb", lastPractisedAt: NOW, practiceLevel: 0, nextPracticeAt: NOW }),
        word({ id: 3, word: "budget", lessonId: 9, lastPractisedAt: NOW, practiceLevel: 2, nextPracticeAt: new Date(NOW.getTime() + 3 * DAY) }),
      ],
    });
    expect(home.stats).toEqual({ lessonsDone: 2, words: 2, expressions: 1 });
    expect(home.comingUp.map((l) => l.title)).toEqual(["Job Interviews"]);
    expect(home.finished.map((l) => l.title)).toEqual(["Weekend Trip", "Working from Home"]);
    expect(home.finished[1]).toMatchObject({ id: 7, words: 1, expressions: 1, date: "2026-10-02T00:00:00.000Z" });
    expect(home.practice).toEqual({ due: 2, new: 1, again: 1 });
  });

  it("uses only the first word of the teacher's name", () => {
    expect(teacherFirstName("  Dave   Jackson ")).toBe("Dave");
    expect(teacherFirstName("")).toBeNull();
    expect(teacherFirstName(null)).toBeNull();
  });
});

describe("the student's words", () => {
  it("lists every word newest first, with its lesson, kind and practice status", () => {
    const words = buildStudentWords(
      [
        word({ id: 1, learnedAt: new Date("2026-10-01T00:00:00Z") }),
        word({ id: 2, word: "call it a day", kind: "idiom", lessonId: null, originLessonTitle: "Deleted lesson", learnedAt: new Date("2026-10-05T00:00:00Z"), lastPractisedAt: NOW, practiceLevel: 1 }),
        word({ id: 3, word: "budget", kind: null, learnedAt: new Date("2026-10-03T00:00:00Z"), lastPractisedAt: NOW, practiceLevel: 0 }),
      ],
      new Map([[7, "Working from Home"]]),
    );
    expect(words.map((w) => [w.word, w.kind, w.lessonTitle, w.status])).toEqual([
      ["call it a day", "idiom", "Deleted lesson", "known"],
      ["budget", "word", "Working from Home", "practising"],
      ["commute", "word", "Working from Home", "new"],
    ]);
  });
});

describe("flashcards", () => {
  it("shows the words marked \"Not yet\" first, then new words, then words due for review, leaving the rest for later", () => {
    const { rows, due } = pickFlashcards([
      word({ id: 1, word: "later", lastPractisedAt: NOW, practiceLevel: 3, nextPracticeAt: new Date(NOW.getTime() + DAY) }),
      word({ id: 2, word: "review", lastPractisedAt: NOW, practiceLevel: 1, nextPracticeAt: new Date(NOW.getTime() - DAY) }),
      word({ id: 3, word: "old new", learnedAt: new Date("2026-10-01T00:00:00Z") }),
      word({ id: 4, word: "again", lastPractisedAt: new Date(NOW.getTime() - DAY), practiceLevel: 0, nextPracticeAt: new Date(NOW.getTime() - DAY) }),
      word({ id: 5, word: "newest", learnedAt: new Date("2026-10-20T00:00:00Z") }),
    ], NOW);
    expect(rows.map((r) => r.word)).toEqual(["again", "newest", "old new", "review"]);
    expect(due).toBe(4);
  });

  it("fills a card from its lesson and sends its picture through the student page", () => {
    const card = toFlashcard(
      word(),
      { term: "commute", example: " My commute is long. ", partOfSpeech: "noun", imageUrl: "/api/images/lesson-images/7/a.png" },
      "Working from Home",
      (lessonId, key) => `/api/student-page/code/lessons/${lessonId}/images/${key}`,
    );
    expect(card).toEqual({
      id: 1,
      word: "commute",
      meaning: "the journey to work",
      kind: "word",
      example: "My commute is long.",
      partOfSpeech: "noun",
      lessonTitle: "Working from Home",
      imageUrl: "/api/student-page/code/lessons/7/images/lesson-images/7/a.png",
    });
    expect(toFlashcard(word(), undefined, null, () => "x")).toMatchObject({ example: null, imageUrl: null });
  });

  it("moves a word up a level with each \"Got it\" and back to the start with \"Not yet\"", () => {
    const got = nextPractice(0, "got", NOW);
    expect(got.practiceLevel).toBe(1);
    expect(got.nextPracticeAt.getTime() - NOW.getTime()).toBe(PRACTICE_INTERVAL_DAYS[1] * DAY);
    expect(nextPractice(5, "got", NOW).practiceLevel).toBe(5);
    expect(nextPractice(3, "again", NOW)).toEqual({ practiceLevel: 0, nextPracticeAt: NOW });
    expect(wordStatusOf({ practiceLevel: 0, lastPractisedAt: null })).toBe("new");
    expect(wordStatusOf({ practiceLevel: 0, lastPractisedAt: NOW })).toBe("practising");
    expect(wordStatusOf({ practiceLevel: 2, lastPractisedAt: NOW })).toBe("known");
  });
});
