import { siteFacts, trialText } from '@shared/site-facts';

/**
 * Server-side metadata injection for /auth so search engines and AI bots see
 * `noindex, follow` and accurate auth-page metadata in the initial HTML without
 * executing JavaScript (preventing the login page from being indexed or
 * inheriting homepage canonical/OG URLs).
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const e = escapeHtml;

function setMetaContent(html: string, attr: 'name' | 'property', key: string, value: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*\\s${attr}\\s*=\\s*(?:"${escapedKey}"|'${escapedKey}'|${escapedKey}(?=\\s|/?>)))[^>]*>\\s*`,
    'gi',
  );
  return html
    .replace(pattern, '')
    .replace(/<\/head>/i, () => `<meta ${attr}="${key}" content="${e(value)}" />\n</head>`);
}

export const AUTH_ROBOTS_DIRECTIVE = 'noindex, follow';

export function injectAuthNoindex(template: string): string {
  const title = `Log In or Start Your Free Trial | ${siteFacts.brand}`;
  const description = `Log in to ${siteFacts.brand}, or create a free account: complete CEFR-levelled ESL lessons in ${siteFacts.generationTime}. ${trialText}, no credit card needed.`;
  const canonical = `${siteFacts.url}/auth`;

  let html = template
    .replace(/<meta\b(?=[^>]*\sname\s*=\s*["']?(?:description|robots)(?=["'\s/>]))[^>]*>\s*/gi, '')
    .replace(/<link\b(?=[^>]*\srel\s*=\s*["']?canonical(?=["'\s/>]))[^>]*>\s*/gi, '');

  html = html.replace(
    /<title>[^<]*<\/title>/,
    () => `<title>${e(title)}</title>
    <meta name="description" content="${e(description)}" />
    <meta name="robots" content="${AUTH_ROBOTS_DIRECTIVE}" />
    <link rel="canonical" href="${e(canonical)}" />`,
  );

  for (const [attr, key, value] of [
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:url', canonical],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:url', canonical],
  ] as const) {
    html = setMetaContent(html, attr, key, value);
  }

  return html;
}
