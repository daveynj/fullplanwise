import { sql } from "drizzle-orm";
import { db } from "./db";
import { tryDecodeLessonContent } from "@shared/lesson-content";

/**
 * The teacher-only note on a student's lesson that shows the memory working:
 * how many words from the student's earlier lessons this one builds on (not
 * re-taught), and which of them came back in the reading. Worked out when the
 * teacher opens the lesson, never stored in the lesson, so a lesson published
 * later can't carry anything about the student.
 */

export interface StudentMemoryNote {
  studentName: string;
  /** Words the student had met before this lesson (earlier lessons and their word list). */
  earlierWords: number;
  /** Earlier words that appear in this lesson's reading, up to 8. */
  reusedInReading: string[];
}

function sectionsOf(content: unknown): any[] {
  const decoded = tryDecodeLessonContent(content) as { sections?: unknown } | null;
  return Array.isArray(decoded?.sections) ? (decoded!.sections as any[]) : [];
}

/** The lesson's own target words (pure). */
export function targetWordsOf(content: unknown): string[] {
  const vocab = sectionsOf(content).find((s) => s && s.type === "vocabulary");
  const words = Array.isArray(vocab?.words) ? vocab.words : [];
  return words
    .map((w: any) => (typeof w?.term === "string" ? w.term : typeof w?.word === "string" ? w.word : ""))
    .map((t: string) => t.trim())
    .filter(Boolean);
}

function readingTextOf(content: unknown): string {
  const reading = sectionsOf(content).find((s) => s && s.type === "reading");
  return Array.isArray(reading?.paragraphs) ? reading.paragraphs.filter((p: unknown) => typeof p === "string").join(" ") : "";
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Pure: which earlier words this lesson builds on. Earlier words that are
 * also this lesson's target words are left out (they are being taught again,
 * not reused).
 */
export function buildMemoryNote(content: unknown, earlierWords: string[], studentName: string): StudentMemoryNote {
  const targets = new Set(targetWordsOf(content).map((w) => w.toLowerCase()));
  const earlier = [...new Set(earlierWords.map((w) => w.trim()).filter(Boolean).map((w) => w.toLowerCase()))]
    .filter((w) => !targets.has(w));
  const reading = readingTextOf(content).toLowerCase();
  const reused = earlier.filter((w) => new RegExp(`(^|[^a-z])${escapeRegExp(w)}([^a-z]|$)`).test(reading)).slice(0, 8);
  return { studentName, earlierWords: earlier.length, reusedInReading: reused };
}

/** The note for a lesson the teacher owns, or null when it isn't a student's lesson. */
export async function studentMemoryNoteFor(lessonId: number, teacherId: number): Promise<StudentMemoryNote | null> {
  const lessonRows = await db.execute(sql`
    SELECT l.id, l.student_id, l.created_at, l.content, s.name AS student_name
    FROM lessons l JOIN students s ON s.id = l.student_id AND s.teacher_id = l.teacher_id
    WHERE l.id = ${lessonId} AND l.teacher_id = ${teacherId}
  `);
  const lesson = lessonRows.rows[0] as { student_id: number; created_at: Date; content: unknown; student_name: string } | undefined;
  if (!lesson) return null;

  const [wordList, earlierLessons] = await Promise.all([
    db.execute(sql`
      SELECT word FROM student_vocabulary
      WHERE student_id = ${lesson.student_id} AND learned_at < ${lesson.created_at}
    `),
    db.execute(sql`
      SELECT content FROM lessons
      WHERE student_id = ${lesson.student_id} AND teacher_id = ${teacherId} AND created_at < ${lesson.created_at}
      ORDER BY created_at DESC LIMIT 30
    `),
  ]);
  const earlier = [
    ...(wordList.rows as Array<{ word: string }>).map((r) => r.word),
    ...(earlierLessons.rows as Array<{ content: unknown }>).flatMap((r) => targetWordsOf(r.content)),
  ];
  return buildMemoryNote(lesson.content, earlier, lesson.student_name);
}
