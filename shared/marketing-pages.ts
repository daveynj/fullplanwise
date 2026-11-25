/**
 * Public information pages (how it works, about, pricing, comparisons).
 *
 * Like shared/homepage-content.ts, this is the single source for both the
 * React page (client/src/pages/marketing-page.tsx) and the crawler-readable
 * HTML (server/marketing-prerender.ts), so what search engines and AI
 * assistants read always matches what visitors see.
 *
 * Text supports two inline marks: **bold** and [link text](/path).
 * Every claim must be true of the product today; lesson numbers come from
 * the lesson prompt (server/services/lesson-prompt.ts).
 */
import { siteFacts, trialText, priceText } from './site-facts';
import { cefrLevelsGuide, planConversationLessonGuide, topicsByLevelGuide, personaliseGuide, guidesIndex } from './guides';

export interface MarketingTable {
  headers: string[];
  rows: string[][];
}

export interface MarketingSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: MarketingTable;
}

export interface MarketingFaq {
  question: string;
  answer: string;
}

export interface MarketingPage {
  path: string;
  /** <title> and social title. */
  title: string;
  /** Meta description, 160 characters at most. */
  description: string;
  /** Short name for breadcrumbs and navigation. */
  navLabel: string;
  h1: string;
  /** Short line above the H1. */
  eyebrow: string;
  intro: string[];
  sections: MarketingSection[];
  faq?: MarketingFaq[];
  references?: string[];
  /** Small print shown at the end of the page. */
  disclaimer?: string;
  cta: { heading: string; text: string; label: string; href: string };
  schemaType: 'WebPage' | 'AboutPage' | 'Article';
  /** For guides: who wrote it and when it was first published (YYYY-MM-DD). */
  byline?: { author: string; published: string; note?: string };
  /** Last meaningful content change (YYYY-MM-DD), used for the sitemap and dateModified. */
  updated: string;
}

const { brand, generationTime } = siteFacts;

const trialCta = {
  label: 'Start Your Free Trial',
  href: '/auth?register=true',
};

