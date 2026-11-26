import {
  homepageMeta,
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
  testimonials,
  finalCta,
  faq,
  footer,
} from '@shared/homepage-content';
import { siteFacts, trialText } from '@shared/site-facts';
import { publicNav } from '@shared/marketing-pages';

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

/** Builds the static, crawler-readable landing page markup (same order as the React page). */
export function buildLandingPrerenderHtml(): string {
  const list = (items: string[]) => items.map((i) => `<li>${e(i)}</li>`).join('');
  const featuresHtml = features.items
    .map((f) => `<div class="lp-card"><h3>${e(f.title)}</h3><p>${e(f.text)}</p></div>`)
    .join('');
  const sciencePointsHtml = science.points
    .map((p) => `<li><strong>${e(p.title)}:</strong> ${e(p.text)}</li>`)
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
        <ul>${list(p.features)}</ul>
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
  const courseHtml = (course: { label: string; titles: string[] }) =>
    `<div class="lp-card"><h3>${e(course.label)}</h3><ol>${list(course.titles)}</ol></div>`;

  return `<div id="landing-prerender">
  <header class="lp-header">
    <strong>PlanWise ESL</strong>
    <nav>
      ${publicNav.map((l) => `<a href="${l.href}">${l.label}</a>`).join('\n      ')}
      <a href="/auth">Login</a>
      <a href="/auth?register=true">Sign Up Free</a>
    </nav>
  </header>

  <main>
  <section class="lp-section lp-hero">
    <p>${e(hero.badge)}</p>
    <h1>${e(hero.heading)}</h1>
    <p class="lp-lead">${e(hero.subheading)}</p>
    <ul>${list(hero.benefits)}</ul>
    <p>
      <a class="lp-btn" href="/auth?register=true">${e(hero.primaryCta)}</a>
      <a class="lp-btn lp-btn-alt" href="#sample-lesson">${e(hero.secondaryCta)}</a>
    </p>
    <p>${e(hero.noCardNote)} &bull; ${e(hero.freeLessonsNote)}</p>
    <figure>
      <img src="${e(hero.image)}" alt="${e(hero.imageAlt)}" width="${hero.imageWidth}" height="${hero.imageHeight}" />
      <figcaption><strong>${e(hero.previewTitle)}</strong> ${e(hero.previewText)}</figcaption>
    </figure>
    <p><strong>${e(hero.audienceIntro)}</strong></p>
    <ul>${list(hero.audience)}</ul>
  </section>

  <section id="what-is-planwise" class="lp-section">
    <h2>${e(definition.heading)}</h2>
    <p>${e(definition.text)}</p>
    <div class="lp-stats">${statsHtml}</div>
  </section>

  <section class="lp-section">
    <h2>${e(personalisation.heading)}</h2>
    <p>${e(personalisation.intro)}</p>
    <div class="lp-grid-2">${courseHtml(personalisation.personal)}${courseHtml(personalisation.general)}</div>
    <p>${e(personalisation.note)}</p>
    <p><a href="${e(personalisation.href)}">${e(personalisation.cta)}</a></p>
  </section>

  <section id="sample-lesson" class="lp-section">
    <h2>${e(showcase.heading)}</h2>
    <p>${e(showcase.subheading)}</p>
    <p><a href="/lessons/${showcase.lessonId}">${e(showcase.viewFullLabel)}</a></p>
    <p><a class="lp-btn" href="/auth?register=true">${e(showcase.cta)}</a></p>
  </section>

  <section class="lp-section">
    <h2>${e(problem.heading)}</h2>
    <p>${e(problem.intro)}</p>
    <div class="lp-grid-2">
      <div class="lp-card"><h3>${e(problem.traditional.title)}</h3><ul>${list(problem.traditional.items)}</ul></div>
      <div class="lp-card"><h3>${e(problem.withPlanwise.title)}</h3><ul>${list(problem.withPlanwise.items)}</ul></div>
    </div>
    <p><strong>${e(problem.conclusion)}</strong></p>
    <p><a href="/compare">Compare PlanWise ESL vs. Twee, ESL Brains, Linguahouse, Off2Class &amp; ChatGPT</a></p>
  </section>

  <section class="lp-section">
    <h2>Browse Free Teacher-Led ESL Lessons by CEFR Level (No Login Required)</h2>
    <p>Inspect complete 8-stage lessons before signing up — complete with phonetic pronunciation, word families, collocations, levelled readings, semantic maps, and downloadable Vocabulary Review PDFs.</p>
    <ul>
      <li><a href="/esl-lessons">Browse All Free ESL Lessons (A1–C2)</a></li>
      <li><a href="/esl-lessons/a1">A1 Beginner Free ESL Lessons</a></li>
      <li><a href="/esl-lessons/a2">A2 Elementary Free ESL Lessons</a></li>
      <li><a href="/esl-lessons/b1">B1 Intermediate Free ESL Lessons</a></li>
      <li><a href="/esl-lessons/b2">B2 Upper Intermediate Free ESL Lessons</a></li>
      <li><a href="/esl-lessons/c1">C1 Advanced Free ESL Lessons</a></li>
      <li><a href="/esl-lessons/c2">C2 Proficiency Free ESL Lessons</a></li>
    </ul>
  </section>

  <section id="features" class="lp-section">
    <h2>${e(features.heading)}</h2>
    <div class="lp-grid-3">${featuresHtml}</div>
  </section>

  <section class="lp-section">
    <h2>${e(science.heading)}</h2>
    <p>${e(science.intro)}</p>
    <ol>${sciencePointsHtml}</ol>
    <figure>
      <img src="${e(science.image)}" alt="${e(science.imageAlt)}" width="1650" height="900" loading="lazy" />
      <figcaption>${e(science.imageCaption)}</figcaption>
    </figure>
    <p><a href="${e(science.href)}">${e(science.cta)}</a></p>
  </section>

  <section class="lp-section">
    <h2>${e(steps.heading)}</h2>
    <div class="lp-grid-3">${stepsHtml}</div>
  </section>

  <section class="lp-section">
    <h2>${e(founder.heading)}</h2>
    <blockquote class="lp-card">
      <p>&ldquo;${e(founder.quote)}&rdquo;</p>
      <footer>&ndash; ${e(founder.name)}, ${e(founder.role)}</footer>
    </blockquote>
    <p><a href="${e(founder.href)}">${e(founder.linkLabel)}</a></p>
  </section>

  <section class="lp-section">
    <h2>${e(testimonials.heading)}</h2>
    ${testimonialsHtml}
  </section>

  <section id="pricing" class="lp-section">
    <h2>${e(pricing.heading)}</h2>
    <div class="lp-grid-2">${plansHtml}</div>
    <p><a href="/pricing">Compare plans in detail</a></p>
  </section>

  <section class="lp-section">
    <h2>${e(faq.heading)}</h2>
    <p>${e(faq.subheading)}</p>
    ${faqHtml}
  </section>

  <section class="lp-section">
    <h2>${e(finalCta.heading)}</h2>
    <p>${e(finalCta.lead)}</p>
    <p><a class="lp-btn" href="/auth?register=true">${e(finalCta.cta)}</a></p>
    <p>${e(hero.noCardNote)} &bull; ${e(finalCta.freeLessonsNote)}</p>
  </section>
  </main>

  <footer class="lp-footer">
    <p><strong>PlanWise ESL</strong> &mdash; ${e(footer.brandLine)}</p>
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
#landing-prerender img { max-width: 100%; height: auto; border-radius: 12px; }
`;

/** Builds the <head> meta snippet for the landing page (title, description, robots, canonical). */
export function buildLandingHeadMeta(): string {
  return `<title>${e(homepageMeta.title)}</title>
    <meta name="description" content="${e(homepageMeta.description)}" />
    <meta name="keywords" content="${e(homepageMeta.keywords.join(', '))}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    <link rel="canonical" href="${e(homepageMeta.canonicalUrl)}" />`;
}

/** JSON for a <script type="application/ld+json"> block; '<' is escaped so content cannot close the tag. */
function jsonLd(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function faqAnswerText(parts: { type: string; text: string }[]): string {
  return parts.map((part) => part.text).join('').trim();
}

/**
 * Homepage structured data: the product (with its real offers) and the FAQ.
 * Search engines and AI assistants read these to answer "what is it, who is
 * it for, what does it cost". No ratings are included: only add an
 * aggregateRating once there are real, published reviews to back it.
 */
export function buildLandingStructuredData(): string {
  const software = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${siteFacts.url}/#software`,
    name: siteFacts.brand,
    alternateName: [...siteFacts.alternateNames],
    url: siteFacts.url,
    description: `AI-powered CEFR ${siteFacts.levels} lesson planner for 1-on-1 online ESL tutors on Preply and italki. Generates complete conversation lessons in ${siteFacts.generationTime} with per-student vocabulary memory and private student flashcard dashboards.`,
    applicationCategory: 'EducationalApplication',
    applicationSubCategory: 'ESL lesson planning',
    operatingSystem: 'Web browser',
    inLanguage: 'en',
    image: `${siteFacts.url}${homepageMeta.imagePath}`,
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'teacher',
      audienceType: 'Preply and italki tutors, freelance ESL and EFL teachers, and small to medium language schools',
    },
    featureList: features.items.map((f) => f.title),
    offers: [
      {
        '@type': 'Offer',
        name: `Free (${trialText})`,
        price: '0',
        priceCurrency: siteFacts.currency,
        url: `${siteFacts.url}/auth?register=true`,
      },
      {
        '@type': 'Offer',
        name: 'Unlimited',
        price: siteFacts.priceValue,
        priceCurrency: siteFacts.currency,
        description: `Unlimited plan (${siteFacts.price}/${siteFacts.pricePeriod}) with a ${trialText}`,
        url: `${siteFacts.url}/pricing`,
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: siteFacts.priceValue,
          priceCurrency: siteFacts.currency,
          referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
        },
      },
    ],
    author: {
      '@type': 'Person',
      name: siteFacts.founder,
      url: siteFacts.founderSite,
    },
    creator: { '@id': `${siteFacts.url}/#organization` },
    publisher: { '@id': `${siteFacts.url}/#organization` },
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${siteFacts.url}/#faq`,
    mainEntity: faq.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: faqAnswerText(item.answer) },
    })),
  };

  const videoId = hero.videoUrl.match(/(?:embed\/|v=|youtu\.be\/)([\w-]{11})/)?.[1];
  const video = videoId
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        '@id': `${siteFacts.url}/#demo-video`,
        name: hero.videoTitle,
        description: homepageMeta.description,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        embedUrl: hero.videoUrl,
        contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
        inLanguage: 'en',
        publisher: { '@id': `${siteFacts.url}/#organization` },
      }
    : null;

  return [software, faqPage, ...(video ? [video] : [])].map(jsonLd).join('\n    ');
}

