import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { lessonPublicMetadata } from "@shared/lesson-public-metadata";

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
  getPublicLessonSummaries.mockResolvedValue([]);
});

describe("injectLessonPrerender: content stored as a JSON string", () => {
  const assertFullLesson = (html: string) => {
    expect(html).toContain("<section>");
    expect(html).toContain("Maria booked a flight to Lisbon.");
    expect(html).toContain("itinerary");
    expect(html).toContain("What makes a good holiday?");
    expect(html).toMatch(/<meta name="description" content="[^"]*Includes [^"]*"/);
    expect(html).toContain("index, follow");
    // Answers and explanations never reach the public HTML
    expect(html).not.toContain("Stated in paragraph one.");
    expect(html).not.toContain("correctAnswer");
  };

  it("renders sections when content is a JSON string", async () => {
    getLesson.mockResolvedValue({ ...baseLesson, content: JSON.stringify(baseLesson.content) });
    assertFullLesson((await injectLessonPrerender(TEMPLATE, "/lessons/42"))!);
  });

  it("renders sections when content is a JSON string encoded twice", async () => {
    getLesson.mockResolvedValue({ ...baseLesson, content: JSON.stringify(JSON.stringify(baseLesson.content)) });
    assertFullLesson((await injectLessonPrerender(TEMPLATE, "/lessons/42"))!);
  });

  it("treats unparseable string content as zero sections without throwing", async () => {
    getLesson.mockResolvedValue({ ...baseLesson, content: "{not json" });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).toContain("<h1>Travel Plans</h1>");
    expect(html).not.toContain("<section>");
    warn.mockRestore();
  });
});

describe("injectLessonPrerender: About this lesson", () => {
  it("builds the paragraph from the lesson's own data", async () => {
    getLesson.mockResolvedValue({
      ...baseLesson,
      content: JSON.stringify({ estimatedTime: 60, ...baseLesson.content }),
    });
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    const about = html.match(/<p class="lp-about">([\s\S]*?)<\/p>/)?.[1] ?? "";
    expect(about).toContain("About this lesson:");
    expect(about).toContain("B1 (Intermediate)");
    expect(about).toContain("General English");
    expect(about).toContain("about 60 minutes");
    expect(about).toContain("It includes 1 vocabulary words, a reading text, comprehension questions and discussion questions.");
    expect(about).toContain("Suits one-to-one or small-group online classes.");
    // Appears under the h1
    expect(html.indexOf('<p class="lp-about">')).toBeGreaterThan(html.indexOf("<h1>"));
  });

  it("never shows the teacher's original request (topic) anywhere on the page", async () => {
    getLesson.mockResolvedValue({ ...baseLesson, topic: "This student is very intelligent and 12 years old" });
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).not.toContain("very intelligent");
    expect(html).not.toContain("Topic:");
    expect(html).toContain("Travel Plans");
  });

  it("omits the time when the content has none", async () => {
    getLesson.mockResolvedValue(baseLesson);
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    const about = html.match(/<p class="lp-about">([\s\S]*?)<\/p>/)?.[1] ?? "";
    expect(about).toContain("About this lesson:");
    expect(about).not.toContain("minutes");
  });
});

