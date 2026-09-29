import { storage } from './storage';
import { PUBLIC_LIBRARY_LABELS } from '@shared/schema';

/**
 * Server-side prerender of public lesson pages (/lessons/:id) and the public
 * lesson browse pages (/esl-lessons and /esl-lessons/:level).
 *
 * Same approach as server/blog-prerender.ts: static, semantic HTML plus real
 * <head> metadata and JSON-LD is injected into the served index.html so search
 * engines and AI assistants can read a lesson without running JavaScript. When
 * the React app mounts, createRoot() replaces this placeholder markup.
 *
 * Only lessons with isPublic = true are indexable. Lessons that are only
 * shared by private link (isShared) are served with `noindex`.
 */

const BASE_URL = 'https://planwiseesl.com';

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export const CEFR_LEVEL_NAMES: Record<string, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper Intermediate',
  C1: 'Advanced',
  C2: 'Proficiency',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const e = escapeHtml;

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);

function categoryLabel(category: string | null | undefined): string {
  if (!category) return '';
  return (PUBLIC_LIBRARY_LABELS as Record<string, string>)[category] || '';
}

/** JSON for a <script type="application/ld+json"> block; '<' is escaped so content cannot close the tag. */
function jsonLd(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

/** Minimal standalone styling so a no-JavaScript fetch is readable (not for the hydrated app). */
export const lessonPrerenderCss = `
#lesson-prerender { font-family: 'Open Sans', Arial, sans-serif; color: #051d40; background: #fdfdfd; line-height: 1.6; }
#lesson-prerender .lp-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #eee; }
#lesson-prerender .lp-header nav a { margin-left: 16px; color: #051d40; }
#lesson-prerender .lp-main { max-width: 820px; margin: 0 auto; padding: 48px 24px; }
#lesson-prerender h1 { font-size: 2.1rem; line-height: 1.2; }
#lesson-prerender h2 { margin-top: 2rem; }
#lesson-prerender .lp-meta { color: #555; font-size: 0.95rem; }
#lesson-prerender .lp-tag { display: inline-block; background: #f4f4f4; border-radius: 6px; padding: 2px 10px; font-size: 0.8rem; margin-right: 6px; }
#lesson-prerender .lp-card { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 20px; margin-bottom: 14px; }
#lesson-prerender .lp-card h3 { margin: 0 0 6px; font-size: 1.15rem; }
#lesson-prerender .lp-cta { background: #f8f5ec; border-radius: 12px; padding: 20px; margin-top: 2rem; }
#lesson-prerender a { color: #b8912a; }
`;

function headerHtml(): string {
  return `<header class="lp-header">
    <strong><a href="/">PLAN WISE ESL</a></strong>
    <nav>
      <a href="/esl-lessons">Free ESL Lessons</a>
      <a href="/blog">Blog</a>
      <a href="/auth">Login</a>
      <a href="/auth?register=true">Sign Up Free</a>
    </nav>
  </header>`;
}

// ---------------------------------------------------------------------------
// <head> handling
// ---------------------------------------------------------------------------

interface HeadOptions {
  title: string;
  description: string;
  canonicalPath: string;
  indexable: boolean;
  ogType: 'website' | 'article';
  structuredData: unknown[];
}

/** Replaces the content of an existing <meta> tag in the template, if present. */
function setMetaContent(html: string, attr: 'name' | 'property', key: string, value: string): string {
  const pattern = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  return pattern.test(html) ? html.replace(pattern, (_m, a, b) => `${a}${e(value)}${b}`) : html;
}

function injectPage(template: string, head: HeadOptions, bodyHtml: string): string {
  let html = template;

  const robots = head.indexable
    ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    : 'noindex, nofollow';
  const canonical = `${BASE_URL}${head.canonicalPath}`;

  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${e(head.title)}</title>
    <meta name="description" content="${e(head.description)}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${e(canonical)}" />`,
  );

  // The template carries site-wide social tags; point them at this page instead.
  html = setMetaContent(html, 'property', 'og:title', head.title);
  html = setMetaContent(html, 'property', 'og:description', head.description);
  html = setMetaContent(html, 'property', 'og:url', canonical);
  html = setMetaContent(html, 'property', 'og:type', head.ogType);
  html = setMetaContent(html, 'name', 'twitter:title', head.title);
  html = setMetaContent(html, 'name', 'twitter:description', head.description);

  const extraHead = `${head.structuredData.map(jsonLd).join('\n    ')}
    <style>${lessonPrerenderCss}</style>`;
  html = html.replace('</head>', `    ${extraHead}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  return html;
}

// ---------------------------------------------------------------------------
// Lesson page
// ---------------------------------------------------------------------------

interface LessonForPrerender {
  id: number;
  title: string;
  topic: string;
  cefrLevel: string;
  category: string | null;
  publicCategory: string | null;
  content: unknown;
  createdAt: Date | string;
}

function sectionsOf(content: unknown): any[] {
  if (content && typeof content === 'object') return arr((content as any).sections);
  return [];
}

function questionText(q: unknown): string {
  if (typeof q === 'string') return q.trim();
  if (q && typeof q === 'object') return str((q as any).question);
  return '';
}

function listHtml(items: string[], ordered = false): string {
  const clean = items.filter(Boolean);
  if (!clean.length) return '';
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${clean.map((i) => `<li>${e(i)}</li>`).join('')}</${tag}>`;
}

/** Turns lesson sections into crawlable HTML. Skips anything it does not recognise. */
function sectionsHtml(sections: any[]): string {
  const out: string[] = [];

  for (const s of sections) {
    if (!s || typeof s !== 'object') continue;
    const title = str(s.title);
    const heading = (fallback: string) => `<h2>${e(title || fallback)}</h2>`;

    switch (s.type) {
      case 'warmup':
      case 'warm-up': {
        out.push(
          `<section>${heading('Warm-up')}${s.content ? `<p>${e(str(s.content))}</p>` : ''}${listHtml(arr(s.questions).map(questionText), true)}</section>`,
        );
        break;
      }
      case 'reading': {
        const paras = arr(s.paragraphs).map(str).filter(Boolean);
        if (!paras.length) break;
        out.push(
          `<section>${heading('Reading')}${s.introduction ? `<p><em>${e(str(s.introduction))}</em></p>` : ''}${paras.map((p) => `<p>${e(p)}</p>`).join('')}</section>`,
        );
        break;
      }
      case 'vocabulary': {
        const words = arr(s.words).filter((w) => w && str(w.term));
        if (!words.length) break;
        const items = words
          .map((w) => {
            const pos = str(w.partOfSpeech);
            const def = str(w.definition) || str(w.coreDefinition);
            const example = str(w.example) || str(w.levelAppropriateExample);
            return `<div class="lp-card"><h3>${e(str(w.term))}${pos ? ` <span class="lp-meta">(${e(pos)})</span>` : ''}</h3>${def ? `<p>${e(def)}</p>` : ''}${example ? `<p><em>${e(example)}</em></p>` : ''}</div>`;
          })
          .join('');
        out.push(`<section>${heading('Key Vocabulary')}${items}</section>`);
        break;
      }
      case 'comprehension':
      case 'quiz':
      case 'assessment': {
        // Questions and options only: answers stay inside the app.
        const qs = arr(s.questions).filter((q) => q && typeof q === 'object' && str(q.question));
        if (!qs.length) break;
        const items = qs
          .map((q) => {
            const options = listHtml(arr(q.options).map(str));
            return `<li>${e(str(q.question))}${options}</li>`;
          })
          .join('');
        out.push(`<section>${heading(s.type === 'comprehension' ? 'Reading Comprehension' : 'Quiz')}<ol>${items}</ol></section>`);
        break;
      }
      case 'discussion':
      case 'speaking': {
        const qs = arr(s.questions).map(questionText).filter(Boolean);
        if (!qs.length) break;
        out.push(`<section>${heading('Discussion Questions')}${listHtml(qs, true)}</section>`);
        break;
      }
      case 'sentenceFrames':
      case 'grammar': {
        const frames = arr(s.frames).filter((f) => f && (str(f.patternTemplate) || str(f.title)));
        if (!frames.length) break;
        const items = frames
          .map((f) => {
            const fn = str(f.languageFunction);
            return `<li><strong>${e(str(f.patternTemplate) || str(f.title))}</strong>${fn ? ` &mdash; ${e(fn)}` : ''}</li>`;
          })
          .join('');
        out.push(`<section>${heading('Speaking Patterns')}${s.introduction ? `<p>${e(str(s.introduction))}</p>` : ''}<ul>${items}</ul></section>`);
        break;
      }
      case 'cloze': {
        const text = str(s.text).replace(/\[\d+:[^\]]*\]/g, '_____');
        if (!text) break;
        const bank = arr(s.wordBank).map(str).filter(Boolean);
        out.push(`<section>${heading('Fill in the Blanks')}<p>${e(text)}</p>${bank.length ? `<p><strong>Word bank:</strong> ${e(bank.join(', '))}</p>` : ''}</section>`);
        break;
      }
      default:
        break;
    }
  }

  return out.join('\n');
}

/** Short, accurate summary of what a lesson contains, built from its real sections. */
function describeLesson(lesson: LessonForPrerender, sections: any[]): string {
  const has = (...types: string[]) => sections.some((s) => s && types.includes(s.type));
  const vocab = sections.find((s) => s && s.type === 'vocabulary');
  const vocabCount = vocab ? arr(vocab.words).length : 0;

  const parts: string[] = [];
  if (vocabCount) parts.push(`${vocabCount} vocabulary words`);
  if (has('reading')) parts.push('a reading text');
  if (has('comprehension', 'quiz')) parts.push('comprehension questions');
  if (has('discussion', 'speaking')) parts.push('discussion questions');
  if (has('sentenceFrames', 'grammar')) parts.push('speaking patterns');

  const levelName = CEFR_LEVEL_NAMES[lesson.cefrLevel];
  const levelText = `${lesson.cefrLevel}${levelName ? ` (${levelName})` : ''}`;
  const includes = parts.length ? ` Includes ${parts.slice(0, -1).join(', ')}${parts.length > 1 ? ' and ' : ''}${parts[parts.length - 1]}.` : '';
  return truncate(`Free ${levelText} ESL lesson on ${lesson.topic}.${includes} Ready to use with your students.`, 160);
}

function toIsoDate(value: Date | string): string {
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

export function buildLessonPageHtml(lesson: LessonForPrerender, sections: any[]): string {
  const level = lesson.cefrLevel;
  const levelName = CEFR_LEVEL_NAMES[level];
  const label = categoryLabel(lesson.publicCategory || lesson.category);
  return `<div id="lesson-prerender">
  ${headerHtml()}
  <main class="lp-main">
    <nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/esl-lessons">ESL Lessons</a> &rsaquo; <a href="/esl-lessons/${e(level.toLowerCase())}">${e(level)}</a> &rsaquo; ${e(lesson.title)}</nav>
    <article>
      <header>
        <h1>${e(lesson.title)}</h1>
        <p class="lp-meta"><span class="lp-tag">CEFR ${e(level)}${levelName ? ` &middot; ${e(levelName)}` : ''}</span>${label ? `<span class="lp-tag">${e(label)}</span>` : ''}<span class="lp-tag">Topic: ${e(lesson.topic)}</span></p>
      </header>
      ${sectionsHtml(sections)}
    </article>
    <aside class="lp-cta">
      <h2>Use this lesson with your students</h2>
      <p>PlanWise ESL creates complete, CEFR-levelled ESL lessons on any topic in minutes. <a href="/auth?register=true">Sign up free</a> to copy this lesson, edit it, or generate your own.</p>
    </aside>
  </main>
</div>`;
}

async function prerenderLesson(template: string, id: number): Promise<string | null> {
  const lesson = (await storage.getLesson(id)) as (LessonForPrerender & { isPublic: boolean; isShared: boolean }) | undefined;
  if (!lesson || (!lesson.isPublic && !lesson.isShared)) return null;

  const sections = sectionsOf(lesson.content);
  const description = describeLesson(lesson, sections);
  const canonicalPath = `/lessons/${lesson.id}`;
  const indexable = !!lesson.isPublic;
  const levelName = CEFR_LEVEL_NAMES[lesson.cefrLevel];
  const label = categoryLabel(lesson.publicCategory || lesson.category);
  const published = toIsoDate(lesson.createdAt);

  const structuredData: unknown[] = [];
  if (indexable) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: lesson.title,
      description,
      url: `${BASE_URL}${canonicalPath}`,
      inLanguage: 'en',
      learningResourceType: 'Lesson plan',
      educationalLevel: `CEFR ${lesson.cefrLevel}${levelName ? ` (${levelName})` : ''}`,
      teaches: lesson.topic,
      ...(label ? { about: label } : {}),
      audience: { '@type': 'EducationalAudience', educationalRole: 'teacher' },
      isAccessibleForFree: true,
      ...(published ? { datePublished: published } : {}),
      publisher: { '@type': 'Organization', name: 'PlanwiseESL', url: BASE_URL },
    });
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'ESL Lessons', item: `${BASE_URL}/esl-lessons` },
        { '@type': 'ListItem', position: 3, name: lesson.cefrLevel, item: `${BASE_URL}/esl-lessons/${lesson.cefrLevel.toLowerCase()}` },
        { '@type': 'ListItem', position: 4, name: lesson.title, item: `${BASE_URL}${canonicalPath}` },
      ],
    });
  }

  return injectPage(
    template,
    {
      title: `${lesson.title} | ${lesson.cefrLevel} ESL Lesson | PlanWise ESL`,
      description,
      canonicalPath,
      indexable,
      ogType: 'article',
      structuredData,
    },
    buildLessonPageHtml(lesson, sections),
  );
}

// ---------------------------------------------------------------------------
// Browse pages: /esl-lessons and /esl-lessons/:level
// ---------------------------------------------------------------------------

export interface LessonSummary {
  id: number;
  title: string;
  topic: string;
  cefrLevel: string;
  publicCategory: string | null;
  createdAt: Date | string;
}

function lessonCardHtml(l: LessonSummary): string {
  const label = categoryLabel(l.publicCategory);
  return `<article class="lp-card">
        <h3><a href="/lessons/${l.id}">${e(l.title)}</a></h3>
        <p class="lp-meta"><span class="lp-tag">${e(l.cefrLevel)}</span>${label ? `<span class="lp-tag">${e(label)}</span>` : ''} Topic: ${e(l.topic)}</p>
      </article>`;
}

function levelLinksHtml(current?: string): string {
  const links = CEFR_LEVELS.map((lv) =>
    lv === current
      ? `<strong>${lv} ${e(CEFR_LEVEL_NAMES[lv])}</strong>`
      : `<a href="/esl-lessons/${lv.toLowerCase()}">${lv} ${e(CEFR_LEVEL_NAMES[lv])}</a>`,
  );
  return `<p>${links.join(' &middot; ')}</p>`;
}

export function buildLessonIndexHtml(lessons: LessonSummary[], level?: string): string {
  const levelName = level ? CEFR_LEVEL_NAMES[level] : '';
  const heading = level ? `${level} (${levelName}) ESL Lessons` : 'Free ESL Lessons by CEFR Level';
  const intro = level
    ? `Ready-to-teach ${level} ${levelName.toLowerCase()} ESL lessons. Each one includes vocabulary, a reading text, comprehension and discussion activities.`
    : 'Browse ready-to-teach ESL lessons for every CEFR level from A1 to C2. Each lesson includes vocabulary, a reading text, comprehension and discussion activities.';

  let listing: string;
  if (level) {
    listing = lessons.map(lessonCardHtml).join('\n');
  } else {
    listing = CEFR_LEVELS.map((lv) => {
      const inLevel = lessons.filter((l) => l.cefrLevel === lv);
      if (!inLevel.length) return '';
      return `<section><h2><a href="/esl-lessons/${lv.toLowerCase()}">${lv} ${e(CEFR_LEVEL_NAMES[lv])}</a></h2>${inLevel.map(lessonCardHtml).join('\n')}</section>`;
    }).join('\n');
  }

  return `<div id="lesson-prerender">
  ${headerHtml()}
  <main class="lp-main">
    <nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; ${level ? `<a href="/esl-lessons">ESL Lessons</a> &rsaquo; ${e(level)}` : 'ESL Lessons'}</nav>
    <h1>${e(heading)}</h1>
    <p>${e(intro)}</p>
    ${levelLinksHtml(level)}
    ${listing}
    <aside class="lp-cta">
      <h2>Need a lesson on a different topic?</h2>
      <p>PlanWise ESL generates a complete lesson on any topic at any CEFR level in minutes. <a href="/auth?register=true">Sign up free</a>.</p>
    </aside>
  </main>
</div>`;
}

async function prerenderLessonIndex(template: string, level?: string): Promise<string | null> {
  const lessons = (await storage.getPublicLessonSummaries(level)) as LessonSummary[];
  // A level with no lessons yet still renders (so the level buttons never dead-end)
  // but is kept out of search results.
  const hasLessons = lessons.length > 0;

  const levelName = level ? CEFR_LEVEL_NAMES[level] : '';
  const title = level
    ? `${level} (${levelName}) ESL Lessons - Free Lesson Plans | PlanWise ESL`
    : 'Free ESL Lessons by CEFR Level (A1-C2) | PlanWise ESL';
  const description = level
    ? `Browse ${lessons.length} free ${level} ${levelName.toLowerCase()} ESL lessons with vocabulary, reading texts, comprehension and discussion questions.`
    : `Browse ${lessons.length} free ESL lessons for every CEFR level from A1 to C2, with vocabulary, reading texts and discussion questions.`;
  const canonicalPath = level ? `/esl-lessons/${level.toLowerCase()}` : '/esl-lessons';

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: `${BASE_URL}${canonicalPath}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: lessons.slice(0, 100).map((l, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${BASE_URL}/lessons/${l.id}`,
        name: l.title,
      })),
    },
  };

  return injectPage(
    template,
    {
      title,
      description: truncate(description, 160),
      canonicalPath,
      indexable: hasLessons,
      ogType: 'website',
      structuredData: hasLessons ? [itemList] : [],
    },
    buildLessonIndexHtml(lessons, level),
  );
}

/**
 * Returns the template with prerendered content + meta injected when pathname
 * is a public lesson page or one of the browse pages. Returns null for any
 * other path, or when the lesson/level is missing (callers fall through to the
 * SPA shell). Never throws: on DB errors it returns null so the page still serves.
 */
export async function injectLessonPrerender(template: string, pathname: string): Promise<string | null> {
  try {
    const lessonMatch = pathname.match(/^\/lessons\/(\d+)\/?$/);
    if (lessonMatch) return await prerenderLesson(template, parseInt(lessonMatch[1], 10));

    if (pathname === '/esl-lessons' || pathname === '/esl-lessons/') {
      return await prerenderLessonIndex(template);
    }

    const levelMatch = pathname.match(/^\/esl-lessons\/([a-zA-Z0-9]+)\/?$/);
    if (levelMatch) {
      const level = levelMatch[1].toUpperCase();
      if (!(CEFR_LEVELS as readonly string[]).includes(level)) return null;
      return await prerenderLessonIndex(template, level);
    }

    return null;
  } catch (error) {
    console.error('Error prerendering lesson page:', error);
    return null;
  }
}
