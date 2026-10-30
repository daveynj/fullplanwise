import { sql } from "drizzle-orm";
import { db } from "./db";
import type { LessonWordDetails } from "./student-page";

/**
 * Small reads from a lesson's content, done inside the database so the
 * student page never downloads a whole lesson to get a few fields (older
 * lessons hold their pictures inline and can be 15 MB or more). Results are
 * kept for a few minutes per lesson.
 */

/** The lesson's content as jsonb, unwrapping legacy double-encoded rows (shared/lesson-content.ts). */
const LESSON_BODY = sql`CASE WHEN left(content, 1) = '"' THEN (content::jsonb #>> '{}')::jsonb ELSE content::jsonb END`;

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_LESSONS = 200;

class LessonCache<T> {
  private entries = new Map<number, { value: T; expires: number }>();

  get(lessonId: number): T | undefined {
    const entry = this.entries.get(lessonId);
    if (!entry) return undefined;
    if (entry.expires < Date.now()) {
      this.entries.delete(lessonId);
      return undefined;
    }
    return entry.value;
  }

  set(lessonId: number, value: T): void {
    this.entries.delete(lessonId);
    if (this.entries.size >= CACHE_MAX_LESSONS) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(lessonId, { value, expires: Date.now() + CACHE_TTL_MS });
  }
}

const wordDetailsCache = new LessonCache<LessonWordDetails[]>();
const imageUrlCache = new LessonCache<Set<string>>();

/**
 * The words a lesson teaches, from its vocabulary section and its idioms &
 * phrasal verbs section, with each one's example, part of speech and stored
 * picture address. Empty when the lesson can't be read.
 */
export async function lessonWordDetails(lessonId: number): Promise<LessonWordDetails[]> {
  const cached = wordDetailsCache.get(lessonId);
  if (cached) return cached;
  try {
    const result = await db.execute(sql`
      WITH lesson AS (SELECT ${LESSON_BODY} AS body FROM lessons WHERE id = ${lessonId}),
      section AS (
        SELECT s FROM lesson CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(lesson.body -> 'sections') = 'array' THEN lesson.body -> 'sections' ELSE '[]'::jsonb END) s
      )
      SELECT coalesce(w ->> 'term', w ->> 'word') AS term, w ->> 'example' AS example,
        w ->> 'partOfSpeech' AS "partOfSpeech", w ->> 'imageUrl' AS "imageUrl"
      FROM section CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(s -> 'words') = 'array' THEN s -> 'words' ELSE '[]'::jsonb END) w
      WHERE s ->> 'type' = 'vocabulary' AND jsonb_typeof(w) = 'object'
      UNION ALL
      SELECT i ->> 'expression', i ->> 'example', NULL, NULL
      FROM section CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(s -> 'items') = 'array' THEN s -> 'items' ELSE '[]'::jsonb END) i
      WHERE s ->> 'type' = 'expressions' AND jsonb_typeof(i) = 'object'
    `);
    const details = (result.rows as unknown as LessonWordDetails[])
      .filter((row) => typeof row.term === "string" && row.term.trim() !== "");
    wordDetailsCache.set(lessonId, details);
    return details;
  } catch (error) {
    console.warn(`[Student page] Could not read the words of lesson ${lessonId}:`, error);
    return [];
  }
}

async function readImageUrls(lessonId: number): Promise<Set<string>> {
  const result = await db.execute(sql`
    SELECT DISTINCT u #>> '{}' AS url
    FROM (SELECT ${LESSON_BODY} AS body FROM lessons WHERE id = ${lessonId}) lesson
    CROSS JOIN LATERAL jsonb_path_query(lesson.body, 'lax $.**.imageUrl') u
    WHERE jsonb_typeof(u) = 'string'
  `);
  const urls = new Set((result.rows as Array<{ url: string }>).map((row) => row.url));
  imageUrlCache.set(lessonId, urls);
  return urls;
}

/**
 * Whether the lesson's content links to this stored picture. Copied lessons
 * can use pictures stored under another lesson, so the address is checked
 * against the lesson itself (see .agents/memory/lesson-share-images.md).
 */
export async function lessonHasImage(lessonId: number, imageUrl: string): Promise<boolean> {
  try {
    if (imageUrlCache.get(lessonId)?.has(imageUrl)) return true;
    // Not cached, or cached before the lesson's pictures were saved.
    return (await readImageUrls(lessonId)).has(imageUrl);
  } catch (error) {
    console.warn(`[Student page] Could not read the pictures of lesson ${lessonId}:`, error);
    return false;
  }
}
