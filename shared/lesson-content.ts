/**
 * Storage format for `lessons.content`.
 *
 * Canonical format: the Postgres column is `text` and holds exactly one layer
 * of JSON — `JSON.stringify(lessonObject)`, starting with `{`.
 *
 * Legacy rows (written before this format was enforced) hold the lesson JSON
 * encoded twice: a JSON string literal whose value is the lesson JSON, so the
 * raw column starts with `"{\"title\"...`. They are decoded transparently on
 * read and rewritten in the canonical format the next time the row is saved.
 *
 * Application code never sees either encoding: the Drizzle column type in
 * shared/schema.ts runs every read through `decodeLessonContent` and every
 * write through `encodeLessonContent`, so `lesson.content` is always an object.
 * Only raw SQL (scripts, `substring(content, ...)` previews) sees the text.
 */

export type LessonContent = Record<string, any>;

// Legacy rows have at most two layers; allow one extra as a safety margin.
const MAX_STRING_LAYERS = 3;

/**
 * Decodes stored lesson content (canonical or legacy double-encoded) into an
 * object. Already-decoded objects are returned as-is. Throws when the value
 * is not a JSON object after unwrapping.
 */
export function decodeLessonContent(value: unknown): LessonContent {
  let current: unknown = value;
  for (let i = 0; i < MAX_STRING_LAYERS && typeof current === "string"; i++) {
    current = JSON.parse(current);
  }
  if (!current || typeof current !== "object" || Array.isArray(current)) {
    throw new Error("Lesson content is not a JSON object");
  }
  return current as LessonContent;
}

/** Like decodeLessonContent, but returns null instead of throwing. */
export function tryDecodeLessonContent(value: unknown): LessonContent | null {
  try {
    return decodeLessonContent(value);
  } catch {
    return null;
  }
}

/**
 * Serializes lesson content into the canonical single-encoded text format.
 * Accepts an object or a (possibly legacy-encoded) JSON string so callers
 * holding either can never produce a double-encoded row.
 */
export function encodeLessonContent(value: unknown): string {
  return JSON.stringify(decodeLessonContent(value));
}
