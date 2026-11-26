import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { siteFacts, trialText, priceText } from "../shared/site-facts";
import { hero, faq, features, footer, homepageMeta, pricing } from "../shared/homepage-content";
import { validClientRoutes } from "../shared/client-routes";
import { buildLandingStructuredData, injectLandingPrerender } from "./landing-prerender";
import { demoteH1 } from "./blog-prerender";

vi.mock("./storage", () => ({ storage: {} }));

const llms = readFileSync("public/llms.txt", "utf8");
const template = readFileSync("client/index.html", "utf8");

// Search engines and AI assistants compare what pages say. These checks stop
// the trial, price and timing claims drifting apart again.
describe("site facts stay consistent", () => {
  it("llms.txt states the same trial, price and timing as the homepage", () => {
    expect(llms).toContain(`${siteFacts.trialDays}-day free trial`);
    expect(llms).toContain(priceText);
    expect(llms).toContain(siteFacts.generationTime);
    expect(homepageMeta.description).toContain(trialText);
    expect(pricing.plans.find((p) => p.highlighted)?.price).toBe(siteFacts.price);
  });

  it("llms.txt only links to pages that exist", () => {
    const paths = [...llms.matchAll(/https:\/\/planwiseesl\.com(\/[^\s),]*)?/g)]
      .map((m) => (m[1] || "/").replace(/\?.*$/, ""))
      .filter((p) => p !== "/sitemap.xml");
    expect(paths.length).toBeGreaterThan(3);
    for (const path of paths) {
      expect(validClientRoutes.some((re) => re.test(path)), path).toBe(true);
    }
  });

  it("homepage links point at real pages", () => {
    const hrefs = [
      ...faq.items.flatMap((item) => item.answer).flatMap((part) => (part.type === "link" ? [part.href] : [])),
      ...footer.quickLinks.map((l) => l.href),
    ].map((h) => h.replace(/\?.*$/, ""));
    for (const href of hrefs) {
      expect(validClientRoutes.some((re) => re.test(href)), href).toBe(true);
      // Blog posts are addressed by slug; numeric ids are always 404s.
      expect(href).not.toMatch(/^\/blog\/\d+$/);
    }
  });

  it("homepage copy makes no claims the product cannot back up", () => {
    const copy = JSON.stringify({ hero, faq, features });
    for (const claim of ["45 seconds", "trained on", "fully editable", "15+ hours"]) {
      expect(copy, claim).not.toContain(claim);
    }
  });

  it("the page template uses one brand name", () => {
    const withoutHandle = template.replace(/@PlanwiseESL|x\.com\/PlanwiseESL/g, "");
    const alternates = /"alternateName": \[[^\]]*\]/g;
    expect(withoutHandle.replace(alternates, "")).not.toMatch(/PlanwiseESL|Plan Wise ESL|PLAN WISE ESL/);
  });

  it("llms.txt documents the full pedagogical sequence, study PDF, student-created lessons and exact ICP", () => {
    const lower = llms.toLowerCase();
    for (const phrase of [
      "word families",
      "usage notes",
      "synonyms",
      "antonyms",
      "flashcards",
      "sentence unscramble",
      "study pdf",
      "cambly",
      "preply",
      "italki",
      "freelance",
      "small to medium language schools",
      "create custom lessons",
    ]) {
      expect(lower, phrase).toContain(phrase);
    }
  });
});

describe("homepage structured data", () => {
  const blocks = [...injectLandingPrerender(template).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]));

  it("describes the product with its real offers and no invented ratings", () => {
    const software = blocks.find((b) => b["@type"] === "SoftwareApplication");
    expect(software).toBeDefined();
    expect(software.name).toBe(siteFacts.brand);
    expect(software.offers.map((o: any) => o.price)).toEqual(["0", siteFacts.priceValue]);
    expect(software.offers.find((o: any) => o.name === "Unlimited")?.url).toBe(`${siteFacts.url}/pricing`);
    expect(software).not.toHaveProperty("aggregateRating");
  });

  it("merges tutor-specific details without duplicating the product or renaming its plan", () => {
    const products = blocks.filter((b) => b["@type"] === "SoftwareApplication");
    expect(products).toHaveLength(1);
    const software = products[0];
    expect(software.description).toContain(`CEFR ${siteFacts.levels}`);
    expect(software.description).toContain(siteFacts.generationTime);
    expect(software.description).toContain("Preply, Cambly, and italki");
    expect(software.description).toContain("per-student vocabulary memory");
    expect(software.description).toContain("private student flashcard dashboards");
    expect(software.author).toEqual({
      "@type": "Person", name: siteFacts.founder, url: siteFacts.founderSite,
    });
    const paid = software.offers.find((o: any) => o.name === "Unlimited");
    expect(paid.description).toContain(priceText);
    expect(paid.description).toContain(trialText);
    expect(paid.priceSpecification.referenceQuantity.unitCode).toBe("MON");
    expect(software).not.toHaveProperty("sameAs");
  });

  it("includes every homepage FAQ as a question and answer", () => {
    const faqPage = blocks.find((b) => b["@type"] === "FAQPage");
    expect(faqPage.mainEntity).toHaveLength(faq.items.length);
    for (const q of faqPage.mainEntity) expect(q.acceptedAnswer.text.length).toBeGreaterThan(20);
  });

  it("cannot be broken out of by page text", () => {
    const output = buildLandingStructuredData();
    const openings = output.match(/<script type="application\/ld\+json">/g) ?? [];
    const closings = output.match(/<\/script>/g) ?? [];
    expect(openings).toHaveLength(3);
    expect(closings).toHaveLength(openings.length);
  });
});

describe("blog post headings", () => {
  it("turns H1s written in a post body into H2s", () => {
    expect(demoteH1('<h1 class="x">Title</h1><p>a</p><H1>B</H1 >')).toBe('<h2 class="x">Title</h2><p>a</p><h2>B</h2>');
    expect(demoteH1("<h10>not a heading</h10><header>keep</header>")).toBe("<h10>not a heading</h10><header>keep</header>");
  });
});
