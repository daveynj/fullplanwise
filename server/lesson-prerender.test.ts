import { describe, it, expect, vi, beforeEach } from "vitest";

const getLesson = vi.fn();
const getPublicLessonSummaries = vi.fn();

vi.mock("./storage", () => ({
  storage: {
    getLesson: (...args: unknown[]) => getLesson(...args),
    getPublicLessonSummaries: (...args: unknown[]) => getPublicLessonSummaries(...args),
  },
}));

import { injectLessonPrerender } from "./lesson-prerender";

const TEMPLATE = `<!DOCTYPE html><html><head>
<title>PLAN WISE ESL | AI-Powered Lesson Generator for ESL Teachers</title>
<meta property="og:title" content="Site title" />
<meta property="og:description" content="Site description" />
<meta property="og:url" content="https://planwiseesl.com" />
<meta property="og:type" content="website" />
<meta name="twitter:title" content="Site title" />
<meta name="twitter:description" content="Site description" />
</head><body><div id="root"></div></body></html>`;

const baseLesson = {
  id: 42,
  title: "Travel Plans",
  topic: "Booking a holiday",
  cefrLevel: "B1",
  category: "general",
  publicCategory: "general-english",
  isPublic: true,
  isShared: false,
  createdAt: new Date("2025-03-01T10:00:00Z"),
  content: {
    sections: [
      { type: "warmup", title: "Warm-up", questions: ["Where do you like to travel?"] },
      { type: "reading", title: "Reading", paragraphs: ["Maria booked a flight to Lisbon."] },
      {
        type: "vocabulary",
        title: "Key Vocabulary",
        words: [{ term: "itinerary", partOfSpeech: "noun", definition: "A plan of a journey.", example: "Our itinerary is full." }],
      },
      {
        type: "comprehension",
        questions: [{ question: "Where did Maria go?", options: ["Lisbon", "Paris"], answer: "Lisbon", correctAnswer: "Lisbon", explanation: "Stated in paragraph one." }],
      },
      { type: "discussion", questions: [{ question: "What makes a good holiday?" }] },
    ],
  },
};

beforeEach(() => {
  getLesson.mockReset();
  getPublicLessonSummaries.mockReset();
});

describe("injectLessonPrerender: lesson pages", () => {
  it("renders a public lesson as indexable HTML with structured data", async () => {
    getLesson.mockResolvedValue(baseLesson);
    const html = await injectLessonPrerender(TEMPLATE, "/lessons/42");

    expect(html).not.toBeNull();
    expect(html).toContain("<h1>Travel Plans</h1>");
    expect(html).toContain("itinerary");
    expect(html).toContain("Maria booked a flight to Lisbon.");
    expect(html).toContain("Where did Maria go?");
    expect(html).toContain('<link rel="canonical" href="https://planwiseesl.com/lessons/42" />');
    expect(html).toContain("index, follow");
    expect(html).toContain('"@type":"LearningResource"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    // Site-wide social tags are pointed at this lesson
    expect(html).toContain('<meta property="og:url" content="https://planwiseesl.com/lessons/42" />');
    expect(html).not.toContain('content="Site title"');
  });

  it("does not leak quiz answers or explanations", async () => {
    getLesson.mockResolvedValue(baseLesson);
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).not.toContain("Stated in paragraph one.");
  });

  it("marks lessons shared only by private link as noindex and omits lesson structured data", async () => {
    getLesson.mockResolvedValue({ ...baseLesson, isPublic: false, isShared: true });
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).toContain("noindex, nofollow");
    expect(html).not.toContain("LearningResource");
  });

  it("returns null for private or missing lessons", async () => {
    getLesson.mockResolvedValue({ ...baseLesson, isPublic: false, isShared: false });
    expect(await injectLessonPrerender(TEMPLATE, "/lessons/42")).toBeNull();
    getLesson.mockResolvedValue(undefined);
    expect(await injectLessonPrerender(TEMPLATE, "/lessons/99")).toBeNull();
  });

  it("escapes HTML and cannot be broken out of the JSON-LD script tag", async () => {
    getLesson.mockResolvedValue({
      ...baseLesson,
      title: `<img src=x onerror=alert(1)>`,
      topic: `</script><script>alert(2)</script>`,
    });
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>alert(2)</script>");
    // Still exactly the template-free ld+json blocks we add (2), none broken open
    expect((html.match(/<script type="application\/ld\+json">/g) || []).length).toBe(2);
  });

  it("survives malformed lesson content", async () => {
    getLesson.mockResolvedValue({ ...baseLesson, content: { sections: [null, "x", { type: "reading" }, { type: "vocabulary", words: [null] }] } });
    const html = await injectLessonPrerender(TEMPLATE, "/lessons/42");
    expect(html).toContain("<h1>Travel Plans</h1>");
  });

  it("ignores paths that are not lesson or browse pages", async () => {
    expect(await injectLessonPrerender(TEMPLATE, "/dashboard")).toBeNull();
    expect(await injectLessonPrerender(TEMPLATE, "/lessons/abc")).toBeNull();
    expect(getLesson).not.toHaveBeenCalled();
  });

  it("returns null instead of throwing when the database fails", async () => {
    getLesson.mockRejectedValue(new Error("db down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await injectLessonPrerender(TEMPLATE, "/lessons/42")).toBeNull();
    spy.mockRestore();
  });
});

describe("injectLessonPrerender: browse pages", () => {
  const summaries = [
    { id: 1, title: "Job Interviews", topic: "Work", cefrLevel: "B1", publicCategory: "business-english", createdAt: new Date("2025-02-01") },
    { id: 2, title: "Ordering Food", topic: "Restaurants", cefrLevel: "A2", publicCategory: null, createdAt: new Date("2025-01-01") },
  ];

  it("lists lessons grouped by level on /esl-lessons", async () => {
    getPublicLessonSummaries.mockResolvedValue(summaries);
    const html = (await injectLessonPrerender(TEMPLATE, "/esl-lessons"))!;
    expect(html).toContain('href="/lessons/1"');
    expect(html).toContain('href="/lessons/2"');
    expect(html).toContain("index, follow");
    expect(html).toContain("ItemList");
  });

  it("filters to one level on /esl-lessons/b1", async () => {
    getPublicLessonSummaries.mockResolvedValue([summaries[0]]);
    const html = (await injectLessonPrerender(TEMPLATE, "/esl-lessons/b1"))!;
    expect(getPublicLessonSummaries).toHaveBeenCalledWith("B1");
    expect(html).toContain("B1 (Intermediate) ESL Lessons");
    expect(html).toContain('<link rel="canonical" href="https://planwiseesl.com/esl-lessons/b1" />');
  });

  it("keeps an empty level out of search results", async () => {
    getPublicLessonSummaries.mockResolvedValue([]);
    const html = (await injectLessonPrerender(TEMPLATE, "/esl-lessons/c2"))!;
    expect(html).toContain("noindex, nofollow");
  });

  it("returns null for an unknown level", async () => {
    expect(await injectLessonPrerender(TEMPLATE, "/esl-lessons/z9")).toBeNull();
    expect(getPublicLessonSummaries).not.toHaveBeenCalled();
  });
});
