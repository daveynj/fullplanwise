// The idioms & phrasal verbs section's level rules and reading helpers
// (shared/lesson-expressions.ts), used by the generator, the lesson form, the
// lesson page and the public lesson pages.
import { describe, it, expect } from "vitest";
import {
  expressionItemsOf,
  expressionsRulesFor,
  expressionsSummary,
  markedParts,
  wantsExpressions,
  withoutMarks,
} from "@shared/lesson-expressions";

describe("idioms & phrasal verbs level rules", () => {
  it("is not offered for A1, starts off at A2 and on from B1", () => {
    expect(expressionsRulesFor("A1")).toBeNull();
    expect(expressionsRulesFor("A2")).toMatchObject({ title: "Phrasal Verbs", count: 3, onByDefault: false });
    expect(expressionsRulesFor("B1")).toMatchObject({ title: "Phrasal Verbs & Expressions", count: 3, onByDefault: true });
    for (const level of ["B2", "C1", "C2"]) {
      expect(expressionsRulesFor(level)).toMatchObject({ title: "Idioms & Phrasal Verbs", count: 4, onByDefault: true });
    }
  });

  it("follows B1 for an unknown level, like the lesson prompt", () => {
    expect(expressionsRulesFor("Z9")).toEqual(expressionsRulesFor("B1"));
  });

  it("is asked for only by the switch, at a level that offers it", () => {
    expect(wantsExpressions({ cefrLevel: "B2", components: ["reading", "expressions"] })).toBe(true);
    expect(wantsExpressions({ cefrLevel: "B2", components: ["reading"] })).toBe(false);
    expect(wantsExpressions({ cefrLevel: "B2" })).toBe(false);
    expect(wantsExpressions({ cefrLevel: "A1", components: ["expressions"] })).toBe(false);
  });
});

describe("marked sentences", () => {
  it("highlights the part between ** marks", () => {
    expect(markedParts("We **set off** at dawn.", "set off")).toEqual([
      { text: "We ", marked: false },
      { text: "set off", marked: true },
      { text: " at dawn.", marked: false },
    ]);
    expect(markedParts("She **got used to** it.", "get used to")[1]).toEqual({ text: "got used to", marked: true });
  });

  it("finds the expression itself when there are no marks or they are unpaired", () => {
    expect(markedParts("Let's Call It A Day.", "call it a day")).toEqual([
      { text: "Let's ", marked: false },
      { text: "Call It A Day", marked: true },
      { text: ".", marked: false },
    ]);
    expect(markedParts("We **set off at dawn.", "set off")).toEqual([
      { text: "We ", marked: false },
      { text: "set off", marked: true },
      { text: " at dawn.", marked: false },
    ]);
    expect(markedParts("We left at dawn.", "set off")).toEqual([{ text: "We left at dawn.", marked: false }]);
    expect(withoutMarks("We **set off**.")).toBe("We set off.");
  });
});

describe("reading a stored section", () => {
  it("returns the expressions the lesson page can show, with every field filled in", () => {
    const items = expressionItemsOf({
      type: "expressions",
      items: [
        {
          expression: " put off ",
          kind: "Phrasal verb",
          meaning: "to do something later",
          example: "I **put off** my homework.",
          yourTurn: "What do you put off?",
          notes: ["A plain tip", { text: "You can split it:", right: "put it off", wrong: "put off it" }, { text: "Half a pair", right: "put it off" }, {}],
        },
        { expression: "no question", meaning: "m", example: "e" },
        "not an expression",
      ],
    });

    expect(items).toEqual([
      {
        expression: "put off",
        kind: "phrasal verb",
        fromText: "",
        meaning: "to do something later",
        similar: "",
        example: "I **put off** my homework.",
        notes: [
          { text: "A plain tip" },
          { text: "You can split it:", right: "put it off", wrong: "put off it" },
          { text: "Half a pair" },
        ],
        tone: "",
        yourTurn: "What do you put off?",
      },
    ]);
    expect(expressionItemsOf({ items: [{ expression: "x", kind: "slang", meaning: "m", example: "e", yourTurn: "q?" }] })[0].kind).toBe("expression");
    expect(expressionItemsOf(undefined)).toEqual([]);
    expect(expressionItemsOf({ items: "nope" })).toEqual([]);
  });

  it("summarises the section for the public page", () => {
    const item = { expression: "x", meaning: "m", example: "e", yourTurn: "q?" };
    expect(expressionsSummary({ title: "Idioms & Phrasal Verbs", items: [item, item, item, item] })).toBe("4 idioms and phrasal verbs");
    expect(expressionsSummary({ title: "Phrasal Verbs", items: [item, item, item] })).toBe("3 phrasal verbs");
    expect(expressionsSummary({ title: "Phrasal Verbs & Expressions", items: [item] })).toBe("1 expression");
    expect(expressionsSummary({ title: "Phrasal Verbs", items: [] })).toBeNull();
    expect(expressionsSummary(undefined)).toBeNull();
  });
});
