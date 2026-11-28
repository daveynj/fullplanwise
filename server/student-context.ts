import { storage } from "./storage";

/**
 * What the teacher saved about a student (students.notes), for the lesson
 * prompt. Only the teacher's own student; never throws (a lesson is still
 * made without it).
 */
export async function studentContextFor(studentId: number | undefined, teacherId: number): Promise<string | undefined> {
  if (!studentId) return undefined;
  try {
    const student = await storage.getStudent(studentId);
    if (!student || student.teacherId !== teacherId) return undefined;
    const notes = (student.notes ?? "").trim();
    return notes ? notes.slice(0, 600) : undefined;
  } catch (error) {
    console.warn("[Lesson] Could not read the student's notes:", error);
    return undefined;
  }
}
