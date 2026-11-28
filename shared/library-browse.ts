/**
 * Browse structure of the free lesson library, shared by the server
 * prerender (server/lesson-prerender.ts), the sitemap, llms-full.txt and the
 * React pages:
 *
 * - level-by-theme pages at /esl-lessons/:level/topics/:tag ("Free B1 Work &
 *   careers ESL lessons"), which exist only where a level and theme have at
 *   least LEVEL_TOPIC_MIN_LESSONS public lessons, so no page is ever thin;
 * - "More like this" groups for a lesson page: the same theme at the same
 *   level first, then the same theme at other levels, then the rest of the level.
 */
import { PUBLIC_LESSON_TAGS, isPublicLessonTag, publicTags, type PublicLessonTag } from "./public-lesson-tags";
import { CEFR_LEVEL_NAMES } from "./lesson-public-metadata";

export const CEFR_LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVEL_ORDER)[number];

/** A level-by-theme page needs this many public lessons before it exists. */
export const LEVEL_TOPIC_MIN_LESSONS = 3;

export interface BrowsableLesson {
  id: number;
  title: string;
  cefrLevel: string;
  tags?: string[] | null;
}

export function isCefrLevel(value: string): value is CefrLevel {
  return (CEFR_LEVEL_ORDER as readonly string[]).includes(value);
}

export function levelTopicPath(level: string, tag: PublicLessonTag): string {
  return `/esl-lessons/${level.toLowerCase()}/topics/${tag}`;
}

/** { level: "B1", tag: "work" } for /esl-lessons/b1/topics/work, else null. */
export function parseLevelTopicPath(pathname: string): { level: CefrLevel; tag: PublicLessonTag } | null {
  const m = pathname.match(/^\/esl-lessons\/([a-zA-Z0-9]+)\/topics\/([^/]+)\/?$/);
  if (!m) return null;
  const level = m[1].toUpperCase();
  const tag = m[2].toLowerCase();
  if (!isCefrLevel(level) || !isPublicLessonTag(tag)) return null;
  return { level, tag };
}

function key(level: string, tag: string): string {
  return `${level.toUpperCase()}|${tag}`;
}

