import { Link, useLocation } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { BlogHeader } from '@/components/layout/blog-header';
import { PublicFooter } from '@/components/layout/public-footer';
import NotFound from '@/pages/not-found';
import {
  marketingPageByPath,
  renderInline,
  type MarketingSection,
} from '@shared/marketing-pages';

/** Inline-marked text (**bold**, [link](/path)) from shared/marketing-pages.ts; the text is ours and escaped. */
function Inline({ text, as: Tag = 'span', className }: { text: string; as?: 'span' | 'p' | 'li' | 'h1' | 'h2' | 'h3' | 'td' | 'th'; className?: string }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: renderInline(text) }} />;
}

function Section({ section }: { section: MarketingSection }) {
  return (
    <section className="mt-12">
      {section.heading && <Inline as="h2" text={section.heading} className="text-2xl md:text-3xl font-nunito font-bold tracking-tight mb-4" />}
      {section.paragraphs?.map((p, i) => (
        <Inline key={i} as="p" text={p} className="text-slate-700 leading-relaxed mb-4 [&_a]:text-brand-navy [&_a]:font-semibold [&_a]:underline [&_a]:decoration-brand-yellow [&_a]:decoration-2 [&_a]:underline-offset-2" />
      ))}
      {section.bullets && (
        <ul className="space-y-2 mb-4 list-disc pl-6 text-slate-700 leading-relaxed [&_a]:text-brand-navy [&_a]:font-semibold [&_a]:underline [&_a]:decoration-brand-yellow [&_a]:decoration-2 [&_a]:underline-offset-2">
          {section.bullets.map((b, i) => (
            <Inline key={i} as="li" text={b} />
          ))}
        </ul>
      )}
      {section.table && (
        <div className="overflow-x-auto my-6 rounded-2xl ring-1 ring-slate-900/10">
          <table className="w-full text-sm text-left">
            <thead className="bg-amber-50 text-brand-navy">
              <tr>
                {section.table.headers.map((h, i) => (
                  <Inline key={i} as="th" text={h} className="px-4 py-3 font-nunito font-bold align-bottom" />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {section.table.rows.map((row, r) => (
                <tr key={r} className="bg-white">
                  {row.map((cell, c) =>
                    c === 0 ? (
                      <Inline key={c} as="th" text={cell} className="px-4 py-3 font-semibold text-brand-navy align-top whitespace-nowrap" />
                    ) : (
                      <Inline key={c} as="td" text={cell} className="px-4 py-3 text-slate-700 align-top" />
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function MarketingPage() {
  const [location] = useLocation();
  const page = marketingPageByPath(location);
  if (!page) return <NotFound />;

  return (
    <div className="flex flex-col min-h-screen font-open-sans bg-white text-brand-navy antialiased">
      <SEOHead
        title={page.title}
        exactTitle
        description={page.description}
        canonicalUrl={page.path}
      />
      <BlogHeader />

      <main className="flex-1">
        <div className="bg-gradient-to-b from-amber-50/80 to-white px-6 pt-12 pb-8 md:pt-16">
          <div className="container mx-auto max-w-3xl">
            <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-6">
              <Link href="/" className="hover:text-brand-navy">Home</Link> <span aria-hidden="true">›</span> {page.navLabel}
            </nav>
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-800 mb-3">{page.eyebrow}</p>
            <Inline as="h1" text={page.h1} className="text-4xl md:text-5xl font-nunito font-bold leading-tight tracking-tight mb-6" />
            {page.byline && (
              <p className="text-sm text-slate-500 mb-6">
                By <Link href="/about" className="font-semibold text-brand-navy hover:underline">{page.byline.author}</Link>
                {page.byline.author === 'Dave Jackson' ? ', ESL teacher and founder of PlanWise ESL' : null}
                {page.byline.note ? <> · {page.byline.note}</> : null}
              </p>
            )}
            {page.intro.map((p, i) => (
              <Inline key={i} as="p" text={p} className="text-lg md:text-xl text-slate-600 leading-relaxed mb-4" />
            ))}
            <Link href={page.cta.href}>
              <Button size="lg" variant="brand" className="mt-4 rounded-full px-8 shadow-lg shadow-brand-yellow/40">
                {page.cta.label} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <article className="container mx-auto max-w-3xl px-6 pb-16">
          {page.sections.map((s, i) => (
            <Section key={i} section={s} />
          ))}

          {page.faq && (
            <section className="mt-14">
              <h2 className="text-2xl md:text-3xl font-nunito font-bold tracking-tight mb-6">Frequently asked questions</h2>
              <div className="grid gap-4">
                {page.faq.map((f, i) => (
                  <div key={i} className="rounded-2xl p-6 ring-1 ring-slate-900/5 bg-gradient-to-b from-amber-50/40 to-white">
                    <Inline as="h3" text={f.question} className="text-lg font-nunito font-bold mb-2" />
                    <Inline as="p" text={f.answer} className="text-slate-600 leading-relaxed" />
                  </div>
                ))}
              </div>
            </section>
          )}

          <aside className="mt-14 rounded-3xl bg-brand-navy text-white p-8 md:p-10 text-center">
            <Inline as="h2" text={page.cta.heading} className="text-2xl md:text-3xl font-nunito font-bold mb-3" />
            <Inline as="p" text={page.cta.text} className="text-white/80 mb-6 max-w-xl mx-auto [&_a]:text-brand-yellow [&_a]:underline" />
            <Link href={page.cta.href}>
              <Button size="lg" variant="brand" className="rounded-full px-10">
                {page.cta.label} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-sm text-white/60 mt-4">No credit card required</p>
          </aside>

          {page.disclaimer && <Inline as="p" text={page.disclaimer} className="mt-10 text-xs text-slate-400" />}

          {page.references && (
            <section className="mt-14">
              <h2 className="text-xl font-nunito font-bold mb-4">References</h2>
              <ol className="list-decimal pl-6 space-y-2 text-sm text-slate-600">
                {page.references.map((r, i) => (
                  <Inline key={i} as="li" text={r} />
                ))}
              </ol>
            </section>
          )}
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}
