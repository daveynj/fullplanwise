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
import { siteFacts, trialText, priceText } from './site-facts';

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
      answer: 'Yes. Keep student profiles in a spreadsheet, start from a free lesson on a nearby topic (the PlanWise ESL library has 200+ free A1–C2 lessons with no login), and adapt it with a chatbot. Check the level and the answers before class, and keep the word list yourself, because chatbots do not remember the student.',
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

const freeGuidesPublished = '2026-11-28';
const freeGuidesByline = { author: siteFacts.founder, published: freeGuidesPublished };

export const freeAdultLessonsGuide: MarketingPage = {
  path: '/guides/free-esl-conversation-lessons-for-adults',
  title: 'Free ESL Conversation Lessons for Adults (No Sign-Up) | PlanWise',
  description:
    'Free ESL conversation lessons for adults with no sign-up: 200+ lessons from A1 to C2, what each one contains, and how to teach one in 30 or 60 minutes.',
  navLabel: 'Free adult conversation lessons',
  eyebrow: 'Guide for tutors',
  h1: 'Free ESL conversation lessons for adults (no sign-up): what’s inside and how to teach them',
  byline: freeGuidesByline,
  intro: [
    'I have taught English since 2015, and I built a free library of ready-to-teach conversation lessons because I was tired of rebuilding the same lesson every evening. This guide says what is in it, how I teach from it, and what it does not do.',
  ],
  verdict: {
    heading: 'The short answer',
    text: `**The free library is at [planwiseesl.com/esl-lessons](/esl-lessons).** It has 200+ complete conversation lessons for teenage and adult students, in six levels from A1 to C2. You do not need an account, a card or an email address: open a lesson and teach from it. Each lesson has five key words, a reading text at the level, comprehension questions, practice exercises, discussion questions and speaking patterns. They suit one-to-one and small-group lessons, online or in person.`,
  },
  sections: [
    {
      heading: 'What is in each lesson',
      bullets: [
        '**Five key words** (plus a few phrases at higher levels), each with pronunciation, a definition in simpler words, examples, word families and a picture.',
        '**A reading text** pitched at the level, with the five words used in context.',
        '**Comprehension questions and practice:** a quiz, sentence frames, gap-fill and sentence unscramble.',
        '**Discussion questions** that move the topic into the student’s own life.',
        '**A full-screen teaching view** for screen-sharing, and a printable Vocabulary Review PDF to send afterwards.',
      ],
    },
    {
      heading: 'How to find the right level and theme',
      paragraphs: [
        'You can browse by level ([A1](/esl-lessons/a1), [A2](/esl-lessons/a2), [B1](/esl-lessons/b1), [B2](/esl-lessons/b2), [C1](/esl-lessons/c1), [C2](/esl-lessons/c2)) or by theme, such as [work](/esl-lessons/topics/work), [travel](/esl-lessons/topics/travel) and [health](/esl-lessons/topics/health). If you are not sure of a new student’s level, my [guide to CEFR levels](/guides/cefr-levels-explained) shows how to tell in a few minutes.',
      ],
    },
    {
      heading: 'How to teach one: 30 or 60 minutes',
      paragraphs: [
        'Every lesson follows the same six stages, so once you have taught one, you can teach them all without preparing. These are the timings I use:',
      ],
      table: {
        headers: ['Stage', '30-minute class', '60-minute class'],
        rows: [
          ['1. Warm-up questions', '3–4 min', '5–7 min'],
          ['2. Pre-teach the five words', '5–6 min', '8–10 min'],
          ['3. Reading and comprehension check', '6–7 min', '10–12 min'],
          ['4. Recall and practice exercises', '5–6 min', '10–12 min'],
          ['5. Discussion', '8–10 min', '15–20 min'],
          ['6. Recap and PDF', '1–2 min', '2–3 min'],
        ],
      },
    },
    {
      heading: 'Protect the discussion',
      paragraphs: [
        'Read the lesson through once before class so you know where the discussion goes. Then protect the discussion: it is the part where the student actually practises speaking, and the part that gets squeezed when a class runs late. For a fuller plan, see [the 30-minute lesson guide](/guides/30-minute-online-esl-conversation-lesson) and [how to plan a conversation lesson](/guides/how-to-plan-an-esl-conversation-lesson).',
      ],
    },
    {
      heading: 'Lessons I would start with',
      paragraphs: ['A spread across the levels, all free and all open without logging in:'],
      bullets: [
        '[First Day at a New Job (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team): for a beginner who has just started work in English.',
        '[Tell Me About Yourself (A2)](/esl-lessons/a2/tell-me-about-yourself-job-interviews): for a student preparing for job interviews.',
        '[Remote Work vs. Working in an Office (B1)](/esl-lessons/b1/remote-work-vs-working-in-an-office): for almost any working adult, because everyone has an opinion.',
        '[Saving Money vs. Enjoying Life Today (B1)](/esl-lessons/b1/saving-money-vs-enjoying-life-today): for a student who likes a friendly debate.',
        '[Code Review Feedback (B2)](/esl-lessons/b2/code-review-feedback-say-it-well-take-it-well): for software engineers.',
        '[Presenting Monthly Results (B2)](/esl-lessons/b2/talking-money-presenting-monthly-results): for finance and business students.',
        '[Leading High-Stakes Client Meetings (C1)](/esl-lessons/c1/leading-high-stakes-client-meetings-in-english): for managers who work with international clients.',
        '[Balancing Clinical Efficiency with Compassionate Patient Care (C1)](/esl-lessons/c1/balancing-clinical-efficiency-with-compassionate-patient-care): for doctors and nurses.',
      ],
    },
    {
      heading: 'What the free lessons do not do',
      bullets: [
        '**There is no audio.** The reading is text; you read it aloud or let the student read it.',
        '**Everyone gets the same lesson.** A free lesson is written once for a level and a topic, not for your student. It does not know their job, their goal or the words they already know.',
        '**They do not replace you.** The lesson gives structure; the conversation, the feedback and the adjustments are yours.',
        '**The library is finite.** If a student wants a topic that is not there, you adapt the nearest lesson, or make a new one.',
      ],
    },
    {
      heading: 'A lesson for one student',
      paragraphs: [
        `Making a lesson for one student, with their level, interests and known words, is what the paid plan does: ${priceText} after a ${trialText} with no card, and a finished lesson in ${generationTime}. You can see [how it works](/how-it-works), but the free library stays free either way.`,
      ],
    },
  ],
  faq: [
    {
      question: 'Where can I find free ESL conversation lessons for adults with no sign-up?',
      answer: 'PlanWise ESL has a free library of 200+ complete conversation lessons for adults and teenagers at planwiseesl.com/esl-lessons, from A1 to C2. You can open any lesson, screen-share it and print the Vocabulary Review PDF without making an account.',
    },
    {
      question: 'What is in a free PlanWise ESL conversation lesson?',
      answer: 'Five key words with pronunciation, simple definitions and examples, a reading text at the level, comprehension questions, practice exercises, discussion questions and speaking patterns, plus a full-screen teaching view and a printable review sheet.',
    },
    {
      question: 'Do the free lessons have audio?',
      answer: 'No. The reading is text only, so the teacher reads it aloud or the student reads it themselves.',
    },
    {
      question: 'Can I use the free lessons on Preply, italki or Zoom?',
      answer: 'Yes. Each lesson has a clean full-screen view that works well when you share your screen in a video lesson.',
    },
    {
      question: 'How long does one free lesson take to teach?',
      answer: 'About 60 minutes at the full timings, or 30 minutes if you shorten each stage: about 3–4 minutes of warm-up, 5–6 on the words, 6–7 on the reading, 5–6 on practice, 8–10 on discussion and 1–2 on the recap.',
    },
  ],
  cta: {
    heading: 'Start with a free lesson',
    text: `Browse the whole free library, no login needed. Want a lesson written for one student? The ${trialText} needs no credit card.`,
    label: 'Browse Free Lessons',
    href: '/esl-lessons',
  },
  schemaType: 'Article',
  updated: freeGuidesPublished,
};

