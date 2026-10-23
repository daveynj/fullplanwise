/**
 * The fill-in-the-blank exercise tidies gaps from older lessons as it shows
 * them: "[1:rescued]" with "rescue" in the word bank becomes a blank followed
 * by "d", so the word-bank word can be dropped in and the sentence still
 * reads "rescued".
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { createElement as h } from "react";
import { InteractiveClozeSection } from "@/components/lesson/interactive-cloze-section";

afterEach(cleanup);

describe("InteractiveClozeSection", () => {
  it("shows a changed word form as the word-bank word's blank plus its ending", () => {
    const { container } = render(
      h(InteractiveClozeSection, {
        text: "Last year, he helped to [1:rescued] a cat. He [2:wake]s up early.",
        wordBank: ["rescue", "wake up"],
      }),
    );

    const blanks = container.querySelectorAll("[data-blank-id]");
    expect(blanks).toHaveLength(2);
    const passage = blanks[0].parentElement!.textContent;
    expect(passage).toBe("Last year, he helped to Blank 1d a cat. He Blank 2 early.");
  });
});
