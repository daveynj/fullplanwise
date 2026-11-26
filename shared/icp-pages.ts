/**
 * Ideal Customer Profile (ICP) landing pages for the core groups PlanWise ESL
 * is built for:
 *  1. Online ESL tutors on Preply and italki (/for/online-tutors)
 *  2. Freelance and independent private ESL teachers (/for/freelance-esl-teachers)
 *  3. Small to medium language schools (/for/language-schools)
 *
 * Rendered by the same single-source system as shared/marketing-pages.ts
 * (React page + crawler-readable SSR HTML + JSON-LD + /sitemap.xml + /llms-full.txt).
 */
import type { MarketingPage } from './marketing-pages';
import { siteFacts, trialText, priceText } from './site-facts';

const { brand, generationTime } = siteFacts;
const updated = '2026-11-26';
const trialCta = { label: 'Start Your Free Trial', href: '/auth?register=true' };

export const onlineTutorsPage: MarketingPage = {
  path: '/for/online-tutors',
  title: `AI ESL Lesson Planner for Preply & italki Tutors | ${brand}`,
  description:
    `Build personalised CEFR A1–C2 ESL lessons in ${generationTime} for Preply and italki classes—with vocab memory, flashcards and study PDFs.`,
  navLabel: 'For Online Tutors',
  eyebrow: 'For Preply & italki tutors',
  h1: 'The AI ESL lesson planner built for Preply and italki tutors',
  intro: [
    `Teaching back-to-back online classes on Preply or italki leaves almost no margin for unpaid lesson prep. Built-in platform materials can feel stiff or repetitive, pre-made lesson libraries run out of topics that fit a specific student, and pasting raw prompts into ChatGPT takes 20–60 minutes of level-checking and formatting.`,
    `${brand} was built by a working online ESL tutor to solve that exact daily workflow: choose your student, pick a CEFR level (A1–C2) and any topic, and in **${generationTime}** you have a complete, ready-to-screen-share conversation lesson built on a scientific pedagogical sequence—with per-student vocabulary memory, a private learner dashboard, and a downloadable study PDF.`,
  ],
  sections: [
    {
      heading: 'Why platform materials and generic libraries hold online tutors back',
      bullets: [
        '**Unpaid trial prep and high platform commissions:** Spending 30–60 minutes preparing a Preply trial or custom lesson cuts straight into your hourly rate.',
        '**Generic topics students have seen before:** Fixed catalogues miss what a real learner actually cares about—whether that is football marketing, live-stream retail, medical interviews, or a favourite TV series.',
        '**No continuity from class to class:** When a student books their fifth or twentieth lesson with you, neither platform slides nor general chatbots remember which words you already taught them.',
        '**Clunky material sharing:** Tutors waste time converting Word files, juggling tabs, or hunting for clean homework PDFs and flashcards to send after class.',
      ],
    },
    {
      heading: 'A 2-minute workflow from trial lesson to long-term regular',
      paragraphs: [
        'Every PlanWise ESL lesson follows the same structured, [research-backed pedagogical sequence](/how-it-works) so your classes feel calm, professional and consistent—even when a student arrives with a brand-new topic:',
      ],
      bullets: [
        `**Prep in ${generationTime} (even live during class):** Type any subject and CEFR level. The lesson opens immediately for screen sharing while vocabulary and discussion illustrations load during the warm-up.`,
        '**Warm-up & deep vocabulary grounding:** Open with warm-up questions that activate prior vocabulary, then pre-teach five target words with pronunciation guides, levelled definitions, example sentences, **word families, usage notes** and pictures.',
        '**Levelled reading, recall flashcards & semantic maps:** Read a CEFR-calibrated text (~96% familiar words) with comprehension checks, then flip in-lesson **flashcards** (student recalls the meaning and builds an original sentence) and explore **synonyms, antonyms and related concepts**.',
        '**Guided practice & deep discussion:** Lock in accuracy with a quiz, **tiered sentence frames** (especially helpful for beginners and nervous speakers), fill-in-the-blanks and sentence unscramble, finishing with deep discussion questions using the target vocabulary.',
        '**One-click follow-up:** Mark the lesson "We did this" to save its words to the student’s record. Future lessons recycle those words into new readings and questions, while the student revises on their private **learner dashboard** or with the **downloadable study PDF**.',
      ],
    },
    {
      heading: 'Side by side for online platform tutors',
      table: {
        headers: ['What matters in 1-on-1 classes', 'Platform slides / static libraries', 'General chatbot (ChatGPT)', brand],
        rows: [
          ['Custom niche student topics', 'Limited to pre-made catalogue', 'Yes, with manual prompting', `Any topic in ${generationTime}—or student creates their own (Unlimited)`],
          ['CEFR A1–C2 calibration', 'Varies by library', 'Frequently drifts above level', 'Fixed CEFR rules per level, checked section by section'],
          ['Pedagogical structure', 'Often worksheet- or article-only', 'Raw text to copy and format', 'Full 8-stage sequence: vocab depth, reading, flashcards, semantic maps, exercises & deep discussion'],
          ['Per-student vocabulary memory', 'None', 'Resets every chat', 'Tracks learned words and recycles them into future readings & questions'],
          ['Between-class student review', 'Usually none or paid add-on', 'None', 'Private learner dashboard (lessons + flashcards) + downloadable study PDF'],
          ['Screen-sharing readiness', 'Mixed', 'Requires reformatting', 'Built-in full-screen teaching view'],
        ],
      },
    },
    {
      heading: 'Honest tutor math: when does a subscription pay off?',
      paragraphs: [
        `On Preply or italki, every unpaid hour you spend planning lowers your real hourly rate. ${brand} costs **${priceText}** for unlimited lessons (after a **${trialText}**, no credit card required). If you teach 20 lessons a month, that is about $1 per complete, personalised lesson—and if it saves you even 20 minutes of prep per class, you get nearly seven hours of your week back while giving students a noticeably better experience that drives renewals and 5-star reviews.`,
        'Want a practical routine for turning new students into long-term regulars? Read our guide on [how to personalise ESL lessons for one-to-one students](/guides/personalise-esl-lessons).',
      ],
    },
    {
      heading: 'Teaching a language other than English on Preply or italki?',
      paragraphs: [
        `${brand} is designed specifically for ESL and EFL English teachers. However, because lessons are AI-generated, tutors teaching another language (such as Spanish, French, German or Japanese) can write the target language in the lesson subject box and generate structured lessons in that language as well.`,
      ],
    },
  ],
  faq: [
    {
      question: 'What is the best AI ESL lesson planner for Preply and italki tutors?',
      answer: `For one-to-one online tutors, ${brand} stands out because it builds a complete CEFR-levelled (A1–C2) conversation lesson on any topic in ${generationTime}, remembers each student’s vocabulary across lessons, includes recall flashcards, synonyms/antonyms, sentence frames, fill-in-the-blanks, sentence unscramble and deep discussion, and gives every student a private learner dashboard and downloadable study PDF.`,
    },
    {
      question: 'Can I prepare a Preply or italki trial lesson in 2 minutes?',
      answer: `Yes. As soon as a new student messages you their level and interests, enter the topic and CEFR level and you have a complete, full-screen lesson ready in ${generationTime}. You can even generate a lesson live at the start of a class while chatting through introductions.`,
    },
    {
      question: 'What if a student arrives without a topic to talk about?',
      answer: 'Students can suggest topics ahead of class on their private learner dashboard—and on Unlimited they can create custom lessons themselves on any subject they want to discuss. You can also browse the free library at /esl-lessons or pick from 12 subject areas.',
    },
    {
      question: 'How do I share review materials and homework inside Preply or italki?',
      answer: 'Send your student their private learner dashboard link (no login needed) so they can review past lessons and practise flashcards anytime, or download the complete study PDF—containing all vocabulary, definitions, example sentences, word families, synonyms/antonyms and usage notes—and drop it straight into the platform chat.',
    },
    {
      question: 'Is there a free trial to test it with my own students?',
      answer: `Yes. Every new account includes a ${trialText} with unlimited lesson generation and no credit card needed, and you keep every lesson you create.`,
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by Preply or italki. Those names belong to their respective owners.',
  cta: {
    heading: 'Try it before your next online class',
    text: `Generate a real lesson for one of your current students in ${generationTime}. Your ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};

export const freelanceTeachersPage: MarketingPage = {
  path: '/for/freelance-esl-teachers',
  title: `AI ESL Lesson Planner for Freelance & Private Teachers | ${brand}`,
  description:
    `Turn niche student goals into structured CEFR A1–C2 courses: scientific pedagogy, per-student vocab recycling, learner dashboards & study PDFs.`,
  navLabel: 'For Freelance Teachers',
  eyebrow: 'For freelance & independent ESL teachers',
  h1: 'Build personalised one-to-one ESL courses without spending your weekend planning',
  intro: [
    'When private students pay directly for an independent English teacher—especially working professionals in finance, tech, healthcare, law or management—they expect lessons built around their real goals, not recycled generic worksheets or raw ChatGPT text pasted into a document.',
    `${brand} gives solo freelance teachers the preparation power of a full curriculum team: a **scientific pedagogical sequence** on any topic in **${generationTime}**, automatic **longitudinal vocabulary tracking and recycling** across weeks, a private **learner dashboard** where students practise flashcards and even create custom lessons on any subject, and a complete **downloadable study PDF** after every class.`,
  ],
  sections: [
    {
      heading: 'Real course continuity across weeks—not isolated one-off lessons',
      paragraphs: [
        'Generic lesson libraries and chatbots treat every class like day one. PlanWise ESL tracks every student’s vocabulary list so a series of lessons becomes a genuine course. Here is how a 4-lesson progression works for a real B2–C1 private student working in fashion:',
      ],
      bullets: [
        '**Lesson 1 — The Rise of Luxury Chinese Fashion Brands:** Introduces five level-appropriate target words with pronunciation, word families, usage notes, reading in context, recall flashcards, semantic maps (synonyms/antonyms), guided exercises and deep discussion. Teacher clicks "We did this" to log the words.',
        '**Lesson 2 — Swipe, Stream, Sell: Live Commerce vs Traditional Retail:** Automatically avoids re-teaching Lesson 1’s words while weaving earlier vocabulary back into the new reading and questions for spaced recall.',
        '**Lesson 3 — The "Guochao" Phenomenon Beyond Fashion:** Builds on the student’s growing lexicon; the student previews the reading and practises cumulative flashcards on their private learner dashboard beforehand.',
        '**Lesson 4 — Chinese Workplace Culture: "Quiet Quitting" vs Extreme Ambition:** The student requests or creates their own custom lesson from their dashboard (Unlimited), and receives a downloadable study PDF with all vocabulary, examples, synonyms/antonyms and usage notes.',
      ],
    },
    {
      heading: 'Scientific pedagogy instead of "AI slop"',
      paragraphs: [
        'Professional students spot unedited chatbot output immediately: meandering text, CEFR level drift, and shallow comprehension questions. Every PlanWise ESL lesson enforces a complete pedagogical formula and checks every section automatically before you see it:',
      ],
      bullets: [
        '**Warm-up vocabulary recall** to activate existing knowledge around the subject.',
        '**Deep vocabulary pre-teaching** with pronunciation guide, levelled definition, example sentences, word families, usage notes and pictures (~96% reading familiarity).',
        '**CEFR-calibrated reading & comprehension** matching strict level rules from A1 to C2.',
        '**In-lesson recall flashcards** (recall meaning + create an original sentence) paired with **semantic maps** (synonyms, antonyms, related concepts, contexts).',
        '**Guided practice:** quiz, beginner-friendly tiered sentence frames (emerging/developing/expanding), shuffled fill-in-the-blanks, and sentence unscramble.',
        '**Deep discussion** questions designed to get the student speaking deeply using the target vocabulary, plus optional idioms and phrasal verbs from A2 up.',
      ],
    },
    {
      heading: 'A professional student experience that keeps private clients renewing',
      table: {
        headers: ['Client experience', 'DIY / ChatGPT docs', 'Pre-made PDF library', brand],
        rows: [
          ['Tailored to client’s job & niche', 'High effort (30–60 min/lesson)', 'Limited to library topics', `Any subject in ${generationTime}`],
          ['Multi-week vocabulary continuity', 'Manual spreadsheets', 'None', 'Automatic tracking + spaced recycling into future readings & questions'],
          ['Between-class learner portal', 'None', 'Rare or static decks only', 'Private learner dashboard (no login): past lessons, word list, flashcards & topic ideas'],
          ['Student-created custom lessons', 'None', 'None', 'Included on Unlimited (teacher can toggle per student)'],
          ['Take-home study guide', 'Manual formatting', 'Static worksheet only', 'Downloadable study PDF with vocab, examples, word families, synonyms/antonyms & usage notes'],
        ],
      },
    },
    {
      heading: 'Built by a solo freelance teacher who uses it six days a week',
      paragraphs: [
        `PlanWise ESL was created by [Dave Jackson](/about)—an independent British ESL teacher with over 2,000 students taught since 2015 who still plans every one-to-one lesson with it. There is no enterprise bloat and no generic filler: just a flat **${priceText}** Unlimited plan (after a **${trialText}**, no credit card needed) so you keep your prep hours and your teaching standards high.`,
      ],
    },
  ],
  faq: [
    {
      question: 'How do freelance ESL teachers use AI without serving obvious "AI slop" to paying clients?',
      answer: `Instead of pasting raw chatbot output, ${brand} enforces strict CEFR A1–C2 rules, pre-teaches five illustrated words with word families and usage notes, keeps ~96% of the reading familiar, validates every exercise section by section before saving, and pairs live teaching with recall flashcards, semantic maps and deep discussion.`,
    },
    {
      question: 'How does PlanWise ESL track and recycle each student’s vocabulary across weeks?',
      answer: 'When you generate a lesson for a student, PlanWise excludes words they have already learned or have planned, and reuses previously taught words naturally in new readings and questions to aid long-term recall. Pressing "We did this" after class adds the new words to their record and flashcards.',
    },
    {
      question: 'Can my private students print lessons or study offline?',
      answer: 'Yes. Every lesson can be downloaded as a complete study PDF containing all vocabulary, definitions, example sentences, word families, synonyms, antonyms, usage notes and lesson activities—in addition to the student’s online learner dashboard.',
    },
    {
      question: 'Can private students create their own custom lessons between classes?',
      answer: 'Yes. On the Unlimited plan, students can create custom lessons on any subject at their CEFR level directly from their private dashboard. Each lesson lands in your library ready for class, and you can switch this feature on or off per student.',
    },
    {
      question: 'Can independent tutors use PlanWise ESL for languages other than English?',
      answer: `${brand} is built primarily for ESL/EFL English teaching, but because lessons are AI-generated, you can specify another target language (such as Spanish, French, German or Japanese) in the lesson topic box and generate structured lessons in that language as well.`,
    },
  ],
  cta: {
    heading: 'Plan your next private student’s course in minutes',
    text: `Test ${brand} with your toughest niche student topic. Your ${trialText} includes unlimited lessons with no credit card required.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};

export const languageSchoolsPage: MarketingPage = {
  path: '/for/language-schools',
  title: `AI ESL Lesson Planner for Small to Medium Language Schools | ${brand}`,
  description:
    `Consistent CEFR A1–C2 conversation pedagogy across every teacher, printable study PDFs, vocab tracking & student dashboards—without enterprise pricing.`,
  navLabel: 'For Language Schools',
  eyebrow: 'For small to medium language schools',
  h1: 'Consistent, research-based ESL lessons for small to medium language schools',
  intro: [
    'Running a small or medium language school means balancing two hard goals: keeping lesson quality and CEFR alignment consistent across every teacher, while delivering tailored, engaging classes for general adult learners and corporate clients—without burying your budget in enterprise software contracts or spending hours writing bespoke materials in-house.',
    `${brand} gives every teacher in your school the same **scientific pedagogical sequence** on any topic (CEFR A1–C2) in **${generationTime}**, complete with **printable study PDFs**, per-student **vocabulary tracking and recycling**, and private **learner dashboards** with flashcards and student-created custom lessons.`,
  ],
  sections: [
    {
      heading: 'Standardised teaching quality across every teacher and class',
      paragraphs: [
        'Whether a class is taught by your most experienced senior teacher or a newly onboarded tutor, every lesson follows the exact same [research-backed sequence](/how-it-works) and passes automated section-by-section quality checks before class:',
      ],
      bullets: [
        '**Warm-up vocabulary recall** to activate prior knowledge and get learners speaking immediately.',
        '**Five pre-taught target words** with pronunciation guides, CEFR-levelled definitions, example sentences, **word families, usage notes** and pictures.',
        '**CEFR-calibrated reading (~96% familiar text) & comprehension** across all six levels from A1 to C2.',
        '**Active recall flashcards & semantic maps** (synonyms, antonyms, related concepts and contexts).',
        '**Guided practice:** quiz, **tiered sentence frames** (emerging, developing and expanding—ideal for mixed-confidence small groups and beginners), fill-in-the-blanks, and sentence unscramble.',
        '**Deep discussion** using the target vocabulary, plus optional idioms and phrasal verbs from A2 up and built-in teacher notes.',
      ],
    },
    {
      heading: 'Tailored to corporate contracts, ESP cohorts and adult conversation classes',
      paragraphs: [
        'Pre-made curriculum libraries lock schools into generic topics that rarely match a corporate client’s real industry. With PlanWise ESL, teachers can generate bespoke CEFR-levelled lessons across **12 subject areas** (including business, finance, healthcare, medical, legal, technology, academic and tourism English), add custom target vocabulary lists, and build multi-week progression where earlier vocabulary is automatically recycled into future readings and questions.',
      ],
    },
    {
      heading: 'Online and in-person ready—with printable study PDFs and student portals included',
      table: {
        headers: ['What schools need', 'Rigid curriculum platforms', 'Static worksheet libraries', brand],
        rows: [
          ['Printable handouts & offline study', 'Often browser-only (no printing)', 'Static worksheets only', 'Full downloadable study PDF (vocab, examples, word families, synonyms/antonyms, usage notes & activities)'],
          ['Custom industry & corporate topics', 'Fixed curriculum only', 'Limited to catalogue', `Any topic or custom word list in ${generationTime}`],
          ['Consistent CEFR A1–C2 pedagogy', 'High, but inflexible', 'Varies by worksheet', 'Fixed CEFR rules + same 8-stage research sequence every time'],
          ['Student self-study portal', 'Often expensive add-on or per-seat cap', 'Rare or static decks', 'Private learner dashboard per student (lessons, flashcards, topic ideas & custom lessons)'],
          ['Small-school affordability', 'Per-student tiers or enterprise add-ons', 'Per-teacher seats without tracking', `Starts at ${priceText}/teacher on Unlimited; simple team plans via dave@planwiseesl.com`],
        ],
      },
    },
    {
      heading: 'Simple team setup for small to medium schools',
      paragraphs: [
        `Individual teachers can start immediately with a **${trialText}** (no credit card) and upgrade to Unlimited at **${priceText}**. For small to medium language schools onboarding multiple teachers, email **[dave@planwiseesl.com](mailto:dave@planwiseesl.com)** with your teacher count and we will set up a straightforward plan—no enterprise sales maze.`,
      ],
    },
  ],
  faq: [
    {
      question: 'Is PlanWise ESL suitable for small to medium language schools?',
      answer: `Yes. ${brand} is built for one-to-one and small-group teenage and adult classes—both online and in person. It gives every teacher the same research-backed CEFR A1–C2 lesson sequence, custom industry topics, vocabulary tracking, learner dashboards and printable study PDFs.`,
    },
    {
      question: 'Can teachers print lessons and vocabulary handouts for in-person classrooms?',
      answer: 'Yes. Unlike browser-locked curriculum platforms, every PlanWise ESL lesson can be exported as a complete study PDF containing all vocabulary, definitions, example sentences, word families, synonyms, antonyms, usage notes and exercises—ready to print or email to students.',
    },
    {
      question: 'How does PlanWise ESL keep quality consistent across multiple teachers?',
      answer: 'Every lesson follows fixed CEFR rules for reading length, sentence style and definition complexity, uses the same 8-stage pedagogical sequence, and is verified section by section before it is saved—so lesson quality does not depend on how well an individual teacher writes AI prompts.',
    },
    {
      question: 'How do we get pricing for a team of teachers?',
      answer: `Individual accounts are ${priceText} on Unlimited (with a ${trialText}, no credit card). For school teams, email dave@planwiseesl.com with the number of teachers and we will arrange a plan that fits your school.`,
    },
  ],
  cta: {
    heading: 'Test PlanWise ESL with your teaching team',
    text: `Try unlimited lessons free for ${siteFacts.trialDays} days (no credit card), or email dave@planwiseesl.com for a small-to-medium school setup.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};

export const icpPages: MarketingPage[] = [onlineTutorsPage, freelanceTeachersPage, languageSchoolsPage];
