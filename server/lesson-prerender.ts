import { storage } from './storage';
import { lessonPath } from '@shared/lesson-url';
import { PUBLIC_LIBRARY_LABELS } from '@shared/schema';
import { tryDecodeLessonContent } from '@shared/lesson-content';
import { CEFR_LEVEL_NAMES, lessonContentsParts, joinList, levelText, lessonPublicMetadata, publicLessonRemixHref } from '@shared/lesson-public-metadata';
import { expressionItemsOf, withoutMarks } from '@shared/lesson-expressions';
import { publicNav } from '@shared/marketing-pages';
import { founderPerson, freeLessonLicence } from '@shared/site-facts';
import { lessonStages, lessonTeaches, lessonDesign, lessonDifference, libraryDesign, freeLibraryTeachingGuide, freeLibraryFaq, soloLearnerAiGuide } from '@shared/lesson-pedagogy';
import {
  PUBLIC_LESSON_TAGS,
  PUBLIC_LESSON_TAG_DESCRIPTIONS,
  FEATURED_SEASONAL_TAGS,
  isPublicLessonTag,
  publicTags,
  type PublicLessonTag,
} from '@shared/public-lesson-tags';
import { tutorLinkFor } from '@shared/tutor-link';
import {
  LEVEL_TEACHING_NOTES,
  hasLevelTopicPage,
  levelTopicCount,
  levelTopicCounts,
  levelTopicDescription,
  levelTopicPath,
  levelTopicTitle,
  parseLevelTopicPath,
  relatedLessonGroups,
  themeHrefFor,
  type CefrLevel,
} from '@shared/library-browse';
export { CEFR_LEVEL_NAMES } from '@shared/lesson-public-metadata';

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

export function escapeHtml(str: string): string {
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

/** A sentence frame's levels of support, simplest first. */
const FRAME_TIERS = ['emerging', 'developing', 'expanding'] as const;

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
#lesson-prerender .lp-word-img { display: block; max-width: 100%; width: 320px; height: auto; border-radius: 8px; margin: 8px 0; }
#lesson-prerender .lp-muted { color: #888; }
#lesson-prerender .lp-related h3 { font-size: 1.05rem; margin: 16px 0 6px; }
#lesson-prerender .lp-cta { background: #f8f5ec; border-radius: 12px; padding: 20px; margin-top: 2rem; }
#lesson-prerender table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.92rem; }
#lesson-prerender th, #lesson-prerender td { border: 1px solid #e5e5e5; padding: 8px 10px; text-align: left; vertical-align: top; }
#lesson-prerender th { background: #051d40; color: #fff; }
#lesson-prerender a { color: #b8912a; }
`;

function headerHtml(): string {
  return `<header class="lp-header">
    <strong><a href="/">PlanWise ESL</a></strong>
    <nav>
      ${publicNav.map((l) => `<a href="${l.href}">${l.label}</a>`).join('\n      ')}
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
  imagePath?: string;
  imageAlt?: string;
  structuredData: unknown[];
}

/** Replace all copies and insert missing tags, regardless of attribute order or quoting. */
function setMetaContent(html: string, attr: 'name' | 'property', key: string, value: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\s${attr}\\s*=\\s*(?:"${escapedKey}"|'${escapedKey}'|${escapedKey}(?=\\s|/?>)))[^>]*>\\s*`, 'gi');
  return html.replace(pattern, '').replace(/<\/head>/i, `<meta ${attr}="${key}" content="${e(value)}" />\n</head>`);
}

function injectPage(template: string, head: HeadOptions, bodyHtml: string): string {
  let html = template;

  const robots = head.indexable
    ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    : 'noindex, nofollow';
  const canonical = `${BASE_URL}${head.canonicalPath}`;

  html = html
    .replace(/<meta\b(?=[^>]*\sname\s*=\s*["']?(?:description|robots)(?=["'\s/>]))[^>]*>\s*/gi, '')
    .replace(/<link\b(?=[^>]*\srel\s*=\s*["']?canonical(?=["'\s/>]))[^>]*>\s*/gi, '');
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
  html = setMetaContent(html, 'name', 'twitter:url', canonical);
  if (head.imagePath) {
    const image = `${BASE_URL}${head.imagePath}`;
    // Lesson images can be PNG or JPEG with their original aspect ratio.
    // Do not keep the homepage's incorrect image dimensions or MIME type.
    html = html.replace(/<meta\b(?=[^>]*\sproperty\s*=\s*["']?og:image:(?:width|height|type|secure_url)(?=["'\s/>]))[^>]*>\s*/gi, '');
    html = setMetaContent(html, 'property', 'og:image', image);
    html = setMetaContent(html, 'property', 'og:image:alt', head.imageAlt || head.title);
    html = setMetaContent(html, 'name', 'twitter:image', image);
    html = setMetaContent(html, 'name', 'twitter:image:alt', head.imageAlt || head.title);
    html = setMetaContent(html, 'name', 'twitter:card', 'summary_large_image');
  }

  const extraHead = `${head.structuredData.map(jsonLd).join('\n    ')}
    <style>${lessonPrerenderCss}</style>`;
  html = html.replace('</head>', `    ${extraHead}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  return html;
}

// ---------------------------------------------------------------------------
// Lesson page
// ---------------------------------------------------------------------------

// The lesson's `topic` (the teacher's original request) is deliberately not
// used anywhere on public pages: it can describe a real student.
interface LessonForPrerender {
  id: number;
  publicSlug?: string | null;
  publicLevel?: string | null;
  title: string;
  cefrLevel: string;
  isPublic?: boolean;
  category: string | null;
  publicCategory: string | null;
  tags?: string[] | null;
  content: unknown;
  createdAt: Date | string;
}

/**
 * Lesson rows reach the prerender already decoded by the lessons.content
 * column type; tryDecodeLessonContent also accepts raw stored text. Never
 * throws; returns null when nothing usable is found.
 */
const parseContent = tryDecodeLessonContent;

export function sectionsOf(content: unknown): any[] {
  return arr(parseContent(content)?.sections);
}

