import { randomUUID } from "crypto";
import type { Student, User } from "@shared/schema";
import { storage, type StudentLessonReservation } from "./storage";
import { addLessonPictures, lessonModelFor, wordsToAvoid, writeLessonText } from "./lesson-generation";
import { studentLessonRequest } from "./student-page";

/**
 * Lessons students make on their own page (shared/student-page.ts). A lesson
 * is made like a teacher's, from the student's topic and the level in their
 * profile, and never with anything the teacher wrote about them. It goes into
 * the teacher's library, planned for the student and marked as theirs.
 */

/** Student lesson jobs are named sjob_<uuid>, so the page can check an id before looking it up. */
export const STUDENT_JOB_ID = /^sjob_[0-9a-f-]{36}$/;

let lessonAi: any = null;

async function getLessonAi(): Promise<any> {
  if (!lessonAi) {
    const { openRouterService } = await import("./services/openRouter");
    lessonAi = openRouterService;
  }
  return lessonAi;
}

async function makeStudentLesson(jobId: string, student: Student, teacher: User, topic: string): Promise<void> {
  const logPrefix = `[Job ${jobId}]`;
  try {
    console.log(`${logPrefix} Student ${student.id} is making a lesson, level: ${student.cefrLevel}`);
    const request = studentLessonRequest(student, topic);
    const avoidWords = await wordsToAvoid(student.id, logPrefix);
    const openRouter = await getLessonAi();
    const { content, grammarSpotlight } = await writeLessonText(openRouter, request, avoidWords, lessonModelFor(teacher), jobId);
    const lesson = await storage.completeStudentLessonJob(jobId, student, {
      teacherId: student.teacherId,
      studentId: student.id,
      title: content.title,
      topic,
      cefrLevel: student.cefrLevel,
      content,
      notes: "Auto-saved lesson",
      grammarSpotlight: grammarSpotlight ? JSON.stringify(grammarSpotlight) : null,
      category: request.category,
      tags: [],
    });
    console.log(`${logPrefix} Lesson ${lesson.id} saved for student ${student.id} — images generating in background`);
    addLessonPictures(openRouter, content, lesson.id, jobId);
  } catch (error: any) {
    console.error(`${logPrefix} Making a student's lesson failed:`, error?.message ?? error);
    try {
      await storage.failStudentLessonJob(jobId, error?.message ?? "Lesson generation failed");
    } catch (settleError) {
      // The job then counts as abandoned once it is old enough.
      console.error(`${logPrefix} Could not record the failure:`, settleError);
    }
  }
}

/**
 * Starts making a lesson from the student's topic if they may
 * (storage.reserveStudentLessonJob). The lesson is made in the background;
 * the student page follows it by its job id.
 */
export async function startStudentLesson(
  student: Student,
  teacher: User,
  topic: string,
): Promise<Exclude<StudentLessonReservation, { status: "reserved" }> | { status: "started"; jobId: string }> {
  const jobId = `sjob_${randomUUID()}`;
  const reservation = await storage.reserveStudentLessonJob(jobId, student, topic);
  if (reservation.status !== "reserved") return reservation;
  void makeStudentLesson(jobId, student, teacher, topic);
  return { status: "started", jobId };
}