describe("injectLessonPrerender: More lessons at this level", () => {
  const sameLevel = (id: number) => ({
    id,
    title: `B1 Lesson ${id}`,
    topic: "Topic",
    cefrLevel: "B1",
    publicCategory: null,
    createdAt: new Date("2025-01-01"),
  });

  it("links up to 6 other same-level lessons before the sign-up prompt, never the current one", async () => {
    getLesson.mockResolvedValue(baseLesson);
    getPublicLessonSummaries.mockResolvedValue([42, 1, 2, 3, 4, 5, 6, 7].map(sameLevel));
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;

    expect(getPublicLessonSummaries).toHaveBeenCalledWith("B1");
    expect(html).toContain("More B1 lessons");
    const block = html.match(/<section class="lp-related">([\s\S]*?)<\/section>/)?.[1] ?? "";
    const links = block.match(/<a href="\/lessons\/\d+">/g) || [];
    expect(links).toHaveLength(6);
    expect(block).not.toContain('href="/lessons/42"');
    expect(block).toContain('<a href="/lessons/1">B1 Lesson 1</a>');
    expect(block).not.toContain('href="/lessons/7"');
    expect(html.indexOf('<section class="lp-related">')).toBeLessThan(html.indexOf('<aside class="lp-cta">'));
  });

  it("omits the block when no other lessons are left", async () => {
    getLesson.mockResolvedValue(baseLesson);
    getPublicLessonSummaries.mockResolvedValue([sameLevel(42)]);
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).not.toContain('<section class="lp-related">');
    expect(html).not.toContain("More B1 lessons");
  });

  it("still renders the lesson when the lookup fails", async () => {
    getLesson.mockResolvedValue(baseLesson);
    getPublicLessonSummaries.mockRejectedValue(new Error("db down"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).toContain("Maria booked a flight to Lisbon.");
    expect(html).not.toContain('<section class="lp-related">');
    warn.mockRestore();
  });
});

describe("injectLessonPrerender: zero-section fallback", () => {
  it("serves a public lesson with no renderable sections as noindex and logs the id", async () => {
    getLesson.mockResolvedValue({ ...baseLesson, content: { sections: [] } });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).toContain("noindex, nofollow");
    expect(html).not.toContain("index, follow, max-snippet");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("42"));
    warn.mockRestore();
  });
});

describe("injectLessonPrerender: lesson pages", () => {
  it.each([
    ["public", { isPublic: true, isShared: false }],
    ["shared by link", { isPublic: false, isShared: true }],
  ])("serves complete %s lesson preview metadata before JavaScript runs", async (_name, flags) => {
    const lesson = { ...baseLesson, ...flags, topic: "PRIVATE student information", notes: "PRIVATE teacher note" };
    getLesson.mockResolvedValue(lesson);
    const template = readFileSync("client/index.html", "utf8");
    const html = (await injectLessonPrerender(template, "/lessons/42"))!;
    const doc = new DOMParser().parseFromString(html, "text/html");
    const metadata = lessonPublicMetadata(lesson);
    const meta = (key: string) => doc.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute("content");

    expect(doc.title).toBe(metadata.title);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://planwiseesl.com/lessons/42");
    expect(meta("og:url")).toBe("https://planwiseesl.com/lessons/42");
    expect(meta("og:title")).toBe(metadata.title);
    expect(meta("og:description")).toBe(metadata.description);
    expect(meta("twitter:title")).toBe(metadata.title);
    expect(meta("twitter:description")).toBe(metadata.description);
    expect(meta("og:image")).toBe("https://planwiseesl.com/api/lessons/42/share-image?v=1");
    expect(meta("twitter:image")).toBe(meta("og:image"));
    expect(meta("og:image:alt")).toBe(metadata.imageAlt);
    expect(meta("twitter:image:alt")).toBe(metadata.imageAlt);
    expect(doc.querySelector('meta[property="og:image:width"]')).toBeNull();
    expect(doc.querySelector('meta[property="og:image:height"]')).toBeNull();
    expect(doc.querySelector('meta[property="og:image:type"]')).toBeNull();
    expect(html).not.toContain("twitter-card-new-design.png");
    expect(html).not.toContain("PRIVATE");
  });

  it("replaces duplicated, reordered and unquoted homepage metadata without keeping a homepage destination", async () => {
    getLesson.mockResolvedValue(baseLesson);
    const template = `<html><head><title>Home</title>
      <meta content='https://planwiseesl.com' property='og:url'>
      <meta property=og:url content=https://planwiseesl.com>
      <meta content="home.png" property="og:image">
      <meta content="Old description" name="description">
      <link href="https://planwiseesl.com" rel=canonical>
      </head><body><div id="root"></div></body></html>`;
    const html = (await injectLessonPrerender(template, "/lessons/42"))!;
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelectorAll('meta[property="og:url"]')).toHaveLength(1);
    expect(doc.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(doc.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe("https://planwiseesl.com/lessons/42");
    expect(doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content")).toContain("/lessons/42/share-image");
    expect(html).not.toContain("home.png");
  });

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
