import type { Express, Request, Response } from "express";
import type { Student } from "@shared/schema";
import {
  isLessonDone,
  isPracticeResult,
  type StudentFlashcardDeck,
  type StudentPageLesson,
} from "@shared/student-page";
import { storage } from "./storage";
import { validateGrammarSpotlightForStorage } from "../types/lessonContentTypes";
import { downloadStoredImage, LESSON_IMAGE_PREFIX, LESSON_IMAGE_ROUTE } from "./services/image-storage";
import { lessonHasImage, lessonWordDetails } from "./lesson-word-details";
import {
  buildStudentPageHome,
  buildStudentWords,
  pickFlashcards,
  storedImageKey,
  studentLessonContent,
  teacherFirstName,
  toFlashcard,
  withStudentImageUrls,
  type AssignedLesson,
} from "./student-page";

/**
 * The student's own page (/s/<code>, see shared/student-page.ts). Anyone with
 * the code can read it, so these routes only ever send what the student may
 * see: their lessons (without anything written for the teacher), their words
 * and their practice. Never the teacher's notes about them, their email, or
 * the lesson requests.
 */

/** Page codes are long random strings; anything else is not a page. */
const PAGE_TOKEN = /^[A-Za-z0-9_-]{20,64}$/;
const PAGE_GONE = "This page isn't available. Ask your teacher for a new link.";

function noStore(res: Response): void {
  res.set({ "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" });
}

/** The student whose page this is, or null after sending a 404. */
async function pageStudent(req: Request, res: Response): Promise<Student | null> {
  noStore(res);
  const token = String(req.params.token ?? "");
  const student = PAGE_TOKEN.test(token) ? await storage.getStudentByPageToken(token) : undefined;
  if (!student) {
    res.status(404).json({ message: PAGE_GONE });
    return null;
  }
  return student;
}

function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

/** A lesson the student page may show: the student's teacher's own, or a public library lesson. */
const visibleTo = (student: Student, lesson: { teacherId: number; isPublic: boolean } | null | undefined): boolean =>
  !!lesson && (lesson.teacherId === student.teacherId || lesson.isPublic);

/** The student's lessons the page shows, with their titles. */
async function assignedLessons(student: Student): Promise<AssignedLesson[]> {
  const rows = await storage.getStudentLessons(student.id);
  return rows
    .filter((row) => visibleTo(student, row.lesson))
    .map((row) => ({
      lessonId: row.lessonId,
      status: row.status,
      assignedAt: row.assignedAt,
      completedAt: row.completedAt ?? null,
      lesson: { title: row.lesson.title, cefrLevel: row.lesson.cefrLevel },
    }));
}

const lessonTitles = (lessons: AssignedLesson[]) => new Map(lessons.map((lesson) => [lesson.lessonId, lesson.lesson.title]));

const imageAddress = (token: string, lessonId: number, key: string) =>
  `/api/student-page/${token}/lessons/${lessonId}/images/${key}`;

