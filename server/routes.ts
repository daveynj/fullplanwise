import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertStudentSchema,
  insertLessonSchema,
  lessonGenerateSchema,
  subscriptionSchema,
  insertBlogPostSchema,
  updateBlogPostSchema
} from "@shared/schema";
import { mailchimpService } from "./services/mailchimp.service";
import { testOpenRouterConnection } from "./services/openRouter";
import { validateGrammarSpotlightForStorage } from "../types/lessonContentTypes";
import { addLessonPictures, lessonModelFor, wordsToAvoid, writeLessonText } from "./lesson-generation";
import { testImageGeneration } from "./services/image-generation.service";
import { toPublicLessonView } from "./public-lesson-view";
import { serveLessonShareImage } from "./lesson-share-image";
import { ensureStudentPageSchema } from "./student-page-schema";
import { registerStudentPageRoutes } from "./student-page-routes";
import { LESSON_STATUS_DONE, LESSON_STATUS_PLANNED, isLessonDone } from "@shared/student-page";
import { randomBytes } from "crypto";
import { downloadStoredImage, LESSON_IMAGE_PREFIX, LESSON_IMAGE_ROUTE } from "./services/image-storage";
import { isFreeTrialActive, getFreeTrialEndDate } from "./features";
import { SELECTABLE_MODELS, DEFAULT_MODEL_ID, isSelectableModel } from "@shared/aiModels";
import { getUncachableStripeClient } from "./stripeClient";
import { validClientRoutes } from "@shared/client-routes";
import { notifyIndexNow, submitToIndexNow, getIndexNowKey, lessonIndexNowPaths, blogIndexNowPaths } from "./indexnow";
import {
  reserveGenerationJob,
  spendCreditForJob,
  releaseJobReservation,
  completeJobWithLesson,
  settleJobError,
  getPersistedJob,
  startJobRecovery,
  pruneOldJobs,
} from "./lesson-jobs";
import Stripe from "stripe";
// Dynamic imports for AI services - loaded only when needed
// import { qwenService } from "./services/qwen";
// import { geminiService } from "./services/gemini";

import { db } from "./db";
import { sql } from "drizzle-orm";
// Dynamic import for PDF service - loaded only when needed
// import { pdfGeneratorService } from "./services/pdf-generator.service";
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';

// In-memory job store for async lesson generation
type LessonJobStatus = 'pending' | 'complete' | 'error';
interface LessonJob {
  status: LessonJobStatus;
  lesson?: any;
  error?: string;
  createdAt: number;
}
const lessonJobs = new Map<string, LessonJob>();

// Per-user rate limit on lesson generation: max N generations per rolling hour.
// Caps OpenRouter/Replicate spend even for subscribers/admin/trial users who
// bypass credit limits. Configurable via LESSON_GENERATION_HOURLY_LIMIT.
// Enforced (together with the one-pending-job-per-teacher guard) in Postgres
// by reserveGenerationJob, so it applies across every running server.
const GENERATION_RATE_LIMIT = Math.max(1, parseInt(process.env.LESSON_GENERATION_HOURLY_LIMIT || "20", 10) || 20);
const GENERATION_RATE_WINDOW_MS = 60 * 60 * 1000;

// Prune rate-limit rows older than the window every 15 minutes so the table
// stays small. Safe to skip on error — stale rows never affect the limit
// because every query filters on attempted_at.
setInterval(() => {
  db.execute(sql`DELETE FROM lesson_generation_attempts WHERE attempted_at < now() - interval '2 hours'`)
    .catch((err) => console.error("Failed to prune lesson_generation_attempts:", err));
  pruneOldJobs()
    .catch((err) => console.error("Failed to prune lesson_generation_jobs:", err));
  storage.pruneStudentLessonJobs()
    .catch((err) => console.error("Failed to prune student_lesson_jobs:", err));
}, 15 * 60 * 1000);

// Clean up jobs older than 30 minutes every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, job] of lessonJobs.entries()) {
    if (job.createdAt < cutoff) lessonJobs.delete(id);
  }
}, 10 * 60 * 1000);

// Parses a numeric route param strictly. Returns null when the raw value is
// not a plain non-negative integer (e.g. "abc", "12abc", "1e5", huge values),
// so routes can reject bad IDs before touching the database.
export function parseIdParam(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = parseInt(raw, 10);
  return Number.isSafeInteger(n) ? n : null;
}

