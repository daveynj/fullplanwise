import { randomBytes, timingSafeEqual } from "crypto";
import type { Express, RequestHandler } from "express";
import { z } from "zod";
import { publicTags, publicTagSearchSchema, publicTagEditPreviewSchema, reviewedTagEditSchema, reviewedTagBatchSchema, type TagBackfillPreview, type PublicTagEditPreview } from "@shared/public-lesson-tags";
import { publicTagFingerprint, publicTagEditFingerprint, suggestPublicTags, TagReviewConflict, type PublicTagSource } from "./public-lesson-tags";
import type { IStorage } from "./storage";

declare module "express-session" {
  interface SessionData {
    publicTagEditReview?: {
      token: string;
      expiresAt: number;
      id: number;
      fingerprint: string;
    };
    publicTagReview?: {
      token: string;
      expiresAt: number;
      candidates: Array<{ id: number; fingerprint: string }>;
    };
  }
}

const previewSchema = z.object({ afterId: z.number().int().nonnegative().optional() }).strict();
const BATCH_SIZE = 10;
const REVIEW_LIFETIME_MS = 30 * 60 * 1000;

// Explicit projection also keeps unexpected/private storage fields out of
// suggestion inputs, fingerprints and responses.
function publicSource(row: PublicTagSource): PublicTagSource {
  return { id: row.id, title: row.title, cefrLevel: row.cefrLevel, publicReading: row.publicReading };
}

