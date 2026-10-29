import { isClozeAnswerCorrect } from '@shared/cloze';
import {
  LESSON_SECTION_NAMES,
  LESSON_SECTION_TYPES,
  type LessonSectionContext,
  type LessonSectionType,
} from './lesson-prompt';

/**
 * Checks a newly generated lesson, section by section, before it is saved.
 *
 * The AI sometimes leaves part of a lesson out: about half of A2 lessons came
 * back with 1 sentence frame instead of 3, and test lessons included a missing
 * vocabulary section and a fill-in-the-blank whose gaps were in an extra field,
 * which left an exercise with no gaps. This module:
 *
 * - fixes slips that have one clear fix, in place (`fixLessonInPlace`), and
 * - reports each section that is missing, broken or short of items
 *   (`checkLessonSection`), so lesson-repair.ts can ask for just that section
 *   again.
 *
 * An item is "usable" when the lesson page can show it and the student can
 * complete it: a quiz question needs an answer that is one of its options, a
 * fill-in-the-blank gap needs a word-bank word of its own, and so on.
 */

type Section = Record<string, unknown>;

export type SectionStatus = 'ok' | 'incomplete' | 'broken' | 'missing';

export interface SectionCheck {
  type: LessonSectionType;
  status: SectionStatus;
  /** Usable words, frames, questions, paragraphs, sentences or gaps. */
  usableItems: number;
  /** What the section has, or what is wrong with it, e.g. "1 of 3 frames". */
  detail: string;
}

/** Item counts the lesson prompt asks for. Other sections need at least one usable item. */
export const REQUIRED_ITEMS: Partial<Record<LessonSectionType, number>> = {
  vocabulary: 5,
  sentenceFrames: 3,
  cloze: 5,
  discussion: 5,
  quiz: 5,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const sameText = (a: string, b: string) =>
  a.toLowerCase().replace(/\s+/g, ' ').trim() === b.toLowerCase().replace(/\s+/g, ' ').trim();

/** "1 frame", "3 frames": nouns are given in the plural. */
const count = (n: number, noun: string) => `${n} ${n === 1 ? noun.replace(/s$/, '') : noun}`;

/** The first section of a type, as the lesson page finds it. */
export function findSection(content: unknown, type: LessonSectionType): Section | undefined {
  const sections = isRecord(content) && Array.isArray(content.sections) ? content.sections : [];
  return sections.find((section): section is Section => isRecord(section) && section.type === type);
}

// ---------------------------------------------------------------------------
// Usable items
// ---------------------------------------------------------------------------

function isUsableWord(word: unknown): boolean {
  return isRecord(word) && (hasText(word.term) || hasText(word.word)) && hasText(word.definition);
}

function optionTexts(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => (typeof option === 'string' ? option : isRecord(option) && typeof option.text === 'string' ? option.text : ''))
    .filter(hasText);
}

/** The answer the lesson page marks as correct: correctAnswer, then answer, then an option marked correct. */
function markedAnswer(question: Record<string, unknown>): string {
  const { correctAnswer, answer } = question;
  if (correctAnswer !== undefined && correctAnswer !== null && correctAnswer !== '') return String(correctAnswer);
  if (hasText(answer)) return answer;
  const marked = Array.isArray(question.options)
    ? question.options.find((option) => isRecord(option) && option.correct === true)
    : undefined;
  return isRecord(marked) && typeof marked.text === 'string' ? marked.text : '';
}

type ChoiceSection = 'comprehension' | 'quiz';

/** The options the page shows; the quiz shows True and False for a question without options. */
function choiceOptions(question: Record<string, unknown>, type: ChoiceSection): string[] {
  const options = optionTexts(question.options);
  return options.length || type !== 'quiz' ? options : ['True', 'False'];
}

