import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { lessonPublicMetadata, publicLessonRemixHref } from "@shared/lesson-public-metadata";

const getLesson = vi.fn();
const getLessonByPublicSlug = vi.fn();
const getPublicLessonSummaries = vi.fn();

vi.mock("./storage", () => ({
  storage: {
    getLesson: (...args: unknown[]) => getLesson(...args),
    getLessonByPublicSlug: (...args: unknown[]) => getLessonByPublicSlug(...args),
    getPublicLessonSummaries: (...args: unknown[]) => getPublicLessonSummaries(...args),
  },
}));

import { injectLessonPrerender } from "./lesson-prerender";

describe("social destinations from the real homepage template", () => {
  for (const path of ["/lessons/42", "/esl-lessons", "/esl-lessons/b1"]) {
    it(`keeps Twitter and Open Graph pointing to ${path}`, async () => {
      getLesson.mockResolvedValue(baseLesson);
      getPublicLessonSummaries.mockResolvedValue([baseLesson]);
      const html = await injectLessonPrerender(readFileSync("client/index.html", "utf8"), path);
      expect(html).not.toBeNull();
      const doc = new DOMParser().parseFromString(html!, "text/html");
      for (const selector of ['meta[property="og:url"]', 'meta[name="twitter:url"]']) {
        const tags = doc.querySelectorAll(selector);
        expect(tags).toHaveLength(1);
        expect(tags[0].getAttribute("content")).toBe(`https://planwiseesl.com${path}`);
      }
    });
  }
});

describe("public lesson remix links", () => {
  it("sends signed-in teachers to a prefilled lesson generator", () => {
    expect(publicLessonRemixHref("Travel plans", "B1", true))
      .toBe("/generate?topic=Travel%20plans&level=B1");
  });

  it("returns new visitors through signup to a safely encoded generator URL", () => {
    const href = publicLessonRemixHref("Travel & culture", "B2", false);
    const auth = new URL(href, "https://planwiseesl.com");
    const generate = new URL(auth.searchParams.get("redirect")!, "https://planwiseesl.com");
    expect(auth.pathname).toBe("/auth");
    expect(auth.searchParams.get("register")).toBe("true");
    expect(generate.pathname).toBe("/generate");
    expect(generate.searchParams.get("topic")).toBe("Travel & culture");
    expect(generate.searchParams.get("level")).toBe("B2");
  });
});

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
  getLessonByPublicSlug.mockReset();
  getPublicLessonSummaries.mockReset();
  getPublicLessonSummaries.mockResolvedValue([]);
});

