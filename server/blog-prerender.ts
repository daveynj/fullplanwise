import DOMPurify from 'isomorphic-dompurify';
import { storage } from './storage';
import type { BlogPost } from '@shared/schema';

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

// Same allowlist the client-side blog post page uses, so bots see the same content.
function sanitizeContentHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'iframe', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder'],
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
  });
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
#blog-prerender a { color: #b8912a; }
#blog-prerender img { max-width: 100%; height: auto; border-radius: 8px; }
`;

function headerHtml(): string {
  return `<header class="bp-header">
    <strong><a href="/">PLAN WISE ESL</a></strong>
    <nav>
      <a href="/blog">Blog</a>
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
export function buildBlogPostHtml(post: BlogPost): string {
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
      ${sanitizeContentHtml(post.content)}
    </article>
  </main>
</div>`;
}

function injectIntoTemplate(template: string, meta: string, bodyHtml: string): string {
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, meta);
  html = html.replace('</head>', `    <style>${blogPrerenderCss}</style>\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  return html;
}

/**
 * If pathname is /blog or /blog/:slug, returns the template with prerendered
 * content + meta injected. Returns null when the path is not a blog page or
 * the post is missing/unpublished (callers fall through to the SPA shell).
 * Never throws: on DB errors, returns null so the page still serves.
 */
export async function injectBlogPrerender(template: string, pathname: string): Promise<string | null> {
  try {
    if (pathname === '/blog' || pathname === '/blog/') {
      const { posts } = await storage.getAllBlogPosts(1, 100, undefined, undefined, true);
      const meta = headMeta(
        'Blog - ESL Teaching Tips & Resources | Plan Wise ESL',
        'Discover expert ESL teaching strategies, lesson planning tips, and professional development resources for English language educators.',
        '/blog',
      );
      return injectIntoTemplate(template, meta, buildBlogIndexHtml(posts));
    }

    const match = pathname.match(/^\/blog\/([^/]+)\/?$/);
    if (match) {
      const slug = decodeURIComponent(match[1]);
      const post = await storage.getBlogPostBySlug(slug);
      if (!post || !post.isPublished) return null;
      const meta = headMeta(
        post.metaTitle || `${post.title} | Plan Wise ESL Blog`,
        post.metaDescription || post.excerpt,
        `/blog/${post.slug}`,
      );
      return injectIntoTemplate(template, meta, buildBlogPostHtml(post));
    }

    return null;
  } catch (error) {
    console.error('Error prerendering blog page:', error);
    return null;
  }
}
