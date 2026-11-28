import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";

const getPublicLessonsWithContent = vi.fn();

vi.mock("./storage", () => ({
  storage: {
    getPublicLessonsWithContent: (...args: unknown[]) => getPublicLessonsWithContent(...args),
  },
}));

import {
  getConversationQuestionsPage,
  getConversationQuestionSitemapEntries,
  buildConversationQuestionPages,
  clearConversationQuestionsCache,
} from "./conversation-questions";
import { buildLessonIndexHtml } from "./lesson-prerender";
import { buildLlmsFullTxt } from "./llms-full";

const base = {
  isPublic: true,
  createdAt: new Date("2026-03-01T10:00:00Z"),
  publicCategory: "general-english",
  category: "general",
};

const lessons = [
  {
    ...base,
    id: 1,
    title: "Booking a <Trip>",
    cefrLevel: "B1",
    publicSlug: "booking-a-trip",
    publicLevel: "b1",
    tags: ["travel", "money"],
    topic: "SECRET topic: Maria's honeymoon",
    notes: "SECRET teacher notes",
    content: {
      sections: [
        { type: "warmup", questions: ["Where do you like to travel?", { question: "Do you plan trips?" }] },
        { type: "reading", paragraphs: ["Maria booked a flight to Lisbon."] },
        {
          type: "comprehension",
          questions: [{ question: "Where did Maria go?", options: ["Lisbon", "Paris"], answer: "Lisbon", correctAnswer: "Lisbon", explanation: "SECRET explanation" }],
        },
        { type: "discussion", questions: [{ question: "What makes a good holiday?", paragraphContext: "ctx" }] },
      ],
    },
  },
  {
    ...base,
    id: 2,
    title: "At the Airport",
    cefrLevel: "A2",
    publicSlug: "at-the-airport",
    publicLevel: "a2",
    tags: ["travel"],
    content: {
      sections: [
        { type: "warm-up", questions: ["Do you like airports?"] },
        { type: "speaking", questions: ["How early do you arrive at the airport?"] },
      ],
    },
  },
  // Not public: must never appear.
  {
    ...base,
    id: 3,
    isPublic: false,
    title: "Private Lesson",
    cefrLevel: "B2",
    publicSlug: "private-lesson",
    publicLevel: "b2",
    tags: ["travel"],
    content: { sections: [{ type: "discussion", questions: ["PRIVATE-QUESTION"] }] },
  },
  // Public but no questions: skipped.
  {
    ...base,
    id: 4,
    title: "Empty Lesson",
    cefrLevel: "C1",
    publicSlug: "empty-lesson",
    publicLevel: "c1",
    tags: ["travel"],
    content: { sections: [{ type: "reading", paragraphs: ["Only reading."] }] },
  },
  {
    ...base,
    id: 5,
    title: "Salary Talk",
    cefrLevel: "B2",
    publicSlug: "salary-talk",
    publicLevel: "b2",
    tags: ["work"],
    content: { sections: [{ type: "discussion", questions: ["Is your pay fair?"] }] },
  },
];

beforeEach(() => {
  clearConversationQuestionsCache();
  getPublicLessonsWithContent.mockReset();
  getPublicLessonsWithContent.mockResolvedValue(lessons);
});

