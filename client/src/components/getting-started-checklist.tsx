import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { CheckCircle2, Circle, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trackEvent } from '@/lib/analytics';

/**
 * The three steps that make PlanWise click for a teacher: a real student,
 * a lesson built around them, and their own page. Teachers who do all three
 * have the words tracked and a student practising between classes, which is
 * what makes them stay. Each step ticks itself off from the teacher's data.
 */
export interface ChecklistState {
  hasStudent: boolean;
  hasLessonForStudent: boolean;
  hasStudentPage: boolean;
}

export const checklistSteps = [
  {
    key: 'hasStudent' as const,
    title: 'Add a student',
    text: 'Their name, their level and a line about their job or interests.',
    href: '/students',
    cta: 'Add a student',
  },
  {
    key: 'hasLessonForStudent' as const,
    title: 'Make a lesson for them',
    text: 'Choose the student, then a conversation topic from their world, not a grammar point. It is ready in 1–2 minutes.',
    href: '/generate',
    cta: 'Make a lesson',
  },
  {
    key: 'hasStudentPage' as const,
    title: 'Give them their own page',
    text: 'Open the student and create their page, then send them the link: their lessons, words, flashcards and ideas for your next class.',
    href: '/students',
    cta: 'Open my students',
  },
];

const storageKey = (userId: number, name: string) => `planwise.gettingStarted.${name}.${userId}`;

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // Private windows can refuse storage; the checklist then just shows again.
  }
}

export function GettingStartedChecklist({ userId, state }: { userId: number; state: ChecklistState }) {
  const done = checklistSteps.filter((s) => state[s.key]).length;
  const complete = done === checklistSteps.length;
  const [dismissed, setDismissed] = useState(() => readFlag(storageKey(userId, 'dismissed')));

  // Record the moment a teacher finishes all three steps, once.
  useEffect(() => {
    const key = storageKey(userId, 'completed');
    if (complete && !readFlag(key)) {
      writeFlag(key);
      trackEvent('onboarding_completed');
    }
  }, [complete, userId]);

  if (complete || dismissed) return null;
  const next = checklistSteps.find((s) => !state[s.key])!;

  return (
    <Card className="mb-8 border-2 border-primary/30 bg-primary/5 shadow-lg" data-testid="getting-started-checklist">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-nunito font-bold">Get the most out of PlanWise ESL</h2>
            <p className="text-gray-600 mt-1">Three steps, about five minutes. {done} of {checklistSteps.length} done.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              writeFlag(storageKey(userId, 'dismissed'));
              setDismissed(true);
            }}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Hide this checklist"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ol className="mt-5 space-y-4">
          {checklistSteps.map((step, i) => {
            const isDone = state[step.key];
            const isNext = step === next;
            return (
              <li key={step.key} className="flex items-start gap-3" data-done={isDone ? 'true' : 'false'}>
                {isDone ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" aria-label="Done" />
                ) : (
                  <Circle className={`h-6 w-6 shrink-0 mt-0.5 ${isNext ? 'text-primary' : 'text-gray-300'}`} aria-label="Not done yet" />
                )}
                <div className="flex-1">
                  <p className={`font-bold ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {i + 1}. {step.title}
                  </p>
                  {!isDone && <p className="text-gray-700">{step.text}</p>}
                  {isNext && (
                    <Link href={step.href}>
                      <Button className="mt-2 bg-primary hover:bg-primary/90">
                        {step.cta} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-5 text-sm text-gray-600 border-t border-gray-200 pt-4">
          After each class, press <strong>“We did this”</strong> on the student’s page. Their new words join their list, and the next lesson avoids what they already know.
        </p>
      </CardContent>
    </Card>
  );
}
