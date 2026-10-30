/**
 * The student's own page: a private link (/s/<code>) where a student sees
 * the lessons they did with their teacher, their words, flashcards and the
 * lesson coming up. Shared by the server routes, the student's pages and the
 * teacher's student page.
 *
 * Rules agreed with Dave (October 2026):
 * - Every teacher's students can have a page; the teacher turns the link on,
 *   off, or replaces it with a new one.
 * - A lesson assigned to a student is "planned" until the teacher marks it
 *   done ("We did this"); only then do its words join the student's list.
 *   Lessons assigned before this rule existed were all treated as done.
 * - A planned lesson shows only its reading and new words, so nothing in the
 *   activities is spoiled. A finished lesson opens in full, without anything
 *   written for the teacher.
 * - The student never sees the teacher's private notes or the lesson request.
 */
import type { ExpressionKind } from "./lesson-expressions";

/** student_lessons.status of a lesson not done yet. */
export const LESSON_STATUS_PLANNED = "assigned";
/** student_lessons.status of a lesson the teacher marked done. */
export const LESSON_STATUS_DONE = "completed";

export function isLessonDone(status: string | null | undefined): boolean {
  return status === LESSON_STATUS_DONE;
}

/** The student page's address for a page code. */
export function studentPagePath(token: string): string {
  return `/s/${token}`;
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

export type WordKind = "word" | ExpressionKind;

const WORD_KINDS: readonly WordKind[] = ["word", "phrasal verb", "idiom", "expression"];

/** A stored kind, read safely: rows saved before kinds were recorded are words. */
export function wordKindOf(kind: string | null | undefined): WordKind {
  const value = typeof kind === "string" ? kind.trim().toLowerCase() : "";
  return WORD_KINDS.find((known) => known === value) ?? "word";
}

export const WORD_KIND_LABELS: Record<WordKind, string> = {
  word: "Word",
  "phrasal verb": "Phrasal verb",
  idiom: "Idiom",
  expression: "Expression",
};

// ---------------------------------------------------------------------------
// Flashcard practice
// ---------------------------------------------------------------------------

export const PRACTICE_RESULTS = ["got", "again"] as const;
export type PracticeResult = (typeof PRACTICE_RESULTS)[number];

export function isPracticeResult(value: unknown): value is PracticeResult {
  return PRACTICE_RESULTS.includes(value as PracticeResult);
}

/**
 * Days until a word comes back, by the level it reaches with "Got it".
 * Level 0 is a new word or one marked "Not yet": it comes back next time.
 */
export const PRACTICE_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;
export const MAX_PRACTICE_LEVEL = PRACTICE_INTERVAL_DAYS.length - 1;

const DAY_MS = 24 * 60 * 60 * 1000;

/** A word's level and next practice date after an answer. */
export function nextPractice(
  level: number,
  result: PracticeResult,
  now: Date = new Date(),
): { practiceLevel: number; nextPracticeAt: Date } {
  if (result === "again") return { practiceLevel: 0, nextPracticeAt: now };
  const practiceLevel = Math.min(Math.max(level, 0) + 1, MAX_PRACTICE_LEVEL);
  return { practiceLevel, nextPracticeAt: new Date(now.getTime() + PRACTICE_INTERVAL_DAYS[practiceLevel] * DAY_MS) };
}

/** Never practised, last marked "Not yet", or last marked "Got it". */
export type WordStatus = "new" | "practising" | "known";

export function wordStatusOf(word: { practiceLevel: number; lastPractisedAt: Date | string | null }): WordStatus {
  if (!word.lastPractisedAt) return "new";
  return word.practiceLevel > 0 ? "known" : "practising";
}

/** How many flashcards one practice session shows at most. */
export const FLASHCARD_DECK_SIZE = 10;

// ---------------------------------------------------------------------------
// What the student page receives
// ---------------------------------------------------------------------------

export interface StudentPageLessonSummary {
  /** The lesson's id. */
  id: number;
  title: string;
  cefrLevel: string;
  /** When it was planned (coming up) or done (finished), as an ISO date. */
  date: string;
  /** Words and idioms/phrasal verbs in the student's list from this lesson. */
  words: number;
  expressions: number;
}

export interface StudentPageHome {
  student: { name: string; cefrLevel: string };
  /** The teacher's first name, when their account has one. */
  teacherName: string | null;
  stats: { lessonsDone: number; words: number; expressions: number };
  practice: {
    /** Cards ready to practise now. */
    due: number;
    /** Of those, never practised. */
    new: number;
    /** Of those, last marked "Not yet". */
    again: number;
  };
  comingUp: StudentPageLessonSummary[];
  finished: StudentPageLessonSummary[];
}

export interface StudentPageWord {
  id: number;
  word: string;
  definition: string | null;
  kind: WordKind;
  lessonTitle: string | null;
  status: WordStatus;
}

export interface StudentFlashcard {
  id: number;
  word: string;
  meaning: string | null;
  kind: WordKind;
  /** An example sentence from the lesson; ** marks the word. */
  example: string | null;
  partOfSpeech: string | null;
  lessonTitle: string | null;
  /** The word's picture from the lesson, through the student page. */
  imageUrl: string | null;
}

export interface StudentFlashcardDeck {
  cards: StudentFlashcard[];
  /** All cards ready now, including ones beyond this deck. */
  due: number;
}

export interface StudentPageLesson {
  id: number;
  title: string;
  cefrLevel: string;
  status: "planned" | "done";
  /** When it was planned or done, as an ISO date. */
  date: string;
  /**
   * Planned: only the reading and vocabulary sections. Done: every section,
   * without the teacher notes section or fields written for the teacher.
   */
  content: Record<string, unknown>;
  grammarSpotlight: unknown | null;
  /** Planned lessons: the activities that open in class. */
  lockedActivities: string[];
}

/** The teacher's view of how a student is practising. */
export interface StudentPracticeStats {
  lastPractisedAt: string | null;
  /** Flashcard answers in the last 7 days. */
  cardsThisWeek: number;
  /** Days with at least one answer in the last 7 days. */
  daysPractisedThisWeek: number;
  /** Words last marked "Not yet", newest first. */
  stillLearning: string[];
}
