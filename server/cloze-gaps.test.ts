import { describe, it, expect } from "vitest";
import { findUnanswerableClozeGaps, findWordBankMatch, isClozeAnswerCorrect, tidyClozeText } from "@shared/cloze";
import { OpenRouterService } from "./services/openRouter";

describe("tidyClozeText", () => {
  it("leaves gaps that already match the word bank untouched", () => {
    const bank = ["skip", "Snooze", "let’s go", "wind down"];
    const text = "He presses [1:snooze], [2:skip]s breakfast, says [3:let's go] and tries to [4:wind down].";
    expect(tidyClozeText(text, bank)).toBe(text);
  });

  it.each([
    ["Last year, he helped to [4:rescued] a cat.", ["rescue"], "Last year, he helped to [4:rescue]d a cat."],
    ["He often [2:skips] breakfast.", ["skip"], "He often [2:skip]s breakfast."],
    ["The coffee [1:percolated] slowly.", ["percolate"], "The coffee [1:percolate]d slowly."],
    ["Everyone [3:gathered] in the garden.", ["gather"], "Everyone [3:gather]ed in the garden."],
    ["She always [2:encourages] students.", ["encourage"], "She always [2:encourage]s students."],
    ["Talk was [2:brewing] inside.", ["brew"], "Talk was [2:brew]ing inside."],
    ["The bus [1:stopped] here.", ["stop"], "The bus [1:stop]ped here."],
    ["Taking [4:initiatives] helps.", ["Initiative"], "Taking [4:initiative]s helps."],
    ["The [1:student’s] bag", ["student"], "The [1:student]’s bag"],
    ["I tried to [6:plug in] it again.", ["plug"], "I tried to [6:plug] in it again."],
  ])("moves the ending outside the brackets: %s", (text, bank, expected) => {
    expect(tidyClozeText(text, bank)).toBe(expected);
  });

  it.each([
    ["A city [3:steeped] in history.", ["steeped in"], "A city [3:steeped in] history."],
    ["First, she [1:wake] up at six.", ["wake up"], "First, she [1:wake up] at six."],
    ["They [3:touch] base on Monday.", ["to touch base"], "They [3:touch base] on Monday."],
    ["The [2:emission]s produced by cars", ["emissions"], "The [2:emissions] produced by cars"],
    ["[1:forage]ing enthusiasts", ["foraging"], "[1:foraging] enthusiasts"],
    ["How [2:afford]able it is", ["affordable"], "How [2:affordable] it is"],
    ["It has [1:proliferat]ed rapidly.", ["proliferate"], "It has [1:proliferate]d rapidly."],
  ])("moves text that belongs to the word-bank word into the brackets: %s", (text, bank, expected) => {
    expect(tidyClozeText(text, bank)).toBe(expected);
  });

  it("keeps a changed form of a phrase when the ending is inside it", () => {
    expect(tidyClozeText("He always [2:wake]s up at six.", ["wake up"])).toBe("He always [2:wakes up] at six.");
    expect(tidyClozeText("The project [3:fell] behind.", ["fall behind"])).toBe("The project [3:fell behind].");
  });

  it("leaves forms it cannot split, unrelated words and placeholders as they are", () => {
    const bank = ["policy", "mingle", "verdict", "recognize"];
    const text = "Government [1:policies], [2:mingling] guests, its [3:___] and voice [4:recognition].";
    expect(tidyClozeText(text, bank)).toBe(text);
  });

  it("only rewrites the gaps that need it and keeps the rest of the text", () => {
    const bank = ["brave", "rescue", "neighbor", "protect", "volunteer"];
    const text = "My [1:neighbor] Tom is [2:brave]. He [3:rescued] a cat\nand [4:protects] people as a [5:volunteer].";
    expect(tidyClozeText(text, bank)).toBe(
      "My [1:neighbor] Tom is [2:brave]. He [3:rescue]d a cat\nand [4:protect]s people as a [5:volunteer].",
    );
  });

  it("gives the same result when run twice", () => {
    const bank = ["rescue", "wake up", "emissions", "policy", "fall behind"];
    const text = "He [1:rescued] it, [2:wake]s up, the [3:emission]s, [4:policies], [5:fell] behind.";
    const once = tidyClozeText(text, bank);
    expect(tidyClozeText(once, bank)).toBe(once);
  });

  it("does nothing without a word bank", () => {
    expect(tidyClozeText("He [1:rescued] it.", [])).toBe("He [1:rescued] it.");
    expect(tidyClozeText("He [1:rescued] it.", [null, 3] as unknown[])).toBe("He [1:rescued] it.");
  });
});

