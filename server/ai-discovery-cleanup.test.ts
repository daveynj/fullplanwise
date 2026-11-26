import fs from "node:fs";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import type { Express, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  siteFacts,
  trialText,
  priceText,
  organizationSameAs,
  founderSameAs,
  founderPerson,
} from "../shared/site-facts";
import { hero, homepageMeta } from "../shared/homepage-content";
import { marketingPages } from "../shared/marketing-pages";
import {
  cefrLevelsGuide,
  planConversationLessonGuide,
  topicsByLevelGuide,
  personaliseGuide,
} from "../shared/guides";
import { SEOHead } from "../client/src/components/SEOHead";
import { injectLandingPrerender } from "./landing-prerender";
import { AUTH_ROBOTS_DIRECTIVE, injectAuthNoindex } from "./auth-prerender";
import { buildLlmsFullTxt } from "./llms-full";
import { serveStatic } from "./vite";

vi.mock("./storage", () => ({ storage: {} }));

const template = fs.readFileSync("client/index.html", "utf8");
const robotsTxt = fs.readFileSync("public/robots.txt", "utf8");
const appSource = fs.readFileSync("client/src/App.tsx", "utf8");
const twitterCardSource = fs.readFileSync("client/src/components/TwitterCard.tsx", "utf8");

afterEach(() => vi.restoreAllMocks());

