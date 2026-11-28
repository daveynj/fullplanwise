/**
 * Single source of truth for homepage (landing page) copy.
 * Imported by BOTH the React landing page (client/src/pages/landing-page.tsx)
 * and the server prerender (server/landing-prerender.ts) so crawler-visible
 * HTML always matches the hydrated page.
 *
 * Every claim here must be true of the product today. Search engines and AI
 * assistants quote this page, and contradictory numbers make them hedge or
 * leave PlanWise out. Shared facts (price, trial, generation time) come from
 * shared/site-facts.ts.
 */
import { siteFacts, trialText, priceText, freeLessonsText } from './site-facts';

export interface FaqLinkPart {
  type: 'link';
  href: string;
  text: string;
}
export interface FaqTextPart {
  type: 'text';
  text: string;
}
export type FaqAnswerPart = FaqTextPart | FaqLinkPart;

const { brand, generationTime } = siteFacts;

export const homepageMeta = {
  title: `${brand} – Ready-to-teach ESL lessons in ${generationTime}`,
  description:
    `Complete, CEFR-levelled ESL lessons on any topic in ${generationTime}, built around each student's level and vocabulary. ${trialText}, no card needed.`,
  keywords: [
    'ready-to-teach ESL lessons',
    'AI ESL lesson generator',
    'ESL lessons made for each student',
    'CEFR lesson plans',
    'lesson plans for online English tutors',
    'Preply italki lessons',
    'ESL vocabulary tracking',
    'AI for English teachers',
  ],
  canonicalUrl: 'https://planwiseesl.com',
  imagePath: '/images/homepage-share-2026-10.png',
  imageAlt: `${brand} — CEFR-aligned, ready-to-teach ESL lessons in minutes.`,
};

export const hero = {
  badge: 'For online tutors, freelance teachers and small language schools',
  heading: `Finished ESL lessons in ${generationTime}, made for each student`,
  subheading:
    `Type your student's topic and level. In ${generationTime} you have a complete lesson to screen-share or print: key words with pictures, a reading at their level, practice and discussion. ${brand} remembers each student's words, so the next lesson builds on this one.`,
  benefits: [
    'Get your evenings back: no more unpaid prep, even when a student arrives with a new topic.',
    "Lessons your student cares about: their job, their hobby, this morning's news, at their CEFR level (A1–C2).",
    'Students who keep booking: each lesson builds on the words they already know, and they get a private page with their lessons and flashcards.',
  ],
  audienceIntro: "Who it's for:",
  audience: [
    'Online English tutors on Preply, italki and other platforms.',
    'Freelance teachers with their own private students.',
    'Small language schools that want the same quality from every teacher.',
  ],
  primaryCta: 'Make your first lesson free',
  secondaryCta: 'See a real lesson',
  noCardNote: 'No credit card required',
  freeLessonsNote: trialText,
  previewTitle: 'A real PlanWise ESL lesson',
  previewText: 'Every new word comes with a picture, pronunciation guide, a definition at the student\u2019s level, example sentences, word families and usage notes.',
  image: '/images/lesson-vocabulary-2026-11.webp',
  imageAlt: 'Vocabulary card from a PlanWise ESL B2 lesson: the word "affluence" with a picture, syllable-by-syllable pronunciation, a definition and example sentences',
  imageWidth: 1650,
  imageHeight: 1040,
  videoUrl: 'https://www.youtube.com/embed/pcLlwL5sNK0',
  videoTitle: 'How PlanWise ESL works',
  videoUploadDate: '2025-04-06T23:21:45-07:00',
  videoDuration: 'PT14M27S',
};

/**
 * A plain answer to "what is it?", shown near the top of the page. AI
 * assistants and search snippets quote short definitions like this.
 */
export const definition = {
  heading: `What is ${brand}?`,
  text: `${brand} makes finished, ready-to-teach English lessons in ${generationTime}, made for each of your students. Choose a student, a CEFR level (A1–C2) and any topic, and it writes a complete conversation lesson: five key words with pictures and pronunciation, a reading at the student's level, practice exercises, discussion questions and a study PDF. It remembers the words each student has learned, so their next lesson teaches new words and reuses familiar ones where they fit, and each student gets a private page with their lessons and flashcards. It was built by Dave Jackson, a British ESL teacher since 2015, who uses it with his own students.`,
};

