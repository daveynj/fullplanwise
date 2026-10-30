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
 * - Students can suggest topics. Students of Unlimited teachers (and of admin
 *   accounts) can also make lessons themselves, unless the teacher switches it
 *   off: at their level, never with the teacher's notes about them. Each lesson
 *   goes into the teacher's library and is planned like any other.
 * - So the teacher always knows what the student wants, a student can have at
 *   most 3 ideas and 3 lessons they made waiting, and stars the lesson they
 *   want to do next (a lesson they just made is starred for them).
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
  /** The student made this lesson on their page. */
  madeByYou: boolean;
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
  /** Planned lessons, the one the student wants to do next first. */
  comingUp: StudentPageLessonSummary[];
  finished: StudentPageLessonSummary[];
  /** The coming-up lesson the student starred to do next, if any. */
  nextLessonId: number | null;
  /** Whether the student can make lessons, not just suggest topics. */
  canMakeLessons: boolean;
  /** A lesson the student is making right now. */
  making: { topic: string } | null;
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
  /** The student made this lesson on their page (they can remove it until it is done). */
  madeByYou: boolean;
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

// ---------------------------------------------------------------------------
// Ideas and lessons the student makes
// ---------------------------------------------------------------------------

/** Topic ideas a student can have waiting for their teacher. */
export const MAX_WAITING_IDEAS = 3;
/** Lessons a student can have made and not yet done with their teacher (including one being made). */
export const MAX_WAITING_STUDENT_LESSONS = 3;
/** A safety limit on lessons one student can start making in 24 hours. */
export const STUDENT_LESSONS_PER_DAY = 10;
export const TOPIC_MIN_LENGTH = 3;
export const TOPIC_MAX_LENGTH = 120;

/** student_ideas.status */
export const IDEA_WAITING = "waiting";
export const IDEA_MADE = "made";
export const IDEA_DISMISSED = "dismissed";

/** Whether a teacher's account lets their students make lessons: Unlimited, or an admin account. */
export function planLetsStudentsMakeLessons(
  teacher: { isAdmin?: boolean | null; subscriptionTier?: string | null } | null | undefined,
): boolean {
  return !!teacher && (!!teacher.isAdmin || teacher.subscriptionTier === "unlimited");
}

/** A topic as the student typed it, tidied up; null when it is too short or too long. */
export function cleanTopic(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const topic = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return topic.length >= TOPIC_MIN_LENGTH && topic.length <= TOPIC_MAX_LENGTH ? topic : null;
}

/** A topic the student sent their teacher. */
export interface StudentIdeaSummary {
  id: number;
  topic: string;
  /** When it was sent, as an ISO date. */
  sentAt: string;
}

/** The student's "What should we talk about next?" page. */
export interface StudentNextPage {
  student: { name: string; cefrLevel: string };
  teacherName: string | null;
  canMakeLessons: boolean;
  /** Ideas waiting for the teacher, newest first. */
  ideas: StudentIdeaSummary[];
  /** Lessons the student made that are not done yet, newest first. */
  madeLessons: Array<{ id: number; title: string; date: string }>;
  /** A lesson being made right now. */
  making: { jobId: string; topic: string } | null;
  /** The student has made STUDENT_LESSONS_PER_DAY lessons in the last 24 hours. */
  dailyLimitReached: boolean;
}

/** How a lesson the student is making is getting on. */
export type StudentLessonJob =
  | { status: "pending"; topic: string }
  | { status: "complete"; lesson: { id: number; title: string; cefrLevel: string } }
  | { status: "error"; message: string };

/** What each student has sent or made for their teacher, for the teacher's Students page. */
export type StudentRequestCounts = Record<number, { ideas: number; madeLessons: number }>;
