import { describe, it, expect, vi } from "vitest";

vi.mock("./storage", () => ({
  storage: {
    getLesson: vi.fn(),
    getLessonByPublicSlug: vi.fn(),
    getPublicLessonSummaries: vi.fn().mockResolvedValue([]),
  },
}));

import { renderLessonQuestionsPage, lessonQuestionsPath, injectLessonPrerender } from "./lesson-prerender";

const lesson = {
  id: 42,
  publicSlug: "travel-plans",
  publicLevel: "b1",
  title: "Travel <Plans>",
  topic: "Booking a holiday for my student Maria",
  cefrLevel: "B1",
  category: "general",
  publicCategory: "general-english",
  isPublic: true,
  isShared: false,
  createdAt: new Date("2025-03-01T10:00:00Z"),
  content: {
    sections: [
      { type: "warmup", title: "Warm-up", questions: ["Where do you like to travel?", { question: "Do you plan trips?" }] },
      { type: "reading", title: "Reading", paragraphs: ["Maria booked a flight to Lisbon."] },
      {
        type: "vocabulary",
        words: ["one", "two", "three", "four", "five", "six"].map((w) => ({
          term: `word-${w}`,
          partOfSpeech: "noun",
          definition: `Definition of ${w}.`,
          example: `Example sentence ${w}.`,
        })),
      },
      {
        type: "comprehension",
        questions: [{ question: "Where did Maria go?", options: ["Lisbon", "Paris"], answer: "Lisbon", correctAnswer: "Lisbon", explanation: "Stated in paragraph one." }],
      },
      {
        type: "discussion",
        questions: [{ question: "What makes a good holiday?", paragraphContext: "Some people like to plan everything." }],
      },
    ],
  },
};

describe("discussion questions only view", () => {
  const html = renderLessonQuestionsPage(lesson as any)!;

  it("renders warm-up questions, five key words and discussion questions with set-up", () => {
    expect(html).toContain("<h1>Discussion questions: Travel &lt;Plans&gt;</h1>");
    expect(html).toContain("CEFR B1 &middot; 3 questions");
    expect(html).toContain("<li>Where do you like to travel?</li>");
    expect(html).toContain("<li>Do you plan trips?</li>");
    expect(html).toContain("word-one (noun): Definition of one.");
    expect(html).toContain("word-five (noun): Definition of five.");
    expect(html).not.toContain("word-six");
    expect(html).toContain("<p>Some people like to plan everything.</p><p><strong>What makes a good holiday?</strong></p>");
    expect(html).toContain('href="/esl-lessons/b1/travel-plans"');
    expect(html).not.toContain("Travel <Plans>");
  });

  it("is noindex with a canonical pointing at the full lesson", () => {
    expect(html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(html).toContain('<link rel="canonical" href="https://planwiseesl.com/esl-lessons/b1/travel-plans" />');
    expect(html).toContain("@media print");
    expect(html).not.toContain("application/ld+json");
  });

  it("does not leak quiz answers, explanations, reading text or the teacher's topic", () => {
    expect(html).not.toContain("Stated in paragraph one");
    expect(html).not.toContain("Where did Maria go?");
    expect(html).not.toContain("Paris");
    expect(html).not.toContain("flight to Lisbon");
    expect(html).not.toContain(lesson.topic);
    expect(html).not.toContain("Example sentence");
  });

  it("skips missing sections gracefully", () => {
    const bare = renderLessonQuestionsPage({ ...lesson, content: { sections: [{ type: "discussion", questions: [{ question: "Only one?" }] }] } } as any)!;
    expect(bare).toContain("<strong>Only one?</strong>");
    expect(bare).not.toContain("Warm-up questions");
    expect(bare).not.toContain("Key words");
  });

  it("is not shown for private or link-only lessons", () => {
    expect(renderLessonQuestionsPage({ ...lesson, isPublic: false } as any)).toBeNull();
    expect(renderLessonQuestionsPage({ ...lesson, isPublic: false, isShared: true } as any)).toBeNull();
    expect(renderLessonQuestionsPage(null)).toBeNull();
  });
});

describe("link from the lesson page", () => {
  const TEMPLATE = `<!DOCTYPE html><html><head><title>x</title></head><body><div id="root"></div></body></html>`;

  it("adds a plain link to the questions view on public lessons only", async () => {
    expect(lessonQuestionsPath(lesson)).toBe("/esl-lessons/b1/travel-plans/questions");
    const page = (await injectLessonPrerender(TEMPLATE, "/esl-lessons/b1/travel-plans", lesson))!;
    expect(page).toContain('<a href="/esl-lessons/b1/travel-plans/questions">Print just the discussion questions</a>');
    const linkOnly = (await injectLessonPrerender(TEMPLATE, "/esl-lessons/b1/travel-plans", { ...lesson, isPublic: false, isShared: true }))!;
    expect(linkOnly).not.toContain("Print just the discussion questions");
  });
});
