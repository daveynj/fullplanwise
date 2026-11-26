import { Link } from 'wouter';
import { ArrowRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackCta } from '@/lib/analytics';
import { lessonStages, lessonDesign, lessonDifference } from '@shared/lesson-pedagogy';

/**
 * Shown above a public library lesson to visitors (not its owner): what each
 * part of the lesson is for, and an invitation to make lessons like it.
 * Uses the same words as the crawler HTML in server/lesson-prerender.ts.
 */
export function LessonDesignPanel({ content, signedIn }: { content: unknown; signedIn: boolean }) {
  const stages = lessonStages(content);
  if (stages.length < 3) return null;
  const difference = lessonDifference(stages, content);

  return (
    <section
      aria-labelledby="lesson-design-heading"
      className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 print:hidden"
      data-testid="lesson-design-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h2 id="lesson-design-heading" className="flex items-center gap-2 font-nunito text-lg font-bold text-brand-navy">
            <Layers className="h-5 w-5 text-amber-700" /> {lessonDesign.heading}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{lessonDesign.intro}</p>
        </div>
        {!signedIn && (
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="https://speakwithdave.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCta('public-lesson', 'Take lesson 1-on-1 with Dave')}
            >
              <Button variant="outline" className="rounded-full border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white bg-white">
                Learning English? Take this 1-on-1 with Dave <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href="/auth?register=true" onClick={() => trackCta('public-lesson', 'Make lessons like this')}>
              <Button variant="brand" className="rounded-full">
                Teachers: Make lessons like this <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      <details className="mt-3 group">
        <summary className="cursor-pointer text-sm font-semibold text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2">
          What each part of this lesson does
        </summary>
        <ol className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          {stages.map((stage, i) => (
            <li key={stage.type} className="rounded-xl bg-white/80 p-3 ring-1 ring-amber-100">
              <span className="font-semibold text-brand-navy">{i + 1}. {stage.name}:</span> {stage.purpose}
            </li>
          ))}
        </ol>
        {difference && (
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            {difference} {lessonDesign.tracking}
          </p>
        )}
        <p className="mt-2 text-sm">
          <Link href={lessonDesign.href} className="font-semibold text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2">
            {lessonDesign.linkLabel} →
          </Link>
        </p>
      </details>
    </section>
  );
}
