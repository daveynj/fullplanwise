/**
 * Public, crawler-readable showcase of what students actually receive after a
 * PlanWise ESL class:
 *  1. The zero-login private learner dashboard (past lessons, next-lesson
 *     preview, cumulative word list, spaced flashcards, topic suggestions,
 *     and student-created custom lessons on any subject).
 *  2. The printable Vocabulary Review study sheet (downloaded as HTML and
 *     printed to PDF with zero login—available on every public sample lesson
 *     at /esl-lessons too), illustrated with real entries from a B2 lesson.
 *  3. How natural cross-lesson vocabulary recycling works (avoiding duplicates
 *     strictly while only weaving earlier words into future readings/questions
 *     when they fit the new topic naturally).
 */
import type { MarketingPage } from './marketing-pages';
import { siteFacts, trialText, priceText } from './site-facts';

const { brand, generationTime } = siteFacts;
const updated = '2026-11-26';
const trialCta = { label: 'Start Your Free Trial', href: '/auth?register=true' };

export const studentExperiencePage: MarketingPage = {
  path: '/student-experience',
  title: `Student Learner Dashboard & Printable Study PDF | ${brand}`,
  description:
    `What ${brand} students get after class: a zero-login learner dashboard with flashcards, custom lesson creation, and a printable Vocabulary Review PDF.`,
  navLabel: 'Student Experience',
  eyebrow: 'Beyond the live class',
  h1: 'What your students get after every PlanWise ESL lesson',
  intro: [
    'Most ESL lesson libraries and AI generators stop the moment the video call ends—leaving the student with a plain worksheet (or, in browser-locked platforms, nothing they can print at all).',
    `Every ${brand} student gets two things that turn a one-off conversation into real long-term progress: a **private zero-login learner dashboard** (with all past lessons, spaced flashcards, topic suggestions and custom lesson creation) and a **printable Vocabulary Review study sheet** (downloaded as clean HTML and printed to PDF—you can test the download button with zero login at the top of any free lesson in our [public library](/esl-lessons)).`,
  ],
  sections: [
    {
      heading: '1. The private learner dashboard (no login needed)',
      paragraphs: [
        'Share one private link with each student. There are no passwords to forget and no extra student-seat fees. On their dashboard, the student can:',
      ],
      bullets: [
        '**Review every completed lesson** in one organised history.',
        '**Preview the next planned lesson’s reading and key vocabulary** before class so they arrive confident.',
        '**Practise their cumulative vocabulary with spaced flashcards:** words they mark "Not yet" come back sooner than words they already know.',
        '**Suggest topics for upcoming classes:** teachers see the student’s ideas on their profile and turn one into a full lesson in one click.',
        '**Create custom lessons on any subject (Unlimited plan):** students generate full CEFR-levelled lessons on topics they genuinely care about—saved straight into the teacher’s library, with a per-student toggle so the teacher stays in control.',
      ],
    },
    {
      heading: '2. Inside the printable Vocabulary Review study sheet (HTML to PDF)',
      paragraphs: [
        'At the top of every lesson—including every free lesson at [/esl-lessons](/esl-lessons) with no login required—there is a one-click download for the **Vocabulary Review** study sheet. It downloads as a clean, print-ready HTML document that prints to PDF cleanly for offline study or sending in Preply, italki or email chat.',
        'Instead of a bare word-and-definition list, every target word is **color-coded by part of speech** (nouns, verbs, adjectives, adverbs) and includes eight structured learning layers. Here is a real excerpt from a B2 lesson (*Work-Life Balance: Can You Really Have It All?*):',
      ],
      table: {
        headers: ['Layer in the study PDF', 'Real B2 example: "juggle" (verb)', 'Real B2 example: "boundary" (noun)'],
        rows: [
          ['Phonetic pronunciation', '/JUG-ul/', '/BOWN-dree/'],
          ['Levelled definition', 'to manage many things at the same time', 'a limit you set to protect your time or space'],
          ['Primary example', '"She juggles a full-time job with raising two small children."', '"I set a boundary: no work emails after 7 p.m."'],
          ['Additional real-world examples (3 more)', '"It\'s hard to juggle study and a social life." / "I\'ve been juggling three projects this month." / "How do you juggle everything without going crazy?"', '"You need clear boundaries between work and home." / "She crossed a boundary by calling me at midnight." / "Setting boundaries at work made me happier."'],
          ['Word family + explanation', 'juggler, juggling — A juggler is a performer who throws objects in the air; juggling is the activity, used literally and figuratively.', 'boundaries, bound — The plural is very common; "bound" as an adjective means going somewhere, a different meaning.'],
          ['Common collocations', 'juggle work and family, juggle responsibilities, juggle competing demands', 'set a boundary, respect boundaries, blur the boundaries'],
          ['Usage notes', 'Often used with "with" or "and" to connect the things being managed. Suggests effort and skill, sometimes stress.', 'Very common in talking about work-life balance and relationships. Usually used with "set", "draw" or "respect".'],
          ['5-part Semantic Map', 'Synonyms: manage, balance, handle · Antonyms: focus on one thing, drop · Related: multitasking, busy schedule, priorities · Contexts: work, family life, studying · Associated: deadline, schedule, responsibilities', 'Synonyms: limit, line, border · Antonyms: openness, no limits · Related: personal space, rules, self-care · Contexts: work, relationships, health · Associated: respect, say no, protect'],
        ],
      },
    },
    {
      heading: '3. Natural cross-lesson vocabulary recycling (never forced)',
      paragraphs: [
        'Each time you mark a lesson "We did this", its target words join that student’s personal vocabulary record. When you generate their next lesson:',
      ],
      bullets: [
        '**No accidental repeats:** PlanWise ESL strictly excludes words the student has already learned or has planned in upcoming lessons from being pre-taught again.',
        '**Relevant, natural reuse only:** The student’s previous vocabulary is passed into lesson generation so earlier words can reappear in future readings and questions—**only when they fit the new subject naturally and relevantly**. Words are never awkwardly shoehorned into an unrelated topic just to tick a box.',
        '**Long-term recall across channels:** Between classes, the student’s flashcards and Vocabulary Review PDFs keep every word active until it reappears naturally in future classes. Inspect [our live 4-lesson student memory case study](/compare/student-memory-proof) (36 taught items, 0 duplicates) with zero login.',
      ],
    },
    {
      heading: 'Why students stay longer with teachers who use it',
      paragraphs: [
        `For [Preply and italki tutors](/for/online-tutors), [freelance teachers](/for/freelance-esl-teachers), and [small to medium language schools](/for/language-schools), student retention is everything. Giving a learner a custom lesson built around their own life, a zero-login dashboard with their full history and flashcards, and a rich color-coded Vocabulary Review PDF after every call makes your classes feel unmistakably personal—and takes **${generationTime}** to prepare on a flat **${priceText}** Unlimited plan (after a **${trialText}**, no credit card needed).`,
      ],
    },
  ],
  faq: [
    {
      question: 'Can I download and inspect a real Vocabulary Review study PDF without signing up?',
      answer: 'Yes. Open any free lesson in our public library at /esl-lessons and click the download button at the top of the page. It downloads as a print-ready HTML sheet that you can print or save directly as a PDF—no account or login required.',
    },
    {
      question: 'Do my students need to create an account to use their learner dashboard?',
      answer: 'No. Every student gets a private share link that opens their dashboard straight away—showing completed lessons, next-lesson previews, their cumulative word list, spaced flashcards, topic suggestions, and (on Unlimited) custom lesson creation.',
    },
    {
      question: 'Does PlanWise ESL force old vocabulary into unrelated lessons?',
      answer: 'No. PlanWise ESL strictly avoids re-teaching words a student already knows, and only weaves earlier vocabulary into a new reading or question when it fits the new subject naturally and relevantly.',
    },
    {
      question: 'Can students print their study sheets for offline revision?',
      answer: 'Yes. Unlike browser-locked platforms, every Vocabulary Review sheet is designed to print cleanly to PDF or paper, complete with phonetic pronunciation, 4 real-world examples per word, word families, common collocations, usage notes and 5-part semantic maps.',
    },
  ],
  cta: {
    heading: 'Inspect a real public lesson and download the study sheet',
    text: 'Open any free lesson in our public library at [/esl-lessons](/esl-lessons) to test the Vocabulary Review download with zero login—or start your 5-day free trial to make one for your own student.',
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};