/** Estimated lesson length in minutes, when the content records one. */
function estimatedMinutesOf(content: unknown): number | null {
  const parsed = parseContent(content);
  if (!parsed) return null;
  const candidates = [parsed.estimatedTime, parsed.lesson?.time, parsed.time, parsed.duration];
  for (const c of candidates) {
    const n = typeof c === 'number' ? c : typeof c === 'string' ? parseInt(c, 10) : NaN;
    if (Number.isFinite(n) && n > 0 && n <= 600) return Math.round(n);
  }
  return null;
}

export function questionText(q: unknown): string {
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
/** A picture the app stored for this lesson; the image route serves it to anyone while the lesson is public. */
function storedLessonImageUrl(url: unknown, lessonId: number): string | null {
  if (typeof url !== 'string') return null;
  const match = url.match(/^\/api\/images\/lesson-images\/(\d+)\/[a-zA-Z0-9_-]+\.(?:png|jpg)$/);
  return match && Number(match[1]) === lessonId ? url : null;
}

export interface SectionsHtmlOptions {
  /** Show the vocabulary pictures stored for this public lesson as real <img> tags. */
  imagesForLessonId?: number;
}

export function sectionsHtml(sections: any[], options: SectionsHtmlOptions = {}): string {
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
        const words = arr(s.words).filter((w) => w && (str(w.term) || str(w.word)));
        if (!words.length) break;
        const listOf = (v: unknown): string[] =>
          Array.isArray(v)
            ? v.map(str).filter(Boolean)
            : typeof v === 'string'
              ? v.split(',').map((x) => x.trim()).filter(Boolean)
              : [];
        const items = words
          .map((w) => {
            const label = str(w.term) || str(w.word);
            const pos = str(w.partOfSpeech);
            const pron =
              typeof w.pronunciation === 'string'
                ? str(w.pronunciation)
                : str(w.pronunciation?.value) || str(w.pronunciation?.ipa) || str(w.pronunciation?.phoneticGuide) || str(w.phoneticGuide);
            const def = str(w.definition) || str(w.coreDefinition);
            const example = str(w.example) || str(w.levelAppropriateExample);
            const moreExamples = arr(w.additionalExamples).map(str).filter(Boolean).slice(0, 3);
            const family = listOf(w.wordFamily?.words);
            const collocations = listOf(w.collocations);
            const usage = str(w.usageNotes);
            const synonyms = listOf(w.semanticMap?.synonyms);
            const antonyms = listOf(w.semanticMap?.antonyms);
            const related = listOf(w.semanticMap?.relatedConcepts);
            const contexts = listOf(w.semanticMap?.contexts);
            const image = options.imagesForLessonId ? storedLessonImageUrl(w.imageUrl, options.imagesForLessonId) : null;
            const imageHtml = image
              ? `<img class="lp-word-img" src="${e(image)}" alt="${e(`Picture for the word “${label}”`)}" loading="lazy" decoding="async" />`
              : '';
            return `<div class="lp-card"><h3>${e(label)}${pos ? ` <span class="lp-meta">(${e(pos)})</span>` : ''}${pron ? ` <span class="lp-meta">${e(pron)}</span>` : ''}</h3>${imageHtml}${def ? `<p>${e(def)}</p>` : ''}${example ? `<p><em>${e(example)}</em></p>` : ''}${moreExamples.length ? `<p><strong>More examples:</strong> ${e(moreExamples.join(' • '))}</p>` : ''}${collocations.length ? `<p><strong>Common collocations:</strong> ${e(collocations.join(', '))}</p>` : ''}${family.length ? `<p><strong>Word family:</strong> ${e(family.join(', '))}</p>` : ''}${synonyms.length ? `<p><strong>Synonyms:</strong> ${e(synonyms.join(', '))}</p>` : ''}${antonyms.length ? `<p><strong>Antonyms:</strong> ${e(antonyms.join(', '))}</p>` : ''}${related.length ? `<p><strong>Related concepts:</strong> ${e(related.join(', '))}</p>` : ''}${contexts.length ? `<p><strong>Contexts:</strong> ${e(contexts.join(', '))}</p>` : ''}${usage ? `<p><strong>Usage note:</strong> ${e(usage)}</p>` : ''}</div>`;
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
        const items = arr(s.questions)
          .map((item) => {
            const q = questionText(item);
            if (!q) return '';
            const ctx = item && typeof item === 'object' ? str((item as any).paragraphContext) : '';
            return ctx ? `<li><p>${e(ctx)}</p><p><strong>${e(q)}</strong></p></li>` : `<li>${e(q)}</li>`;
          })
          .filter(Boolean);
        if (!items.length) break;
        out.push(`<section>${heading('Discussion Questions')}<ol>${items.join('')}</ol></section>`);
        break;
      }
      case 'sentenceFrames':
      case 'grammar': {
        // Like the lesson page: current lessons ("v2_pedagogical") keep each
        // frame's three levels of support in pedagogicalFrames; older lessons
        // keep pattern templates in frames.
        const tierLabels: Record<(typeof FRAME_TIERS)[number], string> = {
          emerging: 'Emerging',
          developing: 'Developing',
          expanding: 'Expanding',
        };
        const tiered = s.version === 'v2_pedagogical'
          ? arr(s.pedagogicalFrames)
            .map((f) => ({
              fn: str(f?.languageFunction),
              frames: FRAME_TIERS.map((tier) => {
                const frame = str(f?.tieredFrames?.[tier]?.frame);
                if (!frame) return '';
                const model = arr(f?.modelResponses?.[tier]).map(str).find(Boolean) || '';
                return `<li><strong>${e(tierLabels[tier])}:</strong> ${e(frame)}${model ? ` &mdash; <em>${e(model)}</em>` : ''}</li>`;
              }).filter(Boolean),
            }))
            .filter((f) => f.frames.length)
          : [];
        const frames = arr(s.frames).filter((f) => f && (str(f.patternTemplate) || str(f.title)));
        if (!tiered.length && !frames.length) break;
        const items = tiered.length
          ? tiered.map((f) => `<li>${f.fn ? `<strong>${e(f.fn)}</strong>` : ''}<ul>${f.frames.join('')}</ul></li>`).join('')
          : frames
            .map((f) => {
              const fn = str(f.languageFunction);
              return `<li><strong>${e(str(f.patternTemplate) || str(f.title))}</strong>${fn ? ` &mdash; ${e(fn)}` : ''}</li>`;
            })
            .join('');
        out.push(`<section>${heading('Speaking Patterns')}${s.introduction ? `<p>${e(str(s.introduction))}</p>` : ''}<ul>${items}</ul></section>`);
        break;
      }
      case 'expressions': {
        const items = expressionItemsOf(s);
        if (!items.length) break;
        const cards = items
          .map((x) => {
            const notesHtml = x.notes
              .slice(0, 2)
              .map((n) => {
                const parts: string[] = [];
                if (n.text) parts.push(e(n.text));
                if (n.right) parts.push(`Right: ${e(n.right)}`);
                if (n.wrong) parts.push(`Avoid: ${e(n.wrong)}`);
                return parts.length ? `<p><strong>Usage note:</strong> ${parts.join(' · ')}</p>` : '';
              })
              .join('');
            return `<div class="lp-card"><h3>${e(x.expression)} <span class="lp-meta">(${e(x.kind)})</span></h3><p>${e(x.meaning)}</p><p><em>${e(withoutMarks(x.example))}</em></p>${notesHtml}</div>`;
          })
          .join('');
        out.push(`<section>${heading('Idioms & Phrasal Verbs')}${cards}</section>`);
        break;
      }
      case 'cloze': {
        const text = str(s.text).replace(/\[\d+:[^\]]*\]/g, '_____');
        if (!text) break;
        const bank = arr(s.wordBank).map(str).filter(Boolean);
        out.push(`<section>${heading('Fill in the Blanks')}<p>${e(text)}</p>${bank.length ? `<p><strong>Word bank:</strong> ${e(bank.join(', '))}</p>` : ''}</section>`);
        break;
      }
      case 'sentenceUnscramble': {
        // Scrambled words only: correctSentence stays inside the app.
        const items = arr(s.sentences)
          .map((item) => arr(item?.words).map(str).filter(Boolean))
          .filter((words) => words.length > 0)
          .map((words) => words.join(' / '));
        if (!items.length) break;
        out.push(`<section>${heading('Sentence Unscramble')}${listHtml(items, true)}</section>`);
        break;
      }
      default:
        break;
    }
  }

  return out.join('\n');
}

