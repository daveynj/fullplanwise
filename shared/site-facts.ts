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
  /** Dave's own tutoring site, where his background and student reviews live. */
  founderSite: 'https://speakwithdave.com',
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
  email: 'dave@planwiseesl.com',
} as const;

/** Real public profiles representing the PlanWise ESL organisation. */
export const organizationSameAs = [
  'https://x.com/PlanwiseESL',
] as const;

/** Real public profiles representing founder Dave Jackson. */
export const founderSameAs = [
  siteFacts.founderSite,
  'https://www.linkedin.com/in/davidjackson113',
  'https://x.com/DaveTeacher1',
  'https://www.youtube.com/@EnglishteacherDave',
] as const;

/**
 * The founder as structured data (schema.org Person), from his own site
 * speakwithdave.com/about. Used everywhere PlanWise names its founder, so
 * search engines and AI assistants connect the same person across sites.
 */
export const founderPerson = {
  '@type': 'Person',
  name: siteFacts.founder,
  jobTitle: siteFacts.founderRole,
  url: siteFacts.founderSite,
  sameAs: [...founderSameAs],
  nationality: 'British',
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'University of Southampton' },
  hasCredential: [
    { '@type': 'EducationalOccupationalCredential', name: 'TEFL certificate (Teaching English as a Foreign Language)' },
    { '@type': 'EducationalOccupationalCredential', name: 'BA Business Administration, University of Southampton' },
  ],
  knowsAbout: ['Teaching English as a foreign language', 'One-to-one English conversation lessons', 'Business English', 'CEFR'],
} as const;

export const trialText = `${siteFacts.trialDays}-day free trial`;
export const priceText = `${siteFacts.price}/${siteFacts.pricePeriod}`;