/** A multiple-choice or true/false question whose marked answer is one of its options. */
function isAnswerableChoiceQuestion(question: unknown, type: ChoiceSection): boolean {
  if (!isRecord(question) || !hasText(question.question)) return false;
  const options = choiceOptions(question, type);
  const answer = markedAnswer(question);
  return options.length >= 2 && hasText(answer) && options.some((option) => sameText(option, answer));
}

const FRAME_TIERS = ['emerging', 'developing', 'expanding'] as const;

/** A sentence frame the lesson page can show without crashing: three tiers, grammar focus list, model responses and notes. */
function isUsableFrame(frame: unknown): boolean {
  if (!isRecord(frame) || !isRecord(frame.tieredFrames)) return false;
  const tiers = frame.tieredFrames;
  return (
    FRAME_TIERS.every((tier) => isRecord(tiers[tier]) && hasText(tiers[tier].frame)) &&
    Array.isArray(frame.grammarFocus) &&
    isRecord(frame.modelResponses) &&
    isRecord(frame.teachingNotes)
  );
}

/** Words as the unscramble exercise compares them: lower case, without . , ? ! ; : */
function unscrambleTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,?!;:]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .sort();
}

/** An unscramble sentence whose words can be put back together into its correct sentence. */
function isSolvableUnscramble(sentence: unknown): boolean {
  if (!isRecord(sentence) || !hasText(sentence.correctSentence) || !Array.isArray(sentence.words)) return false;
  if (sentence.words.length < 2 || !sentence.words.every(hasText)) return false;
  return unscrambleTokens(sentence.words.join(' ')).join(' ') === unscrambleTokens(sentence.correctSentence).join(' ');
}

/** The page shows discussion questions that are objects with question text, and skips plain strings. */
function isUsableDiscussionQuestion(question: unknown): boolean {
  return isRecord(question) && (hasText(question.question) || hasText(question.text));
}

interface ItemList {
  key: string;
  noun: string;
  usable: (item: unknown) => boolean;
}

const ITEM_LISTS: Record<Exclude<LessonSectionType, 'cloze'>, ItemList> = {
  warmup: { key: 'questions', noun: 'questions', usable: hasText },
  reading: { key: 'paragraphs', noun: 'paragraphs', usable: hasText },
  vocabulary: { key: 'words', noun: 'words', usable: isUsableWord },
  comprehension: { key: 'questions', noun: 'questions', usable: (question) => isAnswerableChoiceQuestion(question, 'comprehension') },
  sentenceFrames: { key: 'pedagogicalFrames', noun: 'frames', usable: isUsableFrame },
  sentenceUnscramble: { key: 'sentences', noun: 'sentences', usable: isSolvableUnscramble },
  discussion: { key: 'questions', noun: 'questions', usable: isUsableDiscussionQuestion },
  quiz: { key: 'questions', noun: 'questions', usable: (question) => isAnswerableChoiceQuestion(question, 'quiz') },
};

// ---------------------------------------------------------------------------
// Fill-in-the-blank
// ---------------------------------------------------------------------------

/** Gap markers as the exercise reads them: [1:word]. */
const GAP_PATTERN = /\[(\d+):([^\]]+)\]/g;
/** Gaps left empty, like [1:], which the exercise does not treat as gaps at all. */
const EMPTY_GAP_PATTERN = /\[\d+:\s*\]/g;

function wordBankOf(section: Section): string[] {
  return Array.isArray(section.wordBank) ? section.wordBank.filter(hasText).map((word) => word.trim()) : [];
}

function gapsIn(text: unknown): RegExpMatchArray[] {
  return typeof text === 'string' ? Array.from(text.matchAll(GAP_PATTERN)) : [];
}

/**
 * Whether every gap can get its own word-bank word. The exercise greys out a
 * word once it is placed, so two gaps that need the same word cannot both be
 * filled.
 */