export const freeB1LessonsGuide: MarketingPage = {
  path: '/guides/free-b1-esl-conversation-lessons',
  title: 'Free B1 ESL Conversation Lessons (Intermediate, No Sign-Up)',
  description:
    'Free B1 intermediate ESL conversation lessons for adults, no login: what makes a lesson B1, and 30+ ready-to-teach lessons grouped by theme.',
  navLabel: 'Free B1 conversation lessons',
  eyebrow: 'Guide for tutors',
  h1: 'Free B1 ESL conversation lessons for adults: what makes a lesson B1, and 30+ to teach',
  byline: freeGuidesByline,
  intro: [
    'B1 is the level I teach most. Students can keep a conversation going, so lessons feel rewarding, but they are also easy to get wrong: too hard and the lesson becomes a dictionary exercise, too easy and the student is bored. Here is how I pitch B1, and the free lessons I would use.',
  ],
  verdict: {
    heading: 'The short answer',
    text: '**There are 30+ free B1 (intermediate) conversation lessons at [planwiseesl.com/esl-lessons/b1](/esl-lessons/b1), with no login.** Each has a reading of 120–180 words, five key words and a few phrases, practice exercises and discussion questions asking for opinions with reasons. They suit adult and teenage students who can talk about familiar topics and are starting to explain why.',
  },
  sections: [
    {
      heading: 'What makes a lesson B1 on this site',
      bullets: [
        '**Reading of 120–180 words.** Long enough to carry an idea, short enough to read and discuss in one lesson.',
        '**Sentences of about 10–12 words,** with linking words such as *because*, *so* and *although*, so the text models the reasons a B1 student is learning to give.',
        '**Definitions in simple words.** New words are explained with A2 words plus common B1 words, so the student does not need a second dictionary to understand the first.',
        '**Opinions with reasons.** Discussion questions ask “what do you think, and why?”, which is the B1 skill: moving from one-word answers to an opinion and a reason.',
        '**Five key words and a few phrases,** the amount a student can really use in one lesson.',
      ],
    },
    {
      heading: 'Teaching a B1 lesson',
      paragraphs: [
        'For the other levels, see [CEFR levels explained](/guides/cefr-levels-explained). To teach any of these in a 30 or 60 minute class, use [the timings in my free lessons guide](/guides/free-esl-conversation-lessons-for-adults).',
      ],
    },
    {
      heading: 'Work and careers',
      bullets: [
        '[Remote Work vs. Working in an Office](/esl-lessons/b1/remote-work-vs-working-in-an-office): a debate nearly every working adult can join.',
        '[Managing Stress and Staying Healthy at Work](/esl-lessons/b1/managing-stress-and-staying-healthy-at-work): stress, habits and advice.',
        '[Daily Stand-Up Meetings in Tech Teams](/esl-lessons/b1/daily-stand-up-meetings-in-tech-teams): for developers and project staff.',
        '[Handling Customer Complaints Calmly in English](/esl-lessons/b1/handling-customer-complaints-calmly-in-english): for customer service and hospitality.',
        '[Navigating Unspoken Cultural Rules in a New Workplace](/esl-lessons/b1/navigating-unspoken-cultural-rules-in-a-new-workplace): for students working with international colleagues.',
      ],
    },
    {
      heading: 'Job interviews',
      bullets: [
        '[Getting Ready for an English Job Interview](/esl-lessons/b1/getting-ready-for-an-english-job-interview): where to start.',
        '[Talking About Your Strengths and Weaknesses at an Interview](/esl-lessons/b1/talking-about-your-strengths-and-weaknesses-at-an-interview): the question every candidate dreads.',
        '[Explaining a Career Change or Employment Gap Clearly](/esl-lessons/b1/explaining-a-career-change-or-employment-gap-clearly): for a harder interview question.',
      ],
    },
    {
      heading: 'Everyday life, money and travel',
      bullets: [
        '[Saving Money vs. Enjoying Life Today](/esl-lessons/b1/saving-money-vs-enjoying-life-today): opinions and reasons, with plenty to argue about.',
        '[Travelling Solo vs. Travelling with Friends](/esl-lessons/b1/travelling-solo-vs-travelling-with-friends): comparing two sides.',
        '[Public Transport vs. Private Cars](/esl-lessons/b1/public-transport-vs-private-cars): a comparison topic that works for any city.',
        '[Renting a Home: Lease Contracts, Deposits, and Tenant Rights](/esl-lessons/b1/renting-a-home-lease-contracts-deposits-and-tenant-rights): useful for students moving abroad.',
        '[How Social Media Affects Real-Life Friendships](/esl-lessons/b1/how-social-media-affects-real-life-friendships): a topic most students have views on.',
      ],
    },
    {
      heading: 'Health and medicine',
      bullets: [
        '[Calming Words: Reassuring a Patient Before a Procedure](/esl-lessons/b1/calming-words-reassuring-a-patient-before-a-procedure): for nurses and doctors.',
        '[Taking a Clear Medical History in English](/esl-lessons/b1/taking-a-clear-medical-history-in-english): for healthcare staff working in English.',
      ],
    },
    {
      heading: 'Light and learning topics',
      bullets: [
        '[Mastering English: Finding Your Best Learning Method](/esl-lessons/b1/mastering-english-finding-your-best-learning-method): a good first lesson with a new student.',
        '[Rocket League: Soccer with Cars!](/esl-lessons/b1/rocket-league-soccer-with-cars): for students who like games.',
        '[Born a Genius, or Made One?](/esl-lessons/b1/born-a-genius-or-made-one): a talking point about talent and practice.',
      ],
    },
    {
      heading: 'More B1 lessons',
      paragraphs: [
        'The [full B1 list](/esl-lessons/b1) has more, including seasonal lessons such as [Family Arguments at Christmas](/esl-lessons/b1/family-arguments-at-christmas-keeping-the-peace). A free lesson is the same for every student; if you want one written for a particular student, [here is how that works](/how-it-works).',
      ],
    },
  ],
  faq: [
    {
      question: 'What does B1 mean in English?',
      answer: 'B1 is the intermediate level of the CEFR. A B1 student can keep a conversation going on familiar topics, describe experiences and plans, and give simple reasons for an opinion.',
    },
    {
      question: 'Are the free B1 lessons really free, with no sign-up?',
      answer: 'Yes. Every lesson in the PlanWise ESL library opens without an account, a card or an email address.',
    },
    {
      question: 'How long is the reading in a B1 lesson?',
      answer: 'The B1 readings are 120–180 words, with sentences of about 10–12 words, and linking words such as because, so and although.',
    },
    {
      question: 'How do I know if my student is B1?',
      answer: 'Listen in a few minutes of small talk. B1 students use connectors such as so and although, talk about experiences and plans, and give an opinion with a simple reason, but still pause to find everyday words.',
    },
    {
      question: 'Can I use the B1 lessons for a group?',
      answer: 'Yes. They suit one-to-one lessons and small groups, online or in person. Use the discussion questions in pairs or as a whole group.',
    },
  ],
  cta: {
    heading: 'Browse every free B1 lesson',
    text: `The whole B1 list is free and needs no login. For a lesson written for one student, the ${trialText} needs no credit card.`,
    label: 'See Free B1 Lessons',
    href: '/esl-lessons/b1',
  },
  schemaType: 'Article',
  updated: freeGuidesPublished,
};

