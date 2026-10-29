import type { LessonGenerateParams } from '@shared/schema';
import {
  EXPRESSION_KINDS,
  EXPRESSIONS_SECTION_TYPE,
  expressionItemsOf,
  expressionsRulesFor,
  wantsExpressions,
  withoutMarks,
  type ExpressionKind,
} from '@shared/lesson-expressions';
import {
  checkLessonSection,
  findSection,
  fixSection,
  isMoreUsable,
  lessonSectionContext,
  type SectionStatus,
} from './lesson-check';
import { LESSON_SECTION_TYPES, type LessonSectionContext } from './lesson-prompt';
import { sectionFromReply } from './lesson-repair';

/**
 * Adds the optional idioms & phrasal verbs section to a new lesson, after the
 * lesson check has finished with the other nine sections.
 *
 * The section is only added when the teacher turned it on and the level
 * offers it (see shared/lesson-expressions.ts); every other lesson is left
 * exactly as it was. Its own AI request is given the finished reading text,
 * so the expressions can come from it. The reply is checked like the other
 * sections: slips with one clear fix are fixed in place, and a section that
 * is still broken or short of expressions is requested once more. When
 * neither version is usable, the lesson is saved without the section, so
 * teachers never get a broken tab. The reply's quiz question goes at the end
 * of the quiz when the quiz can show and mark it.
 */

/** The part of the OpenRouter service this needs; kept narrow so tests can pass a stub. */
export interface ExpressionsSectionWriter {
  writeExpressionsSection(
    params: LessonGenerateParams,
    lesson: LessonSectionContext,
    studentVocabulary?: string[],
    model?: string,
  ): Promise<unknown>;
}

export interface ExpressionsOptions {
  params: LessonGenerateParams;
  writer: ExpressionsSectionWriter;
  studentVocabulary?: string[];
  model?: string;
  /** Start of each log line, e.g. "[Job 1a2b]". */
  logPrefix?: string;
}

export interface ExpressionsCheck {
  status: SectionStatus;
  /** Expressions the lesson page can show. */
  usableItems: number;
  /** What the section has, or what is wrong with it, e.g. "2 of 4 expressions". */
  detail: string;
}

export interface ExpressionsReport {
  outcome: 'not requested' | 'added' | 'added incomplete' | 'left out';
  /** The check of the section that was added, or of the better of the failed versions. */
  check?: ExpressionsCheck;
  fixedInPlace: string[];
  retried: boolean;
  quizQuestionAdded: boolean;
}

export interface ExpressionsFixContext {
  readingParagraphs: string[];
  /** The lesson's target words and the student's learned words, which an expression must not repeat. */
  knownWords: string[];
  /** How many expressions the level asks for; extra ones are dropped. */
  required: number;
}

type Item = Record<string, unknown>;

const NAME = 'idioms and phrasal verbs';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

/** "1 expression", "3 expressions": nouns are given in the plural. */
const count = (n: number, noun: string) => `${n} ${n === 1 ? noun.replace(/s$/, '') : noun}`;

