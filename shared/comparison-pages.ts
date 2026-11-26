/**
 * Fair, structured competitor comparison pages for PlanWise ESL:
 *  - /compare (decision hub covering pre-made libraries, AI worksheet tools & chatbots)
 *  - /compare/twee
 *  - /compare/esl-brains
 *  - /compare/fluentize
 *  - /compare/linguahouse
 *  - /compare/off2class
 * (Plus /compare/chatgpt in shared/marketing-pages.ts.)
 *
 * Rendered by the same single-source system as shared/marketing-pages.ts
 * (React page + crawler-readable SSR HTML + JSON-LD + /sitemap.xml + /llms-full.txt).
 */
import type { MarketingPage } from './marketing-pages';
import { siteFacts, trialText, priceText } from './site-facts';

const { brand, generationTime } = siteFacts;
const updated = '2026-11-26';
const trialCta = { label: 'Start Your Free Trial', href: '/auth?register=true' };

export const compareHubPage: MarketingPage = {
  path: '/compare',
  title: `Compare ${brand} vs ESL Lesson Libraries & AI Tools`,
  description:
    `Honest comparisons of ${brand} vs Twee, ESL Brains, Fluentize, Linguahouse, Off2Class & ChatGPT: pedagogy, CEFR, vocab memory, study PDFs & price.`,
  navLabel: 'Compare',
  eyebrow: 'Comparisons',
  h1: 'PlanWise ESL vs. pre-made ESL lesson libraries and AI tools',
  intro: [
    'Most ESL teaching tools fall into three camps: **static pre-made lesson libraries** (like ESL Brains, Fluentize, Linguahouse, Off2Class and Ellii), **modular AI worksheet generators or US K–12 apps** (like Twee, MagicSchool and Diffit), and **general chatbots** (like ChatGPT).',
    'Each has genuine strengths—and clear trade-offs for one-to-one tutors and small to medium language schools. Here is an honest, side-by-side decision guide with live zero-login proof links so you can inspect the actual lessons yourself.',
  ],
  sections: [
    {
      heading: 'How the four approaches compare',
      table: {
        headers: ['What you need', 'Pre-made ESL libraries', 'AI worksheet / K–12 tools', 'General chatbots', brand],
        rows: [
          ['Custom lesson on any niche student topic', 'No — fixed catalogue only', 'Activity by activity, assembled manually', 'Yes, with heavy prompting & editing', `Yes — complete lesson in ${generationTime} (inspect [C1 Business Ethics](/lessons/1731) or [all free lessons](/esl-lessons))`],
          ['Full scientific pedagogical sequence', 'Varies by publisher', 'Single isolated tasks; US K–12 apps lack ELT flow', 'No — unformatted text unless prompted step by step', 'Yes — 8-stage sequence: warm-up recall, rich vocab, reading, recall flashcards, semantic maps, exercises & deep discussion ([how it works](/how-it-works))'],
          ['CEFR A1–C2 calibration', 'Usually good inside fixed catalogue (often B1–C1 focused)', 'Mixed (e.g. Diffit uses US grades K2–K11+)', 'Frequently drifts above target level', 'Fixed CEFR A1–C2 rules, verified section by section (see [A1 Beginner](/lessons/1774) vs. [B2](/lessons/1768) & [C1](/lessons/1750))'],
          ['Per-student vocabulary tracking & recycling', 'None (or static decks only)', 'None', 'None — resets every chat', 'Tracks learned words, avoids duplicates & recycles earlier words naturally into future readings & questions'],
          ['Printable student study PDF', 'Static PDF (Off2Class has no printing)', 'Export varies; often single worksheets', 'Manual copy & format', 'Color-coded Vocabulary Review study PDF with pronunciation, 4 examples, word families, collocations, usage notes & 5-part semantic maps ([see PDF proof](/student-experience))'],
          ['Private learner dashboard', 'Rare, per-seat capped, or expensive add-on', 'Usually none or temporary links', 'None', 'Included per student (no login): past lessons, spaced flashcards, topic ideas & custom lessons ([preview dashboard](/student-experience))'],
        ],
      },
    },
    {
      heading: 'Detailed head-to-head comparisons',
      bullets: [
        '[PlanWise ESL vs. Twee](/compare/twee) — Modular single-task AI tools vs. one cohesive, quality-checked pedagogical lesson with student vocabulary memory.',
        '[PlanWise ESL vs. ESL Brains](/compare/esl-brains) — Fixed adult video-lesson catalogue vs. unlimited custom student topics, vocabulary recycling and learner dashboards.',
        '[PlanWise ESL vs. Fluentize](/compare/fluentize) — Static 700+ YouTube video lesson library vs. unlimited custom A1–C2 lessons, zero link rot, natural vocabulary recycling and learner dashboards.',
        '[PlanWise ESL vs. Linguahouse](/compare/linguahouse) — Large static worksheet library + static Expemo decks vs. bespoke lessons that dynamically recycle each student’s vocabulary.',
        '[PlanWise ESL vs. Off2Class](/compare/off2class) — Browser-locked sequential curriculum (no printing) vs. flexible conversation lessons with printable study PDFs and unlimited students.',
        '[PlanWise ESL vs. ChatGPT](/compare/chatgpt) — Prompting a general chatbot from scratch vs. enforced CEFR rules, verified exercises, student memory and learner dashboards.',
        '[Same-Topic CEFR Quality Benchmark](/compare/cefr-benchmark) — A concrete side-by-side audit of a raw AI prompt, a generic ESL worksheet, and a real PlanWise ESL B2 lesson on Work-Life Balance.',
      ],
    },
    {
      heading: 'Which tool fits your teaching style?',
      bullets: [
        '**Choose a pre-made video library (ESL Brains, Fluentize)** if you prefer teaching curated YouTube/video topics from a fixed catalogue and do not need per-student vocabulary memory or niche custom topics.',
        '**Choose a fixed placement curriculum (Off2Class)** if you specifically need an adaptive placement exam and a step-by-step browser-only grammar track.',
        '**Choose a modular AI tool or chatbot (Twee, ChatGPT)** if you mainly want standalone worksheets, quick media transcripts, or one-off classroom tweaks.',
        `**Choose ${brand}** if you teach regular one-to-one or small-group students ([online platform tutors](/for/online-tutors), [freelance teachers](/for/freelance-esl-teachers) or [small to medium language schools](/for/language-schools)) and want complete, scientifically structured CEFR A1–C2 lessons on any topic, longitudinal vocabulary recycling, printable Vocabulary Review study PDFs, and private learner dashboards.`,
      ],
    },
    {
      heading: 'Built by a working ESL teacher — verify the quality with zero login',
      paragraphs: [
        'Most big ESL platforms hide full lessons behind a paywall and ask you to trust their marketing claims. PlanWise ESL was built by a working British ESL teacher (11 years teaching, 2,000+ students) who uses these lessons in real classes every week. Click any live example below with **no login required**:',
      ],
      bullets: [
        '**A1 Beginner proof:** [Let’s Talk About Video Games! (A1)](/lessons/1774) — or browse all [A1 Beginner lessons](/esl-lessons/a1).',
        '**B2 Upper-Intermediate proof:** [Can Money Buy Happiness? (B2)](/lessons/1768) and [AI and Tomorrow’s World (B2)](/lessons/1801).',
        '**C1 Business & Career proof:** [The Price of Doing Right: Ethics in the Boardroom (C1)](/lessons/1731) and [Founders, Failures and Pivots (C1)](/lessons/1750).',
        '**Study PDF & Learner Dashboard proof:** [Student Experience & Vocabulary Review PDF excerpt](/student-experience), our [9-point CEFR Quality Benchmark](/compare/cefr-benchmark), and the full [free A1–C2 public library](/esl-lessons).',
      ],
    },
  ],
  faq: [
    {
      question: 'What is the main difference between PlanWise ESL and big pre-made ESL libraries?',
      answer: `Pre-made libraries give every student lessons from the same fixed catalogue and do not remember what an individual learner already knows. ${brand} builds a complete, research-backed CEFR A1–C2 lesson on any subject in ${generationTime}, tracks and recycles each student’s vocabulary across future lessons, includes a downloadable Vocabulary Review study PDF, and gives students a private learner dashboard where they can practise flashcards and create custom lessons.`,
    },
    {
      question: 'Why not use a US K–12 AI tool like MagicSchool or Diffit for ESL conversation classes?',
      answer: 'US K–12 AI platforms are built around school admin and US grade levels (such as K2–K11+) rather than CEFR A1–C2 adult and teen conversation pedagogy. They do not track per-student ESL vocabulary across weeks or deliver a unified speaking sequence with recall flashcards, semantic maps, collocations and tiered sentence frames.',
    },
    {
      question: 'Can I compare PlanWise ESL on my own students before paying?',
      answer: `Yes. Every new account gets a ${trialText} with unlimited lesson generation and no credit card needed, so you can compare it side by side with whatever you use today.`,
    },
  ],
  cta: {
    heading: 'Compare PlanWise ESL on a real lesson',
    text: `Generate a full lesson on your student’s exact topic in ${generationTime}. Your ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};

export const compareTweePage: MarketingPage = {
  path: '/compare/twee',
  title: `${brand} vs Twee for ESL Lesson Planning`,
  description:
    `Honest comparison of ${brand} and Twee: isolated AI tools assembled by hand vs. one complete pedagogical lesson, student vocab memory & study PDFs.`,
  navLabel: 'PlanWise vs Twee',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. Twee for ESL lesson planning',
  intro: [
    'Twee is one of the best-known AI toolkits built specifically for English teachers. Both Twee and PlanWise ESL are CEFR-aware and designed for ELT—not US K–12 classrooms—but they solve the job in two very different ways.',
    'Twee gives you **individual modular AI tools** (reading generator, question generator, YouTube transcript tools, CEFR checker) that you stitch together yourself. PlanWise ESL builds **one complete, quality-checked pedagogical lesson** in 1–2 minutes—and remembers every student’s vocabulary across weeks.',
  ],
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. Twee',
      table: {
        headers: ['', 'Twee', brand],
        rows: [
          ['Core approach', 'Modular single-task AI tools that you run separately and assemble into a lesson', 'One cohesive 8-stage scientific pedagogical lesson generated in a single pass'],
          ['What is inside one lesson', 'Depends on which tools you combine (readings, questions, media transcripts, vocab tasks)', 'Warm-up recall, 5 pre-taught words (pronunciation, word families, collocations, usage notes, pictures), levelled reading, comprehension, recall flashcards, 5-part semantic maps, quiz, tiered sentence frames, fill-in-the-blanks, sentence unscramble & deep discussion'],
          ['Per-student vocabulary memory', 'None — does not track what each learner has already studied across classes', 'Tracks learned words per student, avoids repeats and recycles earlier vocabulary into future readings & questions'],
          ['Student-facing portal', 'Shareable interactive activity links per task', 'Persistent private learner dashboard (no login): all past lessons, cumulative word list, spaced flashcards, topic suggestions & student-created custom lessons (Unlimited)'],
          ['Printable student review', 'Export to PDF/Docs/Forms on paid plans', 'Complete printable Vocabulary Review study PDF (color-coded by part of speech, 4 examples per word, word families, common collocations, usage notes & semantic map)'],
          ['Quality checking', 'Teacher reviews each generated module manually', 'Automated section-by-section verification and repair before saving'],
          ['Free trial', 'Restricted free trial (5 runs)', `${trialText} with unlimited lesson generations, no credit card`],
          ['Individual paid pricing', 'Tiered paid plans (check twee.com/price for current rates)', `${priceText} Unlimited, cancel anytime`],
        ],
      },
    },
    {
      heading: 'When Twee is the better choice',
      bullets: [
        'You specifically want to extract transcripts and build standalone comprehension tasks directly from a YouTube video or audio clip.',
        'You enjoy mixing and matching individual worksheet generators to assemble your own custom handouts from scratch.',
        'You teach one-off classroom exercises and do not need longitudinal per-student vocabulary tracking.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You want a complete, ready-to-screen-share conversation lesson in 1–2 minutes without stitching five separate tool outputs together.',
        'You teach regular one-to-one or small-group students on [Cambly, Preply or italki](/for/online-tutors), [privately](/for/freelance-esl-teachers), or at a [language school](/for/language-schools) and want each lesson to build on the words the student already learned.',
        'You want every student to leave class with a polished Vocabulary Review study PDF (including common collocations, word families, usage notes and synonyms/antonyms) plus a private learner dashboard with flashcards.',
        'You want students to suggest topics or create their own custom lessons on any subject between classes.',
      ],
    },
    {
      heading: 'Why tutors switch from Twee to PlanWise ESL',
      bullets: [
        '**1 click instead of 6 separate tools:** Twee makes you run a reading generator, vocab generator, gap-fill generator, and discussion generator separately and stitch them together. PlanWise ESL builds all 8 connected stages in one pass.',
        '**Real student continuity:** Twee forgets your student the moment you close the tab. PlanWise ESL tracks every student’s vocabulary, avoids repeats, recycles earlier words naturally when relevant, and gives each student a zero-login [learner dashboard](/student-experience).',
        '**See a full lesson with zero signup:** Open any complete A1–C2 lesson in our [free public library](/esl-lessons) (including the downloadable color-coded Vocabulary Review PDF) or read our [CEFR Quality Benchmark](/compare/cefr-benchmark).',
      ],
    },
  ],
  faq: [
    {
      question: 'Is PlanWise ESL a good alternative to Twee?',
      answer: `Yes—especially if you want full, structured conversation lessons instead of assembling isolated worksheet modules by hand. ${brand} adds per-student vocabulary tracking and recycling, private learner dashboards with flashcards, student-created custom lessons, and a complete printable Vocabulary Review study PDF.`,
    },
    {
      question: 'Does Twee track each student’s vocabulary across lessons?',
      answer: 'Twee focuses on generating individual teaching activities and interactive task links rather than maintaining a longitudinal per-student vocabulary record that recycles earlier words into future readings. PlanWise ESL tracks learned words per student automatically.',
    },
    {
      question: 'Can I test PlanWise ESL without a 5-run cap?',
      answer: `Yes. Every new ${brand} account includes a ${trialText} with unlimited lesson generation and no credit card required.`,
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by Twee. Product features and pricing can change—check twee.com for current details.',
  cta: {
    heading: 'Try a complete lesson instead of stitching modules together',
    text: `Generate a full CEFR-levelled lesson in ${generationTime}. Your ${trialText} includes unlimited lessons with no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};

export const compareEslBrainsPage: MarketingPage = {
  path: '/compare/esl-brains',
  title: `${brand} vs ESL Brains for Adult ESL Conversation Lessons`,
  description:
    `Honest comparison of ${brand} and ESL Brains: fixed pre-made video catalogue vs. custom lessons on any niche topic, vocab recycling & learner dashboards.`,
  navLabel: 'PlanWise vs ESL Brains',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. ESL Brains for adult ESL conversation lessons',
  intro: [
    'ESL Brains has earned a strong reputation among online ESL tutors for engaging, video-based adult conversation lessons. If you want polished, human-curated lessons built around YouTube videos, it is one of the best pre-made libraries available.',
    'The limit of any pre-made library shows up when you teach regular one-to-one students week after week: heavy-volume tutors eventually exhaust the catalogue at a student’s level, niche work or hobby topics are missing, and the library has no memory of what your student already learned. That is the gap PlanWise ESL was built to close.',
  ],
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. ESL Brains',
      table: {
        headers: ['', 'ESL Brains', brand],
        rows: [
          ['Lesson source', 'Pre-made catalogue of 1,000+ video, podcast and article lessons', `Custom AI-generated lessons on any topic in ${generationTime}—plus a growing free public library`],
          ['Niche student topics', 'Only what exists in the catalogue', 'Anything your student cares about: fashion retail, football marketing, software interviews, medicine, hobbies'],
          ['Pedagogical structure', 'Curated video-led speaking and vocabulary activities (PDF & e-lesson)', 'Consistent 8-stage scientific sequence: warm-up recall, rich vocab (pronunciation, word families, collocations, usage notes, pictures), levelled reading, comprehension, recall flashcards, 5-part semantic maps, quiz, tiered sentence frames, fill-in-the-blanks, sentence unscramble & deep discussion'],
          ['Per-student vocabulary memory', 'None', 'Tracks each student’s learned words and recycles them into future readings & questions'],
          ['Student-created custom lessons', 'None', 'Students can create custom lessons on any subject at their level (Unlimited)'],
          ['Between-class learner portal', 'Screen-shareable e-lessons; no cumulative student flashcard dashboard', 'Private learner dashboard (no login): all past lessons, word list, spaced flashcards & next-lesson preview'],
          ['Take-home vocabulary study PDF', 'Lesson worksheet PDF', 'Dedicated Vocabulary Review study PDF (color-coded by part of speech, 4 examples/word, word families, collocations, usage notes & 5-part semantic map)'],
          ['Other languages', 'English only', 'Built for ESL/EFL; tutors can also specify another target language in the topic box'],
        ],
      },
    },
    {
      heading: 'When ESL Brains is the better choice',
      bullets: [
        'You specifically want lessons built around curated YouTube videos and authentic listening clips.',
        'You prefer browsing a fixed, human-edited catalogue rather than generating custom topics.',
        'You teach mostly general-interest adult classes where pre-made topics cover what you need.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You teach regular one-to-one students with specific jobs, industries or hobbies that no fixed library covers—or you teach high volume and run out of fresh catalogue lessons.',
        'You want longitudinal vocabulary tracking so earlier words return naturally in future readings and questions.',
        'You want every student to have a private learner dashboard with flashcards and the option to suggest topics or create custom lessons themselves.',
        'You want a comprehensive Vocabulary Review study PDF (word families, common collocations, usage notes and synonyms/antonyms) ready to send after every class.',
      ],
    },
    {
      heading: 'Why high-volume tutors switch from ESL Brains to PlanWise ESL',
      bullets: [
        '**Never run out of topics at your student’s level:** Fixed catalogues eventually run dry for long-term 1-on-1 students—or miss niche career, tech, medical and hobby topics altogether. PlanWise ESL generates a full 8-stage CEFR A1–C2 lesson on any topic in 1–2 minutes.',
        '**Vocabulary that actually sticks across weeks:** ESL Brains lessons are isolated one-offs. PlanWise ESL tracks learned words per student, prevents duplicates, recycles earlier vocabulary naturally when relevant, and gives learners a zero-login [student dashboard](/student-experience).',
        '**Inspect full lessons free with no login:** Browse our [public A1–C2 ESL lesson library](/esl-lessons) and download any lesson’s color-coded Vocabulary Review PDF before starting a trial.',
      ],
    },
  ],
  faq: [
    {
      question: 'What is the best alternative to ESL Brains for custom student topics?',
      answer: `${brand} is built specifically for tutors who love structured adult conversation lessons but need unlimited custom topics tailored to each student. It builds a complete CEFR A1–C2 lesson in ${generationTime}, tracks and recycles every student’s vocabulary across lessons, and includes a private learner dashboard and Vocabulary Review study PDF.`,
    },
    {
      question: 'Can I use PlanWise ESL alongside ESL Brains?',
      answer: 'Yes. Many tutors use pre-made video lessons when a catalogue topic fits, and use PlanWise ESL whenever a student wants a niche topic, custom industry vocabulary, ongoing vocabulary tracking, or a private flashcard dashboard.',
    },
    {
      question: 'Does PlanWise ESL have sample lessons I can inspect first?',
      answer: 'Yes. You can inspect complete, ready-to-teach lessons at every level in our public library at /esl-lessons, or test unlimited custom lessons during your 5-day free trial (no credit card required).',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by ESL Brains. Product features and pricing can change—check eslbrains.com for current details.',
  cta: {
    heading: 'Go beyond a fixed lesson catalogue',
    text: `Make a custom lesson on your student’s exact topic in ${generationTime}. Your ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};

export const compareLinguahousePage: MarketingPage = {
  path: '/compare/linguahouse',
  title: `${brand} vs Linguahouse for ESL Teachers & Schools`,
  description:
    `Honest comparison of ${brand} and Linguahouse: static worksheet library & fixed flashcard decks vs. custom topics, dynamic vocab recycling & study PDFs.`,
  navLabel: 'PlanWise vs Linguahouse',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. Linguahouse for ESL teachers and language schools',
  intro: [
    'Linguahouse is one of the largest established ESL worksheet libraries, offering thousands of downloadable PDFs, multimedia resources, Business English tracks, Spanish (ELE) materials, and spaced-repetition flashcards through Expemo.',
    'The key difference between Linguahouse and PlanWise ESL is **static library vs. adaptive personalisation**: Linguahouse gives you pre-written worksheets and fixed Expemo decks, whereas PlanWise ESL generates a full, scientifically structured conversation lesson on *any* topic your student wants in 1–2 minutes and dynamically recycles their learned vocabulary into future readings and questions.',
  ],
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. Linguahouse',
      table: {
        headers: ['', 'Linguahouse', brand],
        rows: [
          ['Content model', 'Large static library (5,800+ pre-made worksheets & multimedia lessons)', `On-demand custom CEFR A1–C2 lessons on any subject in ${generationTime}`],
          ['Topic freshness & personalisation', 'Fixed catalogue (some tutors find general topics dry for niche learners)', 'Built around each student’s exact job, hobbies or current interests—or created by the student (Unlimited)'],
          ['Vocabulary flashcards & recycling', 'Expemo spaced-repetition app using fixed worksheet decks', 'In-lesson recall flashcards + private learner dashboard flashcards + dynamic recycling of previous vocabulary into future readings & questions'],
          ['Vocabulary depth per lesson', 'Standard worksheet glossary & tasks', 'Pronunciation guide, levelled definition, 4 real-world examples, word family + explanation, common collocations, usage notes & 5-part semantic map (synonyms, antonyms, related concepts, contexts, associated words)'],
          ['Speaking scaffolding', 'Standard discussion questions', 'Tiered sentence frames (emerging/developing/expanding, ideal for beginners), fill-in-the-blanks, sentence unscramble, quiz & deep target-vocab discussion'],
          ['Student takeaway PDF', 'Downloadable lesson worksheet PDF', 'Dedicated Vocabulary Review study PDF + full lesson export'],
          ['Pricing currency & model', 'Teacher tiers displayed in Polish złoty (school tiers in USD)', `Transparent USD pricing: ${trialText}, then ${priceText} Unlimited (team plans for small to medium schools)`],
        ],
      },
    },
    {
      heading: 'When Linguahouse is the better choice',
      bullets: [
        'You want a massive pre-written archive of traditional printable worksheets, audio files and exam-prep courses ready to download.',
        'You specifically want a dedicated Spanish (ELE) curriculum catalogue alongside English.',
        'You prefer fixed, publisher-authored worksheets over custom topic generation.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You want every conversation lesson tailored to what your student genuinely wants to talk about—rather than picking the closest match from a static library.',
        'You want vocabulary from last week’s lesson to reappear automatically inside next week’s reading and questions, not just sit inside an isolated flashcard deck.',
        'You want students to have a zero-login learner dashboard where they can review lessons, practise flashcards, suggest topics, and create custom lessons on any subject.',
        'You want a rich, color-coded Vocabulary Review study PDF (with collocations, word families, usage notes and semantic maps) to send straight after class.',
      ],
    },
    {
      heading: 'Why 1-on-1 tutors switch from Linguahouse to PlanWise ESL',
      bullets: [
        '**Bespoke topics instead of recycled PDFs:** Students on Preply, Cambly and italki often recognise the same static Linguahouse worksheets from previous tutors—and static libraries cannot cover a student’s specific job interview, tech stack or hobby on demand.',
        '**Dynamic recycling beats isolated decks:** Instead of leaving vocabulary inside a separate Expemo deck, PlanWise ESL avoids duplicate words, weaves earlier vocabulary naturally into future readings when relevant, and gives students a zero-login [learner dashboard](/student-experience).',
        '**Open full lessons free—no paywall:** Unlike paywalled worksheet libraries, you can open complete A1–C2 lessons and download the color-coded Vocabulary Review PDF right now in our [public ESL lesson library](/esl-lessons).',
      ],
    },
  ],
  faq: [
    {
      question: 'How does PlanWise ESL’s vocabulary review compare to Linguahouse’s Expemo?',
      answer: 'Linguahouse pairs static worksheets with Expemo flashcard decks. PlanWise ESL includes zero-login learner dashboard flashcards AND dynamically tracks each student’s vocabulary so earlier words are avoided as duplicates and recycled naturally into future custom readings and questions.',
    },
    {
      question: 'Does PlanWise ESL cover Business English and professional niches like Linguahouse?',
      answer: 'Yes. PlanWise ESL supports 12 subject areas (including business, finance, healthcare, medical, legal, technology and academic English) and lets you generate bespoke lessons on any niche industry topic or custom vocabulary list in 1–2 minutes.',
    },
    {
      question: 'Can small to medium language schools use PlanWise ESL?',
      answer: 'Yes. Schools can standardise CEFR A1–C2 conversation pedagogy across teachers, print study PDFs for in-person classrooms, and email dave@planwiseesl.com for straightforward multi-teacher plans.',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by Linguahouse. Product features and pricing can change—check linguahouse.com for current details.',
  cta: {
    heading: 'Try bespoke lessons that recycle your student’s vocabulary',
    text: `Test ${brand} on any niche topic in ${generationTime}. Your ${trialText} includes unlimited lessons with no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};

export const compareOff2ClassPage: MarketingPage = {
  path: '/compare/off2class',
  title: `${brand} vs Off2Class for Online ESL Tutors & Schools`,
  description:
    `${brand} vs Off2Class: browser-only slides with no printing vs. custom conversation lessons, printable study PDFs & unlimited students.`,
  navLabel: 'PlanWise vs Off2Class',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. Off2Class for online ESL tutors and language schools',
  intro: [
    'Off2Class is a respected platform built around a structured, sequential ESL curriculum of 1,000+ browser-based slide lessons and an adaptive CEFR/WIDA placement test. If you want a step-by-step grammar syllabus with automated placement diagnostics, Off2Class does that very well.',
    'Where tutors and schools often hit friction with Off2Class is flexibility, printing and pricing scale: Off2Class slides are **browser-only (you cannot print or export PDFs)**, topics are locked to its fixed curriculum, and starter paid tiers cap the number of active students. PlanWise ESL was built for teachers who want flexible, custom conversation lessons with **printable Vocabulary Review study PDFs** and **unlimited students**.',
  ],
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. Off2Class',
      table: {
        headers: ['', 'Off2Class', brand],
        rows: [
          ['Core strength', 'Fixed sequential curriculum (1,000+ slide lessons) + Adaptive Placement Test', `Custom CEFR A1–C2 conversation lessons on any topic in ${generationTime} following an 8-stage scientific sequence`],
          ['Printable handouts & PDFs', 'No — browser-based slides cannot be printed or exported to PDF/PPTX', 'Yes — full printable Vocabulary Review study PDF (pronunciation, 4 examples/word, word families, collocations, usage notes, 5-part semantic map) + lesson export'],
          ['Niche & spontaneous topics', 'Fixed curriculum lessons only', 'Any topic or custom word list on demand—even generated live at the start of class'],
          ['Student autonomy', 'Teacher assigns fixed curriculum homework', 'Private learner dashboard (no login): past lessons, spaced flashcards, topic suggestions & student-created custom lessons on any subject (Unlimited)'],
          ['Cross-lesson vocabulary recycling', 'Tracks curriculum completion & placement gaps', 'Tracks every student’s vocabulary and recycles earlier words into future custom readings & questions'],
          ['Student limits & individual pricing', 'Paid tiers start higher (e.g. $24/mo billed annually for up to 5 students on starter paid plan; check off2class.com/pricing)', `${priceText} Unlimited lessons and students (after a ${trialText}, no credit card)`],
        ],
      },
    },
    {
      heading: 'When Off2Class is the better choice',
      bullets: [
        'You specifically need an automated CEFR/WIDA placement exam that maps students onto a fixed grammar-by-grammar remediation track.',
        'You prefer teaching a rigid, linear curriculum from slide 1 to slide 100 without choosing topics.',
        'Your students never need printable PDFs or offline vocabulary study sheets.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'Your students need printable study PDFs for offline review, in-person classes or low-tech setups.',
        'You teach adult or teen conversation classes on [Cambly, Preply or italki](/for/online-tutors), [privately](/for/freelance-esl-teachers) or at a [small to medium language school](/for/language-schools) and want engaging lessons built around each learner’s real interests.',
        'You teach more than 5 students and want flat, predictable pricing with unlimited lessons and students.',
        'You want every lesson to combine vocabulary depth (word families, collocations, usage notes), recall flashcards, semantic maps, beginner-friendly sentence frames, gap-fill, sentence unscramble and deep discussion.',
      ],
    },
    {
      heading: 'Why independent tutors switch from Off2Class to PlanWise ESL',
      bullets: [
        '**No student caps, no student logins:** Off2Class starter tiers cap active students and require student accounts. PlanWise ESL is a flat $19.99/month for unlimited lessons and unlimited students—with a zero-login [private learner dashboard](/student-experience) for every student.',
        '**Printable study PDFs instead of browser-locked slides:** Off2Class does not let you print or export lessons. Every PlanWise ESL lesson generates a clean, color-coded Vocabulary Review study PDF students can save or print.',
        '**Test a full lesson with zero signup:** Open any A1–C2 lesson in our [free public library](/esl-lessons) and download its Vocabulary Review PDF right now, or compare quality side by side on our [CEFR Quality Benchmark](/compare/cefr-benchmark).',
      ],
    },
  ],
  faq: [
    {
      question: 'Can you print lessons and vocabulary sheets in PlanWise ESL (unlike Off2Class)?',
      answer: 'Yes. Every PlanWise ESL lesson can be downloaded and printed as a study PDF—including a complete Vocabulary Review sheet with phonetic pronunciation, levelled definitions, four examples per word, word families, common collocations, usage notes and 5-part semantic maps.',
    },
    {
      question: 'Does PlanWise ESL cap how many students I can have on the Unlimited plan?',
      answer: `No. On the Unlimited plan (${priceText}), you can add your students, track each student’s vocabulary, give each one a private learner dashboard and generate unlimited lessons.`,
    },
    {
      question: 'Does PlanWise ESL have an adaptive placement test like Off2Class?',
      answer: 'No—PlanWise ESL focuses on custom CEFR A1–C2 conversation lessons, vocabulary tracking and student practice rather than formal placement testing. For a practical way to gauge a new student’s level in conversation, see our CEFR levels guide at /guides/cefr-levels-explained.',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by Off2Class. Product features and pricing can change—check off2class.com for current details.',
  cta: {
    heading: 'Flexible lessons, printable study PDFs, unlimited students',
    text: `Try ${brand} free for ${siteFacts.trialDays} days (unlimited lessons, no credit card required).`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};

export const cefrBenchmarkPage: MarketingPage = {
  path: '/compare/cefr-benchmark',
  title: `ESL Lesson Quality Benchmark: ${brand} vs Raw AI & Worksheets`,
  description:
    `Side-by-side CEFR quality audit on the same B2 topic: raw chatbot prompt vs. generic worksheet vs. a real ${brand} 8-stage lesson & study PDF.`,
  navLabel: 'CEFR Quality Benchmark',
  eyebrow: 'Quality benchmark',
  h1: 'Same topic, same CEFR level: raw AI prompt vs. generic worksheet vs. PlanWise ESL',
  byline: {
    author: siteFacts.founder,
    published: updated,
    note: 'Audited by a working British ESL teacher (11 years teaching, 2,000+ students).',
  },
  intro: [
    'Every ESL tool claims its lessons are "CEFR-aligned" and "ready to teach". The fastest way to see the real difference is to put three approaches side by side on the **exact same adult B2 conversation topic**: *Work-Life Balance: Can You Really Have It All?*',
    'Below is a concrete, criterion-by-criterion audit of what a teacher actually gets from a raw general chatbot prompt, a typical pre-made ESL worksheet, and a real PlanWise ESL lesson generated in 1–2 minutes.',
  ],
  sections: [
    {
      heading: '1. Nine-point pedagogical audit (B2: Work-Life Balance)',
      table: {
        headers: ['Quality criterion', 'Raw ChatGPT / LLM prompt', 'Typical pre-made worksheet', `${brand} (real B2 output)`],
        rows: [
          ['Prep & formatting time', '20–60 min (prompting, fixing CEFR drift, formatting)', '5–15 min searching catalogue (if topic exists)', `${generationTime} — ready to screen-share immediately`],
          ['Warm-up vocabulary recall', 'Generic icebreakers', '2–3 short lead-in questions', 'Targeted warm-up discussion questions that activate prior topic vocabulary before pre-teaching'],
          ['Vocabulary depth per word', 'Word + 1 definition (often using harder words than the target)', 'Word + matching definition', '5 target words (e.g. juggle, boundary, workload, neglect, fulfilment) with phonetic pronunciation (/JUG-ul/), B1-level definition, 4 real-world examples, word family + explanation, common collocations, usage notes & picture'],
          ['Reading calibration & coverage', 'Frequently drifts into C1/C2 prose; target words appear once or inconsistently', 'Fixed text; cannot adapt to your student’s known words', '5-paragraph B2 magazine-style reading using each target word 2–3 times (~96% familiar text) + 5 comprehension checks'],
          ['Active recall & lexical depth', 'None — passive reading list only', 'Usually a single fill-in-the-blank', 'Interactive flip flashcards (recall meaning + build an original sentence) + 5-part Semantic Map (synonyms, antonyms, related concepts, contexts, associated words)'],
          ['Speaking & accuracy practice', 'Unverified questions; occasional broken answer keys', 'Static exercises without tiered speaking support', 'Quiz + 3 tiered sentence frames (emerging/developing/expanding, especially helpful for beginners) + shuffled fill-in-the-blanks + sentence unscramble + deep target-vocab discussion'],
          ['Automated quality verification', 'None — teacher checks every line', 'Human-edited once, static forever', 'Section-by-section automated check & repair before the teacher sees it'],
          ['Take-home student study sheet', 'None unless formatted manually', 'Plain black-and-white worksheet (or unprintable on browser-locked sites)', 'Color-coded printable Vocabulary Review PDF (HTML → Print to PDF) with all 8 vocabulary layers — downloadable with zero login on every public lesson'],
          ['Cross-lesson memory & portal', 'Resets every chat', 'None (or static flashcard deck)', 'Strictly avoids re-teaching known words, recycles earlier words naturally when relevant, plus zero-login learner dashboard with spaced flashcards & student-created custom lessons'],
        ],
      },
    },
    {
      heading: '2. Why raw AI prompts fail the CEFR test (and how PlanWise prevents it)',
      paragraphs: [
        'When you ask a general chatbot for an A2 or B1 lesson, it routinely writes definitions that are harder than the word being taught, slips C1 idioms into the reading, and puts gap-fill answers in the exact same order as the vocabulary list. PlanWise ESL enforces fixed CEFR rules at every level from A1 to C2:',
      ],
      bullets: [
        '**Controlled definition vocabulary:** At A1, definitions use only the 500 most common English words (under 8 words); at B2, definitions are written in B1 language (under 15 words) so the student never needs a dictionary to read a definition.',
        '**96% lexical familiarity in the reading:** Keeping new words to roughly 1 in 25 matches second-language reading research (Hu & Nation, 2000; Laufer & Ravenhorst-Kalovski, 2010) so the reading triggers conversation rather than frustration.',
        '**Shuffled retrieval & verified keys:** Gap-fills are shuffled and verified automatically so every blank has a clean, unambiguous answer before class.',
      ],
    },
    {
      heading: '3. Verify it yourself with zero login',
      paragraphs: [
        'You do not have to take this benchmark on trust. Open any free lesson in our [public ESL lesson library](/esl-lessons)—such as our [B2 lesson on money and happiness](/lessons/1768)—click the download button at the top to inspect the printable Vocabulary Review study sheet, or read the full breakdown on our [Student Experience page](/student-experience) and [How It Works research page](/how-it-works).',
      ],
    },
  ],
  faq: [
    {
      question: 'How does PlanWise ESL prevent CEFR level drift compared to ChatGPT?',
      answer: 'PlanWise ESL enforces explicit CEFR rules per level for reading length, sentence complexity, and definition vocabulary (for example, A1 definitions use only the 500 most common words), then validates every section automatically before saving the lesson.',
    },
    {
      question: 'Can I inspect a real PlanWise ESL lesson and Vocabulary Review PDF before signing up?',
      answer: 'Yes. Every lesson in our public library at /esl-lessons is open with zero login—including the one-click Vocabulary Review download at the top of the page.',
    },
    {
      question: 'How does PlanWise ESL compare to big pre-made libraries like ESL Brains, Linguahouse and Off2Class?',
      answer: 'See our full side-by-side comparisons at /compare, including head-to-head pages for Twee, ESL Brains, Linguahouse, Off2Class and ChatGPT.',
    },
  ],
  cta: {
    heading: 'Run the benchmark on your own student’s topic',
    text: `Generate a complete CEFR A1–C2 lesson in ${generationTime} and compare it side by side with what you use today. Your ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'Article',
  updated,
};

export const compareFluentizePage: MarketingPage = {
  path: '/compare/fluentize',
  title: `${brand} vs Fluentize for ESL Teachers & Online Tutors`,
  description:
    `Honest comparison of ${brand} vs Fluentize: 700+ static YouTube video plans vs. custom A1–C2 lessons, vocab recycling, student hub & study PDFs.`,
  navLabel: 'PlanWise vs Fluentize',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. Fluentize for ESL teachers and online tutors',
  intro: [
    'Fluentize (`fluentize.com`) is a well-liked static library of 700+ hand-written ESL lesson plans built around authentic YouTube videos (adding 6–10 new lessons a month) with printable PDFs, fillable PDFs, and Google Slides—at a very affordable annual price for teachers who want ready-made B1–C1 listening lessons.',
    'PlanWise ESL is not trying to compete with Fluentize on being a low-cost static video catalogue. Instead, it solves everything a fixed YouTube library cannot do for active 1-on-1 tutors: generating a complete 8-stage CEFR A1–C2 lesson on **any niche student topic in 1–2 minutes**, supporting true A1–A2 beginners without fast YouTube audio, eliminating YouTube link rot and paid-call video dead air, tracking and naturally recycling each student’s vocabulary across weeks, and giving every student a zero-login learner dashboard and printable color-coded Vocabulary Review PDF.',
  ],
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. Fluentize',
      table: {
        headers: ['', 'Fluentize (verified Nov 2026)', brand],
        rows: [
          ['Lesson source & topic range', 'Static library of 700+ hand-written YouTube-video lesson plans (6–10 new/month)', `Custom 8-stage CEFR A1–C2 lesson on any niche student topic in ${generationTime}—never run out of topics ([see C1 Ethics](/lessons/1731) or [all free lessons](/esl-lessons))`],
          ['CEFR range & beginner support', 'Strongest on authentic video listening for B1–C1 teens & adults; A1–A2 beginners often struggle with fast native YouTube clips', 'Full A1–C2 calibration with ~96%-familiar readings, controlled definitions & 3-tier sentence frames for beginners ([inspect A1 lesson](/lessons/1774))'],
          ['Live 1-on-1 class flow', 'Depends on external YouTube videos (risk of YouTube link rot, ads, or silent dead air watching clips during paid calls)', '100% self-contained screen-shareable lesson—zero external link rot and maximum student talking time from minute one'],
          ['Lesson format & exports', 'Printable PDF, fillable PDF & Google Slides per static lesson', 'Full-screen interactive teaching view + color-coded printable Vocabulary Review PDF with pronunciation, 4 examples, word families, collocations, usage notes & 5-part semantic maps ([see PDF proof](/student-experience))'],
          ['Per-student vocabulary memory', 'None — static lessons do not track what each student already knows', 'Logs learned words per student, strictly avoids duplicates & recycles earlier words into future readings & questions only when natural and relevant'],
          ['Between-class student portal', 'No persistent student dashboard', 'Zero-login private learner dashboard per student: past lessons, cumulative word list, spaced flashcards, topic ideas & custom lessons on Unlimited ([preview](/student-experience))'],
          ['Pricing (verified Nov 2026)', '$3.49/credit (5 for $14.99, 10 for $26.49), $49/6 months, or $79/year (~$6.58/mo); school plans $45–$60/teacher/year', `${trialText} (no credit card), then flat ${priceText} Unlimited lessons & students, cancel anytime`],
        ],
      },
    },
    {
      heading: 'The honest ROI math: static budget library vs. student retention',
      paragraphs: [
        `On sticker price alone, Fluentize’s $79/year plan (~$6.58/month) is cheaper than PlanWise ESL’s **${priceText}** Unlimited plan. For independent Preply, italki, or private tutors, though, the real metric is **student retention and unpaid prep time**: keeping just **one** regular 1-on-1 student for **one extra lesson a month**—because their classes match their exact career or hobbies and come with a zero-login flashcard hub and color-coded study PDF—already pays for PlanWise ESL for the entire month.`,
      ],
    },
    {
      heading: 'When Fluentize is the better choice',
      bullets: [
        'You specifically want authentic YouTube video listening comprehension lessons for B1–C1 teens or adults on a low annual budget ($79/year).',
        'You prefer browsing a curated static catalogue in Google Slides or fillable PDFs rather than generating custom topics.',
        'You do not need per-student vocabulary tracking, A1–A2 beginner scaffolding, or a persistent between-class student dashboard.',
      ],
    },
    {
      heading: 'Why tutors switch from Fluentize to PlanWise ESL',
      bullets: [
        '**Never exhaust a 700-lesson catalogue:** Full-time 1-on-1 tutors quickly run out of fresh B1/B2 topics for long-term students—and static libraries cannot cover niche job interviews, tech stand-ups, medical consultations, or specific hobbies on demand.',
        '**Built for true A1–C2 calibration:** Instead of forcing lower-level learners to decode fast YouTube clips, PlanWise ESL enforces ~96%-familiar readings, controlled definitions, and 3-tier sentence frames (emerging/developing/expanding) across all six CEFR levels.',
        '**No YouTube link rot or paid-call dead air:** Every lesson is self-contained and designed for live teacher-led speaking from warm-up to deep discussion—no broken embeds, pre-roll ads, or sitting silently watching a 5-minute clip on a paid call.',
        '**Real student continuity that drives renewals:** Natural cross-lesson vocabulary recycling, a zero-login [student dashboard](/student-experience), and a color-coded Vocabulary Review PDF turn isolated lessons into a visible learning journey.',
      ],
    },
    {
      heading: 'Verify the difference yourself with zero login',
      paragraphs: [
        'Every claim above can be checked directly in our live, no-login library—no account or email required:',
      ],
      bullets: [
        '**A1 Beginner scaffolding proof:** [Let’s Talk About Video Games! (A1)](/lessons/1774) and all [free A1 Beginner lessons](/esl-lessons/a1).',
        '**Niche B2 & C1 Career/Business proof:** [The Price of Doing Right: Ethics in the Boardroom (C1)](/lessons/1731), [Founders, Failures and Pivots (C1)](/lessons/1750), and [Can Money Buy Happiness? (B2)](/lessons/1768).',
        '**Vocabulary Review PDF & Zero-Login Student Hub proof:** [Student Experience page](/student-experience) (with a real Vocabulary Review study PDF excerpt) and the full [free A1–C2 public library](/esl-lessons).',
      ],
    },
  ],
  faq: [
    {
      question: 'Why does PlanWise ESL cost more per month than Fluentize’s $79/year plan?',
      answer: `Fluentize sells access to a static catalogue of 700+ pre-written YouTube lessons ($79/year, ~$6.58/mo). PlanWise ESL (${priceText} Unlimited after a ${trialText}, no credit card) generates unlimited bespoke 8-stage CEFR A1–C2 lessons on any niche topic in ${generationTime}, tracks and naturally recycles every student’s vocabulary across lessons, and includes a zero-login student dashboard and printable color-coded Vocabulary Review PDF. For 1-on-1 tutors, retaining one student for a single extra class a month covers the subscription.`,
    },
    {
      question: 'Can I use PlanWise ESL for A1 and A2 beginners where YouTube video lessons feel too fast?',
      answer: 'Yes. PlanWise ESL enforces strict A1 and A2 rules—keeping definitions to simple high-frequency words, readings ~96% familiar, and adding 3-tier sentence frames so beginners can speak confidently without struggling through fast native YouTube audio. Inspect a live A1 example free at /lessons/1774.',
    },
    {
      question: 'Can I use Fluentize and PlanWise ESL together?',
      answer: 'Yes. Some tutors keep a video library for occasional B1–C1 listening lessons and use PlanWise ESL whenever a student needs a custom topic, beginner-friendly A1–A2 scaffolding, longitudinal vocabulary recycling, or a zero-login flashcard dashboard.',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by Fluentize. Fluentize pricing and library size verified as of November 2026 at app.fluentize.com/pricing and subject to change—check fluentize.com for current details.',
  cta: {
    heading: 'Go beyond a 700-lesson static video catalogue',
    text: `Generate a custom 8-stage CEFR A1–C2 lesson on your student’s exact topic in ${generationTime}. Your ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};

export const comparisonPages: MarketingPage[] = [
  compareHubPage,
  compareTweePage,
  compareEslBrainsPage,
  compareFluentizePage,
  compareLinguahousePage,
  compareOff2ClassPage,
  cefrBenchmarkPage,
];