export function registerPublicLessonTagRoutes(app: Express, storage: IStorage, ensureAuthenticated: RequestHandler) {
  const admin: RequestHandler = async (req, res, next) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user?.isAdmin) return void res.status(403).json({ message: "Admin privileges required." });
      res.set("Cache-Control", "no-store");
      next();
    } catch {
      res.status(500).json({ message: "Could not check admin access." });
    }
  };

  app.post("/api/admin/public-lesson-tags/find", ensureAuthenticated, admin, async (req, res) => {
    try {
      const { search, afterId } = publicTagSearchSchema.parse(req.body);
      const rows = await storage.findPublicTagLessons(search, afterId, BATCH_SIZE + 1);
      const lessons = rows.slice(0, BATCH_SIZE).map((row) => ({
        id: row.id, title: row.title, cefrLevel: row.cefrLevel, tags: publicTags(row.tags),
      }));
      res.json({ lessons, nextAfterId: rows.length > BATCH_SIZE ? lessons[lessons.length - 1].id : null });
    } catch (error) {
      if (error instanceof z.ZodError) return void res.status(400).json({ message: "Search by public title or lesson ID (up to 120 characters)." });
      console.error("Public tag search failed", error);
      res.status(500).json({ message: "Could not find public lessons." });
    }
  });

  app.post("/api/admin/public-lesson-tags/edit-preview", ensureAuthenticated, admin, async (req, res) => {
    try {
      const { id } = publicTagEditPreviewSchema.parse(req.body);
      const row = await storage.getPublicTagEditSource(id);
      if (!row) return void res.status(404).json({ message: "Public lesson not found. Search again." });
      const source = publicSource(row);
      const review = {
        token: randomBytes(24).toString("hex"), expiresAt: Date.now() + REVIEW_LIFETIME_MS,
        id, fingerprint: publicTagEditFingerprint({ ...source, tags: row.tags }),
      };
      req.session.publicTagEditReview = review;
      await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
      const tags = publicTags(row.tags);
      const result: PublicTagEditPreview = {
        id: source.id, title: source.title, cefrLevel: source.cefrLevel,
        publicExcerpt: source.publicReading.slice(0, 900),
        tags, hasOtherTags: (row.tags ?? []).some((tag) => !tags.includes(tag as typeof tags[number])),
        reviewToken: review.token, expiresAt: review.expiresAt,
      };
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) return void res.status(400).json({ message: "Choose a valid public lesson." });
      console.error("Public tag edit preview failed", error);
      res.status(500).json({ message: "Could not prepare this lesson for review. Nothing was saved." });
    }
  });

  app.post("/api/admin/public-lesson-tags/edit", ensureAuthenticated, admin, async (req, res) => {
    try {
      const { id, tags, reviewToken } = reviewedTagEditSchema.parse(req.body);
      const review = req.session.publicTagEditReview;
      if (!review || review.id !== id || review.expiresAt <= Date.now() ||
        reviewToken.length !== review.token.length ||
        !timingSafeEqual(Buffer.from(reviewToken), Buffer.from(review.token))) {
        return void res.status(409).json({ message: "This edit review expired or was replaced. Review the lesson again; nothing was saved." });
      }
      await storage.editReviewedPublicTags({ id, tags, fingerprint: review.fingerprint });
      delete req.session.publicTagEditReview;
      await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
      res.json({ id, tags, message: tags.length ? "Public tags updated." : "All public tags cleared." });
    } catch (error) {
      if (error instanceof z.ZodError) return void res.status(400).json({ message: "Explicitly approve 0–4 unique curated tags; choose no tags to clear them." });
      if (error instanceof TagReviewConflict) return void res.status(409).json({ message: error.message });
      console.error("Public tag edit failed", error);
      res.status(500).json({ message: "Could not confirm the save. Review the lesson again before retrying." });
    }
  });

  app.post("/api/admin/public-lesson-tags/preview", ensureAuthenticated, admin, async (req, res) => {
    try {
      const { afterId = 0 } = previewSchema.parse(req.body);
      const rows = await storage.getPublicTagCandidates(afterId, BATCH_SIZE + 1);
      const sources = rows.slice(0, BATCH_SIZE).map(publicSource);
      const review = {
        token: randomBytes(24).toString("hex"),
        expiresAt: Date.now() + REVIEW_LIFETIME_MS,
        candidates: sources.map((row) => ({ id: row.id, fingerprint: publicTagFingerprint(row) })),
      };
      req.session.publicTagReview = review;
      // Persist before returning: another app instance must see this preview.
      await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
      const result: TagBackfillPreview = {
        reviewToken: review.token,
        expiresAt: review.expiresAt,
        nextAfterId: rows.length > BATCH_SIZE ? sources[sources.length - 1].id : null,
        lessons: sources.map((row) => ({
          id: row.id, title: row.title, cefrLevel: row.cefrLevel,
          publicExcerpt: row.publicReading.slice(0, 900),
          ...suggestPublicTags(row),
        })),
      };
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) return void res.status(400).json({ message: "Invalid preview request." });
      console.error("Public tag preview failed", error);
      res.status(500).json({ message: "Could not prepare a tag preview. Nothing was saved." });
    }
  });

  app.post("/api/admin/public-lesson-tags/apply", ensureAuthenticated, admin, async (req, res) => {
    try {
      const { reviewToken, approvals } = reviewedTagBatchSchema.parse(req.body);
      const review = req.session.publicTagReview;
      if (!review || review.expiresAt <= Date.now() ||
        reviewToken.length !== review.token.length ||
        !timingSafeEqual(Buffer.from(reviewToken), Buffer.from(review.token))) {
        return void res.status(409).json({ message: "This preview expired or was replaced. Preview again; nothing was saved." });
      }
      const checked = approvals.map((approval) => {
        const candidate = review.candidates.find((c) => c.id === approval.id);
        if (!candidate) throw new TagReviewConflict("Only lessons in this preview can be approved. Nothing was saved.");
        return { id: approval.id, tags: approval.tags, fingerprint: candidate.fingerprint };
      });
      const updated = await storage.applyReviewedPublicTags(checked);
      delete req.session.publicTagReview;
      await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
      res.json({ updated });
    } catch (error) {
      if (error instanceof z.ZodError) return void res.status(400).json({ message: "Select 1–4 valid tags for each individually reviewed lesson." });
      if (error instanceof TagReviewConflict) return void res.status(409).json({ message: error.message });
      console.error("Public tag review failed", error);
      res.status(500).json({ message: "Could not save the reviewed tags. Refresh the preview before retrying." });
    }
  });
}