/** Text as it is compared with the reading and with other words: lower case, plain quotes and dashes, single spaces, no ** marks. */
function comparable(value: string): string {
  return withoutMarks(value)
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Whether the reading text contains the quoted sentence, ignoring quote marks around it. */
function isInReading(quote: string, reading: string): boolean {
  const sentence = comparable(quote).replace(/^["']+|["']+$/g, '').trim();
  return sentence.length > 0 && comparable(reading).includes(sentence);
}

/** "Phrasal verbs" and "Idiom" are read as kinds; anything else is not. */
function kindOf(value: unknown): ExpressionKind | undefined {
  const kind = typeof value === 'string' ? value.toLowerCase().trim().replace(/s$/, '') : '';
  return EXPRESSION_KINDS.find((known) => known === kind);
}

/** An expression the lesson page shows: the same rule the page uses to read the section. */
function isUsableExpression(item: unknown): boolean {
  return expressionItemsOf({ items: [item] }).length === 1;
}

/**
 * Fixes slips with one clear fix and removes expressions the lesson page
 * cannot use or that repeat another word. Returns a description of each
 * change, for logs.
 */
export function fixExpressionsSection(section: Item, context: ExpressionsFixContext): string[] {
  const fixes: string[] = [];
  if (!Array.isArray(section.items)) return fixes;

  const reading = context.readingParagraphs.join(' ');
  const known = new Set(context.knownWords.filter(hasText).map(comparable));
  const seen = new Set<string>();
  const kept: Item[] = [];

  section.items.forEach((item, index) => {
    if (!isRecord(item)) {
      fixes.push(`${NAME}: removed item ${index + 1}, which was not an expression`);
      return;
    }
    const name = hasText(item.expression) ? `"${item.expression.trim()}"` : `item ${index + 1}`;

    const kind = kindOf(item.kind);
    if (!kind) fixes.push(`${NAME}: ${name} had no known kind; labelled it an expression`);
    item.kind = kind ?? 'expression';
    if (Array.isArray(item.similar)) item.similar = item.similar.filter(hasText).join(', ');
    if (typeof item.tone === 'string') {
      const tone = item.tone.trim().toLowerCase();
      item.tone = tone === 'informal' || tone === 'formal' ? tone : '';
    }

    for (const key of ['fromText', 'example'] as const) {
      const value = item[key];
      if (typeof value === 'string' && value.split('**').length % 2 === 0) {
        item[key] = withoutMarks(value);
        fixes.push(`${NAME}: removed unpaired ** marks from the ${key === 'fromText' ? 'reading sentence' : 'example'} of ${name}`);
      }
    }
    if (hasText(item.fromText) && !isInReading(item.fromText, reading)) {
      item.fromText = '';
      fixes.push(`${NAME}: the sentence quoted for ${name} is not in the reading text; removed the quote`);
    }

    if (!isUsableExpression(item)) {
      fixes.push(`${NAME}: removed ${name}, which has no meaning, example or speaking question`);
      return;
    }
    const key = comparable(String(item.expression));
    if (known.has(key)) {
      fixes.push(`${NAME}: removed ${name}, which is a target word or a word the student has already learned`);
      return;
    }
    if (seen.has(key)) {
      fixes.push(`${NAME}: removed a second ${name}`);
      return;
    }
    seen.add(key);
    kept.push(item);
  });

  if (kept.length > context.required) {
    fixes.push(`${NAME}: kept the first ${context.required} of ${count(kept.length, 'expressions')}`);
    kept.length = context.required;
  }
  if (kept.length !== section.items.length) section.items = kept;
  return fixes;
}

/** Whether the section is there, usable and complete. Run `fixExpressionsSection` first. */
export function checkExpressionsSection(section: Item | undefined, required: number): ExpressionsCheck {
  if (!section) return { status: 'missing', usableItems: 0, detail: 'missing' };
  const items = Array.isArray(section.items) ? section.items : [];
  if (!items.length) return { status: 'broken', usableItems: 0, detail: 'no expressions' };

  const usableItems = items.filter(isUsableExpression).length;
  const unusable = items.length - usableItems;
  const unusableNote = unusable ? ` (${unusable} unusable)` : '';
  if (usableItems === 0) return { status: 'broken', usableItems, detail: `no usable expressions${unusableNote}` };
  if (usableItems < required) {
    return { status: 'incomplete', usableItems, detail: `${usableItems} of ${required} expressions${unusableNote}` };
  }
  return { status: 'ok', usableItems, detail: `${count(usableItems, 'expressions')}${unusableNote}` };
}

/** The reply's quiz question, fixed like a quiz question, or undefined when the quiz could not show and mark it. */
function usableQuizQuestion(value: unknown): Item | undefined {
  if (!isRecord(value)) return undefined;
  const quiz: Item = { type: 'quiz', questions: [{ ...value }] };
  fixSection('quiz', quiz);
  return checkLessonSection('quiz', quiz).usableItems === 1 ? ((quiz.questions as Item[])[0]) : undefined;
}

/** Sections that come after the idioms & phrasal verbs section. */
const SECTIONS_AFTER = new Set<string>(LESSON_SECTION_TYPES.slice(LESSON_SECTION_TYPES.indexOf('sentenceFrames')));

/** Puts the section after the vocabulary check, before the sentence frames and practice. */
function putExpressionsSection(content: { sections: unknown[] }, section: Item): void {
  const next = content.sections.findIndex(
    (item) => isRecord(item) && typeof item.type === 'string' && SECTIONS_AFTER.has(item.type),
  );
  content.sections.splice(next === -1 ? content.sections.length : next, 0, section);
}

interface Attempt {
  section?: Item;
  check: ExpressionsCheck;
  fixes: string[];
  /** The request's error message, when it failed. */
  error?: string;
}

/** What one request gave, for the failure log: "the retry was broken: no expressions". */
function outcomeOf(attempt: Attempt, name: string): string {
  if (attempt.error) return `the ${name} failed: ${attempt.error}`;
  if (!attempt.section) return `the ${name} had no section`;
  return `the ${name} was ${attempt.check.status}: ${attempt.check.detail}`;
}

/**
 * Adds the section to the lesson in place when the generate request asked
 * for it. Never throws for a failed request; the outcome is logged and
 * returned.
 */
export async function addExpressionsSection(
  content: { sections: unknown[]; [key: string]: unknown },
  options: ExpressionsOptions,
): Promise<ExpressionsReport> {
  const { params, writer, studentVocabulary = [], model } = options;
  const prefix = options.logPrefix ? `${options.logPrefix} ` : '';
  const report: ExpressionsReport = { outcome: 'not requested', fixedInPlace: [], retried: false, quizQuestionAdded: false };
  const rules = expressionsRulesFor(params.cefrLevel);
  if (!wantsExpressions(params) || !rules) return report;

  const lesson = lessonSectionContext(content);
  const fixContext: ExpressionsFixContext = {
    readingParagraphs: lesson.readingParagraphs,
    knownWords: [...lesson.targetWords, ...studentVocabulary],
    required: rules.count,
  };

  const attempt = async (): Promise<Attempt> => {
    let section: Item | undefined;
    let fixes: string[] = [];
    let error: string | undefined;
    try {
      section = sectionFromReply(await writer.writeExpressionsSection(params, lesson, studentVocabulary, model), EXPRESSIONS_SECTION_TYPE);
      if (section) fixes = fixExpressionsSection(section, fixContext);
    } catch (requestError) {
      error = requestError instanceof Error ? requestError.message : String(requestError);
    }
    for (const fix of fixes) console.log(`${prefix}Lesson check: fixed in place: ${fix}`);
    return { section, check: checkExpressionsSection(section, rules.count), fixes, error };
  };

  const first = await attempt();
  report.fixedInPlace.push(...first.fixes);
  let best = first;
  let failures = '';
  if (first.check.status !== 'ok') {
    const state = first.section ? `${first.check.status} (${first.check.detail})` : 'missing';
    console.warn(`${prefix}Lesson check: ${NAME} section is ${state} — requesting this section again`);
    report.retried = true;
    const retry = await attempt();
    report.fixedInPlace.push(...retry.fixes);
    if (isMoreUsable(retry.check, first.check)) best = retry;
    failures = `${outcomeOf(first, 'first request')}; ${outcomeOf(retry, 'retry')}`;
  }

  const { section, check } = best;
  report.check = check;
  if (!section || (check.status !== 'ok' && check.status !== 'incomplete')) {
    report.outcome = 'left out';
    console.error(`${prefix}Lesson repair FAILED for the ${NAME} section: ${failures}. The lesson is saved without this section.`);
    return report;
  }

  const quizQuestion = usableQuizQuestion(section.quizQuestion);
  putExpressionsSection(content, { type: EXPRESSIONS_SECTION_TYPE, title: rules.title, items: expressionItemsOf(section) });
  const quiz = findSection(content, 'quiz');
  if (quizQuestion && quiz && Array.isArray(quiz.questions)) {
    quiz.questions.push(quizQuestion);
    report.quizQuestionAdded = true;
  }

  if (check.status === 'ok') {
    report.outcome = 'added';
    console.log(`${prefix}Lesson check: ${NAME} section added (${check.detail}${report.quizQuestionAdded ? ', plus a quiz question' : ''})`);
  } else {
    report.outcome = 'added incomplete';
    console.error(
      `${prefix}Lesson repair FAILED for the ${NAME} section: ${failures}. Keeping the ${best === first ? 'first version' : 'retry'}, which has ${check.detail}.`,
    );
  }
  return report;
}
