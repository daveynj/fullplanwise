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
import { siteFacts, trialText, priceText } from './site-facts';

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
  title: `${brand} – AI Lesson Planner for ESL Teachers & Tutors`,
  description:
    `Complete, CEFR-levelled ESL lessons on any topic in ${generationTime}, built around each student's level and vocabulary. ${trialText}, no card needed.`,
  keywords: [
    'AI ESL lesson planner',
    'ESL lesson plan generator',
    'AI lesson planner for ESL teachers',
    'CEFR lesson plans',
    'lesson plans for online English tutors',
    'Preply italki Cambly lesson planning',
    'ESL vocabulary tracking',
    'AI for English teachers',
  ],
  canonicalUrl: 'https://planwiseesl.com',
  imagePath: '/images/homepage-share-2026-10.png',
  imageAlt: `${brand} — CEFR-aligned, ready-to-teach ESL lessons in minutes.`,
};

export const hero = {
  badge: 'For Cambly, Preply, italki, freelance teachers & language schools',
  heading: 'The AI ESL lesson planner that remembers every student',
  subheading:
    `Complete, CEFR-levelled conversation lessons on any topic in ${generationTime}, built on a scientific pedagogical sequence around each student's level, interests and vocabulary.`,
  benefits: [
    'A complete pedagogical lesson every time: warm-up recall, pre-taught vocabulary (with pronunciation, word families & usage notes), levelled reading, recall flashcards, synonyms & antonyms, targeted practice, and deep discussion.',
    'Ready in 1–2 minutes on any topic—plus students can create custom lessons on any subject they want to discuss.',
    'Tracks each student’s vocabulary and recycles previous words into future readings and questions for long-term recall.',
    'Private learner dashboard with all past lessons and flashcards, plus a downloadable study PDF with vocabulary, examples, word families, synonyms/antonyms and usage notes.',
  ],
  audienceIntro: "Who it's for:",
  audience: [
    'Online ESL tutors on Cambly, Preply, italki and other platforms.',
    'Freelance and independent private English teachers.',
    'Small to medium language schools.',
  ],
  primaryCta: 'Try It Free for 5 Days',
  secondaryCta: "See What's in a Lesson",
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
};

/**
 * A plain answer to "what is it?", shown near the top of the page. AI
 * assistants and search snippets quote short definitions like this.
 */
export const definition = {
  heading: `What is ${brand}?`,
  text: `${brand} is an AI ESL lesson planner built for Cambly, Preply and italki tutors, freelance English teachers, and small to medium language schools. Unlike static pre-made lesson libraries or general chatbots, it writes a complete CEFR-levelled (A1–C2) conversation lesson on any topic in ${generationTime} following a structured pedagogical sequence: warm-up vocabulary recall, five pre-taught key words (with pronunciation guide, levelled definitions, example sentences, word families, usage notes and pictures), a levelled reading and comprehension check, in-lesson recall flashcards and semantic maps (synonyms and antonyms), tiered sentence frames (especially helpful for beginners), fill-in-the-blanks, sentence unscramble, a quiz, and deep discussion using the target vocabulary. It tracks each student’s vocabulary so earlier words are recycled in future readings and questions, gives every student a private learner dashboard with past lessons, flashcards and custom lesson creation on any subject, and exports a downloadable study PDF with all vocabulary, examples, synonyms/antonyms and usage notes. It was created by Dave Jackson, a working British ESL teacher since 2015 who still plans his own students’ lessons with it.`,
};

/** Real lesson titles from two of Dave's courses (one personalised, one general). */
export const personalisation = {
  heading: 'One Student, One Course',
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
  note: 'In both, each lesson avoids words the student already knows and recycles earlier vocabulary into new readings and questions, and students can suggest topics or create custom lessons on any subject from their learner dashboard.',
  cta: 'Browse free lessons at every level',
  href: '/esl-lessons',
};

export const showcase = {
  heading: 'See a Real Lesson, Exactly as PlanWise Made It',
  subheading:
    'Every lesson follows the same scientific pedagogical formula: warm-up recall, pre-taught vocabulary with word families and usage notes, levelled reading, recall flashcards, synonyms and antonyms, targeted practice, then deep discussion. Scroll through this B2 lesson to see each part.',
  sampleLabel: 'Sample Lesson',
  viewFullLabel: 'View Full Lesson',
  cta: 'Make Your First Lesson Free',
  lessonId: 1768,
};

export const problem = {
  heading: 'Why Not Just Ask ChatGPT?',
  intro:
    'A general chatbot can write a reading text. A lesson your student actually learns from requires a structured pedagogical sequence—and a chatbot forgets your student the moment you close the chat.',
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
      'A complete pedagogical lesson: vocab cards, reading, recall flashcards, semantic maps, exercises, deep discussion and a downloadable study PDF',
      'Written for the CEFR level you choose and checked section by section before you see it',
      "Each student's vocabulary tracked and recycled into future lessons, with a private learner dashboard and flashcards",
    ],
  },
  conclusion:
    `${brand} does the preparation a great teacher would do, for every student, every week.`,
};

