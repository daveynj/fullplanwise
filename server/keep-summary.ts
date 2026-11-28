import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * What a teacher has built so far: their lessons, and for each student the
 * lessons made for them and the words on their list. Shown when the free
 * period ends ("Maria · B1 · 18 words · 3 lessons"), so the choice to
 * subscribe is about their own students, not a feature list.
 * Only the teacher's own students; totals and first names, nothing else.
 */
export interface KeepSummaryStudent {
  id: number;
  name: string;
  cefrLevel: string;
  lessons: number;
  words: number;
}

export interface KeepSummary {
  lessons: number;
  studentCount: number;
  /** The students with the most words (then lessons) first, at most `limit`. */
  students: KeepSummaryStudent[];
}

type StudentRow = { id: number | string; name: string; cefr_level: string; lessons: number | string | null; words: number | string | null };

export function shapeKeepSummary(lessonCount: number | string, rows: StudentRow[], limit = 4): KeepSummary {
  const students = rows
    .map((r) => ({
      id: Number(r.id),
      name: String(r.name ?? "").trim(),
      cefrLevel: String(r.cefr_level ?? ""),
      lessons: Number(r.lessons ?? 0),
      words: Number(r.words ?? 0),
    }))
    .filter((s) => s.name)
    .sort((a, b) => b.words - a.words || b.lessons - a.lessons || a.name.localeCompare(b.name));
  return { lessons: Number(lessonCount) || 0, studentCount: students.length, students: students.slice(0, limit) };
}

export async function getKeepSummary(teacherId: number): Promise<KeepSummary> {
  const [lessonResult, studentResult] = await Promise.all([
    db.execute(sql`SELECT count(*)::int AS n FROM lessons WHERE teacher_id = ${teacherId}`),
    db.execute(sql`
      SELECT s.id, s.name, s.cefr_level,
        (SELECT count(*)::int FROM lessons l WHERE l.student_id = s.id AND l.teacher_id = s.teacher_id) AS lessons,
        (SELECT count(*)::int FROM student_vocabulary v WHERE v.student_id = s.id) AS words
      FROM students s
      WHERE s.teacher_id = ${teacherId}
    `),
  ]);
  const lessonCount = (lessonResult.rows[0] as { n?: number } | undefined)?.n ?? 0;
  return shapeKeepSummary(lessonCount, studentResult.rows as StudentRow[]);
}
