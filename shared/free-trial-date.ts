/**
 * The free-trial end date as shown on the site ("December 10th, 2026").
 *
 * It is always given in UK time, the time zone the trial and the emails use,
 * so every visitor sees the same day as the emails. Formatting in the
 * visitor's own time zone made 2026-12-10T23:59:59Z read "December 11th" in
 * Asia and Australia.
 */

const TRIAL_TIME_ZONE = 'Europe/London';

function ordinal(day: number): string {
  const lastTwo = day % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

/** "December 10th, 2026", or "December 10th" with `withYear: false`. */
export function formatTrialEndDate(date: Date, { withYear = true }: { withYear?: boolean } = {}): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TRIAL_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const dayAndMonth = `${get('month')} ${ordinal(Number(get('day')))}`;
  return withYear ? `${dayAndMonth}, ${get('year')}` : dayAndMonth;
}
