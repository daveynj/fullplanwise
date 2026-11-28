import { PUBLIC_LESSON_TAGS } from "@shared/public-lesson-tags";
import { PUBLIC_LIBRARY_LABELS } from "@shared/schema";
import { trackEvent } from "./analytics";
import { trackProjectEvent } from "./project-analytics";

type LibraryEvent =
  | "public_library_tag_selected"
  | "public_library_category_selected"
  | "public_library_zero_results"
  | "public_library_filters_reset"
  | "public_library_lesson_opened"
  | "public_library_theme_clicked"
  | "public_library_preview_opened"
  | "public_library_start_here_clicked"
  | "public_library_pdf_downloaded";

interface LibraryContext {
  tag: string;
  category: string;
  level?: string;
  resultCount: number;
  lessonId?: number;
}

/** Build a new allowlisted payload: never spread lesson records or search state. */
export function trackPublicLibraryEvent(name: LibraryEvent, context: LibraryContext): void {
  const data: Record<string, string | number> = {};
  if (Object.hasOwn(PUBLIC_LESSON_TAGS, context.tag)) data.tag = context.tag;
  if (Object.hasOwn(PUBLIC_LIBRARY_LABELS, context.category)) data.category = context.category;
  if (context.level && /^(A1|A2|B1|B2|C1|C2)$/.test(context.level)) data.cefr_level = context.level;
  if (Number.isSafeInteger(context.resultCount) && context.resultCount >= 0) data.result_count = context.resultCount;
  if (Number.isSafeInteger(context.lessonId) && context.lessonId! > 0) data.lesson_id = context.lessonId!;
  trackProjectEvent(name, data);
  trackEvent(name, data);
}