/** Real lesson titles from two of Dave's courses (one personalised, one general). */
export const personalisation = {
  heading: 'One student, one course',
  intro:
    'Generic lesson libraries give every student the same fixed catalogue. PlanWise builds every lesson around the student in front of you. These are real lesson titles from two courses made with it:',
  personal: {
    label: 'For a B2\u2013C1 student who works in China\u2019s fashion industry',
    titles: [
      'The Rise of Luxury Chinese Fashion Brands',
      'Swipe, Stream, Sell: Live Commerce vs Traditional Retail in the Fashion World',
      'The "Guochao" (National Trend) Phenomenon Beyond Fashion',
      'The Evolution of Chinese Workplace Culture: "Quiet Quitting" vs. Extreme Ambition',
      'The Silver Economy: The Changing Face of Aging and Retirement',
    ],
  },
  general: {
    label: 'A general B2 conversation course for adults',
    titles: [
      'Bucket Lists: Dreams Worth Chasing',
      'Money for Everyone? Exploring Universal Basic Income',
      'The Attention Economy: Who Profits From Your Focus?',
      'The Longevity Race: Can Science Help Us Live Forever?',
      'Financial Independence, Retire Early: The F.I.R.E. Movement Explained',
    ],
  },
  note: 'In both, each new lesson teaches words the student doesn’t know yet and reuses familiar ones where they fit. Students can also suggest topics, or make their own lessons, from their private page.',
  cta: 'Browse free lessons at every level',
  href: '/esl-lessons',
};

export const showcase = {
  heading: 'See a real lesson, exactly as PlanWise made it',
  subheading:
    'This is a B2 lesson exactly as PlanWise made it: warm-up questions, five key words, a reading, practice and discussion. Scroll through it, or open it full screen as your student would see it.',
  sampleLabel: 'Sample Lesson',
  viewFullLabel: 'View Full Lesson',
  cta: 'Make your first lesson free',
  lessonId: 1768,
};

export const problem = {
  heading: 'Why not just ask ChatGPT?',
  intro:
    'A chatbot can write a reading text. A lesson your student learns from needs the right level, the right words and a clear structure, and a chatbot forgets your student when the chat ends.',
  traditional: {
    title: 'Prompting a general chatbot',
    items: [
      'Re-explain your student, their level and their goals every time',
      'One long block of text to copy, check and format',
      'The level drifts: a B1 reading comes back full of C1 words',
      'No record of the words you have already taught, and no student practice tools',
    ],
  },
  withPlanwise: {
    title: `With ${brand}`,
    items: [
      'Pick the student, the level and any topic—or let the student create a custom lesson on their own subject',
      'A complete lesson, ready to screen-share: key words with pictures, a reading, practice, discussion and a study PDF',
      'Written for the CEFR level you choose and checked section by section before you see it',
      "Each student's words remembered, so the next lesson builds on them, plus a private page with flashcards",
    ],
  },
  conclusion:
    `${brand} does the preparation a great teacher would do, for every student, every week.`,
};

export type FeatureIcon = 'clock' | 'target' | 'monitor' | 'users' | 'layers' | 'shield';

export const features = {
  heading: 'What you get with every lesson',
  items: [
    {
      icon: 'clock' as FeatureIcon,
      title: `A complete lesson in ${generationTime}`,
      text: 'Any topic, A1 to C2: warm-up questions, five key words with pictures and pronunciation, a reading at the right level, practice exercises and discussion questions.',
    },
    {
      icon: 'users' as FeatureIcon,
      title: 'It remembers each student',
      text: 'Press "We did this" after class and the lesson’s words join the student’s list. Their next lesson teaches new words and reuses familiar ones where they fit.',
    },
    {
      icon: 'target' as FeatureIcon,
      title: 'A private page for every student',
      text: 'No login needed: past lessons, word lists and flashcards between classes. Students can suggest topics, and on Unlimited they can make their own lessons.',
    },
    {
      icon: 'layers' as FeatureIcon,
      title: 'Support for nervous speakers',
      text: 'Sentence starters at three levels of support help quieter students speak, alongside fill-in-the-blanks, word-order practice and a quiz.',
    },
    {
      icon: 'shield' as FeatureIcon,
      title: 'Checked before you teach',
      text: 'Every new lesson is checked automatically before it is saved, and a broken exercise is fixed or remade, so you don’t find a bad question mid-class.',
    },
    {
      icon: 'monitor' as FeatureIcon,
      title: 'Screen-share or print',
      text: 'Lessons open full screen for Zoom, Preply or italki, and download as a study PDF with every word, example and activity.',
    },
  ],
};