describe("topic page", () => {
  it("lists the questions by level with the required title, h1 and first paragraph", async () => {
    const html = (await getConversationQuestionsPage("travel"))!;
    expect(html).toContain("<title>Conversation questions about travel: free ESL discussion questions by level | PlanWise ESL</title>");
    expect(html).toContain("<h1>Conversation questions about travel</h1>");
    expect(html).toContain('<h2>A2 (Elementary): travel questions</h2>');
    expect(html).toContain('<h2>B1 (Intermediate): travel questions</h2>');
    expect(html.indexOf('id="a2"')).toBeLessThan(html.indexOf('id="b1"'));
    expect(html).toContain('<a href="#a2">A2</a>');
    expect(html).toContain('<a href="#b1">B1</a>');
    expect(html).not.toContain('<a href="#a1">');
    expect(html).not.toContain('<a href="#c1">');
    expect(html).toContain("<h3>Booking a &lt;Trip&gt;</h3>");
    for (const q of ["Where do you like to travel?", "Do you plan trips?", "What makes a good holiday?", "Do you like airports?", "How early do you arrive at the airport?"]) {
      expect(html).toContain(`<li>${q}</li>`);
    }
    expect(html).toContain('href="/esl-lessons/b1/booking-a-trip"');
    expect(html).toContain("Open the full free lesson (reading, 5 key words, exercises)");
    expect(html).toContain('href="/esl-lessons/b1/booking-a-trip/questions"');
    expect(html).toContain("Print these questions");
    expect(html).toContain('href="/esl-lessons/topics/travel"');
    expect(html).toContain('href="/conversation-questions/work"');
    expect(html).toContain('href="/conversation-questions/money"');
    expect(html).not.toContain('href="/conversation-questions/travel">Travel');
  });

  it("has two calls to action when there is more than one level", async () => {
    const html = (await getConversationQuestionsPage("travel"))!;
    expect(html.match(/Teaching one student\? Make a travel lesson at their level in 1&ndash;2 minutes/g)).toHaveLength(2);
    expect(html).toContain("/auth?register=true&amp;redirect=%2Fgenerate%3Ftopic%3DTravel");
    // The first one comes after the first level, before the second.
    expect(html.indexOf('class="cta"')).toBeGreaterThan(html.indexOf('id="a2"'));
    expect(html.indexOf('class="cta"')).toBeLessThan(html.indexOf('id="b1"'));
  });

  it("skips non-public lessons and lessons without questions", async () => {
    const html = (await getConversationQuestionsPage("travel"))!;
    expect(html).not.toContain("PRIVATE-QUESTION");
    expect(html).not.toContain("Private Lesson");
    expect(html).not.toContain("Empty Lesson");
    expect(html).not.toContain('id="b2"');
    expect(html).not.toContain('id="c1"');
  });

  it("never contains quiz answers, the teacher's topic or notes, or reading text", async () => {
    const html = (await getConversationQuestionsPage("travel"))!;
    const hub = (await getConversationQuestionsPage())!;
    for (const page of [html, hub]) {
      expect(page).not.toContain("SECRET");
      expect(page).not.toContain("Maria");
      expect(page).not.toContain("Where did Maria go?");
      expect(page).not.toContain("Paris");
      expect(page).not.toContain("Lisbon");
    }
  });

  it("is indexable, canonical to itself, with CollectionPage JSON-LD and no FAQ markup", async () => {
    const html = (await getConversationQuestionsPage("travel"))!;
    expect(html).toContain('<link rel="canonical" href="https://planwiseesl.com/conversation-questions/travel" />');
    expect(html).not.toMatch(/noindex/i);
    const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const collection = ld.find((d) => d["@type"] === "CollectionPage");
    expect(collection.isAccessibleForFree).toBe(true);
    expect(collection.mainEntity["@type"]).toBe("ItemList");
    expect(collection.mainEntity.numberOfItems).toBe(2);
    expect(collection.mainEntity.itemListElement.map((i: any) => i.url)).toEqual([
      "https://planwiseesl.com/esl-lessons/a2/at-the-airport",
      "https://planwiseesl.com/esl-lessons/b1/booking-a-trip",
    ]);
    expect(html).not.toContain("FAQPage");
  });

  it("has print CSS that hides navigation and calls to action and keeps each lesson together", async () => {
    const html = (await getConversationQuestionsPage("travel"))!;
    const print = html.slice(html.indexOf("@media print"));
    expect(print).toContain("header.site");
    expect(print).toContain(".cta");
    expect(print).toMatch(/\.lesson \{[^}]*break-inside: avoid/);
  });

  it("builds the first paragraph from the real counts", async () => {
    const html = (await getConversationQuestionsPage("travel"))!;
    // 3 + 2 questions from 2 lessons, A2 to B1.
    expect(html).toContain(
      '<p class="lead">5 travel conversation questions for ESL students, from A2 to B1, taken from 2 free PlanWise ESL lessons. Free to print and use in class, no login.</p>',
    );
    const items = [...html.matchAll(/<li>/g)].length;
    // Every question is a list item; the first paragraph's count matches them.
    expect(items).toBe(5);

    const work = (await getConversationQuestionsPage("work"))!;
    expect(work).toContain("1 work &amp; careers conversation question for ESL students, at level B2, taken from 1 free PlanWise ESL lesson.");
    // One level only: a single call to action, at the end.
    expect(work.match(/Teaching one student\?/g)).toHaveLength(1);
  });
});

describe("hub page", () => {
  it("lists only topics that have questions, with counts", async () => {
    const hub = (await getConversationQuestionsPage())!;
    expect(hub).toContain("<h1>Conversation questions by topic</h1>");
    expect(hub).toContain('<link rel="canonical" href="https://planwiseesl.com/conversation-questions" />');
    expect(hub).toContain('href="/conversation-questions/travel">Travel<span>5 questions from 2 lessons</span>');
    expect(hub).toContain('href="/conversation-questions/money">Money<span>3 questions from 1 lesson</span>');
    expect(hub).toContain('href="/conversation-questions/work">Work &amp; careers<span>1 question from 1 lesson</span>');
    expect(hub).not.toContain("/conversation-questions/sport");
    expect(hub).not.toMatch(/noindex/i);
  });
});

