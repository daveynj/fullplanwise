/**
 * Fair, structured competitor comparison pages for PlanWise ESL:
 *  - /compare (decision hub covering pre-made libraries, AI worksheet tools & chatbots)
 *  - /compare/esl-joy
 *  - /compare/twee
 *  - /compare/magicschool-diffit
 *  - /compare/esl-brains
 *  - /compare/fluentize
 *  - /compare/linguahouse
 *  - /compare/off2class
 *  - /compare/student-memory-proof
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
    `Honest comparisons of ${brand} vs Engoo, ESL Pals, Fluentize, Twee, ESL Brains, Linguahouse, Off2Class & ChatGPT: CEFR, vocab memory & PDFs.`,
  navLabel: 'Compare',
  eyebrow: 'Comparisons',
  h1: 'PlanWise ESL vs. pre-made ESL lesson libraries and AI tools',
  intro: [
    'Most ESL teaching tools fall into three camps: **static pre-made lesson libraries** (like ESL Brains, Fluentize, Linguahouse, Off2Class and Ellii), **modular AI worksheet generators or slide tools** (like ESL Joy, Twee, MagicSchool and Diffit), and **general chatbots** (like ChatGPT).',
    'Each has genuine strengths—and clear trade-offs for one-to-one tutors and small to medium language schools. Here is an honest, side-by-side decision guide with live zero-login proof links so you can inspect the actual lessons yourself.',
  ],
  verdict: {
    heading: 'Why teachers switch to PlanWise ESL (and how to verify it in 60 seconds)',
    text: `Static ESL libraries (ESL Brains, Fluentize, Linguahouse, Off2Class) lock you into fixed catalogues with zero student vocabulary memory, while modular AI tools and chatbots (Twee, ESL Joy, MagicSchool, ChatGPT) force you to assemble prompts and reset every class. **${brand}** (${priceText} Unlimited after a ${trialText}, no card) builds a complete, CEFR-calibrated A1–C2 lesson on any niche topic in ${generationTime}, tracks and recycles each student’s words across future lessons ([inspect our live 4-lesson, 0-duplicate proof](/compare/student-memory-proof)), and includes a zero-login student flashcard dashboard and printable color-coded Vocabulary Review PDF.`,
  },
  sections: [
    {
      heading: 'How the four approaches compare',
      table: {
        headers: ['What you need', 'Pre-made ESL libraries', 'AI worksheet / K–12 tools', 'General chatbots', brand],
        rows: [
          ['Custom lesson on any niche student topic', 'No — fixed catalogue only', 'Activity by activity, assembled manually', 'Yes, with heavy prompting & editing', `Yes — complete lesson in ${generationTime} (inspect [C1 Business Ethics](/esl-lessons/c1/the-price-of-doing-right-ethics-in-the-modern-boardroom) or [all free lessons](/esl-lessons))`],
          ['Full scientific pedagogical sequence', 'Varies by publisher', 'Single isolated tasks; US K–12 apps lack ELT flow', 'No — unformatted text unless prompted step by step', 'Yes — 8-stage sequence: warm-up recall, rich vocab, reading, recall flashcards, semantic maps, exercises & deep discussion ([how it works](/how-it-works))'],
          ['CEFR A1–C2 calibration', 'Usually good inside fixed catalogue (often B1–C1 focused)', 'Mixed (e.g. Diffit uses US grades K2–K11+)', 'Frequently drifts above target level', 'Fixed CEFR A1–C2 rules, verified section by section (see [A1 Beginner](/esl-lessons/a1/let-s-talk-about-video-games) vs. [B2](/esl-lessons/b2/can-money-buy-happiness) & [C1](/esl-lessons/c1/founders-failures-and-pivots-the-new-face-of-entrepreneurship))'],
          ['Per-student vocabulary tracking & recycling', 'None (or static decks only)', 'None', 'None — resets every chat', 'Tracks learned words, avoids duplicates & recycles earlier words naturally into future readings & questions'],
          ['Printable student study PDF', 'Static PDF (Off2Class has no printing)', 'Export varies; often single worksheets', 'Manual copy & format', 'Color-coded Vocabulary Review study PDF with pronunciation, 4 examples, word families, collocations, usage notes & 5-part semantic maps ([see PDF proof](/student-experience))'],
          ['Private learner dashboard', 'Rare, per-seat capped, or expensive add-on', 'Usually none or temporary links', 'None', 'Included per student (no login): past lessons, spaced flashcards, topic ideas & custom lessons ([preview dashboard](/student-experience))'],
        ],
      },
    },
    {
      heading: 'Detailed head-to-head comparisons',
      bullets: [
        '[PlanWise ESL vs. Engoo Daily News](/compare/engoo) — Free fixed daily news articles vs. 180+ free structured A1–C2 conversation lessons, custom student topics in 1–2 minutes, vocabulary memory, learner dashboards and printable study PDFs.',
        '[PlanWise ESL vs. ESL Pals](/compare/esl-pals) — Pre-made PDF curriculum library vs. unlimited custom adult/teen CEFR A1–C2 lessons, cross-lesson vocabulary recycling and zero-login student flashcard dashboards.',
        '[PlanWise ESL vs. Breaking News English](/compare/breaking-news-english) — Classic text-heavy multi-level news archive vs. clean full-screen teaching mode, 8-stage lexical depth, custom non-news topics and printable study PDFs.',
        '[PlanWise ESL vs. ESL Joy](/compare/esl-joy) — Flexible AI slide decks with student tracking vs. an enforced 8-stage CEFR lesson sequence, natural vocabulary recycling, zero-login student dashboards and color-coded Vocabulary Review PDFs.',
        '[PlanWise ESL vs. Twee](/compare/twee) — Modular single-task AI tools vs. one cohesive, quality-checked pedagogical lesson with student vocabulary memory.',
        '[PlanWise ESL vs. MagicSchool AI & Diffit](/compare/magicschool-diffit) — US K–12 school tools (US grade levels & isolated worksheets) vs. true CEFR A1–C2 adult 1-on-1 conversation lessons, vocabulary recycling and zero-login student dashboards.',
        '[PlanWise ESL vs. ESL Brains](/compare/esl-brains) — Fixed adult video-lesson catalogue vs. unlimited custom student topics, vocabulary recycling and learner dashboards.',
        '[PlanWise ESL vs. Fluentize](/compare/fluentize) — Static 700+ YouTube video lesson library vs. unlimited custom A1–C2 lessons, zero link rot, natural vocabulary recycling and learner dashboards.',
        '[PlanWise ESL vs. Linguahouse](/compare/linguahouse) — Large static worksheet library + static Expemo decks vs. bespoke lessons that dynamically recycle each student’s vocabulary.',
        '[PlanWise ESL vs. Off2Class](/compare/off2class) — Browser-locked sequential curriculum (no printing) vs. flexible conversation lessons with printable study PDFs and unlimited students.',
        '[PlanWise ESL vs. ChatGPT](/compare/chatgpt) — Prompting a general chatbot from scratch vs. enforced CEFR rules, verified exercises, student memory and learner dashboards.',
        '[Same-Topic CEFR Quality Benchmark](/compare/cefr-benchmark) — A concrete side-by-side audit of a raw AI prompt, a generic ESL worksheet, and a real PlanWise ESL B2 lesson on Work-Life Balance.',
        '[One Student, Four Lessons: Vocabulary Recycling Proof](/compare/student-memory-proof) — Live 4-lesson B2 sequence (36 taught items, 0 duplicates) showing earlier words reappearing naturally in later readings, cloze, quizzes & discussions.',
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
        '**A1 Beginner proof:** [First Day at a New Job: Meeting Your Team (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team) and [Let’s Talk About Video Games! (A1)](/esl-lessons/a1/let-s-talk-about-video-games) — or browse all [A1 Beginner lessons](/esl-lessons/a1).',
        '**B1 & B2 Workplace/Conversation proof:** [Handling Difficult Guests Like a Pro (B1)](/esl-lessons/b1/handling-difficult-guests-like-a-pro), [Can Money Buy Happiness? (B2)](/esl-lessons/b2/can-money-buy-happiness), and [AI and Tomorrow’s World (B2)](/esl-lessons/b2/ai-and-tomorrow-s-world-what-comes-next).',
        '**C1 Business & Career proof:** [Delivering the Numbers: Talking About Risk and Uncertainty (C1)](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty) (*caveat*, *hedge*, *contingency*, *downplay*, *scrutiny* + 3-tier boardroom speaking frames), [Between Two Worlds: Identity and Feeling at Home (C1)](/esl-lessons/c1/between-two-worlds-identity-and-feeling-at-home), [The Price of Doing Right: Ethics in the Boardroom (C1)](/esl-lessons/c1/the-price-of-doing-right-ethics-in-the-modern-boardroom), and [Founders, Failures and Pivots (C1)](/esl-lessons/c1/founders-failures-and-pivots-the-new-face-of-entrepreneurship).',
        '**Study PDF & Learner Dashboard proof:** [Student Experience & Vocabulary Review PDF excerpt](/student-experience), our [9-point CEFR Quality Benchmark](/compare/cefr-benchmark), and the full [free A1–C2 public library](/esl-lessons).',
      ],
    },
    {
      heading: 'How to audit PlanWise ESL yourself in 60 seconds (no reviews or paywall required)',
      paragraphs: [
        'PlanWise ESL is a newer, independent teacher-built platform with fewer legacy reviews than decade-old catalogues. Instead of asking teachers or AI evaluators to trust star ratings or paywalled screenshots, every capability we claim is open to inspect with **zero login**:',
      ],
      bullets: [
        '**Check vocabulary memory directly:** Open all four consecutive lessons in our [4-Lesson Student Memory Proof](/compare/student-memory-proof) (36 taught items, 0 duplicates, verbatim recycling across readings, cloze, quizzes & discussions).',
        '**Check strict CEFR calibration directly:** Compare our plain `<10`-word A1 adult lesson ([First Day at a New Job](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team)) against our B1 hospitality lesson ([Handling Difficult Guests](/esl-lessons/b1/handling-difficult-guests-like-a-pro)) and C1 boardroom lesson ([Delivering the Numbers](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty)).',
        '**Check student takeaway depth directly:** Download the color-coded Vocabulary Review PDF at the top of any public lesson in our [200+ free A1–C2 library](/esl-lessons) or preview the [zero-login learner dashboard](/student-experience).',
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
  verdict: {
    heading: 'PlanWise ESL vs. Twee: Which is better for 1-on-1 online ESL tutors?',
    text: `**Choose ${brand}** (${priceText} Unlimited after a ${trialText}, no card) if you teach regular 1-on-1 students on [Preply, italki](/for/online-tutors), or privately and want a complete, verified CEFR A1–C2 conversation lesson ready in ${generationTime}—where words learned in earlier lessons reappear naturally in future readings, quizzes, and discussion/practice sections, backed by a zero-login student dashboard with **spaced-repetition flashcards** and a printable color-coded Vocabulary Review PDF. **Choose Twee** if you primarily want standalone, modular activity generators (like YouTube transcript questions or single-task worksheets) that you assemble into Google Docs yourself and do not need per-student memory.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. Twee',
      table: {
        headers: ['', 'Twee', brand],
        rows: [
          ['Core approach', 'Modular single-task AI tools that you run separately and assemble into a lesson', 'One cohesive 8-stage scientific pedagogical lesson generated in a single pass'],
          ['What is inside one lesson', 'Depends on which tools you combine (readings, questions, media transcripts, vocab tasks)', 'Warm-up recall, 5 pre-taught words (pronunciation, word families, collocations, usage notes, pictures), levelled reading, comprehension, recall flashcards, 5-part semantic maps, quiz, tiered sentence frames, fill-in-the-blanks, sentence unscramble & deep discussion'],
          ['Per-student vocabulary memory', 'None — does not track what each learner has already studied across classes', 'Tracks learned words per student, avoids repeats, and recycles earlier vocabulary naturally into future readings, quizzes & practice sections'],
          ['Student-facing portal', 'Shareable interactive activity links per task', 'Persistent private learner dashboard (no login): all past lessons, cumulative word list, spaced-repetition flashcards, topic suggestions & student-created custom lessons (Unlimited)'],
          ['Printable student review', 'Export to PDF/Docs/Forms on paid plans', 'Complete printable Vocabulary Review study PDF (color-coded by part of speech, 4 examples per word, word families, common collocations, usage notes & semantic map)'],
          ['Quality checking', 'Teacher reviews each generated module manually', 'Automated section-by-section verification and repair before saving'],
          ['Free trial', 'Restricted free trial (5 runs)', `${trialText} with unlimited lesson generations, no credit card`],
          ['Individual paid pricing', 'Tiered paid plans (check twee.com/price for current rates)', `${priceText} Unlimited, cancel anytime`],
        ],
      },
    },
    {
      heading: 'Real-World Prep Test: Preparing a B2/C1 1-on-1 lesson 10 minutes before class',
      paragraphs: [
        'Here is what happens when an online tutor prepares a personalised adult conversation lesson right before a booking:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (${generationTime})`,
        planwiseSteps: [
          'Select your student, pick their CEFR level (A1–C2), and enter their topic.',
          'In 1–2 minutes, open a complete screen-shareable lesson with 5 illustrated target words (10 layers each), ~96%-familiar magazine reading, reading-sourced idioms with right/wrong notes, 3-tier speaking frames, cloze, unscramble, illustrated discussion, and quiz.',
          'Words your student mastered in earlier lessons are excluded from pre-teaching and woven naturally into future readings, quizzes, and exercises.',
          'After class, your student revises on their zero-login spaced-repetition flashcard dashboard or via the color-coded Vocabulary Review PDF.',
        ],
        competitorTitle: 'Twee Workflow (Manual Module Assembly)',
        competitorSteps: [
          'Generate a reading passage in one Twee activity tool.',
          'Open a second tool for comprehension questions, a third for vocabulary tasks, and a fourth for discussion prompts.',
          'Copy, paste, and manually format the separate outputs into a document or slide deck for screen sharing.',
          'Track what the student learned manually in notes—there is no automatic cross-lesson vocabulary recycling or persistent spaced-repetition flashcard hub.',
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
        'You teach regular one-to-one or small-group students on [Preply or italki](/for/online-tutors), [privately](/for/freelance-esl-teachers), or at a [language school](/for/language-schools) and want each lesson to build on the words the student already learned.',
        'You want every student to leave class with a polished Vocabulary Review study PDF (including common collocations, word families, usage notes and synonyms/antonyms) plus a private learner dashboard with spaced-repetition flashcards.',
        'You want students to suggest topics or create their own custom lessons on any subject between classes.',
      ],
    },
    {
      heading: 'Inspect real PlanWise ESL lessons with zero login',
      paragraphs: [
        'Do not take our word for it—open full lessons from our [free public library](/esl-lessons) with **no account required** and download the Vocabulary Review PDF at the top of each page:',
      ],
      bullets: [
        '**C1 Advanced adult depth:** [Between Two Worlds: Identity and Feeling at Home (C1)](/esl-lessons/c1/between-two-worlds-identity-and-feeling-at-home) — inspect the 5-paragraph narrative, 10-layer vocabulary cards, idioms with right/wrong notes, and 3-tier speaking frames.',
        '**A1 Beginner scaffolding:** [Let’s Talk About Video Games! (A1)](/esl-lessons/a1/let-s-talk-about-video-games) — see `< 8`-word definitions and 3-tier speaking support.',
        '**B2 Conversation & CEFR audit:** [Can Money Buy Happiness? (B2)](/esl-lessons/b2/can-money-buy-happiness), our [4-lesson Student Memory Proof](/compare/student-memory-proof), our [9-point CEFR Quality Benchmark](/compare/cefr-benchmark), and the [Student Experience](/student-experience) preview.',
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
  verdict: {
    heading: 'PlanWise ESL vs. ESL Brains: Which should adult ESL tutors choose?',
    text: `**Choose ${brand}** (${priceText} Unlimited after a ${trialText}, no card) if you teach ongoing 1-on-1 or small-group adults who want unlimited custom career, industry, or hobby topics without hitting a catalogue ceiling—plus strict CEFR A1–C2 calibration, cross-lesson vocabulary recycling into future readings, quizzes and discussions ([see our 4-lesson live proof](/compare/student-memory-proof)), a zero-login student flashcard portal, and a printable color-coded Vocabulary Review PDF. **Choose ESL Brains** if you specifically want human-curated YouTube and podcast video lessons from a pre-made adult catalogue and do not need bespoke student topics or per-student vocabulary memory.`,
  },
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
      heading: 'Real-world prep test: teaching a C1 executive forecast lesson',
      paragraphs: [
        'Suppose your C1 finance director student messages two hours before class: *"Can we practise presenting quarterly risks and uncertain forecasts to our board?"* Compare both workflows:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (${generationTime})`,
        planwiseSteps: [
          'Pick your student, select C1, and enter "Presenting Quarterly Risks and Uncertain Forecasts to Executives".',
          'Open a complete, verified 9-section lesson ([inspect live Lesson 2048](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty)): warm-up, boardroom reading (*The Quarterly Meeting Maya Dreaded*), 5 C1 words (`caveat`, `hedge`, `contingency`, `downplay`, `scrutiny`) with collocations & semantic maps, 4 idioms (`warts and all`, `blow up`, `walk someone through`, `push back`), 3-tier qualifying/conceding speaking frames, cloze, unscramble, discussion, and quiz. Custom illustrations finish loading about a minute later—usually ready by the time you finish the warm-up.',
          'Mark the lesson "We did this" so all 9 items log to the student’s memory and resurface naturally in future lessons with zero duplicate target teaching ([4-lesson proof](/compare/student-memory-proof)).',
          'Share the student’s zero-login spaced-repetition flashcard link and one-click printable Vocabulary Review PDF.',
        ],
        competitorTitle: 'ESL Brains Workflow (Fixed Video Catalogue)',
        competitorSteps: [
          'Search the fixed ESL Brains catalogue for a C1 risk-forecasting video lesson—or pick the closest general business video if that exact scenario is not in the library.',
          'Double-check that your regular student has not already completed that catalogue lesson and that the embedded YouTube video still loads cleanly.',
          'Teach the curated video worksheet; if you want explicit 3-tier boardroom speaking frames (qualifying, adding caveats, conceding under questioning), build them yourself.',
          'Track learned vocabulary manually outside ESL Brains—there is no automatic cross-lesson vocabulary recycling or cumulative spaced-repetition flashcard dashboard.',
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
        '**Vocabulary that actually sticks across weeks:** ESL Brains lessons are isolated one-offs. PlanWise ESL tracks learned words per student, prevents duplicates, recycles earlier vocabulary naturally when relevant ([live 4-lesson memory proof](/compare/student-memory-proof)), and gives learners a zero-login [student dashboard](/student-experience).',
        '**Inspect full lessons free with no login:** Compare live public lessons across levels—[First Day at a New Job (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team), [Handling Difficult Guests Like a Pro (B1)](/esl-lessons/b1/handling-difficult-guests-like-a-pro), [Delivering the Numbers: Talking About Risk and Uncertainty (C1)](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty), and [Between Two Worlds (C1)](/esl-lessons/c1/between-two-worlds-identity-and-feeling-at-home)—or browse the full [public A1–C2 ESL lesson library](/esl-lessons) and download any Vocabulary Review PDF before starting a trial.',
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
  verdict: {
    heading: 'PlanWise ESL vs. Linguahouse: Which should ESL tutors choose?',
    text: `**Choose ${brand}** (${priceText} Unlimited after a ${trialText}, no card) if you teach ongoing 1-on-1 or small-group learners who want bespoke lessons built around their exact job or hobbies in ${generationTime}, dynamic cross-lesson vocabulary recycling inside future readings and quizzes ([inspect our live 4-lesson, 0-duplicate proof](/compare/student-memory-proof)), a zero-login student flashcard portal, and a printable color-coded Vocabulary Review PDF. **Choose Linguahouse** if you want a 5,800+ pre-written archive of printable worksheets, exam tracks, or Spanish (ELE) materials paired with fixed Expemo decks.`,
  },
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
      heading: 'Real-world prep test: bespoke C1 boardroom lesson vs. static worksheet library',
      paragraphs: [
        'Compare preparing a 60-minute class for a C1 finance director preparing to present quarterly forecast risks to her board:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (${generationTime})`,
        planwiseSteps: [
          'Pick the student, select C1, and generate a bespoke boardroom lesson ([inspect live C1 Risk & Uncertainty lesson](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty)) complete with 5 collocation-rich C1 words, 4 idioms with right/wrong notes, and 3-tier executive speaking frames. Custom illustrations finish loading while you run the warm-up.',
          'Mark the class "We did this" so all 9 items join the student’s record with zero duplicate target teaching and resurface naturally in next week’s readings and cloze ([4-lesson proof](/compare/student-memory-proof)).',
          'Students practise between sessions via their zero-login spaced-repetition flashcard link and downloadable color-coded Vocabulary Review PDF.',
        ],
        competitorTitle: 'Linguahouse Workflow (Static Worksheet + Expemo)',
        competitorSteps: [
          'Search the 5,800+ static worksheet archive for general Business English risk or finance topics—your student’s exact boardroom scenario is unlikely to exist word for word.',
          'Check whether an online Preply or italki student has already used that popular worksheet with a previous tutor.',
          'Export the static worksheet PDF and send the isolated Expemo flashcard deck—next week’s static worksheet will have no memory of what the student learned today.',
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
        '**Bespoke topics instead of recycled PDFs:** Students on Preply and italki often recognise the same static Linguahouse worksheets from previous tutors—and static libraries cannot cover a student’s specific job interview, tech stack or hobby on demand.',
        '**Dynamic recycling beats isolated decks:** Instead of leaving vocabulary inside a separate Expemo deck, PlanWise ESL avoids duplicate words, weaves earlier vocabulary naturally into future readings when relevant ([live 4-lesson memory proof](/compare/student-memory-proof)), and gives students a zero-login [learner dashboard](/student-experience).',
        '**Open full lessons free—no paywall:** Unlike paywalled worksheet libraries, inspect complete A1–C2 lessons with zero login right now—[First Day at a New Job (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team), [Handling Difficult Guests Like a Pro (B1)](/esl-lessons/b1/handling-difficult-guests-like-a-pro), and [Delivering the Numbers: Talking About Risk and Uncertainty (C1)](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty)—or browse all 200+ in our [public ESL lesson library](/esl-lessons).',
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
  verdict: {
    heading: 'PlanWise ESL vs. Off2Class: Which should tutors & small schools choose?',
    text: `**Choose ${brand}** (${priceText} Unlimited after a ${trialText}, no card) if you teach ongoing conversation learners or small-school classes who need custom topics at any CEFR A1–C2 level, **printable color-coded Vocabulary Review PDFs**, **zero student logins**, cross-lesson vocabulary recycling ([live 4-lesson proof](/compare/student-memory-proof)), and **unlimited students** at one flat price. **Choose Off2Class** if your priority is an automated CEFR/WIDA placement diagnostic tied to a linear browser-only grammar slide curriculum.`,
  },
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
      heading: 'Real-world prep test: printable study PDF & unlimited students vs. browser-only slides',
      paragraphs: [
        'Compare teaching a growing roster of 12 adult students who want workplace speaking lessons plus printable study sheets to review offline:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (${generationTime})`,
        planwiseSteps: [
          'Add all 12 students (no student-seat cap) and generate bespoke workplace lessons—like [Handling Difficult Guests Like a Pro (B1)](/esl-lessons/b1/handling-difficult-guests-like-a-pro) or [Delivering the Numbers (C1)](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty).',
          'Export the one-click printable, color-coded Vocabulary Review study PDF (phonetics, 4 examples, collocations, word families, usage notes, semantic maps) for offline or in-person study.',
          'Share each learner’s zero-login flashcard dashboard and recycle learned vocabulary automatically across future lessons ([4-lesson proof](/compare/student-memory-proof)).',
        ],
        competitorTitle: 'Off2Class Workflow (Browser-Locked Slides & Student Caps)',
        competitorSteps: [
          'Starter paid plans cap active students, forcing plan upgrades as your roster grows—and learners require individual student logins.',
          'Teach strictly from fixed browser slides inside the linear curriculum; custom student topics are not generated on demand.',
          'No printable PDF handouts or PDF export exist if a student wants offline vocabulary review sheets or paper classroom copies.',
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
        'You teach adult or teen conversation classes on [Preply or italki](/for/online-tutors), [privately](/for/freelance-esl-teachers) or at a [small to medium language school](/for/language-schools) and want engaging lessons built around each learner’s real interests.',
        'You teach more than 5 students and want flat, predictable pricing with unlimited lessons and students.',
        'You want every lesson to combine vocabulary depth (word families, collocations, usage notes), recall flashcards, semantic maps, beginner-friendly sentence frames, gap-fill, sentence unscramble and deep discussion.',
      ],
    },
    {
      heading: 'Why independent tutors switch from Off2Class to PlanWise ESL',
      bullets: [
        '**No student caps, no student logins:** Off2Class starter tiers cap active students and require student accounts. PlanWise ESL is a flat $19.99/month for unlimited lessons and unlimited students—with a zero-login [private learner dashboard](/student-experience) for every student and [live 4-lesson memory tracking](/compare/student-memory-proof).',
        '**Printable study PDFs instead of browser-locked slides:** Off2Class does not let you print or export lessons. Every PlanWise ESL lesson generates a clean, color-coded Vocabulary Review study PDF students can save or print.',
        '**Test full lessons & PDFs with zero signup:** Inspect [First Day at a New Job (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team), [Handling Difficult Guests Like a Pro (B1)](/esl-lessons/b1/handling-difficult-guests-like-a-pro), and [Delivering the Numbers (C1)](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty) in our [free public library](/esl-lessons), or compare quality on our [CEFR Quality Benchmark](/compare/cefr-benchmark).',
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
        'You do not have to take this benchmark on trust. Open any free lesson in our [public ESL lesson library](/esl-lessons)—such as our [B2 lesson on money and happiness](/esl-lessons/b2/can-money-buy-happiness)—click the download button at the top to inspect the printable Vocabulary Review study sheet, or read the full breakdown on our [Student Experience page](/student-experience) and [How It Works research page](/how-it-works).',
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

export const compareEslJoyPage: MarketingPage = {
  path: '/compare/esl-joy',
  title: `${brand} vs ESL Joy for 1-on-1 ESL Lesson Planning`,
  description:
    `Honest comparison of ${brand} vs ESL Joy: editable AI slide decks vs. an 8-stage CEFR lesson, natural vocab recycling, zero-login student hub & study PDFs.`,
  navLabel: 'PlanWise vs ESL Joy',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. ESL Joy for one-to-one ESL tutors',
  intro: [
    'ESL Joy (`esljoy.com`) is one of the closest AI rivals to PlanWise ESL because both platforms are built specifically for independent English teachers who want lessons remembered and tailored per student—not static catalogues or generic K–12 worksheets.',
    'The real difference comes down to **flexible editable slide decks vs. a complete, enforced 8-stage pedagogical lesson**: ESL Joy focuses on flexible slide decks you can manually edit line by line with lower starter tiers, whereas PlanWise ESL generates a full, verified 8-stage CEFR A1–C2 conversation lesson in 1–2 minutes—complete with deep multi-layer vocabulary cards, ~96%-familiar readings, recall flashcards, 5-part semantic maps, tiered speaking frames, a zero-login student dashboard, and a printable color-coded Vocabulary Review PDF.',
  ],
  verdict: {
    heading: 'PlanWise ESL vs. ESL Joy: Which is better for 1-on-1 tutors?',
    text: `**Choose ${brand}** (${priceText} Unlimited after a ${trialText}, no card) if you want a complete, automatically verified CEFR A1–C2 lesson ready in ${generationTime} without editing slides before class—plus automatic cross-lesson vocabulary recycling (so earlier words reappear naturally inside **future readings, quizzes, and practice sections**), a zero-login student dashboard with **spaced-repetition flashcards**, and a printable color-coded **Vocabulary Review PDF**. **Choose ESL Joy** if you teach 1–5 regular students on a lower starter budget and prefer manually editing flexible slide decks line by line.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. ESL Joy',
      table: {
        headers: ['', 'ESL Joy (verified Nov 2026)', brand],
        rows: [
          ['Core lesson format', 'Flexible AI slide decks, manually editable line by line', `Complete 8-stage scientific CEFR A1–C2 lesson generated in ${generationTime}, verified section by section before saving`],
          ['Pedagogical depth inside one lesson', 'Customisable slide sequence', 'Warm-up recall → 5 illustrated pre-taught words (pronunciation, levelled definition, 4 examples, word families, collocations, usage notes) → ~96%-familiar reading & comprehension → recall flashcards & 5-part semantic maps → quiz, 3-tier sentence frames, shuffled gap-fill, sentence unscramble → deep discussion'],
          ['Per-student memory & recycling', 'Remembers each student across lessons', 'Tracks each student’s learned words, strictly avoids duplicates, and recycles earlier vocabulary naturally into future readings, quizzes & practice sections'],
          ['Student review portal', 'Student progress tracked inside the tutor workflow', 'Persistent zero-login private learner dashboard: all past lessons, cumulative word list, spaced-repetition flashcards, topic suggestions & student-created custom lessons (Unlimited)'],
          ['Take-home printable study PDF', 'Slide-based teaching flow', 'Dedicated color-coded printable Vocabulary Review study PDF (pronunciation, levelled definitions, 4 examples/word, word families, collocations, usage notes & 5-part semantic map)'],
          ['Free tier & trial', 'Free tier (1 student, 5 custom lessons) + 30-day trial (15 AI lessons)', `${trialText} with unlimited lesson generation and no credit card required`],
          ['Paid plans', 'Plus: $9.99/mo regular ($7.99 founding until Nov 30, 2026; up to 5 students, 300 AI uses/mo). Pro: $15.99/mo regular ($12.99 founding until Nov 30, 2026; unlimited students)', `One simple plan: ${priceText} Unlimited lessons & unlimited students, cancel anytime`],
        ],
      },
    },
    {
      heading: 'Real-World Prep Test: Preparing a C1 adult lesson 10 minutes before class',
      paragraphs: [
        'Compare what a tutor gets right out of the box when preparing an advanced adult conversation class on identity and living abroad:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (${generationTime})`,
        planwiseSteps: [
          'Choose your student, select C1 Advanced, and enter the topic (e.g. identity and feeling at home between two cultures).',
          'Open a complete, quality-checked lesson like [Between Two Worlds: Identity and Feeling at Home (C1)](/esl-lessons/c1/between-two-worlds-identity-and-feeling-at-home) in 1–2 minutes: 5-paragraph magazine narrative, 5 illustrated words with nuance/usage notes, 4 reading-sourced idioms with right/wrong mistake pairs, and 3-tier speaking frames with 27 model responses.',
          'Mark the lesson "We did this": its vocabulary is excluded from future pre-teaching and surfaces naturally inside later readings, quizzes, and exercises.',
          'Send the student’s zero-login spaced-repetition flashcard link and color-coded Vocabulary Review PDF in one click.',
        ],
        competitorTitle: 'ESL Joy Workflow (Slide-by-Slide Editing)',
        competitorSteps: [
          'Generate an AI slide deck inside ESL Joy’s tutor workflow.',
          'Review and manually edit individual slides line by line if wording or pacing needs tightening before class.',
          'Teach from the slide deck without a standalone color-coded Vocabulary Review study PDF export or 3-tier emerging/developing/expanding speaking frames.',
          'Track student progress inside the tutor workflow without a public zero-login library for learners/tutors to inspect upfront.',
        ],
      },
    },
    {
      heading: 'When ESL Joy is the better choice',
      bullets: [
        'You prefer teaching from flexible slide decks and want to manually edit every slide line by line before class.',
        'You only teach 1–5 regular students and want a lower-priced starter tier (such as ESL Joy Free or Plus) or a 30-day 15-lesson trial window.',
        'You prefer a lighter slide-deck workflow over a full 8-stage vocabulary, reading, semantic map, and exercise sequence.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You want a complete, research-backed 8-stage CEFR lesson ready in 1–2 minutes without manually editing slides before class—with automated section-by-section quality verification.',
        'You want deep vocabulary instruction in every lesson: phonetic pronunciation, levelled definitions, 4 real-world examples, word families with explanations, common collocations, usage notes, illustrations, recall flashcards, and 5-part semantic maps.',
        'You teach beginner or mixed-confidence students who benefit from ~96%-familiar readings, 3-tier sentence frames (emerging/developing/expanding), shuffled fill-in-the-blanks, and sentence unscramble activities.',
        'You want every student to have a **zero-login private learner dashboard** with **spaced-repetition flashcards** plus a **printable color-coded Vocabulary Review PDF** you can send straight after class (especially useful for [Preply](/for/preply-tutors), [italki](/for/italki-tutors), and [freelance](/for/freelance-esl-teachers) tutors).',
      ],
    },
    {
      heading: 'Inspect full PlanWise ESL lessons with zero login',
      paragraphs: [
        'You do not have to guess which teaching flow feels stronger in class. Open any complete A1–C2 lesson below with **no login required**, download the color-coded Vocabulary Review PDF at the top of the page, or review the student hub:',
      ],
      bullets: [
        '**A1 Beginner scaffolding proof:** [Let’s Talk About Video Games! (A1)](/esl-lessons/a1/let-s-talk-about-video-games) and all [free A1 Beginner lessons](/esl-lessons/a1).',
        '**B2 & C1 Adult/Culture/Business proof:** [Between Two Worlds: Identity and Feeling at Home (C1)](/esl-lessons/c1/between-two-worlds-identity-and-feeling-at-home), [Can Money Buy Happiness? (B2)](/esl-lessons/b2/can-money-buy-happiness), [The Price of Doing Right: Ethics in the Boardroom (C1)](/esl-lessons/c1/the-price-of-doing-right-ethics-in-the-modern-boardroom), and [Founders, Failures and Pivots (C1)](/esl-lessons/c1/founders-failures-and-pivots-the-new-face-of-entrepreneurship).',
        '**Study PDF, Learner Hub & CEFR Benchmark:** [Live 4-lesson Vocabulary Recycling Proof](/compare/student-memory-proof), [Zero-login Student Experience](/student-experience), [9-point CEFR Quality Benchmark](/compare/cefr-benchmark), and the full [free A1–C2 public library](/esl-lessons).',
      ],
    },
  ],
  faq: [
    {
      question: 'How is PlanWise ESL different from ESL Joy if both remember each student?',
      answer: 'Both platforms track individual students, but their lesson structure differs sharply. ESL Joy centres on flexible slide decks you edit line by line, while PlanWise ESL enforces a complete 8-stage CEFR A1–C2 pedagogical sequence (deep vocabulary with word families, collocations and usage notes, ~96%-familiar readings, recall flashcards, 5-part semantic maps, 3-tier sentence frames, verified gap-fill and unscramble, and deep discussion) plus natural-only cross-lesson vocabulary recycling, a zero-login student dashboard, and a printable color-coded Vocabulary Review PDF.',
    },
    {
      question: 'How does pricing compare between ESL Joy and PlanWise ESL?',
      answer: `As of November 2026, ESL Joy offers a free tier (1 student, 5 custom lessons), a 30-day trial (15 AI lessons), Plus at $9.99/mo regular ($7.99 founding until Nov 30, 2026; up to 5 students, 300 AI uses/mo), and Pro at $15.99/mo regular ($12.99 founding until Nov 30, 2026; unlimited students). PlanWise ESL offers a ${trialText} with unlimited lesson generation (no credit card), followed by one flat ${priceText} Unlimited plan with unlimited lessons and students, cancel anytime.`,
    },
    {
      question: 'Can I compare a real PlanWise ESL lesson before signing up?',
      answer: 'Yes. Browse our free public ESL lesson library at /esl-lessons with zero login required—every lesson includes the full 8-stage teaching view and a one-click printable Vocabulary Review PDF.',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by ESL Joy. Pricing and features verified as of November 2026 and subject to change—check esljoy.com for current details.',
  cta: {
    heading: 'Compare a full 8-stage CEFR lesson with your own students',
    text: `Generate a complete lesson on any topic in ${generationTime}. Your ${trialText} includes unlimited lessons with no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
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
  verdict: {
    heading: 'PlanWise ESL vs. Fluentize: Which should online tutors choose?',
    text: `**Choose ${brand}** (${priceText} Unlimited after a ${trialText}, no card) if you teach ongoing 1-on-1 students who want bespoke topics across **all six CEFR levels (A1–C2)**, maximum live speaking time with zero YouTube link rot or silent clip-watching dead air, true beginner A1–A2 scaffolding, cross-lesson vocabulary recycling ([live 4-lesson proof](/compare/student-memory-proof)), a zero-login student flashcard dashboard, and a printable color-coded Vocabulary Review PDF. **Choose Fluentize** ($79/year, ~$6.58/mo) if you specifically want an affordable static library of 700+ hand-written YouTube video lessons for B1–C1 listening classes and do not need custom topics or per-student vocabulary memory.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. Fluentize',
      table: {
        headers: ['', 'Fluentize (verified Nov 2026)', brand],
        rows: [
          ['Lesson source & topic range', 'Static library of 700+ hand-written YouTube-video lesson plans (6–10 new/month)', `Custom 8-stage CEFR A1–C2 lesson on any niche student topic in ${generationTime}—never run out of topics ([see C1 Ethics](/esl-lessons/c1/the-price-of-doing-right-ethics-in-the-modern-boardroom) or [all free lessons](/esl-lessons))`],
          ['CEFR range & beginner support', 'Strongest on authentic video listening for B1–C1 teens & adults; A1–A2 beginners often struggle with fast native YouTube clips', 'Full A1–C2 calibration with ~96%-familiar readings, controlled definitions & 3-tier sentence frames for beginners ([inspect A1 lesson](/esl-lessons/a1/let-s-talk-about-video-games))'],
          ['Live 1-on-1 class flow', 'Depends on external YouTube videos (risk of YouTube link rot, ads, or silent dead air watching clips during paid calls)', '100% self-contained screen-shareable lesson—zero external link rot and maximum student talking time from minute one'],
          ['Lesson format & exports', 'Printable PDF, fillable PDF & Google Slides per static lesson', 'Full-screen interactive teaching view + color-coded printable Vocabulary Review PDF with pronunciation, 4 examples, word families, collocations, usage notes & 5-part semantic maps ([see PDF proof](/student-experience))'],
          ['Per-student vocabulary memory', 'None — static lessons do not track what each student already knows', 'Logs learned words per student, strictly avoids duplicates & recycles earlier words into future readings & questions only when natural and relevant'],
          ['Between-class student portal', 'No persistent student dashboard', 'Zero-login private learner dashboard per student: past lessons, cumulative word list, spaced flashcards, topic ideas & custom lessons on Unlimited ([preview](/student-experience))'],
          ['Pricing (verified Nov 2026)', '$3.49/credit (5 for $14.99, 10 for $26.49), $49/6 months, or $79/year (~$6.58/mo); school plans $45–$60/teacher/year', `${trialText} (no credit card), then flat ${priceText} Unlimited lessons & students, cancel anytime`],
        ],
      },
    },
    {
      heading: 'Real-world prep test: bespoke workplace lesson vs. static YouTube library',
      paragraphs: [
        'Compare preparing a 50-minute 1-on-1 class for a hotel receptionist (B1) or a finance executive (C1) right before the lesson starts:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (${generationTime})`,
        planwiseSteps: [
          'Pick the student, select their exact CEFR level (A1–C2), and enter their real workplace topic—no searching through a fixed catalogue.',
          'Generate a complete, self-contained 9-section lesson ([B1 Hospitality: Handling Difficult Guests](/esl-lessons/b1/handling-difficult-guests-like-a-pro) or [C1 Executive Risk: Delivering the Numbers](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty)): zero external video links to break, zero paid-call dead air watching clips, and custom illustrations that finish loading while you run the warm-up.',
          'Mark the lesson "We did this" so learned words log automatically and reappear naturally in future readings, cloze passages, quizzes, and discussions—with zero duplicate target words ([4-lesson proof](/compare/student-memory-proof)).',
          'Send the student’s zero-login spaced-repetition flashcard link and one-click printable color-coded Vocabulary Review PDF right after class.',
        ],
        competitorTitle: 'Fluentize Workflow (Static YouTube Catalogue)',
        competitorSteps: [
          'Browse the 700+ static YouTube lesson library for the closest B1 or C1 match—or compromise on topic if the student’s exact niche is missing.',
          'Preview the linked YouTube video beforehand to verify it is still live, region-available, and paced appropriately for your student.',
          'Spend 4–8 minutes of a paid 1-on-1 session playing the clip (or rely on the student watching it as homework beforehand).',
          'Track learned vocabulary manually in your own notes—static lessons do not recycle prior vocabulary into future lessons or feed a student flashcard dashboard.',
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
        '**A1 Beginner scaffolding proof:** [First Day at a New Job: Meeting Your Team (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team) and [Let’s Talk About Video Games! (A1)](/esl-lessons/a1/let-s-talk-about-video-games) — plus all [free A1 Beginner lessons](/esl-lessons/a1).',
        '**Niche B1, B2 & C1 Career/Business proof:** [Handling Difficult Guests Like a Pro (B1)](/esl-lessons/b1/handling-difficult-guests-like-a-pro), [Delivering the Numbers: Talking About Risk and Uncertainty (C1)](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty), [Between Two Worlds: Identity and Feeling at Home (C1)](/esl-lessons/c1/between-two-worlds-identity-and-feeling-at-home), [The Price of Doing Right: Ethics in the Boardroom (C1)](/esl-lessons/c1/the-price-of-doing-right-ethics-in-the-modern-boardroom), [Founders, Failures and Pivots (C1)](/esl-lessons/c1/founders-failures-and-pivots-the-new-face-of-entrepreneurship), and [Can Money Buy Happiness? (B2)](/esl-lessons/b2/can-money-buy-happiness).',
        '**Vocabulary Recycling, Study PDF & Student Hub proof:** [Live 4-lesson Student Memory Proof](/compare/student-memory-proof), [Student Experience page](/student-experience) (with a real Vocabulary Review study PDF excerpt), and the full [free A1–C2 public library](/esl-lessons).',
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
      answer: 'Yes. PlanWise ESL enforces strict A1 and A2 rules—keeping definitions to simple high-frequency words, readings ~96% familiar, and adding 3-tier sentence frames so beginners can speak confidently without struggling through fast native YouTube audio. Inspect a live A1 example free at /esl-lessons/a1/let-s-talk-about-video-games.',
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

export const compareMagicSchoolDiffitPage: MarketingPage = {
  path: '/compare/magicschool-diffit',
  title: `${brand} vs MagicSchool AI & Diffit for ESL Teachers`,
  description:
    `Honest comparison of ${brand} vs MagicSchool AI & Diffit: US K–12 grade worksheets vs. CEFR A1–C2 ESL lessons, vocab recycling & student hubs.`,
  navLabel: 'PlanWise vs MagicSchool & Diffit',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. MagicSchool AI & Diffit for adult ESL teachers',
  intro: [
    'MagicSchool AI and Diffit are popular teacher productivity platforms built primarily for **US K–12 school classrooms**. Because many English tutors try them first when searching for "AI lesson tools", it helps to see clearly where K–12 school tools diverge from dedicated adult and teen ESL/EFL instruction.',
    'Where Diffit levels reading passages by **US school grades (K2–K11+)** and MagicSchool offers general classroom admin utilities, **PlanWise ESL** is engineered from the ground up for **CEFR A1–C2 conversation teaching**—with 5 illustrated pre-taught words, ~96%-familiar readings, reading-sourced idioms with right/wrong usage notes, 3-tier speaking frames, cross-lesson vocabulary recycling, and zero-login student dashboards.',
  ],
  verdict: {
    heading: 'PlanWise ESL vs. MagicSchool AI & Diffit: Which should ESL tutors choose?',
    text: `**Choose ${brand}** (${priceText} Unlimited after a ${trialText}, no card) if you teach teenage or adult ESL/EFL learners (on [Preply, italki](/for/online-tutors), [privately](/for/freelance-esl-teachers), or in a [language school](/for/language-schools)) and need true **CEFR A1–C2 calibration**, explicit adult speaking scaffolding (3-tier frames + idioms with right/wrong notes), cross-lesson vocabulary recycling across future readings and quizzes, a zero-login student flashcard hub, and a printable Vocabulary Review PDF. **Choose MagicSchool AI or Diffit** if you teach US K–12 school subjects and want grade-level reading differentiation, IEP helpers, or Google Classroom exports.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. MagicSchool AI & Diffit',
      table: {
        headers: ['', 'MagicSchool AI / Diffit', brand],
        rows: [
          ['Built for', 'US K–12 school teachers, school admin & general classroom subjects', 'ESL/EFL conversation tutors & language schools teaching teens and adults'],
          ['Levelling framework', 'US school grade levels (e.g. Grade 2–Grade 11+) rather than adult ESL progression', 'Strict CEFR A1–C2 rules per level (e.g. A1 definitions capped to the 500 most common words, <8 words; C1–C2 rich magazine nuance)'],
          ['Speaking scaffolding', 'General reading comprehension & classroom prompts; no adult ESL speaking frames', '3-tier v2_pedagogical speaking frames (Emerging, Developing, Expanding) + idioms/phrasal verbs with explicit right vs. wrong usage pairs'],
          ['Vocabulary instruction depth', 'Basic glossary or vocabulary list per passage', '5 pre-taught illustrated words: phonetic guide, levelled definition, 4 real-world examples, word family, collocations, usage notes & 5-part semantic map'],
          ['Per-student memory & recycling', 'None — each generated resource starts fresh with no student word history', 'Tracks every word taught per student, avoids duplicates & recycles earlier words naturally into future readings, quizzes & practice sections'],
          ['Between-class student review', 'Google Docs / Classroom exports for K–12 classes', 'Zero-login student dashboard (past lessons + spaced-repetition flashcards + custom lessons on Unlimited) & printable color-coded Vocabulary Review PDF'],
          ['Pricing & trial', 'Free tiers with paid individual/school plans', `${trialText} (no credit card), then flat ${priceText} Unlimited lessons & students, cancel anytime`],
        ],
      },
    },
    {
      heading: 'Real-World Prep Test: Adapting a topic for a 1-on-1 adult learner',
      paragraphs: [
        'Compare how each approach handles an adult learner who wants a structured 60-minute speaking lesson at their exact CEFR level:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (${generationTime})`,
        planwiseSteps: [
          'Pick your student and select their exact CEFR level (A1, A2, B1, B2, C1, or C2) plus any topic.',
          'Generate one complete 9-section lesson automatically verified before saving: warm-up, ~96%-familiar reading, 5 illustrated 10-layer vocab cards, idioms with right/wrong notes, 3-tier speaking frames, cloze, unscramble, illustrated discussion, and quiz.',
          'Words learned in previous weeks resurface naturally in future readings, quizzes, and exercises.',
          'Share the student’s zero-login spaced-repetition flashcard link and printable color-coded Vocabulary Review PDF right after class.',
        ],
        competitorTitle: 'MagicSchool AI / Diffit Workflow (K–12 Adaptation)',
        competitorSteps: [
          'Estimate which US school grade (e.g. Grade 4 vs. Grade 8) approximates an adult learner’s CEFR level.',
          'Generate an adapted reading passage or isolated classroom worksheet activity.',
          'Write your own ESL pronunciation guides, collocations, L1-friendly usage notes, 3-tier adult speaking frames, and conversation questions by hand.',
          'Maintain your own external spreadsheet for student vocabulary—there is no automatic cross-lesson ESL recycling or spaced-repetition flashcard portal.',
        ],
      },
    },
    {
      heading: 'When MagicSchool AI or Diffit is the better choice',
      bullets: [
        'You teach K–12 school students inside a US-style school curriculum and need grade-level reading differentiation across science, history, or ELA.',
        'You need school-focused admin tools such as rubric builders, parent emails, or IEP support.',
        'You export primarily to Google Classroom or Microsoft Teams for school-age classes.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You teach adult or teen ESL/EFL learners who want mature, magazine-style topics calibrated strictly from **A1 to C2**—never childish K–12 worksheets.',
        'You want every lesson to include pronunciation guides, collocations, word families, 5-part semantic maps, idioms with right/wrong usage notes, and 3-tier speaking frames ready in 1–2 minutes.',
        'You want words learned in earlier lessons to reappear naturally inside **future readings, quizzes, and exercises**, paired with a zero-login **spaced-repetition flashcard dashboard** and printable **Vocabulary Review PDF**.',
      ],
    },
    {
      heading: 'Inspect real A1 vs. C1 CEFR calibration with zero login',
      paragraphs: [
        'Compare how strictly PlanWise ESL separates beginner simplicity from native-grade nuance—no login required:',
      ],
      bullets: [
        '**A1 Beginner adult calibration proof:** [First Day at a New Job: Meeting Your Team (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team) (*colleague*, *manager*, *introduce* defined in plain `< 10`-word A1 English for adult learners—not Grade 2 children’s stories) and [Let’s Talk About Video Games! (A1)](/esl-lessons/a1/let-s-talk-about-video-games).',
        '**C1 Advanced adult proof:** [Between Two Worlds: Identity and Feeling at Home (C1)](/esl-lessons/c1/between-two-worlds-identity-and-feeling-at-home) — nuanced narrative prose, `assimilate` vs. `integrate` usage notes, and 27 C1 model responses.',
        '**Full audit & student portal:** [Live 4-lesson Vocabulary Recycling Proof](/compare/student-memory-proof), [9-point CEFR Quality Benchmark](/compare/cefr-benchmark), [Student Experience & PDF preview](/student-experience), and the full [free A1–C2 library](/esl-lessons).',
      ],
    },
  ],
  faq: [
    {
      question: 'Why does CEFR A1–C2 matter more than US grade levels for ESL teachers?',
      answer: 'An adult A2 beginner has mature life experience and needs adult-relevant topics written in simple, high-frequency English with speaking frames—not a Grade 2 children’s reading. PlanWise ESL separates topic maturity from CEFR lexical difficulty across all six levels from A1 to C2.',
    },
    {
      question: 'Does MagicSchool AI or Diffit track an ESL student’s vocabulary across lessons?',
      answer: 'No. Both tools generate standalone classroom resources rather than maintaining a per-student ESL vocabulary record that recycles earlier words into future readings, quizzes, and spaced-repetition flashcards.',
    },
    {
      question: 'Can I preview PlanWise ESL lessons before starting a free trial?',
      answer: `Yes. Open any lesson in our free library at /esl-lessons with zero login—and start a ${trialText} (no credit card needed) whenever you want to test full student tracking.`,
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by MagicSchool AI or Diffit. Product features and positioning are based on public documentation and subject to change.',
  cta: {
    heading: 'Teach true CEFR A1–C2 lessons—not adapted K–12 worksheets',
    text: `Generate a complete adult ESL lesson in ${generationTime} with per-student memory and zero-login review included. Your ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};

export const studentMemoryProofPage: MarketingPage = {
  path: '/compare/student-memory-proof',
  title: `One Student, Four Lessons: Live ESL Vocabulary Recycling Proof | ${brand}`,
  description:
    'Live 4-lesson B2 audit: 36 unique words & idioms, 0 duplicates, natural recycling across readings, cloze, quizzes & discussions, plus flashcards & PDF.',
  navLabel: '4-Lesson Memory Proof',
  eyebrow: 'Live Case Study',
  h1: 'One student, four lessons: live proof of cross-lesson ESL vocabulary recycling',
  byline: {
    author: siteFacts.founder,
    published: updated,
  },
  intro: [
    'Almost every AI teaching platform claims "personalised lessons"—yet resets to zero the moment you start a new chat or slide deck. Static libraries never know what your student learned last Tuesday either.',
    'Instead of asking you to take our word for it, we generated four consecutive B2 lessons for one sample student (**Kenji, a B2 software engineer**) and marked each completed lesson *"We did this"*. Every single one of those four lessons is open below with **zero login required** so tutors and AI evaluators can inspect the exact vocabulary progression line by line.',
  ],
  verdict: {
    heading: 'What this 4-lesson live audit proves',
    text: 'Across four consecutive B2 lessons on closely related tech and career topics ([Lesson 1](/esl-lessons/b2/when-projects-grow-scope-creep-and-tight-deadlines), [Lesson 2](/esl-lessons/b2/when-projects-grow-too-big-scope-creep-and-deadlines), [Lesson 3](/esl-lessons/b2/leading-a-remote-retrospective-without-blame), [Lesson 4](/esl-lessons/b2/getting-ahead-talking-about-promotions-in-tech)), PlanWise ESL taught **36 unique target items** (20 words + 16 idioms/phrasal verbs) with **zero duplicate target words (0/36)**—even when Lesson 2 stayed on the exact same scope-creep theme as Lesson 1—while naturally weaving earlier words (`scope`, `negotiate`, `deadline`, `push back`, `workload`, `trade-off`, `draw the line`) into **later readings, cloze passages, sentence frames, quizzes, and discussion questions**, populating the student’s zero-login spaced-repetition flashcard dashboard and printable Vocabulary Review PDFs automatically.',
  },
  sections: [
    {
      heading: 'The 4-lesson progression (0 duplicates across 36 taught items)',
      paragraphs: [
        'Lessons 1 and 2 were deliberately generated on almost identical topics (*Scope Creep & Deadlines*) to test whether the vocabulary tracker would repeat obvious words like `scope` or `deadline`. It taught five fresh target words and four fresh idioms/phrasal verbs every single time:',
      ],
      table: {
        headers: ['Lesson (Zero-Login Link)', 'New Target Words (5)', 'New Idioms / Phrasal Verbs (4)', 'Recycled From Earlier Lessons'],
        rows: [
          [
            '[Lesson 1: When Projects Grow: Scope Creep and Tight Deadlines](/esl-lessons/b2/when-projects-grow-scope-creep-and-tight-deadlines)',
            '`scope`, `overwhelm`, `compromise`, `negotiate`, `cut corners`',
            '`fit in`, `hold your ground`, `pile up`, `bite off more than you can chew`',
            'Baseline lesson (9 items logged when marked "We did this")',
          ],
          [
            '[Lesson 2: When Projects Grow Too Big: Scope Creep and Deadlines](/esl-lessons/b2/when-projects-grow-too-big-scope-creep-and-deadlines)',
            '`milestone`, `workload`, `stall`, `deadline`, `trade-off`',
            '`push back`, `ship`, `stay late`, `draw the line`',
            'From L1: **scope**, **overwhelm**, **compromise**, **negotiate**, **pile up**, **bite off more than you can chew** (warm-up, reading, vocab & sentence frames)',
          ],
          [
            '[Lesson 3: Leading a Remote Retrospective Without Blame](/esl-lessons/b2/leading-a-remote-retrospective-without-blame)',
            '`blame`, `accountability`, `friction`, `morale`, `hindsight`',
            '`open up`, `name names`, `point the finger at`, `drift into`',
            'From L2: **deadline**, **workload**, **push back**, **draw the line** (warm-up, reading, vocab, sentence frames, discussion & quiz)',
          ],
          [
            '[Lesson 4: Getting Ahead: Talking About Promotions in Tech](/esl-lessons/b2/getting-ahead-talking-about-promotions-in-tech)',
            '`leverage`, `visibility`, `advocate`, `track record`, `mentor`',
            '`show off`, `move forward`, `speak for itself`, `make some noise`',
            'From L1 & L2: **negotiate** (L1), **deadline** (L2), **trade-off** (L2), **push back** (L2) (reading, comprehension, sentence frames, cloze & discussion)',
          ],
        ],
      },
    },
    {
      heading: 'Verbatim excerpts: earlier words reappearing naturally across readings, cloze & discussions',
      paragraphs: [
        'Nothing is awkwardly shoehorned in—earlier words only reappear when they fit the new situation naturally. Check these exact quotes directly inside the live public lessons:',
      ],
      bullets: [
        '**Lesson 2 Reading (recycling `scope` from Lesson 1):** *"But slowly, the workload grew, and the developers started staying late. The project’s **scope** had quietly doubled."* ([Inspect Lesson 2](/esl-lessons/b2/when-projects-grow-too-big-scope-creep-and-deadlines))',
        '**Lesson 3 Reading (recycling `deadline` from Lesson 2):** *"When Priya’s software team missed a big **deadline**, her manager called an emergency video meeting. Within minutes, fingers were pointing."* ([Inspect Lesson 3](/esl-lessons/b2/leading-a-remote-retrospective-without-blame))',
        '**Lesson 4 Reading (recycling `deadline` from Lesson 2):** *"Maya had worked at the same tech company for four years. She was good at her job, fixed hard bugs, and never missed a **deadline**."* ([Inspect Lesson 4](/esl-lessons/b2/getting-ahead-talking-about-promotions-in-tech))',
        '**Lesson 4 Cloze & Discussion (recycling `negotiate` from Lesson 1 & `push back` from Lesson 2):** Cloze: *"Within a year, he was able to leverage his growing reputation — and a job offer from another company — to **negotiate** the promotion he deserved."* Discussion: *"Would you take the project, or would you **push back** and ask for better conditions first?"* ([Inspect Lesson 4](/esl-lessons/b2/getting-ahead-talking-about-promotions-in-tech))',
      ],
    },
    {
      heading: 'Closed-loop reinforcement between classes (zero-login dashboard + study PDF)',
      paragraphs: [
        'Because each lesson is logged to the student’s record as soon as the teacher clicks *"We did this"*, review happens automatically across three channels:',
      ],
      bullets: [
        '**Cumulative spaced-repetition flashcards:** After completing Lessons 1–3, Kenji’s zero-login learner dashboard automatically held **27 due spaced-repetition flashcards** (15 target words + 12 idioms and phrasal verbs), rising to **36 items** once Lesson 4 is completed ([preview the Student Experience](/student-experience)).',
        '**Next-lesson preview & custom requests:** Upcoming lessons appear on the student’s dashboard ahead of class alongside topic suggestions and (on Unlimited) student-created custom lessons.',
        '**Printable color-coded Vocabulary Review PDF:** Every one of the 4 public lessons above includes the one-click Vocabulary Review download at the top—complete with phonetic pronunciation, 4 real-world examples, word families, common collocations, usage notes, and 5-part semantic maps.',
      ],
    },
    {
      heading: 'Why static libraries and general chatbots cannot replicate this',
      paragraphs: [
        'See what happens over a real 4-lesson sequence with an ongoing 1-on-1 student:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} 4-Lesson Memory Loop`,
        planwiseSteps: [
          'Generate Lesson 1 ([/esl-lessons/b2/when-projects-grow-scope-creep-and-tight-deadlines](/esl-lessons/b2/when-projects-grow-scope-creep-and-tight-deadlines)) for your student’s exact job/goal in 1–2 minutes and mark it "We did this".',
          'Lessons 2, 3, and 4 ([2043](/esl-lessons/b2/when-projects-grow-too-big-scope-creep-and-deadlines), [2044](/esl-lessons/b2/leading-a-remote-retrospective-without-blame), [2045](/esl-lessons/b2/getting-ahead-talking-about-promotions-in-tech)) strictly exclude all previously learned words from pre-teaching (0/36 duplicates) and weave earlier words naturally into readings, cloze, sentence frames, quizzes, and discussion.',
          'Each completed class feeds the student’s private zero-login dashboard with spaced-repetition flashcards and past lessons.',
          'Every lesson exports a printable color-coded Vocabulary Review PDF in one click.',
        ],
        competitorTitle: 'Static Libraries, Modular Tools & ChatGPT',
        competitorSteps: [
          'Static libraries (Fluentize, ESL Brains, Linguahouse) have no knowledge of which words your student learned last week and frequently repeat common B1/B2 vocabulary across disconnected topics.',
          'Modular worksheet generators (Twee) and general chatbots (ChatGPT) reset every session—forgetting taught words unless you maintain manual spreadsheets and paste huge word lists into every prompt.',
          'None provide a built-in zero-login spaced-repetition flashcard hub synced directly to the teacher’s completed lessons.',
          'Review sheets either do not exist, cannot be printed (Off2Class), or lack consistent 8-layer semantic maps and collocations.',
        ],
      },
    },
  ],
  faq: [
    {
      question: 'Does PlanWise ESL force old vocabulary into unrelated lessons?',
      answer: 'No. Earlier words are strictly excluded from being re-taught as "new" vocabulary, and are passed to lesson generation with explicit instructions to reuse them only when they fit the new topic naturally and relevantly.',
    },
    {
      question: 'Can I inspect all 4 lessons and download their Vocabulary Review PDFs right now?',
      answer: 'Yes. All four lessons (/esl-lessons/b2/when-projects-grow-scope-creep-and-tight-deadlines, /esl-lessons/b2/when-projects-grow-too-big-scope-creep-and-deadlines, /esl-lessons/b2/leading-a-remote-retrospective-without-blame, and /esl-lessons/b2/getting-ahead-talking-about-promotions-in-tech) are public with zero login required—including the one-click Vocabulary Review download at the top of each lesson.',
    },
    {
      question: 'Does cross-lesson vocabulary memory work across A1–C2 and unlimited students?',
      answer: `Yes. Every account gets unlimited students and full per-student vocabulary tracking across all six CEFR levels (A1–C2), included in both the ${trialText} (no credit card) and the flat ${priceText} Unlimited plan.`,
    },
  ],
  cta: {
    heading: 'Run your own 4-lesson sequence on a real student',
    text: `Generate your student’s next lesson in ${generationTime} and see cross-lesson vocabulary recycling and zero-login flashcards in action. Your ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'Article',
  updated,
};

export const compareEngooPage: MarketingPage = {
  path: '/compare/engoo',
  title: `${brand} vs Engoo Daily News: Free Lessons & Full Planner`,
  description:
    `Fair comparison of ${brand} vs Engoo Daily News: 180+ free zero-login A1–C2 lessons, printable study PDFs, custom topics & per-student vocab memory.`,
  navLabel: 'PlanWise vs Engoo',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. Engoo Daily News for ESL tutors',
  intro: [
    'Engoo Daily News is rightly popular among online tutors because it offers free, zero-login news articles every day at graded levels. For a quick current-events warm-up, it has served teachers and students well for years.',
    `Teachers start looking beyond Engoo when a student has already seen today’s trending article with another tutor, wants topics outside daily news, or needs deeper vocabulary instruction than a quick article glossary. **${brand}** keeps the **zero-login free access**—with [over 180 ready-to-teach A1–C2 free lessons](/esl-lessons) you can open and export as a printable study PDF right now—while adding ${generationTime} custom topic generation, an 8-stage pedagogical sequence, cross-lesson vocabulary memory, and private student flashcard dashboards.`,
  ],
  verdict: {
    heading: 'PlanWise ESL vs. Engoo Daily News: Which should tutors use?',
    text: `**Choose ${brand}** if you want both **180+ free zero-login A1–C2 conversation lessons** with downloadable 8-layer study PDFs *and* the ability to generate bespoke lessons on any topic in ${generationTime} that track each student’s vocabulary ([inspect our live 4-lesson, 0-duplicate proof](/compare/student-memory-proof)) and give them a private spaced-repetition flashcard dashboard (${trialText}, no card, then ${priceText} Unlimited). **Choose Engoo Daily News** if you specifically want a brand-new breaking news headline every morning and prefer a quick article-plus-discussion read.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. Engoo Daily News',
      table: {
        headers: ['', 'Engoo Daily News', brand],
        rows: [
          ['Free zero-login access', 'Yes — free news articles & conversation materials with no login', 'Yes — 180+ free A1–C2 lessons in our [public library](/esl-lessons) with zero login & one-click PDF export'],
          ['Lesson variety beyond daily news', 'Focused mainly on news articles + fixed conversation sheets', `Unlimited custom topics on your student’s job, hobbies, exams or seasonal themes in ${generationTime} (plus curated [Holidays & Celebrations](/esl-lessons/topics/holidays) & [Culture](/esl-lessons/topics/culture) packs)`],
          ['Pedagogical depth per word', 'Word + short definition + pronunciation + 1–2 sentences before reading', '5 pre-taught illustrated words with pronunciation, levelled definition, 4 real-world examples, word family, collocations, usage notes & 5-part semantic map ([how it works](/how-it-works))'],
          ['Scaffolding for beginners & shy speakers', 'Basic questions after reading', '3-tier speaking frames (Emerging, Developing, Expanding with model answers), recall flashcards, cloze, sentence unscramble, quiz & illustrated discussion'],
          ['Student overlap risk', 'Students who study with multiple online tutors often see the same popular daily articles twice', 'Every generated lesson can be tailored uniquely to the student’s life, role and CEFR level (A1–C2)'],
          ['Per-student vocabulary tracking & recycling', 'None — no record of words covered across classes', 'Remembers learned words, excludes accidental repeats, and weaves earlier words naturally into future readings & questions'],
          ['Post-class study sheet & student portal', 'Web page only; no custom student flashcard hub or colour-coded PDF', 'Printable color-coded Vocabulary Review PDF + zero-login student dashboard with past lessons & spaced flashcards ([preview](/student-experience))'],
        ],
      },
    },
    {
      heading: 'Real-World Prep Test: Turning a niche topic into a 60-minute class',
      paragraphs: [
        'Compare what happens when a returning B2 learner asks to prepare for a supplier negotiation—or wants a full structured lesson with take-home study material:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (${generationTime})`,
        planwiseSteps: [
          'Pick the student and choose B2 Upper Intermediate with a custom topic (e.g. supplier negotiations or hospitality leadership) in 1–2 minutes—or open a ready-made lesson free at /esl-lessons.',
          'Teach in clean full-screen mode through warm-up, 5 illustrated 8-layer vocab cards, ~96%-familiar reading, recall flashcards, semantic maps, 3-tier speaking frames, cloze, unscramble, quiz, and deep discussion.',
          'Mark "We did this" after class so the vocabulary joins the student’s profile with zero accidental repeats next week and natural recycling in later lessons.',
          'Click Download for PDF for a clean print-to-PDF Vocabulary Review sheet and send the student their zero-login flashcard dashboard link.',
        ],
        competitorTitle: 'Engoo Daily News Workflow',
        competitorSteps: [
          'Search the daily news archive for an article vaguely related to business or negotiation.',
          'Check whether the student has already read that popular article elsewhere, and whether its length/scaffolding works for a full 60-minute 1-on-1 class.',
          'Supplement missing word families, collocations, beginner sentence frames, and controlled practice exercises yourself.',
          'Track previously taught words manually outside the site—there is no student dashboard or spaced flashcard history.',
        ],
      },
    },
    {
      heading: 'When Engoo Daily News is the better choice',
      bullets: [
        'You specifically want fresh daily current-event news stories published every morning with zero preparation.',
        'Your student prefers short news-reading and quick opinion prompts rather than structured vocabulary recycling or post-class flashcards.',
        'You do not need custom niche topics, printable Vocabulary Review PDFs, or per-student progress tracking.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You want **180+ free zero-login A1–C2 conversation lessons** right now—each following a full 8-stage research sequence with a built-in 30/60-minute [teacher pacing guide](/esl-lessons#how-to-teach-free-lessons) and one-click printable PDF.',
        'You teach regular one-to-one students who pay for personalised lessons tailored to their exact job, hobbies and CEFR level ([live recycling proof](/compare/student-memory-proof)).',
        'You want every student to have a **zero-login learner dashboard** with spaced-repetition flashcards and colour-coded **Vocabulary Review PDFs** you can save/print straight after class.',
      ],
    },
    {
      heading: 'Inspect free PlanWise ESL lessons & study PDFs with zero login',
      paragraphs: [
        'Every public lesson below opens immediately with zero signup—click **Download for PDF** at the top of any lesson to compare the print-ready study sheet directly:',
      ],
      bullets: [
        '**A1 & A2 Beginner/Elementary proof:** [First Day at a New Job: Meeting Your Team (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team) and [Making Small Talk with New People (A2)](/esl-lessons/a2/making-small-talk-with-new-people).',
        '**B1 & B2 Conversation proof:** [Handling Difficult Guests Like a Pro (B1)](/esl-lessons/b1/handling-difficult-guests-like-a-pro) and [Can Money Buy Happiness? (B2)](/esl-lessons/b2/can-money-buy-happiness).',
        '**C1 & C2 Advanced proof:** [Delivering the Numbers: Talking About Risk and Uncertainty (C1)](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty) and [Subtle Irony, Idiom and Nuance in Modern Media (C2)](/esl-lessons/c2/subtle-irony-idiom-and-nuance-in-modern-media).',
        '**Seasonal & Culture theme hubs:** Browse [Holidays & Celebrations](/esl-lessons/topics/holidays), [Culture](/esl-lessons/topics/culture), or the entire [180+ free lesson library](/esl-lessons).',
      ],
    },
  ],
  faq: [
    {
      question: 'Does PlanWise ESL have a completely free zero-login lesson library like Engoo?',
      answer: 'Yes. Over 180 complete CEFR A1–C2 conversation lessons at /esl-lessons open with zero login required, include full-screen teaching mode plus a 30/60-minute teacher guide, and export a printable Vocabulary Review study sheet in one click.',
    },
    {
      question: 'How is a PlanWise ESL lesson structured differently from an Engoo Daily News article?',
      answer: 'PlanWise ESL follows an 8-stage second-language acquisition sequence every time: warm-up recall, 5 illustrated target words (pronunciation, levelled definition, 4 examples, word family, collocations, usage notes), a ~96%-familiar 5-paragraph reading, recall flashcards, 5-part semantic maps, quiz, 3-tier speaking frames, cloze, unscramble, deep discussion, and reading-sourced idioms (A2+).',
    },
    {
      question: 'What if I want custom lessons on my student’s exact topic without vocabulary repeats?',
      answer: `On a free 5-day Unlimited trial (no credit card) or the ${priceText} Unlimited plan, you can build custom CEFR A1–C2 lessons on any topic in ${generationTime}. When you mark a lesson "We did this", future lessons exclude already-learned target words and recycle earlier words naturally.`,
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by Engoo. Product comparisons reflect publicly available free library features and are subject to change.',
  cta: {
    heading: 'Try 180+ free lessons now—or build your student’s next custom lesson in 1–2 minutes',
    text: `Explore our zero-login A1–C2 library or start a ${trialText} (no credit card required) to unlock per-student vocabulary memory and custom topics.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-27',
};

export const compareEslPalsPage: MarketingPage = {
  path: '/compare/esl-pals',
  title: `${brand} vs ESL Pals: Static PDF Curriculum vs Custom AI`,
  description:
    `Fair comparison of ${brand} vs ESL Pals: fixed pre-made PDF library vs. custom CEFR A1–C2 lessons in 1–2 minutes, vocab memory & student hubs.`,
  navLabel: 'PlanWise vs ESL Pals',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. ESL Pals for adult & teen ESL teachers',
  intro: [
    'ESL Pals is a well-regarded subscription library known for clean, modern downloadable PDF worksheets across general English, business English, grammar, and young-learner curricula. Many independent tutors like having ready-made PDFs they can download and teach quickly.',
    `The challenge with any pre-made PDF library is personalisation over months of classes: fixed catalogues cannot invent a lesson tailored to an adult learner’s exact industry, avoid repeating vocabulary from another course, or update a student’s flashcard portal automatically. **${brand}** generates a complete, CEFR-calibrated A1–C2 conversation lesson on any topic in **${generationTime}**, remembers each student’s vocabulary across lessons, and includes both a printable study PDF and a zero-login student dashboard.`,
  ],
  verdict: {
    heading: 'PlanWise ESL vs. ESL Pals: Which should ESL tutors choose?',
    text: `**Choose ${brand}** (${priceText} Unlimited after a ${trialText}, no card) if you teach teen or adult one-to-one or small-group conversation students and want custom A1–C2 lessons on any niche topic in ${generationTime}, longitudinal vocabulary tracking and recycling, zero-login spaced-repetition flashcards, and colour-coded Vocabulary Review PDFs—plus [over 180 free zero-login lessons](/esl-lessons) to test before subscribing. **Choose ESL Pals** if you primarily teach young learners/kids or want a fixed, downloadable PDF curriculum with explicit grammar worksheets ready without generating anything.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. ESL Pals',
      table: {
        headers: ['', 'ESL Pals', brand],
        rows: [
          ['Core model', 'Fixed library of pre-designed downloadable PDF lesson plans', `On-demand ${generationTime} custom A1–C2 lesson builder + [180+ free zero-login lessons](/esl-lessons)`],
          ['Niche & student-specific topics', 'Limited to topics in the existing library catalogue', 'Unlimited — generate any topic from luxury retail in Shanghai to nurse handovers in Dublin'],
          ['Young learners vs. adults/teens', 'Includes dedicated Kids curriculum levels alongside General & Business English', 'Built specifically for teenage and adult conversation learners (A1–C2)'],
          ['Pedagogical consistency & lexical depth', 'Activity-based PDF worksheets varied by lesson unit', 'Enforced 8-stage SLA sequence in every lesson: 5 illustrated 8-layer vocab words, ~96%-familiar reading, 5-part semantic maps, 3-tier speaking frames, cloze, unscramble, quiz & deep discussion'],
          ['Per-student vocabulary tracking & recycling', 'None — static PDFs cannot track what individual students have learned', 'Tracks every taught word per student, excludes duplicates & recycles earlier words naturally ([live proof](/compare/student-memory-proof))'],
          ['Post-class student portal', 'None — teachers send PDFs manually', 'Zero-login student dashboard with past lessons, spaced flashcards, next-lesson preview & custom lesson creation on Unlimited ([preview](/student-experience))'],
          ['Free preview library & trial', 'Selection of free sample lessons + paid tiers', `180+ full A1–C2 free lessons with no login + ${trialText} (no credit card), then flat ${priceText} Unlimited`],
        ],
      },
    },
    {
      heading: 'Real-World Prep Test: Preparing 4 consecutive classes for one student',
      paragraphs: [
        'See what happens over a four-lesson package with a returning B2 business student:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (${generationTime})`,
        planwiseSteps: [
          'Open your student profile (their CEFR level and learned vocabulary are already stored) and enter their exact next real-world goal—or pick from their own topic suggestions.',
          'Generate the full lesson in 1–2 minutes; PlanWise excludes previously taught target words so every new lesson delivers 5 genuinely fresh words and weaves earlier vocabulary back into the reading and questions naturally.',
          'Screen-share in full-screen teaching mode and click "We did this" after class to update their permanent word history.',
          'Student reviews anytime via their private zero-login flashcard dashboard and printable colour-coded Vocabulary Review PDF.',
        ],
        competitorTitle: 'Static PDF Library Workflow',
        competitorSteps: [
          'Browse the fixed Business or General catalogue hoping to find a worksheet close to what the student works on.',
          'Download and inspect the PDF manually to check whether the target words overlap with words you taught from another unit last week.',
          'Keep your own notes on which words the student still struggles with—earlier worksheets never adapt future lessons.',
          'Email static worksheet PDFs without an interactive spaced-repetition flashcard portal linked to the student’s personal history.',
        ],
      },
    },
    {
      heading: 'When ESL Pals is the better choice',
      bullets: [
        'You teach young children and want a ready-made kids curriculum with static printable PDFs.',
        'You prefer picking from pre-authored downloadable worksheets and never want to type a topic to generate a tailored lesson.',
        'You want standalone traditional grammar drill PDFs rather than conversation-led fluency lessons.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You teach regular adult or teen one-to-one students and want lessons custom-built around their work, hobbies and CEFR level (A1–C2) in **1–2 minutes**.',
        'You want to stop repeating words across disconnected topics—PlanWise checks each student’s history automatically ([4-lesson, 0-duplicate audit](/compare/student-memory-proof)).',
        'You want every student to have a **zero-login learner dashboard** with spaced-repetition flashcards plus one-click colour-coded **Vocabulary Review PDFs**.',
      ],
    },
    {
      heading: 'Test the material yourself (zero login required)',
      bullets: [
        '**Beginner to Advanced live lessons:** [First Day at a New Job (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team), [Handling Difficult Guests Like a Pro (B1)](/esl-lessons/b1/handling-difficult-guests-like-a-pro), [Delivering the Numbers: Risk & Uncertainty (C1)](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty).',
        '**Curated theme collections:** [Holidays & Celebrations](/esl-lessons/topics/holidays) and [Culture](/esl-lessons/topics/culture), inside our [180+ free lesson library](/esl-lessons).',
        '**Research & student portal proof:** [How PlanWise ESL works](/how-it-works) and [Student Dashboard & Vocabulary Review PDF preview](/student-experience).',
      ],
    },
  ],
  faq: [
    {
      question: 'Can I also get a printable PDF in PlanWise ESL like ESL Pals?',
      answer: 'Yes. Every lesson—including all 180+ free public lessons at /esl-lessons—has a one-click download button at the top that saves a clean, print-ready HTML study document you can Print -> Save as PDF, featuring colour-coded parts of speech, phonetic guides, 4 examples per word, word families, collocations, usage notes and 5-part semantic maps.',
    },
    {
      question: 'Is PlanWise ESL good for beginners (A1–A2) if it does not have a kids programme?',
      answer: 'Yes—for teen and adult beginners. At A1, definitions use only the 500 most common English words (<8 words), readings stay within 80–120 clear sentences, and every lesson includes 3-tier speaking frames (Emerging, Developing, Expanding) with model answers so beginners never freeze.',
    },
    {
      question: 'Does PlanWise ESL cost more than static PDF subscriptions?',
      answer: `PlanWise ESL starts with a ${trialText} (unlimited lessons, no credit card) and costs a flat ${priceText} for unlimited custom lessons, unlimited students, vocabulary tracking, learner dashboards and study PDFs.`,
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by ESL Pals. Features and catalogue scope are based on public information and subject to change.',
  cta: {
    heading: 'Go beyond fixed PDF catalogues in 1–2 minutes',
    text: `Start your ${trialText} (no credit card required) or test any of our 180+ free zero-login A1–C2 lessons at /esl-lessons.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-27',
};

export const compareBreakingNewsEnglishPage: MarketingPage = {
  path: '/compare/breaking-news-english',
  title: `${brand} vs Breaking News English: Modern Free & Custom ESL`,
  description:
    `Fair comparison of ${brand} vs Breaking News English: 180+ free modern A1–C2 lessons, clean screen-sharing, custom non-news topics & PDFs.`,
  navLabel: 'PlanWise vs Breaking News English',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. Breaking News English for conversation tutors',
  intro: [
    'Breaking News English has been a staple free resource for ESL teachers for decades, famous for its huge archive of current-events articles graded across seven levels with multi-speed listening recordings and classic printable handouts.',
    `When teaching live online 1-on-1 classes, however, many tutors find dense multi-page web handouts awkward to screen-share, and students often want to practise topics beyond breaking news (careers, culture, hobbies, interviews, travel). **${brand}** pairs **over 180 free zero-login A1–C2 conversation lessons** built cleanly for modern screen-sharing with a ${generationTime} custom lesson builder that remembers and recycles every student’s vocabulary.`,
  ],
  verdict: {
    heading: 'PlanWise ESL vs. Breaking News English: Which fits your classes?',
    text: `**Choose ${brand}** if you want modern full-screen screen-share UX and printable colour-coded study PDFs across [180+ free A1–C2 conversation lessons](/esl-lessons) (zero login), *or* want to build custom non-news lessons in ${generationTime} with per-student vocabulary recycling and private learner flashcard dashboards (${trialText}, no card, then ${priceText} Unlimited). **Choose Breaking News English** if your class revolves around graded multi-speed listening audio on current world news stories and traditional printable news drills.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. Breaking News English',
      table: {
        headers: ['', 'Breaking News English', brand],
        rows: [
          ['Free zero-login library', 'Yes — massive free archive of 3,000+ news-based handouts & audio', 'Yes — [180+ free zero-login A1–C2 conversation lessons](/esl-lessons) built on a structured 8-stage SLA flow'],
          ['Screen-sharing & student UX', 'Dense multi-exercise web pages designed largely as text handouts', 'Clean interactive full-screen lesson view with tabs/sections, illustrations, flip flashcards & mobile-friendly learner portal'],
          ['Topics beyond news', 'Almost exclusively news stories', `Both ready-made themes ([Holidays](/esl-lessons/topics/holidays), [Culture](/esl-lessons/topics/culture), work, travel, health, AI) *and* unlimited custom topics in ${generationTime}`],
          ['Vocabulary instruction depth', 'Synonym matching & phrase work inside text sheets', '5 illustrated pre-taught words: phonetic guide, levelled definition, 4 examples, word family, collocations, usage notes & 5-part semantic map'],
          ['Speaking scaffolding', 'Discussion lists & role-play prompts', 'Warm-up activation + 3-tier speaking frames (Emerging, Developing, Expanding with model answers) + illustrated deep discussion'],
          ['Listening speed drills', 'Yes — multiple audio recording speeds per article (strong strength)', 'Focused on conversation, vocabulary acquisition, reading & interactive flashcards rather than speed-graded audio'],
          ['Per-student vocabulary memory & study portal', 'None — static pages per article', 'Tracks each student’s words, avoids repeats, recycles earlier words naturally & includes zero-login spaced flashcards + study PDF'],
        ],
      },
    },
    {
      heading: 'Real-World Prep Test: Teaching a 60-minute online conversation class',
      paragraphs: [
        'Compare preparing an online class when your goal is natural speaking, deep word retention, and a polished student takeaway:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (${generationTime})`,
        planwiseSteps: [
          'Open one of 180+ free lessons immediately at /esl-lessons—or generate a tailored CEFR A1–C2 lesson on any non-news topic for your specific student in 1–2 minutes.',
          'Screen-share in full-screen mode: students move cleanly from warm-up recall to illustrated vocabulary cards, ~96%-familiar reading, interactive flip flashcards, 3-tier speaking frames, cloze, unscramble, quiz and deep discussion.',
          'Avoid teaching the same high-frequency words twice across weeks—PlanWise checks the student’s learned list automatically.',
          'Export the printable colour-coded Vocabulary Review PDF in one click and share their private zero-login flashcard dashboard link.',
        ],
        competitorTitle: 'Breaking News English Workflow',
        competitorSteps: [
          'Browse the news archive to find a level-matched article—hoping a recent headline fits your student’s interests.',
          'Download or open the dense multi-page handout and scroll past sections you are not using while screen-sharing on Zoom or Preply.',
          'Create your own phonetic pronunciation aids, 3-tier beginner speaking scaffolds, and post-class spaced flashcards separately.',
          'Track student vocabulary history manually—no student portal or cross-lesson word recycling exists.',
        ],
      },
    },
    {
      heading: 'When Breaking News English is the better choice',
      bullets: [
        'Your priority is multi-speed recorded news audio (e.g., slower-to-native dictation & listening drills) across thousands of older and current news events.',
        'You want free classic news worksheets with zero account tools or student tracking.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You teach online over video and want **clean full-screen lessons** your students can read comfortably without zooming into crowded text handouts.',
        'You want **180+ free zero-login A1–C2 lessons** covering real life, work, culture and holidays—each with a structured 30/60-minute [teacher pacing guide](/esl-lessons#how-to-teach-free-lessons) and a printable colour-coded Vocabulary Review PDF.',
        'You teach ongoing students and want **per-student vocabulary tracking**, natural recycling across lessons ([see live 4-lesson proof](/compare/student-memory-proof)), and zero-login **spaced-repetition flashcards** ([see student experience](/student-experience)).',
      ],
    },
    {
      heading: 'Compare live lessons right now (no login needed)',
      bullets: [
        '**Full free lesson library (180+ lessons, CEFR A1–C2):** [/esl-lessons](/esl-lessons) and the [30/60-minute Teacher Guide](/esl-lessons#how-to-teach-free-lessons).',
        '**Sample A1, B2 & C1 lessons:** [First Day at a New Job (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team), [AI and Tomorrow’s World (B2)](/esl-lessons/b2/ai-and-tomorrow-s-world-what-comes-next), and [Ethics in the Modern Boardroom (C1)](/esl-lessons/c1/the-price-of-doing-right-ethics-in-the-modern-boardroom).',
        '**Quality & pedagogy benchmarks:** [How PlanWise ESL works](/how-it-works) and [9-point CEFR Quality Benchmark](/compare/cefr-benchmark).',
      ],
    },
  ],
  faq: [
    {
      question: 'Are PlanWise ESL’s public lessons also free without an account like Breaking News English?',
      answer: 'Yes. Every lesson in /esl-lessons (over 180 complete CEFR A1–C2 lessons) opens with zero signup or login required, works cleanly in full-screen teaching mode, and includes a one-click Vocabulary Review download you can print or save as PDF.',
    },
    {
      question: 'Does PlanWise ESL only cover news, or any conversation topic?',
      answer: 'Any topic. The free library covers career, travel, technology, AI, culture, holidays and everyday conversation, and registered teachers (free 5-day trial or $19.99/month Unlimited) can generate bespoke lessons on any niche student interest in 1–2 minutes.',
    },
    {
      question: 'Why does PlanWise ESL use 5 target words and an 8-stage sequence instead of dozens of drills?',
      answer: 'Second-language research (Nation, Webb, Krashen, Roediger & Karpicke) shows learners retain vocabulary far better when 5 key words are pre-taught deeply (pronunciation, levelled definition, word families, collocations, usage notes, semantic maps), encountered multiple times in ~96%-familiar context, retrieved via flashcards, and practised through speaking frames and discussion.',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by Breaking News English. Product summaries are based on publicly accessible pages and subject to change.',
  cta: {
    heading: 'Modern screen-ready ESL lessons—free to inspect, personalised in 1–2 minutes',
    text: `Explore 180+ free A1–C2 lessons with no login, or start a ${trialText} (no credit card required) for custom student profiles and vocabulary recycling.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-27',
};

export const comparisonPages: MarketingPage[] = [
  compareHubPage,
  compareEngooPage,
  compareEslPalsPage,
  compareBreakingNewsEnglishPage,
  compareEslJoyPage,
  compareTweePage,
  compareMagicSchoolDiffitPage,
  compareEslBrainsPage,
  compareFluentizePage,
  compareLinguahousePage,
  compareOff2ClassPage,
  cefrBenchmarkPage,
  studentMemoryProofPage,
];
