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
  const colCount = section.table?.headers.length ?? 0;
  const isWide = colCount >= 4;

  return (
    <section className="mt-12">
      {section.heading && <Inline as="h2" text={section.heading} className="text-2xl md:text-3xl font-nunito font-bold tracking-tight mb-4 max-w-3xl" />}
      {section.paragraphs?.map((p, i) => (
        <Inline key={i} as="p" text={p} className="max-w-3xl text-slate-700 leading-relaxed mb-4 [&_a]:text-brand-navy [&_a]:font-semibold [&_a]:underline [&_a]:decoration-brand-yellow [&_a]:decoration-2 [&_a]:underline-offset-2" />
      ))}
      {section.bullets && (
        <ul className="max-w-3xl space-y-2 mb-4 list-disc pl-6 text-slate-700 leading-relaxed [&_a]:text-brand-navy [&_a]:font-semibold [&_a]:underline [&_a]:decoration-brand-yellow [&_a]:decoration-2 [&_a]:underline-offset-2">
          {section.bullets.map((b, i) => (
            <Inline key={i} as="li" text={b} />
          ))}
        </ul>
      )}
      {section.table && (
        <div className="overflow-x-auto my-6 rounded-2xl ring-1 ring-slate-900/10 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-brand-navy text-white">
              <tr>
                {section.table.headers.map((h, i) => {
                  const isPlanwiseCol = h === 'PlanWise ESL';
                  const widthClass = isWide ? (i === 0 ? 'min-w-[140px] w-44' : isPlanwiseCol ? 'min-w-[210px]' : '') : '';
                  return (
                    <Inline
                      key={i}
                      as="th"
                      text={h}
                      className={`px-4 py-3 font-nunito font-bold align-bottom ${widthClass} ${isPlanwiseCol ? 'text-brand-yellow bg-brand-navy' : ''}`}
                    />
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {section.table.rows.map((row, r) => (
                <tr key={r} className={r % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                  {row.map((cell, c) => {
                    const isPlanwiseCol = section.table!.headers[c] === 'PlanWise ESL';
                    return c === 0 ? (
                      <Inline
                        key={c}
                        as="th"
                        text={cell}
                        className={`px-4 py-3.5 font-semibold text-brand-navy align-top break-words ${isWide ? 'min-w-[140px]' : ''}`}
                      />
                    ) : (
                      <Inline
                        key={c}
                        as="td"
                        text={cell}
                        className={`px-4 py-3.5 align-top break-words [&_a]:text-brand-navy [&_a]:font-semibold [&_a]:underline [&_a]:decoration-brand-yellow [&_a]:decoration-2 [&_a]:underline-offset-2 ${
                          isPlanwiseCol
                            ? 'bg-amber-50/50 text-brand-navy font-medium border-l border-amber-200/70'
                            : 'text-slate-700'
                        }`}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section.workflowProof && (
        <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border-2 border-brand-navy bg-white p-6 shadow-sm">
            <Inline as="h3" text={section.workflowProof.planwiseTitle} className="text-lg font-nunito font-bold text-brand-navy" />
            <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm text-slate-700 leading-relaxed [&_a]:text-brand-navy [&_a]:font-semibold [&_a]:underline [&_a]:decoration-brand-yellow [&_a]:decoration-2 [&_a]:underline-offset-2">
              {section.workflowProof.planwiseSteps.map((step, i) => (
                <Inline key={i} as="li" text={step} />
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <Inline as="h3" text={section.workflowProof.competitorTitle} className="text-lg font-nunito font-bold text-slate-700" />
            <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm text-slate-600 leading-relaxed">
              {section.workflowProof.competitorSteps.map((step, i) => (
                <Inline key={i} as="li" text={step} />
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

export default function MarketingPage() {
  const [location] = useLocation();
  const page = marketingPageByPath(location);
  if (!page) return <NotFound />;

  const hasWideTable = page.sections.some((s) => (s.table?.headers.length ?? 0) >= 4);
  const hasTable = page.sections.some((s) => Boolean(s.table));
  const containerWidth = hasWideTable ? 'max-w-5xl' : hasTable ? 'max-w-4xl' : 'max-w-3xl';

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
          <div className={`container mx-auto ${containerWidth}`}>
            <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-6">
              <Link href="/" className="hover:text-brand-navy">Home</Link> <span aria-hidden="true">›</span> {page.navLabel}
            </nav>
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-800 mb-3">{page.eyebrow}</p>
            <Inline as="h1" text={page.h1} className="text-4xl md:text-5xl font-nunito font-bold leading-tight tracking-tight mb-6 max-w-3xl" />
            {page.byline && (
              <p className="text-sm text-slate-500 mb-6">
                By <Link href="/about" className="font-semibold text-brand-navy hover:underline">{page.byline.author}</Link>
                {page.byline.author === 'Dave Jackson' ? ', ESL teacher and founder of PlanWise ESL' : null}
                {page.byline.note ? <> · {page.byline.note}</> : null}
              </p>
            )}
            {page.intro.map((p, i) => (
              <Inline key={i} as="p" text={p} className="max-w-3xl text-lg md:text-xl text-slate-600 leading-relaxed mb-4" />
            ))}
            <Link href={page.cta.href}>
              <Button size="lg" variant="brand" className="mt-4 rounded-full px-8 shadow-lg shadow-brand-yellow/40">
                {page.cta.label} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <article className={`container mx-auto ${containerWidth} px-6 pb-16`}>
          {page.verdict && (
            <section className="mt-8 rounded-2xl border-l-4 border-brand-yellow bg-slate-50 p-6 shadow-sm ring-1 ring-slate-900/5">
              <Inline as="h2" text={page.verdict.heading} className="text-xl font-nunito font-bold text-brand-navy mb-2" />
              <Inline as="p" text={page.verdict.text} className="text-slate-700 leading-relaxed [&_a]:text-brand-navy [&_a]:font-semibold [&_a]:underline [&_a]:decoration-brand-yellow [&_a]:decoration-2 [&_a]:underline-offset-2" />
            </section>
          )}

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
            <p className="text-xs text-white/70 mt-4 pt-4 border-t border-white/10">
              Built by British ESL teacher Dave Jackson — still planning every class for his own 1-on-1 students. Looking for 1-on-1 English lessons?{' '}
              <a
                href="https://speakwithdave.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-yellow underline hover:text-brand-yellow-light"
              >
                SpeakWithDave.com
              </a>
            </p>
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