describe("isClozeAnswerCorrect", () => {
  it("accepts the exact answer regardless of case and spacing", () => {
    expect(isClozeAnswerCorrect("Rescue", "rescue", ["rescue"])).toBe(true);
    expect(isClozeAnswerCorrect("wind  down", "wind down", ["wind down"])).toBe(true);
    expect(isClozeAnswerCorrect("let’s go", "let's go", ["let’s go"])).toBe(true);
    expect(isClozeAnswerCorrect("to move forward", "move forward", ["to move forward"])).toBe(true);
  });

  it("rejects other words and empty answers", () => {
    expect(isClozeAnswerCorrect("brave", "rescue", ["rescue", "brave"])).toBe(false);
    expect(isClozeAnswerCorrect("", "rescue", ["rescue"])).toBe(false);
  });

  it.each([
    ["rescued", "rescue"],
    ["skips", "skip"],
    ["percolated", "percolate"],
    ["steeped", "steeped in"],
    ["policies", "policy"],
    ["mingling", "mingle"],
    ["woke", "wake"],
    ["understood", "understand"],
    ["crises", "crisis"],
    ["wakes up", "wake up"],
    ["fell behind", "fall behind"],
    ["burned out", "burn out"],
    ["trait", "traits"],
    ["memory|memories", "memory"],
    ["let's get down to", "let's get down to business"],
  ])("accepts the word-bank word for a gap answered as %s", (answer, bankWord) => {
    const bank = [bankWord, "brave", "volunteer"];
    expect(isClozeAnswerCorrect(bankWord, answer, bank)).toBe(true);
    expect(isClozeAnswerCorrect("brave", answer, bank)).toBe(false);
  });

  it("does not loosen gaps whose answer is in the word bank", () => {
    expect(isClozeAnswerCorrect("plays", "play", ["play", "plays"])).toBe(false);
    expect(isClozeAnswerCorrect("rescue", "rescued", ["rescue", "rescued"])).toBe(false);
  });

  it("prefers the most specific word-bank word", () => {
    const bank = ["teach", "teacher"];
    expect(isClozeAnswerCorrect("teacher", "teachers", bank)).toBe(true);
    expect(isClozeAnswerCorrect("teach", "teachers", bank)).toBe(false);
    expect(findWordBankMatch("wakes up", ["wake", "wake up"])).toBe("wake up");
  });

  it("accepts nothing when two word-bank words fit equally well", () => {
    const bank = ["take on", "take off"];
    expect(findWordBankMatch("take", bank)).toBeNull();
    expect(isClozeAnswerCorrect("take on", "take", bank)).toBe(false);
    expect(isClozeAnswerCorrect("take off", "take", bank)).toBe(false);
  });

  it("does not treat unrelated or look-alike words as forms", () => {
    expect(isClozeAnswerCorrect("recognize", "recognition", ["recognize"])).toBe(false);
    expect(isClozeAnswerCorrect("car", "carpet", ["car"])).toBe(false);
    expect(isClozeAnswerCorrect("part", "party", ["part"])).toBe(false);
    expect(isClozeAnswerCorrect("verdict", "___", ["verdict"])).toBe(false);
  });
});

describe("tidying and marking together", () => {
  it.each([
    ["He [1:wakes up] at six.", ["wake", "wake up"], "wake up", "wake"],
    ["They [1:plugs in] the lamp.", ["plug", "plug in"], "plug in", "plug"],
    ["She has [1:signed off on] the plan.", ["sign", "sign off on"], "sign off on", "sign"],
    ["Our [1:teachers] help us.", ["teach", "teacher"], "teacher", "teach"],
    ["He [1:rescued] a cat.", ["rescue", "rescue team"], "rescue", "rescue team"],
    ["He [1:wake]s up early.", ["wake up"], "wake up", "wake"],
  ])("still accepts the closest word-bank word once the gap is tidied: %s", (text, bank, accepted, rejected) => {
    const tidied = tidyClozeText(text, bank);
    const answer = /\[1:([^\]]+)\]/.exec(tidied)![1];
    expect(isClozeAnswerCorrect(accepted, answer, bank)).toBe(true);
    expect(isClozeAnswerCorrect(rejected, answer, bank)).toBe(false);
  });

  it("does not split a phrase answer into a shorter word-bank word", () => {
    expect(tidyClozeText("He [1:wakes up] at six.", ["wake", "wake up"])).toBe("He [1:wakes up] at six.");
  });
});

describe("findUnanswerableClozeGaps", () => {
  it("lists only gaps that no word-bank word can answer", () => {
    const bank = ["rescue", "policy", "verdict", "brave"];
    const text = "He [1:rescued] a dog, [2:policies] changed, the [3:___] came, they felt [4:feelings], he was [5:brave].";
    expect(findUnanswerableClozeGaps(text, bank)).toEqual(["[3:___]", "[4:feelings]"]);
  });
});

describe("lesson generation", () => {
  it("tidies fill-in-the-blank gaps before the lesson is saved", async () => {
    const service = new OpenRouterService("test-key") as unknown as {
      formatLessonContent(content: unknown): Promise<{ sections: { type: string; text?: string }[] }>;
    };
    const lesson = await service.formatLessonContent({
      title: "Everyday heroes",
      sections: [
        { type: "warmup", questions: ["Who helps you?"] },
        {
          type: "cloze",
          title: "Fill in the Blanks",
          text: "Last year, he [1:rescued] a cat and [2:skips] lunch to [3:volunteer].",
          wordBank: ["rescue", "skip", "volunteer"],
        },
      ],
    });
    const cloze = lesson.sections.find((section) => section.type === "cloze");
    expect(cloze?.text).toBe("Last year, he [1:rescue]d a cat and [2:skip]s lunch to [3:volunteer].");
  });
});
