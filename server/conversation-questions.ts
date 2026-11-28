import { storage } from './storage';
import { lessonPath } from '@shared/lesson-url';
import { CEFR_LEVEL_NAMES } from '@shared/lesson-public-metadata';
import {
  PUBLIC_LESSON_TAGS,
  FEATURED_SEASONAL_TAGS,
  isPublicLessonTag,
  publicTags,
  type PublicLessonTag,
} from '@shared/public-lesson-tags';
import { escapeHtml as e, questionText, sectionsOf, lessonQuestionsPath, CEFR_LEVELS } from './lesson-prerender';

/**
 * "Conversation questions about <topic>" pages: /conversation-questions and
 * /conversation-questions/:tag.
 *
 * They gather the warm-up and discussion questions of the free public lessons
 * by topic, as complete server-rendered HTML (no JavaScript needed). Only
 * public lessons are read, and only their title, level, tags, public URL and
 * the warm-up / discussion question text. Quiz answers, the teacher's original
 * topic, notes and student data are never used.
 */

const BASE_URL = 'https://planwiseesl.com';
const CACHE_MS = 10 * 60 * 1000;

export const CONVERSATION_QUESTIONS_PATH = '/conversation-questions';

export interface QuestionLesson {
  id: number;
  publicSlug?: string | null;
  publicLevel?: string | null;
  title: string;
  cefrLevel: string;
  isPublic?: boolean;
  tags?: string[] | null;
  content: unknown;
  createdAt: Date | string;
}

interface LessonQuestions {
  lesson: QuestionLesson;
  questions: string[];
}

export interface ConversationQuestionPages {
  hub: string;
  topics: Map<PublicLessonTag, string>;
  /** Sitemap entries: the hub plus every topic page that exists. */
  entries: Array<{ url: string; lastmod?: string }>;
}

/** Warm-up and discussion (or speaking) questions of a lesson, in order, without repeats. */
export function lessonQuestionsOf(lesson: QuestionLesson): string[] {
  const sections = sectionsOf(lesson.content);
  const pick = (types: string[]) =>
    sections
      .filter((s) => s && types.includes(s.type))
      .flatMap((s) => (Array.isArray(s.questions) ? s.questions : []))
      .map(questionText)
      .filter(Boolean);
  return [...new Set([...pick(['warmup', 'warm-up']), ...pick(['discussion', 'speaking'])])];
}

const LEVEL_ORDER = new Map<string, number>(CEFR_LEVELS.map((lv, i) => [lv, i]));

/** Public lessons that have questions, grouped by topic tag, in level order then newest first. */
export function groupByTopic(lessons: readonly QuestionLesson[]): Map<PublicLessonTag, LessonQuestions[]> {
  const groups = new Map<PublicLessonTag, LessonQuestions[]>();
  for (const lesson of lessons) {
    if (!lesson || lesson.isPublic !== true) continue;
    const questions = lessonQuestionsOf(lesson);
    if (!questions.length) continue;
    for (const tag of publicTags(lesson.tags)) {
      const list = groups.get(tag) ?? [];
      list.push({ lesson, questions });
      groups.set(tag, list);
    }
  }
  for (const list of groups.values()) {
    list.sort(
      (a, b) =>
        (LEVEL_ORDER.get(a.lesson.cefrLevel) ?? 99) - (LEVEL_ORDER.get(b.lesson.cefrLevel) ?? 99) ||
        new Date(b.lesson.createdAt).getTime() - new Date(a.lesson.createdAt).getTime() ||
        b.lesson.id - a.lesson.id,
    );
  }
  return groups;
}

const countQuestions = (items: LessonQuestions[]) => items.reduce((n, i) => n + i.questions.length, 0);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const topicWord = (tag: PublicLessonTag) => PUBLIC_LESSON_TAGS[tag].toLowerCase();

