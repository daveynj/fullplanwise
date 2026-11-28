/**
 * Quick preview of a public lesson for the free library browse pages: the
 * target words, the reading and one discussion question. Built only from
 * student-facing content; teacher notes and procedures are never included.
 */
import { tryDecodeLessonContent } from "./lesson-content";

export interface LessonPreviewWord {
  term: string;
  partOfSpeech: string;
  definition: string;
}

export interface LessonPreview {
  words: LessonPreviewWord[];
  readingTitle: string;
  readingIntro: string;
  discussionQuestion: string;
  minutes: number | null;
}

const MAX_WORDS = 5;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function arr(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, "")}…`;
}

export function lessonPreviewOf(content: unknown): LessonPreview {
  const parsed = tryDecodeLessonContent(content);
  const sections = arr(parsed?.sections).filter((s) => s && typeof s === "object");

  const words = sections
    .filter((s) => s.type === "vocabulary")
    .flatMap((s) => arr(s.words))
    .map((w) => ({
      term: str(w?.term) || str(w?.word),
      partOfSpeech: str(w?.partOfSpeech),
      definition: clip(str(w?.definition) || str(w?.coreDefinition), 160),
    }))
    .filter((w) => w.term)
    .slice(0, MAX_WORDS);

  const reading = sections.find((s) => s.type === "reading");
  const readingTitle = str(reading?.title).replace(/^reading( text)?\s*[:\-–—]\s*/i, "");
  const readingIntro = clip(str(reading?.introduction), 200);

  const firstQuestion = sections
    .filter((s) => s.type === "discussion" || s.type === "speaking")
    .flatMap((s) => arr(s.questions))
    .map((q) => (typeof q === "string" ? q.trim() : str(q?.question)))
    .find(Boolean);

  const rawMinutes = parsed?.estimatedTime ?? parsed?.lesson?.time ?? parsed?.time ?? parsed?.duration;
  const n = typeof rawMinutes === "number" ? rawMinutes : typeof rawMinutes === "string" ? parseInt(rawMinutes, 10) : NaN;
  const minutes = Number.isFinite(n) && n > 0 && n <= 600 ? Math.round(n) : null;

  return {
    words,
    readingTitle,
    readingIntro,
    discussionQuestion: clip(firstQuestion ?? "", 240),
    minutes,
  };
}
