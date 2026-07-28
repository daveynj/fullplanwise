import {
  homepageMeta,
  hero,
  showcase,
  problem,
  features,
  steps,
  pricing,
  testimonials,
  finalCta,
  faq,
  footer,
} from '@shared/homepage-content';

/**
 * Server-side prerender of the landing page.
 *
 * The SPA's <div id="root"> is empty when bots fetch "/", so crawlers and AI
 * assistants saw no content. This module builds static, semantic HTML from the
 * shared homepage content module and injects it into the root div of the
 * served index.html for GET / only. When the React app mounts, createRoot()
 * replaces this placeholder markup, so there are no hydration mismatches.
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

function faqAnswerHtml(parts: { type: string; text: string; href?: string }[]): string {
  return parts
    .map((part) =>
      part.type === 'link'
        ? `<a href="${e(part.href!)}">${e(part.text)}</a>`
        : e(part.text),
    )
    .join('');
}

/** Builds the static, crawler-readable landing page markup. */
export function buildLandingPrerenderHtml(): string {
  const benefitsHtml = hero.benefits.map((b) => `<li>${e(b)}</li>`).join('');
  const audienceHtml = hero.audience.map((a) => `<li>${e(a)}</li>`).join('');
  const traditionalHtml = problem.traditional.items.map((i) => `<li>${e(i)}</li>`).join('');
  const withPlanwiseHtml = problem.withPlanwise.items.map((i) => `<li>${e(i)}</li>`).join('');
  const featuresHtml = features.items
    .map((f) => `<div class="lp-card"><h3>${e(f.title)}</h3><p>${e(f.text)}</p></div>`)
    .join('');
  const stepsHtml = steps.items
    .map(
      (s) =>
        `<div class="lp-step"><div class="lp-step-num">${s.number}</div><h3>${e(s.title)}</h3><p>${e(s.text)}</p></div>`,
    )
    .join('');
  const plansHtml = pricing.plans
    .map(
      (p) => `<div class="lp-card lp-plan${p.highlighted ? ' lp-plan-hl' : ''}">
        <h3>${e(p.name)}</h3>
        <p>${e(p.description)}</p>
        <p class="lp-price">${e(p.price)}<span>${e(p.priceSuffix)}</span></p>
        <ul>${p.features.map((f) => `<li>${e(f)}</li>`).join('')}</ul>
        <a class="lp-btn" href="${e(p.ctaHref)}">${e(p.cta)}</a>
      </div>`,
    )
    .join('');
  const testimonialsHtml = testimonials.items
    .map(
      (t) => `<blockquote class="lp-card">
        <p>&ldquo;${e(t.quote)}&rdquo;</p>
        <footer>&ndash; ${e(t.author)}</footer>
      </blockquote>`,
    )
    .join('');
  const statsHtml = finalCta.stats
    .map((s) => `<div><strong>${e(s.value)}</strong><br>${e(s.label)}</div>`)
    .join('');
  const faqHtml = faq.items
    .map(
      (item) => `<div class="lp-card lp-faq">
        <h3>${e(item.question)}</h3>
        <p>${faqAnswerHtml(item.answer)}</p>
      </div>`,
    )
    .join('');
  const quickLinksHtml = footer.quickLinks
    .map((l) => `<li><a href="${e(l.href)}">${e(l.label)}</a></li>`)
    .join('');

  return `<div id="landing-prerender">
  <header class="lp-header">
    <strong>PLAN WISE ESL</strong>
    <nav>
      <a href="/blog">Blog</a>
      <a href="/auth">Login</a>
      <a href="/auth?register=true">Sign Up Free</a>
    </nav>
  </header>

  <section class="lp-section lp-hero">
    <h1>${e(hero.heading)}</h1>
    <p class="lp-lead">${e(hero.subheading)}</p>
    <ul>${benefitsHtml}</ul>
    <p><strong>${e(hero.audienceIntro)}</strong></p>
    <ul>${audienceHtml}</ul>
    <p>
      <a class="lp-btn" href="/auth?register=true">${e(hero.primaryCta)}</a>
      <a class="lp-btn lp-btn-alt" href="#features">${e(hero.secondaryCta)}</a>
    </p>
    <p>${e(hero.noCardNote)} &bull; ${e(hero.freeLessonsNote)}</p>
    <h2>${e(hero.previewTitle)}</h2>
    <p>${e(hero.previewText)}</p>
  </section>

  <section class="lp-section">
    <h2>${e(showcase.heading)}</h2>
    <p>${e(showcase.subheading)}</p>
    <p><a href="/lessons/${showcase.lessonId}">${e(showcase.viewFullLabel)}</a></p>
    <p><a class="lp-btn" href="/auth?register=true">${e(showcase.cta)}</a></p>
  </section>

  <section class="lp-section">
    <h2>${e(problem.heading)}</h2>
    <p>${e(problem.intro)}</p>
    <div class="lp-grid-2">
      <div class="lp-card"><h3>${e(problem.traditional.title)}</h3><ul>${traditionalHtml}</ul></div>
      <div class="lp-card"><h3>${e(problem.withPlanwise.title)}</h3><ul>${withPlanwiseHtml}</ul></div>
    </div>
    <p><strong>${e(problem.conclusion)}</strong></p>
  </section>

  <section id="features" class="lp-section">
    <h2>${e(features.heading)}</h2>
    <div class="lp-grid-3">${featuresHtml}</div>
  </section>

  <section class="lp-section">
    <h2>${e(steps.heading)}</h2>
    <div class="lp-grid-3">${stepsHtml}</div>
  </section>

  <section id="pricing" class="lp-section">
    <h2>${e(pricing.heading)}</h2>
    <div class="lp-grid-2">${plansHtml}</div>
  </section>

  <section class="lp-section">
    <h2>${e(testimonials.heading)}</h2>
    ${testimonialsHtml}
  </section>

  <section class="lp-section">
    <h2>${e(finalCta.heading)}</h2>
    <div class="lp-stats">${statsHtml}</div>
    <p>${e(finalCta.lead)}</p>
    <p><a class="lp-btn" href="/auth?register=true">${e(finalCta.cta)}</a></p>
    <p>${e(hero.noCardNote)} &bull; ${e(finalCta.freeLessonsNote)}</p>
  </section>

  <section class="lp-section">
    <h2>${e(faq.heading)}</h2>
    <p>${e(faq.subheading)}</p>
    ${faqHtml}
  </section>

  <footer class="lp-footer">
    <p><strong>PlanwiseESL</strong> &mdash; ${e(footer.brandLine)}</p>
    <ul>${quickLinksHtml}</ul>
    <ul>${footer.aboutItems.map((i) => `<li>${e(i)}</li>`).join('')}</ul>
    <p>
      <a href="${e(footer.social.linkedin)}" rel="noopener noreferrer">LinkedIn</a> &bull;
      <a href="${e(footer.social.twitter)}" rel="noopener noreferrer">X (Twitter)</a>
    </p>
    <p>${e(footer.copyright)}</p>
    <p>${e(footer.tagline)}</p>
  </footer>
</div>`;
}

