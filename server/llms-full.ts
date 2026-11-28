import { lessonPath } from '@shared/lesson-url';
import { PUBLIC_LESSON_TAGS, publicTags, type PublicLessonTag } from '@shared/public-lesson-tags';
import { levelTopicPages } from '@shared/library-browse';
import {
  siteFacts,
  trialText,
  priceText,
  organizationSameAs,
  founderPerson,
} from '@shared/site-facts';
import {
  hero,
  definition,
  personalisation,
  showcase,
  problem,
  features,
  science,
  steps,
  founder,
  pricing,
  faq,
  type FaqAnswerPart,
} from '@shared/homepage-content';
import {
  marketingPages,
  guidePages,
  type MarketingPage,
  type MarketingSection,
} from '@shared/marketing-pages';
import {
  cefrLevelsGuide,
  planConversationLessonGuide,
  topicsByLevelGuide,
  personaliseGuide,
} from '@shared/guides';

/**
 * Generates /llms-full.txt dynamically from the shared single-source-of-truth
 * content modules (shared/site-facts.ts, shared/homepage-content.ts,
 * shared/marketing-pages.ts, and shared/guides.ts).
 *
 * Because all copy comes directly from those modules, /llms-full.txt cannot
 * drift out of sync with the live site facts, pricing, trial, research or guides.
 */

const BASE_URL = siteFacts.url;

/** Rewrites relative Markdown links [label](/path) to absolute planwiseesl.com URLs. */
function absolutizeMarkdownLinks(text: string): string {
  return text.replace(/\]\((\/[^)\s]*)\)/g, `](${BASE_URL}$1)`);
}

function faqAnswerMarkdown(parts: FaqAnswerPart[]): string {
  return parts
    .map((part) => {
      if (part.type === 'link') {
        const href = part.href.startsWith('/') ? `${BASE_URL}${part.href}` : part.href;
        return `[${part.text}](${href})`;
      }
      return part.text;
    })
    .join('')
    .trim();
}

function renderMarkdownTable(table: { headers: string[]; rows: string[][] }): string {
  const cleanCell = (cell: string) => absolutizeMarkdownLinks(cell).replace(/\|/g, '\\|');
  const headerLine = `| ${table.headers.map(cleanCell).join(' | ')} |`;
  const sepLine = `| ${table.headers.map(() => '---').join(' | ')} |`;
  const rowLines = table.rows.map((row) => `| ${row.map(cleanCell).join(' | ')} |`);
  return [headerLine, sepLine, ...rowLines].join('\n');
}

function renderSectionMarkdown(section: MarketingSection): string {
  const blocks: string[] = [];
  if (section.heading) blocks.push(`### ${section.heading}`);
  for (const p of section.paragraphs ?? []) {
    blocks.push(absolutizeMarkdownLinks(p));
  }
  if (section.bullets?.length) {
    blocks.push(section.bullets.map((b) => `- ${absolutizeMarkdownLinks(b)}`).join('\n'));
  }
  if (section.table) {
    blocks.push(renderMarkdownTable(section.table));
  }
  if (section.workflowProof) {
    const wp = section.workflowProof;
    blocks.push(
      `#### ${absolutizeMarkdownLinks(wp.planwiseTitle)}\n\n${wp.planwiseSteps.map((s, i) => `${i + 1}. ${absolutizeMarkdownLinks(s)}`).join('\n')}`,
    );
    blocks.push(
      `#### ${absolutizeMarkdownLinks(wp.competitorTitle)}\n\n${wp.competitorSteps.map((s, i) => `${i + 1}. ${absolutizeMarkdownLinks(s)}`).join('\n')}`,
    );
  }
  return blocks.join('\n\n');
}

function renderPageMarkdown(page: MarketingPage): string {
  const blocks: string[] = [];
  blocks.push(`## ${page.h1}`);
  blocks.push(`- URL: ${BASE_URL}${page.path}`);
  if (page.byline) {
    const note = page.byline.note ? ` (${page.byline.note})` : '';
    blocks.push(`- Author: ${page.byline.author} | Published: ${page.byline.published}${note}`);
  }
  blocks.push(`- Updated: ${page.updated}`);

  for (const p of page.intro) {
    blocks.push(absolutizeMarkdownLinks(p));
  }

  if (page.verdict) {
    blocks.push(`### ${absolutizeMarkdownLinks(page.verdict.heading)}\n\n${absolutizeMarkdownLinks(page.verdict.text)}`);
  }

  for (const section of page.sections) {
    const rendered = renderSectionMarkdown(section);
    if (rendered) blocks.push(rendered);
  }

  if (page.faq?.length) {
    const qaLines = page.faq
      .map((f) => `#### ${absolutizeMarkdownLinks(f.question)}\n\n${absolutizeMarkdownLinks(f.answer)}`)
      .join('\n\n');
    blocks.push(`### Frequently asked questions\n\n${qaLines}`);
  }

  if (page.references?.length) {
    blocks.push(`### References\n\n${page.references.map((r, i) => `${i + 1}. ${absolutizeMarkdownLinks(r)}`).join('\n')}`);
  }

  if (page.disclaimer) {
    blocks.push(`*${absolutizeMarkdownLinks(page.disclaimer)}*`);
  }

  return blocks.join('\n\n');
}