/** The learner-facing line that links to the matching page on Dave's tutoring site (shared/tutor-link.ts). */
function tutorLinkSentenceHtml(lesson: LessonForPrerender): string {
  const link = tutorLinkFor(lesson);
  const anchor = `<a href="${e(link.href)}" rel="noopener noreferrer">${e(link.linkText)}</a>`;
  const intro = 'Created by Dave Jackson (British ESL teacher). These lessons are designed to be teacher-led.';
  return link.belowTaughtLevels
    ? `${intro} ${anchor}.`
    : `${intro} If you are an English learner: ${anchor}.`;
}

/** "About this lesson" paragraph, built only from the lesson's own data. */
function aboutLesson(lesson: LessonForPrerender, sections: any[]): string {
  const label = categoryLabel(lesson.publicCategory || lesson.category);
  const minutes = estimatedMinutesOf(lesson.content);
  const parts = lessonContentsParts(sections);
  const sentences = [
    `This is ${/^[AEIOU]/i.test(levelText(lesson.cefrLevel)) ? 'an' : 'a'} ${levelText(lesson.cefrLevel)} ESL lesson${label ? ` in the ${label} category` : ''}.`,
  ];
  if (minutes) sentences.push(`It takes about ${minutes} minutes.`);
  if (parts.length) sentences.push(`It includes ${joinList(parts)}.`);
  sentences.push('Suits one-to-one or small-group online classes.');
  sentences.push('Free to open and teach with no login, and it prints as a PDF.');
  return sentences.join(' ');
}

/** "How this lesson is built": the purpose of each stage this lesson has (shared with the React page). */
function lessonDesignHtml(content: unknown): string {
  const stages = lessonStages(content);
  if (stages.length < 3) return '';
  const difference = lessonDifference(stages, content);
  return `<section class="lp-design">
      <h2>${e(lessonDesign.heading)}</h2>
      <p>${e(lessonDesign.intro)}</p>
      <ol>${stages.map((s) => `<li><strong>${e(s.name)}:</strong> ${e(s.purpose)}</li>`).join('')}</ol>
      ${difference ? `<p>${e(difference)} ${e(lessonDesign.tracking)}</p>` : ''}
      <p><a href="${e(lessonDesign.href)}">${e(lessonDesign.linkLabel)}</a></p>
    </section>`;
}

export type RelatedLessons = ReturnType<typeof relatedLessonGroups<LessonSummary>>;

const noRelated = (): RelatedLessons => ({ sameLevel: [], otherLevels: [], browse: [] });

/**
 * "More like this": other lessons at this level (same theme first), the main
 * theme at other levels, and where to browse on. Omitted when the library has
 * nothing else to offer.
 */
function relatedLessonsHtml(level: string, related: RelatedLessons, mainTag?: PublicLessonTag): string {
  if (!related.sameLevel.length && !related.otherLevels.length) return '';
  const list = (items: LessonSummary[], withLevel: boolean) =>
    `<ul>${items.map((l) => `<li><a href="${e(lessonPath(l))}">${e(l.title)}</a>${withLevel ? ` (${e(l.cefrLevel)})` : ''}</li>`).join('')}</ul>`;
  return `<section class="lp-related">
      <h2>More like this</h2>
      ${related.sameLevel.length ? `<h3>More ${e(level)} lessons</h3>${list(related.sameLevel, false)}` : ''}
      ${related.otherLevels.length ? `<h3>${mainTag ? e(PUBLIC_LESSON_TAGS[mainTag]) : 'This theme'} at other levels</h3>${list(related.otherLevels, true)}` : ''}
      ${related.browse.length ? `<p>Browse: ${related.browse.map((b) => `<a href="${e(b.href)}">${e(b.label)}</a>`).join(' &middot; ')}</p>` : ''}
    </section>`;
}