function levelsIn(items: LessonQuestions[]): string[] {
  const present = new Set(items.map((i) => i.lesson.cefrLevel));
  return CEFR_LEVELS.filter((lv) => present.has(lv));
}

/** One plain sentence AI can quote, built from the real counts. */
export function introSentence(tag: PublicLessonTag, items: LessonQuestions[]): string {
  const levels = levelsIn(items);
  const range = levels.length === 1 ? `at level ${levels[0]}` : `from ${levels[0]} to ${levels[levels.length - 1]}`;
  const lessonCount = items.length;
  return `${plural(countQuestions(items), `${topicWord(tag)} conversation question`, `${topicWord(tag)} conversation questions`)} for ESL students, ${range}, taken from ${lessonCount} free PlanWise ESL ${lessonCount === 1 ? 'lesson' : 'lessons'}. Free to print and use in class, no login.`;
}

const css = `
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: 'Open Sans', Arial, sans-serif; color: #051d40; background: #fdfdfd; line-height: 1.6; }
a { color: #8a6a12; }
header.site { display: flex; flex-wrap: wrap; gap: 8px 20px; justify-content: space-between; align-items: center; padding: 12px 20px; background: #051d40; }
header.site a { color: #fff; text-decoration: none; }
header.site .brand { font-weight: 700; font-size: 1.1rem; }
header.site nav { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 0.95rem; }
header.site nav a.signup { background: #edc437; color: #051d40; padding: 4px 12px; border-radius: 6px; font-weight: 700; }
main { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
nav.crumbs { font-size: 0.9rem; margin-bottom: 12px; }
h1 { font-size: 2rem; line-height: 1.2; margin: 0 0 12px; }
h2 { font-size: 1.4rem; margin: 2rem 0 0.6rem; padding-top: 0.4rem; border-top: 3px solid #edc437; break-after: avoid; }
h3 { font-size: 1.1rem; margin: 0 0 0.5rem; }
.lead { font-size: 1.1rem; }
.jump, .related { font-size: 0.95rem; }
.jump a { display: inline-block; margin: 0 6px 6px 0; padding: 2px 12px; border: 1px solid #051d40; border-radius: 16px; text-decoration: none; color: #051d40; font-weight: 600; }
.lesson { background: #fff; border: 1px solid #e6e6e6; border-radius: 12px; padding: 16px 18px; margin-bottom: 14px; break-inside: avoid; }
.lesson ol { margin: 0 0 0.8rem; padding-left: 1.4rem; }
.lesson li { margin-bottom: 0.45rem; }
.links { margin: 0; font-size: 0.95rem; display: flex; flex-wrap: wrap; gap: 4px 18px; }
.cta { background: #f8f5ec; border-radius: 12px; padding: 16px 18px; margin: 1.5rem 0; display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; justify-content: space-between; }
.cta p { margin: 0; font-weight: 700; flex: 1 1 260px; }
.cta a.button { background: #edc437; color: #051d40; padding: 10px 18px; border-radius: 8px; font-weight: 700; text-decoration: none; white-space: nowrap; }
.topics { list-style: none; padding: 0; margin: 1rem 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.topics li { margin: 0; }
.topics a { display: block; background: #fff; border: 1px solid #e6e6e6; border-radius: 10px; padding: 12px 14px; text-decoration: none; color: #051d40; font-weight: 700; }
.topics a span { display: block; font-weight: 400; font-size: 0.9rem; color: #555; }
footer.site { border-top: 1px solid #ddd; padding: 16px 20px; font-size: 0.9rem; text-align: center; }
footer.site a { margin: 0 8px; }
@media (max-width: 480px) { h1 { font-size: 1.6rem; } .cta a.button { width: 100%; text-align: center; } }
@media print {
  header.site, footer.site, nav.crumbs, .jump, .cta, .related { display: none; }
  body { background: #fff; color: #000; font-size: 12pt; }
  main { max-width: none; padding: 0; }
  a { color: #000; text-decoration: none; }
  .lesson { border: 0; padding: 0; margin-bottom: 14pt; break-inside: avoid; page-break-inside: avoid; }
  h2 { border-top: 0; break-after: avoid; }
  h3 { break-after: avoid; }
  .links { display: none; }
}
`;