/** Minimal standalone styling so a no-JavaScript fetch is readable (not for the hydrated app). */
export const landingPrerenderCss = `
#landing-prerender { font-family: 'Open Sans', Arial, sans-serif; color: #051d40; background: #fdfdfd; line-height: 1.6; }
#landing-prerender .lp-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #eee; }
#landing-prerender .lp-header nav a { margin-left: 16px; color: #051d40; }
#landing-prerender .lp-section { max-width: 960px; margin: 0 auto; padding: 48px 24px; }
#landing-prerender .lp-hero h1 { font-size: 2.2rem; line-height: 1.2; }
#landing-prerender .lp-lead { font-size: 1.2rem; }
#landing-prerender .lp-grid-2, #landing-prerender .lp-grid-3 { display: grid; gap: 24px; }
#landing-prerender .lp-grid-2 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
#landing-prerender .lp-grid-3 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
#landing-prerender .lp-card { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
#landing-prerender .lp-plan-hl { border: 2px solid #edc437; }
#landing-prerender .lp-price { font-size: 1.8rem; font-weight: bold; }
#landing-prerender .lp-price span { font-size: 1rem; font-weight: normal; }
#landing-prerender .lp-step { text-align: center; }
#landing-prerender .lp-step-num { font-size: 2rem; font-weight: bold; color: #edc437; }
#landing-prerender .lp-btn { display: inline-block; background: #edc437; color: #051d40; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 4px 8px 4px 0; }
#landing-prerender .lp-btn-alt { background: transparent; border: 1px solid #051d40; }
#landing-prerender .lp-stats { display: flex; gap: 32px; margin: 16px 0; }
#landing-prerender .lp-stats strong { font-size: 1.6rem; color: #b8912a; }
#landing-prerender .lp-footer { background: #051d40; color: #fdfdfd; padding: 32px 24px; }
#landing-prerender .lp-footer a { color: #edc437; }
`;

/** Builds the <head> meta snippet for the landing page (title, description, robots, canonical). */
export function buildLandingHeadMeta(): string {
  return `<title>${e(homepageMeta.title)}</title>
    <meta name="description" content="${e(homepageMeta.description)}" />
    <meta name="keywords" content="${e(homepageMeta.keywords.join(', '))}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    <link rel="canonical" href="${e(homepageMeta.canonicalUrl)}" />`;
}

/**
 * Injects prerendered landing content + meta into a served index.html string.
 * Safe no-op if the placeholders are missing.
 */
export function injectLandingPrerender(template: string): string {
  let html = template;

  // 1. Replace the default <title> with the landing title + description/robots/canonical.
  html = html.replace(/<title>[^<]*<\/title>/, buildLandingHeadMeta());

  // 2. Inject prerender styles before </head>.
  html = html.replace(
    '</head>',
    `    <style>${landingPrerenderCss}</style>\n  </head>`,
  );

  // 3. Inject the static content inside the root div so bots can read it.
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${buildLandingPrerenderHtml()}</div>`,
  );

  return html;
}