describe("routing and caching", () => {
  it("returns null (404) for an unknown tag and for a tag with no lessons", async () => {
    expect(await getConversationQuestionsPage("nonsense")).toBeNull();
    expect(await getConversationQuestionsPage("__proto__")).toBeNull();
    expect(await getConversationQuestionsPage("sport")).toBeNull();
    expect(getPublicLessonsWithContent).not.toHaveBeenCalledWith("nonsense");
  });

  it("returns null for the hub when no lesson has questions", async () => {
    getPublicLessonsWithContent.mockResolvedValue([]);
    expect(await getConversationQuestionsPage()).toBeNull();
  });

  it("loads once and caches for 10 minutes", async () => {
    vi.useFakeTimers();
    try {
      await getConversationQuestionsPage("travel");
      await getConversationQuestionsPage();
      await getConversationQuestionsPage("work");
      expect(getPublicLessonsWithContent).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(9 * 60 * 1000);
      await getConversationQuestionsPage("travel");
      expect(getPublicLessonsWithContent).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(2 * 60 * 1000);
      await getConversationQuestionsPage("travel");
      expect(getPublicLessonsWithContent).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws when lessons cannot be loaded (the route answers 503) and does not cache the failure", async () => {
    getPublicLessonsWithContent.mockRejectedValueOnce(new Error("db down"));
    await expect(getConversationQuestionsPage("travel")).rejects.toThrow("db down");
    expect(await getConversationQuestionsPage("travel")).toContain("<h1>");
  });

  it("serves the pages from server/routes.ts with 404 and 503 handling", () => {
    const routes = readFileSync("server/routes.ts", "utf8");
    expect(routes).toContain('app.get("/conversation-questions", ');
    expect(routes).toContain('app.get("/conversation-questions/:tag"');
    expect(routes).toContain("getConversationQuestionSitemapEntries()");
    const block = routes.slice(routes.indexOf("const serveConversationQuestions"), routes.indexOf('app.get("/conversation-questions"'));
    expect(block).toContain("serve404Html");
    expect(block).toContain('"X-Robots-Tag": "noindex"');
    expect(block).toContain("res.status(503)");
  });
});

describe("sitemap and discovery files", () => {
  it("lists the hub and every topic page that exists", async () => {
    const entries = await getConversationQuestionSitemapEntries();
    const urls = entries.map((x) => x.url);
    expect(urls).toContain("/conversation-questions");
    expect(urls).toContain("/conversation-questions/travel");
    expect(urls).toContain("/conversation-questions/work");
    expect(urls).toContain("/conversation-questions/money");
    expect(urls).not.toContain("/conversation-questions/sport");
    expect(entries.find((x) => x.url === "/conversation-questions/travel")?.lastmod).toBe("2026-03-01");
  });

  it("gives no entries, and does not throw, when lessons cannot be loaded", async () => {
    getPublicLessonsWithContent.mockRejectedValue(new Error("db down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getConversationQuestionSitemapEntries()).toEqual([]);
    spy.mockRestore();
  });

  it("builds every page from the same data in one pass", () => {
    const pages = buildConversationQuestionPages(lessons as any);
    expect([...pages.topics.keys()].sort()).toEqual(["money", "travel", "work"]);
  });

  it("is in llms.txt and llms-full.txt", () => {
    const txt = readFileSync("public/llms.txt", "utf8");
    expect(txt).toContain("## Conversation questions by topic");
    expect(txt).toContain("https://planwiseesl.com/conversation-questions/travel");
    const summaries = [{ id: 1, title: "x", cefrLevel: "B1", tags: ["travel"] }];
    const full = buildLlmsFullTxt(summaries as any);
    expect(full).toContain("## Conversation Questions by Topic");
    expect(full).toContain("https://planwiseesl.com/conversation-questions/travel");
    expect(full).not.toContain("https://planwiseesl.com/conversation-questions/sport");
    expect(buildLlmsFullTxt()).toContain("https://planwiseesl.com/conversation-questions/sport");
  });

  it("is linked from the topic hub HTML", () => {
    const summaries = [{ id: 1, title: "Trip", cefrLevel: "B1", publicCategory: null, tags: ["travel"], createdAt: new Date() }];
    const topicHtml = buildLessonIndexHtml(summaries as any, undefined, "travel");
    expect(topicHtml).toContain('<a href="/conversation-questions/travel">Conversation questions about travel &rarr;</a>');
    expect(buildLessonIndexHtml(summaries as any)).toContain('href="/conversation-questions"');
  });
});