export const christmasNewYearGuide: MarketingPage = {
  path: '/guides/christmas-and-new-year-esl-lessons-for-adults',
  title: 'Christmas and New Year ESL Lessons for Adults and Teens (Free)',
  description:
    'Free Christmas and New Year ESL conversation lessons for adults and teens, A1 to C2: what each covers, and how to use one for the last class before the break.',
  navLabel: 'Christmas and New Year lessons',
  eyebrow: 'Seasonal guide',
  h1: 'Christmas and New Year ESL lessons for adults and teens, free and ready to teach',
  byline: freeGuidesByline,
  intro: [
    'Most Christmas ESL material is aimed at young children: crafts, colouring, songs. My students are adults and teenagers, and they want to talk about holidays the way adults do: family, travel, work, tradition and money. These are the free lessons I use in December.',
  ],
  verdict: {
    heading: 'The short answer',
    text: '**All the free holiday lessons are on the [Holidays and Celebrations theme page](/esl-lessons/topics/holidays).** There are 12, two at each level from A1 to C2, with no login. They cover Christmas, New Year, family celebrations and how holidays differ around the world. They are conversation lessons, not craft activities, so they suit one-to-one and small-group adult and teen classes.',
  },
  sections: [
    {
      heading: 'The holiday lessons, level by level',
      table: {
        headers: ['Level', 'Lesson', 'What the conversation is about'],
        rows: [
          ['A1', '[Happy New Year Around the World](/esl-lessons/a1/happy-new-year-around-the-world-fireworks-family-visits-and-wishes)', 'Simple questions about New Year: whether you like it, what you eat and who you see.'],
          ['A1', '[Big Family Celebrations and Special Meals](/esl-lessons/a1/big-family-celebrations-and-special-meals-around-the-world)', 'Big family meals, special days and who cooks.'],
          ['A2', '[What Is Christmas? Story, Services and Giving](/esl-lessons/a2/what-is-christmas-story-services-and-giving)', 'What December means in the student’s country, and giving presents.'],
          ['A2', '[Busy Airports, Gifts and Travelling Home](/esl-lessons/a2/busy-airports-gifts-and-travelling-home-for-major-holidays)', 'Travelling to see family for big holidays, and what you take with you.'],
          ['B1', '[Family Arguments at Christmas: Keeping the Peace](/esl-lessons/b1/family-arguments-at-christmas-keeping-the-peace)', 'Big family meals, and topics that are better not discussed at dinner.'],
          ['B1', '[New Year’s Resolutions](/esl-lessons/b1/new-year-s-resolutions-why-we-make-them-and-why-most-fade-by-february)', 'Why we make resolutions, and why most fade by February.'],
          ['B2', '[When December 25 Is a Normal Workday](/esl-lessons/b2/when-december-25-is-a-normal-workday-winter-and-annual-celebrations-around-the-world)', 'What a holiday means to you, and winter celebrations in countries where Christmas is a working day.'],
          ['B2', '[Commercialisation vs. Tradition](/esl-lessons/b2/commercialisation-vs-tradition-keeping-festivals-meaningful)', 'Whether festivals are now more about shopping than meaning.'],
          ['C1', '[Navigating Multi-Cultural Workplaces During December](/esl-lessons/c1/navigating-multi-cultural-workplaces-during-december-and-holiday-seasons)', 'Working with colleagues who celebrate different things in December.'],
          ['C1', '[Carols, Cathedrals and a Noisy World](/esl-lessons/c1/carols-cathedrals-and-a-noisy-world-sacred-music-today)', 'Sacred music, memories of carols and whether Christmas is religious or commercial.'],
          ['C2', '[Calendars, Ritual and Renewal](/esl-lessons/c2/calendars-ritual-and-renewal-what-global-new-year-traditions-reveal-about-culture)', 'What global New Year traditions say about culture, and strange customs.'],
          ['C2', '[Faith, Nostalgia and Pluralism](/esl-lessons/c2/faith-nostalgia-and-pluralism-keeping-holidays-authentic-without-excluding-others)', 'Defending a childhood holiday, and keeping holidays authentic without excluding others.'],
        ],
      },
    },
    {
      heading: 'What each lesson contains',
      paragraphs: [
        'The descriptions above come from the warm-up and discussion questions in each lesson. Each one is a full lesson with five key words, a reading, practice exercises and discussion, about 60 minutes at the full timings.',
      ],
    },
    {
      heading: 'Using one as a last class before the break',
      bullets: [
        '**Pick for the mood.** A light lesson (A1–B1 New Year or family meals) suits a tired end-of-term class; the B2–C2 lessons suit students who enjoy debate.',
        '**Shorten it.** For a 30-minute class, use the timings in [my 30-minute lesson plan](/guides/30-minute-online-esl-conversation-lesson) and keep the discussion.',
        '**Ask about the student’s own holidays.** Some of these lessons start with questions such as “what holidays do you have in your country?”, which makes the new words personal.',
        '**Be careful with religion.** Not every student celebrates Christmas. The lessons that cover it do so as a topic to discuss, and the C1 and C2 lessons are about celebrating together without excluding people. Let the student lead.',
        '**Finish with resolutions.** The B1 New Year’s Resolutions lesson is a natural way to end the last class of the year, and to plan what the student wants to do in the next one.',
      ],
    },
    {
      heading: 'More free lessons, and lessons for your own student',
      paragraphs: [
        'The free library has 200+ lessons beyond the holiday set: see the [full library](/esl-lessons) and my [guide to free adult conversation lessons](/guides/free-esl-conversation-lessons-for-adults). These lessons are the same for every student. If you want a seasonal lesson written for one student, [see how it works](/how-it-works).',
      ],
    },
  ],
  faq: [
    {
      question: 'Are there free Christmas ESL lessons for adults?',
      answer: 'Yes. PlanWise ESL has 12 free holiday lessons for adults and teens, two at each level from A1 to C2, on the Holidays and Celebrations theme page at planwiseesl.com/esl-lessons/topics/holidays. No login is needed.',
    },
    {
      question: 'Are these lessons only about Christmas?',
      answer: 'No. They cover Christmas, New Year, family celebrations, holiday travel and how people celebrate around the world, and some are about working in December rather than the holiday itself.',
    },
    {
      question: 'Are the lessons suitable for children?',
      answer: 'No. They are written for adults and teenagers, with discussion questions about family, work, money and tradition. There are no crafts or colouring activities.',
    },
    {
      question: 'What if my student does not celebrate Christmas?',
      answer: 'Choose a New Year, family-celebration or travel lesson instead, or one of the lessons about how people celebrate in different countries. Ask the student what they celebrate and let that guide the choice.',
    },
    {
      question: 'Can I teach one in 30 minutes?',
      answer: 'Yes. Shorten each stage and keep the discussion: roughly 3–4 minutes of warm-up, 5–6 on the words, 6–7 on the reading, 5–6 on practice, 8–10 on discussion and 1–2 on a recap.',
    },
  ],
  cta: {
    heading: 'See all the holiday lessons',
    text: 'All 12 are free, with no login. For a seasonal lesson written for one student, the 14-day free trial needs no credit card.',
    label: 'See Holiday Lessons',
    href: '/esl-lessons/topics/holidays',
  },
  schemaType: 'Article',
  updated: freeGuidesPublished,
};

