// Verifies the lesson-generation retry path for malformed grammar spotlights:
// a failed validation triggers exactly one regeneration attempt, and a failed
// retry drops the section with a warning instead of crashing or storing junk.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveGrammarSpotlight } from "./grammarSpotlightRetry";

const validSpotlight = {
  grammarType: "present_perfect",
  title: "Present Perfect",
  description: "Talking about experiences",
  examples: [
    {
      sentence: "I have visited Paris.",
      highlighted: "I **have visited** Paris.",
      explanation: "Experience up to now.",
    },
  ],
  logicExplanation: {
    communicationNeed: "Talk about past events relevant now",
    logicalSolution: "have + past participle",
    usagePattern: "Unfinished time periods",
    communicationImpact: "Connects past to present",
  },
};

// Fails validateGrammarSpotlightForStorage: object with no renderable content.
const malformedSpotlight = { grammarType: 12345, examples: "not-an-array" };

describe("resolveGrammarSpotlight", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the validated spotlight without retrying when the original is valid", async () => {
    const regenerate = vi.fn();
    const result = await resolveGrammarSpotlight(
      validSpotlight,
      { regenerateGrammarSpotlight: regenerate },
      "job-1",
      "travel",
      "B1",
    );

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Present Perfect");
    expect(regenerate).not.toHaveBeenCalled();
  });

  it("retries once and stores the valid regenerated spotlight when the original is malformed", async () => {
    const regenerate = vi.fn().mockResolvedValue(validSpotlight);
    const result = await resolveGrammarSpotlight(
      malformedSpotlight,
      { regenerateGrammarSpotlight: regenerate },
      "job-2",
      "travel",
      "B1",
    );

    expect(regenerate).toHaveBeenCalledTimes(1);
    expect(regenerate).toHaveBeenCalledWith("travel", "B1");
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Present Perfect");
    expect(result!.examples).toHaveLength(1);
  });

  it("omits the section and logs a warning when the retry result also fails validation", async () => {
    const regenerate = vi.fn().mockResolvedValue(malformedSpotlight);
    const result = await resolveGrammarSpotlight(
      malformedSpotlight,
      { regenerateGrammarSpotlight: regenerate },
      "job-3",
      "travel",
      "B1",
    );

    expect(regenerate).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("retry also failed validation"),
    );
  });

  it("omits the section and logs a warning when the retry throws", async () => {
    const regenerate = vi.fn().mockRejectedValue(new Error("OpenRouter timeout"));
    const result = await resolveGrammarSpotlight(
      malformedSpotlight,
      { regenerateGrammarSpotlight: regenerate },
      "job-4",
      "travel",
      "B1",
    );

    expect(regenerate).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Grammar spotlight retry failed"),
      expect.any(Error),
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("retry also failed validation"),
    );
  });
});
