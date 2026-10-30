import type { Express, Request, Response } from "express";
import type { Student, User } from "@shared/schema";
import {
  MAX_WAITING_IDEAS,
  MAX_WAITING_STUDENT_LESSONS,
  TOPIC_MAX_LENGTH,
  cleanTopic,
  isLessonDone,
  isPracticeResult,
  planLetsStudentsMakeLessons,
  type StudentFlashcardDeck,
  type StudentIdeaSummary,
  type StudentLessonJob,
  type StudentPageLesson,
} from "@shared/student-page";
import { storage } from "./storage";
import { STUDENT_JOB_ID, startStudentLesson } from "./student-lesson-making";
import { validateGrammarSpotlightForStorage } from "../types/lessonContentTypes";
import { downloadStoredImage, LESSON_IMAGE_PREFIX, LESSON_IMAGE_ROUTE } from "./services/image-storage";
import { lessonHasImage, lessonWordDetails } from "./lesson-word-details";
import {
  buildStudentNextPage,
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
 * and their practice, and their own ideas and the lessons they made. Never the
 * teacher's notes about them, their email, or the teacher's lesson requests.
 */

/** Page codes are long random strings; anything else is not a page. */
const PAGE_TOKEN = /^[A-Za-z0-9_-]{20,64}$/;
const PAGE_GONE = "This page isn't available. Ask your teacher for a new link.";
const SOMETHING_WRONG = "Something went wrong. Please try again.";
const TOPIC_PROBLEM = `Write your topic in a few words (up to ${TOPIC_MAX_LENGTH} characters).`;

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

/** Whether the student can make lessons, not just suggest topics: their teacher has Unlimited and allows it. */
const canMakeLessons = (student: Student, teacher: User | undefined): boolean =>
  student.canMakeLessons && planLetsStudentsMakeLessons(teacher);

const isoDate = (value: Date | string) => new Date(value).toISOString();

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
      madeByStudent: !!row.madeByStudent,
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
      const [lessons, vocabulary, teacher, making] = await Promise.all([
        assignedLessons(student),
        storage.getStudentVocabulary(student.id),
        storage.getUser(student.teacherId),
        storage.getStudentMakingJob(student.id),
      ]);
      res.json(buildStudentPageHome({
        student,
        teacherName: teacherFirstName(teacher?.fullName),
        assignments: lessons,
        vocabulary,
        canMakeLessons: canMakeLessons(student, teacher),
        making: making ? { topic: making.topic } : null,
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
        madeByYou: !!assignment.madeByStudent,
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

  // "What should we talk about next?": the student's waiting ideas, the
  // lessons they made, and whether they can make one.
  app.get("/api/student-page/:token/next", async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const [lessons, teacher, ideas, making, lessonsToday] = await Promise.all([
        assignedLessons(student),
        storage.getUser(student.teacherId),
        storage.getWaitingIdeas(student.id),
        storage.getStudentMakingJob(student.id),
        storage.countStudentLessonsToday(student.id),
      ]);
      res.json(buildStudentNextPage({
        student,
        teacherName: teacherFirstName(teacher?.fullName),
        canMakeLessons: canMakeLessons(student, teacher),
        ideas,
        assignments: lessons,
        making: making ?? null,
        lessonsToday,
      }));
    } catch (error) {
      console.error("[Student page] Could not load the next lesson page:", error);
      res.status(500).json({ message: SOMETHING_WRONG });
    }
  });

  // The student suggests a topic to their teacher.
  app.post("/api/student-page/:token/ideas", async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const topic = cleanTopic(req.body?.topic);
      if (!topic) return res.status(400).json({ message: TOPIC_PROBLEM });
      const idea = await storage.addStudentIdea(student, topic);
      if (!idea) {
        return res.status(409).json({ message: `You have ${MAX_WAITING_IDEAS} ideas waiting. Remove one to send another.` });
      }
      const body: StudentIdeaSummary = { id: idea.id, topic: idea.topic, sentAt: isoDate(idea.createdAt) };
      res.status(201).json(body);
    } catch (error) {
      console.error("[Student page] Could not save an idea:", error);
      res.status(500).json({ message: SOMETHING_WRONG });
    }
  });

  // The student takes back an idea their teacher hasn't used yet.
  app.delete("/api/student-page/:token/ideas/:ideaId", async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const ideaId = parseId(req.params.ideaId);
      if (ideaId === null || !(await storage.removeStudentIdea(student.id, ideaId))) {
        return res.status(404).json({ message: "That idea isn't waiting any more." });
      }
      res.json({ ok: true });
    } catch (error) {
      console.error("[Student page] Could not remove an idea:", error);
      res.status(500).json({ message: SOMETHING_WRONG });
    }
  });

  // The student makes a lesson from their topic (students of Unlimited teachers).
  app.post("/api/student-page/:token/lessons", async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const teacher = await storage.getUser(student.teacherId);
      if (!teacher || !canMakeLessons(student, teacher)) {
        return res.status(403).json({ message: "Send this topic to your teacher as an idea instead." });
      }
      const topic = cleanTopic(req.body?.topic);
      if (!topic) return res.status(400).json({ message: TOPIC_PROBLEM });

      const started = await startStudentLesson(student, teacher, topic);
      if (started.status === "started") return res.status(202).json({ jobId: started.jobId });
      if (started.status === "making") {
        return res.status(409).json({ jobId: started.jobId, message: "Your last lesson is still being made." });
      }
      if (started.status === "full") {
        return res.status(409).json({ message: `You have ${MAX_WAITING_STUDENT_LESSONS} lessons waiting. Remove one to make another.` });
      }
      res.status(429).json({ message: "You've made a lot of lessons today. Please try again tomorrow." });
    } catch (error) {
      console.error("[Student page] Could not start making a lesson:", error);
      res.status(500).json({ message: SOMETHING_WRONG });
    }
  });

  // How the lesson the student is making is getting on.
  app.get("/api/student-page/:token/making/:jobId", async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const jobId = String(req.params.jobId ?? "");
      const job = STUDENT_JOB_ID.test(jobId) ? await storage.getStudentLessonJob(jobId, student.id) : undefined;
      if (!job) return res.status(404).json({ message: "We couldn't find that lesson." });

      let body: StudentLessonJob;
      if (job.status === "complete" && job.lessonId !== null) {
        const made = (await assignedLessons(student)).find((lesson) => lesson.lessonId === job.lessonId);
        body = made
          ? { status: "complete", lesson: { id: made.lessonId, title: made.lesson.title, cefrLevel: made.lesson.cefrLevel } }
          : { status: "error", message: "This lesson isn't on your page any more." };
      } else if (job.status === "pending" && !job.abandoned) {
        body = { status: "pending", topic: job.topic };
      } else {
        body = { status: "error", message: "Sorry, we couldn't make your lesson. Please try again." };
      }
      res.json(body);
    } catch (error) {
      console.error("[Student page] Could not check a lesson being made:", error);
      res.status(500).json({ message: SOMETHING_WRONG });
    }
  });

  // The student removes a lesson they made and haven't done yet.
  app.delete("/api/student-page/:token/lessons/:lessonId", async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const lessonId = parseId(req.params.lessonId);
      const removed = lessonId === null ? null : await storage.removeStudentMadeLesson(student, lessonId);
      if (!removed) {
        return res.status(404).json({ message: "You can only remove lessons you made and haven't done yet." });
      }
      res.json({ ok: true });
    } catch (error) {
      console.error("[Student page] Could not remove a lesson:", error);
      res.status(500).json({ message: SOMETHING_WRONG });
    }
  });

  // The student stars the coming-up lesson they want to do next.
  app.put("/api/student-page/:token/next-lesson", async (req, res) => {
    try {
      const student = await pageStudent(req, res);
      if (!student) return;
      const lessonId = req.body?.lessonId;
      if (typeof lessonId !== "number" || !Number.isSafeInteger(lessonId)) {
        return res.status(400).json({ message: "Choose a lesson." });
      }
      if (!(await storage.setStudentNextLesson(student.id, lessonId))) {
        return res.status(404).json({ message: "That lesson isn't coming up on your page." });
      }
      res.json({ ok: true });
    } catch (error) {
      console.error("[Student page] Could not star a lesson:", error);
      res.status(500).json({ message: SOMETHING_WRONG });
    }
  });
}
