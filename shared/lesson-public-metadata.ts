import { tryDecodeLessonContent } from "./lesson-content";
import { expressionsSummary } from "./lesson-expressions";

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

// Deliberately accept only public-safe fields. Never use topic, notes or student data.
export function lessonPublicMetadata(lesson: {
  id: number; title: string; cefrLevel: string; content: unknown;
}) {
  const content = tryDecodeLessonContent(lesson.content);
  const parts = lessonContentsParts(Array.isArray(content?.sections) ? content.sections : []);
  const includes = parts.length ? ` Includes ${joinList(parts)}.` : "";
  const summary = `Free ${levelText(lesson.cefrLevel)} ESL lesson: ${lesson.title}.${includes} Ready to use with your students.`;
  const description = summary.length <= 160
    ? summary : summary.slice(0, 159).replace(/\s+\S*$/, "") + "…";
  return {
    title: `${lesson.title} | ${lesson.cefrLevel} ESL Lesson | PlanwiseESL`,
    description,
    canonicalPath: `/lessons/${lesson.id}`,
    // A lesson-authorized image endpoint also works for legacy inline images,
    // copied lessons and images uploaded before a lesson received its numeric ID.
    imagePath: `/api/lessons/${lesson.id}/share-image?v=1`,
    imageAlt: `${lesson.title} — ${lesson.cefrLevel} ESL lesson`,
  };
}
