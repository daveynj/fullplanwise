/**
 * Fair, structured competitor comparison pages for PlanWise ESL:
 *  - /compare (decision hub covering pre-made libraries, AI worksheet tools & chatbots)
 *  - /compare/twee
 *  - /compare/esl-brains
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
    `Honest comparisons of ${brand} against Twee, ESL Brains, Linguahouse, Off2Class and ChatGPT: pedagogy, CEFR levelling, vocab memory, study PDFs & price.`,
  navLabel: 'Compare',
  eyebrow: 'Comparisons',
  h1: 'PlanWise ESL vs. pre-made ESL lesson libraries and AI tools',
  intro: [
    'Most ESL teaching tools fall into three camps: **static pre-made lesson libraries** (like ESL Brains, Linguahouse, Off2Class, Fluentize and Ellii), **modular AI worksheet generators or US K–12 apps** (like Twee, MagicSchool and Diffit), and **general chatbots** (like ChatGPT).',
    'Each has genuine strengths—and clear trade-offs for one-to-one tutors and small to medium language schools. Here is an honest, side-by-side decision guide so you can pick the right tool for how you teach.',
  ],
  sections: [
    {
      heading: 'How the four approaches compare',
      table: {
        headers: ['What you need', 'Pre-made ESL libraries', 'AI worksheet / K–12 tools', 'General chatbots', brand],
        rows: [
          ['Custom lesson on any niche student topic', 'No — fixed catalogue only', 'Activity by activity, assembled manually', 'Yes, with heavy prompting & editing', `Yes — complete lesson in ${generationTime} (or student-created on Unlimited)`],
          ['Full scientific pedagogical sequence', 'Varies by publisher', 'Single isolated tasks; US K–12 apps lack ELT flow', 'No — unformatted text unless prompted step by step', 'Yes — warm-up recall, rich vocab, reading, recall flashcards, semantic maps, exercises & deep discussion'],
          ['CEFR A1–C2 calibration', 'Usually good inside fixed catalogue', 'Mixed (e.g. Diffit uses US grades K2–K11+)', 'Frequently drifts above target level', 'Fixed CEFR A1–C2 rules, verified section by section before saving'],
          ['Per-student vocabulary tracking & recycling', 'None (or static decks only)', 'None', 'None — resets every chat', 'Tracks learned words and recycles them into future readings & questions'],
          ['Printable student study PDF', 'Static PDF (Off2Class has no printing)', 'Export varies; often single worksheets', 'Manual copy & format', 'Complete Vocabulary Review study PDF (pronunciation, 4 examples, word families, collocations, usage notes, 5-part semantic maps)'],
          ['Private learner dashboard', 'Rare, per-seat capped, or expensive add-on', 'Usually none or temporary links', 'None', 'Included per student (no login): past lessons, spaced flashcards, topic ideas & custom lessons'],
        ],
      },
    },
    {
      heading: 'Detailed head-to-head comparisons',
      bullets: [
        '[PlanWise ESL vs. Twee](/compare/twee) — Modular single-task AI tools vs. one cohesive, quality-checked pedagogical lesson with student vocabulary memory.',
        '[PlanWise ESL vs. ESL Brains](/compare/esl-brains) — Fixed adult video-lesson catalogue vs. unlimited custom student topics, vocabulary recycling and learner dashboards.',
        '[PlanWise ESL vs. Linguahouse](/compare/linguahouse) — Large static worksheet library + static Expemo decks vs. bespoke lessons that dynamically recycle each student’s vocabulary.',
        '[PlanWise ESL vs. Off2Class](/compare/off2class) — Browser-locked sequential curriculum (no printing) vs. flexible conversation lessons with printable study PDFs and unlimited students.',
        '[PlanWise ESL vs. ChatGPT](/compare/chatgpt) — Prompting a general chatbot from scratch vs. enforced CEFR rules, verified exercises, student memory and learner dashboards.',
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

export const comparisonPages: MarketingPage[] = [
  compareHubPage,
  compareTweePage,
  compareEslBrainsPage,
  compareLinguahousePage,
  compareOff2ClassPage,
];