function pageHtml(opts: { title: string; description: string; canonicalPath: string; structuredData: unknown[]; body: string }): string {
  const ld = opts.structuredData
    .map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${e(opts.title)}</title>
<meta name="description" content="${e(opts.description)}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${e(BASE_URL + opts.canonicalPath)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="PlanWise ESL" />
<meta property="og:title" content="${e(opts.title)}" />
<meta property="og:description" content="${e(opts.description)}" />
<meta property="og:url" content="${e(BASE_URL + opts.canonicalPath)}" />
${ld}
<style>${css}</style>
</head>
<body>
<header class="site">
<a class="brand" href="/">PlanWise ESL</a>
<nav aria-label="Main">
<a href="/esl-lessons">Free lessons</a>
<a href="/how-it-works">How it works</a>
<a class="signup" href="/auth?register=true">Sign up</a>
</nav>
</header>
<main>
${opts.body}
</main>
<footer class="site">
<a href="/">Home</a><a href="/esl-lessons">Free lessons</a><a href="/conversation-questions">Conversation questions</a><a href="/how-it-works">How it works</a><a href="/auth?register=true">Sign up</a>
</footer>
</body>
</html>`;
}

/** "Make a <topic> lesson" link: the topic label, no level, through sign-up. */
function generateHref(tag: PublicLessonTag): string {
  const generatePath = `/generate?topic=${encodeURIComponent(PUBLIC_LESSON_TAGS[tag])}`;
  return `/auth?register=true&redirect=${encodeURIComponent(generatePath)}`;
}

function ctaHtml(tag: PublicLessonTag): string {
  return `<aside class="cta"><p>Teaching one student? Make a ${e(topicWord(tag))} lesson at their level in 1&ndash;2 minutes</p><a class="button" href="${e(generateHref(tag))}">Make a lesson</a></aside>`;
}

function lessonBlockHtml({ lesson, questions }: LessonQuestions): string {
  const printable = lesson.publicSlug && lesson.publicLevel;
  return `<article class="lesson">
<h3>${e(lesson.title)}</h3>
<ol>${questions.map((q) => `<li>${e(q)}</li>`).join('')}</ol>
<p class="links"><a href="${e(lessonPath(lesson))}">Open the full free lesson (reading, 5 key words, exercises)</a>${
    printable ? `<a href="${e(lessonQuestionsPath(lesson))}">Print these questions</a>` : ''
  }</p>
</article>`;
}

function topicOrder(tags: Iterable<PublicLessonTag>, groups: Map<PublicLessonTag, LessonQuestions[]>): PublicLessonTag[] {
  return [...tags].sort((a, b) => {
    const pin = (t: PublicLessonTag) => (FEATURED_SEASONAL_TAGS.includes(t) ? 0 : 1);
    return (
      pin(a) - pin(b) ||
      countQuestions(groups.get(b) ?? []) - countQuestions(groups.get(a) ?? []) ||
      PUBLIC_LESSON_TAGS[a].localeCompare(PUBLIC_LESSON_TAGS[b])
    );
  });
}

export function buildConversationQuestionsTopicHtml(
  tag: PublicLessonTag,
  items: LessonQuestions[],
  groups: Map<PublicLessonTag, LessonQuestions[]> = new Map([[tag, items]]),
): string {
  const label = PUBLIC_LESSON_TAGS[tag];
  const word = topicWord(tag);
  const canonicalPath = `${CONVERSATION_QUESTIONS_PATH}/${tag}`;
  const title = `Conversation questions about ${word}: free ESL discussion questions by level | PlanWise ESL`;
  const intro = introSentence(tag, items);
  const levels = levelsIn(items);

  const levelSections = levels
    .map((lv, i) => {
      const inLevel = items.filter((x) => x.lesson.cefrLevel === lv);
      const section = `<section id="${e(lv.toLowerCase())}">
<h2>${e(lv)} (${e(CEFR_LEVEL_NAMES[lv] ?? lv)}): ${e(word)} questions</h2>
${inLevel.map(lessonBlockHtml).join('\n')}
</section>`;
      return i === 0 && levels.length > 1 ? `${section}\n${ctaHtml(tag)}` : section;
    })
    .join('\n');

  const others = topicOrder([...groups.keys()].filter((t) => t !== tag), groups);
  const relatedHtml = `<section class="related" aria-label="Related topics">
<h2>More conversation questions</h2>
${others.length ? `<p>${others.map((t) => `<a href="${e(`${CONVERSATION_QUESTIONS_PATH}/${t}`)}">${e(PUBLIC_LESSON_TAGS[t])}</a>`).join(' &middot; ')}</p>` : ''}
<p><a href="${CONVERSATION_QUESTIONS_PATH}">All conversation question topics</a> &middot; <a href="/esl-lessons/topics/${e(tag)}">All free ${e(word)} lessons</a></p>
</section>`;

  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Conversation questions about ${word}`,
    description: intro,
    url: BASE_URL + canonicalPath,
    inLanguage: 'en-GB',
    isAccessibleForFree: true,
    educationalLevel: levels.length === 1 ? `CEFR ${levels[0]}` : `CEFR ${levels[0]}-${levels[levels.length - 1]}`,
    isPartOf: { '@type': 'WebSite', name: 'PlanWise ESL', url: BASE_URL },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((x, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: BASE_URL + lessonPath(x.lesson),
        name: x.lesson.title,
      })),
    },
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Conversation questions', item: BASE_URL + CONVERSATION_QUESTIONS_PATH },
      { '@type': 'ListItem', position: 3, name: label, item: BASE_URL + canonicalPath },
    ],
  };

  const body = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="${CONVERSATION_QUESTIONS_PATH}">Conversation questions</a> &rsaquo; ${e(label)}</nav>