/** The research-based lesson sequence, summarised (full version: /how-it-works). */
export const science = {
  heading: 'Built on How People Actually Learn Languages',
  intro: 'Every lesson follows a scientific pedagogical formula—not a generic worksheet—and every stage prepares the student for the next.',
  points: [
    { title: 'Warm-up recall', text: 'Opening discussion questions activate the vocabulary and ideas the student already knows about the subject.' },
    { title: 'Pre-teach with depth', text: 'Five key words taught with pronunciation guides, levelled definitions, examples, word families, usage notes and pictures so ~96% of the reading is familiar.' },
    { title: 'Read in context', text: 'A CEFR-levelled reading uses each target word two or three times in natural context, paired with comprehension questions.' },
    { title: 'Recall flashcards', text: 'In-lesson flashcards prompt the student to recall each word’s meaning from memory and create their own original sentence.' },
    { title: 'Synonyms & semantic maps', text: 'Exploring synonyms, antonyms, related concepts and contexts deepens lexical understanding beyond a single definition.' },
    { title: 'Guided practice', text: 'A quiz, tiered sentence frames (especially supportive for beginners), fill-in-the-blanks and sentence unscramble lock in accuracy and word order.' },
    { title: 'Deep discussion', text: 'Closing discussion questions challenge the student to talk deeply about the topic while actively using the target vocabulary.' },
    { title: 'Remember, review & PDF', text: 'Future lessons teach new words and reuse familiar ones where they fit; students review on their private page with flashcards and a printable Vocabulary Review PDF.' },
  ],
  cta: 'See the research behind each step',
  href: '/how-it-works',
  image: '/images/lesson-sentence-frames-2026-11.webp',
  imageAlt: 'Sentence frames from a PlanWise ESL B2 lesson at three levels of support: emerging, developing and expanding',
  imageCaption: 'Sentence frames at three levels of support, from a real B2 lesson.',
};

/** Founder story, in Dave's words (full version: /about). */
export const founder = {
  heading: 'Built by a teacher who hated making materials',
  quote:
    "I love teaching. I never loved the hours before it: finding a text at the right level, writing the questions, making vocabulary cards, then doing it all again for the next student, because every student is different. So I built PlanWise to do the preparation the way I'd do it myself.",
  name: 'Dave Jackson',
  role: 'English teacher since 2015, 2,000+ students taught · founder of PlanWise ESL',
  initials: 'DJ',
  linkLabel: 'Read why I built it',
  href: '/about',
  /** For English learners who land here: Dave's own 1-on-1 lessons (separate site). */
  learnerText: 'Learning English yourself? Take 1-on-1 lessons with Dave at',
  learnerLinkLabel: 'SpeakWithDave.com',
  learnerHref: siteFacts.founderSite,
};

export const steps = {
  heading: 'Your next lesson in 3 steps',
  items: [
    {
      number: 1,
      title: 'Choose the student and level',
      text: 'Pick one of your students and their CEFR level, from A1 to C2.',
    },
    {
      number: 2,
      title: 'Give it a topic',
      text: 'Anything your student cares about: job interviews, football, their favourite series. Add target words if you like, or let them create a custom lesson from their dashboard.',
    },
    {
      number: 3,
      title: 'Teach and share',
      text: `In ${generationTime} you have a complete lesson to screen-share, export as a full study PDF, or send straight to your student's learner dashboard.`,
    },
  ],
};

export const pricing = {
  heading: 'Simple pricing',
  plans: [
    {
      name: 'Free',
      description: 'Try everything, then keep what you made.',
      price: '$0',
      priceSuffix: '',
      features: [
        `Unlimited lessons during your ${trialText}`,
        'Keep and reuse every lesson you have made',
        'Private learner dashboards with flashcards',
        'Downloadable lesson & vocabulary study PDFs',
        'Browse the free ESL lesson library',
      ],
      cta: 'Make your first lesson free',
      ctaHref: '/auth?register=true',
      highlighted: false,
    },
    {
      name: 'Unlimited',
      description: 'For Preply & italki tutors, freelance teachers, and language schools.',
      price: siteFacts.price,
      priceSuffix: `/${siteFacts.pricePeriod}`,
      features: [
        'Unlimited AI lesson generations on any topic',
        'Remembers each student’s words, so lessons build on each other',
        'Students can create custom lessons on any subject',
        'Complete study PDFs with vocab, collocations, synonyms/antonyms & usage notes',
        'Cancel anytime',
      ],
      cta: 'Make your first lesson free',
      ctaHref: '/auth?register=true',
      highlighted: true,
    },
  ],
};

