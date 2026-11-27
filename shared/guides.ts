/**
 * Guides that answer questions ESL teachers ask search engines and AI
 * assistants. Rendered by the same page system as shared/marketing-pages.ts
 * (React page + crawler HTML), so the content lives here once.
 *
 * Written as general teaching advice, attributed to PlanWise ESL. Lesson
 * links point at real public lessons; numbers about PlanWise lessons come
 * from the lesson prompt (server/services/lesson-prompt.ts).
 */
import type { MarketingPage } from './marketing-pages';
import { siteFacts, trialText } from './site-facts';

const { brand, generationTime } = siteFacts;
const published = '2026-11-25';
const byline = { author: brand, published };
const trialCta = { label: 'Try PlanWise ESL Free', href: '/auth?register=true' };

export const cefrLevelsGuide: MarketingPage = {
  path: '/guides/cefr-levels-explained',
  title: 'CEFR Levels A1–C2 Explained for ESL Teachers',
  description:
    'What each CEFR level from A1 to C2 means, how to tell a new student’s level in a few minutes, and how to pitch a lesson so it is neither too easy nor too hard.',
  navLabel: 'CEFR levels explained',
  eyebrow: 'Guide',
  h1: 'CEFR levels A1 to C2, explained for ESL teachers',
  byline,
  intro: [
    'The Common European Framework of Reference for Languages (CEFR) describes language ability on six levels, from A1 (beginner) to C2 (proficient). Most ESL materials, exams and tutoring platforms use it, so knowing what each level really means, in a real conversation, is one of the most useful things a tutor can learn.',
    'This guide explains each level in plain terms, how to judge a new student’s level in a few minutes, and how to pitch a lesson at the right level.',
  ],
  sections: [
    {
      heading: 'The six CEFR levels at a glance',
      table: {
        headers: ['Level', 'Name', 'In conversation, the student can…', 'Approx. guided hours*'],
        rows: [
          ['A1', 'Beginner', 'Introduce themselves and answer simple questions about familiar things, if you speak slowly and help.', 'about 90–100'],
          ['A2', 'Elementary', 'Talk about their family, work, shopping and routine in short, simple sentences, and describe past events simply.', 'about 180–200'],
          ['B1', 'Intermediate', 'Keep a conversation going on familiar topics, describe experiences and plans, and give simple reasons for opinions.', 'about 350–400'],
          ['B2', 'Upper intermediate', 'Discuss a wide range of topics with some fluency, explain a viewpoint and weigh advantages and disadvantages.', 'about 500–600'],
          ['C1', 'Advanced', 'Express ideas fluently and flexibly for social and professional purposes, and understand implied meaning.', 'about 700–800'],
          ['C2', 'Proficient', 'Understand virtually everything and express fine shades of meaning precisely, even on complex subjects.', 'about 1,000–1,200'],
        ],
      },
      paragraphs: [
        '*Approximate cumulative hours of guided learning, based on Cambridge English estimates. Real learners vary a lot: first language, time outside class and motivation all matter.',
        'A1 and A2 are “basic users”, B1 and B2 “independent users” and C1 and C2 “proficient users”. The 2020 Companion Volume also describes “plus” levels (A2+, B1+, B2+) for students who are clearly above one level but not yet at the next.',
      ],
    },
    {
      heading: 'How to tell a new student’s level in a few minutes',
      paragraphs: [
        'You do not need a test. A few minutes of small talk in a first lesson tells you most of what you need. Listen for:',
      ],
      bullets: [
        '**Sentence length and connectors.** A1–A2 students speak in short sentences joined with *and*, *but* and *because*. B1 students start using *although*, *so* and *when*. B2 and above link ideas naturally.',
        '**Tenses.** A2 students handle present and simple past. B1 students can talk about experiences and plans. Comfortable use of the present perfect, conditionals and the passive usually means B2 or above.',
        '**Opinions.** Ask “What do you think about…?” A1–A2 students give a word or two; B1 students give an opinion and a simple reason; B2 students can compare sides; C1 students qualify and nuance.',
        '**Searching for words.** Long pauses on everyday words suggest A2–B1. At C1 the pauses are about choosing the best word, not finding any word.',
        '**Understanding you.** Speak naturally for a minute. If they follow easily, including your idioms, they are probably C1 or above.',
      ],
    },
    {
      heading: 'How to pitch a lesson at the right level',
      paragraphs: [
        'The most common mistake is a reading text that is too hard: a B1 text full of C1 words turns a conversation lesson into a dictionary exercise. Research suggests learners need to know about 95–98% of the words in a text to read it comfortably (Hu & Nation, 2000), so pre-teach the few new words and keep everything else at the student’s level.',
        'As a guide, these are the rules PlanWise ESL uses when it writes a lesson:',
      ],
      table: {
        headers: ['Level', 'Reading length', 'Sentences', 'Explain new words using'],
        rows: [
          ['A1', '80–120 words', 'Very simple, 6–8 words, present simple and simple past', 'The 500 most common English words'],
          ['A2', '100–150 words', 'Simple, 8–10 words, with and, but, because', 'The 1,000 most common words'],
          ['B1', '120–180 words', '10–12 words, with opinions and reasons', 'A2 words plus common B1 words'],
          ['B2', '150–220 words', 'About 12–15 words, more than one point of view', 'B1 words'],
          ['C1', '180–250 words', 'Varied, natural magazine style, some idiom', 'Plain English, always easier than the word'],
          ['C2', '180–250 words', 'Subtle and idiomatic, native-level style', 'Natural English, showing how the word differs from close synonyms'],
        ],
      },
    },
    {
      heading: 'Common traps',
      bullets: [
        '**Making C1 lessons too easy.** Advanced students get bored by simplified text. The challenge should come from the ideas and the precision of the language, not from jargon.',
        '**The intermediate plateau.** Many students stall around B1–B2 because they can already communicate. Push precision: new words they would actually use, more complex structures in the sentence frames, and longer answers.',
        '**Judging only by grammar.** A student can know the grammar rules and still be A2 in conversation. Judge by what they can do when speaking.',
      ],
    },
  ],
  faq: [
    {
      question: 'What are the six CEFR levels?',
      answer: 'A1 (beginner), A2 (elementary), B1 (intermediate), B2 (upper intermediate), C1 (advanced) and C2 (proficient). A1 and A2 are basic users, B1 and B2 independent users, and C1 and C2 proficient users.',
    },
    {
      question: 'What CEFR level counts as fluent?',
      answer: 'People usually mean B2 or above. At B2 a student can talk with native speakers on most topics without much strain; at C1 they speak fluently and flexibly at work and in study.',
    },
    {
      question: 'How long does it take to go up one CEFR level?',
      answer: 'Cambridge English estimates roughly 100–200 hours of guided learning per level in the middle levels, more at the top, but it varies a lot by learner, first language and practice outside class.',
    },
    {
      question: 'How do I find a new ESL student’s level?',
      answer: 'Talk for a few minutes and listen to their sentence length, connectors, range of tenses and how they give opinions. A short conversation tells you more than a grammar test about how they will cope in a conversation lesson.',
    },
  ],
  references: [
    'Council of Europe (2001). Common European Framework of Reference for Languages: Learning, Teaching, Assessment. Cambridge University Press.',
    'Council of Europe (2020). Common European Framework of Reference for Languages: Learning, Teaching, Assessment – Companion Volume. Council of Europe Publishing.',
    'Cambridge English. Guided learning hours (published estimates of hours needed to reach each level).',
    'Hu, M., & Nation, I. S. P. (2000). Unknown vocabulary density and reading comprehension. Reading in a Foreign Language, 13(1), 403–430.',
  ],
  cta: {
    heading: 'Lessons written for each level',
    text: `${brand} writes complete conversation lessons at any CEFR level from A1 to C2 in 1–2 minutes. [Browse free lessons by level](/esl-lessons), or make your own: the ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'Article',
  updated: published,
};

export const planConversationLessonGuide: MarketingPage = {
  path: '/guides/how-to-plan-an-esl-conversation-lesson',
  title: 'How to Plan an ESL Conversation Lesson (Step by Step)',
  description:
    'A step-by-step plan for a 60-minute ESL conversation lesson, one-to-one or in small groups: timings, how many new words, and how to keep students talking.',
  navLabel: 'Plan a conversation lesson',
  eyebrow: 'Guide',
  h1: 'How to plan an ESL conversation lesson, step by step',
  byline,
  intro: [
    'A good conversation lesson is not just free talk. It gives the student something interesting to react to, a few new words that let them say more, support for speaking, and lots of time to talk. Here is a simple structure that works for one-to-one and small-group classes, online or in person.',
  ],
  sections: [
    {
      heading: 'A 60-minute plan at a glance',
      table: {
        headers: ['Stage', 'Time', 'What happens'],
        rows: [
          ['1. Warm-up', '5–8 min', 'Two or three questions that connect the topic to the student’s life'],
          ['2. New words', '8–10 min', 'Pre-teach about five key words: meaning, pronunciation, an example'],
          ['3. Reading', '8–10 min', 'A short text at the student’s level that uses the new words'],
          ['4. Check', '5 min', 'A few quick questions on the new words'],
          ['5. Speaking support', '8–10 min', 'Sentence frames for the opinions the student will need'],
          ['6. Discussion', '15–20 min', 'Open questions that take the topic into the student’s own life'],
          ['7. Review', '5 min', 'A quick gap-fill or quiz, and the words to remember'],
        ],
      },
      paragraphs: [
        'For a 30-minute lesson, keep the warm-up, three or four words, a shorter reading and the discussion, and leave the review for homework.',
      ],
    },
    {
      heading: '1. Choose a topic the student cares about',
      paragraphs: [
        'Motivation does more than any activity. Use what you know about the student: their job, their hobbies, a trip they are planning, a series they are watching. When you are not sure, offer two or three options and let them choose. See [conversation topics by level](/guides/esl-conversation-topics-by-level) for ideas.',
      ],
    },
    {
      heading: '2. Warm up with their own experience',
      paragraphs: [
        'Start with questions they can answer from their own life, not facts: “Have you ever…?”, “What do you usually…?”, “Would you rather…?” This switches on what they already know about the topic and gets them talking from the first minute.',
      ],
    },
    {
      heading: '3. Pre-teach about five words, then read',
      paragraphs: [
        'Five new words is plenty for one conversation lesson. Teach them before the reading so the text is easy to understand, then let the reading use each word two or three times. Learners usually need many encounters with a word before they know it, so meeting it again in the text, the questions and the discussion matters more than adding more words.',
      ],
    },
    {
      heading: '4. Support the speaking with sentence frames',
      paragraphs: [
        'Sentence frames are ready-made starts for the answers the student will need: “While some people believe ___, I think ___.” Offer them at different levels of support, from a nearly complete sentence for a hesitant student to an open prompt for a confident one. They are also the best place to practise grammar in a conversation lesson.',
      ],
    },
    {
      heading: '5. Give the discussion most of the time',
      bullets: [
        '**Ask open questions** that need more than one sentence: “Why?”, “What would you do if…?”, “How is it different in your country?”',
        '**Follow up** on what they say. The best question is often the one you did not plan.',
        '**Correct selectively.** Note mistakes while they talk and go through two or three useful ones at the end, so the conversation keeps flowing.',
        '**Talk less.** In a conversation lesson the student should be speaking most of the time.',
      ],
    },
    {
      heading: '6. Review, and recycle next time',
      paragraphs: [
        'Finish with a quick gap-fill or a few questions using the new words. Next lesson, bring a few of them back in the warm-up or the reading. Recycling is what turns words the student met once into words they can use.',
      ],
    },
    {
      heading: 'Doing this in two minutes instead of two hours',
      paragraphs: [
        `Planning every stage by hand for every student takes time. ${brand} writes the whole structure above for any topic and level in 1–2 minutes, avoids words the student already knows, and recycles them in new readings. [See a real lesson](/lessons/1768) or read [how a PlanWise lesson is built](/how-it-works).`,
      ],
    },
  ],
  faq: [
    {
      question: 'How do you structure an ESL conversation lesson?',
      answer: 'Warm up with questions about the student’s own experience, pre-teach about five key words, read a short text at their level, check the new words, give sentence frames for the opinions they will need, spend most of the time on discussion, and finish with a quick review.',
    },
    {
      question: 'How many new words should an ESL lesson teach?',
      answer: 'About five for a conversation lesson. Fewer words met several times (in the reading, the questions and the discussion) are learned better than a long list met once.',
    },
    {
      question: 'How do I get a quiet ESL student to talk more?',
      answer: 'Choose a topic from their own life, ask open questions, give sentence frames so they know how to start an answer, wait a little longer after each question, and correct at the end rather than interrupting.',
    },
    {
      question: 'What is the difference between free talk and a conversation lesson?',
      answer: 'Free talk is unstructured conversation: good for confidence and fluency, but students tend to stick to words they already know. A conversation lesson adds new words, a text to react to and speaking support, so the student learns new language while they talk.',
    },
  ],
  cta: {
    heading: 'Get the whole lesson written for you',
    text: `Choose a level and a topic, and ${brand} writes every stage in 1–2 minutes. The ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'Article',
  updated: published,
};

export const topicsByLevelGuide: MarketingPage = {
  path: '/guides/esl-conversation-topics-by-level',
  title: 'ESL Conversation Topics by Level (A1–C2), With Free Lessons',
  description:
    'Conversation topics for adult ESL students at every CEFR level, from A1 to C2, with free ready-to-teach lessons and topics that practise specific grammar.',
  navLabel: 'Conversation topics by level',
  eyebrow: 'Guide',
  h1: 'ESL conversation topics by level, with free lessons',
  byline,
  intro: [
    'The right topic depends on the level: beginners talk about their own world, advanced students debate ideas. Here are conversation topics that work at each CEFR level for teenage and adult students, with links to free, ready-to-teach lessons where we have them.',
  ],
  sections: [
    {
      heading: 'A1 (beginner): me and my world',
      bullets: [
        'My family and friends',
        'My daily routine',
        'Food I like and don’t like',
        'My home and my town',
        'Hobbies and free time',
        'Free lesson: [Let’s Talk About Video Games!](/lessons/1774)',
      ],
    },
    {
      heading: 'A2 (elementary): experiences and plans',
      bullets: [
        'A holiday I remember',
        'Shopping and money',
        'My job or my studies',
        'Weekend plans',
        'Health and keeping fit',
        'Free lesson: [My Dreams and Goals](/lessons/1804)',
      ],
    },
    {
      heading: 'B1 (intermediate): opinions with reasons',
      bullets: [
        'Learning new skills',
        'Work and careers',
        'Technology in everyday life',
        'What would you do if you won the lottery?',
        'Starting your own business',
        'Free lessons: [Born a Genius, or Made One?](/lessons/1803) · [Thinking Like an Entrepreneur](/lessons/1736) · [Training Doctors in Brazil](/lessons/1777)',
      ],
    },
    {
      heading: 'B2 (upper intermediate): comparing sides',
      bullets: [
        'Can money buy happiness?',
        'Universal basic income',
        'The future of work and AI',
        'Fast food: good or bad?',
        'Bucket lists and life goals',
        'Free lessons: [Can Money Buy Happiness?](/lessons/1768) · [Money for Everyone? Universal Basic Income](/lessons/1802) · [AI and Tomorrow’s World](/lessons/1801) · [Bucket Lists](/lessons/1807) · [Fast Food Everywhere](/lessons/1805)',
      ],
    },
    {
      heading: 'C1 (advanced): ideas and nuance',
      bullets: [
        'Ethics at work',
        'Work–life balance',
        'Success, failure and starting again',
        'Astrology, belief and evidence',
        'Free lessons: [The Price of Doing Right: Ethics in the Boardroom](/lessons/1731) · [The Modern Juggling Act](/lessons/1733) · [Founders, Failures and Pivots](/lessons/1750) · [Written in the Stars?](/lessons/1764)',
      ],
    },
    {
      heading: 'C2 (proficient): subtle and abstract',
      bullets: [
        'Fate or free will?',
        'The attention economy: who profits from your focus?',
        'Can science help us live forever?',
        'Satire, irony and humour across cultures',
        'Language and identity',
      ],
    },
    {
      heading: 'Topics that practise specific grammar',
      paragraphs: [
        'In a conversation lesson, grammar works best when the topic makes the student need it. Some reliable pairings:',
      ],
      table: {
        headers: ['To practise…', 'Try a topic like…'],
        rows: [
          ['Present perfect', 'Life experiences: things I’ve done and things I’d still love to do'],
          ['Second conditional', 'What would you do if you won the lottery?'],
          ['Past tenses', 'A trip I’ll never forget'],
          ['“Used to”', 'How life has changed since I was a child'],
          ['Future forms', 'Plans and predictions: what will life be like in 2050?'],
          ['Comparatives and superlatives', 'City life vs country life: which is better?'],
          ['Modal verbs', 'Rules, advice and working from home'],
          ['The passive', 'How everyday things are made'],
          ['Reported speech', 'News, rumours and gossip: who said what?'],
        ],
      },
    },
    {
      heading: 'The best topics come from the student',
      paragraphs: [
        'Generic topics are a good start, but the lessons students remember are about their own world. One student working in China’s fashion industry studied lessons such as “The Rise of Luxury Chinese Fashion Brands” and “Swipe, Stream, Sell: Live Commerce vs Traditional Retail in the Fashion World”. Ask students what they want to talk about, or let them suggest topics for the next class.',
      ],
    },
  ],
  faq: [
    {
      question: 'What are good conversation topics for adult ESL students?',
      answer: 'Topics from their own lives and interests work best: work and careers, travel, money and happiness, technology and AI, health, learning new skills and life goals. Match the topic to the level: concrete and personal at A1–A2, opinions at B1, comparing sides at B2, ideas and nuance at C1–C2.',
    },
    {
      question: 'What should I talk about with a beginner ESL student?',
      answer: 'Their own world: family, daily routine, food, home, hobbies and free time. Use short questions, lots of examples, and pictures where you can.',
    },
    {
      question: 'How can I practise grammar in a conversation lesson?',
      answer: 'Pick a topic that makes the student need the structure, such as life experiences for the present perfect or “What would you do if you won the lottery?” for the second conditional, and give sentence frames that use it.',
    },
  ],
  cta: {
    heading: 'Turn any topic into a lesson',
    text: `${brand} writes a complete conversation lesson on any topic, at any level, in 1–2 minutes. [Browse all free lessons](/esl-lessons), or try it with your own student: the ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'Article',
  updated: published,
};

export const personaliseGuide: MarketingPage = {
  path: '/guides/personalise-esl-lessons',
  title: 'How to Personalise ESL Lessons for One-to-One Students (Without Hours of Prep)',
  description:
    'A 5-step routine for personalising 1-on-1 ESL lessons: a student profile, topics from their job, vocabulary recycling, and a real 4-lesson example.',
  navLabel: 'Personalise ESL lessons',
  eyebrow: 'Guide for tutors',
  h1: 'How to personalise ESL lessons for one-to-one students, without spending hours',
  byline: { author: siteFacts.founder, published, note: 'Updated 27 November 2026 with a worked 4-lesson example.' },
  intro: [
    'Personalised lessons are the reason students choose a one-to-one tutor over an app, and the reason they keep booking. They are also what eats a tutor’s evenings.',
    `This guide is the routine behind ${brand}, written by founder Dave Jackson, a British ESL teacher with 11 years of teaching and 2,000+ students. Every step works with a notebook and free materials. Where ${brand} saves time, we say so and link to a live lesson you can open with **no login**.`,
  ],
  verdict: {
    heading: 'The short version: personalise in five steps',
    text: '**1.** Use the first lesson to learn who the student is. **2.** Keep a two-minute profile: level, job, goal, interests, topics covered and words learned. **3.** Choose topics from their job and life. **4.** Track the words they learn, never re-teach them, and bring them back in later lessons. **5.** Let the student pick the next topic. Steps 2 and 4 are the ones most tutors skip, and they are what makes a student feel the lessons were made for them.',
  },
  sections: [
    {
      heading: 'What “personalised” actually means',
      bullets: [
        '**Level:** the reading, the new words and the speaking support are pitched at what this student can do now.',
        '**Interests:** the topic comes from their job, hobbies or plans, so they have something to say.',
        '**Goals:** a job interview, a trip, an exam, a promotion: each lesson moves them towards it.',
        '**History:** new lessons build on the words and topics you have already covered, instead of repeating them.',
      ],
    },
    {
      heading: '1. Learn about the student in the first lesson',
      paragraphs: [
        'Use the first lesson to find out who they are: their job, why they are learning English, what they enjoy and who matters to them. A fun open question works better than a questionnaire. Try the island question: "You are alone on an island with food, water and a house, but no internet or power. You can bring three things, and one of them can be people. What do you bring?" There is no wrong answer, and it tells you who and what matters to the student.',
        'Also ask what they use English for each week. "I write emails to our German supplier" or "I present results every Monday" tells you exactly what to teach.',
      ],
    },
    {
      heading: '2. Keep a two-minute profile for each student',
      paragraphs: [
        'Fill this in after the first lesson and update it after each class. It takes two minutes and saves guessing before the next one. Copy it into a notebook, a document or a spreadsheet:',
      ],
      bullets: [
        '**Level:** CEFR level now (for example B1), and any skill that is weaker (often listening or speaking).',
        '**Job and English at work:** what they do and when they need English (meetings, emails, patients, guests).',
        '**Goal and deadline:** for example "job interview in March" or "move to Canada next year".',
        '**Interests:** hobbies, family, places, things they could talk about for ten minutes.',
        '**Topics covered:** one line per lesson.',
        '**Words learned:** the new words and phrases from each lesson.',
        '**Mistakes to watch:** two or three repeated errors (for example, missing past tense endings).',
        '**Next topic:** what they asked to talk about next time.',
      ],
    },
    {
      heading: '3. Choose topics from their world',
      paragraphs: [
        'A nurse gets lessons on patients and care, a software engineer gets meetings and code reviews, a finance manager gets results and risk. General topics still work when you angle them: “Can money buy happiness?” is a different conversation for a banker and for a university student. Here are free, complete lessons you can open now, grouped by the student they suit:',
      ],
      table: {
        headers: ['Student', 'Lessons to start with (free, no login)'],
        rows: [
          ['Adult beginner starting a new job (A1–A2)', '[First Day at a New Job (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team), [Talking About Your Job and Workplace (A2)](/esl-lessons/a2/talking-about-your-job-and-workplace)'],
          ['Nurse or doctor', '[Reassuring a Patient Before a Procedure (B1)](/esl-lessons/b1/calming-words-reassuring-a-patient-before-a-procedure), [Patient Handovers (B2)](/esl-lessons/b2/patient-handovers-how-doctors-pass-the-baton), [Clinical Efficiency and Compassionate Care (C1)](/esl-lessons/c1/balancing-clinical-efficiency-with-compassionate-patient-care)'],
          ['Software engineer', '[Daily Stand-Up Meetings in Tech Teams (B1)](/esl-lessons/b1/daily-stand-up-meetings-in-tech-teams), [Code Review Feedback (B2)](/esl-lessons/b2/code-review-feedback-say-it-well-take-it-well), [Working Together Across Time Zones (B2)](/esl-lessons/b2/working-together-across-time-zones)'],
          ['Finance or business', '[Presenting Monthly Results (B2)](/esl-lessons/b2/talking-money-presenting-monthly-results), [Talking About Risk and Uncertainty (C1)](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty), [Leading High-Stakes Client Meetings (C1)](/esl-lessons/c1/leading-high-stakes-client-meetings-in-english)'],
          ['Hotel, restaurant or customer service', '[Handling Difficult Guests (B1)](/esl-lessons/b1/handling-difficult-guests-like-a-pro), [Handling Customer Complaints Calmly (B1)](/esl-lessons/b1/handling-customer-complaints-calmly-in-english)'],
          ['Preparing for a job interview', '[Tell Me About Yourself (A2)](/esl-lessons/a2/tell-me-about-yourself-job-interviews), [Strengths and Weaknesses (B1)](/esl-lessons/b1/talking-about-your-strengths-and-weaknesses-at-an-interview), [The STAR Method (B2)](/esl-lessons/b2/telling-your-story-the-star-method-for-interviews)'],
        ],
      },
    },
    {
      heading: '4. Track and recycle their words',
      paragraphs: [
        'This is the step that makes the biggest difference and the one most often skipped. A student needs to meet a word several times, in different places, before they can use it. If each lesson teaches new words and never returns to them, most are forgotten within a week.',
        'By hand: keep the "words learned" list from the profile. Before each lesson, check the new material against it and swap out anything already taught. Then pick three to five earlier words and bring them back: in a warm-up question, a gap-fill or a discussion question. Keep each lesson’s new set small; PlanWise ESL B2 lessons, for example, teach five words and four phrases.',
      ],
    },
    {
      heading: 'A worked example: one student, four lessons',
      paragraphs: [
        'Here is what steps 2 to 4 look like in practice. Our sample student is **Kenji, a B2 software engineer**. We made four lessons for him in a row with PlanWise ESL and published all four, so you can open them and check:',
      ],
      bullets: [
        '**Lesson 1:** [When Projects Grow: Scope Creep and Tight Deadlines](/esl-lessons/b2/when-projects-grow-scope-creep-and-tight-deadlines) teaches words such as *scope*, *negotiate* and *compromise*.',
        '**Lesson 2:** [When Projects Grow Too Big](/esl-lessons/b2/when-projects-grow-too-big-scope-creep-and-deadlines) stays on the same theme on purpose, but teaches a completely new set of words (*milestone*, *workload*, *trade-off*, *push back*) and brings back Lesson 1’s *scope*, *negotiate* and *compromise* in the warm-up, reading and sentence frames.',
        '**Lesson 3:** [Leading a Remote Retrospective Without Blame](/esl-lessons/b2/leading-a-remote-retrospective-without-blame) moves to team meetings and brings back *deadline*, *workload*, *push back* and *draw the line* from Lesson 2.',
        '**Lesson 4:** [Getting Ahead: Talking About Promotions in Tech](/esl-lessons/b2/getting-ahead-talking-about-promotions-in-tech) moves on to career growth and still reuses *negotiate* from Lesson 1 and *trade-off* and *push back* from Lesson 2.',
        '**The result:** 36 different words and phrases taught across four lessons, none taught twice, and earlier words reappearing in later readings, gap-fills, quizzes and discussions. The full word-by-word breakdown is in the [4-lesson memory proof](/compare/student-memory-proof).',
      ],
    },
    {
      heading: '5. Let the student choose',
      paragraphs: [
        'Ask what they want to talk about next time, or keep a running list of their ideas in the profile. Students who choose the topic arrive with something to say, and they are more likely to book again.',
      ],
    },
    {
      heading: 'Doing it with free tools',
      paragraphs: [
        'You can do all of this without paying for anything: a spreadsheet for profiles, a [free library lesson](/esl-lessons) on a nearby topic, and a general chatbot to adapt it. A prompt that works: *"Adapt this B1 lesson for my student, a hotel receptionist who wants to handle complaints on the phone. Keep the level at B1. Do not teach these words again: [list]. Reuse these earlier words in the reading and questions: [list]."*',
        'Check the result before class: chatbots often drift above the target level, answer keys can be wrong, and the chatbot will not remember the student next week, so the profile and word list stay your job. Expect to spend some time per lesson editing and formatting.',
      ],
    },
    {
      heading: `How ${brand} does this for you`,
      bullets: [
        `**Type the topic and a note about the student** (for example, “works in fashion, loves travel, B2”), and a finished, ready-to-teach conversation lesson is ready in ${generationTime}: warm-up, new words, a levelled reading, exercises and discussion ([how it works](/how-it-works)).`,
        '**It keeps the word list for you:** lessons made for a student avoid words they already know and bring earlier words back in new readings and questions, as in Kenji’s four lessons above.',
        '**Each student gets a private page with no login:** their lessons, words and flashcards, and a place to suggest topics for your next class. On Unlimited they can make their own lessons too ([see the student page](/student-experience)).',
        'Built for tutors who see the same students every week: [online tutors](/for/online-tutors), [Preply tutors](/for/preply-tutors), [italki tutors](/for/italki-tutors) and [freelance teachers](/for/freelance-esl-teachers).',
      ],
    },
  ],
  faq: [
    {
      question: 'How do I personalise ESL lessons for one-to-one students?',
      answer: 'Learn about the student in the first lesson, keep a short profile (level, job, goal, interests, topics covered and words learned), choose topics from their job and life, track the words they learn and bring them back in later lessons, and let them choose the next topic.',
    },
    {
      question: 'What should I ask a new ESL student in the first lesson?',
      answer: 'Ask about their job and when they use English each week, why they are learning and by when, and what they enjoy. An open question such as the island question ("three things you would bring to a desert island") gets students talking and shows you what matters to them.',
    },
    {
      question: 'How long should it take to prepare a personalised one-to-one ESL lesson?',
      answer: `From scratch, a complete personalised lesson can easily take an hour or more. Reusing a fixed lesson structure, a student profile and a free library lesson on a nearby topic cuts that down a lot. ${brand} makes a finished lesson for the student in ${generationTime}.`,
    },
    {
      question: 'How do I stop repeating vocabulary with the same student?',
      answer: `Keep a list of the words each student has learned and check new materials against it, then bring three to five earlier words back in each new lesson. ${brand} does this automatically: lessons made for a student avoid their known words and reuse them in new readings and questions.`,
    },
    {
      question: 'Can I personalise ESL lessons for free?',
      answer: 'Yes. Keep student profiles in a spreadsheet, start from a free lesson on a nearby topic (the PlanWise ESL library has 180+ free A1–C2 lessons with no login), and adapt it with a chatbot. Check the level and the answers before class, and keep the word list yourself, because chatbots do not remember the student.',
    },
  ],
  cta: {
    heading: `Personalised lessons in ${generationTime}`,
    text: `Try it with a student you are teaching this week. The ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'Article',
  updated: '2026-11-27',
};

/** The /guides index. Lists every guide in guidePages (marketing-pages.ts). */
export function guidesIndex(guides: MarketingPage[]): MarketingPage {
  return {
    path: '/guides',
    title: `Guides for ESL Teachers and Online Tutors | ${brand}`,
    description:
      'Practical guides for ESL teachers and online tutors on Preply and italki: CEFR levels, conversation lessons, topics by level and personalising.',
    navLabel: 'Guides',
    eyebrow: 'Guides',
    h1: 'Guides for ESL teachers and online tutors',
    intro: [
      'Practical, no-nonsense guides for teaching English one to one and in small groups, online or in person.',
    ],
    sections: [
      {
        heading: 'All guides',
        bullets: guides.map((g) => `**[${g.h1.charAt(0).toUpperCase()}${g.h1.slice(1)}](${g.path})**. ${g.description}`),
      },
    ],
    cta: {
      heading: 'Make your next lesson in 1–2 minutes',
      text: `${brand} writes complete, CEFR-levelled conversation lessons for each of your students. The ${trialText} needs no credit card.`,
      ...trialCta,
    },
    schemaType: 'WebPage',
    updated: published,
  };
}
