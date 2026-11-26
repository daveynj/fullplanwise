import {
  marketingPageByPath,
  publicNav,
  renderInline,
  plainInline,
  type MarketingPage,
  type MarketingSection,
} from '@shared/marketing-pages';
import { siteFacts, founderPerson } from '@shared/site-facts';

/**
 * Server-side prerender of the public information pages (/how-it-works,
 * /about, /pricing, /compare/...). Same approach as landing-prerender.ts:
 * static, semantic HTML, real <head> metadata and JSON-LD are injected into
 * the served index.html so search engines and AI assistants can read the page
 * without JavaScript. When the React app mounts, createRoot() replaces it.
 */

const BASE_URL = siteFacts.url;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const e = escapeHtml;

/** JSON for a <script type="application/ld+json"> block; '<' is escaped so content cannot close the tag. */
function jsonLd(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

export const marketingPrerenderCss = `
#marketing-prerender { font-family: 'Open Sans', Arial, sans-serif; color: #051d40; background: #fdfdfd; line-height: 1.6; }
#marketing-prerender .mp-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; padding: 16px 24px; border-bottom: 1px solid #eee; }
#marketing-prerender .mp-header nav a { margin-left: 16px; color: #051d40; }
#marketing-prerender .mp-main { max-width: 860px; margin: 0 auto; padding: 40px 24px; }
#marketing-prerender h1 { font-size: 2.2rem; line-height: 1.2; }
#marketing-prerender h2 { margin-top: 2.2rem; }
#marketing-prerender table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.95rem; }
#marketing-prerender th, #marketing-prerender td { border: 1px solid #e5e5e5; padding: 8px 10px; text-align: left; vertical-align: top; }
#marketing-prerender th { background: #f8f5ec; }
#marketing-prerender .mp-verdict { border-left: 4px solid #edc437; background: #f8fafc; padding: 16px 20px; border-radius: 10px; margin: 1.5rem 0; }
#marketing-prerender .mp-cta { background: #f8f5ec; border-radius: 12px; padding: 20px; margin-top: 2.5rem; }
#marketing-prerender .mp-btn { display: inline-block; background: #edc437; color: #051d40; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
#marketing-prerender .mp-refs { font-size: 0.9rem; color: #444; }
#marketing-prerender a { color: #b8912a; }
`;

function headerHtml(): string {
  return `<header class="mp-header">
    <strong><a href="/">${e(siteFacts.brand)}</a></strong>
    <nav>
      ${publicNav.map((l) => `<a href="${e(l.href)}">${e(l.label)}</a>`).join('\n      ')}
      <a href="/auth">Login</a>
      <a href="/auth?register=true">Sign Up Free</a>
    </nav>
  </header>`;
}

function sectionHtml(section: MarketingSection): string {
  const parts = section.heading ? [`<h2>${renderInline(section.heading)}</h2>`] : [];
  for (const p of section.paragraphs ?? []) parts.push(`<p>${renderInline(p)}</p>`);
  if (section.bullets?.length) {
    parts.push(`<ul>${section.bullets.map((b) => `<li>${renderInline(b)}</li>`).join('')}</ul>`);
  }
  if (section.table) {
    const head = section.table.headers.map((h) => `<th scope="col">${renderInline(h)}</th>`).join('');
    const rows = section.table.rows
      .map((row) => `<tr>${row.map((cell, i) => (i === 0 ? `<th scope="row">${renderInline(cell)}</th>` : `<td>${renderInline(cell)}</td>`)).join('')}</tr>`)
      .join('');
    parts.push(`<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`);
  }
  if (section.workflowProof) {
    const wp = section.workflowProof;
    parts.push(
      `<div><h3>${renderInline(wp.planwiseTitle)}</h3><ol>${wp.planwiseSteps.map((s) => `<li>${renderInline(s)}</li>`).join('')}</ol><h3>${renderInline(wp.competitorTitle)}</h3><ol>${wp.competitorSteps.map((s) => `<li>${renderInline(s)}</li>`).join('')}</ol></div>`,
    );
  }
  return `<section>${parts.join('\n')}</section>`;
}

/** Builds the static, crawler-readable page markup. */
export function buildMarketingPageHtml(page: MarketingPage): string {
  const verdictHtml = page.verdict
    ? `<section class="mp-verdict"><h2>${renderInline(page.verdict.heading)}</h2><p>${renderInline(page.verdict.text)}</p></section>`
    : '';
  const faqHtml = page.faq?.length
    ? `<section><h2>Frequently asked questions</h2>${page.faq
        .map((f) => `<h3>${renderInline(f.question)}</h3><p>${renderInline(f.answer)}</p>`)
        .join('\n')}</section>`
    : '';
  const refsHtml = page.references?.length
    ? `<section class="mp-refs"><h2>References</h2><ol>${page.references.map((r) => `<li>${renderInline(r)}</li>`).join('')}</ol></section>`
    : '';
  return `<div id="marketing-prerender">
  ${headerHtml()}
  <main class="mp-main">
    <nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; ${e(page.navLabel)}</nav>
    <article>
      <header>
        <p>${e(page.eyebrow)}</p>
        <h1>${renderInline(page.h1)}</h1>
        ${page.byline ? `<p>By ${e(page.byline.author)}${page.byline.author === siteFacts.founder ? `, ${e(siteFacts.founderRole)}` : ''} &bull; <time datetime="${e(page.byline.published)}">${e(page.byline.published)}</time>${page.byline.note ? ` &bull; ${e(page.byline.note)}` : ''}</p>` : ''}
        ${page.intro.map((p) => `<p>${renderInline(p)}</p>`).join('\n        ')}
      </header>
      ${verdictHtml}
      ${page.sections.map(sectionHtml).join('\n      ')}
      ${faqHtml}
      ${refsHtml}
      ${page.disclaimer ? `<p class="mp-refs"><small>${renderInline(page.disclaimer)}</small></p>` : ''}
    </article>
    <aside class="mp-cta">
      <h2>${renderInline(page.cta.heading)}</h2>
      <p>${renderInline(page.cta.text)}</p>
      <p><a class="mp-btn" href="${e(page.cta.href)}">${e(page.cta.label)}</a></p>
      <p class="mp-refs"><small>Built by British ESL teacher Dave Jackson. Looking for 1-on-1 English lessons? <a href="${e(siteFacts.founderSite)}" rel="noopener noreferrer">SpeakWithDave.com</a></small></p>
    </aside>
  </main>
</div>`;
}

/** Structured data: the page itself, its breadcrumb and (when present) its FAQ. */
export function marketingStructuredData(page: MarketingPage): unknown[] {
  const url = `${BASE_URL}${page.path}`;
  const founderAuthor = founderPerson;
  const data: unknown[] = [
    page.schemaType === 'Article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          '@id': `${url}#article`,
          url,
          mainEntityOfPage: url,
          headline: page.h1,
          description: page.description,
          inLanguage: 'en',
          author: page.byline && page.byline.author !== siteFacts.founder
            ? { '@type': 'Organization', '@id': `${BASE_URL}/#organization`, name: page.byline.author, url: BASE_URL }
            : founderAuthor,
          publisher: { '@id': `${BASE_URL}/#organization`, '@type': 'Organization', name: siteFacts.brand },
          datePublished: page.byline?.published ?? page.updated,
          dateModified: page.updated,
          audience: { '@type': 'EducationalAudience', educationalRole: 'teacher' },
        }
      : {
      '@context': 'https://schema.org',
      '@type': page.schemaType,
      '@id': `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: 'en',
      dateModified: page.updated,
      isPartOf: { '@id': `${BASE_URL}/#website` },
      about: { '@id': `${BASE_URL}/#software` },
      ...(page.schemaType === 'AboutPage'
        ? {
            mainEntity: founderPerson,
          }
        : {}),
      ...(page.references?.length ? { citation: page.references } : {}),
      },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: page.navLabel, item: url },
      ],
    },
  ];
  if (page.faq?.length) {
    data.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faq.map((f) => ({
        '@type': 'Question',
        name: plainInline(f.question),
        acceptedAnswer: { '@type': 'Answer', text: plainInline(f.answer) },
      })),
    });
  }
  return data;
}

