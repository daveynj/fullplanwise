import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { homepageMeta } from "../shared/homepage-content";
import { injectLandingPrerender } from "./landing-prerender";

const template = readFileSync("client/index.html", "utf8");

describe("homepage social preview", () => {
  for (const [label, html] of [
    ["initial HTML", template],
    ["prerendered homepage", injectLandingPrerender(template)],
  ]) {
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

  it("ships a real 1200 × 630 PNG at the new asset path", () => {
    const png = readFileSync(`public${homepageMeta.imagePath}`);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
});
