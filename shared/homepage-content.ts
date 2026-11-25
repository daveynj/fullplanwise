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
  badge: 'Conversation lessons for Preply, italki, Cambly & independent tutors',
  heading: 'The AI ESL lesson planner that remembers every student',
  subheading:
    `Complete, CEFR-levelled conversation lessons on any topic in ${generationTime}, built around each student's level, interests and the words they already know.`,
  benefits: [
    'A full lesson every time: warm-up, key vocabulary, a levelled reading, comprehension, speaking practice and a quiz.',
    'Ready in 1–2 minutes, so you can make one on the spot when a student arrives with a new topic.',
    'Tracks the words each student has learned, so every lesson builds on the last instead of repeating it.',
    'Gives each student a private page with their lessons, words and flashcards, where they can suggest what to talk about next.',
  ],
  audienceIntro: "Who it's for:",
  audience: [
    'Online ESL tutors on Preply, italki, Cambly and other platforms.',
    'Independent and private English teachers.',
    'Language schools and small agencies.',
  ],
  primaryCta: 'Try It Free for 5 Days',
  secondaryCta: "See What's in a Lesson",
  noCardNote: 'No credit card required',
  freeLessonsNote: trialText,
  previewTitle: 'A real PlanWise ESL lesson',
  previewText: 'Every new word comes with a picture, pronunciation, a definition at the student\u2019s level and example sentences.',
  image: '/images/lesson-vocabulary-2026-11.webp',
  imageAlt: 'Vocabulary card from a PlanWise ESL B2 lesson: the word "affluence" with a picture, syllable-by-syllable pronunciation, a definition and example sentences',
  imageWidth: 1650,
  imageHeight: 1040,
  videoUrl: 'https://www.youtube.com/embed/pcLlwL5sNK0',
};

/**
 * A plain answer to "what is it?", shown near the top of the page. AI
 * assistants and search snippets quote short definitions like this.
 */
export const definition = {
  heading: `What is ${brand}?`,
  text: `${brand} is an AI lesson planner for ESL and EFL teachers that makes topic-based conversation lessons. You choose a CEFR level (A1 to C2) and any topic, and in ${generationTime} it writes a complete, ready-to-teach lesson: a warm-up, five key words with pictures, a levelled reading, comprehension questions, sentence frames at three levels of support, discussion questions, a gap-fill and a quiz. It keeps track of the words each of your students has learned, so lessons build on each other, and gives every student a private page for practice between classes. It was created by Dave Jackson, a British English teacher who has taught online since 2015 and still plans his own students’ lessons with it.`,
};

/** Real lesson titles from two of Dave's courses (one personalised, one general). */
export const personalisation = {
  heading: 'One Student, One Course',
  intro:
    'Generic materials are the same for everyone. PlanWise builds lessons around the student in front of you. These are real lesson titles from two courses made with it:',
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
  note: 'In both, each lesson avoids words the student already knows and recycles them in new readings, and students can suggest the next topic from their own page.',
  cta: 'Browse free lessons at every level',
  href: '/esl-lessons',
};

export const showcase = {
  heading: 'See a Real Lesson, Exactly as PlanWise Made It',
  subheading:
    'Every lesson follows the same proven shape: warm up, pre-teach the key words, read, check understanding, practise the language, then talk. Scroll through this B2 lesson to see each part.',
  sampleLabel: 'Sample Lesson',
  viewFullLabel: 'View Full Lesson',
  cta: 'Make Your First Lesson Free',
  lessonId: 1768,
};

export const problem = {
  heading: 'Why Not Just Ask ChatGPT?',
  intro:
    'A general chatbot can write a reading text. A lesson your student actually learns from takes more than that, and the chatbot forgets your student the moment you close the chat.',
  traditional: {
    title: 'Prompting a general chatbot',
    items: [
      'Re-explain your student, their level and their goals every time',
      'One long block of text to copy, check and format',
      'The level drifts: a B1 reading comes back full of C1 words',
      'No record of the words you have already taught',
    ],
  },
  withPlanwise: {
    title: `With ${brand}`,
    items: [
      'Pick the student, the level and a topic. That is all.',
      'A structured, ready-to-screen-share lesson with every activity in place',
      'Written for the CEFR level you choose and checked before you see it',
      "Each student's words tracked, so nothing is taught twice by accident",
    ],
  },
  conclusion:
    `${brand} does the planning a good teacher would do, for every student, every week.`,
};

export type FeatureIcon = 'clock' | 'target' | 'monitor' | 'users' | 'layers' | 'shield';