/** Replace all copies of a meta tag (any attribute order or quoting) and add the new value. */
function setMetaContent(html: string, attr: 'name' | 'property', key: string, value: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\s${attr}\\s*=\\s*(?:"${escapedKey}"|'${escapedKey}'|${escapedKey}(?=\\s|/?>)))[^>]*>\\s*`, 'gi');
  return html.replace(pattern, '').replace(/<\/head>/i, () => `<meta ${attr}="${key}" content="${e(value)}" />\n</head>`);
}

/**
 * Returns the template with the page's content and metadata injected when
 * pathname is one of the information pages; null otherwise.
 */
export function injectMarketingPrerender(template: string, pathname: string): string | null {
  const page = marketingPageByPath(pathname);
  if (!page) return null;

  const canonical = `${BASE_URL}${page.path}`;
  let html = template
    .replace(/<meta\b(?=[^>]*\sname\s*=\s*["']?(?:description|robots|keywords)(?=["'\s/>]))[^>]*>\s*/gi, '')
    .replace(/<link\b(?=[^>]*\srel\s*=\s*["']?canonical(?=["'\s/>]))[^>]*>\s*/gi, '');
  html = html.replace(
    /<title>[^<]*<\/title>/,
    () => `<title>${e(page.title)}</title>
    <meta name="description" content="${e(page.description)}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    <link rel="canonical" href="${e(canonical)}" />`,
  );
  for (const [attr, key, value] of [
    ['property', 'og:title', page.title],
    ['property', 'og:description', page.description],
    ['property', 'og:url', canonical],
    ['property', 'og:type', 'website'],
    ['name', 'twitter:title', page.title],
    ['name', 'twitter:description', page.description],
    ['name', 'twitter:url', canonical],
  ] as const) {
    html = setMetaContent(html, attr, key, value);
  }
  const extraHead = `${marketingStructuredData(page).map(jsonLd).join('\n    ')}
    <style>${marketingPrerenderCss}</style>`;
  html = html.replace('</head>', () => `    ${extraHead}\n  </head>`);
  html = html.replace('<div id="root"></div>', () => `<div id="root">${buildMarketingPageHtml(page)}</div>`);
  return html;
}
