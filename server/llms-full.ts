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

/** Builds the complete /llms-full.txt Markdown document from shared site data. */
export function buildLlmsFullTxt(): string {
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

  const sections = [
    header,
    renderHomepageMarkdown(),
    ...[...allPages.values()].map(renderPageMarkdown),
  ];

  return `${sections.join('\n\n---\n\n')}\n`;
}

let cachedLlmsFullTxt: string | undefined;

/** Returns the cached /llms-full.txt text (generated once per server process). */
export function getLlmsFullTxt(): string {
  return (cachedLlmsFullTxt ??= buildLlmsFullTxt());
}