/** Public lesson counts per level and theme, keyed "B1|work". */
export function levelTopicCounts(lessons: readonly BrowsableLesson[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const l of lessons) {
    for (const tag of publicTags(l.tags)) {
      const k = key(l.cefrLevel, tag);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  return counts;
}

export function levelTopicCount(counts: Map<string, number>, level: string, tag: PublicLessonTag): number {
  return counts.get(key(level, tag)) ?? 0;
}

export function hasLevelTopicPage(counts: Map<string, number>, level: string, tag: PublicLessonTag): boolean {
  return levelTopicCount(counts, level, tag) >= LEVEL_TOPIC_MIN_LESSONS;
}

export interface LevelTopicPage {
  level: CefrLevel;
  tag: PublicLessonTag;
  count: number;
  path: string;
}

/** Every level-by-theme page that exists, in level order then by size. */
export function levelTopicPages(lessons: readonly BrowsableLesson[]): LevelTopicPage[] {
  const counts = levelTopicCounts(lessons);
  const pages: LevelTopicPage[] = [];
  for (const level of CEFR_LEVEL_ORDER) {
    for (const tag of Object.keys(PUBLIC_LESSON_TAGS) as PublicLessonTag[]) {
      const count = levelTopicCount(counts, level, tag);
      if (count >= LEVEL_TOPIC_MIN_LESSONS) pages.push({ level, tag, count, path: levelTopicPath(level, tag) });
    }
  }
  return pages.sort((a, b) =>
    CEFR_LEVEL_ORDER.indexOf(a.level) - CEFR_LEVEL_ORDER.indexOf(b.level) ||
    b.count - a.count ||
    PUBLIC_LESSON_TAGS[a.tag].localeCompare(PUBLIC_LESSON_TAGS[b.tag]));
}

/** The page to send a reader to for a theme at a level: the level-by-theme page when it exists, else the all-levels hub. */
export function themeHrefFor(counts: Map<string, number>, level: string, tag: PublicLessonTag): string {
  return hasLevelTopicPage(counts, level, tag) ? levelTopicPath(level, tag) : `/esl-lessons/topics/${tag}`;
}

export function levelTopicTitle(level: string, tag: PublicLessonTag): string {
  return `Free ${level} ${PUBLIC_LESSON_TAGS[tag]} ESL Lessons (${CEFR_LEVEL_NAMES[level] ?? level})`;
}

/**
 * One sentence on what lessons at each level look like, so a level-by-theme
 * page says something true about the level, not only about the theme. Matches
 * the level rules in server/services/lesson-prompt.ts.
 */
export const LEVEL_TEACHING_NOTES: Record<CefrLevel, string> = {
  A1: "A1 lessons use short, concrete sentences, everyday words and a reading of a few short paragraphs, so a beginner can follow the text and answer in simple sentences.",
  A2: "A2 lessons stay with familiar, everyday situations and give the student sentence frames to build longer answers.",
  B1: "B1 lessons ask for opinions and reasons, with a reading that tells a story or sets up a problem the student can discuss.",
  B2: "B2 lessons compare views, use more precise vocabulary and expect the student to explain, argue and give examples.",
  C1: "C1 lessons deal with nuance and register: the student argues a position, concedes points and uses idiomatic language.",
  C2: "C2 lessons work at near-native level: subtle meaning, tone, irony and the vocabulary that separates fluent from precise.",
};

export function levelTopicDescription(level: string, tag: PublicLessonTag, count: number): string {
  const name = (CEFR_LEVEL_NAMES[level] ?? "").toLowerCase();
  return `${count} free ${level} (${name}) ESL conversation lessons about ${PUBLIC_LESSON_TAGS[tag].toLowerCase()}: five words, a reading, practice and discussion questions. No login.`;
}

// ---------------------------------------------------------------------------
// "More like this" on a lesson page
// ---------------------------------------------------------------------------

export interface RelatedLessonGroups<L extends BrowsableLesson> {
  /** Other lessons at the same level, same theme first, up to `max`. */
  sameLevel: L[];
  /** The lesson's main theme at other levels: at most one lesson per level, nearest levels first. */
  otherLevels: L[];
  /** Where to browse on: the lesson's themes at this level (or the hub), then the level. */
  browse: { label: string; href: string }[];
}

/** Levels ordered by distance from `level`, easier first on a tie. */
function levelsByDistance(level: string): CefrLevel[] {
  const i = CEFR_LEVEL_ORDER.indexOf(level as CefrLevel);
  return [...CEFR_LEVEL_ORDER]
    .filter((l) => l !== level)
    .sort((a, b) => {
      const da = Math.abs(CEFR_LEVEL_ORDER.indexOf(a) - i);
      const db = Math.abs(CEFR_LEVEL_ORDER.indexOf(b) - i);
      return da - db || CEFR_LEVEL_ORDER.indexOf(a) - CEFR_LEVEL_ORDER.indexOf(b);
    });
}

export function relatedLessonGroups<L extends BrowsableLesson>(
  lesson: BrowsableLesson,
  all: readonly L[],
  max = 6,
): RelatedLessonGroups<L> {
  const level = lesson.cefrLevel.toUpperCase();
  const myTags = publicTags(lesson.tags);
  const shares = (l: BrowsableLesson) => publicTags(l.tags).some((t) => myTags.includes(t));
  const others = all.filter((l) => l && l.id !== lesson.id);

  const atLevel = others.filter((l) => l.cefrLevel.toUpperCase() === level);
  const sameTheme = atLevel.filter(shares);
  const rest = atLevel.filter((l) => !shares(l));
  const sameLevel = [...sameTheme, ...rest].slice(0, max);

  const otherLevels: L[] = [];
  const mainTag = myTags[0];
  if (mainTag) {
    for (const lv of levelsByDistance(level)) {
      const match = others.find((l) => l.cefrLevel.toUpperCase() === lv && publicTags(l.tags).includes(mainTag));
      if (match) otherLevels.push(match);
      if (otherLevels.length >= 4) break;
    }
  }

  const counts = levelTopicCounts(all);
  const browse: { label: string; href: string }[] = [];
  for (const tag of myTags) {
    const label = PUBLIC_LESSON_TAGS[tag];
    browse.push(
      hasLevelTopicPage(counts, level, tag)
        ? { label: `${level} ${label} lessons`, href: levelTopicPath(level, tag) }
        : { label: `All ${label} lessons`, href: `/esl-lessons/topics/${tag}` },
    );
  }
  if (isCefrLevel(level)) browse.push({ label: `All ${level} lessons`, href: `/esl-lessons/${level.toLowerCase()}` });

  return { sameLevel, otherLevels, browse };
}