/** Related lessons from the whole public library. Failures never block the page. */
async function relatedLessonsFor(lesson: LessonForPrerender): Promise<RelatedLessons> {
  try {
    const summaries = arr(await storage.getPublicLessonSummaries()) as LessonSummary[];
    return relatedLessonGroups(lesson, summaries.filter(Boolean));
  } catch (error) {
    console.warn(`[SEO] Could not load related lessons for lesson ${lesson.id}:`, error);
    return noRelated();
  }
}

function toIsoDate(value: Date | string): string {
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

export function buildLessonPageHtml(lesson: LessonForPrerender, sections: any[], related: RelatedLessons = noRelated()): string {
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
        <p class="lp-meta"><span class="lp-tag">CEFR ${e(level)}${levelName ? ` &middot; ${e(levelName)}` : ''}</span>${label ? `<span class="lp-tag">${e(label)}</span>` : ''}</p>
        <p class="lp-about"><strong>About this lesson:</strong> ${e(aboutLesson(lesson, sections))}</p>
      </header>
      ${lesson.isPublic ? `<aside class="lp-cta lp-remix"><p>Teaching <strong>${e(lesson.title)}</strong> to one student? Start from this title, choose the student in the generator, and PlanWise ESL makes a new version at their level that avoids words they've already learned. You can also change the CEFR level or adapt it to their job.</p><p><a href="${e(publicLessonRemixHref(lesson.title, level, false))}">Make this lesson for your student</a></p></aside>` : ''}
      ${lesson.isPublic && lesson.publicSlug && lesson.publicLevel ? `<p class="lp-print"><a href="${e(lessonQuestionsPath(lesson))}">Print just the discussion questions</a></p>` : ''}
      ${lessonDesignHtml(lesson.content)}
      ${sectionsHtml(sections, lesson.isPublic ? { imagesForLessonId: lesson.id } : {})}
      ${lesson.isPublic ? `<p class="lp-licence"><strong>${e(freeLessonLicence.heading)}:</strong> ${e(freeLessonLicence.short)} <a href="${e(freeLessonLicence.path)}">What you can do with free lessons</a>.</p>` : ''}
    </article>
    ${relatedLessonsHtml(level, related, publicTags(lesson.tags)[0])}
    ${lesson.isPublic ? `<aside class="lp-cta lp-vocab"><h2>Help students remember these words beyond today's lesson.</h2><p>Mark lessons complete from a student's page to add their vocabulary to spaced-repetition flashcards and recycle it in future lessons (<a href="/compare/student-memory-proof">see our live 4-lesson, 0-duplicate recycling proof</a>).</p><p><a href="/auth?register=true&amp;source=vocab-cta">Try PlanWise ESL free</a></p></aside>` : ''}
    <aside class="lp-cta">
      <h2>Use this lesson with your students</h2>
      <p>PlanWise ESL creates complete, CEFR-levelled ESL lessons on any topic in minutes. <a href="/auth?register=true">Sign up free</a> to copy this lesson, edit it, or generate your own.</p>
      <p>${tutorLinkSentenceHtml(lesson)}</p>
    </aside>
  </main>
</div>`;
}

// ---------------------------------------------------------------------------
// Discussion questions only: /esl-lessons/:level/:slug/questions (public lessons)
// ---------------------------------------------------------------------------

/** Path of the printable "discussion questions only" view of a public slug lesson. */
export function lessonQuestionsPath(lesson: { id: number; publicSlug?: string | null; publicLevel?: string | null }): string {
  return `${lessonPath(lesson)}/questions`;
}

const questionsViewCss = `
body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #111; background: #fff; line-height: 1.55; }
main { max-width: 720px; margin: 0 auto; padding: 24px; }
header.site { border-bottom: 1px solid #ddd; padding: 12px 24px; font-family: Arial, sans-serif; }
header.site a, nav.crumbs a, footer.site a { color: #051d40; }
nav.crumbs { font-family: Arial, sans-serif; font-size: 0.9rem; margin-bottom: 16px; }
h1 { font-size: 1.8rem; line-height: 1.25; margin: 0 0 8px; }
h2 { font-size: 1.25rem; margin: 1.8rem 0 0.6rem; break-after: avoid; }
.meta { color: #444; font-family: Arial, sans-serif; font-size: 0.95rem; }
li { margin-bottom: 0.9rem; break-inside: avoid; }
li p { margin: 0 0 0.3rem; }
ul.words { list-style: none; padding: 0; }
ul.words li { margin-bottom: 0.4rem; }
footer.site { border-top: 1px solid #ddd; margin-top: 2rem; padding: 12px 24px; font-family: Arial, sans-serif; font-size: 0.9rem; }
@media print {
  header.site, nav.crumbs, footer.site { display: none; }
  body { color: #000; background: #fff; font-size: 12pt; }
  main { max-width: none; padding: 0; }
  a { color: #000; text-decoration: none; }
  h2 { break-after: avoid; }
  li { break-inside: avoid; }
}
`;

/**
 * A plain, printable page with just the warm-up questions, the five key words
 * and the discussion questions of a public lesson. Reads the same section data
 * as the lesson page; quiz answers and explanations are never touched. Returns
 * a complete HTML document (it does not use the SPA template).
 */
export function buildLessonQuestionsHtml(lesson: LessonForPrerender, sections: any[]): string {
  const level = lesson.cefrLevel;
  const lessonUrl = `${BASE_URL}${lessonPath(lesson)}`;
  const lessonHref = lessonPath(lesson);

  const warmupQuestions = sections
    .filter((s) => s && (s.type === 'warmup' || s.type === 'warm-up'))
    .flatMap((s) => arr(s.questions).map(questionText))
    .filter(Boolean);

  const words = sections
    .filter((s) => s && s.type === 'vocabulary')
    .flatMap((s) => arr(s.words))
    .map((w) => ({
      label: str(w?.term) || str(w?.word),
      pos: str(w?.partOfSpeech),
      def: str(w?.definition) || str(w?.coreDefinition),
    }))
    .filter((w) => w.label)
    .slice(0, 5);

  const discussion = sections
    .filter((s) => s && (s.type === 'discussion' || s.type === 'speaking'))
    .flatMap((s) => arr(s.questions))
    .map((item) => ({
      q: questionText(item),
      ctx: item && typeof item === 'object' ? str((item as any).paragraphContext) : '',
    }))
    .filter((d) => d.q);

  const count = warmupQuestions.length + discussion.length;
  const title = `${lesson.title}: discussion questions (CEFR ${level}) | PlanWise ESL`;
  const description = `Printable discussion questions from the free PlanWise ESL lesson "${lesson.title}" (CEFR ${level}): warm-up questions, key words and ${discussion.length} discussion questions.`;

  const warmupHtml = warmupQuestions.length
    ? `<section><h2>Warm-up questions</h2>${listHtml(warmupQuestions, true)}</section>`
    : '';
  const wordsHtml = words.length
    ? `<section><h2>Key words</h2><ul class="words">${words
        .map((w) => `<li>${e(w.label)}${w.pos ? ` (${e(w.pos)})` : ''}${w.def ? `: ${e(w.def)}` : ''}</li>`)
        .join('')}</ul></section>`
    : '';
  const discussionHtml = discussion.length
    ? `<section><h2>Discussion questions</h2><ol>${discussion
        .map((d) => `<li>${d.ctx ? `<p>${e(d.ctx)}</p>` : ''}<p><strong>${e(d.q)}</strong></p></li>`)
        .join('')}</ol></section>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${e(title)}</title>
<meta name="description" content="${e(description)}" />
<meta name="robots" content="noindex, follow" />
<link rel="canonical" href="${e(lessonUrl)}" />
<style>${questionsViewCss}</style>
</head>
<body>
<header class="site"><strong><a href="/">PlanWise ESL</a></strong></header>
<main>
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/esl-lessons">ESL Lessons</a> &rsaquo; <a href="/esl-lessons/${e(level.toLowerCase())}">${e(level)}</a> &rsaquo; ${e(lesson.title)}</nav>
<h1>Discussion questions: ${e(lesson.title)}</h1>
<p class="meta">CEFR ${e(level)} &middot; ${count} questions &middot; from <a href="${e(lessonHref)}">the free lesson</a></p>
${warmupHtml}
${wordsHtml}
${discussionHtml}
<p class="meta">Full lesson, with the reading, exercises and quiz: <a href="${e(lessonHref)}">${e(lessonUrl)}</a></p>
</main>
<footer class="site"><a href="/">PlanWise ESL</a></footer>
</body>
</html>`;
}

/** Returns the printable questions page, or null when the lesson is not public. */
export function renderLessonQuestionsPage(lesson: LessonForPrerender | null | undefined): string | null {
  if (!lesson || !lesson.isPublic) return null;
  return buildLessonQuestionsHtml(lesson, sectionsOf(lesson.content));
}

async function prerenderLesson(template: string, id: number, preloaded?: unknown): Promise<string | null> {
  // Reuse the lesson the routes.ts existence check already loaded for this
  // request (saves a database round trip); otherwise fetch it.
  const reuse = preloaded && (preloaded as { id?: unknown }).id === id ? preloaded : undefined;
  const lesson = (reuse ?? (await storage.getLesson(id))) as (LessonForPrerender & { isPublic: boolean; isShared: boolean }) | undefined;
  if (!lesson || (!lesson.isPublic && !lesson.isShared)) return null;

  const sections = sectionsOf(lesson.content);
  const metadata = lessonPublicMetadata(lesson);
  const { description, canonicalPath } = metadata;
  let indexable = !!lesson.isPublic;
  if (indexable && sectionsHtml(sections).trim() === '') {
    // A lesson page with no lesson content is a soft 404; keep it out of the index.
    console.warn(`[SEO] Public lesson ${lesson.id} rendered zero sections - serving noindex`);
    indexable = false;
  }
  const related = await relatedLessonsFor(lesson);
  const levelName = CEFR_LEVEL_NAMES[lesson.cefrLevel];
  const label = categoryLabel(lesson.publicCategory || lesson.category);
  const published = toIsoDate(lesson.createdAt);

  const structuredData: unknown[] = [];
  const stages = lessonStages(lesson.content);
  const teaches = lessonTeaches(lesson.content);
  const minutes = estimatedMinutesOf(lesson.content);
  if (indexable) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: lesson.title,
      description,
      url: `${BASE_URL}${canonicalPath}`,
      inLanguage: 'en',
      learningResourceType: 'Lesson plan',
      educationalUse: 'Conversation lesson',
      educationalLevel: `CEFR ${lesson.cefrLevel}${levelName ? ` (${levelName})` : ''}`,
      educationalAlignment: {
        '@type': 'AlignmentObject',
        alignmentType: 'educationalLevel',
        educationalFramework: 'Common European Framework of Reference for Languages (CEFR)',
        targetName: lesson.cefrLevel,
      },
      author: founderPerson,
      teaches: teaches.length ? teaches : lesson.title,
      ...(minutes ? { timeRequired: `PT${minutes}M` } : {}),
      ...(stages.length
        ? { hasPart: stages.map((s, i) => ({ '@type': 'CreativeWork', position: i + 1, name: s.name, description: s.purpose })) }
        : {}),
      isBasedOn: `${BASE_URL}${lessonDesign.href}`,
      ...(label ? { about: label } : {}),
      audience: { '@type': 'EducationalAudience', educationalRole: 'teacher' },
      isAccessibleForFree: true,
      license: `${BASE_URL}${freeLessonLicence.path}`,
      usageInfo: `${BASE_URL}${freeLessonLicence.path}`,
      ...(published ? { datePublished: published } : {}),
      publisher: { '@type': 'Organization', name: 'PlanWise ESL', url: BASE_URL },
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
      title: metadata.title,
      description,
      canonicalPath,
      indexable,
      ogType: 'article',
      imagePath: metadata.imagePath,
      imageAlt: metadata.imageAlt,
      structuredData,
    },
    buildLessonPageHtml(lesson, sections, related),
  );
}

// ---------------------------------------------------------------------------
// Browse pages: /esl-lessons and /esl-lessons/:level
// ---------------------------------------------------------------------------

export interface LessonSummary {
  id: number;
  publicSlug?: string | null;
  publicLevel?: string | null;
  title: string;
  cefrLevel: string;
  publicCategory: string | null;
  tags?: string[] | null;
  createdAt: Date | string;
}

function lessonCardHtml(l: LessonSummary): string {
  const label = categoryLabel(l.publicCategory);
  return `<article class="lp-card">
        <h3><a href="${e(lessonPath(l))}">${e(l.title)}</a></h3>
        <p class="lp-meta"><span class="lp-tag">${e(l.cefrLevel)}</span>${label ? `<span class="lp-tag">${e(label)}</span>` : ''}</p>
      </article>`;
}

function levelLinksHtml(current?: string, topic?: PublicLessonTag, counts?: Map<string, number>): string {
  const links = CEFR_LEVELS.map((lv) => {
    const label = `${lv} ${e(CEFR_LEVEL_NAMES[lv])}`;
    if (lv === current) return `<strong>${label}</strong>`;
    if (topic && counts) {
      // Same theme at another level: only where that page exists.
      return hasLevelTopicPage(counts, lv, topic)
        ? `<a href="${e(levelTopicPath(lv, topic))}">${label} (${levelTopicCount(counts, lv, topic)})</a>`
        : `<span class="lp-muted">${label}</span>`;
    }
    return `<a href="/esl-lessons/${lv.toLowerCase()}">${label}</a>`;
  });
  const all = topic ? ` &middot; <a href="/esl-lessons/topics/${e(topic)}">All levels</a>` : '';
  return `<p>${links.join(' &middot; ')}${all}</p>`;
}

/**
 * Themes at one level, for a level page or a level-by-theme page: a link to
 * the level-by-theme page where it exists, otherwise to the all-levels hub.
 */
function levelThemeLinksHtml(level: string, allLessons: LessonSummary[], currentTopic?: PublicLessonTag): string {
  const counts = levelTopicCounts(allLessons);
  const entries = (Object.keys(PUBLIC_LESSON_TAGS) as PublicLessonTag[])
    .map((tag) => [tag, levelTopicCount(counts, level, tag)] as const)
    .filter(([tag, count]) => count > 0 && tag !== currentTopic)
    .sort((a, b) => b[1] - a[1] || PUBLIC_LESSON_TAGS[a[0]].localeCompare(PUBLIC_LESSON_TAGS[b[0]]));
  if (!entries.length) return '';
  const items = entries
    .map(([tag, count]) => `<a href="${e(themeHrefFor(counts, level, tag))}">${e(PUBLIC_LESSON_TAGS[tag])} (${count})</a>`)
    .join(' &middot; ');
  const heading = currentTopic ? `Other ${e(level)} themes` : `Browse ${e(level)} Lessons by Theme`;
  return `<section aria-label="${heading}"><h2>${heading}</h2><p>${items}</p></section>`;
}

function topicLinksHtml(lessons: LessonSummary[], currentTopic?: PublicLessonTag): string {
  const counts = new Map<PublicLessonTag, number>();
  for (const l of lessons) {
    for (const tag of publicTags(l.tags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const entries = Array.from(counts.entries()).sort((a, b) => {
    const aPinned = FEATURED_SEASONAL_TAGS.includes(a[0]) ? 0 : 1;
    const bPinned = FEATURED_SEASONAL_TAGS.includes(b[0]) ? 0 : 1;
    if (aPinned !== bPinned) return aPinned - bPinned;
    return b[1] - a[1] || PUBLIC_LESSON_TAGS[a[0]].localeCompare(PUBLIC_LESSON_TAGS[b[0]]);
  });
  if (!entries.length) return '';
  const items = entries
    .map(([tag, count]) =>
      tag === currentTopic
        ? `<strong>${e(PUBLIC_LESSON_TAGS[tag])} (${count})</strong>`
        : `<a href="/esl-lessons/topics/${e(tag)}">${e(PUBLIC_LESSON_TAGS[tag])} (${count})</a>`,
    )
    .join(' &middot; ');
  return `<section aria-label="Browse by theme"><h2>Browse Free Lessons by Theme</h2><p>${items}</p></section>`;
}

/** Link from the topic hub (and the main library page) to the "conversation questions" pages. */
function conversationQuestionsLinkHtml(level: string | undefined, topic: PublicLessonTag | undefined, topicLabel: string): string {
  if (level) return '';
  if (topic) {
    return `<p><a href="/conversation-questions/${e(topic)}">Conversation questions about ${e(topicLabel.toLowerCase())} &rarr;</a></p>`;
  }
  return '<p><a href="/conversation-questions">Conversation questions by topic &rarr;</a></p>';
}

export function buildLessonIndexHtml(
  lessons: LessonSummary[],
  level?: string,
  topic?: PublicLessonTag,
  allLessonsForThemes?: LessonSummary[],
): string {
  const levelName = level ? CEFR_LEVEL_NAMES[level] : '';
  const topicLabel = topic ? PUBLIC_LESSON_TAGS[topic] : '';
  const everything = allLessonsForThemes ?? lessons;
  const counts = levelTopicCounts(everything);
  const heading = level && topic
    ? levelTopicTitle(level, topic)
    : topic
      ? `Free ${topicLabel} ESL Lessons (A1–C2)`
      : level
        ? `${level} (${levelName}) ESL Lessons`
        : 'Free ESL Lessons by CEFR Level';
  const intro = level && topic
    ? `${lessons.length} free ${level} (${levelName.toLowerCase()}) ESL conversation lessons about ${topicLabel.toLowerCase()}, ready to teach with no login. ${LEVEL_TEACHING_NOTES[level as CefrLevel] ?? ''} ${libraryDesign}`
    : topic
      ? `${PUBLIC_LESSON_TAG_DESCRIPTIONS[topic]} ${libraryDesign}`
      : level
        ? `Ready-to-teach ${level} ${levelName.toLowerCase()} ESL conversation lessons. ${libraryDesign}`
        : `Browse ready-to-teach ESL conversation lessons for every CEFR level from A1 to C2. ${libraryDesign}`;

  let listing: string;
  if (level) {
    listing = lessons.map(lessonCardHtml).join('\n');
  } else {
    listing = CEFR_LEVELS.map((lv) => {
      const inLevel = lessons.filter((l) => l.cefrLevel === lv);
      if (!inLevel.length) return '';
      // On a theme hub, a level heading leads to that theme at that level when the page exists.
      const toLevelTopic = !!topic && hasLevelTopicPage(counts, lv, topic);
      const href = toLevelTopic ? levelTopicPath(lv, topic!) : `/esl-lessons/${lv.toLowerCase()}`;
      const text = toLevelTopic ? `${lv} ${e(topicLabel)} lessons (${inLevel.length})` : `${lv} ${e(CEFR_LEVEL_NAMES[lv])}`;
      return `<section><h2><a href="${e(href)}">${text}</a></h2>${inLevel.map(lessonCardHtml).join('\n')}</section>`;
    }).join('\n');
  }

  const themeSection = level
    ? levelThemeLinksHtml(level, everything, topic)
    : topicLinksHtml(everything, topic);

  const guideRows = freeLibraryTeachingGuide.stages
    .map(
      (s) => `<tr><td><strong>${e(s.stage)}</strong></td><td>${e(s.min30)}</td><td>${e(s.min60)}</td><td>${e(s.howToTeach)}</td></tr>`,
    )
    .join('\n        ');
  const guideHtml = `<section id="how-to-teach-free-lessons">
      <h2>${e(freeLibraryTeachingGuide.heading)}</h2>
      <p>${e(freeLibraryTeachingGuide.intro)}</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Lesson Stage</th>
            <th scope="col">30-Min Class</th>
            <th scope="col">50–60 Min Class</th>
            <th scope="col">How to Teach It</th>
          </tr>
        </thead>
        <tbody>
          ${guideRows}
        </tbody>
      </table>
    </section>`;
  const soloAiHtml = `<section id="self-study-with-ai">
      <h2>${e(soloLearnerAiGuide.heading)}</h2>
      <p>${e(soloLearnerAiGuide.intro)}</p>
      <ol>${soloLearnerAiGuide.steps.map((s) => `<li>${e(s)}</li>`).join('')}</ol>
      <blockquote><p>${e(soloLearnerAiGuide.prompt)}</p></blockquote>
      <p><small>${e(soloLearnerAiGuide.modelTip)}</small></p>
      <p><small>${e(soloLearnerAiGuide.liveTeacherPrefix)}<a href="${e(soloLearnerAiGuide.liveTeacherHref)}" rel="noopener noreferrer">${e(soloLearnerAiGuide.liveTeacherLinkLabel)}</a>.</small></p>
    </section>`;
  const faqHtml = `<section id="free-library-faq">
      <h2>Frequently Asked Questions About Free ESL Lessons</h2>
      ${freeLibraryFaq.map((f) => `<h3>${e(f.question)}</h3><p>${e(f.answer)}</p>`).join('\n      ')}
    </section>`;

  const breadcrumb = level && topic
    ? `<a href="/">Home</a> &rsaquo; <a href="/esl-lessons">ESL Lessons</a> &rsaquo; <a href="/esl-lessons/${e(level.toLowerCase())}">${e(level)}</a> &rsaquo; ${e(topicLabel)}`
    : topic
      ? `<a href="/">Home</a> &rsaquo; <a href="/esl-lessons">ESL Lessons</a> &rsaquo; ${e(topicLabel)}`
      : level
        ? `<a href="/">Home</a> &rsaquo; <a href="/esl-lessons">ESL Lessons</a> &rsaquo; ${e(level)}`
        : 'ESL Lessons';

  return `<div id="lesson-prerender">
  ${headerHtml()}
  <main class="lp-main">
    <nav aria-label="Breadcrumb">${breadcrumb}</nav>
    <h1>${e(heading)}</h1>
    <p>${e(intro)} <a href="${e(lessonDesign.href)}">${e(lessonDesign.linkLabel)}</a>.</p>
    ${levelLinksHtml(level, level ? topic : undefined, counts)}
    ${conversationQuestionsLinkHtml(level, topic, topicLabel)}
    ${themeSection}
    ${listing}
    ${guideHtml}
    <section id="${e(freeLessonLicence.id)}">
      <h2>${e(freeLessonLicence.heading)}</h2>
      <p>${e(freeLessonLicence.text)}</p>
    </section>
    ${soloAiHtml}
    ${faqHtml}
    <aside class="lp-cta">
      <h2>Need a lesson on a different topic?</h2>
      <p>PlanWise ESL generates a complete lesson on any topic at any CEFR level in minutes. <a href="/auth?register=true">Sign up free</a>.</p>
    </aside>
    <p><small>Created by ${e(founderPerson.name)} (British ESL teacher, 11 years &amp; 2,000+ students). These lessons are designed to be teacher-led. If you're an English learner who wants to take them 1-on-1 with a teacher, you can book with Dave at <a href="${e(founderPerson.url)}" rel="noopener noreferrer">SpeakWithDave.com</a>.</small></p>
  </main>
</div>`;
}

async function prerenderLessonIndex(template: string, level?: string): Promise<string | null> {
  const allLessons = arr(await storage.getPublicLessonSummaries()) as LessonSummary[];
  const lessons = level ? allLessons.filter((l) => l.cefrLevel === level) : allLessons;
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
    isAccessibleForFree: true,
    inLanguage: 'en',
    educationalLevel: level ? `CEFR ${level}` : 'CEFR A1-C2',
    audience: [
      { '@type': 'EducationalAudience', educationalRole: 'teacher', audienceType: 'ESL Teachers and Online English Tutors' },
      { '@type': 'EducationalAudience', educationalRole: 'student', audienceType: 'Adult and Teen English Learners (CEFR A1-C2)' },
    ],
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: lessons.length,
      itemListElement: lessons.map((l, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${BASE_URL}${lessonPath(l)}`,
        name: l.title,
      })),
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: freeLibraryFaq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: level
      ? [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'ESL Lessons', item: `${BASE_URL}/esl-lessons` },
        { '@type': 'ListItem', position: 3, name: level, item: `${BASE_URL}${canonicalPath}` },
      ]
      : [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'ESL Lessons', item: `${BASE_URL}/esl-lessons` },
      ],
  };

  return injectPage(
    template,
    {
      title,
      description: truncate(description, 160),
      canonicalPath,
      indexable: hasLessons,
      ogType: 'website',
      structuredData: hasLessons ? [itemList, faqSchema, breadcrumbSchema] : [],
    },
    buildLessonIndexHtml(lessons, level, undefined, allLessons),
  );
}

/** /esl-lessons/:level/topics/:tag. Null (a real 404 upstream) below LEVEL_TOPIC_MIN_LESSONS. */
async function prerenderLevelTopicIndex(template: string, level: CefrLevel, topic: PublicLessonTag): Promise<string | null> {
  const allLessons = arr(await storage.getPublicLessonSummaries()) as LessonSummary[];
  const counts = levelTopicCounts(allLessons);
  if (!hasLevelTopicPage(counts, level, topic)) return null;
  const lessons = allLessons.filter((l) => l.cefrLevel === level && publicTags(l.tags).includes(topic));
  const label = PUBLIC_LESSON_TAGS[topic];
  const title = `${levelTopicTitle(level, topic)} | PlanWise ESL`;
  const description = levelTopicDescription(level, topic, lessons.length);
  const canonicalPath = levelTopicPath(level, topic);

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: `${BASE_URL}${canonicalPath}`,
    isAccessibleForFree: true,
    inLanguage: 'en',
    educationalLevel: `CEFR ${level}`,
    about: label,
    audience: [
      { '@type': 'EducationalAudience', educationalRole: 'teacher', audienceType: 'ESL Teachers and Online English Tutors' },
      { '@type': 'EducationalAudience', educationalRole: 'student', audienceType: `Adult and Teen English Learners (CEFR ${level})` },
    ],
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: lessons.length,
      itemListElement: lessons.map((l, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${BASE_URL}${lessonPath(l)}`,
        name: l.title,
      })),
    },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'ESL Lessons', item: `${BASE_URL}/esl-lessons` },
      { '@type': 'ListItem', position: 3, name: level, item: `${BASE_URL}/esl-lessons/${level.toLowerCase()}` },
      { '@type': 'ListItem', position: 4, name: label, item: `${BASE_URL}${canonicalPath}` },
    ],
  };

  return injectPage(
    template,
    {
      title,
      description: truncate(description, 160),
      canonicalPath,
      indexable: true,
      ogType: 'website',
      structuredData: [itemList, breadcrumbSchema],
    },
    buildLessonIndexHtml(lessons, level, topic, allLessons),
  );
}

async function prerenderTopicIndex(template: string, topic: PublicLessonTag): Promise<string | null> {
  const allLessons = (await storage.getPublicLessonSummaries()) as LessonSummary[];
  const lessons = allLessons.filter((l) => publicTags(l.tags).includes(topic));
  const hasLessons = lessons.length > 0;
  const label = PUBLIC_LESSON_TAGS[topic];
  const title = `Free ${label} ESL Lessons (A1–C2) | PlanWise ESL`;
  const description = PUBLIC_LESSON_TAG_DESCRIPTIONS[topic];
  const canonicalPath = `/esl-lessons/topics/${topic}`;

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: `${BASE_URL}${canonicalPath}`,
    isAccessibleForFree: true,
    inLanguage: 'en',
    educationalLevel: 'CEFR A1-C2',
    audience: [
      { '@type': 'EducationalAudience', educationalRole: 'teacher', audienceType: 'ESL Teachers and Online English Tutors' },
      { '@type': 'EducationalAudience', educationalRole: 'student', audienceType: 'Adult and Teen English Learners (CEFR A1-C2)' },
    ],
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: lessons.length,
      itemListElement: lessons.map((l, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${BASE_URL}${lessonPath(l)}`,
        name: l.title,
      })),
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: freeLibraryFaq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'ESL Lessons', item: `${BASE_URL}/esl-lessons` },
      { '@type': 'ListItem', position: 3, name: label, item: `${BASE_URL}${canonicalPath}` },
    ],
  };

  return injectPage(
    template,
    {
      title,
      description: truncate(description, 160),
      canonicalPath,
      indexable: hasLessons,
      ogType: 'website',
      structuredData: hasLessons ? [itemList, faqSchema, breadcrumbSchema] : [],
    },
    buildLessonIndexHtml(lessons, undefined, topic, allLessons),
  );
}