const howItWorks: MarketingPage = {
  path: '/how-it-works',
  title: `How ${brand} Works: The Research Behind Every Lesson`,
  description:
    `Every ${brand} lesson follows a research-based sequence: activate, pre-teach, read, check, scaffold, speak, retrieve and recycle. Here is how, and why.`,
  navLabel: 'How It Works',
  eyebrow: 'The pedagogy',
  h1: 'The research behind every PlanWise ESL lesson',
  intro: [
    `A ${brand} lesson is not a random mix of activities. Every lesson follows the same sequence, and each step is there because second-language research shows it helps students learn. This page explains what happens in a lesson, the rules ${brand} follows at each CEFR level, and the research behind them.`,
    `In short: **5 new words per lesson, each met five or six times, in a reading the student can actually understand, followed by supported speaking, retrieval practice, and recycling in later lessons.**`,
  ],
  sections: [
    {
      heading: '1. Warm-up: activate what the student already knows',
      paragraphs: [
        'Every lesson opens with conversation questions on the topic, and the warm-up already names the lesson’s five target words.',
        '**Why:** readers understand far more when relevant background knowledge is switched on before they read (Carrell & Eisterhold, 1983). It also means the student is talking from the first minute, which matters in a one-to-one class.',
      ],
    },
    {
      heading: '2. Pre-teach five key words',
      paragraphs: [
        'Each lesson teaches **five target words**. Each one comes with its part of speech, pronunciation, a definition written in easier words than the word itself, an example at the student’s level, and a picture.',
        '**Why:** learners need to know roughly 95–98% of the words in a text to read it comfortably (Hu & Nation, 2000; Laufer & Ravenhorst-Kalovski, 2010). Teaching the key new words first turns the reading into a text the student can understand. Pairing a word with a picture gives the learner two routes to remember it (Paivio, 1986).',
      ],
    },
    {
      heading: '3. A reading written for the student’s level',
      paragraphs: [
        'The reading is five paragraphs long and uses each target word two or three times, with context clues. New words are kept to about **one in every 25 words**, so around 96% of the text is familiar. Its job is to give the student something interesting to react to and talk about, not to test them.',
        '**Why:** learners acquire language from input they can understand that stretches them slightly (Krashen, 1982). Meeting each new word again in a meaningful context is the next of the many encounters a word needs before it is learned (Webb, 2007).',
      ],
      table: {
        headers: ['Level', 'Reading length', 'Definitions written in', 'Reading style'],
        rows: [
          ['A1 Beginner', '80–120 words', 'The 500 most common English words, under 8 words', 'Very simple sentences of 6–8 words about concrete, everyday things'],
          ['A2 Elementary', '100–150 words', 'The 1,000 most common words, under 10 words', 'Simple sentences of 8–10 words with and, but, because'],
          ['B1 Intermediate', '120–180 words', 'A2 words plus common B1 words, under 12 words', 'Sentences of 10–12 words with opinions and reasons'],
          ['B2 Upper intermediate', '150–220 words', 'B1 words, under 15 words', 'Like a magazine feature, with more than one point of view'],
          ['C1 Advanced', '180–250 words', 'Plain English, under 20 words, always easier than the word', 'Quality long-form magazine style, with idiom and implied meaning'],
          ['C2 Proficient', '180–250 words', 'Natural English, under 20 words, showing how the word differs from close synonyms', 'Subtle and idiomatic, as a skilled native writer would write'],
        ],
      },
    },
    {
      heading: '4. Check understanding of the new words',
      paragraphs: [
        'Five comprehension questions follow the reading, one for each target word. They test whether the student understands the word, not whether they remember details of the text.',
        '**Why:** retrieving something from memory strengthens it far more than reading it again (Roediger & Karpicke, 2006), and keeping the question simple means the only thing being tested is the target word.',
      ],
    },
    {
      heading: '5. Speak with support: sentence frames at three levels',
      paragraphs: [
        'Each lesson has three sentence frames for useful language functions (for example, giving an opinion or comparing). Every frame comes at three levels of support, **emerging, developing and expanding**, each with model answers.',
        '**Why:** scaffolding is temporary support that lets a learner do what they cannot yet do alone, withdrawn as they improve (Wood, Bruner & Ross, 1976). Producing language, not just understanding it, pushes learners to notice what they cannot yet say (Swain, 1985). Three levels let a hesitant student and a confident one answer the same question.',
      ],
    },
    {
      heading: '6. Discussion: the heart of a conversation lesson',
      paragraphs: [
        'Five discussion questions, each with a short context and a picture, take the student from the reading to their own life and opinions.',
        '**Why:** negotiating meaning in conversation, asking for clarification and reformulating, is one of the main ways learners develop (Long, 1996). For one-to-one tutors this is where most of the class time goes.',
      ],
    },
    {
      heading: '7. Gap-fill and quiz: retrieve, don’t reread',
      paragraphs: [
        'A gap-fill paragraph uses all five words, with the gaps deliberately in a different order from the one the words were taught in, followed by a five-question quiz.',
        '**Why:** more retrieval practice (Roediger & Karpicke, 2006), and shuffling the order stops students answering by position instead of by meaning.',
      ],
    },
    {
      heading: '8. Optional: idioms and phrasal verbs from the reading',
      paragraphs: [
        'From A2 up, a lesson can add three or four phrasal verbs, idioms or everyday expressions taken from its own reading, each with its meaning, an example, a tip on common mistakes and a speaking question.',
        '**Why:** fluent speakers rely heavily on ready-made chunks of language (Wray, 2002), and learning them from a text the student has just read gives them a context to hang on (Boers & Lindstromberg, 2009).',
      ],
    },
    {
      heading: 'Across lessons: recycle, space and remember',
      paragraphs: [
        'Learners usually need many encounters with a word, often around ten, before they know it well (Webb, 2007; Nation, 2013). One lesson cannot do that alone, so PlanWise ESL keeps a record for each student:',
      ],
      bullets: [
        'New lessons for a student avoid words they have already learned or have planned, and reuse known words naturally in new readings.',
        'When the teacher presses "We did this", the lesson’s words join the student’s word list.',
        'On their own page, students practise their words with flashcards, and words they find hard come back sooner. Spacing practice over time leads to much better long-term memory than cramming (Cepeda et al., 2006).',
        'Students suggest topics for the next class from their page, so lessons stay on what they actually want to talk about. Topics learners choose themselves keep motivation high, which matters as much as any activity.',
      ],
    },
    {
      heading: 'A balanced lesson: the four strands',
      paragraphs: [
        'Paul Nation argues that a well-balanced course gives roughly equal time to four strands: meaning-focused input, meaning-focused output, language-focused learning and fluency development (Nation, 2007). Every PlanWise ESL lesson covers the first three: the reading (input), sentence frames and discussion (output), and vocabulary, gap-fill and idioms (language-focused learning). Recycling known words and reviewing them on the student page supports the fourth.',
      ],
    },
    {
      heading: 'Checked before the teacher sees it',
      paragraphs: [
        'Every new lesson is checked section by section before it is saved: that there are five usable vocabulary words, three complete sentence frames, five discussion and quiz questions, and a gap-fill whose every gap can actually be filled. A section that fails is repaired, or written again on its own. A broken exercise in the middle of a class costs a tutor more than it costs us.',
      ],
    },
    {
      heading: 'What PlanWise ESL does not do',
      paragraphs: [
        'It does not replace the teacher. You choose the topic your student cares about and the level, you run the conversation, and you give the feedback. PlanWise ESL does the hours of preparation in 1–2 minutes, so your time goes on the student.',
      ],
    },
  ],
  faq: [
    {
      question: `Is ${brand} based on research?`,
      answer: `Yes. Each stage of a ${brand} lesson follows well-established findings from second-language research: activating background knowledge before reading, pre-teaching vocabulary so 95–98% of a text is familiar, comprehensible input, scaffolded output with sentence frames, interaction through discussion, retrieval practice, and recycling words across lessons with spaced review.`,
    },
    {
      question: `How many new words does a ${brand} lesson teach?`,
      answer: 'Five target words per lesson. Each appears in the warm-up, the vocabulary section, two or three times in the reading, in its own comprehension question and in the gap-fill, so the student meets it five or six times in one lesson.',
    },
    {
      question: `Are ${brand} lessons CEFR-aligned?`,
      answer: 'You choose the level, from A1 to C2, and the reading length, sentence style and the words used in definitions follow fixed rules for that level (see the table on this page). Every lesson is then checked before it is saved.',
    },
    {
      question: 'Does it work for one-to-one and online lessons?',
      answer: 'Yes. Lessons were designed first for one-to-one online classes: conversation-led, ready to screen-share, and personalised to the student’s level, interests and vocabulary. They also work for small groups and in-person classes.',
    },
  ],
  references: [
    'Boers, F., & Lindstromberg, S. (2009). Optimizing a Lexical Approach to Instructed Second Language Acquisition. Palgrave Macmillan.',
    'Carrell, P. L., & Eisterhold, J. C. (1983). Schema theory and ESL reading pedagogy. TESOL Quarterly, 17(4), 553–573.',
    'Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. Psychological Bulletin, 132(3), 354–380.',
    'Council of Europe (2020). Common European Framework of Reference for Languages: Learning, Teaching, Assessment – Companion Volume. Council of Europe Publishing.',
    'Hu, M., & Nation, I. S. P. (2000). Unknown vocabulary density and reading comprehension. Reading in a Foreign Language, 13(1), 403–430.',
    'Krashen, S. D. (1982). Principles and Practice in Second Language Acquisition. Pergamon.',
    'Laufer, B., & Ravenhorst-Kalovski, G. C. (2010). Lexical threshold revisited: Lexical text coverage, learners’ vocabulary size and reading comprehension. Reading in a Foreign Language, 22(1), 15–30.',
    'Long, M. H. (1996). The role of the linguistic environment in second language acquisition. In W. C. Ritchie & T. K. Bhatia (Eds.), Handbook of Second Language Acquisition (pp. 413–468). Academic Press.',
    'Nation, I. S. P. (2007). The four strands. Innovation in Language Learning and Teaching, 1(1), 2–13.',
    'Nation, I. S. P. (2013). Learning Vocabulary in Another Language (2nd ed.). Cambridge University Press.',
    'Paivio, A. (1986). Mental Representations: A Dual Coding Approach. Oxford University Press.',
    'Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. Psychological Science, 17(3), 249–255.',
    'Swain, M. (1985). Communicative competence: Some roles of comprehensible input and comprehensible output in its development. In S. Gass & C. Madden (Eds.), Input in Second Language Acquisition (pp. 235–253). Newbury House.',
    'Webb, S. (2007). The effects of repetition on vocabulary knowledge. Applied Linguistics, 28(1), 46–65.',
    'Wood, D., Bruner, J. S., & Ross, G. (1976). The role of tutoring in problem solving. Journal of Child Psychology and Psychiatry, 17(2), 89–100.',
    'Wray, A. (2002). Formulaic Language and the Lexicon. Cambridge University Press.',
  ],
  cta: {
    heading: 'See it in a real lesson',
    text: `Every part described here is in this [B2 lesson on money and happiness](/lessons/1768), exactly as ${brand} made it. Or make your own: the ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-25',
};

const about: MarketingPage = {
  path: '/about',
  title: `About ${brand}: Built by an ESL Teacher, for ESL Teachers`,
  description:
    `${brand} was built by Dave Jackson, an ESL teacher who loves teaching but not the hours of making and personalising materials. This is why it exists.`,
  navLabel: 'About',
  eyebrow: 'About',
  h1: 'Built by an ESL teacher who loves teaching, and hated making materials',
  intro: [
    'Hi, I’m Dave Jackson. I teach English, mostly one to one, and I built PlanWise ESL for myself first.',
  ],
  sections: [
    {
      heading: 'Why I built it',
      paragraphs: [
        'I love teaching. What I never loved was the hours before teaching: finding a text at the right level, writing the questions, making vocabulary cards, building activities, and then doing it all again for the next student, because every student is different.',
        'Personalising lessons properly is what makes one-to-one teaching work, and it is also what eats your evenings and weekends. Generic materials are quicker, but students can tell, and they stop booking.',
        'So I built a tool that does the preparation the way I would do it myself: at the student’s level, on the topic they care about, building on the words they already know, with every activity in place and ready to teach.',
      ],
    },
    {
      heading: 'What I believe a good lesson needs',
      bullets: [
        '**A topic the student actually cares about.** Motivation does more than any worksheet.',
        '**Text the student can understand.** If too many words are new, the lesson becomes a dictionary exercise.',
        '**Support for speaking.** Sentence frames at the right level turn "I don’t know how to say it" into an answer.',
        '**Memory across lessons.** Students need to meet words again and again, so each lesson should build on the last.',
        '**Lots of talking.** In a conversation class, the student should be speaking most of the time.',
      ],
      paragraphs: [
        'Each of these is backed by second-language research. You can read [how a PlanWise lesson is built and the research behind it](/how-it-works).',
      ],
    },
    {
      heading: 'Who it is for',
      paragraphs: [
        'PlanWise ESL started with online one-to-one teaching, the kind of classes tutors teach on Preply, italki and Cambly or with their own private students. It works for any ESL or EFL teacher with teenage or adult learners: private tutors, language schools, business English trainers and classroom teachers who want lessons at the right level.',
      ],
    },
    {
      heading: 'Get in touch',
      paragraphs: [
        'I read every message, and many of PlanWise ESL’s features came from teachers’ suggestions. Email me at [dave@planwiseesl.com](mailto:dave@planwiseesl.com), or find me on [LinkedIn](https://www.linkedin.com/in/davidjackson113) and [X](https://x.com/DaveTeacher1).',
      ],
    },
  ],
  cta: {
    heading: 'Try it with your next student',
    text: `Make a lesson for a student you are teaching this week, on whatever they are into. The ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'AboutPage',
  updated: '2026-11-25',
};

const pricing: MarketingPage = {
  path: '/pricing',
  title: `${brand} Pricing: Free Trial and Unlimited Plan`,
  description:
    `${brand} has a ${trialText} with unlimited lessons and no card needed. The Unlimited plan is ${priceText}, cancel anytime.`,
  navLabel: 'Pricing',
  eyebrow: 'Pricing',
  h1: 'Simple pricing for ESL teachers',
  intro: [
    `Start with a ${trialText}: unlimited lessons and every feature, no credit card. Then keep going on the Unlimited plan for ${priceText}, or stop and keep everything you made.`,
  ],
  sections: [
    {
      heading: 'Plans',
      table: {
        headers: ['', 'Free', 'Unlimited'],
        rows: [
          ['Price', '$0', `${priceText}`],
          ['Lesson generation', `Unlimited during the ${trialText}`, 'Unlimited'],
          ['Every lesson section (incl. idioms & phrasal verbs)', 'During the trial', 'Yes'],
          ['Vocabulary tracking for each student', 'During the trial', 'Yes'],
          ['Private student pages with flashcards', 'Yes', 'Yes'],
          ['Students suggest topics for the next class', 'Yes', 'Yes'],
          ['Students can make their own lessons', 'No', 'Yes'],
          ['Keep every lesson you made', 'Yes', 'Yes'],
          ['Free ESL lesson library', 'Yes', 'Yes'],
          ['Cancel anytime', '–', 'Yes'],
        ],
      },
    },
    {
      heading: 'What one lesson costs you',
      paragraphs: [
        `If you teach 20 one-to-one lessons a month, Unlimited works out at about $1 per lesson for a complete, personalised lesson made in ${generationTime}. If a lesson took you even 30 minutes to prepare by hand, that is ten hours a month back.`,
      ],
    },
  ],
  faq: [
    {
      question: 'Do I need a credit card for the free trial?',
      answer: `No. Create an account and you get the ${trialText} with unlimited lessons straight away.`,
    },
    {
      question: 'What happens when the trial ends?',
      answer: 'Every lesson you made stays in your account and your students keep their pages. To make new lessons, upgrade to Unlimited.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes. Cancel from your account settings and you keep Unlimited until the end of the period you have paid for.',
    },
    {
      question: 'Is there a plan for schools?',
      answer: 'Email dave@planwiseesl.com with the number of teachers and we will set something up.',
    },
    {
      question: 'What currency are prices in?',
      answer: 'US dollars. Payment is by card through Stripe.',
    },
  ],
  cta: {
    heading: 'Try everything free',
    text: `Unlimited lessons for ${siteFacts.trialDays} days, no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-25',
};

const compareChatGpt: MarketingPage = {
  path: '/compare/chatgpt',
  title: `${brand} vs ChatGPT for ESL Lesson Planning`,
  description:
    `Can't you just use ChatGPT to plan ESL lessons? An honest comparison of ${brand} and general chatbots: structure, CEFR level, student memory and price.`,
  navLabel: 'PlanWise vs ChatGPT',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs ChatGPT for ESL lesson planning',
  intro: [
    'Many teachers already use ChatGPT (or Claude, or Gemini) to help with lessons, and for plenty of tasks it is excellent. So why use a dedicated ESL lesson planner? Here is an honest comparison.',
  ],
  sections: [
    {
      heading: 'Side by side',
      table: {
        headers: ['', 'General chatbot (ChatGPT, Claude, Gemini)', brand],
        rows: [
          ['What you get', 'Whatever your prompt asks for, usually a block of text to copy and format', 'A complete, formatted lesson with the same structure every time, ready to screen-share or print'],
          ['Lesson structure', 'Depends on your prompt', 'Warm-up, 5 pre-taught words, levelled reading, comprehension, 3 tiered sentence frames, discussion, gap-fill, quiz'],
          ['CEFR level', 'You describe the level; text often drifts above it', 'Fixed rules per level for reading length, sentence style and definitions, and every lesson is checked before saving'],
          ['Your students', 'Starts fresh each time unless you paste the context in again', 'Remembers each student’s words: avoids repeats and recycles known words'],
          ['Student practice', 'None built in', 'Private student page with lessons, words and flashcards'],
          ['Pictures', 'Possible if you ask, one at a time', 'Added to each vocabulary word and discussion question automatically'],
          ['Time per lesson', 'Prompting, checking, fixing and formatting, often 20–60 minutes', `${generationTime}; pictures follow about a minute later, while you teach the warm-up`],
          ['Price', 'Free tier, or about $20/month for paid plans', `${trialText}, then ${priceText}`],
        ],
      },
    },
    {
      heading: 'When a general chatbot is the better choice',
      bullets: [
        'Quick one-off tasks: explaining a grammar point in the moment, translating a word, writing an email.',
        'Content outside a lesson, such as course descriptions or feedback comments.',
        'If you enjoy writing prompts and checking every output, and only teach a few lessons a week.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You teach regular students and want each lesson to build on the last.',
        'You want every lesson to have the full shape (input, practice, speaking and review) without writing a prompt for each part.',
        'You want the level to stay right, and exercises that work, without checking every line.',
        'You want your students to practise between classes.',
      ],
    },
  ],
  faq: [
    {
      question: 'Can I use ChatGPT to make ESL lessons?',
      answer: 'Yes, and many teachers do. It works best with detailed prompts and careful checking: the level tends to drift upwards, exercises can contain errors, and it does not keep a record of the words each student has learned. A dedicated planner does that structure, levelling, checking and memory for you.',
    },
    {
      question: `Is ${brand} built on ChatGPT?`,
      answer: `${brand} uses large language models behind the scenes, plus its own lesson structure, CEFR-level rules, per-student vocabulary records, picture generation and quality checks. The model writes; ${brand} decides what a good lesson needs and checks it was delivered.`,
    },
    {
      question: `Is ${brand} worth it if I already pay for ChatGPT?`,
      answer: `If you teach regular one-to-one or small-group ESL classes, the time saved on each lesson and the student memory usually make it worth it. The ${trialText} needs no card, so you can compare them on your own students.`,
    },
  ],
  cta: {
    heading: 'Compare them on your own student',
    text: `Make the same lesson in both and see which one you would rather teach. The ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-25',
};

const camblyGuide: MarketingPage = {
  path: '/guides/cambly-feedback-score-super-tutor',
  title: 'How to Get a 100% Feedback Score on Cambly (and Reach Super Tutor)',
  description:
    'A first-lesson routine for Cambly tutors from ESL teacher Dave Jackson: introductions, setting expectations, the island question and the follow-up message.',
  navLabel: 'Cambly feedback score guide',
  eyebrow: 'Guide for Cambly tutors',
  h1: 'How to get a 100% feedback score on Cambly, and reach Super Tutor',
  byline: {
    author: 'Dave Jackson',
    published: '2026-11-25',
    note: 'First shared in the Unofficial Cambly Corner Facebook group.',
  },
  intro: [
    'I wrote this for tutors who want their feedback score at 100% and a shot at Super Tutor status. It does not take much effort. It is a pattern I follow with every new student, and it works because a first lesson is really about one thing: making the student want a second one.',
  ],
  sections: [
    {
      heading: 'The short version',
      bullets: [
        '**Introduce yourself** and get the student talking about themselves for a few minutes.',
        '**Set expectations:** explain the three options (free talk, a lesson, or a mix) and recommend free talk for a first lesson.',
        '**Hand over the questions:** invite them to ask you anything.',
        '**Ask the island question**, a fun, open question that tells you far more than "What are your hobbies?".',
        '**Send a message after class** with your schedule, so the trial student becomes a regular student.',
      ],
    },
    {
      heading: 'Remember who you are talking to',
      paragraphs: [
        'You have a new student. You have never met them, you know nothing about them, and they know nothing about you. They are probably nervous, maybe a little shy, and they may give one-word answers. That is not a problem. The routine below is designed for exactly that.',
      ],
    },
    {
      heading: 'Step 1: Introduce yourself and get them talking',
      paragraphs: [
        'Keep it simple and friendly:',
      ],
      bullets: [
        '**You:** "Hi, is it Chen?" **Student:** "Yes, I\u2019m Chen."',
        '**You:** "Hi Chen, I\u2019m Dave. Good to meet you. Where are you from?" **Student:** "China."',
        '**You:** "Cool. Whereabouts in China? Which city? And why are you learning English: for work, study, a hobby?"',
      ],
    },
    {
      heading: '',
      paragraphs: [
        'Spend a minute or more on small talk, depending on the student\u2019s level. It is the quickest way to gauge their vocabulary and grammar, and to get to know them a little.',
      ],
    },
    {
      heading: 'Step 2: Set expectations',
      paragraphs: [
        'Next, explain how you can help. Something like: "Since this is the first time we\u2019ve met, let me explain a few options." There are three:',
      ],
      bullets: [
        '**Free talk.** Great for confidence, listening and simply practising conversation. Its limit is vocabulary: people tend to stick to the words they already know. It is a good choice when a student just wants to talk, or is too tired for a full lesson.',
        '**A formal lesson.** Cambly has its own lessons (conversation, business English, technology and more). I also use my own material, which I make with [PlanWise ESL](/), but you don\u2019t need to if you use Cambly\u2019s.',
        '**A mix of both.** Many tutors use news-article sites: some vocabulary, a short article, then discussion. Less formal than a lesson, more structured than free talk.',
      ],
    },
    {
      heading: 'Step 3: Recommend free talk for the first lesson',
      paragraphs: [
        'Check they understand the options, then say: "Since we\u2019ve never met, I usually recommend we do some free talk." Explain why: you will both feel comfortable, and you will learn their strengths, weaknesses and interests, so next lesson can be properly suited to them.',
        '**Assume there will be a next lesson.** This is about the student wanting you as their tutor, not the other way around. Almost every student goes with the recommendation. If one would rather jump straight into something else, that is fine, but agree clearly on what they want before you start: a student who expects one thing and gets another is the one who leaves low feedback.',
      ],
    },
    {
      heading: 'Step 4: Hand over the questions',
      paragraphs: [
        'You have done a lot of talking by now, so give the student some control: "Before I ask you my question, do you have any questions for me? You\u2019re free to ask me anything." They will probably ask where you live or where you are from. Enjoy the small talk. When it dries up, you will usually have about 20 minutes left of a 30-minute booking.',
      ],
    },
    {
      heading: 'Step 5: Ask the island question',
      paragraphs: [
        '"I\u2019m going to ask you a question. There\u2019s no right or wrong answer. Imagine you\u2019re on a beautiful island, alone. You have unlimited food, water, fire and a house, but no internet and no power. You can bring three things, anything you like. One of them can be people, and you can bring as many people as you want, but they still count as one thing. What are your three things?"',
        'Here is why it works:',
      ],
      bullets: [
        '**The first thing is usually people:** husband, wife, children, a partner, friends. You learn who matters to them without asking anything personal. Lots of people suggests an extrovert; a few suggests an introvert.',
        '**The second is often books.** Tell them they can bring unlimited books, then ask what they read. You will learn a lot about their interests, or discover they don\u2019t like reading at all.',
        '**The third is where they struggle,** so offer ideas: a musical instrument, a surfboard, a horse, sports equipment.',
        '**How easily they answer, and in how much detail,** shows you their creativity, vocabulary and grammar, while the conversation keeps flowing and feels nothing like the generic chat they have with every other tutor.',
      ],
    },
    {
      heading: '',
      paragraphs: [
        'Keep it light. By now most students are talking freely. If they finish before time is up, ask them to ask you a question: they will be much more relaxed and will often ask something more interesting.',
      ],
    },
    {
      heading: 'Step 6: Send a message after class',
      paragraphs: [
        'If you enjoyed the lesson, message the student straight away with a short note and your schedule. I use a template. That is how a trial student becomes a regular one, and in my experience regular students and high feedback are what Super Tutor status comes down to. (Cambly sets and updates its own criteria, so check the Tutor Hub for the current details.)',
      ],
    },
    {
      heading: 'From the second lesson: make it about them',
      paragraphs: [
        'The first lesson gave you everything you need: their level, their job, who matters to them, what they read and what they enjoy. Use it. A lesson about the student\u2019s own world is what keeps them booking.',
        'That is exactly what I built PlanWise ESL for. Type the topic and a note about the student ("works in fashion, loves travel, B2"), and it writes a complete conversation lesson at their level in 1\u20132 minutes, keeps track of the words they have learned, and gives them a page to practise on between classes.',
      ],
    },
  ],
  faq: [
    {
      question: 'How do I get a 100% feedback score on Cambly?',
      answer: 'Make every first lesson about the student: introduce yourself and get them talking, explain the options and recommend free talk for the first session, let them ask you questions, then ask a fun open question (like the island question) that keeps them talking. Students who enjoy the first lesson leave high feedback and book again.',
    },
    {
      question: 'How do I become a Cambly Super Tutor?',
      answer: 'In my experience it comes down to consistently high feedback and turning trial students into regular students, so focus on making first lessons enjoyable and following up with a message and your schedule. Cambly sets its own criteria, so check the Tutor Hub for the current details.',
    },
    {
      question: 'What should I do in a first lesson with a new ESL student?',
      answer: 'Introduce yourself, gauge their level through small talk, explain how you can help, agree on free talk for the first session, and use an open, fun question to learn about their interests. Use what you learn to personalise the second lesson.',
    },
    {
      question: 'What is a good icebreaker question for a new ESL student?',
      answer: 'The island question: "You are alone on an island with food, water and a house, but no internet or power. You can bring three things, and one of them can be people. What do you bring?" It is fun, has no wrong answer, and tells you who and what matters to the student.',
    },
    {
      question: 'Should I do free talk or a lesson with a new student?',
      answer: 'For a first lesson I recommend free talk: it puts the student at ease and shows you their level and interests, so the next lesson can be built around them.',
    },
  ],
  cta: {
    heading: 'Plan their second lesson in 2 minutes',
    text: `Turn what you learned in the first lesson into a complete conversation lesson about the student\u2019s own world. The ${trialText} needs no credit card.`,
    label: 'Try PlanWise ESL Free',
    href: '/auth?register=true',
  },
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by Cambly. Cambly and Super Tutor are names used by Cambly.',
  schemaType: 'Article',
  updated: '2026-11-25',
};

/** Guides, in the order the /guides page lists them. */
export const guidePages: MarketingPage[] = [planConversationLessonGuide, topicsByLevelGuide, cefrLevelsGuide, personaliseGuide, camblyGuide];

export const marketingPages: MarketingPage[] = [howItWorks, about, pricing, compareChatGpt, guidesIndex(guidePages), ...guidePages];

export function marketingPageByPath(pathname: string): MarketingPage | undefined {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return marketingPages.find((p) => p.path === clean);
}

/** Main public navigation, shared by the React headers and the crawler HTML. */
export const publicNav: { label: string; href: string }[] = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Free Lessons', href: '/esl-lessons' },
  { label: 'Guides', href: '/guides' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders the two inline marks (**bold**, [text](href)) as HTML. The text is
 * escaped first, so only these marks become markup. Used by both the server
 * HTML and the React page.
 */
export function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
      const external = /^https?:\/\//.test(href);
      return `<a href="${href}"${external ? ' rel="noopener noreferrer"' : ''}>${label}</a>`;
    });
}

/** Plain text of an inline-marked string (for meta tags and structured data). */
export function plainInline(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1');
}