export const features = {
  heading: 'Built for How Tutors Really Teach',
  items: [
    {
      icon: 'clock' as FeatureIcon,
      title: 'A Complete Lesson in 1–2 Minutes',
      text: 'Choose a level from A1 to C2 and any topic. PlanWise writes the warm-up, pre-teaches the key vocabulary with examples and pictures, writes a reading at the right level, then checks understanding and gets your student talking. Pictures fill in while you do the warm-up, so you can even make a lesson at the start of class.',
    },
    {
      icon: 'users' as FeatureIcon,
      title: 'It Remembers Every Student',
      text: 'Choose the student and PlanWise avoids the words they have already learned and reuses them naturally in new readings. When you press "We did this", the lesson’s words join their list.',
    },
    {
      icon: 'layers' as FeatureIcon,
      title: 'Speaking Support at Three Levels',
      text: 'Sentence frames come at three levels of support (emerging, developing and expanding), each with model answers, so a nervous student and a confident one can both answer the same question.',
    },
    {
      icon: 'target' as FeatureIcon,
      title: 'Students Choose What to Talk About',
      text: 'Share a private link. Your student reviews finished lessons, reads ahead for the next one, practises with flashcards and suggests topics for your next class: make the lesson in one click. On Unlimited, students can even make their own lessons, which land in your library.',
    },
    {
      icon: 'shield' as FeatureIcon,
      title: 'Checked Before You See It',
      text: 'Every new lesson is checked section by section before it is saved. A broken exercise is fixed or written again, so you do not discover problems in the middle of a class.',
    },
    {
      icon: 'monitor' as FeatureIcon,
      title: 'Made for Online Classes',
      text: 'Lessons open full screen for screen sharing and download for printing or saving as a PDF. Add your own target words, and include idioms and phrasal verbs from A2 up.',
    },
  ],
};

/** The research-based lesson sequence, summarised (full version: /how-it-works). */
export const science = {
  heading: 'Built on How People Actually Learn Languages',
  intro: 'Every lesson follows the same research-based sequence, and each step is there for a reason.',
  points: [
    { title: 'Activate', text: 'Warm-up questions switch on what the student already knows about the topic.' },
    { title: 'Pre-teach', text: 'Five key words taught before the reading, so about 96% of the text is familiar.' },
    { title: 'Read', text: 'A reading written for the CEFR level that uses each new word two or three times.' },
    { title: 'Check', text: 'One comprehension question per new word: retrieval, not rereading.' },
    { title: 'Scaffold', text: 'Sentence frames at three levels of support, so every student can answer.' },
    { title: 'Speak', text: "Five discussion questions that take the topic into the student's own life." },
    { title: 'Retrieve', text: 'A shuffled gap-fill and a quiz bring every word back once more.' },
    { title: 'Recycle', text: 'Words are tracked and reused in later lessons, then reviewed with flashcards.' },
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
      text: 'Anything your student cares about: job interviews, football, their favourite series. Add target words if you like.',
    },
    {
      number: 3,
      title: 'Teach',
      text: `In ${generationTime} you have a complete lesson to screen-share, print or send to your student's page.`,
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
        'Private pages for your students',
        'Browse the free ESL lesson library',
      ],
      cta: 'Start Free',
      ctaHref: '/auth?register=true',
      highlighted: false,
    },
    {
      name: 'Unlimited',
      description: 'For tutors and teachers with regular students.',
      price: siteFacts.price,
      priceSuffix: `/${siteFacts.pricePeriod}`,
      features: [
        'Unlimited AI lesson generations',
        'Vocabulary tracking for every student',
        'Students can make their own lessons from their page',
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
          text: 'Online ESL tutors on Preply, italki, Cambly and other platforms, independent English teachers, and small language schools. It is designed for one-to-one and small-group classes with teenagers and adults.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: `How is ${brand} different from ChatGPT?`,
      answer: [
        {
          type: 'text',
          text: `A general chatbot starts from nothing every time and returns a block of text. ${brand} knows each student's level and the words they have already learned, produces the same complete lesson structure every time, checks every section before saving it, and gives your student a page to practise on.`,
        },
      ] as FaqAnswerPart[],
    },
    {
      question: `Can ${brand} make grammar lessons?`,
      answer: [
        {
          type: 'text',
          text: `${brand} makes topic-based conversation lessons, not grammar-rule lessons. Grammar is practised through the sentence frames, which give students useful structures for the topic at three levels of support. To practise a particular structure, choose a topic that naturally uses it: "Life experiences" for the present perfect, or "What would you do if you won the lottery?" for the second conditional. `,
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
          text: 'Yes. When you make a lesson for a student, PlanWise avoids words they already know and words planned in their upcoming lessons, and reuses known words naturally in the reading. When you press "We did this" after class, that lesson’s words join the student’s list.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: 'Can my students choose what we talk about?',
      answer: [
        {
          type: 'text',
          text: 'Yes. On their private page, students suggest topics for the next class. You see their ideas on their profile and can turn one into a lesson in one click, with the topic and level already filled in. If you are on Unlimited, students can also make lessons themselves, at their own level; each one is saved in your library and planned for that student, and they star the one they want to do next. You can switch this off for any student.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: 'Can my students practise between lessons?',
      answer: [
        {
          type: 'text',
          text: 'Yes. Each student can have a private page (no login needed) with their finished lessons, a preview of the next lesson’s reading and new words, all their words, and flashcards. Students can also suggest topics for future lessons.',
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
