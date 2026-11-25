/**
 * The facts about PlanWise ESL that appear on public pages, in structured
 * data and in /llms.txt. Search engines and AI assistants compare these
 * across pages, so they must say the same thing everywhere: change them here,
 * and a test checks that public/llms.txt agrees.
 */
export const siteFacts = {
  brand: 'PlanWise ESL',
  /** Older or informal spellings, listed in structured data so they are recognised as the same product. */
  alternateNames: ['PlanwiseESL', 'Plan Wise ESL', 'Planwise ESL'],
  url: 'https://planwiseesl.com',
  founder: 'Dave Jackson',
  founderRole: 'ESL teacher and founder of PlanWise ESL',
  /** Price of the Unlimited plan. */
  price: '$19.99',
  priceValue: '19.99',
  currency: 'USD',
  pricePeriod: 'month',
  /** Length of the free trial new accounts get (server/storage.ts createUser). */
  trialDays: 5,
  /** How long a lesson usually takes to generate. Pictures follow about a minute later, while the lesson is already open. */
  generationTime: '1–2 minutes',
  levels: 'A1–C2',
} as const;

export const trialText = `${siteFacts.trialDays}-day free trial`;
export const priceText = `${siteFacts.price}/${siteFacts.pricePeriod}`;
