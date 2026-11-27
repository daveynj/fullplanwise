import { z } from "zod";

/** Curated discovery labels, not free text from a teacher's private request. */
export const PUBLIC_LESSON_TAGS = {
  travel: "Travel",
  technology: "Technology",
  "artificial-intelligence": "Artificial intelligence",
  environment: "Environment",
  work: "Work & careers",
  money: "Money",
  health: "Health",
  food: "Food & cooking",
  relationships: "Relationships",
  culture: "Culture",
  education: "Education",
  sport: "Sport & fitness",
  science: "Science",
  entertainment: "Entertainment",
  shopping: "Shopping",
  transport: "Transport",
} as const;

export type PublicLessonTag = keyof typeof PUBLIC_LESSON_TAGS;
export const publicLessonTagSchema = z.enum(Object.keys(PUBLIC_LESSON_TAGS) as [PublicLessonTag, ...PublicLessonTag[]]);
export const reviewedTagBatchSchema = z.object({
  reviewToken: z.string().regex(/^[a-f0-9]{48}$/),
  approvals: z.array(z.object({
    id: z.number().int().positive(),
    reviewed: z.literal(true),
    tags: z.array(publicLessonTagSchema).min(1).max(4).refine((tags) => new Set(tags).size === tags.length, "Duplicate tags"),
  }).strict()).min(1).max(10).refine((rows) => new Set(rows.map((r) => r.id)).size === rows.length, "Duplicate lessons"),
}).strict();

export interface TagBackfillPreview {
  reviewToken: string;
  expiresAt: number;
  nextAfterId: number | null;
  lessons: Array<{
    id: number;
    title: string;
    cefrLevel: string;
    publicExcerpt: string;
    suggestedTags: PublicLessonTag[];
    evidence: Array<{ tag: PublicLessonTag; source: "title" | "reading"; terms: string[] }>;
  }>;
}

export function publicTags(tags: readonly string[] | null | undefined): PublicLessonTag[] {
  return [...new Set(tags ?? [])].filter((tag): tag is PublicLessonTag => Object.hasOwn(PUBLIC_LESSON_TAGS, tag));
}

export interface FilterablePublicLesson {
  title: string;
  cefrLevel: string;
  publicCategory: string | null;
  tags?: string[] | null;
}

export function filterPublicLessons<T extends FilterablePublicLesson>(
  lessons: T[], search: string, category: string, tag: string, categoryLabels: Record<string, string>,
): T[] {
  const q = search.trim().toLowerCase();
  return lessons.filter((lesson) => {
    const tags = publicTags(lesson.tags);
    return (category === "all" || lesson.publicCategory === category) &&
      (tag === "all" || tags.includes(tag as PublicLessonTag)) &&
      (!q || [lesson.title, lesson.cefrLevel, categoryLabels[lesson.publicCategory ?? ""] ?? "",
        ...tags.map((t) => PUBLIC_LESSON_TAGS[t])].some((text) => text.toLowerCase().includes(q)));
  });
}
