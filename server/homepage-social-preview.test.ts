import { readFileSync } from "node:fs";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { homepageMeta } from "../shared/homepage-content";
import { SEOHead } from "../client/src/components/SEOHead";
import { injectLandingPrerender } from "./landing-prerender";

const template = readFileSync("client/index.html", "utf8");
const socialDescription = homepageMeta.description.length > 160
  ? homepageMeta.description.substring(0, 157) + "..."
  : homepageMeta.description;
const socialCopy = [
  ["property", "og:title", homepageMeta.title],
  ["name", "twitter:title", homepageMeta.title],
  ["property", "og:description", socialDescription],
  ["name", "twitter:description", socialDescription],
];

describe("homepage social preview", () => {
  for (const [label, html] of [
    ["initial HTML", template],
    ["prerendered homepage", injectLandingPrerender(template)],
  ]) {
    it(`uses the shared homepage title and description in ${label}`, () => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      expect(doc.title).toBe(homepageMeta.title);
      for (const [attribute, key, value] of socialCopy) {
        const tags = doc.querySelectorAll(`meta[${attribute}="${key}"]`);
        expect(tags, key).toHaveLength(1);
        expect(tags[0].getAttribute("content"), key).toBe(value);
      }
    });

    it(`uses the fresh homepage image and homepage destination in ${label}`, () => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      for (const [attribute, key, value] of [
        ["property", "og:image", `${homepageMeta.canonicalUrl}${homepageMeta.imagePath}`],
        ["name", "twitter:image", `${homepageMeta.canonicalUrl}${homepageMeta.imagePath}`],
        ["property", "og:image:alt", homepageMeta.imageAlt],
        ["name", "twitter:image:alt", homepageMeta.imageAlt],
        ["property", "og:url", homepageMeta.canonicalUrl],
        ["name", "twitter:url", homepageMeta.canonicalUrl],
        ["property", "og:image:type", "image/png"],
        ["property", "og:image:width", "1200"],
        ["property", "og:image:height", "630"],
      ]) {
        const tags = doc.querySelectorAll(`meta[${attribute}="${key}"]`);
        expect(tags, key).toHaveLength(1);
        expect(tags[0].getAttribute("content"), key).toBe(value);
      }
      expect(html).not.toContain("twitter-card-new-design.png");
    });
  }

  it("replaces stale template social wording during homepage prerendering", () => {
    const staleTemplate = template.replace(
      /(<meta (?:property|name)="(?:og|twitter):(?:title|description)" content=")[^"]*"/g,
      '$1Outdated copy"',
    );
    const doc = new DOMParser().parseFromString(injectLandingPrerender(staleTemplate), "text/html");
    for (const [attribute, key, value] of socialCopy) {
      expect(doc.querySelector(`meta[${attribute}="${key}"]`)?.getAttribute("content"), key)
        .toBe(value);
    }
  });

  it("keeps the same social wording when the homepage client metadata loads", () => {
    const previousHead = document.head.innerHTML;
    document.head.innerHTML = new DOMParser()
      .parseFromString(injectLandingPrerender(template), "text/html").head.innerHTML;
    const container = document.createElement("div");
    const root = createRoot(container);
    try {
      act(() => root.render(createElement(SEOHead, {
        title: homepageMeta.title,
        exactTitle: true,
        description: homepageMeta.description,
        canonicalUrl: homepageMeta.canonicalUrl,
        ogImageAlt: homepageMeta.imageAlt,
      })));
      expect(document.title).toBe(homepageMeta.title);
      for (const [attribute, key, value] of socialCopy) {
        const tags = document.querySelectorAll(`meta[${attribute}="${key}"]`);
        expect(tags, key).toHaveLength(1);
        expect(tags[0].getAttribute("content"), key).toBe(value);
      }
    } finally {
      act(() => root.unmount());
      document.head.innerHTML = previousHead;
    }
  });

  it("ships a real 1200 × 630 PNG at the new asset path", () => {
    const png = readFileSync(`public${homepageMeta.imagePath}`);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
});
