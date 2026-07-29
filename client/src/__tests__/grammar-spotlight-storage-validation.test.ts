import { describe, it, expect } from "vitest";
import { validateGrammarSpotlightForStorage } from "../../../types/lessonContentTypes";

describe("validateGrammarSpotlightForStorage", () => {
  it("returns undefined for non-object input", () => {
    expect(validateGrammarSpotlightForStorage(null)).toBeUndefined();
    expect(validateGrammarSpotlightForStorage("bad")).toBeUndefined();
    expect(validateGrammarSpotlightForStorage([1, 2])).toBeUndefined();
  });

  it("returns undefined for objects with no renderable content", () => {
    expect(validateGrammarSpotlightForStorage({})).toBeUndefined();
    expect(
      validateGrammarSpotlightForStorage({ title: 42, examples: "nope", visualLayout: 7 }),
    ).toBeUndefined();
    expect(
      validateGrammarSpotlightForStorage({ logicExplanation: { communicationNeed: 5 } }),
    ).toBeUndefined();
  });

  it("keeps valid spotlights and normalizes malformed pieces", () => {
    const result = validateGrammarSpotlightForStorage({
      title: "Present Perfect",
      examples: ["I have eaten.", { sentence: "She has left.", explanation: 3 }, 42],
      visualLayout: { components: [{ type: "main_explanation" }, { notype: true }] },
    });
    expect(result).toBeDefined();
    expect(result?.title).toBe("Present Perfect");
    expect(result?.examples).toHaveLength(2);
    expect(result?.visualLayout?.components).toHaveLength(1);
  });
});
