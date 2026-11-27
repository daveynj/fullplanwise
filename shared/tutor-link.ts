// Where a public lesson's "take this lesson 1-on-1 with Dave" link goes on speakwithdave.com.
// Each lesson links to the page that matches it (not always the home page), so learners land on the
// right offer and search engines see links to the inner pages. Used by the React lesson page and the
// server prerender, so the two always agree. Site-wide and founder links stay on the home page.
//
// Dave teaches intermediate (B1) learners and above, so A1–A2 lessons do not invite a booking for
// "this lesson": they link to the home page and say which levels he teaches.

export const TUTOR_SITE = 'https://speakwithdave.com';

export interface TutorLinkInput {
  cefrLevel?: string | null;
  /** The lesson's subject area (LessonCategory: general, business, medical, …). */
  category?: string | null;
  /** The public library category (business-english, workplace-communication, …). */
  publicCategory?: string | null;
  /** Curated public tags (work, technology, artificial-intelligence, …). */
  tags?: readonly string[] | null;
}

export interface TutorLink {
  href: string;
  /** What the learner gets on that page, e.g. "Business English lessons". Empty for the home page. */
  label: string;
  /** True for A1–A2 lessons: Dave doesn't teach beginners, so the copy must not invite them. */
  belowTaughtLevels: boolean;
  /** A full sentence-style link text for buttons and inline links. */
  linkText: string;
}

const page = (path: string, label: string): TutorLink => ({
  href: `${TUTOR_SITE}${path}`,
  label,
  belowTaughtLevels: false,
  linkText: `Take this lesson 1-on-1 with Dave: ${label}`,
});

const HOME: TutorLink = {
  href: `${TUTOR_SITE}/`,
  label: '',
  belowTaughtLevels: false,
  linkText: 'Take this lesson 1-on-1 at SpeakWithDave.com',
};

const BEGINNER: TutorLink = {
  href: `${TUTOR_SITE}/`,
  label: '',
  belowTaughtLevels: true,
  linkText: 'Dave teaches intermediate (B1) learners and above 1-on-1 at SpeakWithDave.com',
};

const WORK_PUBLIC_CATEGORIES = new Set(['business-english', 'workplace-communication']);

/** First matching rule wins. */
export function tutorLinkFor(lesson: TutorLinkInput): TutorLink {
  const level = (lesson.cefrLevel || '').trim().toUpperCase();
  const category = (lesson.category || '').trim().toLowerCase();
  const publicCategory = (lesson.publicCategory || '').trim().toLowerCase();
  const tags = new Set((lesson.tags || []).map((t) => t.trim().toLowerCase()));
  const workRelated = category === 'business' || WORK_PUBLIC_CATEGORIES.has(publicCategory) || tags.has('work');

  if (level === 'A1' || level === 'A2') return BEGINNER;
  if (category === 'medical' || category === 'healthcare') return page('/medical-professionals', 'English for medical professionals');
  if (category === 'legal') return page('/legal-professionals', 'English for legal professionals');
  if (category === 'finance') return page('/finance-professionals', 'English for finance professionals');
  // Everyday lessons about AI or technology are discussion topics; only work-related ones are job English.
  if (category === 'technology' || (workRelated && (tags.has('technology') || tags.has('artificial-intelligence')))) {
    return page('/tech-professionals', 'English for IT and tech professionals');
  }
  if (category === 'academic') {
    return page('/english-speaking-confidence-for-international-students', 'speaking confidence for international students');
  }
  if (category === 'business' || WORK_PUBLIC_CATEGORIES.has(publicCategory)) {
    return page('/business-english-lessons-online', 'Business English lessons');
  }
  if (level === 'B2' || level === 'C1' || level === 'C2') {
    return page('/advanced-english-discussion-lessons', 'advanced discussion lessons');
  }
  if (level === 'B1') return page('/english-conversation-practice', 'English conversation practice');
  return HOME;
}