describe("AI discovery cleanup (option 1)", () => {
  it("(a) points the SoftwareApplication Unlimited offer URL to /pricing instead of disallowed /buy-credits", () => {
    const html = injectLandingPrerender(template);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1]));
    const software = blocks.find((b) => b["@type"] === "SoftwareApplication");
    const unlimited = software.offers.find((o: any) => o.name === "Unlimited");

    expect(unlimited.url).toBe("https://planwiseesl.com/pricing");
    expect(unlimited.url).not.toContain("/buy-credits");
    expect(robotsTxt).toContain("Disallow: /buy-credits");
  });

  it("(b) marks /auth as noindex, follow server-side (HTML meta and X-Robots-Tag header) and client-side", () => {
    // 1. HTML injection
    const html = injectAuthNoindex(template);
    const doc = new DOMParser().parseFromString(html, "text/html");
    const robotsTags = doc.querySelectorAll('meta[name="robots"]');
    expect(robotsTags).toHaveLength(1);
    expect(robotsTags[0].getAttribute("content")).toBe("noindex, follow");
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://planwiseesl.com/auth");
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe("https://planwiseesl.com/auth");

    // 2. Production serveStatic route sets X-Robots-Tag header and serves noindex HTML
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(template);
    const routes = new Map<string, Function>();
    const app = {
      get: (routePath: string, handler: Function) => {
        routes.set(routePath, handler);
      },
      use: vi.fn(),
    };
    serveStatic(app as unknown as Express);
    const authHandler = routes.get("/auth");
    expect(authHandler).toBeTypeOf("function");

    const res = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };
    authHandler!({ originalUrl: "/auth?register=true" } as Request, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ "X-Robots-Tag": AUTH_ROBOTS_DIRECTIVE }));
    expect(res.end.mock.calls[0][0]).toContain('<meta name="robots" content="noindex, follow" />');

    // 3. Client-side SEOHead supports robots="noindex, follow"
    const previousHead = document.head.innerHTML;
    const container = document.createElement("div");
    const root = createRoot(container);
    try {
      act(() =>
        root.render(
          createElement(SEOHead, {
            title: "Log In or Start Your Free Trial | PlanWise ESL",
            description: "Log in to PlanWise ESL.",
            canonicalUrl: "https://planwiseesl.com/auth",
            noindex: true,
            robots: "noindex, follow",
          }),
        ),
      );
      expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, follow");
    } finally {
      act(() => root.unmount());
      document.head.innerHTML = previousHead;
    }

    // 4. /auth is not in marketingPages (which feeds the sitemap)
    expect(marketingPages.some((p) => p.path === "/auth")).toBe(false);
  });

  it("(c) removes stale 'in seconds' global TwitterCard copy from App.tsx and TwitterCard.tsx", () => {
    expect(appSource).not.toContain("@/components/TwitterCard");
    expect(appSource).not.toMatch(/<TwitterCard\b/);
    expect(appSource).not.toMatch(/in seconds/i);
    expect(appSource).not.toContain("twitter-card-new-design.png");
    expect(twitterCardSource).not.toMatch(/in seconds/i);
    expect(twitterCardSource).toContain("site-facts");
  });

  it("(d) unifies Organization/Person sameAs across site-facts, index.html and SEOHead without GitHub repo or Facebook profiles", () => {
    expect([...organizationSameAs]).toEqual([
      "https://x.com/PlanwiseESL",
    ]);
    expect([...founderSameAs]).toEqual([
      "https://speakwithdave.com",
      "https://www.linkedin.com/in/davidjackson113",
      "https://x.com/DaveTeacher1",
      "https://www.youtube.com/@EnglishteacherDave",
    ]);
    expect(founderPerson).not.toHaveProperty("description");

    // Check client/index.html inline JSON-LD matches
    const indexDoc = new DOMParser().parseFromString(template, "text/html");
    const indexLd = JSON.parse(indexDoc.querySelector('script[type="application/ld+json"]')!.textContent!);
    const org = indexLd["@graph"].find((node: any) => node["@type"] === "Organization");
    expect(org.sameAs).toEqual([...organizationSameAs]);
    expect(org.founder.sameAs).toEqual([...founderSameAs]);
    expect(org.founder).not.toHaveProperty("description");
    expect(template.toLowerCase()).not.toContain("facebook.com");
    expect(template.toLowerCase()).not.toContain("github.com/daveynj/fullplanwise");

    // Check client SEOHead article JSON-LD matches
    const previousHead = document.head.innerHTML;
    const container = document.createElement("div");
    const root = createRoot(container);
    try {
      act(() =>
        root.render(
          createElement(SEOHead, {
            title: "Sample Post",
            description: "Sample post description.",
            canonicalUrl: "https://planwiseesl.com/blog/sample",
            article: {
              publishedTime: "2026-11-25T00:00:00Z",
              author: "Dave Jackson",
              section: "Teaching Tips",
              tags: ["ESL"],
            },
          }),
        ),
      );
      const articleLd = JSON.parse(document.getElementById("seo-article-jsonld")!.textContent!);
      expect(articleLd.author.sameAs).toEqual([...founderSameAs]);
      expect(articleLd.author).not.toHaveProperty("description");
      expect(articleLd.publisher.sameAs).toEqual([...organizationSameAs]);
      expect(JSON.stringify(articleLd).toLowerCase()).not.toContain("facebook.com");
      expect(JSON.stringify(articleLd).toLowerCase()).not.toContain("github.com/daveynj/fullplanwise");
    } finally {
      act(() => root.unmount());
      document.head.innerHTML = previousHead;
    }
  });

  it("(f) adds VideoObject schema for the homepage YouTube demo video using existing page facts only", () => {
    const html = injectLandingPrerender(template);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1]));
    const video = blocks.find((b) => b["@type"] === "VideoObject");

    expect(video).toBeDefined();
    expect(video.name).toBe(hero.videoTitle);
    expect(video.description).toBe(homepageMeta.description);
    expect(video.embedUrl).toBe(hero.videoUrl);
    expect(video.contentUrl).toBe("https://www.youtube.com/watch?v=pcLlwL5sNK0");
    expect(video.thumbnailUrl).toBe("https://i.ytimg.com/vi/pcLlwL5sNK0/hqdefault.jpg");
    // No invented upload dates, durations or view counts
    expect(video).not.toHaveProperty("uploadDate");
    expect(video).not.toHaveProperty("duration");
    expect(video).not.toHaveProperty("interactionStatistic");
  });

  it("(g) links /llms.txt in <head> and builds /llms-full.txt from homepage, marketing pages and guides", () => {
    const doc = new DOMParser().parseFromString(template, "text/html");
    const altLink = doc.querySelector('link[rel="alternate"][href="/llms.txt"]');
    expect(altLink).not.toBeNull();
    expect(altLink?.getAttribute("type")).toBe("text/plain");

    const full = buildLlmsFullTxt();
    expect(full).toContain(siteFacts.brand);
    expect(full).toContain(trialText);
    expect(full).toContain(priceText);
    expect(full).toContain(siteFacts.generationTime);
    expect(full).toContain(hero.heading);
    expect(full).toContain(cefrLevelsGuide.h1);
    expect(full).toContain(planConversationLessonGuide.h1);
    expect(full).toContain(topicsByLevelGuide.h1);
    expect(full).toContain(personaliseGuide.h1);
    for (const page of marketingPages) {
      expect(full, page.path).toContain(`https://planwiseesl.com${page.path}`);
    }
    // All internal markdown links are absolutised
    expect(full).not.toMatch(/\]\(\/[^)\s]+\)/);
    expect(full.toLowerCase()).not.toContain("facebook.com");
    expect(full.toLowerCase()).not.toContain("github.com/daveynj/fullplanwise");
    expect(full).not.toMatch(/in seconds/i);
  });
});
