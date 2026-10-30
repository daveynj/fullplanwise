/**
 * What a student's own page shows (see shared/student-page.ts): plain
 * functions that turn a student's lessons and words into the page's data,
 * kept apart from the routes so they can be tested on their own.
 */
import { lessonGenerateSchema, type LessonGenerateParams, type StudentVocabulary } from "@shared/schema";
import { EXPRESSIONS_COMPONENT, EXPRESSIONS_SECTION_TYPE, expressionsRulesFor } from "@shared/lesson-expressions";
import {
  FLASHCARD_DECK_SIZE,
  STUDENT_LESSONS_PER_DAY,
  isLessonDone,
  wordKindOf,
  wordStatusOf,
  type StudentFlashcard,
  type StudentNextPage,
  type StudentPageHome,
  type StudentPageLessonSummary,
  type StudentPageWord,
} from "@shared/student-page";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// ---------------------------------------------------------------------------
// What a student may see of a lesson
// ---------------------------------------------------------------------------

/**
 * Fields written for the teacher. They can repeat what the teacher wrote
 * about the student when asking for the lesson, so the student never gets them.
 */
const TEACHER_ONLY_FIELDS = new Set(["teacherNotes", "procedure", "teachingTips", "teachingNotes"]);

/** A copy of lesson content without the teacher notes section or any field written for the teacher. */
export function withoutTeacherContent(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutTeacherContent);
  if (!isRecord(value)) return value;
  const copy: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (TEACHER_ONLY_FIELDS.has(key)) continue;
    copy[key] = key === "sections" && Array.isArray(child)
      ? child.filter((section) => !(isRecord(section) && section.type === "notes")).map(withoutTeacherContent)
      : withoutTeacherContent(child);
  }
  return copy;
}

/** What a student reads before a lesson: the text and the new words. */
const PREPARE_SECTION_TYPES = new Set(["reading", "vocabulary"]);

/** Names of the activities a planned lesson keeps for class, as the lesson page's tabs call them. */
const ACTIVITY_NAMES: Record<string, string> = {
  warmup: "Warm-up",
  "warm-up": "Warm-up",
  comprehension: "Comprehension",
  sentenceFrames: "Sentence frames",
  grammar: "Sentence frames",
  cloze: "Fill in the blanks",
  sentenceUnscramble: "Sentence unscramble",
  discussion: "Discussion",
  speaking: "Discussion",
  quiz: "Quiz",
  assessment: "Quiz",
  [EXPRESSIONS_SECTION_TYPE]: "Idioms & phrasal verbs",
};

/**
 * The lesson content a student receives. A finished lesson comes whole; a
 * planned one only with its reading and vocabulary, plus the names of the
 * activities that open in class. Never anything written for the teacher.
 */
export function studentLessonContent(
  content: unknown,
  done: boolean,
): { content: Record<string, unknown>; lockedActivities: string[] } {
  const visible = withoutTeacherContent(content);
  const doc = isRecord(visible) ? visible : {};
  if (done) return { content: doc, lockedActivities: [] };

  const sections = Array.isArray(doc.sections) ? doc.sections.filter(isRecord) : [];
  const lockedActivities: string[] = [];
  for (const section of sections) {
    const type = typeof section.type === "string" ? section.type : "";
    if (PREPARE_SECTION_TYPES.has(type)) continue;
    const name = type === EXPRESSIONS_SECTION_TYPE && typeof section.title === "string" && section.title.trim()
      ? section.title.trim()
      : ACTIVITY_NAMES[type];
    if (name && !lockedActivities.includes(name)) lockedActivities.push(name);
  }
  return {
    content: {
      title: doc.title,
      level: doc.level,
      sections: sections.filter((section) => PREPARE_SECTION_TYPES.has(String(section.type))),
    },
    lockedActivities,
  };
}

const STORED_IMAGE_URL = /^\/api\/images\/(lesson-images\/[a-zA-Z0-9/_-]+\.(?:png|jpg))$/;

/** The storage key of a lesson picture stored by the app, or null for anything else. */
export function storedImageKey(url: unknown): string | null {
  return typeof url === "string" ? url.match(STORED_IMAGE_URL)?.[1] ?? null : null;
}

/**
 * Points the lesson's stored pictures at the student page, which checks the
 * page code (pictures of private lessons only load for their owner
 * otherwise). Picture links the app did not store are dropped.
 */
export function withStudentImageUrls(value: unknown, toUrl: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map((item) => withStudentImageUrls(item, toUrl));
  if (!isRecord(value)) return value;
  const copy: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "imageUrl") {
      const stored = storedImageKey(child);
      copy.imageUrl = stored ? toUrl(stored) : null;
    } else {
      copy[key] = withStudentImageUrls(child, toUrl);
    }
  }
  return copy;
}

