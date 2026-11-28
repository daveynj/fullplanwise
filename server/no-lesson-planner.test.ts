// PlanWise ESL makes finished, ready-to-teach lessons, made for each student
// (decided 28 Nov 2026). The public copy doesn't call it a "lesson planner",
// a "lesson plan generator" or a "lesson planning tool". This catches that
// wording coming back. Lesson planning as a teacher's task can still be named,
// and llms.txt may still say that PlanWise "is not a lesson-planning tool".
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";

const publicCopy = [
  "README.md",
  "public/llms.txt",
  "shared/homepage-content.ts",
  "shared/marketing-pages.ts",
  "shared/icp-pages.ts",
  "shared/comparison-pages.ts",
  "shared/student-experience-page.ts",
  "shared/guides.ts",
  "shared/site-facts.ts",
  "server/landing-prerender.ts",
  "server/llms-full.ts",
  "server/mcp-server.ts",
  "client/index.html",
  "client/src/components/SEOHead.tsx",
  "client/src/pages/auth-page.tsx",
  "client/src/pages/student-page-home.tsx",
].filter((file) => existsSync(file));

describe("PlanWise isn't called a lesson planner", () => {
  it.each(publicCopy)("%s doesn't call PlanWise a lesson planner", (file) => {
    const text = readFileSync(file, "utf8").replace(/is not a lesson-planning tool/gi, "");
    expect(text).not.toMatch(/lesson[- ]planner|lesson[- ]plan generator|lesson[- ]planning tool/i);
  });
});
