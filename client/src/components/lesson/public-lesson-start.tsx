import { ArrowRight, Play, Printer, Sparkles } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { lessonStages, lessonDesign } from '@shared/lesson-pedagogy';
import { tryDecodeLessonContent } from '@shared/lesson-content';
import type { TutorLink } from '@shared/tutor-link';

const arr = (value: unknown): any[] => (Array.isArray(value) ? value : []);

/** What a visitor gets from a free lesson, counted from the lesson's own sections. */
export function publicLessonFacts(content: unknown): { words: number; reading: boolean; questions: number; minutes: number | null } {
  const decoded = tryDecodeLessonContent(content);
  const sections = arr(decoded?.sections).filter(Boolean);
  const words = sections
    .filter((s) => s.type === 'vocabulary')
    .reduce((n, s) => n + arr(s.words).length, 0);
  const reading = sections.some((s) => s.type === 'reading');
  const questions = sections
    .filter((s) => s.type === 'discussion' || s.type === 'speaking')
    .reduce((n, s) => n + arr(s.questions).length, 0);
  const rawMinutes = Number(decoded?.estimatedTime);
  const minutes = Number.isFinite(rawMinutes) && rawMinutes > 0 ? Math.round(rawMinutes) : null;
  return { words, reading, questions, minutes };
}

interface PublicLessonStartProps {
  lessonId: number;
  level: string;
  content: unknown;
  remixHref: string;
  questionsHref?: string | null;
  tutorLink: TutorLink;
  onStart: () => void;
}

/**
 * The one panel a visitor sees between a free lesson's title and its first
 * section: what the lesson contains, a clear way in ("Start the lesson"),
 * and the two next steps (make it for a student, print the questions).
 * Replaces three stacked banners, so the lesson itself starts higher up.
 */
export function PublicLessonStart({ lessonId, level, content, remixHref, questionsHref, tutorLink, onStart }: PublicLessonStartProps) {
  const facts = publicLessonFacts(content);
  const stages = lessonStages(content);
  const params = { lesson_id: lessonId, cefr_level: level };
  const chips = [
    'Free · no login',
    facts.words ? `${facts.words} key words` : null,
    facts.reading ? 'A reading' : null,
    facts.questions ? `${facts.questions} discussion questions` : null,
    facts.minutes ? `About ${facts.minutes} min` : null,
    'Printable PDF',
  ].filter((c): c is string => !!c);

  return (
    <section
      aria-label="About this free lesson"
      className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 print:hidden"
      data-testid="public-lesson-start"
    >
      <ul className="flex flex-wrap gap-2" aria-label="What this lesson includes">
        {chips.map((chip) => (
          <li key={chip} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-brand-navy ring-1 ring-slate-200">
            {chip}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            trackEvent('public_lesson_started', params);
            onStart();
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-5 py-2.5 text-base font-bold text-white shadow hover:bg-brand-navy/90"
          data-testid="public-lesson-start-button"
        >
          <Play className="h-4 w-4" aria-hidden="true" /> Start the lesson
        </button>
        <a
          href={remixHref}
          onClick={() => trackEvent('public_lesson_remix_clicked', { ...params, location: 'start' })}
          className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-5 py-2.5 text-base font-bold text-brand-navy shadow hover:bg-amber-300"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" /> Make it for my student
        </a>
        {questionsHref && (
          <a
            href={questionsHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('public_lesson_questions_opened', params)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2"
          >
            <Printer className="h-4 w-4" aria-hidden="true" /> Print the questions
          </a>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-600">
        &ldquo;Make it for my student&rdquo; writes a new version at your student&apos;s level, about their interests, that skips words they already know.
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-slate-600">
        {stages.length >= 3 ? (
          <details className="group">
            <summary className="cursor-pointer font-semibold text-brand-navy">How this lesson works</summary>
            <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {stages.map((stage, i) => (
                <li key={stage.type}>
                  <span className="font-semibold text-brand-navy">{i + 1}. {stage.name}:</span> {stage.purpose}
                </li>
              ))}
            </ol>
            <a href={lessonDesign.href} className="mt-2 inline-block font-medium text-brand-navy underline underline-offset-2">
              {lessonDesign.linkLabel}
            </a>
          </details>
        ) : <span />}
        <span>
          By Dave Jackson, British ESL teacher.{' '}
          <a
            href={tutorLink.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('public_lesson_tutor_clicked', { ...params, location: 'start' })}
            className="font-medium text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2"
          >
            {tutorLink.belowTaughtLevels ? 'Learning English?' : 'Learning English? Take it 1-on-1'} <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </span>
      </div>
    </section>
  );
}

interface PublicLessonFinishProps {
  lessonId: number;
  level: string;
  remixHref: string;
  questionsHref?: string | null;
}

/** Shown under the last section: the natural next step once a visitor has seen the whole lesson. */
export function PublicLessonFinish({ lessonId, level, remixHref, questionsHref }: PublicLessonFinishProps) {
  const params = { lesson_id: lessonId, cefr_level: level };
  return (
    <section
      aria-label="Next steps"
      className="mt-8 rounded-2xl bg-brand-navy p-5 sm:p-6 text-white print:hidden"
      data-testid="public-lesson-finish"
    >
      <h2 className="font-nunito text-xl font-bold">That&apos;s the whole lesson. What next?</h2>
      <p className="mt-1 text-sm text-white/80">
        Teaching a particular student? PlanWise ESL makes their next lesson in 1–2 minutes, at their level, using the words they already know.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={remixHref}
          onClick={() => trackEvent('public_lesson_remix_clicked', { ...params, location: 'finish' })}
          className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-5 py-2.5 text-base font-bold text-brand-navy shadow hover:bg-amber-300"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" /> Make it for my student
        </a>
        <a
          href={`/esl-lessons/${level.toLowerCase()}`}
          onClick={() => trackEvent('public_lesson_more_clicked', params)}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-base font-bold text-brand-navy hover:bg-amber-50"
        >
          More free {level} lessons <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
        {questionsHref && (
          <a
            href={questionsHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('public_lesson_questions_opened', { ...params, location: 'finish' })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white underline decoration-brand-yellow decoration-2 underline-offset-2"
          >
            <Printer className="h-4 w-4" aria-hidden="true" /> Print the questions
          </a>
        )}
      </div>
    </section>
  );
}
