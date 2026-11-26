// PlanWise no longer mentions Cambly (decided 26 Nov 2026): not in Dave's
// story, the audience copy, the guides, llms.txt or structured data. This
// catches it coming back in the public copy. The only allowed mention is
// the old guide address, which 301-redirects to /guides.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { marketingPages } from "@shared/marketing-pages";

const RETIRED_GUIDE = "/guides/cambly-feedback-score-super-tutor";

const publicCopy = [
  "public/llms.txt",
  "public/llms-full.txt",
  "shared/homepage-content.ts",
  "shared/marketing-pages.ts",
  "shared/guides.ts",
  "shared/site-facts.ts",
  "client/index.html",
].filter((file) => existsSync(file));

describe("no Cambly in the public copy", () => {
  it.each(publicCopy)("%s doesn't mention Cambly", (file) => {
    const text = readFileSync(file, "utf8").split(RETIRED_GUIDE).join("");
    expect(text).not.toMatch(/cambly/i);
  });

  it("the old Cambly guide is no longer a page", () => {
    expect(marketingPages.map((page) => page.path)).not.toContain(RETIRED_GUIDE);
  });
});
