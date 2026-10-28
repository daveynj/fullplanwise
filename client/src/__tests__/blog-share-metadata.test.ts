import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { SEOHead } from "../components/SEOHead";
import { blogPublicMetadata } from "@shared/blog-public-metadata";

afterEach(cleanup);

describe("client blog preview metadata", () => {
  it.each([null, "A custom SEO title"])("keeps server metadata unchanged after mounting: %s", (metaTitle) => {
    const template = readFileSync("client/index.html", "utf8");
    document.head.innerHTML = new DOMParser().parseFromString(template, "text/html").head.innerHTML;
    const post = {
      title: "Speaking practice", slug: "speaking-practice", excerpt: "E".repeat(200),
      metaTitle, metaDescription: null, featuredImageUrl: "images/blog.jpg", featuredImageAlt: "Students speaking",
    };
    const metadata = blogPublicMetadata(post);
    render(createElement(SEOHead, {
      title: metadata.title, exactTitle: true, description: metadata.description,
      canonicalUrl: metadata.canonicalPath, ogImage: metadata.imageUrl,
      ogImageAlt: metadata.imageAlt, ogImageDimensions: null, ogType: "article",
    }));
    const meta = (key: string) => document.querySelector(`meta[property="${key}"],meta[name="${key}"]`)?.getAttribute("content");
    expect(document.title).toBe(metadata.title);
    expect(meta("og:title")).toBe(metadata.title);
    expect(meta("twitter:title")).toBe(metadata.title);
    expect(meta("og:description")).toBe(metadata.description);
    expect(meta("twitter:description")).toBe(metadata.description);
    expect(meta("og:url")).toBe("https://planwiseesl.com/blog/speaking-practice");
    expect(meta("twitter:url")).toBe(meta("og:url"));
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(meta("og:url"));
    expect(meta("og:type")).toBe("article");
    expect(meta("og:image")).toBe("https://planwiseesl.com/images/blog.jpg");
    expect(meta("twitter:image")).toBe(meta("og:image"));
    expect(meta("og:image:alt")).toBe(metadata.imageAlt);
    expect(meta("twitter:image:alt")).toBe(metadata.imageAlt);
    expect(document.querySelector('meta[property="og:image:width"]')).toBeNull();
    expect(document.querySelector('meta[property="og:image:type"]')).toBeNull();
  });
});