/**
 * Injects prerendered landing content + meta into a served index.html string.
 * Safe no-op if the placeholders are missing.
 */
export function injectLandingPrerender(template: string): string {
  let html = template;

  // 1. Replace the default <title> with the landing title + description/robots/canonical.
  html = html.replace(/<title>[^<]*<\/title>/, buildLandingHeadMeta());

  // Keep homepage social copy current before React runs. Match SEOHead's
  // description limit; this injector is only used for the homepage.
  const socialDescription = homepageMeta.description.length > 160
    ? homepageMeta.description.substring(0, 157) + '...'
    : homepageMeta.description;
  for (const [attribute, key, value] of [
    ['property', 'og:title', homepageMeta.title],
    ['property', 'og:description', socialDescription],
    ['name', 'twitter:title', homepageMeta.title],
    ['name', 'twitter:description', socialDescription],
  ]) {
    html = html.replace(
      new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*/?>`),
      () => `<meta ${attribute}="${key}" content="${e(value)}" />`,
    );
  }

  // 2. Inject structured data and prerender styles before </head>.
  html = html.replace(
    '</head>',
    () => `    ${buildLandingStructuredData()}\n    <style>${landingPrerenderCss}</style>\n  </head>`,
  );

  // 3. Inject the static content inside the root div so bots can read it.
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${buildLandingPrerenderHtml()}</div>`,
  );

  return html;
}
