import { describe, expect, it } from "vitest";
import { grammarTopicHint } from "../shared/topic-hints";

describe("grammar topic hint", () => {
  it.each([
    ["present perfect", "the present perfect"],
    ["Second conditional", "conditionals"],
    ["past simple vs past continuous", "past tenses"],
    ["Passive voice", "the passive"],
    ["comparatives and superlatives", "comparatives and superlatives"],
    ["modal verbs", "modal verbs"],
    ["Reported speech", "reported speech"],
    ["used to", '"used to"'],
    ["verb tenses", "grammar"],
  ])("recognises %s", (topic, grammar) => {
    expect(grammarTopicHint(topic)?.grammar).toBe(grammar);
    expect(grammarTopicHint(topic)?.suggestion.length).toBeGreaterThan(10);
  });

  it.each([
    "",
    "Bucket lists",
    "The rise of luxury Chinese fashion brands",
    "Job interviews in tech",
    "Living your best life",
    "Travel",
    // A long request that already names a real topic is left alone.
    "A lesson about her trip to Japan last summer where she can practise the present perfect and past simple",
  ])("leaves the conversation topic %j alone", (topic) => {
    expect(grammarTopicHint(topic)).toBeNull();
  });
});
