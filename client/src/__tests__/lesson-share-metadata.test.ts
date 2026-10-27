import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { SEOHead } from "../components/SEOHead";
import { lessonPublicMetadata } from "@shared/lesson-public-metadata";

afterEach(cleanup);

describe("browser-side lesson preview metadata", () => {
  it("matches server-safe metadata even when the owner can see the private topic", () => {
    const lesson = {
      id: 42, title: "Travel Plans", cefrLevel: "B1",
      topic: "PRIVATE student information", notes: "PRIVATE teacher notes",
      content: { sections: [{ type: "reading", paragraphs: ["A trip to London."] }] },
    };
    const metadata = lessonPublicMetadata(lesson);
    document.head.innerHTML = `<meta property="og:url" content="https://planwiseesl.com">
      <meta property="og:image" content="old-homepage.png"><meta property="og:image:type" content="image/png">
      <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`;
    render(createElement(SEOHead, {
      title: metadata.title, description: metadata.description,
      keywords: [lesson.title, lesson.cefrLevel], canonicalUrl: metadata.canonicalPath,
      ogImage: metadata.imagePath, ogImageAlt: metadata.imageAlt,
      ogImageDimensions: null, ogType: "article", noindex: true,
    }));
    const meta = (key: string) => document.querySelector(`meta[property="${key}"],meta[name="${key}"]`)?.getAttribute("content");
    expect(document.title).toBe(metadata.title);
    expect(meta("og:title")).toBe(metadata.title);
    expect(meta("og:url")).toBe("https://planwiseesl.com/lessons/42");
    expect(meta("og:image")).toBe("https://planwiseesl.com/api/lessons/42/share-image?v=1");
    expect(meta("twitter:image")).toBe(meta("og:image"));
    expect(meta("og:description")).toBe(metadata.description);
    expect(meta("og:type")).toBe("article");
    expect(meta("robots")).toBe("noindex, nofollow");
    expect(document.head.innerHTML).not.toContain("PRIVATE");
    expect(document.head.innerHTML).not.toContain("old-homepage");
    expect(document.querySelector('meta[property="og:image:width"]')).toBeNull();
    expect(document.querySelector('meta[property="og:image:type"]')).toBeNull();
  });
});