function renderHomepageMarkdown(): string {
  const blocks: string[] = [];

  blocks.push(`## Homepage`);
  blocks.push(`- URL: ${BASE_URL}/`);
  blocks.push(`### ${hero.heading}\n\n${hero.subheading}`);
  blocks.push(hero.benefits.map((b) => `- ${b}`).join('\n'));
  blocks.push(`**${hero.audienceIntro}**\n\n${hero.audience.map((a) => `- ${a}`).join('\n')}`);

  blocks.push(`### ${definition.heading}\n\n${definition.text}`);

  blocks.push(
    [
      `### ${personalisation.heading}`,
      personalisation.intro,
      `**${personalisation.personal.label}**`,
      personalisation.personal.titles.map((t, i) => `${i + 1}. ${t}`).join('\n'),
      `**${personalisation.general.label}**`,
      personalisation.general.titles.map((t, i) => `${i + 1}. ${t}`).join('\n'),
      personalisation.note,
      `Free sample lessons: ${BASE_URL}${personalisation.href} (Example B2 lesson: ${BASE_URL}/lessons/${showcase.lessonId})`,
    ].join('\n\n'),
  );

  blocks.push(
    [
      `### ${problem.heading}`,
      problem.intro,
      `**${problem.traditional.title}**`,
      problem.traditional.items.map((item) => `- ${item}`).join('\n'),
      `**${problem.withPlanwise.title}**`,
      problem.withPlanwise.items.map((item) => `- ${item}`).join('\n'),
      problem.conclusion,
    ].join('\n\n'),
  );

  blocks.push(
    `### ${features.heading}\n\n${features.items.map((f) => `- **${f.title}:** ${f.text}`).join('\n')}`,
  );

  blocks.push(
    `### ${science.heading}\n\n${science.intro}\n\n${science.points.map((p, i) => `${i + 1}. **${p.title}:** ${p.text}`).join('\n')}`,
  );

  blocks.push(
    `### ${steps.heading}\n\n${steps.items.map((s) => `${s.number}. **${s.title}:** ${s.text}`).join('\n')}`,
  );

  blocks.push(
    [
      `### ${founder.heading}`,
      `> ${founder.quote}`,
      `— ${founder.name}, ${founder.role}`,
    ].join('\n\n'),
  );

  blocks.push(
    [
      `### ${pricing.heading}`,
      ...pricing.plans.map(
        (plan) =>
          `- **${plan.name}** (${plan.price}${plan.priceSuffix}) — ${plan.description}\n${plan.features.map((f) => `  - ${f}`).join('\n')}`,
      ),
    ].join('\n\n'),
  );

  blocks.push(
    `### ${faq.heading}\n\n${faq.items.map((item) => `#### ${item.question}\n\n${faqAnswerMarkdown(item.answer)}`).join('\n\n')}`,
  );

  return blocks.join('\n\n');
}

export interface PublicLessonLlmsItem {
  id: number;
  publicSlug?: string | null;
  publicLevel?: string | null;
  title: string;
  cefrLevel: string;
  publicCategory?: string | null;
  tags?: string[] | null;
}

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

function renderPublicLessonsMarkdown(publicLessons: PublicLessonLlmsItem[]): string {
  if (publicLessons.length === 0) return '';
  const blocks: string[] = [
    `## Free Public ESL Lesson Library (No Login Required)\nURL: ${BASE_URL}/esl-lessons\n\nEvery lesson below is open to inspect, teach, and download as a printable Vocabulary Review PDF with zero signup:`,
  ];
  for (const level of CEFR_ORDER) {
    const inLevel = publicLessons.filter((l) => l.cefrLevel.toUpperCase() === level);
    if (inLevel.length === 0) continue;
    const lines = inLevel.map((l) => {
      const cat = l.publicCategory ? ` [${l.publicCategory}]` : '';
      return `- [${l.title}](${BASE_URL}${lessonPath(l)})${cat}`;
    });
    const themePages = levelTopicPages(publicLessons).filter((p) => p.level === level);
    const themes = themePages.length
      ? `${level} lessons by theme: ${themePages.map((p) => `[${PUBLIC_LESSON_TAGS[p.tag]} (${p.count})](${BASE_URL}${p.path})`).join(' · ')}\n\n`
      : '';
    blocks.push(`### ${level} Lessons (${BASE_URL}/esl-lessons/${level.toLowerCase()})\n${themes}${lines.join('\n')}`);
  }
  return blocks.join('\n\n');
}

