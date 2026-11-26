import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { marketingPages, publicNav, renderInline, marketingPageByPath } from "../shared/marketing-pages";
import { validClientRoutes } from "../shared/client-routes";
import { injectMarketingPrerender } from "./marketing-prerender";

const template = readFileSync("client/index.html", "utf8");
const isPage = (href: string) => validClientRoutes.some((re) => re.test(href.replace(/[?#].*$/, "")));

describe("public information pages", () => {
  it("are all real client routes, and so is every navigation link", () => {
    for (const page of marketingPages) expect(isPage(page.path), page.path).toBe(true);
    for (const link of publicNav) expect(isPage(link.href), link.href).toBe(true);
  });

  for (const page of marketingPages) {
    describe(page.path, () => {
      const html = injectMarketingPrerender(template, page.path)!;
      const doc = new DOMParser().parseFromString(html, "text/html");

      it("serves its own title, description, canonical URL and one H1 to crawlers", () => {
        expect(doc.title).toBe(page.title);
        expect(page.description.length).toBeLessThanOrEqual(160);
        expect(doc.querySelectorAll('meta[name="description"]')).toHaveLength(1);
        expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://planwiseesl.com${page.path}`);
        expect(doc.querySelectorAll("h1")).toHaveLength(1);
        expect(doc.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(`https://planwiseesl.com${page.path}`);
      });

      it("has valid structured data, including its FAQ", () => {
        const blocks = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!));
        const types = blocks.flatMap((b) => (b["@graph"] ? b["@graph"].map((g: any) => g["@type"]) : [b["@type"]]));
        expect(types).toContain(page.schemaType);
        expect(types).toContain("BreadcrumbList");
        if (page.faq) expect(types).toContain("FAQPage");
      });

      it("only links to pages that exist", () => {
        const text = JSON.stringify(page);
        for (const [, href] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
          if (/^(https?:|mailto:)/.test(href)) continue;
          expect(isPage(href), href).toBe(true);
        }
        expect(isPage(page.cta.href)).toBe(true);
      });
    });
  }

  it("describes the founder with his tutoring site, so search engines connect the two", () => {
    const html = injectMarketingPrerender(template, "/about")!;
    const blocks = [...new DOMParser().parseFromString(html, "text/html").querySelectorAll('script[type="application/ld+json"]')]
      .map((s) => JSON.parse(s.textContent!));
    const aboutPage = blocks.find((b) => b["@type"] === "AboutPage");
    expect(aboutPage.mainEntity.name).toBe("Dave Jackson");
    expect(aboutPage.mainEntity.sameAs).toContain("https://speakwithdave.com");
    expect(html).toContain('href="https://speakwithdave.com"');
  });

  it("renders answer-first verdicts, workflow proofs, and subtle founder attribution in comparison SSR HTML", () => {
    for (const path of ["/compare/twee", "/compare/esl-joy", "/compare/magicschool-diffit", "/compare/student-memory-proof", "/compare/fluentize", "/compare/esl-brains"]) {
      const html = injectMarketingPrerender(template, path)!;
      const doc = new DOMParser().parseFromString(html, "text/html");
      expect(doc.querySelector(".mp-verdict h2")?.textContent?.length).toBeGreaterThan(10);
      expect(doc.querySelectorAll("ol").length).toBeGreaterThanOrEqual(2);
      expect(html).toContain('href="https://speakwithdave.com"');
    }
  });

  it("ignores other paths", () => {
    expect(injectMarketingPrerender(template, "/blog")).toBeNull();
    expect(marketingPageByPath("/about/")).toBeDefined();
  });

  it("escapes text before applying bold and links", () => {
    expect(renderInline('**a** <b> [x](/about) "q"')).toBe('<strong>a</strong> &lt;b&gt; <a href="/about">x</a> &quot;q&quot;');
    expect(renderInline("[x](https://example.com)")).toContain('rel="noopener noreferrer"');
  });
});
