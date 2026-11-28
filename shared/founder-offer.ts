/**
 * The FOUNDER promotion code, as set up in Stripe: 50% off Unlimited for as
 * long as the teacher stays subscribed, for the first 20 teachers, until
 * 13 December 2026 (end of day UTC). The code is typed at Stripe checkout
 * (allow_promotion_codes), so this file only decides when the site mentions it.
 */
export const founderOffer = {
  code: 'FOUNDER',
  percentOff: 50,
  maxTeachers: 20,
  endsAt: new Date('2026-12-13T23:59:59Z'),
  endsText: '13 December',
} as const;

export function founderOfferActive(now: Date = new Date()): boolean {
  return now.getTime() <= founderOffer.endsAt.getTime();
}