// ---------------------------------------------------------------------------
// The page's lessons and words
// ---------------------------------------------------------------------------

/** A student's lesson assignment with the lesson's title and level. */
export interface AssignedLesson {
  lessonId: number;
  status: string | null;
  assignedAt: Date | string;
  completedAt: Date | string | null;
  /** The student made the lesson on their page. */
  madeByStudent: boolean;
  lesson: { title: string; cefrLevel: string };
}

type Vocabulary = Pick<
  StudentVocabulary,
  "id" | "lessonId" | "word" | "definition" | "kind" | "learnedAt" | "originLessonTitle" | "practiceLevel" | "nextPracticeAt" | "lastPractisedAt"
>;

const time = (value: Date | string | null | undefined): number => (value ? new Date(value).getTime() : 0);
const isoDate = (value: Date | string | null | undefined): string => new Date(value ?? 0).toISOString();

/** The first word of the teacher's name, if their account has one (never the username or email). */
export function teacherFirstName(fullName: string | null | undefined): string | null {
  const first = typeof fullName === "string" ? fullName.trim().split(/\s+/)[0] : "";
  return first || null;
}

/** Whether a word is ready to practise now: never scheduled, or its day has come. */
export function isDue(word: Pick<Vocabulary, "nextPracticeAt">, now: Date): boolean {
  return !word.nextPracticeAt || time(word.nextPracticeAt) <= now.getTime();
}

/** The home page: the student's lessons, how much they know, and what is ready to practise. */
export function buildStudentPageHome(input: {
  student: { name: string; cefrLevel: string; nextLessonId: number | null };
  teacherName: string | null;
  assignments: AssignedLesson[];
  vocabulary: Vocabulary[];
  canMakeLessons: boolean;
  making: { topic: string } | null;
  now?: Date;
}): StudentPageHome {
  const now = input.now ?? new Date();
  const counts = new Map<number, { words: number; expressions: number }>();
  let words = 0;
  let expressions = 0;
  for (const word of input.vocabulary) {
    const isWord = wordKindOf(word.kind) === "word";
    if (isWord) words++;
    else expressions++;
    if (word.lessonId === null) continue;
    const count = counts.get(word.lessonId) ?? { words: 0, expressions: 0 };
    if (isWord) count.words++;
    else count.expressions++;
    counts.set(word.lessonId, count);
  }

  const summary = (assignment: AssignedLesson, date: Date | string | null): StudentPageLessonSummary => ({
    id: assignment.lessonId,
    title: assignment.lesson.title,
    cefrLevel: assignment.lesson.cefrLevel,
    date: isoDate(date),
    ...(counts.get(assignment.lessonId) ?? { words: 0, expressions: 0 }),
    madeByYou: assignment.madeByStudent,
  });
  // The star only counts while its lesson is still coming up.
  const planned = input.assignments.filter((assignment) => !isLessonDone(assignment.status));
  const nextLessonId = planned.some((assignment) => assignment.lessonId === input.student.nextLessonId)
    ? input.student.nextLessonId
    : null;
  const comingUp = planned
    .sort((a, b) => Number(b.lessonId === nextLessonId) - Number(a.lessonId === nextLessonId) || time(a.assignedAt) - time(b.assignedAt))
    .map((assignment) => summary(assignment, assignment.assignedAt));
  const finished = input.assignments
    .filter((assignment) => isLessonDone(assignment.status))
    .sort((a, b) => time(b.completedAt ?? b.assignedAt) - time(a.completedAt ?? a.assignedAt))
    .map((assignment) => summary(assignment, assignment.completedAt ?? assignment.assignedAt));

  const due = input.vocabulary.filter((word) => isDue(word, now));
  return {
    student: { name: input.student.name, cefrLevel: input.student.cefrLevel },
    teacherName: input.teacherName,
    stats: { lessonsDone: finished.length, words, expressions },
    practice: {
      due: due.length,
      new: due.filter((word) => !word.lastPractisedAt).length,
      again: due.filter((word) => word.lastPractisedAt && word.practiceLevel === 0).length,
    },
    comingUp,
    finished,
    nextLessonId,
    canMakeLessons: input.canMakeLessons,
    making: input.making,
  };
}

/** Every part of a lesson, as the lesson form asks for them (client/src/components/lesson/lesson-form.tsx). */
const LESSON_COMPONENTS = ["warm-up", "vocabulary", "reading", "comprehension", "sentences", "discussion", "quiz"];

