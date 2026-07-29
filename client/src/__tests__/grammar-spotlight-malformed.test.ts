/**
 * Proves that malformed AI grammar-spotlight payloads degrade gracefully:
 * - normalizeGrammarSpotlight coerces invalid structures to safe defaults
 * - GrammarSpotlight and AIDrivenGrammarVisual render without throwing when
 *   given garbage visualLayout/components/categories/examples data
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { createElement as h } from "react";
import { normalizeGrammarSpotlight } from "../../../types/lessonContentTypes";
import { GrammarSpotlight } from "@/components/lesson/grammar-spotlight";
import { AIDrivenGrammarVisual } from "@/components/lesson/ai-driven-grammar-visual";
import { VisualGrammarDisplay } from "@/components/lesson/visual-grammar-display";

afterEach(cleanup);

describe("normalizeGrammarSpotlight", () => {
  it("returns undefined for non-object input", () => {
    expect(normalizeGrammarSpotlight(null)).toBeUndefined();
    expect(normalizeGrammarSpotlight("just a string")).toBeUndefined();
    expect(normalizeGrammarSpotlight(42)).toBeUndefined();
    expect(normalizeGrammarSpotlight([1, 2, 3])).toBeUndefined();
  });

  it("coerces non-array list fields to empty arrays", () => {
    const result = normalizeGrammarSpotlight({
      examples: { not: "an array" },
      visualSteps: "nope",
      visualLayout: { components: { bad: true } },
    })!;
    expect(result.examples).toEqual([]);
    expect(result.visualSteps).toEqual([]);
    expect(result.visualLayout?.components).toEqual([]);
  });

  it("drops malformed items and keeps valid ones", () => {
    const result = normalizeGrammarSpotlight({
      grammarType: 123, // wrong type -> dropped
      examples: [
        null,
        42,
        "bare sentence",
        { sentence: "I **have eaten**.", explanation: "present perfect" },
      ],
      visualLayout: {
        recommendedType: "certainty_scale",
        primaryColor: ["not", "a", "string"],
        components: [
          "garbage",
          { noType: true },
          {
            type: "categories_breakdown",
            categories: [
              null,
              { description: "missing name -> dropped" },
              { name: "High", words: ["must", 7, "will"], examples: "not-an-array" },
            ],
          },
          {
            type: "visual_breakdown",
            components: [{ part: "Subject" }, { part: 99 }, "junk"],
          },
        ],
      },
    })!;

    expect(result.grammarType).toBeUndefined();
    expect(result.examples).toHaveLength(2);
    expect(result.examples![0]).toEqual({ sentence: "bare sentence" });
    expect(result.visualLayout?.primaryColor).toBeUndefined();

    const components = result.visualLayout!.components!;
    expect(components).toHaveLength(2);
    const categories = components[0].categories!;
    expect(categories).toHaveLength(1);
    expect(categories[0].words).toEqual(["must", "will"]);
    expect(categories[0].examples).toEqual([]);
    const parts = components[1].components!;
    expect(parts).toHaveLength(1);
    expect(parts[0].part).toBe("Subject");
    expect(parts[0].examples).toEqual([]);
  });
});

describe("grammar visual components with malformed AI data", () => {
  const malformedPayloads: unknown[] = [
    null,
    undefined,
    "totally not an object",
    { examples: "nope", logicExplanation: [1, 2], visualLayout: "bad" },
    {
      grammarType: { weird: true },
      examples: [{ sentence: 5 }, null],
      visualLayout: {
        recommendedType: "connection_flow",
        components: [{ type: "visual_breakdown", components: [{ part: "X" }] }],
      },
    },
    {
      visualLayout: {
        recommendedType: "comparison_table",
        components: [
          { type: "categories_breakdown", categories: [{ name: "A", words: null, examples: null }] },
        ],
      },
    },
  ];

  it("GrammarSpotlight renders without throwing", () => {
    for (const payload of malformedPayloads) {
      expect(() => {
        const { unmount } = render(h(GrammarSpotlight, { grammarData: payload }));
        unmount();
      }).not.toThrow();
    }
  });

  it("AIDrivenGrammarVisual renders without throwing", () => {
    for (const payload of malformedPayloads) {
      expect(() => {
        const { unmount } = render(h(AIDrivenGrammarVisual, { grammarData: payload }));
        unmount();
      }).not.toThrow();
    }
  });

  it("VisualGrammarDisplay tolerates malformed examples and grammarType", () => {
    expect(() => {
      const { unmount } = render(
        h(VisualGrammarDisplay, {
          grammarType: undefined as unknown as string,
          title: "t",
          description: "d",
          examples: ["junk", null, { highlighted: 42 }] as never,
          visualSteps: "not-an-array" as never,
        }),
      );
      unmount();
    }).not.toThrow();
  });
});
