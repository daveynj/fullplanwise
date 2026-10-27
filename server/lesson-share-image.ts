import type { Request, Response } from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { tryDecodeLessonContent } from "@shared/lesson-content";
import { storage } from "./storage";
import { downloadStoredImage } from "./services/image-storage";

function* imageCandidates(node: unknown): Generator<Record<string, unknown>> {
  if (!node || typeof node !== "object") return;
  const record = node as Record<string, unknown>;
  if (record.imageUrl || record.imageBase64) yield record;
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") yield* imageCandidates(value);
  }
}

/** Serve only images belonging to a publicly viewable lesson, never arbitrary URLs. */
export async function serveLessonShareImage(req: Request, res: Response) {
  const rawId = req.params.id;
  if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(Number(rawId))) {
    return res.status(404).end();
  }
  try {
    const lesson = await storage.getLesson(Number(rawId));
    if (!lesson || (!lesson.isPublic && !lesson.isShared)) return res.status(404).end();

    for (const candidate of imageCandidates(tryDecodeLessonContent(lesson.content)?.sections)) {
      const url = typeof candidate.imageUrl === "string" ? candidate.imageUrl : "";
      const key = url.match(/^\/api\/images\/(lesson-images\/[a-zA-Z0-9/_-]+\.(?:png|jpg))$/)?.[1];
      if (key) {
        try {
          const stored = await downloadStoredImage(key);
          if (stored) {
            return res.set({ "Content-Type": stored.mime, "Cache-Control": "public, max-age=3600" }).send(stored.buffer);
          }
          console.warn(`[Share preview] Image unavailable for lesson ${rawId}`);
        } catch (error) {
          console.warn(`[Share preview] Could not load image for lesson ${rawId}:`, error);
        }
      }
      const inline = typeof candidate.imageBase64 === "string"
        ? candidate.imageBase64.replace(/^data:image\/(?:png|jpeg);base64,/, "") : "";
      if (inline.startsWith("iVBORw0KGgo") || inline.startsWith("/9j/")) {
        return res.set({
          "Content-Type": inline.startsWith("/9j/") ? "image/jpeg" : "image/png",
          "Cache-Control": "public, max-age=3600",
        }).send(Buffer.from(inline, "base64"));
      }
    }

    const fallback = await readFile(path.resolve("public/images/lesson-share-card.png"));
    return res.set({ "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" }).send(fallback);
  } catch (error) {
    console.error(`[Share preview] Failed to serve lesson ${rawId} image:`, error);
    return res.status(503).set("Retry-After", "120").end();
  }
}