export const thirtyMinuteLessonGuide: MarketingPage = {
  path: '/guides/30-minute-online-esl-conversation-lesson',
  title: 'How to Teach a 30-Minute Online ESL Conversation Lesson',
  description:
    'A minute-by-minute plan for a 30-minute online ESL conversation lesson, what to skip when time is short, screen-sharing tips, and six free lessons that fit.',
  navLabel: '30-minute lesson plan',
  eyebrow: 'Guide for tutors',
  h1: 'How to teach a 30-minute online ESL conversation lesson (with free lessons that fit)',
  byline: freeGuidesByline,
  intro: [
    'Thirty-minute lessons are common on Preply, italki and other platforms, and they are hard: if you try to teach a 60-minute lesson in half the time, the student barely speaks. Here is the plan I use, and the free lessons that fit it.',
  ],
  verdict: {
    heading: 'The short answer',
    text: '**Warm-up 3–4 min, five words 5–6 min, reading and check 6–7 min, one practice exercise 4–5 min, discussion 8–10 min, recap 1–2 min.** Keep the discussion, cut the extra exercises, and the student still speaks for about a third of the lesson. Every free lesson at [planwiseesl.com/esl-lessons](/esl-lessons) follows these stages, with no login.',
  },
  sections: [
    {
      heading: 'The 30-minute plan, minute by minute',
      table: {
        headers: ['Minutes', 'Stage', 'What to do'],
        rows: [
          ['0–4', 'Warm-up', 'Ask the opening questions before showing any new words, so the student switches on words they already know.'],
          ['4–10', 'Five words', 'For each word: say it, give the simple definition, read the example, ask the student to make their own sentence.'],
          ['10–17', 'Reading and check', 'Read the text together, then ask the comprehension questions. Look for the five words in the text.'],
          ['17–22', 'One practice exercise', 'Choose the quiz, gap-fill or sentence frames, whichever suits the student. Do one, not all.'],
          ['22–29', 'Discussion', 'The point of the lesson. Ask the discussion questions, follow up and let the student talk.'],
          ['29–30', 'Recap', 'Name two phrases the student used well, and send the review PDF in the chat.'],
        ],
      },
    },
    {
      heading: 'What to skip when you are short of time',
      bullets: [
        '**Extra practice exercises.** One is enough. The others can be homework from the printable review sheet.',
        '**Reading aloud, if the student is confident.** Let them read silently while you set up the discussion.',
        '**Word detail.** Pronunciation, a definition and one example are enough. Word families and usage notes can wait.',
        '**Never skip the discussion.** It is where the student uses the words, and if it keeps being squeezed, they will not remember them.',
      ],
    },
    {
      heading: 'Screen-sharing tips for Preply, italki and Zoom',
      bullets: [
        '**Use the full-screen teaching view** that opens with every free lesson. It is clean and large enough to read on a small laptop.',
        '**Share the lesson tab, not your whole screen,** so the student does not see your other windows or notifications.',
        '**Open the lesson before the class starts,** and check you can see the student on the same screen. A 30-minute lesson has no room for loading time.',
        '**Send the review PDF in the chat** at the end, rather than emailing it afterwards.',
        '**Ask the student to talk, not just look.** If the screen is busy, close the tab for the discussion and just talk.',
      ],
    },
    {
      heading: 'Six free lessons that work well in 30 minutes',
      paragraphs: [
        'These are everyday topics, so most students have something to say about them from the first question:',
      ],
      bullets: [
        '[Ordering Food and Coffee at a Cafe (A1)](/esl-lessons/a1/ordering-food-and-coffee-at-a-cafe): a practical topic for a beginner.',
        '[Making Small Talk with New People (A2)](/esl-lessons/a2/making-small-talk-with-new-people): the student can use it the next day.',
        '[Remote Work vs. Working in an Office (B1)](/esl-lessons/b1/remote-work-vs-working-in-an-office): everyone has an opinion.',
        '[Public Transport vs. Private Cars (B1)](/esl-lessons/b1/public-transport-vs-private-cars): easy to relate to any city.',
        '[Small Talk That Goes Somewhere (B2)](/esl-lessons/b2/small-talk-that-goes-somewhere-moving-beyond-how-are-you): for students who want fluency in conversation.',
        '[Diplomatic English: How to Disagree Politely (B2)](/esl-lessons/b2/diplomatic-english-how-to-disagree-politely): useful, and starts a discussion fast.',
      ],
    },
    {
      heading: 'More lessons and longer classes',
      paragraphs: [
        'For more, browse the [free library by level](/esl-lessons). For 60-minute classes, use [the full timings](/guides/how-to-plan-an-esl-conversation-lesson).',
      ],
    },
    {
      heading: 'If you want it written for your student',
      paragraphs: [
        `The free lessons are the same for every student. If you want a 30-minute lesson written for one student's level and interests, ${brand} does that on the paid plan, which is ${priceText} after a ${trialText} with no card: [how it works](/how-it-works).`,
      ],
    },
  ],
  faq: [
    {
      question: 'How do you plan a 30-minute ESL conversation lesson?',
      answer: 'Use six stages: a 3–4 minute warm-up, 5–6 minutes on five key words, 6–7 minutes on a reading and check, 4–5 minutes on one practice exercise, 8–10 minutes of discussion and a 1–2 minute recap.',
    },
    {
      question: 'How many new words can you teach in 30 minutes?',
      answer: 'Five. More than that leaves too little time for the student to use the words in the discussion.',
    },
    {
      question: 'What should I cut from a lesson if time is short?',
      answer: 'Extra practice exercises first, then word detail such as word families and usage notes. Keep the warm-up and the discussion.',
    },
    {
      question: 'Can I use free lessons on Preply or italki?',
      answer: 'Yes. The free PlanWise ESL lessons need no login and have a full-screen view for sharing your screen in a video lesson.',
    },
    {
      question: 'How much of a 30-minute lesson should the student speak?',
      answer: 'As much as you can manage. With this plan, the discussion gives them 8–10 minutes of focused speaking, and the warm-up and practice add more.',
    },
  ],
  cta: {
    heading: 'Try a free lesson in your next class',
    text: 'Pick a lesson from the free library and teach it with this plan. No login needed.',
    label: 'Browse Free Lessons',
    href: '/esl-lessons',
  },
  schemaType: 'Article',
  updated: freeGuidesPublished,
};

