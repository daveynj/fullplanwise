/**
 * The idioms & phrasal verbs section ("expressions"): its level rules, its
 * stored shape and the helpers that read it. Shared by the lesson generator,
 * the lesson form, the lesson page and the public lesson pages.
 *
 * The section is optional. The teacher turns it on with the lesson form's
 * switch, which adds "expressions" to the generate request's components, and
 * it is never offered for A1. It is written by its own AI request after the
 * rest of the lesson (server/services/lesson-expressions.ts), so a lesson
 * without it, including every lesson made before it existed, is unchanged:
 * the lesson page only shows the tab when a lesson contains the section.
 *
 * Each expression comes from the lesson's reading text where possible. The
 * sentence it appears in (`fromText`) and the example mark the expression as
 * **this**, so the page can highlight it even when its form changes
 * ("got used to" for "get used to").
 */

export const EXPRESSIONS_SECTION_TYPE = "expressions";

/** What the lesson form adds to the generate request's components when the switch is on. */
export const EXPRESSIONS_COMPONENT = "expressions";

export type ExpressionKind = "phrasal verb" | "idiom" | "expression";

export const EXPRESSION_KINDS: readonly ExpressionKind[] = ["phrasal verb", "idiom", "expression"];

export interface ExpressionNote {
  text: string;
  /** The correct form, shown with a tick: "put it off". */
  right?: string;
  /** The common mistake, shown crossed out: "put off it". */
  wrong?: string;
}

export interface LessonExpression {
  /** The base form, as a dictionary lists it: "put off". */
  expression: string;
  kind: ExpressionKind;
  /** The reading text's sentence that uses it, with the expression marked as **this**; empty when it is not in the reading. */
  fromText: string;
  meaning: string;
  /** A simpler word or phrase with a similar meaning ("postpone"); may be empty. */
  similar: string;
  /** A new example sentence with the expression marked as **this**. */
  example: string;
  notes: ExpressionNote[];
  /** "informal" or "formal" when it matters; otherwise empty. */
  tone: string;
  /** A speaking question that invites the student to use the expression. */
  yourTurn: string;
}

export interface ExpressionsLevelRules {
  /** The tab and heading name. */
  title: string;
  /** What the section holds, for sentences like "4 idioms and phrasal verbs". */
  noun: string;
  /** How many expressions the section holds. */
  count: number;
  /** Whether the lesson form's switch starts on at this level. */
  onByDefault: boolean;
  /** The lesson form's hint under the switch. */
  formHint: string;
}

const IDIOMS_AND_PHRASAL_VERBS: ExpressionsLevelRules = {
  title: "Idioms & Phrasal Verbs",
  noun: "idioms and phrasal verbs",
  count: 4,
  onByDefault: true,
  formHint: "Adds 4 idioms and phrasal verbs from the reading, each with a speaking question.",
};

const LEVEL_RULES: Record<string, ExpressionsLevelRules> = {
  A2: {
    title: "Phrasal Verbs",
    noun: "phrasal verbs",
    count: 3,
    onByDefault: false,
    formHint: "Adds 3 everyday phrasal verbs from the reading, each with a speaking question. Off by default at A2.",
  },
  B1: {
    title: "Phrasal Verbs & Expressions",
    noun: "phrasal verbs and expressions",
    count: 3,
    onByDefault: true,
    formHint: "Adds 3 phrasal verbs and everyday expressions from the reading, each with a speaking question.",
  },
  B2: IDIOMS_AND_PHRASAL_VERBS,
  C1: IDIOMS_AND_PHRASAL_VERBS,
  C2: IDIOMS_AND_PHRASAL_VERBS,
};

/**
 * The section's rules at a CEFR level, or null where it is not offered (A1).
 * Unknown levels follow B1, like the rest of the lesson prompt.
 */
export function expressionsRulesFor(cefrLevel: string): ExpressionsLevelRules | null {
  if (cefrLevel === "A1") return null;
  return LEVEL_RULES[cefrLevel] ?? LEVEL_RULES.B1;
}

/** Whether a generate request asks for the section: the switch is on and the level offers it. */
export function wantsExpressions(params: { cefrLevel: string; components?: readonly string[] }): boolean {
  return Boolean(params.components?.includes(EXPRESSIONS_COMPONENT)) && expressionsRulesFor(params.cefrLevel) !== null;
}

// ---------------------------------------------------------------------------
// Reading stored sections
// ---------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function noteOf(value: unknown): ExpressionNote | undefined {
  if (!isRecord(value)) return text(value) ? { text: text(value) } : undefined;
  const note: ExpressionNote = { text: text(value.text) };
  if (text(value.right) && text(value.wrong)) {
    note.right = text(value.right);
    note.wrong = text(value.wrong);
  }
  return note.text || note.right ? note : undefined;
}

/**
 * The expressions of a stored section that the lesson page can show: each has
 * the expression, a meaning, an example and a speaking question. Missing
 * optional fields come back empty, so readers never need to guard them.
 */
export function expressionItemsOf(section: unknown): LessonExpression[] {
  if (!isRecord(section) || !Array.isArray(section.items)) return [];
  return section.items.flatMap((item): LessonExpression[] => {
    if (!isRecord(item)) return [];
    const kind = EXPRESSION_KINDS.find((k) => k === text(item.kind).toLowerCase()) ?? "expression";
    const expression: LessonExpression = {
      expression: text(item.expression),
      kind,
      fromText: text(item.fromText),
      meaning: text(item.meaning),
      similar: text(item.similar),
      example: text(item.example),
      notes: Array.isArray(item.notes) ? item.notes.flatMap((note) => noteOf(note) ?? []) : [],
      tone: text(item.tone),
      yourTurn: text(item.yourTurn),
    };
    return expression.expression && expression.meaning && expression.example && expression.yourTurn ? [expression] : [];
  });
}

/** "4 idioms and phrasal verbs" for a section with usable expressions; null otherwise. */
export function expressionsSummary(section: unknown): string | null {
  const count = expressionItemsOf(section).length;
  if (!count) return null;
  const title = isRecord(section) ? text(section.title) : "";
  const rules = Object.values(LEVEL_RULES).find((r) => r.title === title) ?? IDIOMS_AND_PHRASAL_VERBS;
  return count === 1 ? "1 expression" : `${count} ${rules.noun}`;
}

// ---------------------------------------------------------------------------
// Marked text
// ---------------------------------------------------------------------------

export interface MarkedPart {
  text: string;
  /** Whether this part is the expression, to be highlighted. */
  marked: boolean;
}

/** The text without its ** marks. */
export function withoutMarks(value: string): string {
  return value.replace(/\*\*/g, "");
}

/**
 * Splits a sentence into plain and highlighted parts. The expression is the
 * part between ** marks; a sentence without (or with unpaired) marks
 * highlights the first place the expression itself appears, if any.
 */
export function markedParts(value: string, expression = ""): MarkedPart[] {
  const pieces = value.split("**");
  if (pieces.length >= 3 && pieces.length % 2 === 1) {
    return pieces.map((piece, index) => ({ text: piece, marked: index % 2 === 1 })).filter((part) => part.text);
  }
  const plain = withoutMarks(value);
  const at = expression ? plain.toLowerCase().indexOf(expression.toLowerCase()) : -1;
  if (at === -1) return plain ? [{ text: plain, marked: false }] : [];
  return [
    { text: plain.slice(0, at), marked: false },
    { text: plain.slice(at, at + expression.length), marked: true },
    { text: plain.slice(at + expression.length), marked: false },
  ].filter((part) => part.text);
}