export const verifiableProof = {
  heading: 'See it working before you sign up',
  subheading:
    'No sign-up needed: open real lessons, follow one student through four lessons, or compare PlanWise with other ESL tools.',
  items: [
    {
      badge: '36 items · 0 duplicates',
      title: 'One student, four lessons',
      text: 'Four B2 lessons in a row for one sample student: 36 key words with none repeated, and familiar words coming back in later readings and questions.',
      linkLabel: 'Inspect all 4 live lessons',
      href: '/compare/student-memory-proof',
    },
    {
      badge: `${freeLessonsText} free lessons`,
      title: 'Free lessons at every level',
      text: 'Compare a simple A1 lesson with a demanding C1 one. Every lesson is complete, free to teach and comes with a PDF.',
      linkLabel: 'Browse the public library',
      href: '/esl-lessons',
    },
    {
      badge: 'Side by side',
      title: 'Fair tool comparisons',
      text: 'What PlanWise does differently from ESL Brains, Twee, ESL Joy, Linguahouse, Off2Class, MagicSchool and ChatGPT, and what each of them does well.',
      linkLabel: 'Compare ESL tools',
      href: '/compare',
    },
  ],
};

export const finalCta = {
  heading: 'Your next lesson, ready in 2 minutes',
  stats: [
    { value: '1–2 min', label: 'To a complete lesson' },
    { value: 'A1–C2', label: 'Every CEFR level' },
    { value: '1 page', label: 'For each of your students' },
    { value: '5', label: 'New words per lesson, each met 5–6 times' },
  ],
  lead: `Try ${brand} free for ${siteFacts.trialDays} days and make as many lessons as you like.`,
  leadEmphasis: `free for ${siteFacts.trialDays} days`,
  cta: 'Make your first lesson free',
  freeLessonsNote: `${trialText} included`,
};