describe("slug lesson prerendering", () => {
  const publicLesson = () => ({ ...baseLesson, publicSlug: "travel-plans", publicLevel: "b1" });

  it("uses the same slug for canonical, social metadata, structured data and library links", async () => {
    const lesson = publicLesson();
    getLessonByPublicSlug.mockResolvedValue(lesson);
    getPublicLessonSummaries.mockResolvedValue([lesson]);
    const path = "/esl-lessons/b1/travel-plans";
    const html = (await injectLessonPrerender(TEMPLATE, path))!;
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://planwiseesl.com${path}`);
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(`https://planwiseesl.com${path}`);
    expect(html).not.toContain(baseLesson.topic);
    const data = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((el) => JSON.parse(el.textContent!));
    expect(data.find((d) => d["@type"] === "LearningResource").url).toBe(`https://planwiseesl.com${path}`);
    const listing = (await injectLessonPrerender(TEMPLATE, "/esl-lessons"))!;
    expect(listing).toContain(`href="${path}"`);
    expect(listing).toContain(`"url":"https://planwiseesl.com${path}"`);
    expect(listing).not.toContain('href="/lessons/42"');
  });

  it("links each lesson to the matching page on Dave's tutoring site", async () => {
    const render = async (lesson: Record<string, unknown>, path: string) => {
      getLessonByPublicSlug.mockResolvedValue(lesson);
      getPublicLessonSummaries.mockResolvedValue([lesson]);
      return (await injectLessonPrerender(TEMPLATE, path))!;
    };
    const b1 = await render(publicLesson(), "/esl-lessons/b1/travel-plans");
    expect(b1).toContain('href="https://speakwithdave.com/english-conversation-practice"');
    expect(b1).toContain("Take this lesson 1-on-1 with Dave: English conversation practice");

    const business = await render(
      { ...baseLesson, cefrLevel: "B2", publicCategory: "business-english", publicSlug: "travel-plans", publicLevel: "b2" },
      "/esl-lessons/b2/travel-plans",
    );
    expect(business).toContain('href="https://speakwithdave.com/business-english-lessons-online"');

    const a1 = await render(
      { ...baseLesson, cefrLevel: "A1", publicSlug: "travel-plans", publicLevel: "a1" },
      "/esl-lessons/a1/travel-plans",
    );
    expect(a1).toContain('href="https://speakwithdave.com/"');
    expect(a1).toContain("Dave teaches intermediate (B1) learners and above");
    expect(a1).not.toContain("Take this lesson 1-on-1 with Dave");
  });

  it("keeps a previously public link-only slug noindex with no LearningResource", async () => {
    getLessonByPublicSlug.mockResolvedValue({ ...publicLesson(), isPublic: false, isShared: true });
    const html = (await injectLessonPrerender(TEMPLATE, "/esl-lessons/b1/travel-plans"))!;
    expect(html).toContain("noindex, nofollow");
    expect(html).not.toContain('"@type":"LearningResource"');
  });

  it("does not prerender missing, private, or wrong-level URLs", async () => {
    expect(await injectLessonPrerender(TEMPLATE, "/esl-lessons/b1/missing")).toBeNull();
    getLessonByPublicSlug.mockResolvedValue({ ...publicLesson(), isPublic: false, isShared: false });
    expect(await injectLessonPrerender(TEMPLATE, "/esl-lessons/b1/travel-plans")).toBeNull();
    getLessonByPublicSlug.mockResolvedValue(publicLesson());
    expect(await injectLessonPrerender(TEMPLATE, "/esl-lessons/c2/travel-plans")).toBeNull();
  });
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

    expect(getPublicLessonSummaries).toHaveBeenCalled();
    expect(html).toContain("More like this");
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

  it("groups by theme: same theme at this level first, the theme at other levels, and where to browse", async () => {
    const tagged = (id: number, cefrLevel: string, tags: string[], title: string) => ({
      id, title, topic: "x", cefrLevel, tags, publicCategory: null, createdAt: new Date("2025-01-01"),
      publicSlug: `l-${id}`, publicLevel: cefrLevel.toLowerCase(),
    });
    getLesson.mockResolvedValue({ ...baseLesson, tags: ["travel"] });
    getPublicLessonSummaries.mockResolvedValue([
      tagged(42, "B1", ["travel"], "Travel Plans"),
      tagged(1, "B1", ["work"], "Office Talk"),
      tagged(2, "B1", ["travel"], "Lost Luggage"),
      tagged(3, "B1", ["travel"], "Hotel Check-in"),
      tagged(4, "A2", ["travel"], "At the Airport"),
      tagged(5, "C1", ["travel"], "Overtourism"),
      tagged(6, "B2", ["work"], "Appraisals"),
    ]);
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    const block = html.match(/<section class="lp-related">([\s\S]*?)<\/section>/)?.[1] ?? "";
    expect(block.indexOf("Lost Luggage")).toBeLessThan(block.indexOf("Office Talk"));
    expect(block).toContain("Travel at other levels");
    expect(block).toContain('<a href="/esl-lessons/a2/l-4">At the Airport</a> (A2)');
    expect(block).toContain('<a href="/esl-lessons/c1/l-5">Overtourism</a> (C1)');
    expect(block).not.toContain("Appraisals");
    // Three B1 travel lessons: the level-by-theme page exists.
    expect(block).toContain('<a href="/esl-lessons/b1/topics/travel">B1 Travel lessons</a>');
    expect(block).toContain('<a href="/esl-lessons/b1">All B1 lessons</a>');
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

  it("explains how the lesson is built, to readers and in its structured data", async () => {
    getLesson.mockResolvedValue({ ...baseLesson, topic: "PRIVATE student information" });
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    const doc = new DOMParser().parseFromString(html, "text/html");
    const design = doc.querySelector("section.lp-design");
    expect(design?.querySelector("h2")?.textContent).toBe("How this lesson is built");
    expect(design?.querySelectorAll("li").length).toBeGreaterThanOrEqual(3);
    expect(design?.querySelector('a[href="/how-it-works"]')).not.toBeNull();
    expect(doc.querySelectorAll("h1")).toHaveLength(1);

    const resource = [...doc.querySelectorAll('script[type="application/ld+json"]')]
      .map((el) => JSON.parse(el.textContent!))
      .find((b) => b["@type"] === "LearningResource");
    expect(resource.educationalAlignment).toMatchObject({ educationalFramework: expect.stringContaining("CEFR"), targetName: baseLesson.cefrLevel });
    expect(resource.teaches).toContain("Vocabulary: itinerary");
    expect(resource.author).toMatchObject({ "@type": "Person", name: "Dave Jackson", url: "https://speakwithdave.com" });
    expect(resource.author.sameAs).toContain("https://speakwithdave.com");
    expect(resource.inLanguage).toBe("en");
    expect(resource.hasPart.length).toBeGreaterThanOrEqual(3);
    expect(html).not.toContain("PRIVATE");
    expect(html).toContain("Make this lesson for your student");
    expect(html).toContain("/auth?register=true&amp;redirect=");
    expect(html).toContain("Mark lessons complete from a student's page");
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
    expect(html).toContain('"numberOfItems":2');
    expect(html).toContain("How to Teach Any Free PlanWise ESL Lesson");
    expect(html).toContain("<table");
    expect(html).toContain('"CollectionPage"');
    expect(html).toContain('"FAQPage"');
    expect(html).toContain('"BreadcrumbList"');
  });

  it("includes all lessons beyond 100 and numberOfItems in ItemList JSON-LD", async () => {
    const many = Array.from({ length: 125 }, (_, i) => ({
      id: i + 1,
      publicSlug: i === 124 ? "public-lesson-125" : undefined,
      publicLevel: i === 124 ? "b1" : undefined,
      title: `Public Lesson ${i + 1}`,
      topic: `Topic ${i + 1}`,
      cefrLevel: "B1",
      publicCategory: "general-english",
      createdAt: new Date("2025-02-01"),
    }));
    getPublicLessonSummaries.mockResolvedValue(many);
    const html = (await injectLessonPrerender(TEMPLATE, "/esl-lessons"))!;
    expect(html).toContain('"numberOfItems":125');
    expect(html).toContain('"position":125');
    expect(html).toContain('https://planwiseesl.com/lessons/101');
    expect(html).toContain('https://planwiseesl.com/esl-lessons/b1/public-lesson-125');
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

  it("renders crawlable theme hub pages (/esl-lessons/topics/:tag) and links them from /esl-lessons", async () => {
    const tagged = [
      { ...summaries[0], tags: ["holidays", "culture"] },
      { ...summaries[1], tags: ["travel"] },
    ];
    getPublicLessonSummaries.mockResolvedValue(tagged);

    const indexHtml = (await injectLessonPrerender(TEMPLATE, "/esl-lessons"))!;
    expect(indexHtml).toContain("Browse Free Lessons by Theme");
    expect(indexHtml).toContain('href="/esl-lessons/topics/holidays"');

    const topicHtml = (await injectLessonPrerender(TEMPLATE, "/esl-lessons/topics/holidays"))!;
    expect(topicHtml).toContain("Free Holidays &amp; Celebrations ESL Lessons");
    expect(topicHtml).toContain("Job Interviews");
    expect(topicHtml).not.toContain("Ordering Food");
    expect(topicHtml).toContain('<link rel="canonical" href="https://planwiseesl.com/esl-lessons/topics/holidays" />');
    expect(topicHtml).toContain('"CollectionPage"');
    expect(topicHtml).toContain('"FAQPage"');
    expect(topicHtml).toContain('"BreadcrumbList"');

    expect(await injectLessonPrerender(TEMPLATE, "/esl-lessons/topics/not-a-real-theme")).toBeNull();

    getPublicLessonSummaries.mockResolvedValue([]);
    const emptyTopic = (await injectLessonPrerender(TEMPLATE, "/esl-lessons/topics/holidays"))!;
    expect(emptyTopic).toContain("noindex, nofollow");
  });
});

describe("injectLessonPrerender: level-by-theme pages (/esl-lessons/:level/topics/:tag)", () => {
  const tagged = (id: number, cefrLevel: string, tags: string[], title: string) => ({
    id, title, topic: "x", cefrLevel, tags, publicCategory: "general-english", createdAt: new Date("2025-01-01"),
    publicSlug: `l-${id}`, publicLevel: cefrLevel.toLowerCase(),
  });
  const library = [
    tagged(1, "B1", ["work"], "Office Talk"),
    tagged(2, "B1", ["work", "money"], "Payday"),
    tagged(3, "B1", ["work"], "Job Interviews"),
    tagged(4, "B1", ["travel"], "Lost Luggage"),
    tagged(5, "A2", ["work"], "First Day"),
    tagged(6, "B2", ["work"], "Appraisals"),
    tagged(7, "B2", ["work"], "Meetings"),
    tagged(8, "B2", ["work"], "Negotiating"),
  ];
  beforeEach(() => getPublicLessonSummaries.mockResolvedValue(library));

  it("renders an indexable page with only that level's lessons on the theme, and its own metadata", async () => {
    const html = (await injectLessonPrerender(TEMPLATE, "/esl-lessons/b1/topics/work"))!;
    expect(html).toContain("<h1>Free B1 Work &amp; careers ESL Lessons (Intermediate)</h1>");
    expect(html).toContain("Office Talk");
    expect(html).toContain("Payday");
    expect(html).not.toContain("Lost Luggage");
    expect(html).not.toContain("First Day");
    expect(html).toContain("3 free B1 (intermediate) ESL conversation lessons about work &amp; careers");
    expect(html).toContain("B1 lessons ask for opinions and reasons");
    expect(html).toContain('<link rel="canonical" href="https://planwiseesl.com/esl-lessons/b1/topics/work" />');
    expect(html).not.toContain("noindex");
    const doc = new DOMParser().parseFromString(html, "text/html");
    const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!));
    const collection = schemas.find((s) => s["@type"] === "CollectionPage");
    expect(collection?.educationalLevel).toBe("CEFR B1");
    expect(collection?.isAccessibleForFree).toBe(true);
    expect(collection?.mainEntity?.numberOfItems).toBe(3);
    const crumbs = schemas.find((s) => s["@type"] === "BreadcrumbList");
    expect(crumbs?.itemListElement?.map((c: any) => c.name)).toEqual(["Home", "ESL Lessons", "B1", "Work & careers"]);
  });

  it("links the same theme at other levels only where that page exists, and the other themes at this level", async () => {
    const html = (await injectLessonPrerender(TEMPLATE, "/esl-lessons/b1/topics/work"))!;
    expect(html).toContain('<a href="/esl-lessons/b2/topics/work">B2 Upper Intermediate (3)</a>');
    expect(html).toContain('<span class="lp-muted">A2 Elementary</span>');
    expect(html).toContain('<a href="/esl-lessons/topics/work">All levels</a>');
    expect(html).toContain("Other B1 themes");
    // One B1 travel lesson: too few for its own page, so the hub.
    expect(html).toContain('<a href="/esl-lessons/topics/travel">Travel (1)</a>');
    expect(html).toContain('<a href="/esl-lessons/topics/money">Money (1)</a>');
  });

  it("is a real null (404 upstream) below the minimum, for unknown themes and levels", async () => {
    expect(await injectLessonPrerender(TEMPLATE, "/esl-lessons/a2/topics/work")).toBeNull();
    expect(await injectLessonPrerender(TEMPLATE, "/esl-lessons/b1/topics/travel")).toBeNull();
    expect(await injectLessonPrerender(TEMPLATE, "/esl-lessons/b1/topics/not-a-theme")).toBeNull();
    expect(await injectLessonPrerender(TEMPLATE, "/esl-lessons/b9/topics/work")).toBeNull();
  });

  it("is linked from the level page and from the theme hub's level headings", async () => {
    const levelHtml = (await injectLessonPrerender(TEMPLATE, "/esl-lessons/b1"))!;
    expect(levelHtml).toContain("Browse B1 Lessons by Theme");
    expect(levelHtml).toContain('<a href="/esl-lessons/b1/topics/work">Work &amp; careers (3)</a>');
    expect(levelHtml).toContain('<a href="/esl-lessons/topics/travel">Travel (1)</a>');

    const hubHtml = (await injectLessonPrerender(TEMPLATE, "/esl-lessons/topics/work"))!;
    expect(hubHtml).toContain('<h2><a href="/esl-lessons/b1/topics/work">B1 Work &amp; careers lessons (3)</a></h2>');
    expect(hubHtml).toContain('<h2><a href="/esl-lessons/a2">A2 Elementary</a></h2>');
  });
});

describe("injectLessonPrerender: sentence frames and idioms & phrasal verbs", () => {
  const withSections = (...sections: Record<string, unknown>[]) => ({
    ...baseLesson,
    content: { sections: [...baseLesson.content.sections, ...sections] },
  });
  const about = (html: string) => html.match(/<p class="lp-about">([\s\S]*?)<\/p>/)?.[1] ?? "";

  it("shows each current sentence frame with its three levels of support", async () => {
    getLesson.mockResolvedValue(
      withSections({
        type: "sentenceFrames",
        version: "v2_pedagogical",
        title: "Language Practice: Travel",
        introduction: "Practice talking about travel.",
        pedagogicalFrames: [
          {
            languageFunction: "Giving opinions",
            tieredFrames: { emerging: { frame: "I like ___." }, developing: { frame: "I like ___ because ___." }, expanding: { frame: "What I love about ___ is ___." } },
            modelResponses: { emerging: ["I like trains."] },
          },
          { languageFunction: "Empty frame", tieredFrames: {} },
        ],
      }),
    );
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).toContain(
      "<section><h2>Language Practice: Travel</h2><p>Practice talking about travel.</p><ul><li><strong>Giving opinions</strong><ul><li><strong>Emerging:</strong> I like ___. &mdash; <em>I like trains.</em></li><li><strong>Developing:</strong> I like ___ because ___.</li><li><strong>Expanding:</strong> What I love about ___ is ___.</li></ul></li></ul></section>",
    );
    expect(html).not.toContain("Empty frame");
  });

  it("still shows older sentence frames as pattern templates", async () => {
    getLesson.mockResolvedValue(
      withSections({ type: "sentenceFrames", frames: [{ patternTemplate: "I think ___ because ___", languageFunction: "Giving opinions" }] }),
    );
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).toContain("<li><strong>I think ___ because ___</strong> &mdash; Giving opinions</li>");
  });

  it("shows a lesson's idioms & phrasal verbs and counts them in the summary", async () => {
    getLesson.mockResolvedValue(
      withSections({
        type: "expressions",
        title: "Phrasal Verbs & Expressions",
        items: [
          { expression: "set off", kind: "phrasal verb", meaning: "to start a journey", example: "We **set off** at dawn.", yourTurn: "When do you set off for work?" },
          { expression: "get used to", kind: "expression", meaning: "to start to feel normal about something", example: "I **got used to** the food.", yourTurn: "What was hard to get used to?" },
        ],
      }),
    );
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).toContain("<h2>Phrasal Verbs &amp; Expressions</h2>");
    expect(html).toContain('<h3>set off <span class="lp-meta">(phrasal verb)</span></h3><p>to start a journey</p><p><em>We set off at dawn.</em></p>');
    expect(html).not.toContain("**");
    expect(about(html)).toContain("It includes 1 vocabulary words, 2 phrasal verbs and expressions, a reading text,");
  });

  it("leaves lessons without the section as they were", async () => {
    getLesson.mockResolvedValue(baseLesson);
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).not.toContain("Idioms");
    expect(about(html)).toContain("It includes 1 vocabulary words, a reading text, comprehension questions and discussion questions.");
  });

  it("renders rich vocabulary fields (pronunciation, word family, semantic map, usage notes) and sentence unscramble prompts without leaking answers", async () => {
    getLesson.mockResolvedValue({
      ...baseLesson,
      content: {
        sections: [
          {
            type: "vocabulary",
            title: "Key Vocabulary",
            words: [
              {
                term: "itinerary",
                partOfSpeech: "noun",
                pronunciation: "eye-TIN-er-air-ee",
                definition: "A detailed plan of a journey.",
                example: "Our itinerary includes three cities.",
                additionalExamples: ["She printed the itinerary before boarding.", "We tweaked our itinerary on day two."],
                collocations: ["packed itinerary", "travel itinerary"],
                wordFamily: { words: ["itinerant", "itineraries"] },
                usageNotes: "Often used for business or multi-stop trips.",
                semanticMap: {
                  synonyms: ["schedule", "route"],
                  antonyms: ["improvisation"],
                  relatedConcepts: ["travel planning"],
                  contexts: ["holidays", "business travel"],
                },
              },
            ],
          },
          {
            type: "discussion",
            title: "Discussion Questions",
            questions: [
              {
                paragraphContext: "Some travellers plan every hour; others leave space for luck.",
                question: "How tightly do you plan a trip?",
              },
            ],
          },
          {
            type: "expressions",
            title: "Idioms & Phrasal Verbs",
            items: [
              {
                expression: "put off",
                kind: "phrasal verb",
                meaning: "to delay something",
                example: "Don't **put off** booking.",
                yourTurn: "Do you ever put off booking flights?",
                notes: [{ text: "Separable verb.", right: "put it off", wrong: "put off it" }],
              },
            ],
          },
          {
            type: "sentenceUnscramble",
            title: "Sentence Unscramble",
            sentences: [
              {
                words: ["our", "full", "itinerary", "is"],
                correctSentence: "Our itinerary is full.",
              },
            ],
          },
        ],
      },
    });
    const html = (await injectLessonPrerender(TEMPLATE, "/lessons/42"))!;
    expect(html).toContain("eye-TIN-er-air-ee");
    expect(html).toContain("<strong>More examples:</strong> She printed the itinerary before boarding. • We tweaked our itinerary on day two.");
    expect(html).toContain("<strong>Common collocations:</strong> packed itinerary, travel itinerary");
    expect(html).toContain("<strong>Word family:</strong> itinerant, itineraries");
    expect(html).toContain("<strong>Synonyms:</strong> schedule, route");
    expect(html).toContain("<strong>Antonyms:</strong> improvisation");
    expect(html).toContain("<strong>Related concepts:</strong> travel planning");
    expect(html).toContain("<strong>Contexts:</strong> holidays, business travel");
    expect(html).toContain("<strong>Usage note:</strong> Often used for business or multi-stop trips.");
    expect(html).toContain("Some travellers plan every hour; others leave space for luck.");
    expect(html).toContain("How tightly do you plan a trip?");
    expect(html).toContain("Separable verb. · Right: put it off · Avoid: put off it");
    expect(html).toContain('href="/compare/student-memory-proof"');
    expect(html).toContain("<h2>Sentence Unscramble</h2>");
    expect(html).toContain("<li>our / full / itinerary / is</li>");
    // Answer key never leaks into public crawler HTML
    expect(html).not.toContain("Our itinerary is full.");
  });
});