// Parses a numeric query parameter safely. Returns the fallback when the raw
// value is missing or not a plain positive integer, and clamps the result to
// [min, max] so bad values (NaN, negatives, huge numbers) never reach the DB.
export function parseQueryInt(
  raw: unknown,
  fallback: number,
  min: number = 1,
  max: number = Number.MAX_SAFE_INTEGER
): number {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return fallback;
  const n = parseInt(raw, 10);
  if (!Number.isSafeInteger(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

const MAX_PAGE_SIZE = 100;

export async function registerRoutes(app: Express): Promise<Server> {
  // The student page's columns (server/student-page-schema.ts). Started now
  // without delaying start-up; API requests wait for it only while it runs,
  // because student queries select the new columns.
  void ensureStudentPageSchema();
  app.use("/api", async (_req, _res, next) => {
    await ensureStudentPageSchema();
    next();
  });

  // Students' own pages (/s/<code>) are private: keep them out of search
  // engines and don't send the code to other sites as a referrer.
  app.use("/s", (_req, res, next) => {
    res.set({ "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" });
    next();
  });

  // Link sharing is separate from publishing to the public lesson library.
  // Keep this idempotent migration here to support existing databases.
  // Not awaited: opening the first database connection takes 1–2 s, and the
  // column already exists in every live database, so start-up doesn't wait.
  // The column check first avoids taking a table lock on every start.
  void (async () => {
    const existing = await db.execute(sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'lessons' AND column_name = 'is_shared'
    `);
    if (existing.rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE lessons
        ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false
      `);
    }
  })().catch((err) => console.error("Failed to ensure lessons.is_shared column:", err));

  // IndexNow key verification file: https://planwiseesl.com/{INDEXNOW_KEY}.txt
  // Registered first so neither the SEO catch-all nor the SPA shell can shadow it.
  app.get("/:indexNowFile", (req, res, next) => {
    const key = getIndexNowKey();
    if (!key || req.params.indexNowFile !== `${key}.txt`) return next();
    res.type("text/plain; charset=utf-8").send(key);
  });
  // Dynamic AI service loader - using only Gemini for reliable lesson generation
  let openRouterService: any = null;

  const getOpenRouterService = async () => {
    if (!openRouterService) {
      console.log('Loading OpenRouter AI service...');
      const { openRouterService: service } = await import("./services/openRouter");
      openRouterService = service;
      console.log('OpenRouter AI service loaded successfully');
    }
    return openRouterService;
  };

  // Dynamic PDF service loader
  let pdfGeneratorService: any = null;
  const getPdfGeneratorService = async () => {
    if (!pdfGeneratorService) {
      console.log('Loading PDF generator service...');
      const { pdfGeneratorService: service } = await import("./services/pdf-generator.service");
      pdfGeneratorService = service;
      console.log('PDF generator service loaded successfully');
    }
    return pdfGeneratorService;
  };

  const getStripe = async () => {
    try {
      return await getUncachableStripeClient();
    } catch (error) {
      console.error('Failed to get Stripe client:', error);
      return null;
    }
  };

  // Settle abandoned lesson-generation jobs: a job still 'pending' in Postgres
  // long after any generation could be running had its server stop
  // mid-generation, so it is flipped to 'error' and its credit refunded.
  // Runs at boot and periodically (jobs only become abandoned over time).
  startJobRecovery();

  // Set up authentication routes
  setupAuth(app);

  // Authentication middleware
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Serve lesson images from App Storage. Lesson JSON only carries these
  // small URLs; the image bytes no longer live in the database.
  app.get("/api/lessons/:id/share-image", serveLessonShareImage);
  app.get(`${LESSON_IMAGE_ROUTE}${LESSON_IMAGE_PREFIX}*`, async (req, res) => {
    try {
      const key = `${LESSON_IMAGE_PREFIX}${(req.params as Record<string, string>)[0] || ""}`;
      if (key.includes("..")) {
        return res.status(400).json({ message: "Invalid image key" });
      }

      // Keys are lesson-images/<lessonId>/<hash>.<ext>. Mirror lesson access
      // control: public lessons serve to anyone; private lessons only to the
      // owner or an admin. Unknown scopes require authentication.
      const scope = key.slice(LESSON_IMAGE_PREFIX.length).split("/")[0] || "";
      const lessonId = /^\d+$/.test(scope) ? parseInt(scope, 10) : null;
      let isPublic = false;
      if (lessonId !== null) {
        const result = await db.execute(
          sql`SELECT teacher_id AS "teacherId", is_public AS "isPublic", is_shared AS "isShared" FROM lessons WHERE id = ${lessonId}`,
        );
        const lessonRow = (result as any).rows?.[0];
        if (!lessonRow) {
          return res.status(404).json({ message: "Image not found" });
        }
        isPublic = !!lessonRow.isPublic || !!lessonRow.isShared;
        const isOwnerOrAdmin = req.isAuthenticated() &&
          (lessonRow.teacherId === req.user!.id || !!req.user!.isAdmin);
        if (!isPublic && !isOwnerOrAdmin) {
          // 404 (not 403) to avoid confirming the image exists.
          return res.status(404).json({ message: "Image not found" });
        }
      } else if (!req.isAuthenticated()) {
        return res.status(404).json({ message: "Image not found" });
      }

      const image = await downloadStoredImage(key);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.set({
        "Content-Type": image.mime,
        // Public-lesson images are hash-addressed and safe for shared caches;
        // private images stay out of them.
        "Cache-Control": isPublic
          ? "public, max-age=31536000, immutable"
          : "private, max-age=3600",
      });
      res.send(image.buffer);
    } catch (error) {
      console.error("Error serving lesson image:", error);
      res.status(500).json({ message: "Failed to load image" });
    }
  });

  app.get("/api/debug/env-keys", (req, res) => {
    const keys = ['STRIPE_SECRET_KEY', 'VITE_STRIPE_PUBLIC_KEY', 'STRIPE_WEBHOOK_SECRET', 'PLANWISE_STRIPE_SECRET', 'PLANWISE_STRIPE_PUBLIC', 'NEON_DATABASE_URL', 'DATABASE_URL'];
    const result: Record<string, boolean | string> = {};
    for (const k of keys) {
      result[k] = !!process.env[k];
    }
    result['DATABASE_URL_value'] = process.env.DATABASE_URL?.substring(0, 10) || 'not set';
    res.json(result);
  });

  app.get("/api/features/free-trial", (req, res) => {
    const isActive = isFreeTrialActive();
    const endDate = getFreeTrialEndDate();

    res.json({
      isActive,
      endDate: isActive && endDate ? endDate.toISOString() : null,
    });
  });

  // User trial/credits status endpoint - returns personalized trial info
  app.get("/api/user/trial-status", ensureAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const now = new Date();
      const isSubscriber = user.subscriptionTier === 'unlimited';
      const isInPersonalTrial = user.trialExpiresAt && now < new Date(user.trialExpiresAt);
      const globalTrialActive = isFreeTrialActive();

      // Calculate days remaining in personal trial
      let trialDaysRemaining = 0;
      if (isInPersonalTrial && user.trialExpiresAt) {
        trialDaysRemaining = Math.ceil(
          (new Date(user.trialExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      res.json({
        isSubscriber,
        isInTrial: isInPersonalTrial || globalTrialActive,
        isPersonalTrial: isInPersonalTrial,
        isGlobalTrial: globalTrialActive,
        trialDaysRemaining,
        trialExpiresAt: user.trialExpiresAt,
        freeCreditsRemaining: user.freeCreditsRemaining ?? 0,
        canGenerateLessons: isSubscriber || globalTrialActive || !!isInPersonalTrial || (user.freeCreditsRemaining ?? 0) > 0
      });
    } catch (error: any) {
      console.error('Error fetching trial status:', error);
      res.status(500).json({ message: "Error fetching trial status" });
    }
  });

  // Student Routes
  // Per student: ideas waiting and lessons they made that aren't done, for the Students page.
  app.get("/api/student-requests", ensureAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getStudentRequestCounts(req.user!.id));
    } catch (error: any) {
      console.error("Error loading student requests:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // The teacher's lessons that a student made on their page, for the library.
  app.get("/api/student-made-lessons", ensureAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getStudentMadeLessons(req.user!.id));
    } catch (error: any) {
      console.error("Error loading student-made lessons:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students", ensureAuthenticated, async (req, res) => {
    try {
      const students = await storage.getStudents(req.user!.id);
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students/:id", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      if (studentId === null) {
        return res.status(404).json({ message: "Student not found" });
      }
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      if (student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to student" });
      }
      res.json(student);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/students", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse({
        ...req.body,
        teacherId: req.user!.id
      });
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/students/:id", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      if (studentId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const existingStudent = await storage.getStudent(studentId);

      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (existingStudent.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to student" });
      }

      // Only the profile fields: the page code and owner change through
      // their own routes, never through an edit.
      const updates = insertStudentSchema.omit({ teacherId: true }).partial().parse(req.body);
      const student = await storage.updateStudent(studentId, updates);
      res.json(student);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // The student's own page link (shared/student-page.ts). A new link gets a
  // fresh code, so any earlier link stops working.
  app.post("/api/students/:id/page", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      const student = studentId === null ? undefined : await storage.getStudent(studentId);
      if (!student || student.teacherId !== req.user!.id) {
        return res.status(404).json({ message: "Student not found" });
      }
      const updated = await storage.updateStudent(student.id, {
        pageToken: randomBytes(18).toString("base64url"),
        pageEnabled: true,
      });
      res.json(updated);
    } catch (error: any) {
      console.error("Error creating a student page link:", error);
      res.status(500).json({ message: "Could not create the link. Please try again." });
    }
  });

  // Switch the student's page on or off; the link stays the same.
  app.put("/api/students/:id/page", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      const student = studentId === null ? undefined : await storage.getStudent(studentId);
      if (!student || student.teacherId !== req.user!.id) {
        return res.status(404).json({ message: "Student not found" });
      }
      if (typeof req.body?.enabled !== "boolean") {
        return res.status(400).json({ message: "Send enabled as true or false." });
      }
      if (req.body.enabled && !student.pageToken) {
        return res.status(400).json({ message: "Create the link first." });
      }
      const updated = await storage.updateStudent(student.id, { pageEnabled: req.body.enabled });
      res.json(updated);
    } catch (error: any) {
      console.error("Error switching a student page:", error);
      res.status(500).json({ message: "Could not update the page. Please try again." });
    }
  });

  // Let the student make their own lessons on their page, or not (students of Unlimited teachers).
  app.put("/api/students/:id/page/lesson-making", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      const student = studentId === null ? undefined : await storage.getStudent(studentId);
      if (!student || student.teacherId !== req.user!.id) {
        return res.status(404).json({ message: "Student not found" });
      }
      if (typeof req.body?.allowed !== "boolean") {
        return res.status(400).json({ message: "Send allowed as true or false." });
      }
      const updated = await storage.updateStudent(student.id, { canMakeLessons: req.body.allowed });
      res.json(updated);
    } catch (error: any) {
      console.error("Error switching student lesson making:", error);
      res.status(500).json({ message: "Could not update the setting. Please try again." });
    }
  });

  // Topics the student suggested on their page that are waiting for the teacher.
  app.get("/api/students/:id/ideas", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      const student = studentId === null ? undefined : await storage.getStudent(studentId);
      if (!student || student.teacherId !== req.user!.id) {
        return res.status(404).json({ message: "Student not found" });
      }
      const ideas = await storage.getWaitingIdeas(student.id);
      res.json(ideas.map((idea) => ({ id: idea.id, topic: idea.topic, sentAt: new Date(idea.createdAt).toISOString() })));
    } catch (error: any) {
      console.error("Error loading student ideas:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Dismiss a student's idea ({ dismissed: true }), or bring it back ({ dismissed: false }).
  app.put("/api/students/:id/ideas/:ideaId", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      const ideaId = parseIdParam(req.params.ideaId);
      const student = studentId === null ? undefined : await storage.getStudent(studentId);
      if (!student || student.teacherId !== req.user!.id || ideaId === null) {
        return res.status(404).json({ message: "Idea not found" });
      }
      if (typeof req.body?.dismissed !== "boolean") {
        return res.status(400).json({ message: "Send dismissed as true or false." });
      }
      const idea = await storage.setStudentIdeaDismissed(req.user!.id, student.id, ideaId, req.body.dismissed);
      if (!idea) return res.status(404).json({ message: "Idea not found" });
      res.json({ id: idea.id, topic: idea.topic, sentAt: new Date(idea.createdAt).toISOString() });
    } catch (error: any) {
      console.error("Error updating a student idea:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // How the student has been practising, for the teacher's student page.
  app.get("/api/students/:id/practice", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      const student = studentId === null ? undefined : await storage.getStudent(studentId);
      if (!student || student.teacherId !== req.user!.id) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(await storage.getStudentPracticeStats(student.id));
    } catch (error: any) {
      console.error("Error loading practice stats:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/students/:id", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      if (studentId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const student = await storage.getStudent(studentId);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to student" });
      }

      await storage.deleteStudent(studentId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Student-Lesson Association Routes
  app.post("/api/students/:id/lessons", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      if (studentId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const { notes } = req.body;
      const lessonId = parseIdParam(String(req.body?.lessonId ?? ""));

      const student = await storage.getStudent(studentId);
      if (!student || student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Only the teacher's own lessons: the student's page shows assigned lessons.
      const lessonAccess = lessonId === null ? undefined : await storage.getLessonAccess(lessonId);
      if (lessonId === null || !lessonAccess || lessonAccess.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }

      // Check if this lesson is already assigned to this student
      const existingAssignment = await storage.checkLessonAssignment(studentId, lessonId);
      if (existingAssignment) {
        return res.status(409).json({ message: "This lesson is already assigned to this student" });
      }

      const studentLesson = await storage.assignLessonToStudent(
        studentId,
        lessonId,
        req.user!.id,
        notes
      );
      res.json(studentLesson);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students/:id/lessons", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      if (studentId === null) {
        return res.status(404).json({ message: "Not found" });
      }

      const student = await storage.getStudent(studentId);
      if (!student || student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const [lessons, ideaLessonIds] = await Promise.all([
        storage.getStudentLessons(studentId),
        storage.getIdeaLessonIds(studentId),
      ]);
      // Which lessons the student made or asked for, and the one they starred.
      const fromIdea = new Set(ideaLessonIds);
      res.json(lessons.map((row) => ({
        ...row,
        fromIdea: fromIdea.has(row.lessonId),
        isNext: row.lessonId === student.nextLessonId && !isLessonDone(row.status),
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete lesson assignment by assignment ID (prevents duplicate deletion)
  app.delete("/api/students/:studentId/lessons/assignment/:assignmentId", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.studentId);
      if (studentId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const assignmentId = parseIdParam(req.params.assignmentId);
      if (assignmentId === null) {
        return res.status(404).json({ message: "Not found" });
      }

      const student = await storage.getStudent(studentId);
      if (!student || student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.removeStudentLessonByAssignmentId(assignmentId, studentId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Legacy endpoint - kept for backward compatibility
  app.delete("/api/students/:studentId/lessons/:lessonId", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.studentId);
      if (studentId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const lessonId = parseIdParam(req.params.lessonId);
      if (lessonId === null) {
        return res.status(404).json({ message: "Not found" });
      }

      const student = await storage.getStudent(studentId);
      if (!student || student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.removeStudentLesson(studentId, lessonId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students/:id/vocabulary", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.id);
      if (studentId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const limit = req.query.limit !== undefined ? parseQueryInt(req.query.limit, 50, 1, 500) : undefined;

      const student = await storage.getStudent(studentId);
      if (!student || student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const vocabulary = await storage.getStudentVocabulary(studentId, limit);
      res.json(vocabulary);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // "We did this" (status "completed"): the lesson's words join the student's
  // list. Setting it back to "assigned" undoes that (shared/student-page.ts).
  app.put("/api/students/lessons/:id/status", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const assignment = id === null ? undefined : await storage.getStudentLessonAssignment(id);
      if (!assignment || assignment.teacherId !== req.user!.id) {
        return res.status(404).json({ message: "Lesson assignment not found" });
      }
      const { status } = req.body ?? {};
      if (status === LESSON_STATUS_DONE) {
        return res.json(await storage.markStudentLessonDone(assignment.id));
      }
      if (status === LESSON_STATUS_PLANNED) {
        return res.json({ assignment: await storage.markStudentLessonPlanned(assignment.id), wordsAdded: 0 });
      }
      res.status(400).json({ message: `Status must be "${LESSON_STATUS_DONE}" or "${LESSON_STATUS_PLANNED}".` });
    } catch (error: any) {
      console.error("Error updating a lesson's status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  registerStudentPageRoutes(app);

  // Lesson Routes
  app.get("/api/lessons", ensureAuthenticated, async (req, res) => {
    try {
      // Get pagination parameters from query string with defaults
      const page = parseQueryInt(req.query.page, 1);
      const pageSize = parseQueryInt(req.query.pageSize, 10, 1, MAX_PAGE_SIZE);

      // Get filter parameters from query string
      const search = req.query.search as string || '';
      const cefrLevel = req.query.cefrLevel as string || 'all';
      const dateFilter = req.query.dateFilter as string || '';
      const category = req.query.category as string || 'all';

      console.log(`API Request: GET /api/lessons for teacherId=${req.user!.id}, page=${page}, search=${search || 'none'}, cefrLevel=${cefrLevel}, dateFilter=${dateFilter || 'all'}, category=${category}`);

      // First check if user is authenticated properly
      if (!req.user?.id) {
        console.error("Missing user ID in authenticated request");
        return res.status(400).json({ error: "User ID not found in request" });
      }

      try {
        // Do a direct database check to ensure connectivity
        await db.execute("SELECT 1");
        console.log("Database connection verified");
      } catch (dbError: any) {
        console.error("Database connection error:", dbError);
        // Revert: Return generic error for database connection issues
        return res.status(500).json({ error: "Database connection failed", details: String(dbError) });
      }

      // For production environment, add an extra layer of protection
      if (process.env.NODE_ENV === 'production') {
        try {
          // Allow admin to view other users' lessons via teacherId parameter
          const rawTeacherId = req.query.teacherId;
          let teacherId = req.user!.id;
          if (rawTeacherId !== undefined) {
            const parsed = typeof rawTeacherId === 'string' ? parseIdParam(rawTeacherId) : null;
            if (parsed === null) {
              return res.status(400).json({ message: "Invalid teacherId parameter" });
            }
            teacherId = parsed;
          }

          // Only allow viewing other users' lessons if the requester is admin
          if (teacherId !== req.user!.id && !req.user!.isAdmin) {
            return res.status(403).json({ message: "Access denied" });
          }

          // Fetch paginated and filtered lessons
          const result = await storage.getLessons(
            teacherId,
            page,
            pageSize,
            search,
            cefrLevel,
            dateFilter,
            category
          );

          // --- DEBUGGING: Check result structure before sending ---
          console.log(`API Response: Retrieved ${result.lessons.length} lessons out of ${result.total} total.`);
          console.log('Result structure:', JSON.stringify({ total: result.total, lessonCount: result.lessons.length, firstLessonKeys: result.lessons.length > 0 ? Object.keys(result.lessons[0]) : [] }, null, 2));

          // Try sending only the total count first to see if that works
          // return res.json({ total: result.total, lessons: [] }); 

          // If the above works, try sending cleaned lessons
          try {
            // Explicitly select/clean data to avoid potential circular refs or unserializable types
            const cleanedLessons = result.lessons.map(lesson => ({
              id: lesson.id,
              teacherId: lesson.teacherId,
              studentId: lesson.studentId,
              title: lesson.title,
              topic: lesson.topic,
              cefrLevel: lesson.cefrLevel,
              // Omit content field permanently from list response to prevent crash
              // content: lesson.content, 
              notes: lesson.notes,
              createdAt: lesson.createdAt
            }));

            console.log('Attempting to send cleaned lessons...');
            return res.json({ total: result.total, lessons: cleanedLessons });

          } catch (serializationError: any) {
            console.error("Error during manual serialization:", serializationError);
            // --- DEBUGGING: Log potentially problematic content --- 
            if (result.lessons && result.lessons.length > 0) {
              console.error("Problematic lesson content (first lesson):", result.lessons[0].content);
            }
            // --- END DEBUGGING ---
            return res.status(500).json({ error: "Failed to serialize lesson data", message: serializationError.message });
          }
          // --- END DEBUGGING ---
        } catch (prodError: any) {
          console.error("Production error in /api/lessons:", prodError);

          // Revert: Return empty result set instead of 500 error
          console.log("Returning empty result set for production environment");
          return res.json({ // Change status back to default (200 OK with empty data)
            lessons: [],
            total: 0
          });
        }
      } else {
        // Allow admin to view other users' lessons via teacherId parameter
        const rawTeacherId = req.query.teacherId;
        let teacherId = req.user!.id;
        if (rawTeacherId !== undefined) {
          const parsed = typeof rawTeacherId === 'string' ? parseIdParam(rawTeacherId) : null;
          if (parsed === null) {
            return res.status(400).json({ message: "Invalid teacherId parameter" });
          }
          teacherId = parsed;
        }

        // Only allow viewing other users' lessons if the requester is admin
        if (teacherId !== req.user!.id && !req.user!.isAdmin) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Development environment - let errors bubble up normally
        const result = await storage.getLessons(
          teacherId,
          page,
          pageSize,
          search,
          cefrLevel,
          dateFilter,
          category
        );

        // --- DEBUGGING (Dev): Apply same logic as production for consistency ---
        console.log(`API Response (Dev): Retrieved ${result.lessons.length} lessons out of ${result.total} total.`);
        console.log('Result structure (Dev):', JSON.stringify({ total: result.total, lessonCount: result.lessons.length, firstLessonKeys: result.lessons.length > 0 ? Object.keys(result.lessons[0]) : [] }, null, 2));

        try {
          const cleanedLessons = result.lessons.map(lesson => ({
            id: lesson.id,
            teacherId: lesson.teacherId,
            studentId: lesson.studentId,
            title: lesson.title,
            topic: lesson.topic,
            cefrLevel: lesson.cefrLevel,
            // Omit content field permanently from list response (Dev)
            // content: lesson.content,
            notes: lesson.notes,
            createdAt: lesson.createdAt
          }));

          console.log('Attempting to send cleaned lessons (Dev)...');
          return res.json({ total: result.total, lessons: cleanedLessons });

        } catch (serializationError: any) {
          console.error("Error during manual serialization (Dev):", serializationError);
          // --- DEBUGGING (Dev): Log potentially problematic content ---
          if (result.lessons && result.lessons.length > 0) {
            console.error("Problematic lesson content (Dev, first lesson):", result.lessons[0].content);
          }
          // --- END DEBUGGING (Dev) ---
          // Let the default error handler catch this in dev
          throw serializationError;
        }
        // --- END DEBUGGING (Dev) ---
      }
    } catch (error: any) {
      console.error("Error in /api/lessons:", error);
      res.status(500).json({
        error: "Failed to fetch lessons",
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
      });
    }
  });

  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      console.log(`Fetching lesson ${lessonId} for public access`);

      const lesson = await storage.getLesson(lessonId);

      if (!lesson) {
        console.log(`Lesson ${lessonId} not found`);
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Published and link-shared lessons are visible to anyone. Unshared
      // lessons remain limited to their owner or an admin.
      const isOwnerOrAdmin = req.isAuthenticated() &&
        (lesson.teacherId === req.user!.id || !!req.user!.isAdmin);
      if (!lesson.isPublic && !lesson.isShared && !isOwnerOrAdmin) {
        console.log(`Unauthorized access attempt to private lesson ${lessonId}`);
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Parse and validate grammarSpotlight JSON if it exists. Legacy lessons
      // may contain malformed payloads stored before generation-time
      // validation was added; validate on read so they never render as
      // empty/broken grammar sections.
      let grammarSpotlight = null;
      if (lesson.grammarSpotlight) {
        try {
          const parsed = JSON.parse(lesson.grammarSpotlight);
          grammarSpotlight = validateGrammarSpotlightForStorage(parsed) ?? null;
          if (!grammarSpotlight) {
            console.warn(`Dropping invalid legacy grammarSpotlight for lesson ${lessonId}`);
          }
        } catch (parseError) {
          console.warn(`Failed to parse grammarSpotlight for lesson ${lessonId}:`, parseError);
        }
      }

      // Visitors never see the teacher's original request or private notes.
      const responseLesson = {
        ...(isOwnerOrAdmin ? lesson : toPublicLessonView(lesson)),
        grammarSpotlight
      };

      console.log(`Successfully fetched lesson ${lessonId}`);
      res.json(responseLesson);
    } catch (error: any) {
      console.error(`Error fetching lesson ${req.params.id}:`, error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lessons/student/:studentId", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseIdParam(req.params.studentId);
      if (studentId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const student = await storage.getStudent(studentId);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to student" });
      }

      const lessons = await storage.getLessonsByStudent(studentId);
      res.json(lessons);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Poll endpoint: check status of an async lesson generation job
  app.get("/api/lessons/job/:jobId", ensureAuthenticated, async (req, res) => {
    const job = lessonJobs.get(req.params.jobId);
    if (job) {
      if (job.status === 'pending') {
        return res.json({ status: 'pending' });
      }
      if (job.status === 'error') {
        lessonJobs.delete(req.params.jobId);
        return res.status(500).json({ status: 'error', error: job.error });
      }
      // Complete — return lesson and clean up
      const lesson = job.lesson;
      lessonJobs.delete(req.params.jobId);
      return res.json({ status: 'complete', lesson });
    }

    // In-memory miss — the server may have restarted since the job was
    // created. Fall back to the persisted record so the client gets a
    // definitive answer (completed lesson, or a refunded error) instead of a
    // bare 404 that leaves the credit outcome ambiguous.
    try {
      const persisted = await getPersistedJob(req.params.jobId);
      if (!persisted || persisted.teacherId !== req.user!.id) {
        return res.status(404).json({ message: "Job not found or expired" });
      }
      if (persisted.status === 'error') {
        return res.status(500).json({ status: 'error', error: persisted.error || 'Lesson generation failed' });
      }
      if (persisted.status === 'complete' && persisted.lessonId) {
        const lesson = await storage.getLesson(persisted.lessonId);
        if (lesson) {
          return res.json({ status: 'complete', lesson });
        }
        return res.status(500).json({ status: 'error', error: 'The lesson was created but could not be loaded. Please check your Lesson Library.' });
      }
      // Still pending but not in this server's memory: with several servers
      // running, another one may be generating it. Keep the client polling
      // until it is old enough to count as abandoned (recovery then settles
      // and refunds it).
      if (!persisted.abandoned) {
        return res.json({ status: 'pending' });
      }
      return res.status(500).json({ status: 'error', error: 'Generation was interrupted. Please try again.' });
    } catch (lookupError) {
      console.error(`Error looking up persisted job ${req.params.jobId}:`, lookupError);
      return res.status(404).json({ message: "Job not found or expired" });
    }
  });

  // Admin-only AI model preference. The curated allowlist lives in
  // shared/aiModels.ts; null/empty preference means the server default model.
  app.get("/api/user/preferred-model", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }
      res.json({
        // A stored preference for a removed model is reported as unset so
        // the admin UI shows the default instead of a stale ID.
        preferredModel: isSelectableModel(currentUser.preferredAiModel)
          ? currentUser.preferredAiModel
          : null,
        defaultModel: DEFAULT_MODEL_ID,
        models: SELECTABLE_MODELS,
      });
    } catch (error: any) {
      console.error('Error fetching preferred AI model:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/user/preferred-model", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      const bodySchema = z.object({
        model: z.string().nullable().optional(),
      });
      const { model } = bodySchema.parse(req.body ?? {});

      // Empty string / null / undefined all reset to the server default.
      const normalized = model && model.trim() !== "" ? model.trim() : null;
      if (normalized !== null && !isSelectableModel(normalized)) {
        return res.status(400).json({ message: "Unknown model. Choose one of the supported models." });
      }

      const updated = await storage.updateUserPreferredModel(currentUser.id, normalized);
      res.json({ preferredModel: updated.preferredAiModel ?? null });
    } catch (error: any) {
      console.error('Error updating preferred AI model:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lessons/generate", ensureAuthenticated, async (req, res) => {
    const teacherId = req.user!.id;

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Server-side idempotency + rate limit, enforced in Postgres so it holds
    // across every running server (autoscale may route a double-click to two
    // different instances). Under a per-teacher lock, reserveGenerationJob
    // returns the teacher's existing young pending job (no credit spent, no
    // attempt recorded — the client resumes polling it), refuses when over
    // the hourly cap, or persists this job as pending. Persisting BEFORE any
    // credit is spent is what makes a later spend recoverable after a crash.
    let reservation: Awaited<ReturnType<typeof reserveGenerationJob>>;
    try {
      reservation = await reserveGenerationJob(jobId, teacherId, GENERATION_RATE_LIMIT, GENERATION_RATE_WINDOW_MS);
    } catch (reserveError) {
      console.error(`[Job ${jobId}] Failed to reserve generation slot:`, reserveError);
      return res.status(503).json({
        message: "Could not start lesson generation right now. Please try again in a moment — your credits were not used."
      });
    }
    if (reservation.status === 'duplicate') {
      console.log(`User ${teacherId} submitted duplicate generation request — returning existing job ${reservation.jobId}`);
      return res.status(409).json({
        message: "A lesson is already being generated. Please wait for it to finish.",
        jobId: reservation.jobId
      });
    }
    if (reservation.status === 'rate_limited') {
      const retryMinutes = reservation.retryAfterMinutes;
      console.log(`User ${teacherId} hit the lesson generation rate limit (${GENERATION_RATE_LIMIT}/hour)`);
      return res.status(429).json({
        message: `You've reached the limit of ${GENERATION_RATE_LIMIT} lesson generations per hour. Please try again in about ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
        retryAfterMinutes: retryMinutes
      });
    }

    lessonJobs.set(jobId, { status: 'pending', createdAt: Date.now() });

    // Undo the reservation on every failure path before generation starts,
    // so the teacher is not blocked. If the delete itself fails, the row is
    // treated as abandoned after ABANDONED_JOB_AGE_MS and stops blocking.
    const releaseReservation = () => {
      lessonJobs.delete(jobId);
      releaseJobReservation(jobId).catch((releaseError) =>
        console.error(`[Job ${jobId}] Failed to release reservation:`, releaseError)
      );
    };

    try {
      const validatedData = lessonGenerateSchema.parse(req.body);

      // Check if user has enough credits (skip for admin users and during free trial)
      const user = await storage.getUser(teacherId);
      if (!user) {
        releaseReservation();
        return res.status(404).json({ message: "User not found" });
      }

      const freeTrialActive = isFreeTrialActive();

      const isSubscriber = user.subscriptionTier === 'unlimited';
      const isInPersonalTrial = user.trialExpiresAt && new Date() < new Date(user.trialExpiresAt);

      // Atomically spend one credit BEFORE generation starts. The conditional
      // SQL decrement only succeeds when the balance is above zero, so parallel
      // requests cannot overspend; it commits together with the job's
      // credit_spent flag, so recovery can always refund it. The credit is
      // refunded if generation fails.
      let creditSpent = false;

      // Anyone inside an active trial window generates unlimited lessons —
      // no credit is spent until the trial expires.
      if (!user.isAdmin && !isSubscriber && !freeTrialActive && !isInPersonalTrial) {
        creditSpent = await spendCreditForJob(jobId, user.id);
        if (creditSpent) {
          console.log(`User ${user.id} spent 1 credit`);
        } else {
          releaseReservation();
          return res.status(402).json({
            message: "You've used all your free lessons. Subscribe for unlimited access!",
            creditsRemaining: 0,
            trialExpired: true
          });
        }
      }

      // Respond immediately — generation happens in background
      console.log(`Created lesson generation job ${jobId} for user ${user.id}, topic: ${validatedData.topic}`);
      res.json({ jobId });

      // Run generation entirely in background
      (async () => {
        const startTime = Date.now();
        try {
          console.log(`[Job ${jobId}] Starting lesson generation, topic: ${validatedData.topic}, level: ${validatedData.cefrLevel}`);

          const studentVocabulary = validatedData.studentId && validatedData.useStudentHistory !== false
            ? await wordsToAvoid(validatedData.studentId, `[Job ${jobId}]`)
            : [];

          const generationModel = lessonModelFor(user);
          console.log(`[Job ${jobId}] Using text model: ${generationModel}`);

          const openRouter = await getOpenRouterService();
          const { content: generatedContent, grammarSpotlight: grammarVisualization } =
            await writeLessonText(openRouter, validatedData, studentVocabulary, generationModel, jobId);

          const textTimeTaken = (Date.now() - startTime) / 1000;
          console.log(`[Job ${jobId}] Lesson text ready in ${textTimeTaken.toFixed(1)}s — saving lesson now`);

          // Save to database immediately — before images
          const lessonToSave = {
            teacherId,
            studentId: validatedData.studentId || null,
            title: generatedContent.title,
            topic: validatedData.topic,
            cefrLevel: validatedData.cefrLevel,
            content: generatedContent,
            notes: "Auto-saved lesson",
            grammarSpotlight: grammarVisualization ? JSON.stringify(grammarVisualization) : null,
            category: validatedData.category || 'general',
            tags: validatedData.tags || []
          };

          // Save the lesson AND settle the job in one transaction — a crash
          // between these writes would otherwise let boot recovery refund a
          // credit for a lesson the user actually received.
          const savedLesson = await completeJobWithLesson(jobId, lessonToSave);
          console.log(`[Job ${jobId}] Lesson saved with permanent ID: ${savedLesson.id}`);

          if (validatedData.studentId) {
            try {
              await storage.assignLessonToStudent(validatedData.studentId, savedLesson.id, teacherId);
              console.log(`[Job ${jobId}] Student-lesson association created`);
            } catch (assocError) {
              console.error(`[Job ${jobId}] Error creating student-lesson association:`, assocError);
            }
            // Made from the student's idea: it leaves their waiting ideas.
            if (validatedData.ideaId) {
              try {
                await storage.markStudentIdeaMade(validatedData.ideaId, validatedData.studentId, teacherId, savedLesson.id);
              } catch (ideaError) {
                console.error(`[Job ${jobId}] Error recording the student's idea as made:`, ideaError);
              }
            }
          }

          const textOnlyTime = (Date.now() - startTime) / 1000;
          console.log(`[Job ${jobId}] Marking complete (text only) in ${textOnlyTime.toFixed(1)}s — images generating in background`);

          // Mark job as complete NOW so the user can open the lesson immediately
          lessonJobs.set(jobId, {
            status: 'complete',
            createdAt: Date.now(),
            lesson: {
              id: savedLesson.id,
              title: generatedContent.title,
              topic: validatedData.topic,
              cefrLevel: validatedData.cefrLevel,
              content: generatedContent,
              grammarSpotlight: grammarVisualization,
              generatedAt: new Date().toISOString(),
              generationTimeSeconds: textOnlyTime,
              studentId: validatedData.studentId || null,
              teacherId,
              notes: "Auto-saved lesson",
              category: validatedData.category || 'general',
              tags: validatedData.tags || [],
              isPublic: false,
              publicCategory: null,
              createdAt: new Date().toISOString(),
            }
          });

          // Generate images in the background — update DB when done
          addLessonPictures(openRouter, generatedContent, savedLesson.id, jobId);
        } catch (err: any) {
          console.error(`[Job ${jobId}] Generation failed:`, err.message);
          // Settle atomically: refund the credit spent upfront AND record the
          // error state in one transaction, claimed via refund_applied so the
          // refund can never be applied twice — even if boot recovery later
          // picks up this same job after a crash.
          try {
            const refunded = await settleJobError(jobId, teacherId, creditSpent, err.message);
            if (refunded) {
              console.log(`[Job ${jobId}] Refunded 1 credit to user ${teacherId}`);
            }
          } catch (settleError) {
            console.error(`[Job ${jobId}] Failed to settle job error (boot recovery will retry):`, settleError);
          }
          lessonJobs.set(jobId, {
            status: 'error',
            error: err.message || 'Lesson generation failed',
            createdAt: Date.now()
          });
        }
      })();
    } catch (error: any) {
      releaseReservation();
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lesson parameters", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lessons", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLessonSchema.parse({
        ...req.body,
        teacherId: req.user!.id
      });

      const lesson = await storage.createLesson(validatedData);
      res.status(201).json(lesson);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lesson data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Assign lesson to student (PUT /api/lessons/:id/assign)
  app.put("/api/lessons/:id/assign", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({ message: "Student ID is required" });
      }

      // Verify lesson exists and belongs to the teacher
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      if (lesson.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }

      // Verify student exists and belongs to the teacher
      const student = await storage.getStudent(studentId);
      if (!student || student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to student" });
      }

      // Plan the lesson for the student; its words join their list when the
      // teacher marks it done.
      console.log(`Assigning lesson ${lessonId} to student ${studentId}`);
      const studentLesson = await storage.assignLessonToStudent(
        studentId,
        lessonId,
        req.user!.id
      );
      console.log(`✅ Assignment successful:`, studentLesson);

      res.json(studentLesson);
    } catch (error: any) {
      console.error('Error assigning lesson:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update lesson category (PATCH /api/lessons/:id)
  app.patch("/api/lessons/:id", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const lesson = await storage.getLesson(lessonId);

      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      if (lesson.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }

      // Only allow updating category for now
      const { category } = req.body;
      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }

      const updatedLesson = await storage.updateLesson(lessonId, { category });
      res.json(updatedLesson);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Enable access through the lesson link without publishing it in the public
  // library. Repeated shares are intentionally idempotent.
  app.post("/api/lessons/:id/share", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      const lesson = await storage.getLesson(lessonId);
      const isOwnerOrAdmin = lesson &&
        (lesson.teacherId === req.user!.id || !!req.user!.isAdmin);
      if (!lesson || !isOwnerOrAdmin) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      if (!lesson.isShared) {
        await storage.updateLesson(lessonId, { isShared: true });
      }
      res.json({ shareUrl: `/lessons/${lessonId}` });
    } catch (error: any) {
      console.error("Error enabling lesson sharing:", error);
      res.status(500).json({ message: "Could not create share link" });
    }
  });

  app.delete("/api/lessons/:id", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const lesson = await storage.getLesson(lessonId);

      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      if (lesson.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }

      await storage.deleteLesson(lessonId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get deletion info for a lesson (check assignments before deleting)
  app.get("/api/lessons/:id/deletion-info", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const lesson = await storage.getLesson(lessonId);

      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      if (lesson.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }

      const deletionInfo = await storage.getLessonDeletionInfo(lessonId);
      res.json(deletionInfo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete lesson with vocabulary strategy choice
  app.post("/api/lessons/:id/delete-with-strategy", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const { strategy } = req.body;

      // Validate strategy
      if (!strategy || !['delete_all', 'keep_vocabulary'].includes(strategy)) {
        return res.status(400).json({ message: "Invalid strategy. Must be 'delete_all' or 'keep_vocabulary'" });
      }

      const lesson = await storage.getLesson(lessonId);

      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      if (lesson.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }

      await storage.deleteLessonWithStrategy(lessonId, strategy);

      // Return strategy in response so frontend can use it for toast message
      const message = strategy === 'keep_vocabulary'
        ? "Lesson deleted, vocabulary preserved in student profiles"
        : "Lesson and vocabulary deleted successfully";

      res.status(200).json({ message, strategy });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate vocabulary review PDF for a lesson
  app.get("/api/lessons/:id/pdf", async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      const lesson = await storage.getLesson(lessonId);

      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Published and link-shared lessons are downloadable by anyone.
      const isOwnerOrAdmin = req.isAuthenticated() &&
        (lesson.teacherId === req.user!.id || !!req.user!.isAdmin);
      if (!lesson.isPublic && !lesson.isShared && !isOwnerOrAdmin) {
        console.log(`Unauthorized PDF download attempt for private lesson ${lessonId}`);
        return res.status(404).json({ message: "Lesson not found" });
      }

      console.log(`PDF download requested for lesson ${lessonId}: "${lesson.title}"`);

      // Log whether user is authenticated for analytics
      if (req.isAuthenticated()) {
        console.log(`Authenticated user ${req.user!.username} downloading lesson ${lessonId}`);
      } else {
        console.log(`Public user downloading lesson ${lessonId}`);
      }

      // Parse the lesson content
      // The lessons.content column type decodes stored JSON into an object.
      const lessonContent = lesson.content;

      // Check if lesson has vocabulary section
      const vocabularySection = lessonContent.sections?.find((section: any) => section.type === 'vocabulary');
      if (!vocabularySection || !vocabularySection.words || vocabularySection.words.length === 0) {
        return res.status(400).json({ message: "No vocabulary found in this lesson" });
      }

      // Prepare lesson data for PDF generation
      const lessonData = {
        title: lesson.title,
        level: lesson.cefrLevel,
        sections: lessonContent.sections
      };

      console.log(`Generating vocabulary review PDF for lesson ${lessonId}: "${lesson.title}"`);

      // Check if HTML format was requested
      if (req.query.format === 'html') {
        // Generate HTML document
        const pdfService = await getPdfGeneratorService();
        const htmlContent = await pdfService.generateVocabularyReviewHTML(lessonData);

        // Set headers for HTML download
        const htmlFilename = `vocabulary-review-${lesson.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.html`;
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${htmlFilename}"`);

        // Send the HTML
        return res.send(htmlContent);
      }

      // Generate PDF (default)
      const pdfService = await getPdfGeneratorService();
      const pdfBuffer = await pdfService.generateVocabularyReviewPDF(lessonData);

      // Set headers for PDF download
      const filename = `vocabulary-review-${lesson.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send the PDF
      res.send(pdfBuffer);

      console.log(`Successfully generated PDF for lesson ${lessonId}, size: ${pdfBuffer.length} bytes`);
    } catch (error: any) {
      console.error(`Error generating PDF for lesson ${req.params.id}:`, error);
      res.status(500).json({
        message: "Failed to generate vocabulary review PDF",
        error: error.message
      });
    }
  });

  // Assign a lesson to a student
  app.put("/api/lessons/:id/assign", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) {
        return res.status(404).json({ message: "Not found" });
      }
      const { studentId } = z.object({ studentId: z.number().int() }).parse(req.body);

      // Check if lesson exists
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Check authorization - allow owner or admin
      if (lesson.teacherId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }

      // Check if student exists and belongs to this teacher
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to student" });
      }

      // Update the lesson with the studentId
      const updatedLesson = await storage.updateLesson(lessonId, { studentId });
      res.json(updatedLesson);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Unassign a lesson from a student
  app.put("/api/lessons/:id/unassign", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) {
        return res.status(404).json({ message: "Not found" });
      }

      // Check if lesson exists
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Check authorization (user must own the lesson or be admin)
      if (lesson.teacherId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }

      // Check if the lesson is actually assigned to a student
      if (!lesson.studentId) {
        // Not strictly an error, but good to inform the client
        return res.status(400).json({ message: "Lesson is not assigned to any student" });
      }

      // Update the lesson, setting studentId to null
      const updatedLesson = await storage.updateLesson(lessonId, { studentId: null });
      res.json(updatedLesson); // Return the updated lesson
    } catch (error: any) {
      console.error("Error unassigning lesson:", error);
      res.status(500).json({ message: "Failed to unassign lesson", error: error.message });
    }
  });

  // Subscription Routes
  // Endpoint to manually fetch and apply a Stripe subscription based on session ID
  app.post("/api/subscriptions/fetch-session", ensureAuthenticated, async (req, res) => {
    if (isFreeTrialActive()) {
      return res.status(403).json({ message: "Subscriptions are disabled during the free trial period." });
    }
    try {
      const stripe = await getStripe();
      if (!stripe) {
        return res.status(500).json({ message: "Stripe API key not configured" });
      }

      const sessionId = req.body.sessionId;
      const userId = req.user!.id;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      console.log(`Fetching session ${sessionId} for user ${userId}`);

      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Check if this is a subscription session
      if (session.mode !== 'subscription' || !session.subscription) {
        return res.status(400).json({ message: "Not a subscription session" });
      }

      const planId = session.metadata?.planId;
      const subscriptionId = session.subscription as string;

      // Update user with subscription info
      await storage.updateUserStripeInfo(userId, {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId
      });

      // Set the subscription tier
      const updatedUser = await storage.updateUser(userId, {
        subscriptionTier: 'unlimited',
        // New subscription: clear any pending cancellation state
        subscriptionCancelAtPeriodEnd: false,
        subscriptionCurrentPeriodEnd: null,
      });

      console.log(`Manual subscription activation: User ${userId} subscribed to unlimited plan.`);

      // Return the updated user info
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        message: "Subscription applied successfully",
        user: userWithoutPassword,
        plan: 'unlimited'
      });

    } catch (error: any) {
      console.error("Error fetching subscription session:", error);
      res.status(500).json({
        message: "Error processing subscription: " + error.message
      });
    }
  });

  app.post("/api/subscriptions/create", ensureAuthenticated, async (req, res) => {
    if (isFreeTrialActive()) {
      return res.status(403).json({ message: "Subscriptions are disabled during the free trial period." });
    }
    try {
      const stripe = await getStripe();
      if (!stripe) {
        console.error("Stripe API key not configured when attempting to create subscription");
        return res.status(500).json({ message: "Stripe API key not configured" });
      }

      const { planId, priceId } = subscriptionSchema.parse(req.body);
      const userId = req.user!.id;

      // Map generic price IDs to actual Stripe price IDs
      const stripeProductMap: Record<string, string> = {
        'price_unlimited_monthly': 'price_1Timp4Bnt8Mku7BYBMYUVYrF',
      };

      // Get the actual price ID from our map, or use the provided one if not found
      const actualPriceId = stripeProductMap[priceId] || priceId;

      console.log(`Creating subscription for user ${userId}, plan: ${planId}, mapped price: ${actualPriceId} (from ${priceId})`);

      // Get the user from the database
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`User not found for subscription creation: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;

      // If no customer ID or empty string, create a new customer
      if (!customerId || customerId === '') {
        // Create a new customer in Stripe
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName || user.username,
          metadata: {
            userId: userId.toString()
          }
        });

        customerId = customer.id;

        // Update the user in the database with the Stripe customer ID
        await storage.updateUserStripeInfo(userId, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: null
        });

        console.log(`Created new Stripe customer: ${customerId} for user ${userId}`);
      } else {
        // Verify the customer exists in Stripe
        try {
          await stripe.customers.retrieve(customerId);
          console.log(`Verified existing Stripe customer: ${customerId} for user ${userId}`);
        } catch (customerError: any) {
          // If the customer doesn't exist in Stripe anymore, create a new one
          if (customerError.code === 'resource_missing') {
            console.log(`Customer ${customerId} not found in Stripe, creating new one`);

            const customer = await stripe.customers.create({
              email: user.email,
              name: user.fullName || user.username,
              metadata: {
                userId: userId.toString()
              }
            });

            customerId = customer.id;

            // Update the user in the database with the new Stripe customer ID
            await storage.updateUserStripeInfo(userId, {
              stripeCustomerId: customerId,
              stripeSubscriptionId: null
            });

            console.log(`Created replacement Stripe customer: ${customerId} for user ${userId}`);
          } else {
            throw customerError;
          }
        }
      }

      console.log(`Creating checkout session for customer: ${customerId}, priceId: ${actualPriceId}`);

      // Start the subscription checkout session
      // Get the host from the request for dynamic URLs
      const host = req.headers.host || '';
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const baseUrl = `${protocol}://${host}`;

      console.log(`Using base URL for redirection: ${baseUrl}`);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: actualPriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
        cancel_url: `${baseUrl}/buy-credits`,
        metadata: {
          userId: userId.toString(),
          planId: planId
        },
        // Add subscription_data to ensure metadata is transferred to the subscription
        subscription_data: {
          metadata: {
            userId: userId.toString(),
            planId: planId
          }
        }
      });

      console.log(`Subscription checkout session created: ${session.id}`);
      console.log(`Session URL: ${session.url}`);

      res.json({
        sessionId: session.id,
        url: session.url
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      }

      console.error("Subscription creation error:", error);

      // Handle "no such customer" error specifically
      if (error.code === 'resource_missing' && error.param === 'customer') {
        // The customer ID in our database doesn't exist in Stripe anymore
        // Let's reset the user's customer ID and try again
        try {
          // Get user ID from the request
          const userId = req.user!.id;

          // Get the user record
          const userRecord = await storage.getUser(userId);

          if (userRecord) {
            console.log(`Customer ID ${userRecord.stripeCustomerId} doesn't exist in Stripe. Resetting and retrying...`);

            // Reset the user's customer ID
            await storage.updateUserStripeInfo(userId, {
              stripeCustomerId: '',  // Use empty string instead of null to avoid type errors
              stripeSubscriptionId: null
            });

            // Redirect the user to try again
            return res.status(409).json({
              message: "Your customer record needed to be reset. Please try subscribing again.",
              retryNeeded: true
            });
          }
        } catch (retryError) {
          console.error("Error resetting customer ID:", retryError);
        }
      }

      res.status(500).json({
        message: "Error creating subscription: " + error.message,
        details: error.type || error.code || "Unknown error"
      });
    }
  });
  app.post("/api/subscriptions/cancel", ensureAuthenticated, async (req, res) => {
    if (isFreeTrialActive()) {
      return res.status(403).json({ message: "Subscriptions are disabled during the free trial period." });
    }
    try {
      const stripe = await getStripe();
      if (!stripe) {
        return res.status(500).json({ message: "Stripe API key not configured" });
      }

      const userId = req.user!.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      // First retrieve the subscription to get current period end
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      // Newer Stripe API versions expose current_period_end on subscription
      // items; older versions have it on the subscription itself. Support both.
      const periodEnd: unknown =
        subscription.items?.data?.[0]?.current_period_end ??
        (subscription as any).current_period_end;

      if (typeof periodEnd !== "number" || !Number.isFinite(periodEnd)) {
        return res.status(500).json({
          message: "Could not determine the billing period end for this subscription. The subscription was not cancelled; please try again or contact support."
        });
      }

      // Cancel the subscription at the end of the current period
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Convert the Unix timestamp to a JavaScript Date
      const endDate = new Date(periodEnd * 1000);
      const formattedEndDate = endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Persist the pending cancellation on the user record so the settings
      // page can read it from the server (consistent across devices)
      await storage.updateUser(userId, {
        subscriptionCancelAtPeriodEnd: true,
        subscriptionCurrentPeriodEnd: endDate,
      });

      res.json({
        message: "Subscription scheduled for cancellation at the end of the current billing period",
        endDate: formattedEndDate,
        endTimestamp: periodEnd
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error cancelling subscription: " + error.message });
    }
  });

  // Admin analytics endpoint  
  app.get("/api/admin/analytics", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);

      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      const analytics = await storage.getAdminAnalytics();
      res.json(analytics);
    } catch (error: any) {
      console.error('Error fetching admin analytics:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin lessons browser endpoint
  app.get("/api/admin/lessons", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);

      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      const page = parseQueryInt(req.query.page, 1);
      const pageSize = parseQueryInt(req.query.pageSize, 20, 1, MAX_PAGE_SIZE);
      const search = req.query.search as string || '';
      const category = req.query.category as string || 'all';
      const cefrLevel = req.query.cefrLevel as string || 'all';

      const result = await storage.getAllLessonsForAdmin(page, pageSize, search, category, cefrLevel);
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching admin lessons:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin management route
  app.post("/api/admin/set-admin-status", ensureAuthenticated, async (req, res) => {
    try {
      // Only allow admins to access this endpoint
      const currentUser = await storage.getUser(req.user!.id);

      // Special case for "dave j" - we'll allow setting dave j as admin without admin privileges
      const { username, isAdmin } = z.object({
        username: z.string(),
        isAdmin: z.boolean()
      }).parse(req.body);

      // Find the user to update
      const userToUpdate = await storage.getUserByUsername(username);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }

      // Special case: Always allow setting "dave j" as admin
      if (username.toLowerCase() === "dave j" && isAdmin) {
        const updatedUser = await storage.updateUserAdminStatus(userToUpdate.id, true);
        console.log(`User "dave j" (${userToUpdate.id}) set as admin`);
        const { password, ...userWithoutPassword } = updatedUser;
        return res.json(userWithoutPassword);
      }

      // For any other operation, the current user must be an admin
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      // Update admin status
      const updatedUser = await storage.updateUserAdminStatus(userToUpdate.id, isAdmin);
      const { password, ...userWithoutPassword } = updatedUser;

      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid admin request", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Mailchimp configuration endpoint (admin only)
  app.post("/api/admin/config/mailchimp", ensureAuthenticated, async (req, res) => {
    try {
      // Only allow admins to access this endpoint
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      const { apiKey, serverPrefix, listId } = z.object({
        apiKey: z.string(),
        serverPrefix: z.string(),
        listId: z.string()
      }).parse(req.body);

      // Initialize the mailchimp service with the new credentials
      mailchimpService.initialize(apiKey, serverPrefix, listId);

      // Store these values in environment variables for persistence
      // Note: In a production app, these would be stored securely in a database or secret manager
      process.env.MAILCHIMP_API_KEY = apiKey;
      process.env.MAILCHIMP_SERVER_PREFIX = serverPrefix;
      process.env.MAILCHIMP_LIST_ID = listId;

      // Check if the configuration is working by attempting to fetch lists
      if (mailchimpService.isInitialized()) {
        res.json({
          message: "Mailchimp configuration updated successfully",
          success: true
        });
      } else {
        res.status(400).json({
          message: "Mailchimp configuration failed",
          success: false
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid Mailchimp configuration", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Public library endpoints
  app.get("/api/public-lessons", ensureAuthenticated, async (req, res) => {
    try {
      const page = parseQueryInt(req.query.page, 1);
      const pageSize = parseQueryInt(req.query.pageSize, 20, 1, MAX_PAGE_SIZE);
      const search = req.query.search as string || '';
      const cefrLevel = req.query.cefrLevel as string || 'all';
      const category = req.query.category as string || 'all';

      const result = await storage.getPublicLessons(page, pageSize, search, cefrLevel, category);
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching public lessons:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Public (no login) list of library lessons for the crawlable /esl-lessons pages.
  // Returns summaries only: no lesson content.
  app.get("/api/public-lesson-index", async (req, res) => {
    try {
      const level = typeof req.query.level === 'string' ? req.query.level.toUpperCase() : undefined;
      const validLevel = level && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level) ? level : undefined;
      const lessons = await storage.getPublicLessonSummaries(validLevel);
      res.set('Cache-Control', 'public, max-age=300');
      res.json({ lessons });
    } catch (error: any) {
      console.error('Error fetching public lesson index:', error);
      res.status(500).json({ message: 'Failed to load lessons' });
    }
  });

  app.post("/api/lessons/:id/copy", async (req, res) => {
    try {
      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Public access - return lesson data for anyone to use
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Access control: public lessons can be copied by anyone; private
      // lessons only by their owner or an admin. Return 404 to avoid ID enumeration.
      const isOwnerOrAdmin = req.isAuthenticated() &&
        (lesson.teacherId === req.user!.id || !!req.user!.isAdmin);
      if (!lesson.isPublic && !isOwnerOrAdmin) {
        console.log(`Unauthorized copy attempt for private lesson ${lessonId}`);
        return res.status(404).json({ message: "Lesson not found" });
      }

      console.log(`Copy request for lesson ${lessonId}: "${lesson.title}"`);

      // Return the full lesson data for public use
      res.json({
        success: true,
        lesson: {
          id: lesson.id,
          title: lesson.title,
          // Only the owner/admin get the original request; others get the title.
          topic: isOwnerOrAdmin ? lesson.topic : lesson.title,
          cefrLevel: lesson.cefrLevel,
          content: lesson.content,
          category: lesson.category,
          tags: lesson.tags
        },
        message: "Lesson copied successfully"
      });
    } catch (error: any) {
      console.error('Error copying lesson:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin endpoint to make lessons public  
  app.patch("/api/lessons/:id/public", ensureAuthenticated, async (req, res) => {
    try {
      console.log('Making lesson public - User ID:', req.user?.id);
      console.log('Request body:', req.body);

      const currentUser = await storage.getUser(req.user!.id);
      console.log('Current user:', { id: currentUser?.id, isAdmin: currentUser?.isAdmin });

      if (!currentUser?.isAdmin) {
        console.log('User is not admin');
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      const lessonId = parseIdParam(req.params.id);

      if (lessonId === null) {

        return res.status(404).json({ message: "Not found" });

      }
      const { publicCategory } = req.body;

      console.log('Making lesson public:', { lessonId, publicCategory });

      const updatedLesson = await storage.updateLesson(lessonId, {
        isPublic: true,
        publicCategory: publicCategory || 'general-english'
      });

      console.log('Lesson updated successfully:', updatedLesson.id);
      notifyIndexNow(lessonIndexNowPaths(updatedLesson));
      res.json(updatedLesson);
    } catch (error: any) {
      console.error('Error making lesson public:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: remove a lesson from the public library. The lesson stays in its
  // owner's account; it just stops being listed, indexed and publicly viewable
  // (a link-shared lesson keeps working by link).
  app.delete("/api/lessons/:id/public", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      const lessonId = parseIdParam(req.params.id);
      if (lessonId === null) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      const updatedLesson = await storage.updateLesson(lessonId, {
        isPublic: false,
        publicCategory: null,
      });

      console.log(`Admin ${currentUser.id} removed lesson ${lessonId} from the public library`);
      // Tell search engines to recrawl: the page now drops out of the index.
      notifyIndexNow(lessonIndexNowPaths(lesson));
      res.json(updatedLesson);
    } catch (error: any) {
      console.error('Error removing lesson from public library:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: resubmit every public page to Bing and other IndexNow search engines
  app.post("/api/admin/indexnow/resubmit", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      const publicLessons = await storage.getPublicLessonSummaries();
      const { posts } = await storage.getAllBlogPosts(1, 1000, undefined, undefined, true);
      const paths = [
        "/esl-lessons",
        ...["a1", "a2", "b1", "b2", "c1", "c2"].map((level) => `/esl-lessons/${level}`),
        ...publicLessons.map((l) => `/lessons/${l.id}`),
        "/blog",
        ...posts.filter((p) => p.isPublished).map((p) => `/blog/${p.slug}`),
      ];

      const result = await submitToIndexNow(paths);
      if (!result.ok) {
        console.warn(`[IndexNow] Admin resubmit failed: ${result.error}`);
        return res.status(502).json({ message: result.error });
      }
      res.json({ submitted: result.submitted, message: `Submitted ${result.submitted} URLs` });
    } catch (error: any) {
      console.error('Error resubmitting pages to IndexNow:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes - Users with Lesson Statistics
  app.get("/api/admin/users/lesson-stats", ensureAuthenticated, async (req, res) => {
    try {
      // Only allow admins to access this endpoint
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      // Parse query parameters
      const page = parseQueryInt(req.query.page, 1);
      const pageSize = parseQueryInt(req.query.pageSize, 10, 1, MAX_PAGE_SIZE);
      const search = req.query.search as string || undefined;
      const dateFilter = req.query.dateFilter as string || undefined;

      // Get users with lesson stats
      const result = await storage.getUsersWithLessonStats(page, pageSize, search, dateFilter);

      res.json(result);
    } catch (error: any) {
      console.error('Error fetching users with lesson stats:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Test OpenRouter connection endpoint (admin only)
  app.get("/api/test-openrouter", ensureAuthenticated, async (req, res) => {
    try {
      // Only allow admins to access this endpoint
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      console.log('Testing OpenRouter connection via API endpoint...');
      const success = await testOpenRouterConnection();

      if (success) {
        res.json({
          success: true,
          message: "OpenRouter connection test passed successfully!",
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          message: "OpenRouter connection test failed. Check your OPENROUTER_API_KEY configuration.",
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('Error testing OpenRouter connection:', error);
      res.status(500).json({
        success: false,
        message: "Error testing OpenRouter connection",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test OpenRouter image generation endpoint (admin only)
  app.get("/api/test-image-generation", ensureAuthenticated, async (req, res) => {
    try {
      // Only allow admins to access this endpoint
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      console.log('Testing OpenRouter image generation via API endpoint...');

      // Run the test function
      await testImageGeneration();

      res.json({
        success: true,
        message: "Image generation test completed. Check server logs for results.",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error testing image generation:', error);
      res.status(500).json({
        success: false,
        message: "Error testing image generation",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Blog post routes
  // Public route to get all blog posts (only published posts)
  app.get("/api/blog/posts", async (req, res) => {
    try {
      const page = parseQueryInt(req.query.page, 1);
      const pageSize = parseQueryInt(req.query.pageSize, 20, 1, MAX_PAGE_SIZE);
      const category = req.query.category as string | undefined;
      const featured = req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined;

      // For public blog index, only show published posts
      const result = await storage.getAllBlogPosts(page, pageSize, category, featured, true);
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Public route to get a single blog post by ID
  app.get("/api/blog/posts/:id", async (req, res) => {
    try {
      const postId = parseIdParam(req.params.id);
      if (postId === null) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      const post = await storage.getBlogPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error: any) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Public route to get a blog post by slug
  app.get("/api/blog/posts/slug/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error: any) {
      console.error('Error fetching blog post by slug:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin-only route to get all blog posts (includes drafts)
  app.get("/api/admin/blog/posts", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      const page = parseQueryInt(req.query.page, 1);
      const pageSize = parseQueryInt(req.query.pageSize, 100, 1, 200);

      // Admin gets ALL posts regardless of publication status
      const result = await storage.getAllBlogPosts(page, pageSize, undefined, undefined, undefined);
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching admin blog posts:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Configure multer for file uploads
  const uploadDir = path.join(process.cwd(), "attached_assets", "uploads");
  const storageConfig = multer.diskStorage({
    destination: async function (req, file, cb) {
      // Ensure directory exists
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (err: any) {
        console.error('Error creating upload directory:', err);
        cb(err, uploadDir);
      }
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storageConfig,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      // Allow images only
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Admin-only route for file uploads
  app.post("/api/admin/upload", ensureAuthenticated, upload.single('file'), async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin-only route to create a blog post
  app.post("/api/admin/blog/posts", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      const validatedData = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(validatedData);
      if (post.isPublished) notifyIndexNow(blogIndexNowPaths(post));
      res.status(201).json(post);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid blog post data", errors: error.errors });
      }
      console.error('Error creating blog post:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin-only route to update a blog post
  app.put("/api/admin/blog/posts/:id", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      const postId = parseIdParam(req.params.id);

      if (postId === null) {

        return res.status(404).json({ message: "Not found" });

      }
      const existingPost = await storage.getBlogPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      // Validate update data with dedicated update schema
      const updateData = updateBlogPostSchema.parse(req.body);

      // Check slug uniqueness if slug is being updated
      if (updateData.slug && updateData.slug !== existingPost.slug) {
        const slugExists = await storage.getBlogPostBySlug(updateData.slug);
        if (slugExists) {
          return res.status(400).json({ message: "A post with this slug already exists" });
        }
      }

      const updatedPost = await storage.updateBlogPost(postId, updateData);
      // Notify when a post goes live, or when a live post moves to a new URL.
      if (updatedPost.isPublished && (!existingPost.isPublished || updatedPost.slug !== existingPost.slug)) {
        notifyIndexNow(blogIndexNowPaths(updatedPost));
      }
      res.json(updatedPost);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid blog post data", errors: error.errors });
      }
      console.error('Error updating blog post:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin-only route to delete a blog post
  app.delete("/api/admin/blog/posts/:id", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      const postId = parseIdParam(req.params.id);

      if (postId === null) {

        return res.status(404).json({ message: "Not found" });

      }
      const existingPost = await storage.getBlogPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      await storage.deleteBlogPost(postId);
      res.json({ message: "Blog post deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Import endpoint for BlogPilotAI integration (uses shared secret, not session auth)
  app.post("/api/admin/blog/import", async (req, res) => {
    // Verify import secret (server-to-server auth)
    const importSecret = req.headers['x-import-secret'];
    const expectedSecret = process.env.PLANWISE_SECRET;

    if (!expectedSecret || importSecret !== expectedSecret) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const {
        title,
        slug,
        content,
        excerpt,
        author,
        publishDate,
        category,
        tags,
        readTime,
        featured,
        featuredImageBase64,
        featuredImageAlt,
        metaTitle,
        metaDescription,
        isPublished
      } = req.body;

      // Handle image: store base64 data URL directly in database (persists across restarts)
      let featuredImageUrl = null;
      if (featuredImageBase64 && featuredImageBase64.startsWith('data:image')) {
        // Store the base64 data URL directly - this persists in the database
        featuredImageUrl = featuredImageBase64;
      }

      // Check if slug already exists
      const existingPost = await storage.getBlogPostBySlug(slug);
      if (existingPost) {
        return res.status(400).json({ message: `A post with slug "${slug}" already exists` });
      }

      // Create blog post
      const newPost = await storage.createBlogPost({
        title,
        slug,
        content,
        excerpt,
        author: author || "David Jackson",
        publishDate: publishDate || new Date().toISOString().split('T')[0],
        category: category || "General",
        tags: tags || [],
        readTime,
        featured: featured || false,
        featuredImageUrl,
        featuredImageAlt,
        metaTitle,
        metaDescription,
        isPublished: isPublished || false,
      });

      console.log(`✅ Blog post imported from BlogPilotAI: ${newPost.slug}`);
      if (newPost.isPublished) notifyIndexNow(blogIndexNowPaths(newPost));
      res.json({
        success: true,
        id: newPost.id,
        slug: newPost.slug
      });
    } catch (error: any) {
      console.error("❌ Blog import error:", error);
      res.status(500).json({ message: "Import failed", error: error.message });
    }
  });

  // Admin-only route to migrate legacy blog posts (one-time migration)
  app.post("/api/admin/blog/migrate-legacy", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      // Helper function to convert markdown-like text to basic HTML
      const convertToHTML = (text: string): string => {
        return text
          .split('\n\n')
          .map(para => {
            // Handle bold markdown headings
            if (para.startsWith('**') && para.endsWith('**')) {
              const headingText = para.replace(/\*\*/g, '');
              return `<h2>${headingText}</h2>`;
            }
            // Handle list items
            if (para.startsWith('- ')) {
              const items = para.split('\n').filter(item => item.startsWith('- '));
              const listHTML = items.map(item => `<li>${item.substring(2)}</li>`).join('');
              return `<ul>${listHTML}</ul>`;
            }
            // Handle bold and italic inline
            let processed = para;
            processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
            return `<p>${processed}</p>`;
          })
          .join('');
      };

      const legacyPosts = req.body.posts;

      if (!Array.isArray(legacyPosts) || legacyPosts.length === 0) {
        return res.status(400).json({ message: "No posts provided for migration" });
      }

      const migratedPosts = [];

      for (const post of legacyPosts) {
        try {
          // Generate slug from title
          const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

          // Check if post with this slug already exists
          const existing = await storage.getBlogPostBySlug(slug);
          if (existing) {
            console.log(`Post with slug "${slug}" already exists, skipping...`);
            continue;
          }

          const newPost = await storage.createBlogPost({
            title: post.title,
            slug,
            content: convertToHTML(post.content || post.excerpt),
            excerpt: post.excerpt,
            author: post.author || "The Plan Wise ESL Team",
            publishDate: post.publishDate || post.date,
            category: post.category,
            tags: post.tags || [],
            readTime: post.readTime || post.readingTime,
            featured: post.featured || false,
            isPublished: true,
          });

          migratedPosts.push(newPost);
        } catch (error: any) {
          console.error(`Error migrating post "${post.title}":`, error);
        }
      }

      res.json({
        message: `Successfully migrated ${migratedPosts.length} blog posts`,
        migratedCount: migratedPosts.length,
        totalProvided: legacyPosts.length
      });
    } catch (error: any) {
      console.error('Error migrating blog posts:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Helper function to serve 404 HTML response
  // This returns proper HTTP 404 status for SEO while serving a user-friendly page
  const serve404Html = async (res: any, app: Express) => {
    const isProduction = app.get("env") !== "development";

    // In production, serve the built index.html with 404 status
    if (isProduction) {
      const builtPath = path.join(process.cwd(), 'dist', 'public', 'index.html');
      try {
        let html = await fs.readFile(builtPath, 'utf-8');
        // Inject a real 404 title, noindex meta, and description so crawlers
        // and link previews see an unambiguous "Page Not Found" document
        // instead of the generic homepage metadata from the SPA shell.
        html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>Page Not Found | PlanwiseESL</title>');
        html = html.replace(
          /<meta\s+name=["']description["'][^>]*>/i,
          '<meta name="description" content="The page you\'re looking for doesn\'t exist or has been removed." />'
        );
        if (/<meta\s+name=["']robots["']/i.test(html)) {
          html = html.replace(/<meta\s+name=["']robots["'][^>]*>/i, '<meta name="robots" content="noindex, follow" />');
        } else {
          html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n    <meta name="robots" content="noindex, follow" />`);
        }
        // Remove canonical/og/twitter tags that would point crawlers at homepage metadata
        html = html.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '');
        html = html.replace(/<meta\s+(?:property|name)=["'](?:og|twitter):[^"']*["'][^>]*>\s*/gi, '');
        res.status(404).type('html').send(html);
        return true;
      } catch {
        // Fall through to simple 404 page
      }
    }

    // In development or if built file doesn't exist, serve a simple 404 HTML page
    // This ensures Google sees proper 404 status and users see a friendly message
    const html404 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found | PlanwiseESL</title>
  <link rel="canonical" href="https://planwiseesl.com${res.req.originalUrl.split('?')[0]}" />
  <meta name="robots" content="noindex, follow" />
  <style>
    body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f9fafb; }
    .container { text-align: center; padding: 2rem; }
    h1 { color: #1f2937; margin-bottom: 1rem; }
    p { color: #6b7280; margin-bottom: 2rem; }
    a { display: inline-block; padding: 0.75rem 1.5rem; background: #2563eb; color: white; text-decoration: none; border-radius: 0.5rem; }
    a:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist or has been removed.</p>
    <a href="/">Go to Homepage</a>
  </div>
</body>
</html>`;
    res.status(404).type('html').send(html404);
    return true;
  };

  // Canonicalize trailing slashes on known client pages (e.g. /lessons/42/ ->
  // /lessons/42) with a 301, preserving the query string. Links pasted into
  // chat apps or typed by hand sometimes gain a trailing slash; without this
  // the catch-all below would serve a 404 for a page that exists. Runs before
  // the existence guards so the redirected URL is checked normally (missing
  // or private lessons still 404 after the redirect).
  app.get("*", (req, res, next) => {
    const pathname = req.path;
    if (pathname.length <= 1 || !pathname.endsWith("/")) return next();

    const stripped = pathname.replace(/\/+$/, "");
    if (!stripped || !validClientRoutes.some((re) => re.test(stripped))) {
      return next();
    }

    const queryIndex = req.originalUrl.indexOf("?");
    const query = queryIndex === -1 ? "" : req.originalUrl.slice(queryIndex);
    res.redirect(301, stripped + query);
  });

  // Server-side route to handle blog post 404s properly for SEO
  // This route checks if a blog post exists and returns 404 status for missing posts
  app.get("/blog/:slug", async (req, res, next) => {
    const { slug } = req.params;

    try {
      // Check if blog post exists and is published
      const post = await storage.getBlogPostBySlug(slug);

      if (!post || !post.isPublished) {
        // Return 404 status with HTML - search engines will see the proper 404 status code
        console.log(`[SEO] Blog post not found: ${slug} - returning 404`);
        await serve404Html(res, app);
        return;
      }

      // Post exists - continue to Vite middleware to serve normally. Pass the
      // post along so the prerenderer doesn't query it again.
      res.locals.blogPost = post;
      next();
    } catch (error) {
      console.error(`Error checking blog post ${slug}:`, error);
      next();
    }
  });

  // Server-side route to handle lesson 404s properly for SEO
  app.get("/lessons/:id", async (req, res, next) => {
    const { id } = req.params;

    // Non-numeric ids (e.g. /lessons/abc, /lessons/12abc) can never match a lesson.
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) {
      console.log(`[SEO] Invalid lesson id: ${id} - returning 404`);
      await serve404Html(res, app);
      return;
    }

    try {
      // Check if lesson exists and can be opened without authentication.
      const lesson = await storage.getLesson(Number(id));

      if (!lesson || (!lesson.isPublic && !lesson.isShared)) {
        console.log(`[SEO] Lesson not found or not shared: ${id} - returning 404`);
        await serve404Html(res, app);
        return;
      }

      // Pass the lesson along so the prerenderer doesn't query it again.
      res.locals.lesson = lesson;
      next();
    } catch (error) {
      // Don't serve the SPA shell with 200 (crawlers would index an empty
      // page), and don't 404 a lesson that may exist. 503 tells crawlers to
      // retry later.
      console.error(`Error checking lesson ${id}:`, error);
      res
        .status(503)
        .set({ "Retry-After": "120", "Content-Type": "text/html" })
        .end('<!DOCTYPE html><html><head><meta name="robots" content="noindex" /><title>Temporarily unavailable | PlanwiseESL</title></head><body><p>This lesson is temporarily unavailable. Please try again in a moment.</p></body></html>');
    }
  });

  // Unknown CEFR levels under /esl-lessons are real 404s (a valid level with no lessons still renders)
  app.get("/esl-lessons/:level", async (req, res, next) => {
    if (!["a1", "a2", "b1", "b2", "c1", "c2"].includes(req.params.level.toLowerCase())) {
      await serve404Html(res, app);
      return;
    }
    next();
  });

  app.get("/llms.txt", (req, res) => {
    const filePath = path.join(process.cwd(), "public", "llms.txt");
    res.header("Content-Type", "text/plain; charset=utf-8");
    res.sendFile(filePath);
  });

  // Dynamic sitemap.xml generation for SEO
  app.get("/sitemap.xml", async (req, res) => {
    try {
      // Only published blog posts and lessons marked public appear in the sitemap
      const { posts } = await storage.getAllBlogPosts(1, 1000, undefined, undefined, true);
      const publicLessons = await storage.getPublicLessonSummaries();

      const baseUrl = 'https://planwiseesl.com';
      const toDate = (value: Date | string | null | undefined): string | undefined => {
        if (!value) return undefined;
        const d = new Date(value);
        return isNaN(d.getTime()) ? undefined : d.toISOString().split('T')[0];
      };
      const latest = (dates: Array<string | undefined>): string | undefined =>
        dates.filter((d): d is string => !!d).sort().pop();

      // lastmod is the real last-change date, or omitted when unknown: search
      // engines stop trusting a lastmod that is always "today".
      const entries: Array<{ url: string; lastmod?: string }> = [];

      const blogDates = posts.map((p) => toDate(p.updatedAt) || toDate(p.publishDate));
      const lessonDates = publicLessons.map((l) => toDate(l.createdAt));

      entries.push({ url: '/' });
      entries.push({ url: '/blog', lastmod: latest(blogDates) });

      if (publicLessons.length > 0) {
        entries.push({ url: '/esl-lessons', lastmod: latest(lessonDates) });
        for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
          const inLevel = publicLessons.filter((l) => l.cefrLevel === level);
          if (inLevel.length > 0) {
            entries.push({
              url: `/esl-lessons/${level.toLowerCase()}`,
              lastmod: latest(inLevel.map((l) => toDate(l.createdAt))),
            });
          }
        }
      }

      for (const post of posts) {
        entries.push({
          url: `/blog/${post.slug}`,
          lastmod: toDate(post.updatedAt) || toDate(post.publishDate),
        });
      }

      for (const lesson of publicLessons) {
        entries.push({ url: `/lessons/${lesson.id}`, lastmod: toDate(lesson.createdAt) });
      }

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      for (const entry of entries) {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${entry.url}</loc>\n`;
        if (entry.lastmod) xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
        xml += '  </url>\n';
      }
      xml += '</urlset>';

      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (error: any) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });


  // Catch-all 404 for unknown page routes (SEO).
  // Any GET that doesn't match a known client route, an API route, or a
  // static asset returns a real HTTP 404 instead of the SPA shell with 200,
  // so crawlers don't index broken URLs as duplicate homepages.
  // The list of valid client routes lives in shared/client-routes.ts (a
  // single source of truth); a test verifies it stays in sync with the
  // client router in client/src/App.tsx.

  app.get("*", async (req, res, next) => {
    const pathname = req.path;

    // Let API routes, uploads, and anything with a file extension (assets,
    // Vite module requests, source maps, favicons, etc.) pass through.
    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/uploads/") ||
      pathname.startsWith("/@") || // Vite internals (/@vite, /@fs, /@react-refresh)
      pathname.startsWith("/src/") || // Vite dev source modules
      pathname.startsWith("/node_modules/") ||
      /\.[a-zA-Z0-9]+$/.test(pathname)
    ) {
      return next();
    }

    // Known client routes get the SPA shell as usual.
    if (validClientRoutes.some((re) => re.test(pathname))) {
      return next();
    }

    console.log(`[SEO] Unknown route: ${pathname} - returning 404`);
    await serve404Html(res, app);
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}