export function registerStudentPageRoutes(app: Express): void {
  app.get("/api/student-page/:token", async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const [lessons, vocabulary, teacher] = await Promise.all([
        assignedLessons(student),
        storage.getStudentVocabulary(student.id),
        storage.getUser(student.teacherId),
      ]);
      res.json(buildStudentPageHome({
        student,
        teacherName: teacherFirstName(teacher?.fullName),
        assignments: lessons,
        vocabulary,
      }));
    } catch (error) {
      console.error("[Student page] Could not load a student page:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.get("/api/student-page/:token/words", async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const [lessons, vocabulary] = await Promise.all([assignedLessons(student), storage.getStudentVocabulary(student.id)]);
      res.json(buildStudentWords(vocabulary, lessonTitles(lessons)));
    } catch (error) {
      console.error("[Student page] Could not load a student's words:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.get("/api/student-page/:token/flashcards", async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const [lessons, vocabulary] = await Promise.all([assignedLessons(student), storage.getStudentVocabulary(student.id)]);
      const { rows, due } = pickFlashcards(vocabulary);
      const titles = lessonTitles(lessons);

      // Examples and pictures come from each word's lesson, read once per lesson.
      const lessonIds = Array.from(new Set(rows.map((row) => row.lessonId).filter((id): id is number => id !== null && titles.has(id))));
      const detailsByLesson = new Map(await Promise.all(lessonIds.map(async (id) => {
        const details = await lessonWordDetails(id);
        return [id, new Map(details.map((detail) => [detail.term.trim().toLowerCase(), detail]))] as const;
      })));

      const deck: StudentFlashcardDeck = {
        due,
        cards: rows.map((row) => toFlashcard(
          row,
          row.lessonId !== null ? detailsByLesson.get(row.lessonId)?.get(row.word.trim().toLowerCase()) : undefined,
          (row.lessonId !== null ? titles.get(row.lessonId) : undefined) ?? row.originLessonTitle ?? null,
          (lessonId, key) => imageAddress(req.params.token, lessonId, key),
        )),
      };
      res.json(deck);
    } catch (error) {
      console.error("[Student page] Could not load flashcards:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.post("/api/student-page/:token/flashcards/:wordId", async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const wordId = parseId(req.params.wordId);
      const result = req.body?.result;
      if (wordId === null || !isPracticeResult(result)) {
        return res.status(400).json({ message: "Send the result as \"got\" or \"again\"." });
      }
      const updated = await storage.recordStudentPractice(student.id, wordId, result);
      if (!updated) return res.status(404).json({ message: "That word isn't in this list." });
      res.json({ ok: true });
    } catch (error) {
      console.error("[Student page] Could not save a flashcard answer:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.get("/api/student-page/:token/lessons/:lessonId", async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const lessonId = parseId(req.params.lessonId);
      const assignment = lessonId === null ? undefined : await storage.checkLessonAssignment(student.id, lessonId);
      const lesson = assignment && lessonId !== null ? await storage.getLesson(lessonId) : undefined;
      if (!assignment || !lesson || !visibleTo(student, lesson)) {
        return res.status(404).json({ message: "This lesson isn't on your page." });
      }

      const done = isLessonDone(assignment.status);
      const visible = studentLessonContent(lesson.content, done);
      let grammarSpotlight: unknown = null;
      if (done && lesson.grammarSpotlight) {
        try {
          grammarSpotlight = validateGrammarSpotlightForStorage(JSON.parse(lesson.grammarSpotlight)) ?? null;
        } catch {
          grammarSpotlight = null;
        }
      }
      const body: StudentPageLesson = {
        id: lesson.id,
        title: lesson.title,
        cefrLevel: lesson.cefrLevel,
        status: done ? "done" : "planned",
        date: new Date((done ? assignment.completedAt : null) ?? assignment.assignedAt).toISOString(),
        content: withStudentImageUrls(visible.content, (key) => imageAddress(req.params.token, lesson.id, key)) as Record<string, unknown>,
        grammarSpotlight,
        lockedActivities: visible.lockedActivities,
      };
      res.json(body);
    } catch (error) {
      console.error("[Student page] Could not load a lesson:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  // Pictures of the student's lessons. Private lessons' pictures otherwise only
  // load for their owner (server/routes.ts), so they come through the page.
  app.get(`/api/student-page/:token/lessons/:lessonId/images/${LESSON_IMAGE_PREFIX}*`, async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const lessonId = parseId(req.params.lessonId);
      const key = `${LESSON_IMAGE_PREFIX}${(req.params as Record<string, string>)[0] ?? ""}`;
      const address = `${LESSON_IMAGE_ROUTE}${key}`;
      const notFound = () => res.status(404).json({ message: "Picture not found." });
      if (lessonId === null || storedImageKey(address) !== key) return notFound();

      const [assignment, lesson] = await Promise.all([
        storage.checkLessonAssignment(student.id, lessonId),
        storage.getLessonAccess(lessonId),
      ]);
      if (!assignment || !visibleTo(student, lesson)) return notFound();
      // Pictures are usually stored under their own lesson; copied lessons can
      // use another lesson's, so those are checked against the lesson itself.
      const storedUnderLesson = key.split("/")[1] === String(lessonId);
      if (!storedUnderLesson && !(await lessonHasImage(lessonId, address))) return notFound();

      const image = await downloadStoredImage(key);
      if (!image) return notFound();
      res.set({ "Content-Type": image.mime, "Cache-Control": "private, max-age=3600" });
      res.send(image.buffer);
    } catch (error) {
      console.error("[Student page] Could not load a lesson picture:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });
}
