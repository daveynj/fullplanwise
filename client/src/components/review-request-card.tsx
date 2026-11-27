import { useState } from 'react';
import { MessageSquareHeart, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { trackEvent } from '@/lib/analytics';

/**
 * A neutral invitation to review PlanWise ESL, shown once a teacher has made
 * enough lessons to have an opinion. It goes to every such teacher, asks for
 * honest words, and offers nothing in return: that is what keeps reviews
 * genuine and within G2's and Trustpilot's rules. Each teacher can hide it,
 * and it stays hidden on that browser.
 */
export const REVIEW_CARD_MIN_LESSONS = 5;

export const reviewLinks = [
  { name: 'G2', href: 'https://www.g2.com/products/planwise-esl/take_survey' },
  { name: 'Trustpilot', href: 'https://www.trustpilot.com/evaluate/planwiseesl.com' },
];

const storageKey = (userId: number) => `planwise.reviewCard.dismissed.${userId}`;

function readDismissed(userId: number): boolean {
  try {
    return window.localStorage.getItem(storageKey(userId)) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(userId: number) {
  try {
    window.localStorage.setItem(storageKey(userId), '1');
  } catch {
    // Private windows can refuse storage; the card then just shows again.
  }
}

export function ReviewRequestCard({ userId, totalLessons }: { userId: number; totalLessons: number }) {
  const [dismissed, setDismissed] = useState(() => readDismissed(userId));

  if (totalLessons < REVIEW_CARD_MIN_LESSONS || dismissed) return null;

  return (
    <Card className="mb-8 border border-amber-300 bg-amber-50" data-testid="review-request-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <MessageSquareHeart className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-nunito font-bold">You've made {totalLessons} lessons. Would you review PlanWise ESL?</h2>
              <p className="text-gray-700 mt-1">
                There are no public reviews yet, and teachers look for them before trying a new tool. An honest review in your own words, good or bad, takes about five minutes and helps other teachers decide.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {reviewLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('review_link_clicked', { site: link.name })}
                    className="rounded-md border border-amber-600 bg-white px-3 py-1.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition"
                  >
                    Review on {link.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              writeDismissed(userId);
              setDismissed(true);
            }}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Hide this request"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