/**
 * The lesson request a student's topic makes (server/student-lesson-making.ts):
 * their level from their profile, the lesson form's defaults, and idioms &
 * phrasal verbs when their level has them on by default.
 */
export function studentLessonRequest(student: { id: number; cefrLevel: string }, topic: string): LessonGenerateParams {
  const withExpressions = expressionsRulesFor(student.cefrLevel)?.onByDefault ?? false;
  return lessonGenerateSchema.parse({
    cefrLevel: student.cefrLevel,
    topic,
    studentId: student.id,
    components: [...LESSON_COMPONENTS, ...(withExpressions ? [EXPRESSIONS_COMPONENT] : [])],
    generateImages: true,
    useStudentHistory: true,
  });
}

/** The "What should we talk about next?" page: the student's waiting ideas and the lessons they made. */
export function buildStudentNextPage(input: {
  student: { name: string; cefrLevel: string };
  teacherName: string | null;
  canMakeLessons: boolean;
  ideas: Array<{ id: number; topic: string; createdAt: Date | string }>;
  assignments: AssignedLesson[];
  making: { id: string; topic: string } | null;
  lessonsToday: number;
}): StudentNextPage {
  return {
    student: { name: input.student.name, cefrLevel: input.student.cefrLevel },
    teacherName: input.teacherName,
    canMakeLessons: input.canMakeLessons,
    ideas: input.ideas.map((idea) => ({ id: idea.id, topic: idea.topic, sentAt: isoDate(idea.createdAt) })),
    madeLessons: input.assignments
      .filter((assignment) => assignment.madeByStudent && !isLessonDone(assignment.status))
      .sort((a, b) => time(b.assignedAt) - time(a.assignedAt))
      .map((assignment) => ({ id: assignment.lessonId, title: assignment.lesson.title, date: isoDate(assignment.assignedAt) })),
    making: input.making ? { jobId: input.making.id, topic: input.making.topic } : null,
    dailyLimitReached: input.lessonsToday >= STUDENT_LESSONS_PER_DAY,
  };
}

/** The student's whole word list, newest first, with each word's lesson and practice status. */
export function buildStudentWords(vocabulary: Vocabulary[], lessonTitles: Map<number, string>): StudentPageWord[] {
  return [...vocabulary]
    .sort((a, b) => time(b.learnedAt) - time(a.learnedAt))
    .map((word) => ({
      id: word.id,
      word: word.word,
      definition: word.definition || null,
      kind: wordKindOf(word.kind),
      lessonTitle: (word.lessonId !== null ? lessonTitles.get(word.lessonId) : undefined) ?? word.originLessonTitle ?? null,
      status: wordStatusOf(word),
    }));
}

/**
 * The words for one flashcard session: first the ones last marked "Not yet",
 * then new words (newest first), then words whose review day has come.
 */
export function pickFlashcards<T extends Vocabulary>(
  vocabulary: T[],
  now: Date = new Date(),
  limit: number = FLASHCARD_DECK_SIZE,
): { rows: T[]; due: number } {
  const due = vocabulary.filter((word) => isDue(word, now));
  const again = due.filter((word) => word.lastPractisedAt && word.practiceLevel === 0)
    .sort((a, b) => time(a.lastPractisedAt) - time(b.lastPractisedAt));
  const fresh = due.filter((word) => !word.lastPractisedAt)
    .sort((a, b) => time(b.learnedAt) - time(a.learnedAt));
  const reviews = due.filter((word) => word.lastPractisedAt && word.practiceLevel > 0)
    .sort((a, b) => time(a.nextPracticeAt) - time(b.nextPracticeAt));
  return { rows: [...again, ...fresh, ...reviews].slice(0, limit), due: due.length };
}

/** A word's details from its lesson's vocabulary or idioms & phrasal verbs section. */
export interface LessonWordDetails {
  term: string;
  example: string | null;
  partOfSpeech: string | null;
  /** The stored picture's address in the lesson, if it has one. */
  imageUrl: string | null;
}

/** One flashcard: the word from the student's list, filled in from its lesson where possible. */
export function toFlashcard(
  word: Vocabulary,
  details: LessonWordDetails | undefined,
  lessonTitle: string | null,
  imageUrlFor: (lessonId: number, key: string) => string,
): StudentFlashcard {
  const key = storedImageKey(details?.imageUrl);
  return {
    id: word.id,
    word: word.word,
    meaning: word.definition || null,
    kind: wordKindOf(word.kind),
    example: details?.example?.trim() || null,
    partOfSpeech: details?.partOfSpeech?.trim() || null,
    lessonTitle,
    imageUrl: key && word.lessonId !== null ? imageUrlFor(word.lessonId, key) : null,
  };
}