export const englishAsAHobbyGuide: MarketingPage = {
  path: '/guides/esl-lessons-for-adults-learning-english-as-a-hobby',
  title: 'ESL Lessons for Adults Learning English as a Hobby | PlanWise',
  description:
    'Adults who learn English for pleasure need variety, their own interests and lots of speaking. What to teach, how to run the class, and free lessons that fit.',
  navLabel: 'English as a hobby',
  eyebrow: 'Guide for tutors',
  h1: 'ESL lessons for adults learning English as a hobby: what they need, and free lessons that fit',
  byline: freeGuidesByline,
  intro: [
    'I have taught English one-to-one since 2015, and I built PlanWise because I was tired of rebuilding lessons by hand. I now teach private students online, and some of my longest-staying students are adults who learn English purely because they enjoy it. This guide is about how to teach them well.',
  ],
  verdict: {
    heading: 'The short answer',
    text: '**Adults who learn English for pleasure need variety, topics from their own interests, lots of speaking, gentle correction and no exam pressure.** Travel, films, books, talking to people and keeping the mind active are the usual reasons. The [free library](/esl-lessons) has complete lessons on everyday and leisure topics that suit them, with no login. A lesson built around the student’s own hobby is what the paid plan does.',
  },
  sections: [
    {
      heading: 'Who learns English as a hobby',
      paragraphs: [
        'They are adults, often 40 or older, retired or settled in their work, in countries such as Japan, Korea, Taiwan, Spain, Italy, Brazil and the Gulf. They learn for travel, for films and series, for books and music, to talk to people, to speak with family abroad, or to keep the mind active.',
        'They book one-to-one conversation tutors, they stay for years, and they are the most loyal students a tutor has. They are not trying to pass anything. They come because the lesson is something they look forward to.',
      ],
    },
    {
      heading: 'What they need that exam students do not',
      bullets: [
        '**Topics from their own life and interests.** A student who loves cooking will talk for twenty minutes about food and for two about the economy.',
        '**Variety from week to week.** The same shape of lesson is fine, but the subject should change.',
        '**Speaking for most of the lesson.** Most did years of textbook English at school. What they lack is someone to talk to.',
        '**Gentle correction.** Note two or three things that matter, not every error, and return to them at the end.',
        '**No homework pressure.** Offer an optional review sheet, and never make the student feel behind.',
        '**A sense of progress without a test.** New words they actually use again in a later lesson are the best evidence.',
      ],
    },
    {
      heading: 'How to run a relaxed 30- or 60-minute class',
      paragraphs: [
        'Keep the same six stages: warm-up, five words, reading, one practice exercise, discussion and recap. Then give the discussion more room, and let the student lead it towards their own life. If a story about their garden or their last holiday is more interesting than question four, follow the story.',
        'For timings, see [the 30-minute lesson guide](/guides/30-minute-online-esl-conversation-lesson) and [how to plan a conversation lesson](/guides/how-to-plan-an-esl-conversation-lesson).',
      ],
    },
    {
      heading: 'Topics that work',
      paragraphs: ['Start from what the student already enjoys. These are the interests I meet most often:'],
      table: {
        headers: ['Interest', 'Topics that get them talking', 'Level to start'],
        rows: [
          ['Cooking and food', 'Family recipes, baking, eating out, food from other countries', 'A2: simple, concrete words and strong opinions'],
          ['Football and sport', 'Favourite teams, big matches, playing versus watching', 'B1: they can give opinions and reasons'],
          ['Films, series and books', 'Favourites, endings, books versus films, recommendations', 'B1 or B2: needs room to describe and compare'],
          ['Music', 'First concerts, favourite artists, music and memory', 'A2: personal, easy to talk about'],
          ['Gardening and the outdoors', 'Plants, the seasons, walking, weather and the countryside', 'B1: plenty of descriptive vocabulary'],
          ['Photography', 'Favourite photos, places, phones versus cameras', 'B1: describing and explaining choices'],
          ['Travel and places', 'Dream trips, past holidays, solo travel, places to see', 'A2 for practical travel, B2 for opinions and stories'],
          ['Games and puzzles', 'Video games, board games, crosswords, why we play', 'A2: short, lively and easy to start'],
        ],
      },
    },
    {
      heading: 'Nine free lessons on hobbies, A2 to B2',
      paragraphs: [
        'I made these for this guide, on the interests above, and checked every one before it went into the library. Each has the five words, a reading, a vocabulary check, practice exercises, discussion questions and a quiz, and opens without a login.',
      ],
      bullets: [
        '[Cooking at Home: My Favourite Meal (A2)](/esl-lessons/a2/cooking-at-home-my-favourite-meal): chop, boil, stir, ingredient, recipe. For a student who cooks, or wants to describe a dish.',
        '[Match Day: Watching Football with Friends (A2)](/esl-lessons/a2/match-day-watching-football-with-friends): match, cheer, score, supporter, kick off. For any football fan.',
        '[Growing Plants at Home (A2)](/esl-lessons/a2/growing-plants-at-home): sprout, soil, pot, root, indoors. For a gardener, or someone with a balcony and a few pots.',
        '[Cooking the World from Your Kitchen (B1)](/esl-lessons/b1/cooking-the-world-from-your-kitchen): substitute, experiment, tempting, worthwhile, mild. For a student who tries recipes from other countries.',
        '[Staying Fit as an Adult: Running, Cycling and the Gym (B1)](/esl-lessons/b1/staying-fit-as-an-adult-running-cycling-and-the-gym): motivation, routine, work out, fit in, progress. For runners, cyclists and gym-goers, and anyone who keeps stopping.',
        '[Board Games and Puzzles: Why Adults Still Love to Play (B1)](/esl-lessons/b1/board-games-and-puzzles-why-adults-still-love-to-play): strategy, challenge, unwind, competitive, patience. For a student with a games night or a jigsaw on the table.',
        '[Photography as a Hobby: Phones, Cameras and Pictures Worth Keeping (B2)](/esl-lessons/b2/photography-as-a-hobby-phones-cameras-and-pictures-worth-keeping): snapshot, spontaneous, composition, cluttered, timeless. For a student who takes photos, on a phone or a camera.',
        '[Learning a Musical Instrument as an Adult (B2)](/esl-lessons/b2/learning-a-musical-instrument-as-an-adult-practice-patience-and-playing-for-pleasure): disciplined, tackle, gratifying, plateau, persevere. For a student learning an instrument, or thinking about it.',
        '[Walking in Nature: Why Time Outdoors Is Good for Us (B2)](/esl-lessons/b2/walking-in-nature-why-time-outdoors-is-good-for-us): unwind, invigorating, well-being, switch off, breathtaking. For walkers and hikers.',
      ],
    },
    {
      heading: 'More free lessons that fit',
      paragraphs: [
        'Older lessons from the library that suit the same students, all free and open without logging in. You can also browse by theme: [food](/esl-lessons/topics/food), [sport](/esl-lessons/topics/sport), [travel](/esl-lessons/topics/travel) and [entertainment](/esl-lessons/topics/entertainment). Not sure of a student’s level? See my [guide to CEFR levels](/guides/cefr-levels-explained).',
      ],
      bullets: [
        '[Ordering Food and Coffee at a Cafe (A1)](/esl-lessons/a1/ordering-food-and-coffee-at-a-cafe): for a beginner who loves food and wants to use English on holiday.',
        '[Let’s Talk About Video Games (A1)](/esl-lessons/a1/let-s-talk-about-video-games): for a beginner who plays games and is happy to talk about them.',
        '[Planning a Holiday and Booking a Hotel (A2)](/esl-lessons/a2/planning-a-holiday-and-booking-a-hotel): for a student who learns English mainly to travel.',
        '[Travelling Solo vs. Travelling with Friends (B1)](/esl-lessons/b1/travelling-solo-vs-travelling-with-friends): for a student with opinions and travel stories.',
        '[The Joy of Baking (B2)](/esl-lessons/b2/the-joy-of-baking): for a student who cooks or bakes at home.',
        '[At the Movies: Talking About Films (B2)](/esl-lessons/b2/at-the-movies-talking-about-films): for a film or series fan.',
        '[Books vs. Films: Living in Other Worlds (B2)](/esl-lessons/b2/books-vs-films-living-in-other-worlds): for a reader who also watches adaptations.',
        '[Amazing Places Around the World (B2)](/esl-lessons/b2/amazing-places-around-the-world): for a student who loves geography and travel.',
      ],
    },
    {
      heading: 'Mistakes that lose these students',
      bullets: [
        '**Turning every lesson into grammar.** They came to talk, not to sit a class.',
        '**Teaching the news every week.** It is heavy, it dates quickly, and it is rarely why they learn English.',
        '**Correcting everything.** Too many corrections make a student stop speaking.',
        '**Using the same worksheet their last tutor used.** They notice, and they leave.',
        '**Forgetting what they told you last month.** Remembering their dog’s name or their trip to Lisbon is worth more than any exercise.',
      ],
    },
    {
      heading: 'Keeping a student for years',
      paragraphs: [
        'These students stay as long as the lessons stay interesting and they feel they are getting somewhere. Keep a note of what they have talked about and the words they used well, and bring old words back when they fit.',
        `On the paid plan, ${brand} keeps that list for each student. When you mark a lesson “We did this”, its words join the student’s list, later lessons avoid words they already know and reuse familiar ones where they fit, and the student gets a private page with their lessons, words and flashcards.`,
      ],
    },
    {
      heading: 'What the free lessons do not do',
      bullets: [
        '**There is no audio.** The reading is text; you read it aloud or let the student read it.',
        '**Everyone gets the same lesson.** A free lesson is written once for a level and a topic, not for your student’s own hobby.',
        '**The library is finite.** If a student wants a topic that is not there, adapt the nearest lesson or make a new one.',
        '**They do not replace you.** The lesson gives structure; the conversation, the warmth and the correction are yours.',
      ],
    },
    {
      heading: 'A lesson built around their hobby',
      paragraphs: [
        `Choose the student, the level and a topic such as “my allotment in spring” or “the Champions League final”, and a finished lesson is written for them in ${generationTime}. That is what the paid plan does: ${priceText} after a ${trialText} with no card. See [how it works](/how-it-works). The free library stays free either way.`,
      ],
    },
  ],
  faq: [
    {
      question: 'How do you teach English to adults who learn it as a hobby?',
      answer: 'Build the lesson around their interests, vary the topic each week and let them speak for most of the lesson. Correct gently, noting two or three things rather than every error, and skip exam-style pressure.',
    },
    {
      question: 'What topics work for adults learning English as a hobby?',
      answer: 'Food, sport, films and books, music, gardening, photography, travel and games all work well, because students already have opinions and stories about them. Ask what they enjoy and start there.',
    },
    {
      question: 'Do adults learning English for fun need grammar lessons?',
      answer: 'Not as the main activity. Most want to talk, so teach grammar only when it helps them say something they are trying to say, and keep it short.',
    },
    {
      question: 'Where can I find free ESL conversation lessons on hobbies and leisure topics?',
      answer: 'PlanWise ESL has a free library at planwiseesl.com/esl-lessons with complete lessons on cooking, football, gardening, fitness, board games, photography, music, walking, travel, films and books, from A1 to C2. No login is needed.',
    },
    {
      question: 'How do you keep a long-term conversation student interested?',
      answer: 'Change the topic often, remember what they told you and bring back words they have used before. Students stay when lessons feel fresh and they can see they are making progress.',
    },
  ],
  cta: {
    heading: 'Start with a free lesson',
    text: 'Pick a lesson on your student’s favourite subject from the free library, no login needed.',
    label: 'Browse Free Lessons',
    href: '/esl-lessons',
  },
  schemaType: 'Article',
  updated: freeGuidesPublished,
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
