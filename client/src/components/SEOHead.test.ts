import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SEOHead } from "./SEOHead";
import { homepageMeta } from "@shared/homepage-content";
import { lessonPublicMetadata } from "@shared/lesson-public-metadata";

let root: Root;

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = '<div id="test-root"></div>';
  root = createRoot(document.getElementById("test-root")!);
});

afterEach(() => {
  act(() => root.unmount());
});

const content = (key: string) =>
  document.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute("content");

describe("social preview client metadata", () => {
  it("defaults to the fresh image and keeps the homepage destination", () => {
    act(() => root.render(createElement(SEOHead, {
      title: homepageMeta.title,
      description: homepageMeta.description,
      canonicalUrl: homepageMeta.canonicalUrl,
      ogImageAlt: homepageMeta.imageAlt,
    })));
    expect(content("og:image")).toBe(`${homepageMeta.canonicalUrl}${homepageMeta.imagePath}`);
    expect(content("twitter:image")).toBe(content("og:image"));
    expect(content("og:image:alt")).toBe(homepageMeta.imageAlt);
    expect(content("twitter:image:alt")).toBe(homepageMeta.imageAlt);
    expect(content("og:url")).toBe(`${homepageMeta.canonicalUrl}/`);
    expect(content("twitter:url")).toBe(content("og:url"));
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href"))
      .toBe(`${homepageMeta.canonicalUrl}/`);
  });

  it("keeps a lesson's own image and destination when navigating from the homepage", () => {
    act(() => root.render(createElement(SEOHead, {
      title: homepageMeta.title,
      description: homepageMeta.description,
      canonicalUrl: homepageMeta.canonicalUrl,
    })));
    const lesson = lessonPublicMetadata({
      id: 42, title: "Travel", cefrLevel: "B1", content: { sections: [] },
    });
    act(() => root.render(createElement(SEOHead, {
      title: lesson.title, exactTitle: true, description: lesson.description,
      canonicalUrl: lesson.canonicalPath, ogImage: lesson.imagePath,
      ogImageAlt: lesson.imageAlt, ogImageDimensions: null,
    })));
    expect(content("og:image")).toBe(`https://planwiseesl.com${lesson.imagePath}`);
    expect(content("twitter:image")).toBe(content("og:image"));
    expect(content("og:url")).toBe("https://planwiseesl.com/lessons/42");
    expect(content("twitter:url")).toBe(content("og:url"));
    expect(content("og:image:width")).toBeUndefined();
  });
});