export type FeatureIcon = 'clock' | 'target' | 'monitor' | 'users' | 'layers' | 'shield';

export const features = {
  heading: 'Built for How Tutors and Schools Really Teach',
  items: [
    {
      icon: 'clock' as FeatureIcon,
      title: 'A Complete Pedagogical Lesson in 1–2 Minutes',
      text: 'Choose A1 to C2 and any topic. PlanWise builds the full teaching sequence: warm-up recall, five pre-taught words (pronunciation, levelled definition, examples, word families, usage notes and pictures), levelled reading, recall flashcards, synonyms and antonyms, exercises and deep discussion.',
    },
    {
      icon: 'users' as FeatureIcon,
      title: 'Vocabulary Memory & Spaced Recycling',
      text: 'Choose the student and PlanWise avoids words they have already learned or planned, and weaves previous vocabulary back into future readings and questions to aid long-term recall. Press "We did this" and the lesson’s words join their list.',
    },
    {
      icon: 'layers' as FeatureIcon,
      title: 'Scaffolded Practice for Every Level',
      text: 'Tiered sentence frames (emerging, developing and expanding) give extra speaking support—especially helpful for beginners—alongside interactive fill-in-the-blanks, sentence unscramble, quizzes and optional idioms and phrasal verbs from A2 up.',
    },
    {
      icon: 'target' as FeatureIcon,
      title: 'Learner Dashboard & Student-Created Custom Lessons',
      text: 'Every student gets a private dashboard (no login needed) with all past lessons, a next-lesson preview, word lists and flashcards. Students suggest topics—and on Unlimited they can create custom lessons on any subject at their level, saved straight to your library.',
    },
    {
      icon: 'shield' as FeatureIcon,
      title: 'Checked Section by Section Before You Teach',
      text: 'Every new lesson is verified automatically before it is saved. A broken exercise is fixed or regenerated on its own, so you never discover a bad question in the middle of a class.',
    },
    {
      icon: 'monitor' as FeatureIcon,
      title: 'Full-Screen Teaching + Complete Study PDF',
      text: 'Lessons open full screen for screen sharing on Cambly, Preply, italki or Zoom, and export as a downloadable study PDF containing all vocabulary, definitions, example sentences, word families, synonyms, antonyms, usage notes and lesson activities.',
    },
  ],
};

/** The research-based lesson sequence, summarised (full version: /how-it-works). */
export const science = {
  heading: 'Built on How People Actually Learn Languages',
  intro: 'Every lesson follows a scientific pedagogical formula—not a generic worksheet—and every stage prepares the student for the next.',
  points: [
    { title: '1. Warm-up recall', text: 'Opening discussion questions activate the vocabulary and ideas the student already knows about the subject.' },
    { title: '2. Pre-teach with depth', text: 'Five key words taught with pronunciation guides, levelled definitions, examples, word families, usage notes and pictures so ~96% of the reading is familiar.' },
    { title: '3. Read in context', text: 'A CEFR-levelled reading uses each target word two or three times in natural context, paired with comprehension questions.' },
    { title: '4. Recall flashcards', text: 'In-lesson flashcards prompt the student to recall each word’s meaning from memory and create their own original sentence.' },
    { title: '5. Synonyms & semantic maps', text: 'Exploring synonyms, antonyms, related concepts and contexts deepens lexical understanding beyond a single definition.' },
    { title: '6. Guided practice', text: 'A quiz, tiered sentence frames (especially supportive for beginners), fill-in-the-blanks and sentence unscramble lock in accuracy and word order.' },
    { title: '7. Deep discussion', text: 'Closing discussion questions challenge the student to talk deeply about the topic while actively using the target vocabulary.' },
    { title: '8. Recycle, dashboard & PDF', text: 'Future lessons recycle earlier words into readings and questions; students review on their learner dashboard with flashcards and a full vocabulary study PDF.' },
  ],
  cta: 'See the research behind each step',
  href: '/how-it-works',
  image: '/images/lesson-sentence-frames-2026-11.webp',
  imageAlt: 'Sentence frames from a PlanWise ESL B2 lesson at three levels of support: emerging, developing and expanding',
  imageCaption: 'Sentence frames at three levels of support, from a real B2 lesson.',
};

/** Founder story, in Dave's words (full version: /about). */
export const founder = {
  heading: 'Built by a Teacher Who Hated Making Materials',
  quote:
    "I love teaching. I never loved the hours before it: finding a text at the right level, writing the questions, making vocabulary cards, then doing it all again for the next student, because every student is different. So I built PlanWise to do the preparation the way I'd do it myself.",
  name: 'Dave Jackson',
  role: 'English teacher since 2015, 2,000+ students taught · founder of PlanWise ESL',
  initials: 'DJ',
  linkLabel: 'Read why I built it',
  href: '/about',
};

