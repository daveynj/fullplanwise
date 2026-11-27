import { storage } from './storage';
import type { BlogPost } from '@shared/schema';
import { blogPublicMetadata } from '@shared/blog-public-metadata';
import { publicNav } from '@shared/marketing-pages';
import { founderPerson } from '@shared/site-facts';

/**
 * Server-side prerender of the blog index (/blog) and blog posts (/blog/:slug).
 *
 * Follows the same pattern as server/landing-prerender.ts: static, semantic
 * HTML is injected into the empty <div id="root"> of the served index.html so
 * crawlers and AI assistants can read post titles, excerpts, and body text
 * without JavaScript. When the React app mounts, createRoot() replaces this
 * placeholder markup, so there are no hydration mismatches.
 */

const BASE_URL = 'https://planwiseesl.com';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const e = escapeHtml;

// isomorphic-dompurify loads a full DOM emulator (about 1.5 s), so it is only
// loaded the first time a blog post is rendered, not at server start-up.
let domPurifyPromise: Promise<typeof import('isomorphic-dompurify').default> | undefined;
function loadDomPurify() {
  domPurifyPromise ??= import('isomorphic-dompurify').then((m) => m.default);
  return domPurifyPromise;
}

// Same allowlist the client-side blog post page uses, so bots see the same content.
async function sanitizeContentHtml(html: string): Promise<string> {
  const DOMPurify = await loadDomPurify();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'iframe', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'scope', 'colspan', 'rowspan'],
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
  });
}

/** The post title is the page's only H1; any H1 written in the post body becomes an H2. */
export function demoteH1(html: string): string {
  return html.replace(/<h1(?=[\s>])/gi, '<h2').replace(/<\/h1\s*>/gi, '</h2>');
}

/** JSON for a <script type="application/ld+json"> block; '<' is escaped so content cannot close the tag. */
function jsonLd(data: unknown, id?: string): string {
  return `<script type="application/ld+json"${id ? ` id="${id}"` : ''}>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function isoDate(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * BlogPosting structured data for a post, in the HTML crawlers receive (most
 * AI crawlers do not run JavaScript). The id matches the client SEOHead's own
 * article block, so the client replaces it instead of adding a duplicate.
 */
export function blogPostingJsonLd(post: BlogPost): string {
  const metadata = blogPublicMetadata(post);
  const url = `${BASE_URL}${metadata.canonicalPath}`;
  const published = isoDate(post.publishDate);
  const modified = isoDate(post.updatedAt) || published;
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: metadata.description,
    image: metadata.imageUrl,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    ...(post.category ? { articleSection: post.category } : {}),
    ...(post.tags?.length ? { keywords: post.tags.join(', ') } : {}),
    inLanguage: 'en',
    // Posts by Dave (stored as "Dave Jackson" or "David Jackson") carry his full profile.
    author: !post.author || /jackson/i.test(post.author)
      ? { ...founderPerson, name: post.author || founderPerson.name }
      : { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'PlanWise ESL',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/PlanWise_ESL_logo.png` },
    },
  }, 'seo-article-jsonld');
}

export function blogBreadcrumbJsonLd(post: BlogPost): string {
  const url = `${BASE_URL}${blogPublicMetadata(post).canonicalPath}`;
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  }, 'seo-breadcrumb-jsonld');
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(?:p|div|li|tr|td|th|h[1-6]|blockquote)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim();
}

export function blogFaqJsonLd(post: Pick<BlogPost, 'content'>): string | null {
  const html = post.content || '';
  const h2Regex = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
  let faqStart = -1;
  let match: RegExpExecArray | null;
  while ((match = h2Regex.exec(html)) !== null) {
    const headingText = stripHtmlToText(match[1]);
    if (/frequently asked questions|^faq\b/i.test(headingText)) {
      faqStart = match.index + match[0].length;
      break;
    }
  }
  if (faqStart === -1) return null;

  const tail = html.slice(faqStart);
  const nextH2 = tail.search(/<h2[\s>]/i);
  const faqSlice = nextH2 === -1 ? tail : tail.slice(0, nextH2);

  const items: Array<{ name: string; text: string }> = [];
  const h3Regex = /<h3\b[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3[\s>]|$)/gi;
  let qa: RegExpExecArray | null;
  while ((qa = h3Regex.exec(faqSlice)) !== null) {
    const name = stripHtmlToText(qa[1]);
    const text = stripHtmlToText(qa[2]);
    if (name && text) items.push({ name, text });
  }
  if (items.length < 2) return null;

  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ name, text }) => ({
      '@type': 'Question',
      name,
      acceptedAnswer: { '@type': 'Answer', text },
    })),
  }, 'seo-faq-jsonld');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function headMeta(title: string, description: string, canonicalPath: string): string {
  return `<title>${e(title)}</title>
    <meta name="description" content="${e(description)}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    <link rel="canonical" href="${BASE_URL}${e(canonicalPath)}" />`;
}

