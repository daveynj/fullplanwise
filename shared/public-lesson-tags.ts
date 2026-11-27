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
  holidays: "Holidays & Celebrations",
  education: "Education",
  sport: "Sport & fitness",
  science: "Science",
  entertainment: "Entertainment",
  shopping: "Shopping",
  transport: "Transport",
} as const;

export type PublicLessonTag = keyof typeof PUBLIC_LESSON_TAGS;

export const FEATURED_SEASONAL_TAGS: readonly PublicLessonTag[] = ["holidays"];

export const PUBLIC_LESSON_TAG_DESCRIPTIONS: Record<PublicLessonTag, string> = {
  travel: "Free ready-to-teach adult ESL conversation lessons on airports, hotels, trips, and living abroad across CEFR A1–C2—zero login required.",
  technology: "Free adult ESL lessons covering software, cyber safety, digital habits, and modern tools across CEFR levels—zero login required.",
  "artificial-intelligence": "Free CEFR-levelled ESL conversation lessons on AI tools, automation, and the future of work—zero login required.",
  environment: "Free adult ESL conversation lessons on sustainability, climate policy, and cities across CEFR levels—zero login required.",
  work: "Free Business & Career ESL conversation lessons on interviews, teamwork, meetings, and workplace culture across A1–C2—zero login required.",
  money: "Free adult ESL lessons on budgeting, salaries, banking abroad, and personal finance across CEFR levels—zero login required.",
  health: "Free ESL conversation lessons on clinic visits, medical communication, burnout, and wellbeing across A1–C1—zero login required.",
  food: "Free practical ESL conversation lessons on cafés, dining, cuisine, and hospitality across CEFR levels—zero login required.",
  relationships: "Free adult ESL conversation lessons on friendships, family dynamics, boundaries, and communication—zero login required.",
  culture: "Free cross-cultural ESL conversation lessons exploring traditions, identity, and daily customs around the world—zero login required.",
  holidays: "Free ready-to-teach adult ESL conversation lessons covering global celebrations, Christian Christmas traditions, church services, family holidays, commercialisation vs. tradition, and New Year across CEFR A1–C2—zero login required.",
  education: "Free adult ESL conversation lessons on study habits, universities, lifelong learning, and skills—zero login required.",
  sport: "Free adult ESL lessons on sport, fitness, hobbies, and teamwork across CEFR levels—zero login required.",
  science: "Free upper-level ESL conversation lessons on scientific progress, longevity, and research ethics—zero login required.",
  entertainment: "Free adult ESL conversation lessons on media, humour, stories, and streaming culture—zero login required.",
  shopping: "Free everyday adult ESL lessons on shops, customer service, retail trends, and consumer habits—zero login required.",
  transport: "Free practical ESL conversation lessons on buses, trains, commutes, and urban travel—zero login required.",
};

export function isPublicLessonTag(value: string): value is PublicLessonTag {
  return Object.hasOwn(PUBLIC_LESSON_TAGS, value);
}

export const publicLessonTagSchema = z.enum(Object.keys(PUBLIC_LESSON_TAGS) as [PublicLessonTag, ...PublicLessonTag[]]);
const reviewTokenSchema = z.string().regex(/^[a-f0-9]{48}$/);
export const publicTagSearchSchema = z.object({
  search: z.string().trim().max(120),
  afterId: z.number().int().nonnegative().default(0),
}).strict();
export const publicTagEditPreviewSchema = z.object({ id: z.number().int().positive() }).strict();
export const reviewedTagEditSchema = z.object({
  id: z.number().int().positive(),
  reviewToken: reviewTokenSchema,
  reviewed: z.literal(true),
  tags: z.array(publicLessonTagSchema).max(4).refine((tags) => new Set(tags).size === tags.length, "Duplicate tags"),
}).strict();

export interface PublicTagSearchResult {
  lessons: Array<{ id: number; title: string; cefrLevel: string; tags: PublicLessonTag[] }>;
  nextAfterId: number | null;
}

export interface PublicTagEditPreview {
  id: number;
  title: string;
  cefrLevel: string;
  publicExcerpt: string;
  tags: PublicLessonTag[];
  hasOtherTags: boolean;
  reviewToken: string;
  expiresAt: number;
}

export const reviewedTagBatchSchema = z.object({
  reviewToken: reviewTokenSchema,
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