/** Links to the "conversation questions about <topic>" pages (all 17 topics when no lessons are known). */
function renderConversationQuestionsMarkdown(publicLessons: PublicLessonLlmsItem[]): string {
  const seen = new Set(publicLessons.flatMap((l) => publicTags(l.tags)));
  const present = (Object.keys(PUBLIC_LESSON_TAGS) as PublicLessonTag[]).filter((t) => seen.has(t));
  const tags = present.length ? present : (Object.keys(PUBLIC_LESSON_TAGS) as PublicLessonTag[]);
  const lines = tags.map(
    (t) => `- [Conversation questions about ${PUBLIC_LESSON_TAGS[t].toLowerCase()}](${BASE_URL}/conversation-questions/${t})`,
  );
  return `## Conversation Questions by Topic\nURL: ${BASE_URL}/conversation-questions\n\nFree ESL conversation questions for each topic, from A1 to C2, taken from the free lessons (warm-up and discussion questions, free to print, no login):\n\n${lines.join('\n')}`;
}

export interface PublicBlogLlmsItem {
  slug: string;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  publishDate?: string | null;
}

function renderBlogPostsMarkdown(blogPosts: PublicBlogLlmsItem[]): string {
  if (blogPosts.length === 0) return '';
  const lines = blogPosts.map((p) => {
    const cat = p.category ? ` [${p.category}]` : '';
    const excerpt = p.excerpt ? ` — ${p.excerpt.trim()}` : '';
    return `- [${p.title}](${BASE_URL}/blog/${p.slug})${cat}${excerpt}`;
  });
  return `## ESL Teaching Blog\nURL: ${BASE_URL}/blog\n\n${lines.join('\n')}`;
}

/** Builds the complete /llms-full.txt Markdown document from shared site data + live public lessons & blog posts. */
export function buildLlmsFullTxt(
  publicLessons: PublicLessonLlmsItem[] = [],
  blogPosts: PublicBlogLlmsItem[] = [],
): string {
  // Collect all unique pages across marketingPages, guidePages, and shared/guides.ts.
  const allPages = new Map<string, MarketingPage>();
  for (const page of [
    ...marketingPages,
    ...guidePages,
    cefrLevelsGuide,
    planConversationLessonGuide,
    topicsByLevelGuide,
    personaliseGuide,
  ]) {
    if (!allPages.has(page.path)) {
      allPages.set(page.path, page);
    }
  }

  const header = [
    `# ${siteFacts.brand} — Full Documentation`,
    `> ${definition.text}`,
    [
      `- Website: ${BASE_URL}/`,
      `- Summary index: ${BASE_URL}/llms.txt`,
      `- Sitemap: ${BASE_URL}/sitemap.xml`,
      `- Free lessons: ${BASE_URL}/esl-lessons`,
      `- Pricing: ${trialText} (no credit card), Unlimited plan ${priceText}`,
      `- Generation time: ${siteFacts.generationTime}`,
      `- CEFR levels: ${siteFacts.levels}`,
      `- Contact: ${siteFacts.email}`,
      `- Organisation profiles: ${organizationSameAs.join(', ')}`,
      `- Founder (${founderPerson.name}): ${founderPerson.sameAs.join(', ')}`,
    ].join('\n'),
  ].join('\n\n');

  const publicLessonsSection = renderPublicLessonsMarkdown(publicLessons);
  const blogPostsSection = renderBlogPostsMarkdown(blogPosts);

  const sections = [
    header,
    renderHomepageMarkdown(),
    ...(publicLessonsSection ? [publicLessonsSection] : []),
    renderConversationQuestionsMarkdown(publicLessons),
    ...(blogPostsSection ? [blogPostsSection] : []),
    ...[...allPages.values()].map(renderPageMarkdown),
  ];

  return `${sections.join('\n\n---\n\n')}\n`;
}

let cachedLlmsFullTxt: string | undefined;

/** Returns the cached static /llms-full.txt text (used as fallback when DB is unavailable). */
export function getLlmsFullTxt(): string {
  return (cachedLlmsFullTxt ??= buildLlmsFullTxt());
}