export const faq = {
  heading: 'Questions teachers ask',
  subheading: `Everything you need to know about ${brand}`,
  items: [
    {
      question: definition.heading,
      answer: [{ type: 'text', text: definition.text }] as FaqAnswerPart[],
    },
    {
      question: `Who is ${brand} for?`,
      answer: [
        {
          type: 'text',
          text: 'Online ESL tutors on Preply, italki and other platforms, freelance and independent English teachers, and small to medium language schools. It is built for one-to-one and small-group classes with teenagers and adults.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: `How is ${brand} different from pre-made ESL lesson libraries?`,
      answer: [
        {
          type: 'text',
          text: `Pre-made ESL libraries give every student the same fixed catalogue of generic lessons and do not track what an individual learner has already studied. ${brand} generates a fresh, CEFR-levelled lesson on any subject in ${generationTime} following a complete pedagogical sequence (warm-up recall, vocabulary with word families and usage notes, levelled reading, recall flashcards, synonyms and antonyms, targeted exercises, and deep discussion), remembers each student’s words so the next lesson builds on them, lets students create custom lessons on any subject, and includes a learner dashboard and downloadable study PDF. `,
        },
        { type: 'link', href: '/how-it-works', text: 'See the pedagogy behind every lesson' },
        { type: 'text', text: '.' },
      ] as FaqAnswerPart[],
    },
    {
      question: `How is ${brand} different from ChatGPT?`,
      answer: [
        {
          type: 'text',
          text: `A general chatbot starts from nothing every time and returns an unformatted block of text. ${brand} follows the same tested lesson structure every time, keeps to the CEFR level you chose, remembers each student’s words across lessons, verifies every section before saving, exports a complete study PDF, and gives every student a private learner dashboard with flashcards. `,
        },
        { type: 'link', href: '/compare/chatgpt', text: 'Compare PlanWise ESL vs ChatGPT' },
        { type: 'text', text: '.' },
      ] as FaqAnswerPart[],
    },
    {
      question: `Can ${brand} make grammar lessons?`,
      answer: [
        {
          type: 'text',
          text: `${brand} makes topic-based conversation lessons, not grammar-rule lessons. Grammar is practised through sentence frames (tiered at emerging, developing and expanding—especially helpful for beginners) and sentence unscramble exercises. To practise a particular structure, choose a topic that naturally uses it: "Life experiences" for the present perfect, or "What would you do if you won the lottery?" for the second conditional. `,
        },
        { type: 'link', href: '/how-it-works', text: 'See how a lesson is built' },
        { type: 'text', text: '.' },
      ] as FaqAnswerPart[],
    },
    {
      question: 'Are the lessons really at the right CEFR level?',
      answer: [
        {
          type: 'text',
          text: 'You choose the level, and the reading length, sentence style and the words used in definitions follow fixed rules for that level: at A1, for example, definitions use only the 500 most common English words. Every new lesson is checked section by section before it is saved. You can judge for yourself: ',
        },
        {
          type: 'link',
          href: '/esl-lessons',
          text: 'browse free sample lessons at every level',
        },
        { type: 'text', text: '.' },
      ] as FaqAnswerPart[],
    },
    {
      question: 'Does it remember what my students have already learned?',
      answer: [
        {
          type: 'text',
          text: 'Yes. When you make a lesson for a student, PlanWise avoids words they already know and words planned in their upcoming lessons, and reuses familiar words in new readings and questions where they fit. When you press "We did this" after class, that lesson’s words join the student’s list.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: 'Can my students choose what we talk about or create their own lessons?',
      answer: [
        {
          type: 'text',
          text: 'Yes. On their private learner dashboard, students can suggest topics for the next class—and you can turn an idea into a lesson in one click. On Unlimited, students can also create custom lessons themselves on any subject at their CEFR level; each lesson is saved in your library and planned for that student, and they can star the one they want to do next. You can switch this off for any student.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: 'Can my students practise between lessons?',
      answer: [
        {
          type: 'text',
          text: 'Yes. Every student gets a private learner dashboard (no login needed) with all their finished lessons, a preview of the next lesson’s reading and new words, their vocabulary list, and flashcards. Teachers can also download and send a complete study PDF containing all the vocabulary, definitions, example sentences, word families, synonyms, antonyms, usage notes, and lesson activities.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: 'Can I make a lesson during a class?',
      answer: [
        {
          type: 'text',
          text: 'Yes. A lesson is ready in 1–2 minutes and opens straight away; the pictures for the vocabulary and discussion appear about a minute later, while you are doing the warm-up. So when a student arrives wanting to talk about something new, you can make a lesson on that topic there and then.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: 'Can I choose the vocabulary?',
      answer: [
        {
          type: 'text',
          text: 'Yes. Before generating a lesson you can list the words you want it to teach, and the lesson is built around them.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: 'What topics can I create lessons about?',
      answer: [
        {
          type: 'text',
          text: 'Any topic, in 12 subject areas including general, business, academic, medical, legal, technology, tourism and finance English. ',
        },
        {
          type: 'link',
          href: '/esl-lessons',
          text: 'See free example lessons',
        },
        { type: 'text', text: '.' },
      ] as FaqAnswerPart[],
    },
    {
      question: 'Is there a free trial?',
      answer: [
        {
          type: 'text',
          text: `Yes. Every new account gets a ${trialText} with unlimited lesson generation, and no credit card is needed. When the trial ends, every lesson you made stays in your account.`,
        },
      ] as FaqAnswerPart[],
    },
    {
      question: 'How much does it cost after the free trial?',
      answer: [
        {
          type: 'text',
          text: `The Unlimited plan is ${priceText} for unlimited lessons, and you can cancel anytime.`,
        },
      ] as FaqAnswerPart[],
    },
  ],
};

export const footer = {
  brandLine:
    `${brand}, created by ESL teacher Dave Jackson, makes ready-to-teach ESL lessons for teachers and tutors. Complete CEFR-levelled lessons that build on what each student already knows.`,
  quickLinks: [
    { label: 'Start Free Trial', href: '/auth?register=true' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Student Dashboard & Study PDF', href: '/student-experience' },
    { label: 'Free ESL Lessons', href: '/esl-lessons' },
    { label: 'Guides for ESL Teachers', href: '/guides' },
    { label: 'For Online Tutors', href: '/for/online-tutors' },
    { label: 'For Freelance Teachers', href: '/for/freelance-esl-teachers' },
    { label: 'For Language Schools', href: '/for/language-schools' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Compare ESL Tools', href: '/compare' },
    { label: 'PlanWise vs ChatGPT', href: '/compare/chatgpt' },
    { label: 'ESL Teaching Blog', href: '/blog' },
    { label: 'About', href: '/about' },
  ],
  aboutItems: ['Created by an ESL teacher', 'CEFR A1–C2', 'Built for one-to-one and online classes'],
  social: {
    linkedin: 'https://www.linkedin.com/in/davidjackson113',
    twitter: 'https://x.com/DaveTeacher1',
  },
  copyright: `© ${new Date().getFullYear()} ${brand}. Created by Dave Jackson, ESL Teacher.`,
  tagline: 'Built for ESL Teachers, by an ESL Teacher',
};