<h1>Conversation questions about ${e(word)}</h1>
<p class="lead">${e(intro)}</p>
<p class="jump" aria-label="Jump to a level">Jump to: ${levels.map((lv) => `<a href="#${e(lv.toLowerCase())}">${e(lv)}</a>`).join('')}</p>
${levelSections}
${ctaHtml(tag)}
${relatedHtml}`;

  return pageHtml({
    title,
    description: intro,
    canonicalPath,
    structuredData: [collection, breadcrumb],
    body,
  });
}

export function buildConversationQuestionsHubHtml(groups: Map<PublicLessonTag, LessonQuestions[]>): string {
  const tags = topicOrder(groups.keys(), groups);
  const title = 'Conversation questions by topic: free ESL discussion questions | PlanWise ESL';
  const intro = `Free ESL conversation questions on ${plural(tags.length, 'topic', 'topics')}, from A1 to C2, taken from the free PlanWise ESL lessons. Pick a topic, print the questions and use them in class, no login.`;

  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Conversation questions by topic',
    description: intro,
    url: BASE_URL + CONVERSATION_QUESTIONS_PATH,
    inLanguage: 'en-GB',
    isAccessibleForFree: true,
    isPartOf: { '@type': 'WebSite', name: 'PlanWise ESL', url: BASE_URL },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: tags.length,
      itemListElement: tags.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${BASE_URL}${CONVERSATION_QUESTIONS_PATH}/${t}`,
        name: `Conversation questions about ${topicWord(t)}`,
      })),
    },
  };

  const body = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; Conversation questions</nav>