describe("CollectionPage free-access and dual-audience metadata", () => {
  it("marks /esl-lessons and /esl-lessons/topics/work as free with both teacher and learner audiences", async () => {
    const workLesson = { ...baseLesson, publicSlug: "work-chat", publicLevel: "b1", tags: ["work"] };
    getPublicLessonSummaries.mockResolvedValue([workLesson]);

    for (const path of ["/esl-lessons", "/esl-lessons/topics/work"]) {
      const html = await injectLessonPrerender(TEMPLATE, path);
      expect(html, path).toBeTruthy();
      const doc = new DOMParser().parseFromString(html!, "text/html");
      const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!));
      const collection = schemas.find((s) => s["@type"] === "CollectionPage");
      expect(collection?.isAccessibleForFree).toBe(true);
      expect(collection?.inLanguage).toBe("en");
      expect(collection?.audience?.map((a: any) => a.educationalRole)).toEqual(["teacher", "student"]);
    }
  });

  it("renders the solo-learner AI tutor prompt guide and model tip on /esl-lessons", async () => {
    getPublicLessonSummaries.mockResolvedValue([{ ...baseLesson, publicSlug: "travel-plans", publicLevel: "b1", tags: ["travel"] }]);
    const html = await injectLessonPrerender(TEMPLATE, "/esl-lessons");
    expect(html).toContain('id="self-study-with-ai"');
    expect(html).toContain("Studying on your own? Practise any free lesson with AI");
    expect(html).toContain("Model tip:");
    expect(html).toContain("AI is great for solo practice between classes");
    expect(html).toContain('href="https://speakwithdave.com"');
  });
});