/**
 * Returns the template with prerendered content + meta injected when pathname
 * is a public lesson page or one of the browse pages. Returns null for any
 * other path, or when the lesson/level is missing (callers fall through to the
 * SPA shell). Never throws: on DB errors it returns null so the page still serves.
 */
export async function injectLessonPrerender(
  template: string,
  pathname: string,
  preloadedLesson?: unknown,
): Promise<string | null> {
  try {
    const lessonMatch = pathname.match(/^\/lessons\/(\d+)\/?$/);
    if (lessonMatch) return await prerenderLesson(template, parseInt(lessonMatch[1], 10), preloadedLesson);

    const topicMatch = pathname.match(/^\/esl-lessons\/topics\/([^/]+)\/?$/);
    if (topicMatch) {
      const tag = topicMatch[1].toLowerCase();
      if (!isPublicLessonTag(tag)) return null;
      return await prerenderTopicIndex(template, tag);
    }

    const levelTopic = parseLevelTopicPath(pathname);
    if (levelTopic) return await prerenderLevelTopicIndex(template, levelTopic.level, levelTopic.tag);

    const slugMatch = pathname.match(/^\/esl-lessons\/([^/]+)\/([^/]+)\/?$/);
    if (slugMatch) {
      const lesson = preloadedLesson ?? await storage.getLessonByPublicSlug(slugMatch[2]);
      if (!lesson || lessonPath(lesson as LessonSummary) !== pathname.replace(/\/$/, "")) return null;
      return await prerenderLesson(template, (lesson as LessonSummary).id, lesson);
    }

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
