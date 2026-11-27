// @vitest-environment node
import { describe, expect, it } from "vitest";
import { suggestPublicTags, publicTagFingerprint } from "./public-lesson-tags";
import { filterPublicLessons, publicTags, reviewedTagBatchSchema } from "@shared/public-lesson-tags";

describe("conservative public-only topic suggestions", () => {
  it("suggests title matches with the evidence needed for manual review", () => {
    expect(suggestPublicTags({ title: "Travel and tourism", publicReading: "" })).toEqual({
      suggestedTags: ["travel"],
      evidence: [{ tag: "travel", source: "title", terms: ["travel", "tourism"] }],
    });
  });

  it("requires two different reading keywords and does not count repeated incidental words", () => {
    expect(suggestPublicTags({ title: "A big decision", publicReading: "The office, office, office." }).suggestedTags).toEqual([]);
    expect(suggestPublicTags({ title: "A big decision", publicReading: "An employee discusses their salary." }).suggestedTags).toEqual(["work"]);
  });

  it("ignores private requests, notes, student data, and unknown fields", () => {
    const input = { title: "A big decision", publicReading: "Something happened.",
      topic: "health doctor hospital", notes: "travel holiday airport",
      content: { teacherNotes: "climate change recycling" } };
    expect(suggestPublicTags(input).suggestedTags).toEqual([]);
    expect(publicTagFingerprint({ id: 1, cefrLevel: "B1", ...input })).toBe(
      publicTagFingerprint({ id: 1, cefrLevel: "B1", title: input.title, publicReading: input.publicReading }));
  });

  it("uses whole words and leaves unknown lessons untagged instead of inventing labels", () => {
    expect(suggestPublicTags({ title: "A chair in Spain", publicReading: "A short story." }).suggestedTags).toEqual([]);
    expect(suggestPublicTags({ title: "ChatGPT and artificial intelligence", publicReading: "" }).suggestedTags).toEqual(["artificial-intelligence"]);
  });

  it("limits suggestions to four tags and fingerprints the evidence", () => {
    const source = { id: 1, title: "Travel food money culture health school", publicReading: "", cefrLevel: "B1" };
    expect(suggestPublicTags(source).suggestedTags).toHaveLength(4);
    expect(publicTagFingerprint(source)).not.toBe(publicTagFingerprint({ ...source, publicReading: "Changed" }));
  });
});

describe("public tag filtering", () => {
  const lessons = [
    { title: "A new tool", cefrLevel: "B1", publicCategory: "business", tags: ["artificial-intelligence", "work"] },
    { title: "A new tool", cefrLevel: "A2", publicCategory: "general", tags: ["travel"] },
    { title: "No tags yet", cefrLevel: "B1", publicCategory: null, tags: null },
  ];
  it("combines search, category and exact tag membership", () => {
    expect(filterPublicLessons(lessons, "artificial intelligence", "business", "work", {})).toEqual([lessons[0]]);
    expect(filterPublicLessons(lessons, "B1", "all", "travel", {})).toEqual([]);
    expect(filterPublicLessons(lessons, "", "business", "travel", {})).toEqual([]);
    expect(filterPublicLessons(lessons, "", "all", "all", {})).toEqual(lessons);
  });
  it("searches public category labels and never searches hidden fields", () => {
    expect(filterPublicLessons(lessons, "General English", "all", "all", { general: "General English" })).toEqual([lessons[1]]);
    expect(filterPublicLessons([{ ...lessons[0], topic: "PRIVATE" }], "PRIVATE", "all", "all", {})).toEqual([]);
  });
  it("deduplicates known tags and does not display arbitrary/private labels", () => {
    expect(publicTags(["travel", "travel", "private student note", "toString"])).toEqual(["travel"]);
    expect(publicTags(["holidays", "culture"])).toEqual(["holidays", "culture"]);
    expect(suggestPublicTags({ title: "Christmas and New Year Celebrations", publicReading: "" }).suggestedTags).toContain("holidays");
  });
  it("moves corrected lessons between topic filters and clears tag searches without hiding the lesson", () => {
    const row = { title: "A new tool", cefrLevel: "B1", publicCategory: "business", tags: ["travel"] };
    expect(filterPublicLessons([row], "", "all", "travel", {})).toHaveLength(1);
    const corrected = { ...row, tags: ["technology"] };
    expect(filterPublicLessons([corrected], "", "all", "travel", {})).toEqual([]);
    expect(filterPublicLessons([corrected], "Technology", "business", "technology", {})).toEqual([corrected]);
    const cleared = { ...row, tags: [] };
    expect(filterPublicLessons([cleared], "", "all", "travel", {})).toEqual([]);
    expect(filterPublicLessons([cleared], "Travel", "all", "all", {})).toEqual([]);
    expect(filterPublicLessons([cleared], "", "business", "all", {})).toEqual([cleared]);
    expect(filterPublicLessons([cleared], "A new tool", "all", "all", {})).toEqual([cleared]);
  });
});

describe("review validation", () => {
  const body = { reviewToken: "a".repeat(48), approvals: [{ id: 1, reviewed: true, tags: ["travel"] }] };
  it("accepts explicit manual review", () => expect(reviewedTagBatchSchema.safeParse(body).success).toBe(true));
  it.each([
    { ...body, approvals: [] },
    { ...body, approvals: [{ id: 1, tags: ["travel"] }] },
    { ...body, approvals: [{ id: 1, reviewed: false, tags: ["travel"] }] },
    { ...body, approvals: [{ id: 1, reviewed: true, tags: [] }] },
    { ...body, approvals: [{ id: 1, reviewed: true, tags: ["secret free text"] }] },
    { ...body, approvals: [{ id: 1, reviewed: true, tags: ["travel", "travel"] }] },
    { ...body, approvals: [...body.approvals, ...body.approvals] },
  ])("rejects unchecked, empty, unknown or duplicate approvals", (invalid) => {
    expect(reviewedTagBatchSchema.safeParse(invalid).success).toBe(false);
  });
});