function eachGapHasItsOwnWord(answers: string[], bank: string[]): boolean {
  const fits = answers.map((answer) =>
    bank.flatMap((entry, index) => (isClozeAnswerCorrect(entry, answer, bank) ? [index] : [])),
  );
  const gapForWord: number[] = bank.map(() => -1);
  const assign = (gap: number, tried: Set<number>): boolean => {
    for (const word of fits[gap]) {
      if (tried.has(word)) continue;
      tried.add(word);
      if (gapForWord[word] === -1 || assign(gapForWord[word], tried)) {
        gapForWord[word] = gap;
        return true;
      }
    }
    return false;
  };
  return fits.every((_, gap) => assign(gap, new Set()));
}

function checkCloze(section: Section): SectionCheck {
  const result = (status: SectionStatus, usableItems: number, detail: string): SectionCheck => ({
    type: 'cloze',
    status,
    usableItems,
    detail,
  });
  const bank = wordBankOf(section);
  if (!bank.length) return result('broken', 0, 'no word bank');
  if (new Set(bank.map((word) => word.toLowerCase())).size !== bank.length) {
    return result('broken', 0, 'the word bank lists a word twice');
  }

  const gaps = gapsIn(section.text);
  if (!gaps.length) {
    const emptyGaps = typeof section.text === 'string' ? section.text.match(EMPTY_GAP_PATTERN)?.length ?? 0 : 0;
    return result('broken', 0, emptyGaps ? `no gaps, only ${emptyGaps} empty markers like "[1:]"` : 'no gaps in the text');
  }

  const numbers = gaps.map(([, number]) => number);
  const repeated = numbers.find((number, index) => numbers.indexOf(number) !== index);
  if (repeated) return result('broken', 0, `gap ${repeated} appears twice`);

  const unanswerable = gaps.filter(([, , answer]) => !bank.some((entry) => isClozeAnswerCorrect(entry, answer, bank)));
  if (unanswerable.length) {
    return result('broken', 0, `no word-bank word fits ${unanswerable.map(([gap]) => gap).join(', ')}`);
  }
  if (!eachGapHasItsOwnWord(gaps.map(([, , answer]) => answer), bank)) {
    return result('broken', 0, 'two gaps need the same word-bank word');
  }

  const required = REQUIRED_ITEMS.cloze!;
  if (gaps.length !== required) return result('incomplete', gaps.length, `${count(gaps.length, 'gaps')} instead of ${required}`);
  return result('ok', gaps.length, count(gaps.length, 'gaps'));
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/** Whether a section is there, usable and complete. Run `fixSection` first. */
export function checkLessonSection(type: LessonSectionType, section: Section | undefined): SectionCheck {
  if (!section) return { type, status: 'missing', usableItems: 0, detail: 'missing' };
  if (type === 'cloze') return checkCloze(section);

  const { key, noun, usable } = ITEM_LISTS[type];
  const items = section[key];
  if (!Array.isArray(items) || items.length === 0) return { type, status: 'broken', usableItems: 0, detail: `no ${noun}` };

  const usableItems = items.filter(usable).length;
  const required = REQUIRED_ITEMS[type];
  const unusable = items.length - usableItems;
  const unusableNote = unusable ? ` (${unusable} unusable)` : '';
  if (usableItems === 0) return { type, status: 'broken', usableItems, detail: `no usable ${noun}${unusableNote}` };
  if (required && usableItems < required) {
    return { type, status: 'incomplete', usableItems, detail: `${usableItems} of ${required} ${noun}${unusableNote}` };
  }
  return { type, status: 'ok', usableItems, detail: `${count(usableItems, noun)}${unusableNote}` };
}

/** Checks all nine sections of a lesson. */
export function checkLesson(content: unknown): SectionCheck[] {
  return LESSON_SECTION_TYPES.map((type) => checkLessonSection(type, findSection(content, type)));
}

const STATUS_RANK: Record<SectionStatus, number> = { missing: 0, broken: 1, incomplete: 2, ok: 3 };

/** Whether check `a` describes a more usable version of a section than check `b`. */
export function isMoreUsable(
  a: Pick<SectionCheck, 'status' | 'usableItems'>,
  b: Pick<SectionCheck, 'status' | 'usableItems'>,
): boolean {
  if (STATUS_RANK[a.status] !== STATUS_RANK[b.status]) return STATUS_RANK[a.status] > STATUS_RANK[b.status];
  return a.usableItems > b.usableItems;
}

// ---------------------------------------------------------------------------
// Fixes in place
// ---------------------------------------------------------------------------

/**
 * Gapped text the model put in another field of the fill-in-the-blank section
 * (for example `activity.cloze`) instead of `text`. Answer lists like
 * "Answers: [1:hope], [2:goal]" don't count: the text must read like a paragraph.
 */
function gappedTextsElsewhere(section: Section): { path: string; text: string }[] {
  const found: { path: string; text: string }[] = [];
  const visit = (value: unknown, path: string, depth: number) => {
    if (typeof value === 'string') {
      const gaps = gapsIn(value).length;
      const wordsOutsideGaps = value.replace(GAP_PATTERN, ' ').split(/\s+/).filter(Boolean).length;
      if (gaps && wordsOutsideGaps >= gaps * 4) found.push({ path, text: value });
    } else if (depth < 3 && Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`, depth + 1));
    } else if (depth < 3 && isRecord(value)) {
      for (const [key, item] of Object.entries(value)) visit(item, `${path}.${key}`, depth + 1);
    }
  };
  for (const [key, value] of Object.entries(section)) {
    if (key !== 'type' && key !== 'text' && key !== 'wordBank') visit(value, key, 1);
  }
  return found;
}

/** The lesson page marks correctAnswer first; make it the option text when the AI gave a letter or a stray value. */
function fixChoiceAnswer(question: unknown, type: ChoiceSection): boolean {
  if (!isRecord(question) || isAnswerableChoiceQuestion(question, type)) return false;
  const options = choiceOptions(question, type);
  if (options.length < 2) return false;

  const matching = (value: unknown) => (hasText(value) ? options.find((option) => sameText(option, value)) : undefined);
  const fromAnswer = matching(question.answer);
  const letter = String(question.correctAnswer ?? question.answer ?? '').trim().toUpperCase();
  const fromLetter = /^[A-D]$/.test(letter) ? options[letter.charCodeAt(0) - 65] : undefined;
  const fixed = fromAnswer ?? fromLetter;
  if (!fixed) return false;
  question.correctAnswer = fixed;
  question.answer = fixed;
  return isAnswerableChoiceQuestion(question, type);
}

/** Rebuilds an unscramble sentence's words from its correct sentence, so the student can solve it. */
function rebuildUnscrambleWords(sentence: unknown): boolean {
  if (!isRecord(sentence) || !hasText(sentence.correctSentence) || isSolvableUnscramble(sentence)) return false;
  const correctSentence = sentence.correctSentence.trim().replace(/\s+/g, ' ');
  const words = correctSentence.split(' ');
  const last = words[words.length - 1].replace(/[.!?]+$/, '');
  if (last) words[words.length - 1] = last;
  if (words.length < 2) return false;
  sentence.correctSentence = correctSentence;
  sentence.words = words;
  return true;
}

/**
 * Fixes slips with one clear fix in a single section, and removes items the
 * lesson page cannot use. Returns a description of each change, for logs.
 */
export function fixSection(type: LessonSectionType, section: Section): string[] {
  const fixes: string[] = [];

  if (type === 'cloze') {
    const current = checkCloze(section);
    if (current.status === 'ok') return fixes;
    let best: { path: string; text: string; check: SectionCheck } | undefined;
    for (const candidate of gappedTextsElsewhere(section)) {
      const candidateCheck = checkCloze({ ...section, text: candidate.text });
      if (isMoreUsable(candidateCheck, best?.check ?? current)) best = { ...candidate, check: candidateCheck };
    }
    if (best) {
      section.text = best.text;
      fixes.push(`fill-in-the-blank: used the gapped text from "${best.path}" in place of "text", which was ${current.status} (${current.detail})`);
    }
    return fixes;
  }

  if (type === 'sentenceFrames' && Array.isArray(section.pedagogicalFrames) && section.version !== 'v2_pedagogical') {
    section.version = 'v2_pedagogical';
    fixes.push('sentence frames: set the missing format version');
  }

  const { key, noun, usable } = ITEM_LISTS[type];
  const items = section[key];
  if (!Array.isArray(items)) return fixes;

  const name = LESSON_SECTION_NAMES[type];
  items.forEach((item, index) => {
    if ((type === 'quiz' || type === 'comprehension') && fixChoiceAnswer(item, type)) {
      fixes.push(`${name}: the correct answer to question ${index + 1} was not one of its options; set it to "${(item as Section).correctAnswer}"`);
    }
    if (type === 'sentenceUnscramble' && rebuildUnscrambleWords(item)) {
      fixes.push(`${name}: rebuilt the words of sentence ${index + 1} from its correct sentence`);
    }
  });

  const kept = items.filter(usable);
  if (kept.length < items.length) {
    section[key] = kept;
    fixes.push(`${name}: removed ${count(items.length - kept.length, `unusable ${noun}`)}`);
  }
  return fixes;
}

/** Applies `fixSection` to each of the nine sections that is present. */
export function fixLessonInPlace(content: unknown): string[] {
  return LESSON_SECTION_TYPES.flatMap((type) => {
    const section = findSection(content, type);
    return section ? fixSection(type, section) : [];
  });
}

// ---------------------------------------------------------------------------
// Lesson context for regenerating a section
// ---------------------------------------------------------------------------

function uniqueWords(words: string[]): string[] {
  const seen = new Set<string>();
  return words
    .map((word) => word.trim())
    .filter((word) => {
      const key = word.toLowerCase();
      if (!word || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * The lesson's target words: the vocabulary terms, else the warm-up's target
 * words, else the fill-in-the-blank word bank. Read before `fixSection` removes
 * anything, so a word with a missing definition still names a target word.
 */
export function targetWordsOf(content: unknown): string[] {
  const vocabulary = findSection(content, 'vocabulary');
  const warmup = findSection(content, 'warmup');
  const cloze = findSection(content, 'cloze');
  const lists = [
    Array.isArray(vocabulary?.words)
      ? vocabulary.words.map((word) => (isRecord(word) ? (hasText(word.term) ? word.term : word.word) : undefined)).filter(hasText)
      : [],
    Array.isArray(warmup?.targetVocabulary) ? warmup.targetVocabulary.filter(hasText) : [],
    cloze ? wordBankOf(cloze) : [],
  ].map(uniqueWords);
  const required = REQUIRED_ITEMS.vocabulary!;
  const complete = lists.find((list) => list.length >= required);
  const best = complete ?? lists.reduce((longest, list) => (list.length > longest.length ? list : longest));
  return best.slice(0, required);
}

/** What a regenerated section needs to know about the rest of the lesson. */
export function lessonSectionContext(content: unknown): LessonSectionContext {
  const reading = findSection(content, 'reading');
  const discussion = findSection(content, 'discussion');
  return {
    title: isRecord(content) && hasText(content.title) ? content.title.trim() : undefined,
    targetWords: targetWordsOf(content),
    readingParagraphs: Array.isArray(reading?.paragraphs) ? reading.paragraphs.filter(hasText) : [],
    discussionQuestions: Array.isArray(discussion?.questions)
      ? discussion.questions
          .map((question) => (isRecord(question) ? (hasText(question.question) ? question.question : question.text) : undefined))
          .filter(hasText)
      : [],
  };
}
