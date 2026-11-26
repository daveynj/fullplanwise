import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { TopRemixBanner, VocabFlashcardCTA } from "./public-lesson-ctas";

afterEach(cleanup);

describe("public lesson conversion calls to action", () => {
  it("shows a lesson-title-based remix link at the current level", () => {
    render(createElement(TopRemixBanner, {
      title: "Travel Plans",
      href: "/auth?register=true&redirect=%2Fgenerate",
    }));

    expect(screen.getByText(/Travel Plans/)).toBeTruthy();
    expect(screen.getByText(/different CEFR level/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Remix this lesson" }).getAttribute("href"))
      .toContain("/auth?register=true");
  });

  it("explains when vocabulary is added to student flashcards", () => {
    render(createElement(VocabFlashcardCTA, { href: "/auth?register=true&source=vocab-cta" }));

    expect(screen.getByText(/Mark lessons complete from a student's page/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Try PlanWise ESL free/ }).getAttribute("href"))
      .toBe("/auth?register=true&source=vocab-cta");
  });
});