/** Minimal standalone styling so a no-JavaScript fetch is readable (not for the hydrated app). */
export const blogPrerenderCss = `
#blog-prerender { font-family: 'Open Sans', Arial, sans-serif; color: #051d40; background: #fdfdfd; line-height: 1.6; }
#blog-prerender .bp-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #eee; }
#blog-prerender .bp-header nav a { margin-left: 16px; color: #051d40; }
#blog-prerender .bp-main { max-width: 820px; margin: 0 auto; padding: 48px 24px; }
#blog-prerender h1 { font-size: 2.2rem; line-height: 1.2; }
#blog-prerender .bp-meta { color: #555; font-size: 0.95rem; }
#blog-prerender .bp-card { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
#blog-prerender .bp-card h2 { margin: 0 0 8px; font-size: 1.3rem; }
#blog-prerender .bp-tag { display: inline-block; background: #f4f4f4; border-radius: 6px; padding: 2px 10px; font-size: 0.8rem; margin-right: 6px; }
#blog-prerender table { border-collapse: collapse; width: 100%; margin: 1.2rem 0; font-size: 0.95rem; }
#blog-prerender th, #blog-prerender td { border: 1px solid #e5e5e5; padding: 8px 10px; text-align: left; vertical-align: top; }
#blog-prerender th { background: #051d40; color: #fff; }
#blog-prerender a { color: #b8912a; }
#blog-prerender img { max-width: 100%; height: auto; border-radius: 8px; }
`;

function headerHtml(): string {
  return `<header class="bp-header">
    <strong><a href="/">PlanWise ESL</a></strong>
    <nav>
      ${publicNav.map((l) => `<a href="${l.href}">${l.label}</a>`).join('\n      ')}
      <a href="/auth">Login</a>
      <a href="/auth?register=true">Sign Up Free</a>
    </nav>
  </header>`;
}

/** Builds the static, crawler-readable blog index markup. */
export function buildBlogIndexHtml(posts: BlogPost[]): string {
  const cards = posts
    .map(
      (p) => `<article class="bp-card">
        ${p.category ? `<span class="bp-tag">${e(p.category)}</span>` : ''}
        <h2><a href="/blog/${e(p.slug)}">${e(p.title)}</a></h2>
        <p class="bp-meta">By ${e(p.author)} &bull; <time datetime="${e(p.publishDate)}">${e(formatDate(p.publishDate))}</time>${p.readTime ? ` &bull; ${e(p.readTime)}` : ''}</p>
        <p>${e(p.excerpt)}</p>
        <p><a href="/blog/${e(p.slug)}">Read Article</a></p>
      </article>`,
    )
    .join('\n');

  return `<div id="blog-prerender">
  ${headerHtml()}
  <main class="bp-main">
    <h1>ESL Teaching Blog</h1>
    <p>Expert tips, strategies, and insights for English language educators</p>
    ${cards}
  </main>
</div>`;
}

/** Builds the static, crawler-readable single blog post markup. */
export async function buildBlogPostHtml(post: BlogPost): Promise<string> {
  const tagsHtml = (post.tags || []).map((t) => `<span class="bp-tag">${e(t)}</span>`).join('');
  return `<div id="blog-prerender">
  ${headerHtml()}
  <main class="bp-main">
    <nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/blog">Blog</a> &rsaquo; ${e(post.title)}</nav>
    <article>
      <header>
        <h1>${e(post.title)}</h1>
        <p class="bp-meta">By ${e(post.author)} &bull; <time datetime="${e(post.publishDate)}">${e(formatDate(post.publishDate))}</time>${post.readTime ? ` &bull; ${e(post.readTime)}` : ''}${post.category ? ` &bull; ${e(post.category)}` : ''}</p>
        ${tagsHtml ? `<p>${tagsHtml}</p>` : ''}
        <p><em>${e(post.excerpt)}</em></p>
        ${post.featuredImageUrl ? `<img src="${e(post.featuredImageUrl)}" alt="${e(post.featuredImageAlt || post.title)}" />` : ''}
      </header>
      ${demoteH1(await sanitizeContentHtml(post.content))}
    </article>
  </main>
</div>`;
}

