import { tryDecodeLessonContent } from "./lesson-content";
import { expressionsSummary } from "./lesson-expressions";
import { lessonPath } from "./lesson-url";

export const CEFR_LEVEL_NAMES: Record<string, string> = {
  A1: "Beginner", A2: "Elementary", B1: "Intermediate",
  B2: "Upper Intermediate", C1: "Advanced", C2: "Proficiency",
};

export function lessonContentsParts(sections: any[]): string[] {
  const has = (...types: string[]) => sections.some((s) => s && types.includes(s.type));
  const vocab = sections.find((s) => s && s.type === "vocabulary");
  const vocabCount = Array.isArray(vocab?.words) ? vocab.words.length : 0;
  const expressions = expressionsSummary(sections.find((s) => s && s.type === "expressions"));
  const parts: string[] = [];
  if (vocabCount) parts.push(`${vocabCount} vocabulary words`);
  if (expressions) parts.push(expressions);
  if (has("reading")) parts.push("a reading text");
  if (has("comprehension", "quiz")) parts.push("comprehension questions");
  if (has("discussion", "speaking")) parts.push("discussion questions");
  if (has("sentenceFrames", "grammar")) parts.push("speaking patterns");
  return parts;
}

export function joinList(parts: string[]): string {
  return parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function levelText(level: string): string {
  return `${level}${CEFR_LEVEL_NAMES[level] ? ` (${CEFR_LEVEL_NAMES[level]})` : ""}`;
}

const MAX_DESCRIPTION = 160;

/**
 * A meta description of at most 160 characters made of whole sentences.
 * Search results showed cut-off descriptions ending in "…", so instead of
 * truncating, drop the closing line and then list fewer contents until the
 * description fits.
 */
export function lessonDescription(title: string, level: string, parts: string[]): string {
  const name = title.trim();
  const opening = `Free ${levelText(level)} ESL lesson: ${name}${/[.!?]$/.test(name) ? "" : "."}`;
  const candidates: string[] = [];
  for (let n = parts.length; n >= 0; n--) {
    const includes = n ? ` Includes ${joinList(parts.slice(0, n))}.` : "";
    candidates.push(`${opening}${includes} Ready to use with your students.`, `${opening}${includes}`);
  }
  const fits = candidates.find((c) => c.length <= MAX_DESCRIPTION);
  if (fits) return fits;
  // Only a very long title gets here: keep whole words and close the sentence.
  return `${opening.slice(0, MAX_DESCRIPTION - 1).replace(/\s+\S*$/, "").replace(/[,:;–—-]+$/, "")}.`;
}

// Deliberately accept only public-safe fields. Never use topic, notes or student data.
export function lessonPublicMetadata(lesson: {
  id: number; title: string; cefrLevel: string; content: unknown;
  publicSlug?: string | null; publicLevel?: string | null;
}) {
  const content = tryDecodeLessonContent(lesson.content);
  const parts = lessonContentsParts(Array.isArray(content?.sections) ? content.sections : []);
  const description = lessonDescription(lesson.title, lesson.cefrLevel, parts);
  return {
    title: `${lesson.title} | ${lesson.cefrLevel} ESL Lesson | PlanWise ESL`,
    description,
    canonicalPath: lessonPath(lesson),
    // A lesson-authorized image endpoint also works for legacy inline images,
    // copied lessons and images uploaded before a lesson received its numeric ID.
    imagePath: `/api/lessons/${lesson.id}/share-image?v=1`,
    imageAlt: `${lesson.title} — ${lesson.cefrLevel} ESL lesson`,
  };
}

/** Safe route for remixing a public lesson without exposing its original prompt. */
export function publicLessonRemixHref(title: string, level: string, signedIn: boolean): string {
  const generatePath = `/generate?topic=${encodeURIComponent(title)}&level=${encodeURIComponent(level)}`;
  return signedIn
    ? generatePath
    : `/auth?register=true&redirect=${encodeURIComponent(generatePath)}`;
}
