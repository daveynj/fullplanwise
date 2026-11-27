import { describe, it, expect, vi } from "vitest";
import { tutorLinkFor, TUTOR_SITE } from "@shared/tutor-link";

vi.mock("./storage", () => ({ storage: {} }));

const href = (path: string) => `${TUTOR_SITE}${path}`;

describe("tutorLinkFor", () => {
  it("does not invite beginners: A1 and A2 link to the home page and say which levels Dave teaches", () => {
    for (const cefrLevel of ["A1", "A2", "a2"]) {
      const link = tutorLinkFor({ cefrLevel, category: "business", publicCategory: "business-english" });
      expect(link.href).toBe(href("/"));
      expect(link.belowTaughtLevels).toBe(true);
      expect(link.linkText).toContain("intermediate (B1) learners and above");
    }
  });

  it("links job subjects to the matching job page", () => {
    expect(tutorLinkFor({ cefrLevel: "B2", category: "medical" }).href).toBe(href("/medical-professionals"));
    expect(tutorLinkFor({ cefrLevel: "B2", category: "healthcare" }).href).toBe(href("/medical-professionals"));
    expect(tutorLinkFor({ cefrLevel: "C1", category: "legal" }).href).toBe(href("/legal-professionals"));
    expect(tutorLinkFor({ cefrLevel: "B2", category: "finance" }).href).toBe(href("/finance-professionals"));
    expect(tutorLinkFor({ cefrLevel: "B1", category: "technology" }).href).toBe(href("/tech-professionals"));
    expect(tutorLinkFor({ cefrLevel: "B2", category: "academic" }).href).toBe(
      href("/english-speaking-confidence-for-international-students"),
    );
  });

  it("sends work-related technology and AI lessons to the tech page, but everyday ones to discussion", () => {
    expect(
      tutorLinkFor({ cefrLevel: "B2", category: "general", publicCategory: "workplace-communication", tags: ["technology"] }).href,
    ).toBe(href("/tech-professionals"));
    expect(tutorLinkFor({ cefrLevel: "B2", category: "general", tags: ["work", "artificial-intelligence"] }).href).toBe(
      href("/tech-professionals"),
    );
    expect(tutorLinkFor({ cefrLevel: "B2", category: "general", tags: ["artificial-intelligence"] }).href).toBe(
      href("/advanced-english-discussion-lessons"),
    );
  });

  it("links business and workplace lessons to Business English", () => {
    expect(tutorLinkFor({ cefrLevel: "B2", category: "business" }).href).toBe(href("/business-english-lessons-online"));
    expect(tutorLinkFor({ cefrLevel: "B1", category: "general", publicCategory: "business-english" }).href).toBe(
      href("/business-english-lessons-online"),
    );
    expect(tutorLinkFor({ cefrLevel: "C1", category: "general", publicCategory: "workplace-communication" }).href).toBe(
      href("/business-english-lessons-online"),
    );
  });

  it("treats everyday health and money lessons as discussion or conversation topics, by level", () => {
    for (const cefrLevel of ["B2", "C1", "C2"]) {
      expect(tutorLinkFor({ cefrLevel, category: "general", publicCategory: "general-english", tags: ["money"] }).href).toBe(
        href("/advanced-english-discussion-lessons"),
      );
    }
    expect(tutorLinkFor({ cefrLevel: "B1", category: "general", tags: ["health"] }).href).toBe(
      href("/english-conversation-practice"),
    );
  });

  it("falls back to the home page when the level is unknown", () => {
    const link = tutorLinkFor({});
    expect(link.href).toBe(href("/"));
    expect(link.belowTaughtLevels).toBe(false);
  });

  it("says what the learner gets in the link text", () => {
    expect(tutorLinkFor({ cefrLevel: "B2", category: "business" }).linkText).toBe(
      "Take this lesson 1-on-1 with Dave: Business English lessons",
    );
  });
});