function injectIntoTemplate(template: string, meta: string, bodyHtml: string, article = false): string {
  let html = template;
  // Remove inherited/duplicate page metadata before adding the authoritative set.
  html = html
    .replace(/<meta\b(?=[^>]*\sname\s*=\s*["'](?:description|robots)["'])[^>]*>\s*/gi, '')
    .replace(/<link\b(?=[^>]*\srel\s*=\s*["']canonical["'])[^>]*>\s*/gi, '');
  if (article) {
    html = html.replace(/<meta\b(?=[^>]*\s(?:name|property)\s*=\s*["'](?:og:|twitter:)[^"']*["'])[^>]*>\s*/gi, '');
  }
  // Callback replacement preserves literal "$&" and "$'" in author-written text.
  html = html.replace(/<title>[^<]*<\/title>/i, () => meta);
  html = html.replace('</head>', `    <style>${blogPrerenderCss}</style>\n  </head>`);
  html = html.replace('<div id="root"></div>', () => `<div id="root">${bodyHtml}</div>`);
  return html;
}

/**
 * If pathname is /blog or /blog/:slug, returns the template with prerendered
 * content + meta injected. Returns null when the path is not a blog page or
 * the post is missing/unpublished (callers fall through to the SPA shell).
 * Never throws: on DB errors, returns null so the page still serves.
 */
export async function injectBlogPrerender(
  template: string,
  pathname: string,
  preloadedPost?: BlogPost,
): Promise<string | null> {
  try {
    if (pathname === '/blog' || pathname === '/blog/') {
      const { posts } = await storage.getAllBlogPosts(1, 100, undefined, undefined, true);
      const meta = headMeta(
        'Blog - ESL Teaching Tips & Resources | PlanWise ESL',
        'Discover expert ESL teaching strategies, lesson planning tips, and professional development resources for English language educators.',
        '/blog',
      );
      return injectIntoTemplate(template, meta, buildBlogIndexHtml(posts));
    }

    const match = pathname.match(/^\/blog\/([^/]+)\/?$/);
    if (match) {
      const slug = decodeURIComponent(match[1]);
      // Reuse the post the routes.ts existence check already loaded, if any.
      const post = preloadedPost?.slug === slug ? preloadedPost : await storage.getBlogPostBySlug(slug);
      if (!post || !post.isPublished) return null;
      const metadata = blogPublicMetadata(post);
      const canonical = `${BASE_URL}${metadata.canonicalPath}`;
      const social = [
        ['property', 'og:title', metadata.title],
        ['property', 'og:description', metadata.description],
        ['property', 'og:url', canonical],
        ['property', 'og:type', 'article'],
        ['property', 'og:image', metadata.imageUrl],
        ['property', 'og:image:alt', metadata.imageAlt],
        ['property', 'og:site_name', 'PlanWise ESL'],
        ['property', 'og:locale', 'en_US'],
        ['name', 'twitter:card', 'summary_large_image'],
        ['name', 'twitter:site', '@PlanwiseESL'],
        ['name', 'twitter:creator', '@DaveTeacher1'],
        ['name', 'twitter:title', metadata.title],
        ['name', 'twitter:description', metadata.description],
        ['name', 'twitter:url', canonical],
        ['name', 'twitter:image', metadata.imageUrl],
        ['name', 'twitter:image:alt', metadata.imageAlt],
      ].map(([attribute, key, value]) => `<meta ${attribute}="${key}" content="${e(value)}" />`).join('\n    ');
      const faqLd = blogFaqJsonLd(post);
      const meta = `${headMeta(metadata.title, metadata.description, metadata.canonicalPath)}\n    ${social}\n    ${blogPostingJsonLd(post)}\n    ${blogBreadcrumbJsonLd(post)}${faqLd ? `\n    ${faqLd}` : ''}`;
      return injectIntoTemplate(template, meta, await buildBlogPostHtml(post), true);
    }

    return null;
  } catch (error) {
    console.error('Error prerendering blog page:', error);
    return null;
  }
}