export const steps = {
  heading: 'Your Next Lesson in 3 Steps',
  items: [
    {
      number: 1,
      title: 'Choose Student and Level',
      text: 'Pick one of your students (or none) and a CEFR level from A1 to C2.',
    },
    {
      number: 2,
      title: 'Give It a Topic',
      text: 'Anything your student cares about: job interviews, football, their favourite series. Add target words if you like, or let them create a custom lesson from their dashboard.',
    },
    {
      number: 3,
      title: 'Teach & Share',
      text: `In ${generationTime} you have a complete lesson to screen-share, export as a full study PDF, or send straight to your student's learner dashboard.`,
    },
  ],
};

export const pricing = {
  heading: 'Simple, Transparent Pricing',
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
      cta: 'Start Free',
      ctaHref: '/auth?register=true',
      highlighted: false,
    },
    {
      name: 'Unlimited',
      description: 'For Cambly, Preply, italki & freelance teachers, and language schools.',
      price: siteFacts.price,
      priceSuffix: `/${siteFacts.pricePeriod}`,
      features: [
        'Unlimited AI lesson generations on any topic',
        'Per-student vocabulary tracking & spaced recycling',
        'Students can create custom lessons on any subject',
        'Complete study PDFs with vocab, synonyms/antonyms & usage notes',
        'Cancel anytime',
      ],
      cta: 'Go Unlimited',
      ctaHref: '/buy-credits',
      highlighted: true,
    },
  ],
};

export const testimonials = {
  heading: 'Loved by Online ESL Teachers',
  items: [
    {
      quote:
        'As an online ESL teacher, time is my most valuable asset. This software has been a game-changer! I can now create engaging, ready-to-teach lessons in minutes, freeing up hours that I can spend focusing on my students.',
      author: 'Sarah K., Online ESL Tutor',
      initials: 'SK',
    },
    {
      quote:
        "Finally, a lesson planning tool that truly understands the needs of online ESL teachers! The CEFR level alignment is fantastic, ensuring my students are always learning at the right level. It's incredibly easy to use for my one-on-one classes.",
      author: 'David L., Independent ESL Teacher',
      initials: 'DL',
    },
  ],
};

export const finalCta = {
  heading: 'Plan Less. Teach Better Lessons.',
  stats: [
    { value: '1–2 min', label: 'To a complete lesson' },
    { value: 'A1–C2', label: 'Every CEFR level' },
    { value: '1 page', label: 'For each of your students' },
    { value: '5', label: 'New words per lesson, each met 5–6 times' },
  ],
  lead: `Try ${brand} free for ${siteFacts.trialDays} days and make as many lessons as you like.`,
  leadEmphasis: `free for ${siteFacts.trialDays} days`,
  cta: 'Start My Free Trial',
  freeLessonsNote: `${trialText} included`,
};

export const faq = {
  heading: 'Frequently Asked Questions',
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
          text: 'Online ESL tutors on Cambly, Preply, italki and other platforms, freelance and independent English teachers, and small to medium language schools. It is built for one-to-one and small-group classes with teenagers and adults.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: `How is ${brand} different from pre-made ESL lesson libraries?`,
      answer: [
        {
          type: 'text',
          text: `Pre-made ESL libraries give every student the same fixed catalogue of generic lessons and do not track what an individual learner has already studied. ${brand} generates a fresh, CEFR-levelled lesson on any subject in ${generationTime} following a complete pedagogical sequence (warm-up recall, vocabulary with word families and usage notes, levelled reading, recall flashcards, synonyms and antonyms, targeted exercises, and deep discussion), recycles each student’s previous vocabulary into future readings and questions, lets students create custom lessons on any subject, and includes a learner dashboard and downloadable study PDF. `,
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
          text: `A general chatbot starts from nothing every time and returns an unformatted block of text. ${brand} follows a full scientific pedagogical sequence, keeps CEFR levelling strict, tracks and recycles each student’s vocabulary across lessons, verifies every section before saving, exports a complete study PDF, and gives every student a private learner dashboard with flashcards. `,
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
          text: 'Yes. When you make a lesson for a student, PlanWise avoids words they already know and words planned in their upcoming lessons, and recycles earlier vocabulary naturally in future readings and questions to aid long-term recall. When you press "We did this" after class, that lesson’s words join the student’s list.',
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
    `${brand} is an AI lesson planner for ESL teachers, created by ESL teacher Dave Jackson. Complete CEFR-levelled lessons that build on what each student already knows.`,
  quickLinks: [
    { label: 'Start Free Trial', href: '/auth?register=true' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Free ESL Lessons', href: '/esl-lessons' },
    { label: 'Guides for ESL Teachers', href: '/guides' },
    { label: 'For Online Tutors', href: '/for/online-tutors' },
    { label: 'For Freelance Teachers', href: '/for/freelance-esl-teachers' },
    { label: 'For Language Schools', href: '/for/language-schools' },
    { label: 'Pricing', href: '/pricing' },
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