<h1>Conversation questions by topic</h1>
<p class="lead">${e(intro)}</p>
<ul class="topics">
${tags
  .map((t) => {
    const items = groups.get(t)!;
    return `<li><a href="${e(`${CONVERSATION_QUESTIONS_PATH}/${t}`)}">${e(PUBLIC_LESSON_TAGS[t])}<span>${plural(countQuestions(items), 'question', 'questions')} from ${plural(items.length, 'lesson', 'lessons')}</span></a></li>`;
  })
  .join('\n')}
</ul>
<aside class="cta"><p>Teaching one student? Make a lesson on any topic at their level in 1&ndash;2 minutes</p><a class="button" href="/auth?register=true&amp;redirect=${e(encodeURIComponent('/generate'))}">Make a lesson</a></aside>
<p><a href="/esl-lessons">Browse all free lessons</a> &middot; <a href="/how-it-works">How PlanWise ESL works</a></p>`;

  return pageHtml({
    title,
    description: intro,
    canonicalPath: CONVERSATION_QUESTIONS_PATH,
    structuredData: [collection],
    body,
  });
}

const toDate = (value: Date | string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().split('T')[0];
};

/** Builds the hub, every topic page and the sitemap entries from public lessons. */
export function buildConversationQuestionPages(lessons: readonly QuestionLesson[]): ConversationQuestionPages {
  const groups = groupByTopic(lessons);
  const topics = new Map<PublicLessonTag, string>();
  const entries: ConversationQuestionPages['entries'] = [];
  const latest = (items: LessonQuestions[]) =>
    items.map((x) => toDate(x.lesson.createdAt)).filter((d): d is string => !!d).sort().pop();
  for (const tag of Object.keys(PUBLIC_LESSON_TAGS) as PublicLessonTag[]) {
    const items = groups.get(tag);
    if (!items?.length) continue;
    topics.set(tag, buildConversationQuestionsTopicHtml(tag, items, groups));
    entries.push({ url: `${CONVERSATION_QUESTIONS_PATH}/${tag}`, lastmod: latest(items) });
  }
  if (topics.size) {
    entries.unshift({ url: CONVERSATION_QUESTIONS_PATH, lastmod: latest([...groups.values()].flat()) });
  }
  return { hub: buildConversationQuestionsHubHtml(groups), topics, entries };
}

// ---------------------------------------------------------------------------
// In-memory cache (10 minutes). One query loads every public lesson with content.
// ---------------------------------------------------------------------------

let cached: { builtAt: number; pages: ConversationQuestionPages } | null = null;
let inFlight: Promise<ConversationQuestionPages> | null = null;

export function clearConversationQuestionsCache(): void {
  cached = null;
  inFlight = null;
}

async function loadPages(): Promise<ConversationQuestionPages> {
  if (cached && Date.now() - cached.builtAt < CACHE_MS) return cached.pages;
  inFlight ??= (async () => {
    try {
      const lessons = (await storage.getPublicLessonsWithContent()) as QuestionLesson[];
      const pages = buildConversationQuestionPages(lessons);
      cached = { builtAt: Date.now(), pages };
      return pages;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/**
 * The HTML for /conversation-questions (no tag) or /conversation-questions/:tag.
 * Returns null (a 404) for an unknown tag or a tag with no lessons that have questions.
 * Throws when the lessons cannot be loaded (the route answers 503).
 */
export async function getConversationQuestionsPage(tag?: string): Promise<string | null> {
  if (tag !== undefined && !isPublicLessonTag(tag)) return null;
  const pages = await loadPages();
  if (tag === undefined) return pages.topics.size ? pages.hub : null;
  return pages.topics.get(tag as PublicLessonTag) ?? null;
}

/** Sitemap entries for the conversation question pages. Empty when the lessons cannot be loaded. */
export async function getConversationQuestionSitemapEntries(): Promise<Array<{ url: string; lastmod?: string }>> {
  try {
    return (await loadPages()).entries;
  } catch (error) {
    console.error('Conversation questions sitemap entries unavailable:', error);
    return [];
  }
}
