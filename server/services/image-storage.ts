import { createHash } from "node:crypto";
import { Client } from "@replit/object-storage";

/**
 * Lesson images live in Replit App Storage instead of the database.
 * Lesson JSON keeps only a small serving URL (imageUrl); the Base64
 * payload (imageBase64) is reserved as a fallback when storage is
 * unavailable so a generated image is never silently lost.
 */

export const LESSON_IMAGE_PREFIX = "lesson-images/";
export const LESSON_IMAGE_ROUTE = "/api/images/";

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    client = new Client();
  }
  return client;
}

export function detectImageFormat(base64: string): {
  ext: "png" | "jpg";
  mime: "image/png" | "image/jpeg";
} {
  // Base64 magic prefixes: /9j/ = JPEG, iVBORw0KGgo = PNG, R0lGOD = GIF.
  if (base64.startsWith("/9j/")) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  return { ext: "png", mime: "image/png" };
}

export function lessonImageHash(base64: string): string {
  return createHash("sha256").update(base64).digest("hex").slice(0, 16);
}

export function lessonImageKey(base64: string, scope: string | number): string {
  const { ext } = detectImageFormat(base64);
  return `${LESSON_IMAGE_PREFIX}${scope}/${lessonImageHash(base64)}.${ext}`;
}

/**
 * Uploads a Base64-encoded image and returns its serving URL.
 * Deterministic keys make re-runs idempotent.
 */
export async function uploadLessonImage(
  base64: string,
  scope: string | number,
): Promise<string> {
  const key = lessonImageKey(base64, scope);
  const buffer = Buffer.from(base64, "base64");
  const result = await getClient().uploadFromBytes(key, buffer);
  if (!result.ok) {
    throw new Error(
      `App Storage upload failed for ${key}: ${result.error?.message || "unknown error"}`,
    );
  }
  return `${LESSON_IMAGE_ROUTE}${key}`;
}

/**
 * Returns a copy of lesson content with inline Base64 removed wherever an
 * App Storage URL exists — used for the durable DB write so rows stay small.
 * The original object (with Base64) stays in memory as a write-failure
 * fallback.
 */
export function stripBackedUpBase64<T>(node: T): T {
  if (Array.isArray(node)) {
    return node.map(stripBackedUpBase64) as unknown as T;
  }
  if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (key === "imageBase64" && record.imageUrl) continue;
      copy[key] = stripBackedUpBase64(value);
    }
    return copy as T;
  }
  return node;
}

export async function downloadStoredImage(
  key: string,
): Promise<{ buffer: Buffer; mime: string } | null> {
  const result = await getClient().downloadAsBytes(key);
  if (!result.ok) {
    return null;
  }
  const [buffer] = result.value;
  const mime = key.endsWith(".jpg") ? "image/jpeg" : "image/png";
  return { buffer, mime };
}
