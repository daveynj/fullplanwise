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

/**
 * How many leading characters of the raw `lessons.content` column to fetch
 * when building a list-card summary. The reading introduction and warm-up
 * text sit near the start of the JSON (well under 3,000 characters even in
 * legacy double-encoded rows), so this avoids loading multi-MB lessons that
 * embed Base64 images.
 */
export const LESSON_SUMMARY_SOURCE_CHARS = 4000;

const DEFAULT_SUMMARY_LENGTH = 200;

/**
 * Unwraps the outer JSON string layer of a possibly truncated JSON string
 * literal (e.g. the first N characters of a legacy double-encoded row).
 * Stops cleanly before an escape sequence that was cut off.
 */
function unwrapTruncatedJsonString(raw: string): string | null {
  if (!raw.startsWith('"')) return null;
  let safeEnd = 1;
  let i = 1;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '"') {
      safeEnd = i;
      break;
    }
    if (ch === "\\") {
      const escapeLength = raw[i + 1] === "u" ? 6 : 2;
      if (i + escapeLength > raw.length) break;
      i += escapeLength;
    } else {
      i += 1;
    }
    safeEnd = i;
  }
  try {
    return JSON.parse(raw.slice(0, safeEnd) + '"');
  } catch {
    return null;
  }
}

/** Finds the first complete string value for `key` in (possibly truncated) JSON text. */
function findJsonStringValue(json: string, pattern: RegExp): string | null {
  const match = pattern.exec(json);
  if (!match) return null;
  try {
    const value = JSON.parse(`"${match[1]}"`);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return cut.replace(/[\s.,;:!?-]+$/, "") + "…";
}

const STRING_VALUE = String.raw`"((?:[^"\\]|\\.)*)"`;
const READING_INTRO = new RegExp(String.raw`"type"\s*:\s*"reading"[^{}]*?"introduction"\s*:\s*` + STRING_VALUE);
const ANY_INTRO = new RegExp(String.raw`"introduction"\s*:\s*` + STRING_VALUE);
const WARMUP_CONTENT = new RegExp(String.raw`"type"\s*:\s*"warmup"[^{}]*?"content"\s*:\s*` + STRING_VALUE);

/**
 * Builds a short, human-readable summary for lesson list cards from the
 * leading characters of the raw `lessons.content` text (canonical or legacy
 * double-encoded; truncation anywhere is tolerated). Prefers the reading
 * introduction, then the warm-up description. Returns null when neither is
 * found, so callers can fall back to other fields instead of showing JSON.
 */
export function extractLessonSummary(
  rawContentPrefix: string | null | undefined,
  maxLength = DEFAULT_SUMMARY_LENGTH,
): string | null {
  if (!rawContentPrefix) return null;

  let json = rawContentPrefix.trimStart();
  for (let i = 0; i < MAX_STRING_LAYERS && json.startsWith('"'); i++) {
    const unwrapped = unwrapTruncatedJsonString(json);
    if (unwrapped === null) return null;
    json = unwrapped.trimStart();
  }
  if (!json.startsWith("{")) return null;

  const summary =
    findJsonStringValue(json, READING_INTRO) ??
    findJsonStringValue(json, ANY_INTRO) ??
    findJsonStringValue(json, WARMUP_CONTENT);
  if (!summary) return null;

  const normalized = summary.replace(/\s+/g, " ").trim();
  return normalized ? truncateAtWord(normalized, maxLength) : null;
}
