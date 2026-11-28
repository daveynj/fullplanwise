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
 *  - /compare/same-lesson-three-tools
 * (Plus /compare/chatgpt in shared/marketing-pages.ts.)
 *
 * Rendered by the same single-source system as shared/marketing-pages.ts
 * (React page + crawler-readable SSR HTML + JSON-LD + /sitemap.xml + /llms-full.txt).
 */
import type { MarketingPage } from './marketing-pages';
import { siteFacts, trialText, priceText, freeLessonsText } from './site-facts';

const { brand, generationTime } = siteFacts;
const updated = '2026-11-26';
const trialCta = { label: 'Start Your Free Trial', href: '/auth?register=true' };

export const compareHubPage: MarketingPage = {
  path: '/compare',
  title: `ESL Lesson Tools Compared (2026): 16 Options by Teaching Need`,
  description:
    `Fair 2026 comparison of 16 ESL lesson tools—Engoo, ESL Brains, Fluentize, Twee, ESL Joy, Off2Class, ChatGPT & more—by CEFR, price, vocab memory & PDFs.`,
  navLabel: 'Compare',
  eyebrow: 'Comparisons',
  h1: 'ESL lesson tools compared by teaching need: PlanWise ESL and 15 libraries, AI tools and chatbots',
  intro: [
    'Most ESL teaching tools fall into three camps: **pre-made lesson libraries** (Engoo, Breaking News English, ESL Brains, Fluentize, Linguahouse, ESL Pals, Off2Class, Immerly, PrintDiscuss), **AI worksheet, slide or classroom tools** (Twee, ESL Joy, edio.ai, MagicSchool, Diffit) and **general chatbots** (ChatGPT, Gemini, Claude).',
    'This page is written by a working ESL teacher for tutors, language schools and self-study learners who want a straight answer. Every tool below is genuinely useful for someone. We say who each one suits, where each one falls short, what it costs, and link to a detailed head-to-head page and live lessons you can inspect with **no login**.',
  ],
  verdict: {
    heading: 'Quick answer: which ESL lesson tool should you use?',
    text: `For **regular one-to-one or small-group conversation students** (Preply, italki, private or small-school classes), **${brand}** is the most complete option: a full CEFR A1–C2 lesson on any topic in ${generationTime}, vocabulary that is tracked per student and recycled into future lessons ([live 4-lesson proof](/compare/student-memory-proof)), a zero-login student flashcard dashboard and a printable Vocabulary Review PDF, for ${priceText} unlimited after a ${trialText} (no card). For **free ready-made lessons**, start with the [200+ free PlanWise ESL lessons](/esl-lessons), Breaking News English (news with graded audio) or Engoo Daily News. For **video listening lessons** choose ESL Brains or Fluentize. For an **adaptive placement curriculum** choose Off2Class. For **US K–12 school subjects** choose MagicSchool or Diffit.`,
  },
  sections: [
    {
      heading: 'Best ESL tool for each need',
      bullets: [
        `**Best for online tutors with regular 1-on-1 students:** ${brand} — custom topics for each student, vocabulary memory across lessons and a student dashboard between classes ([for online tutors](/for/online-tutors), [Preply](/for/preply-tutors), [italki](/for/italki-tutors)).`,
        '**Best free ESL conversation lessons with no login:** the [PlanWise ESL free library](/esl-lessons) (200+ complete A1–C2 lessons across 17 themes, each with a printable study PDF). Also good: Immerly (100+ interactive A1–C1 lessons) and Engoo Daily News (free daily news articles).',
        '**Best for news-based lessons with graded audio:** Breaking News English (a large free archive of news handouts with multi-speed listening).',
        '**Best for authentic video listening (B1–C1):** ESL Brains (1,000+ video, podcast and article lessons for adults) or Fluentize (700+ YouTube-based lessons, about $79/year, the lowest-priced paid library here).',
        `**Best for business English and niche careers:** ${brand}, because lessons are built around the student’s actual job (see [C1 Delivering the Numbers](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty) or [the Work theme](/esl-lessons/topics/work)). Linguahouse is strong if you want a large pre-written business worksheet archive.`,
        `**Best for true beginners (A1–A2):** ${brand} — controlled definitions, readings where about 96% of words are already familiar, and 3-tier sentence frames so beginners can start speaking ([A1 example](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team)). Plain question lists and native-speed YouTube clips are usually too hard at this level.`,
        '**Best for placement testing and a fixed grammar track:** Off2Class (adaptive placement test plus 1,000+ browser slide lessons; lessons cannot be printed).',
        '**Best for editing AI slides line by line on a small budget:** ESL Joy (free tier for 1 student; paid plans from $7.99/month in November 2026).',
        '**Best for one-off AI worksheets and YouTube transcript tasks:** Twee.',
        '**Best for an all-in-one live classroom and school LMS:** edio.ai.',
        '**Best for US K–12 school teachers:** MagicSchool AI or Diffit (US grade levels, IEP helpers, Google Classroom).',
        '**Best for kids’ PDF curricula:** ESL Pals (includes a dedicated kids’ track).',
        '**Best for quick free-talk question sheets with fluent students:** PrintDiscuss.',
        `**Best for English learners studying alone:** any free [PlanWise ESL lesson plus our tested AI tutor prompt](/esl-lessons#self-study-with-ai), which turns ChatGPT, Gemini or Claude into a structured practice partner at your CEFR level, free.`,
      ],
    },
    {
      heading: 'All 16 tools at a glance',
      paragraphs: [
        'Prices are the lowest regular paid individual price we could confirm on each provider’s public pages in November 2026. Prices and features change, so check the provider before you buy, and open each head-to-head page for sources and detail.',
      ],
      table: {
        headers: ['Tool', 'Type', 'Custom topics for your student', 'Remembers each student’s vocabulary', 'Free option', 'Paid from', 'Best for'],
        rows: [
          [`**${brand}**`, 'AI lesson builder + free library', `Yes — full lesson in ${generationTime}`, 'Yes — tracks, avoids repeats & recycles words', '200+ free lessons, no login + 14-day trial', `${priceText}, unlimited lessons & students`, '1-on-1 & small-group conversation, A1–C2'],
          ['[Engoo Daily News](/compare/engoo)', 'Free news library', 'No', 'No', 'Yes', 'Free', 'Daily news discussion'],
          ['[Breaking News English](/compare/breaking-news-english)', 'Free news library', 'No', 'No', 'Yes (3,000+ handouts)', 'Free', 'News reading & graded listening'],
          ['[PrintDiscuss](/compare/printdiscuss)', 'Question lists', 'No', 'No', 'Yes', 'Free', 'Free-talk with fluent students'],
          ['[Immerly](/compare/immerly)', 'Interactive lesson library', 'No', 'No', 'Yes (100+, A1–C1)', 'See provider', 'Quick screen-share speaking tasks'],
          ['[ESL Brains](/compare/esl-brains)', 'Pre-made video lesson library', 'No', 'No', 'Some free lessons', 'See provider', 'Adult video & podcast lessons'],
          ['[Fluentize](/compare/fluentize)', 'Pre-made YouTube lesson library', 'No', 'No', 'Sample lessons', 'About $79/year', 'B1–C1 video listening on a budget'],
          ['[Linguahouse](/compare/linguahouse)', 'Pre-made worksheet library + Expemo', 'No', 'Fixed flashcard decks only', 'Some free lessons', 'See provider (teacher tiers in PLN)', 'Large printable worksheet archive'],
          ['[ESL Pals](/compare/esl-pals)', 'Pre-made PDF curriculum', 'No', 'No', 'Sample lessons', 'See provider', 'Fixed PDF curricula, incl. kids'],
          ['[Off2Class](/compare/off2class)', 'Slide curriculum + placement test', 'No', 'Tracks curriculum progress, not vocabulary', 'Trial', 'About $24/month (annual, up to 5 students)', 'Placement & grammar track'],
          ['[ESL Joy](/compare/esl-joy)', 'AI slide decks', 'Yes, slide by slide', 'Remembers students; no vocabulary recycling into new readings', 'Free tier (1 student)', 'From $7.99/month or $59/year (up to 5 students)', 'Editable AI slides, small budget'],
          ['[Twee](/compare/twee)', 'Modular AI worksheet tools', 'One activity at a time', 'No', '5 free runs', 'See provider', 'One-off worksheets & video tasks'],
          ['[edio.ai](/compare/edio)', 'AI lessons + live classroom LMS', 'Yes', 'Tracked inside its LMS', 'See provider', 'See provider', 'All-in-one classroom & scheduling'],
          ['[MagicSchool AI & Diffit](/compare/magicschool-diffit)', 'US K–12 AI tools', 'Yes (US grade levels)', 'No', 'Free tiers', 'See provider', 'US school subjects'],
          ['[ChatGPT](/compare/chatgpt)', 'General chatbot', 'Yes, with prompting & checking', 'No — each chat starts fresh', 'Free tier', 'See provider', 'Ad-hoc tasks & explanations'],
        ],
      },
    },
    {
      heading: 'How the four approaches compare',
      table: {
        headers: ['What you need', 'Pre-made ESL libraries', 'AI worksheet / slide / K–12 tools', 'General chatbots', brand],
        rows: [
          ['Custom lesson on any niche student topic', 'No — fixed catalogue only', 'Partly — usually activity by activity, assembled by you', 'Yes, with heavy prompting & editing', `Yes — complete lesson in ${generationTime} (inspect [C1 Business Ethics](/esl-lessons/c1/the-price-of-doing-right-ethics-in-the-modern-boardroom) or [all free lessons](/esl-lessons))`],
          ['Full pedagogical sequence', 'Varies by publisher', 'Usually single tasks or editable slides; US K–12 apps are not built for ELT', 'No — unformatted text unless prompted step by step', 'Yes — 8 stages: warm-up recall, rich vocabulary, reading, recall flashcards, semantic maps, exercises & discussion ([how it works](/how-it-works))'],
          ['CEFR A1–C2 calibration', 'Usually good inside the catalogue (often B1–C1 focused)', 'Mixed (e.g. Diffit uses US grades)', 'Often drifts above the target level', 'Fixed rules for each CEFR level, checked section by section ([A1](/esl-lessons/a1/let-s-talk-about-video-games) vs. [B2](/esl-lessons/b2/can-money-buy-happiness) vs. [C1](/esl-lessons/c1/founders-failures-and-pivots-the-new-face-of-entrepreneurship))'],
          ['Per-student vocabulary tracking & recycling', 'None (or fixed flashcard decks)', 'Rare (ESL Joy remembers students but does not recycle words into new readings)', 'None — resets every chat', 'Tracks learned words, avoids duplicates and recycles earlier words into future readings & questions'],
          ['Printable student study PDF', 'Static PDF (Off2Class has no printing)', 'Export varies; often single worksheets', 'Copy and format by hand', 'Colour-coded Vocabulary Review PDF: pronunciation, 4 examples, word families, collocations, usage notes & semantic maps ([see PDF](/student-experience))'],
          ['Private learner dashboard', 'Rare, per-seat capped, or a paid add-on', 'Usually none or temporary links', 'None', 'Included for every student, no login: past lessons, spaced flashcards, topic ideas & custom lessons ([preview](/student-experience))'],
        ],
      },
    },
    {
      heading: 'What each type of tool genuinely does well',
      paragraphs: [
        '**Pre-made libraries** are reliable, human-edited and often cheap or free. If your students are happy with general topics and you mostly need something ready to teach tonight, a good library is a sensible choice. Their limit is that every student gets the same catalogue, and nothing remembers what an individual learner already knows.',
        '**AI worksheet and slide tools** are fast and flexible for one-off tasks. Their limit is that you still design the lesson yourself: choosing activities, checking the level and stitching pieces together.',
        '**General chatbots** can write almost anything, free or cheaply. Their limit is consistency: levels drift, answer keys need checking, formatting takes time, and each chat forgets the student.',
        `**${brand}** is built for the teacher who sees the same students every week. It is not the cheapest tool on this page and it does not include kids’ curricula, placement tests, live classroom software or US K–12 features. If you need those, choose the tool named above for that job.`,
      ],
    },
    {
      heading: '8 questions to ask before paying for any ESL lesson tool',
      bullets: [
        '**Can I see a complete lesson before I pay,** with no login or card? (Test PlanWise ESL on the [free library](/esl-lessons).)',
        '**Can it make a lesson on my student’s real topic,** or only on topics already in its catalogue?',
        '**Is it calibrated to CEFR levels A1–C2,** or to US school grades?',
        '**Does it remember what each student has already learned** and bring those words back later?',
        '**Will my beginners actually be able to speak,** or does it rely on open questions and native-speed video?',
        '**What does my student take away** after class: a study PDF, flashcards, a dashboard, or nothing?',
        '**Does the price cap students or lessons,** and what happens when I grow past the starter tier?',
        '**Who built it,** and do they teach real students with it?',
      ],
    },
    {
      heading: 'How we compared these tools',
      paragraphs: [
        'We compared every tool on the same eight points: custom topics, pedagogical sequence, CEFR calibration, beginner support, per-student vocabulary memory, student takeaway (PDF or dashboard), free access and price. Competitor details come from each provider’s public website and were checked in November 2026. Where a fact could not be confirmed, we say “see provider” rather than guess.',
        `PlanWise ESL claims are linked to live pages you can open yourself. If anything about another product is out of date or wrong, email [${siteFacts.email}](mailto:${siteFacts.email}) and we will correct it.`,
      ],
    },
    {
      heading: 'Detailed head-to-head comparisons',
      bullets: [
        '[PlanWise ESL vs. Engoo Daily News](/compare/engoo) — Free daily news articles vs. 200+ free structured A1–C2 lessons, custom topics in 1–2 minutes, vocabulary memory, learner dashboards and study PDFs.',
        '[PlanWise ESL vs. ESL Pals](/compare/esl-pals) — Pre-made PDF curriculum vs. custom adult and teen CEFR A1–C2 lessons with vocabulary recycling and student dashboards.',
        '[PlanWise ESL vs. Breaking News English](/compare/breaking-news-english) — Large text-based news archive vs. full-screen teaching mode, deeper vocabulary, non-news topics and study PDFs.',
        '[PlanWise ESL vs. PrintDiscuss & question lists](/compare/printdiscuss) — Plain conversation questions vs. complete lessons with pre-taught vocabulary, levelled readings, speaking frames and study PDFs.',
        '[PlanWise ESL vs. edio.ai](/compare/edio) — Live interactive classroom and LMS vs. deep vocabulary lessons, 200+ free lessons, cross-lesson memory and flat pricing.',
        '[PlanWise ESL vs. Immerly](/compare/immerly) — 100+ zero-signup A1–C1 lessons vs. 200+ free A1–C2 lessons, printable study PDFs, custom topics and vocabulary recycling.',
        '[PlanWise ESL vs. ESL Joy](/compare/esl-joy) — Editable AI slide decks vs. a complete checked 8-stage lesson, vocabulary recycling, student dashboards and study PDFs.',
        '[PlanWise ESL vs. Twee](/compare/twee) — Single-task AI tools vs. one complete, checked lesson with student vocabulary memory.',
        '[Same B1 lesson in PlanWise ESL, Twee and ESL Brains](/compare/same-lesson-three-tools) — One topic, three tools: what each gave us, how long it took and what it costs (tested 28 November 2026).',
        '[PlanWise ESL vs. MagicSchool AI & Diffit](/compare/magicschool-diffit) — US K–12 school tools vs. CEFR A1–C2 conversation lessons for teens and adults.',
        '[PlanWise ESL vs. ESL Brains](/compare/esl-brains) — Fixed adult video-lesson catalogue vs. unlimited custom topics, vocabulary recycling and learner dashboards.',
        '[PlanWise ESL vs. Fluentize](/compare/fluentize) — 700+ YouTube video lessons vs. custom A1–C2 lessons with no broken links, vocabulary recycling and dashboards.',
        '[PlanWise ESL vs. Linguahouse](/compare/linguahouse) — Large worksheet library with fixed Expemo decks vs. lessons that recycle each student’s own vocabulary.',
        '[PlanWise ESL vs. Off2Class](/compare/off2class) — Browser-only curriculum with no printing vs. flexible conversation lessons, printable PDFs and unlimited students.',
        '[PlanWise ESL vs. ChatGPT](/compare/chatgpt) — Prompting a chatbot from scratch vs. fixed CEFR rules, checked exercises, student memory and dashboards.',
        '[Same-topic CEFR quality benchmark](/compare/cefr-benchmark) — Raw AI prompt vs. a generic worksheet vs. a real PlanWise ESL B2 lesson on work-life balance.',
        '[One student, four lessons: vocabulary recycling proof](/compare/student-memory-proof) — 36 taught items, 0 duplicates, and earlier words reappearing in later readings, gap-fills, quizzes and discussions.',
      ],
    },
    {
      heading: 'Built by a working ESL teacher: check the quality with no login',
      paragraphs: [
        'Most big ESL platforms hide full lessons behind a paywall. PlanWise ESL was built by a working British ESL teacher (11 years teaching, 2,000+ students) who uses these lessons in real classes every week. Open any of these with **no login**:',
      ],
      bullets: [
        '**A1 beginner:** [First Day at a New Job: Meeting Your Team](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team) and [Let’s Talk About Video Games!](/esl-lessons/a1/let-s-talk-about-video-games), or all [A1 lessons](/esl-lessons/a1).',
        '**B1 & B2:** [Handling Difficult Guests Like a Pro (B1)](/esl-lessons/b1/handling-difficult-guests-like-a-pro), [Can Money Buy Happiness? (B2)](/esl-lessons/b2/can-money-buy-happiness) and [AI and Tomorrow’s World (B2)](/esl-lessons/b2/ai-and-tomorrow-s-world-what-comes-next).',
        '**C1 business & career:** [Delivering the Numbers: Talking About Risk and Uncertainty](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty), [Between Two Worlds: Identity and Feeling at Home](/esl-lessons/c1/between-two-worlds-identity-and-feeling-at-home), [The Price of Doing Right: Ethics in the Boardroom](/esl-lessons/c1/the-price-of-doing-right-ethics-in-the-modern-boardroom) and [Founders, Failures and Pivots](/esl-lessons/c1/founders-failures-and-pivots-the-new-face-of-entrepreneurship).',
        '**Study PDF & learner dashboard:** [Student experience & Vocabulary Review PDF](/student-experience), the [CEFR quality benchmark](/compare/cefr-benchmark) and the full [free A1–C2 library](/esl-lessons).',
      ],
    },
    {
      heading: 'Check PlanWise ESL yourself in 60 seconds',
      paragraphs: [
        'PlanWise ESL is a newer, independent, teacher-built platform with fewer reviews than decade-old catalogues. So instead of asking you to trust ratings, every claim on this page can be checked with **no login**:',
      ],
      bullets: [
        '**Vocabulary memory:** open the four lessons in the [4-lesson memory proof](/compare/student-memory-proof) (36 taught items, 0 duplicates, earlier words reused in later lessons).',
        '**CEFR calibration:** compare the A1 lesson [First Day at a New Job](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team) with the B1 [Handling Difficult Guests](/esl-lessons/b1/handling-difficult-guests-like-a-pro) and the C1 [Delivering the Numbers](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty).',
        '**Student takeaway:** download the Vocabulary Review PDF at the top of any lesson in the [free library](/esl-lessons), or preview the [learner dashboard](/student-experience).',
      ],
    },
  ],
  faq: [
    {
      question: 'What is the best AI tool for making ESL lessons?',
      answer: `It depends on how you teach. For regular one-to-one or small-group conversation students, ${brand} generates a complete CEFR A1–C2 lesson on any topic in ${generationTime} and remembers each student’s vocabulary across lessons. For one-off worksheets, Twee or ChatGPT work well. For editable AI slides, ESL Joy. For US K–12 school subjects, MagicSchool or Diffit.`,
    },
    {
      question: 'Where can I find free ESL conversation lessons with no login?',
      answer: 'PlanWise ESL has 200+ complete A1–C2 lessons across 17 themes at /esl-lessons, each with a printable Vocabulary Review PDF and no login. Breaking News English and Engoo Daily News offer free news-based materials, Immerly offers 100+ interactive A1–C1 lessons, and PrintDiscuss offers free conversation question lists.',
    },
    {
      question: 'What is the best ESL tool for Preply and italki tutors?',
      answer: `Online tutors usually see the same students every week, so student memory matters most. ${brand} tracks each student’s words, avoids repeating them and brings them back in later lessons, gives every student a zero-login flashcard dashboard, and lets you build a lesson on the student’s real job or hobby in ${generationTime}. Lessons screen-share cleanly on Preply, italki, Zoom, Meet or Teams.`,
    },
    {
      question: 'Is there a cheaper alternative to ESL Brains or Linguahouse?',
      answer: `Fluentize is one of the lowest-priced paid libraries (about $79/year in November 2026) and Breaking News English and Engoo are free. ${brand} costs ${priceText} but includes unlimited custom lessons and unlimited students, and its 200+ library lessons are free to use with no account.`,
    },
    {
      question: 'Can ChatGPT replace a dedicated ESL lesson tool?',
      answer: 'ChatGPT can draft materials, but you have to write the prompts, check that the level has not drifted, fix answer keys and format everything, and it forgets the student when the chat ends. Teachers usually spend 20–60 minutes per lesson doing this. Dedicated tools save that time and keep a consistent structure.',
    },
    {
      question: 'What is the best ESL tool for complete beginners (A1)?',
      answer: `Beginners need controlled vocabulary, short familiar texts and sentence frames to start speaking. ${brand} limits A1 definitions to very common words, writes readings where about 96% of words are already familiar, and gives 3-tier sentence frames. Native-speed YouTube lessons and open question lists are usually better from B1 upwards.`,
    },
    {
      question: 'Can English learners use these tools to study alone?',
      answer: 'Yes. Every free PlanWise ESL lesson includes a tested AI tutor prompt that turns ChatGPT, Gemini or Claude into a structured speaking partner at your level, plus a printable study PDF. Learners who want live feedback on pronunciation and natural conversation can also book 1-on-1 lessons with founder Dave Jackson at speakwithdave.com.',
    },
    {
      question: 'What is the main difference between PlanWise ESL and pre-made ESL libraries?',
      answer: `Pre-made libraries give every student the same fixed catalogue and do not remember what an individual learner already knows. ${brand} builds a complete CEFR A1–C2 lesson on any subject in ${generationTime}, tracks and recycles each student’s vocabulary, includes a Vocabulary Review PDF, and gives each student a private dashboard for flashcards and custom lessons.`,
    },
    {
      question: 'Why not use a US K–12 AI tool like MagicSchool or Diffit for ESL conversation classes?',
      answer: 'They are built around US school grades and school admin, not CEFR A1–C2 conversation teaching for teens and adults. They do not track each student’s English vocabulary over time or provide a speaking sequence with recall flashcards, collocations and tiered sentence frames.',
    },
    {
      question: 'Can I try PlanWise ESL on my own students before paying?',
      answer: `Yes. New accounts get a ${trialText} with unlimited lesson generation and no credit card, so you can compare it with whatever you use today.`,
    },
  ],
  cta: {
    heading: 'Compare PlanWise ESL on a real lesson',
    text: `Generate a full lesson on your student’s exact topic in ${generationTime}. Your ${trialText} needs no credit card.`,
    ...trialCta,
  },
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by any other product named on this page. Competitor features and prices were checked on public pages in November 2026 and can change—check each provider for current details.',
  schemaType: 'WebPage',
  updated: '2026-11-27',
};

export const compareTweePage: MarketingPage = {
  path: '/compare/twee',
  title: `${brand} vs Twee (2026): Complete Lessons vs Activity Generators`,
  description:
    `Honest comparison of ${brand} and Twee: isolated AI tools assembled by hand vs. one complete pedagogical lesson, student vocab memory & study PDFs.`,
  navLabel: 'PlanWise vs Twee',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. Twee: one complete lesson for your student, or activities you combine yourself',
  intro: [
    'Twee is one of the best-known AI toolkits built specifically for English teachers. Both Twee and PlanWise ESL are CEFR-aware and designed for ELT—not US K–12 classrooms—but they solve the job in two very different ways.',
    'Twee gives you **about 45 individual AI tools** (text and dialogue generators, question and gap-fill makers, audio and video tools, a CEFR checker) that you run one at a time and combine into a lesson yourself. It also has a public library of about 760 lesson plans, classes and assignments for students, and AI checking of student answers on Pro. PlanWise ESL builds **one complete, quality-checked pedagogical lesson** in 1–2 minutes—and remembers every student’s vocabulary across weeks.',
  ],
  verdict: {
    heading: 'PlanWise ESL vs. Twee: Which is better for 1-on-1 online ESL tutors?',
    text: `**Choose ${brand}** (${priceText} Unlimited after a ${trialText}, no card) if you teach regular 1-on-1 students on [Preply, italki](/for/online-tutors), or privately and want a complete, verified CEFR A1–C2 conversation lesson ready in ${generationTime}—which avoids re-teaching words the student already knows and reuses familiar ones where they fit, backed by a zero-login student dashboard with **spaced-repetition flashcards** and a printable color-coded Vocabulary Review PDF. **Choose Twee** if you primarily want standalone, modular activity generators (like YouTube transcript questions or single-task worksheets) that you combine into a lesson yourself, interactive class assignments with AI answer-checking, or the lowest monthly price, and do not need per-student memory.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. Twee',
      table: {
        headers: ['', 'Twee', brand],
        rows: [
          ['Core approach', 'Modular single-task AI tools that you run separately and assemble into a lesson', 'One cohesive 8-stage scientific pedagogical lesson generated in a single pass'],
          ['What is inside one lesson', 'Depends on which tools you combine (readings, questions, media transcripts, vocab tasks)', 'Warm-up recall, 5 pre-taught words (pronunciation, word families, collocations, usage notes, pictures), levelled reading, comprehension, recall flashcards, 5-part semantic maps, quiz, tiered sentence frames, fill-in-the-blanks, sentence unscramble & deep discussion'],
          ['Per-student vocabulary memory', 'None — does not keep a record of the words each learner has already studied', 'Keeps a word list for each student: new lessons avoid re-teaching known words and reuse familiar ones where they fit'],
          ['Student-facing features', 'Classes and assignments (with Google Classroom import), shareable interactive tasks, and AI checking of student answers on Pro', 'Persistent private learner dashboard (no login): all past lessons, cumulative word list, spaced-repetition flashcards, topic suggestions & student-created custom lessons (Unlimited)'],
          ['Printable student review', 'Export to PDF/Docs/Forms on paid plans', 'Complete printable Vocabulary Review study PDF (color-coded by part of speech, 4 examples per word, word families, common collocations, usage notes & semantic map)'],
          ['Quality checking', 'Teacher reviews each generated module manually', 'Automated section-by-section verification and repair before saving'],
          ['Free trial', 'Trial: 5 runs in total (Pro tools not included); Pro has a 3-day free trial', `${trialText} with unlimited lesson generations, no credit card`],
          ['Individual paid pricing', 'Basic $9/month or $6.50/month billed annually (100 runs a month); Pro $15/month or $10.50/month billed annually (unlimited* runs of basic tools, fair use). Source: twee.com/price, 28 November 2026', `${priceText} Unlimited, cancel anytime`],
          ['Free public lessons', 'About 760 lesson plans; on lessons not marked Free, visitors see the warm-up questions and the rest needs Pro', `${freeLessonsText} complete A1–C2 lessons, every section visible, no login ([open the library](/esl-lessons))`],
          ['Lesson format', 'Many library lessons are written for groups (pair and partner tasks)', 'Written for one-to-one and small-group conversation'],
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
          'Generate a text or dialogue in one Twee tool.',
          'Run a second tool for comprehension questions, a third for vocabulary tasks and a fourth for discussion prompts. Each run counts towards the 5-run trial or Basic’s 100 runs a month.',
          'Combine the outputs into a Twee lesson (or export them), then check that the level and vocabulary line up across the parts.',
          'Keep track of what the student has already learned yourself: Twee has no per-student word list or student flashcard page.',
        ],
      },
    },
    {
      heading: 'When Twee is the better choice',
      bullets: [
        'You specifically want to extract transcripts and build standalone comprehension tasks directly from a YouTube video or audio clip.',
        'You enjoy mixing and matching individual worksheet generators to assemble your own custom handouts from scratch.',
        'You teach classes and want interactive assignments with AI answer-checking, or the lowest monthly price (Twee Pro is $15/month, or $10.50 billed annually).',
        'You teach one-off classroom exercises and do not need per-student vocabulary tracking.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You want a complete, ready-to-screen-share conversation lesson in 1–2 minutes without stitching five separate tool outputs together.',
        'You teach regular one-to-one or small-group students on [Preply or italki](/for/online-tutors), [privately](/for/freelance-esl-teachers), or at a [language school](/for/language-schools) and want each lesson to build on the words the student already learned.',
        'You want every student to leave class with a polished Vocabulary Review study PDF (including common collocations, word families, usage notes and synonyms/antonyms) plus a private learner dashboard with spaced-repetition flashcards.',
        'You want students to suggest topics or create their own custom lessons on any subject between classes.',
        'See the [same B1 lesson made in PlanWise ESL, Twee and ESL Brains](/compare/same-lesson-three-tools).',
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
      answer: `Yes—especially if you want one complete conversation lesson for a particular student instead of combining separate activities. ${brand} adds a word list for each student, a private learner page with flashcards, student topic suggestions and student-created lessons, and a printable Vocabulary Review study PDF. Twee is cheaper per month and stronger for audio and video activities and class assignments.`,
    },
    {
      question: 'Does Twee track each student’s vocabulary across lessons?',
      answer: 'No. Twee has classes and assignments, but it does not keep a list of the words each student has already learned. PlanWise ESL keeps one for every student automatically, so new lessons avoid re-teaching known words.',
    },
    {
      question: 'What can I do when my Twee trial runs are used up?',
      answer: `Twee’s trial includes 5 runs in total, and a full lesson usually needs several tools (a text, vocabulary, questions, discussion). You can upgrade Twee, or try ${brand}: open any of the ${freeLessonsText} [free lessons](/esl-lessons) with no account, or start the ${trialText} (no card) and make complete lessons for your students in ${generationTime} each.`,
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
  updated: '2026-11-28',
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
    text: `**Choose ${brand}** (${priceText} Unlimited after a ${trialText}, no card) if you teach ongoing 1-on-1 or small-group adults who want unlimited custom career, industry, or hobby topics without hitting a catalogue ceiling—plus strict CEFR A1–C2 calibration, a word list for every student so new lessons avoid re-teaching known words ([see our 4-lesson live proof](/compare/student-memory-proof)), a zero-login student flashcard portal, and a printable color-coded Vocabulary Review PDF. **Choose ESL Brains** if you specifically want human-written lessons built around videos, podcasts and articles from a large pre-made adult catalogue, at a lower monthly price, and do not need bespoke student topics or per-student vocabulary memory.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. ESL Brains',
      table: {
        headers: ['', 'ESL Brains', brand],
        rows: [
          ['Lesson source', 'Pre-made catalogue of about 1,240 human-written lessons built around videos, podcasts and articles, with new lessons every month', `Custom AI-generated lessons on any topic in ${generationTime}—plus a growing free public library`],
          ['Niche student topics', 'Only what exists in the catalogue', 'Anything your student cares about: fashion retail, football marketing, software interviews, medicine, hobbies'],
          ['Pedagogical structure', 'Curated video-led speaking and vocabulary activities (PDF & e-lesson)', 'Consistent 8-stage scientific sequence: warm-up recall, rich vocab (pronunciation, word families, collocations, usage notes, pictures), levelled reading, comprehension, recall flashcards, 5-part semantic maps, quiz, tiered sentence frames, fill-in-the-blanks, sentence unscramble & deep discussion'],
          ['Per-student vocabulary memory', 'None', 'Keeps a word list for each student: new lessons avoid re-teaching known words and reuse familiar ones where they fit'],
          ['Student-created custom lessons', 'None', 'Students can create custom lessons on any subject at their level (Unlimited)'],
          ['Between-class learner portal', 'Screen-shareable e-lessons; no cumulative student flashcard dashboard', 'Private learner dashboard (no login): all past lessons, word list, spaced flashcards & next-lesson preview'],
          ['Take-home vocabulary study PDF', 'Lesson worksheet PDF', 'Dedicated Vocabulary Review study PDF (color-coded by part of speech, 4 examples/word, word families, collocations, usage notes & 5-part semantic map)'],
          ['Lesson format', 'Mostly pair work and role-plays around a video; some lessons cover two levels (for example A1/A2)', 'Written for one-to-one and small-group conversation, at one CEFR level from A1 to C2'],
          ['AI features', 'Revision Tasks Generator (Unlimited plan only) and an assistant that suggests catalogue lessons for a student’s level and interests', `Makes a complete new lesson for the student in ${generationTime}`],
          ['Free to open', 'Free Basic plan with 38 lessons; public lesson pages describe the lesson, and the worksheets need an account or a paid plan', `${freeLessonsText} complete lessons, every section visible, no login ([open the library](/esl-lessons))`],
          ['Price', 'Basic free; Premium $7/month or $74/year; Unlimited $15/month or $153/year. Source: eslbrains.com/pricing, 28 November 2026', `${priceText} Unlimited after a ${trialText} (no card)`],
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
          'Mark the lesson "We did this" so all 9 items go on the student’s word list: later lessons don’t re-teach them as new words and can reuse them where they fit ([4-lesson proof](/compare/student-memory-proof)).',
          'Share the student’s zero-login spaced-repetition flashcard link and one-click printable Vocabulary Review PDF.',
        ],
        competitorTitle: 'ESL Brains Workflow (Fixed Video Catalogue)',
        competitorSteps: [
          'Search the fixed ESL Brains catalogue for a C1 risk-forecasting video lesson—or pick the closest general business video if that exact scenario is not in the library.',
          'Double-check that your regular student has not already completed that catalogue lesson and that the embedded YouTube video still loads cleanly.',
          'Teach the curated video worksheet; if you want explicit 3-tier boardroom speaking frames (qualifying, adding caveats, conceding under questioning), build them yourself.',
          'Keep track of learned vocabulary yourself: ESL Brains has no per-student word list or student flashcard page.',
        ],
      },
    },
    {
      heading: 'When ESL Brains is the better choice',
      bullets: [
        'You specifically want lessons built around curated YouTube videos and authentic listening clips.',
        'You prefer browsing a fixed, human-edited catalogue rather than generating custom topics.',
        'You teach mostly general-interest adult classes where pre-made topics cover what you need.',
        'You want the lower price: ESL Brains Premium is $7/month and Unlimited $15/month.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You teach regular one-to-one students with specific jobs, industries or hobbies that no fixed library covers—or you teach high volume and run out of fresh catalogue lessons.',
        'You want each student’s learned words tracked automatically, so new lessons build on them instead of repeating them.',
        'You want every student to have a private learner dashboard with flashcards and the option to suggest topics or create custom lessons themselves.',
        'You want a comprehensive Vocabulary Review study PDF (word families, common collocations, usage notes and synonyms/antonyms) ready to send after every class.',
        'See the [same B1 lesson made in PlanWise ESL, Twee and ESL Brains](/compare/same-lesson-three-tools).',
      ],
    },
    {
      heading: 'What PlanWise ESL adds for high-volume one-to-one tutors',
      bullets: [
        '**Never run out of topics at your student’s level:** Fixed catalogues eventually run dry for long-term 1-on-1 students—or miss niche career, tech, medical and hobby topics altogether. PlanWise ESL generates a full 8-stage CEFR A1–C2 lesson on any topic in 1–2 minutes.',
        '**Vocabulary that builds across weeks:** each ESL Brains lesson stands on its own. PlanWise ESL keeps a word list for each student, avoids re-teaching known words, reuses familiar ones where they fit ([live 4-lesson memory proof](/compare/student-memory-proof)), and gives learners a zero-login [student dashboard](/student-experience).',
        '**Inspect full lessons free with no login:** Compare live public lessons across levels—[First Day at a New Job (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team), [Handling Difficult Guests Like a Pro (B1)](/esl-lessons/b1/handling-difficult-guests-like-a-pro), [Delivering the Numbers: Talking About Risk and Uncertainty (C1)](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty), and [Between Two Worlds (C1)](/esl-lessons/c1/between-two-worlds-identity-and-feeling-at-home)—or browse the full [public A1–C2 ESL lesson library](/esl-lessons) and download any Vocabulary Review PDF before starting a trial.',
      ],
    },
  ],
  faq: [
    {
      question: 'What is the best alternative to ESL Brains for custom student topics?',
      answer: `${brand} is built specifically for tutors who love structured adult conversation lessons but need unlimited custom topics tailored to each student. It builds a complete CEFR A1–C2 lesson in ${generationTime}, keeps a word list for every student, and includes a private learner dashboard and Vocabulary Review study PDF.`,
    },
    {
      question: 'Is there a free alternative to ESL Brains with complete lessons?',
      answer: `Yes. ${brand} publishes ${freeLessonsText} complete A1–C2 conversation lessons at /esl-lessons with every section visible and no login: warm-up, five key words, a levelled reading, comprehension, speaking frames and discussion, plus a printable study PDF. ESL Brains’ free Basic plan includes 38 lessons.`,
    },
    {
      question: 'What is a good ESL Brains alternative for A1–A2 adults?',
      answer: `${brand} writes separate A1 and A2 lessons for adults, with short definitions, a simple reading and speaking frames at three levels of support. You can open free A1 and A2 lessons at /esl-lessons/a1 and /esl-lessons/a2, or make one on your student’s own topic in ${generationTime}.`,
    },
    {
      question: 'Can I use PlanWise ESL alongside ESL Brains?',
      answer: 'Yes. Many tutors use pre-made video lessons when a catalogue topic fits, and use PlanWise ESL whenever a student wants a niche topic, custom industry vocabulary, ongoing vocabulary tracking, or a private flashcard dashboard.',
    },
    {
      question: 'Does PlanWise ESL have sample lessons I can inspect first?',
      answer: 'Yes. You can inspect complete, ready-to-teach lessons at every level in our public library at /esl-lessons, or test unlimited custom lessons during your 14-day free trial (no credit card required).',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by ESL Brains. Product features and pricing can change—check eslbrains.com for current details.',
  cta: {
    heading: 'Go beyond a fixed lesson catalogue',
    text: `Make a custom lesson on your student’s exact topic in ${generationTime}. Your ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-28',
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
        `**Open full lessons free—no paywall:** Unlike paywalled worksheet libraries, inspect complete A1–C2 lessons with zero login right now—[First Day at a New Job (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team), [Handling Difficult Guests Like a Pro (B1)](/esl-lessons/b1/handling-difficult-guests-like-a-pro), and [Delivering the Numbers: Talking About Risk and Uncertainty (C1)](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty)—or browse all ${freeLessonsText} in our [public ESL lesson library](/esl-lessons).`,
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
          ['Cross-lesson memory & portal', 'Resets every chat', 'None (or static flashcard deck)', 'Avoids re-teaching words the student already knows and reuses familiar ones where they fit, plus a private learner page (no login) with spaced flashcards and student-made lessons'],
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
          ['Paid plans', 'Plus: $7.99/month or $59/year (up to 5 students, 300 AI uses a month). Pro: $12.99/month or $99/year (unlimited students). Prices from esljoy.com/pricing, 28 November 2026', `One simple plan: ${priceText} Unlimited lessons & unlimited students, cancel anytime`],
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
      answer: `As of November 2026, ESL Joy offers a free tier (1 student, 5 custom lessons), a 30-day trial (15 AI lessons), Plus at $7.99/month or $59/year (up to 5 students, 300 AI uses a month), and Pro at $12.99/month or $99/year (unlimited students), as shown on esljoy.com/pricing on 28 November 2026. PlanWise ESL offers a ${trialText} with unlimited lesson generation (no credit card), followed by one flat ${priceText} Unlimited plan with unlimited lessons and students, cancel anytime.`,
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
          ['Memory between lessons', 'None: each generated resource starts fresh', 'After "We did this", the lesson\'s words join the student\'s list; later lessons avoid words they already know and reuse familiar ones where they fit'],
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
      heading: 'What we checked, and when',
      paragraphs: [
        'On 28 November 2026 Diffit\'s homepage described "quality, print-ready resources for any instructional need", cited a survey of 2,517 elementary and secondary teachers, and said it is "trusted by thousands of schools & districts". Its levelling is by US school grade, not CEFR, and its public pages mention neither adult learners nor conversation lessons. Its pricing page did not load its plan details for us, so check web.diffit.me/pricing for current prices. MagicSchool AI\'s public pages describe a set of classroom tools for school teachers.',
      ],
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
  title: `${brand} vs Engoo Daily News: Free Lessons, Made for Each Student`,
  description:
    `Engoo Daily News vs ${brand}, checked 28 Nov 2026: what each lesson contains, who it suits, and when a tutor should use which. Both free to open.`,
  navLabel: 'PlanWise vs Engoo',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. Engoo Daily News for ESL tutors',
  intro: [
    'Engoo Daily News is rightly popular among online tutors because it offers free, zero-login news articles every day at graded levels. For a quick current-events warm-up, it has served teachers and students well for years.',
    `Teachers start looking beyond Engoo when a student has already seen today’s trending article with another tutor, wants topics outside daily news, or needs deeper vocabulary instruction than a quick article glossary. **${brand}** keeps the **zero-login free access**—with [over 200 ready-to-teach A1–C2 free lessons](/esl-lessons) you can open and export as a printable study PDF right now—while adding ${generationTime} custom topic generation, an 8-stage pedagogical sequence, cross-lesson vocabulary memory, and private student flashcard dashboards.`,
  ],
  verdict: {
    heading: 'PlanWise ESL vs. Engoo Daily News: Which should tutors use?',
    text: `**Use Engoo Daily News** when you want today's news story with audio, free, in two minutes: it is excellent for that, and it covers Engoo levels 4–9 (roughly B1–C2). **Use ${brand}** when the lesson needs to be about your student rather than the news: any topic, any level from A1 to C2, five words taught in depth, speaking support at three levels, and a word list that carries into the next lesson. The [free library](/esl-lessons) (200+ lessons, no login) is the way to compare the two side by side; the per-student generator is the paid plan (${trialText}, no card, then ${priceText}).`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. Engoo Daily News',
      table: {
        headers: ['', 'Engoo Daily News', brand],
        rows: [
          ['Free to open, no login', 'Yes: new articles every day, free', 'Yes: [200+ finished lessons](/esl-lessons), free, plus the paid per-student generator'],
          ['Levels', 'Engoo levels 4–9, labelled Intermediate to Proficient (roughly B1–C2). No beginner lessons', 'CEFR A1 to C2, with fixed rules per level for reading length, sentence length and the words used in definitions'],
          ['Topics', 'The news: business, science, health, culture, travel. The same lesson for every learner', `Any topic, including the student's own job and interests; [17 themes](/esl-lessons) in the free library. On the paid plan a lesson is made for one student in ${generationTime}`],
          ['Vocabulary', '6 words: part of speech, IPA pronunciation, one definition, one example sentence', '5 words: pronunciation respelling, levelled definition, 4 examples, collocations, word family, usage note, picture, synonyms and antonyms, then met again in the reading, gap-fill and quiz ([how it works](/how-it-works))'],
          ['Reading', 'A news article of about 300 words with AI-generated audio at adjustable speed (a real strength)', 'A story or situation of 80–250 words by level, using each new word 2–3 times, read aloud by the teacher (no audio)'],
          ['Speaking and practice', '3 comprehension questions, 5 discussion questions and 5 further-discussion questions. No exercises', '5 warm-up questions, 3 sentence frames each at three levels of support with model answers, gap-fill, sentence unscramble, quiz, 5 discussion questions each with a short set-up and a picture'],
          ['Students with more than one tutor', 'Popular articles get taught twice: every tutor sees the same list', 'A lesson made for one student is theirs alone'],
          ['Memory between lessons', 'None: each article stands alone', 'After "We did this", the lesson\'s words join the student\'s list; later lessons avoid words they already know and reuse familiar ones where they fit'],
          ['After class', 'The article page stays online; nothing is kept per student', 'A printable study sheet, and a private student page (no login) with their lessons, word list and flashcards that return after 1, 3, 7, 14 and 30 days ([preview](/student-experience))'],
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
          'Teach it full screen: warm-up, the five words with pictures, the reading, flashcards, sentence frames, gap-fill, unscramble, quiz and discussion.',
          'Mark "We did this" after class, so next week\'s lesson avoids the words they already know and reuses familiar ones where they fit.',
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
      heading: 'What we checked, and when',
      paragraphs: [
        'On 28 November 2026 we opened the Engoo Daily News index and the lesson "Scientists Grow Potatoes in Moon Soil" (level 6, Intermediate, published that day). That lesson has six vocabulary items with IPA pronunciation, one definition and one example each; a 300-word article with AI-generated audio; three comprehension questions; five discussion questions; and five further-discussion questions. The index showed new articles daily at levels 4 to 9 across five categories, all free and open without a login. We found no beginner (A1–A2) material, no exercises beyond the questions, and nothing that records what a learner has studied. Engoo Daily News is made for Engoo\'s own tutors and learners, but anyone can read it.',
        'For the PlanWise side we used the free library lessons linked below, which anyone can open and check against this table.',
      ],
    },
    {
      heading: 'When Engoo Daily News is the better choice',
      bullets: [
        'You want today\'s news story, with audio, for a B1–C2 student, and you want it free with no preparation.',
        'Your student prefers short news-reading and quick opinion prompts rather than structured vocabulary recycling or post-class flashcards.',
        'You do not need custom niche topics, printable Vocabulary Review PDFs, or per-student progress tracking.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You want **200+ free zero-login A1–C2 conversation lessons** right now—each following a full 8-stage research sequence with a built-in 30/60-minute [teacher pacing guide](/esl-lessons#how-to-teach-free-lessons) and one-click printable PDF.',
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
        '**Seasonal & Culture theme hubs:** Browse [Holidays & Celebrations](/esl-lessons/topics/holidays), [Culture](/esl-lessons/topics/culture), or the entire [200+ free lesson library](/esl-lessons).',
      ],
    },
  ],
  faq: [
    {
      question: 'Does PlanWise ESL have a completely free zero-login lesson library like Engoo?',
      answer: 'Yes. Over 200 complete CEFR A1–C2 conversation lessons at /esl-lessons open with zero login required, include full-screen teaching mode plus a 30/60-minute teacher guide, and export a printable Vocabulary Review study sheet in one click.',
    },
    {
      question: 'How is a PlanWise ESL lesson structured differently from an Engoo Daily News article?',
      answer: 'An Engoo Daily News lesson is a news article with six glossed words and ten discussion questions, the same for everyone. A PlanWise ESL lesson follows one published teaching sequence every time: warm-up, five words taught in depth, a levelled reading, recall exercises, sentence frames at three levels of support, a quiz and discussion, and on the paid plan it is written for one student and remembers what they have learned.',
    },
    {
      question: 'What if I want custom lessons on my student’s exact topic without vocabulary repeats?',
      answer: `On the ${trialText} (no card) or the ${priceText} Unlimited plan, you choose the student, the level and any topic, and the lesson is ready in ${generationTime}. When you mark it "We did this", later lessons avoid the words that student already knows and reuse familiar ones where they fit.`,
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by Engoo. Engoo Daily News facts were checked on its public pages on 28 November 2026 and can change; check engoo.com for current details. PlanWise ESL is built by the author of this page.',
  cta: {
    heading: 'Try 200+ free lessons now—or build your student’s next custom lesson in 1–2 minutes',
    text: `Explore our zero-login A1–C2 library or start a ${trialText} (no credit card required) to unlock per-student vocabulary memory and custom topics.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-28',
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
    text: `**Choose ${brand}** (${priceText} Unlimited after a ${trialText}, no card) if you teach teen or adult one-to-one or small-group conversation students and want custom A1–C2 lessons on any niche topic in ${generationTime}, longitudinal vocabulary tracking and recycling, zero-login spaced-repetition flashcards, and colour-coded Vocabulary Review PDFs—plus [over 200 free zero-login lessons](/esl-lessons) to test before subscribing. **Choose ESL Pals** if you primarily teach young learners/kids or want a fixed, downloadable PDF curriculum with explicit grammar worksheets ready without generating anything.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. ESL Pals',
      table: {
        headers: ['', 'ESL Pals', brand],
        rows: [
          ['Core model', 'Fixed library of pre-designed downloadable PDF lesson plans', `On-demand ${generationTime} custom A1–C2 lesson builder + [200+ free zero-login lessons](/esl-lessons)`],
          ['Niche & student-specific topics', 'Limited to topics in the existing library catalogue', 'Unlimited — generate any topic from luxury retail in Shanghai to nurse handovers in Dublin'],
          ['Young learners vs. adults/teens', 'Includes dedicated Kids curriculum levels alongside General & Business English', 'Built specifically for teenage and adult conversation learners (A1–C2)'],
          ['Pedagogical consistency & lexical depth', 'Activity-based PDF worksheets varied by lesson unit', 'Enforced 8-stage SLA sequence in every lesson: 5 illustrated 8-layer vocab words, ~96%-familiar reading, 5-part semantic maps, 3-tier speaking frames, cloze, unscramble, quiz & deep discussion'],
          ['Per-student vocabulary tracking & recycling', 'None — static PDFs cannot track what individual students have learned', 'Keeps a word list per student; later lessons avoid words they already know and reuse familiar ones where they fit ([a real 4-lesson example](/compare/student-memory-proof))'],
          ['Post-class student portal', 'None — teachers send PDFs manually', 'Zero-login student dashboard with past lessons, spaced flashcards, next-lesson preview & custom lesson creation on Unlimited ([preview](/student-experience))'],
          ['Free preview library & trial', 'Selection of free sample lessons + paid tiers', `200+ full A1–C2 free lessons with no login + ${trialText} (no credit card), then flat ${priceText} Unlimited`],
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
        '**Curated theme collections:** [Holidays & Celebrations](/esl-lessons/topics/holidays) and [Culture](/esl-lessons/topics/culture), inside our [200+ free lesson library](/esl-lessons).',
        '**Research & student portal proof:** [How PlanWise ESL works](/how-it-works) and [Student Dashboard & Vocabulary Review PDF preview](/student-experience).',
      ],
    },
  ],
  faq: [
    {
      question: 'Can I also get a printable PDF in PlanWise ESL like ESL Pals?',
      answer: 'Yes. Every lesson—including all 200+ free public lessons at /esl-lessons—has a one-click download button at the top that saves a clean, print-ready HTML study document you can Print -> Save as PDF, featuring colour-coded parts of speech, phonetic guides, 4 examples per word, word families, collocations, usage notes and 5-part semantic maps.',
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
    text: `Start your ${trialText} (no credit card required) or test any of our 200+ free zero-login A1–C2 lessons at /esl-lessons.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-28',
};

export const compareBreakingNewsEnglishPage: MarketingPage = {
  path: '/compare/breaking-news-english',
  title: `${brand} vs Breaking News English: Modern Free & Custom ESL`,
  description:
    `Fair comparison of ${brand} vs Breaking News English: 200+ free modern A1–C2 lessons, clean screen-sharing, custom non-news topics & PDFs.`,
  navLabel: 'PlanWise vs Breaking News English',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. Breaking News English for conversation tutors',
  intro: [
    'Breaking News English has been a staple free resource for ESL teachers for decades, famous for its huge archive of current-events articles graded across seven levels with multi-speed listening recordings and classic printable handouts.',
    `When teaching live online 1-on-1 classes, however, many tutors find dense multi-page web handouts awkward to screen-share, and students often want to practise topics beyond breaking news (careers, culture, hobbies, interviews, travel). **${brand}** pairs **over 200 free zero-login A1–C2 conversation lessons** built cleanly for modern screen-sharing with a ${generationTime} custom lesson builder that remembers and recycles every student’s vocabulary.`,
  ],
  verdict: {
    heading: 'PlanWise ESL vs. Breaking News English: Which fits your classes?',
    text: `**Choose ${brand}** if you want modern full-screen screen-share UX and printable colour-coded study PDFs across [200+ free A1–C2 conversation lessons](/esl-lessons) (zero login), *or* want to build custom non-news lessons in ${generationTime} with per-student vocabulary recycling and private learner flashcard dashboards (${trialText}, no card, then ${priceText} Unlimited). **Choose Breaking News English** if your class revolves around graded multi-speed listening audio on current world news stories and traditional printable news drills.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. Breaking News English',
      table: {
        headers: ['', 'Breaking News English', brand],
        rows: [
          ['Free zero-login library', 'Yes — massive free archive of 3,000+ news-based handouts & audio', 'Yes — [200+ free zero-login A1–C2 conversation lessons](/esl-lessons) built on a structured 8-stage SLA flow'],
          ['Screen-sharing & student UX', 'Dense multi-exercise web pages designed largely as text handouts', 'Clean interactive full-screen lesson view with tabs/sections, illustrations, flip flashcards & mobile-friendly learner portal'],
          ['Topics beyond news', 'Almost exclusively news stories', `Both ready-made themes ([Holidays](/esl-lessons/topics/holidays), [Culture](/esl-lessons/topics/culture), work, travel, health, AI) *and* unlimited custom topics in ${generationTime}`],
          ['Vocabulary instruction depth', 'Synonym matching & phrase work inside text sheets', '5 illustrated pre-taught words: phonetic guide, levelled definition, 4 examples, word family, collocations, usage notes & 5-part semantic map'],
          ['Speaking scaffolding', 'Discussion lists & role-play prompts', 'Warm-up activation + 3-tier speaking frames (Emerging, Developing, Expanding with model answers) + illustrated deep discussion'],
          ['Listening speed drills', 'Yes — multiple audio recording speeds per article (strong strength)', 'Focused on conversation, vocabulary acquisition, reading & interactive flashcards rather than speed-graded audio'],
          ['Per-student vocabulary memory & study portal', 'None — static pages per article', 'Keeps each student’s word list; later lessons avoid words they already know and reuse familiar ones where they fit; private page with spaced flashcards and a study PDF'],
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
          'Open one of 200+ free lessons immediately at /esl-lessons—or generate a tailored CEFR A1–C2 lesson on any non-news topic for your specific student in 1–2 minutes.',
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
        'You want **200+ free zero-login A1–C2 lessons** covering real life, work, culture and holidays—each with a structured 30/60-minute [teacher pacing guide](/esl-lessons#how-to-teach-free-lessons) and a printable colour-coded Vocabulary Review PDF.',
        'You teach ongoing students and want **per-student vocabulary tracking**, natural recycling across lessons ([see live 4-lesson proof](/compare/student-memory-proof)), and zero-login **spaced-repetition flashcards** ([see student experience](/student-experience)).',
      ],
    },
    {
      heading: 'Compare live lessons right now (no login needed)',
      bullets: [
        '**Full free lesson library (200+ lessons, CEFR A1–C2):** [/esl-lessons](/esl-lessons) and the [30/60-minute Teacher Guide](/esl-lessons#how-to-teach-free-lessons).',
        '**Sample A1, B2 & C1 lessons:** [First Day at a New Job (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team), [AI and Tomorrow’s World (B2)](/esl-lessons/b2/ai-and-tomorrow-s-world-what-comes-next), and [Ethics in the Modern Boardroom (C1)](/esl-lessons/c1/the-price-of-doing-right-ethics-in-the-modern-boardroom).',
        '**Quality & pedagogy benchmarks:** [How PlanWise ESL works](/how-it-works) and [9-point CEFR Quality Benchmark](/compare/cefr-benchmark).',
      ],
    },
  ],
  faq: [
    {
      question: 'Are PlanWise ESL’s public lessons also free without an account like Breaking News English?',
      answer: 'Yes. Every lesson in /esl-lessons (over 200 complete CEFR A1–C2 lessons) opens with zero signup or login required, works cleanly in full-screen teaching mode, and includes a one-click Vocabulary Review download you can print or save as PDF.',
    },
    {
      question: 'Does PlanWise ESL only cover news, or any conversation topic?',
      answer: 'Any topic. The free library covers career, travel, technology, AI, culture, holidays and everyday conversation, and registered teachers (free 14-day trial or $19.99/month Unlimited) can generate bespoke lessons on any niche student interest in 1–2 minutes.',
    },
    {
      question: 'Why does PlanWise ESL use 5 target words and an 8-stage sequence instead of dozens of drills?',
      answer: 'Second-language research (Nation, Webb, Krashen, Roediger & Karpicke) shows learners retain vocabulary far better when 5 key words are pre-taught deeply (pronunciation, levelled definition, word families, collocations, usage notes, semantic maps), encountered multiple times in ~96%-familiar context, retrieved via flashcards, and practised through speaking frames and discussion.',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by Breaking News English. Product summaries are based on publicly accessible pages and subject to change.',
  cta: {
    heading: 'Modern screen-ready ESL lessons—free to inspect, personalised in 1–2 minutes',
    text: `Explore 200+ free A1–C2 lessons with no login, or start a ${trialText} (no credit card required) for custom student profiles and vocabulary recycling.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-27',
};

export const comparePrintDiscussPage: MarketingPage = {
  path: '/compare/printdiscuss',
  title: `${brand} vs PrintDiscuss & Question Lists: Full ESL Lessons`,
  description:
    `Fair comparison of ${brand} vs PrintDiscuss: plain question sheets vs. 200+ free A1–C2 lessons with vocab, reading, speaking frames & PDFs.`,
  navLabel: 'PlanWise vs PrintDiscuss',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. PrintDiscuss and conversation question lists',
  intro: [
    'Sites like PrintDiscuss are helpful when a tutor already has fluent intermediate or advanced speakers and just wants a clean, fast list of conversation questions to spark free talk. There is nothing wrong with a simple prompt sheet for five minutes of warm-up.',
    `Where plain question lists fall short is actual language growth—especially with shy A1–A2 learners who freeze when handed open questions alone, or paying students who expect to leave class with new vocabulary they can actually remember and reuse. **${brand}** keeps the **zero-login free access** ([over 200 ready-to-teach A1–C2 lessons across 17 curated themes](/esl-lessons)), while replacing bare question lists with an **8-stage research-backed lesson**: five deeply pre-taught illustrated words, a ~96%-familiar levelled reading, recall flashcards, 5-part semantic maps, 3-tier speaking frames, cloze, unscramble, quiz, deep discussion, and a one-click printable colour-coded Vocabulary Review PDF.`,
  ],
  verdict: {
    heading: 'PlanWise ESL vs. PrintDiscuss: Which gives students real progress?',
    text: `**Choose ${brand}** if you want **200+ free zero-login A1–C2 lessons** with built-in vocabulary instruction, levelled readings, beginner-safe speaking frames and printable colour-coded study PDFs—plus the option to build custom student-specific lessons in ${generationTime} with cross-lesson vocabulary tracking (${trialText}, no card, then ${priceText} Unlimited). **Choose PrintDiscuss** if you strictly want bare printable conversation-question lists for pure free-talk icebreakers.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. PrintDiscuss & question lists',
      table: {
        headers: ['', 'PrintDiscuss & question lists', brand],
        rows: [
          ['Free zero-login access', 'Yes — printable question topics with zero login', 'Yes — 200+ full A1–C2 lessons across [17 curated themes](/esl-lessons) with zero login & one-click PDF export'],
          ['Pre-taught vocabulary & lexical depth', 'None — relies solely on words the student already knows', '5 illustrated target words: pronunciation, levelled definition, 4 real-world examples, word family, collocations, usage notes & 5-part semantic map ([how it works](/how-it-works))'],
          ['CEFR-calibrated reading & input', 'None — questions only', '~96%-familiar 5-paragraph passage tailored to strict A1–C2 lexical rules, using every target word 2–3 times in natural context'],
          ['Support for shy or A1–A2 speakers', 'Bare questions can cause awkward silence for beginners', 'Warm-up + 3-tier speaking frames (Emerging, Developing, Expanding with model answers) so every learner can start speaking smoothly'],
          ['Controlled retrieval & recall practice', 'None', 'Interactive recall flashcards, shuffled cloze gap-fill, sentence unscramble & quiz—all verified automatically'],
          ['Memory between lessons', 'None: each question page stands alone', 'After "We did this", the lesson\'s words join the student\'s list; later lessons avoid words they already know and reuse familiar ones where they fit. Each student has a private page with flashcards ([preview](/student-experience))'],
          ['Printable takeaway sheet', 'Printable question sheet', 'Printable colour-coded Vocabulary Review PDF alongside full classroom activities'],
        ],
      },
    },
    {
      heading: 'Real-World Class Test: Preparing a 60-minute class for an A2–B1 student',
      paragraphs: [
        'Compare what a tutor gets before a class on workplace communication, travel, or seasonal celebrations:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (Free Library or ${generationTime} Custom)`,
        planwiseSteps: [
          'Open a free lesson from 17 curated themes (for example Holidays & Celebrations or Work & Careers) with zero login—or generate a student-specific A1–C2 lesson in 1–2 minutes.',
          'Move naturally through warm-up questions, 5 illustrated vocabulary cards, a levelled reading passage, recall flashcards, 5-part semantic maps, and 3-tier speaking frames.',
          'Follow the built-in 30- and 60-minute pacing guide so the discussion stage uses the target vocabulary meaningfully without awkward silence.',
          'Click Download for PDF for a print-ready Vocabulary Review sheet and send returning students their zero-login flashcard dashboard link.',
        ],
        competitorTitle: 'Plain Question-List Workflow (PrintDiscuss)',
        competitorSteps: [
          'Pick or print a sheet containing discussion questions on the general topic.',
          'Write your own pre-taught vocabulary definitions, pronunciation guides, and sample sentences on the whiteboard or chat before asking questions.',
          'Find or write a reading passage elsewhere if the student needs context and comprehensible input first.',
          'Leave the student with conversation notes in chat—with no structured flashcards, semantic maps, or cross-lesson vocabulary tracking.',
        ],
      },
    },
    {
      heading: 'What we checked, and when',
      paragraphs: [
        'On 28 November 2026 we opened printdiscuss.com and its page "Travel conversation questions" (marked B1, last reviewed April 2026). The page has a two-minute warm-up task, 18 numbered discussion questions, teacher notes with one pre-taught phrase ("pack light") and one grammar link, and print and share buttons. The site lists about 110 topic pages across nine themes, plus beginner questions and grammar-focused speaking practice. We found no reading text, no vocabulary section beyond the single pre-taught item, no exercises and nothing recorded per student. It does what it sets out to do well: a clean sheet of questions, free, straight away.',
      ],
    },
    {
      heading: 'When PrintDiscuss is the better choice',
      bullets: [
        'You teach fluent C1–C2 speakers who specifically ask for pure spontaneous debate and zero vocabulary or reading stages.',
        'You only need five extra icebreaker questions on paper at the start or end of another lesson.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You want **200+ free zero-login A1–C2 lessons** that go far beyond a list of questions—giving students real words, real reading context, and structured speaking confidence.',
        'You teach beginners or returning intermediate adults who need pronunciation guides, collocations, usage notes, and **3-tier speaking frames** so they never get stuck mid-sentence.',
        'You want regular students to retain vocabulary week after week with **automatic recycling** ([live 4-lesson proof](/compare/student-memory-proof)) and a **zero-login spaced-repetition dashboard** ([student experience](/student-experience)).',
      ],
    },
    {
      heading: 'Open live lessons free across our 17 themed collections',
      bullets: [
        '**Beginner & Elementary proof (with 3-tier speaking frames):** [First Day at a New Job: Meeting Your Team (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team) and [Making Small Talk with New People (A2)](/esl-lessons/a2/making-small-talk-with-new-people).',
        '**Popular theme hubs:** [Holidays & Celebrations](/esl-lessons/topics/holidays), [Work & Careers](/esl-lessons/topics/work), [Culture](/esl-lessons/topics/culture), and the full [200+ free lesson library](/esl-lessons).',
        '**Self-study friendly:** Adult learners can open any free lesson for independent vocabulary, reading, flashcard and speaking practice without creating an account.',
      ],
    },
  ],
  faq: [
    {
      question: 'Does PlanWise ESL also include open discussion questions like PrintDiscuss?',
      answer: 'Yes. Every PlanWise lesson opens with warm-up discussion questions and finishes with five illustrated deep-discussion questions designed around the target vocabulary—while adding the vocabulary cards, levelled reading, recall flashcards, semantic maps, tiered speaking frames, cloze, unscramble and quiz in between.',
    },
    {
      question: 'Do I have to pay or register to open PlanWise ESL’s lessons like PrintDiscuss?',
      answer: 'No. Over 200 complete CEFR A1–C2 lessons across 17 themes at /esl-lessons open with zero login or registration, and include a one-click printable Vocabulary Review download.',
    },
    {
      question: 'Can adult English learners also use the free lessons by themselves?',
      answer: 'Yes. While built for teachers to screen-share, independent adult learners (A1–C2) can study the five vocabulary cards, read the levelled text, flip the recall flashcards, complete the quiz and gap-fill, download the study PDF, and practise the discussion prompts aloud.',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by PrintDiscuss. Comparisons reflect publicly available features and are subject to change.',
  cta: {
    heading: 'Replace bare question sheets with complete 8-stage lessons—free to try now',
    text: `Browse 200+ free A1–C2 lessons across 17 themes with zero login, or start a ${trialText} (no credit card required) for custom student memory.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-28',
};

export const compareEdioPage: MarketingPage = {
  path: '/compare/edio',
  title: `${brand} vs edio.ai: Live Classroom LMS vs SLA Conversation`,
  description:
    `Honest comparison of ${brand} vs edio.ai: interactive LMS whiteboards vs. 200+ free A1–C2 lessons, SLA vocab recycling & flat $19.99/mo pricing.`,
  navLabel: 'PlanWise vs edio.ai',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. edio.ai for online tutors & schools',
  intro: [
    'edio.ai combines AI lesson creation with an interactive live digital classroom and school-management layer, where students type into live exercises on screen while teachers watch in real time. For tutors or small academies looking for an all-in-one LMS and scheduling shell, that workflow has clear appeal.',
    `Where teachers compare **${brand}** with edio.ai is **pedagogical vocabulary depth, transparent flat pricing, and zero-login student continuity**. Built by [Dave Jackson](/about)—a working British ESL teacher since 2015—PlanWise ESL pairs [over 200 free zero-login A1–C2 lessons](/esl-lessons) with an 8-stage SLA sequence ([how it works](/how-it-works)), cross-lesson vocabulary tracking with zero duplicates, a password-free spaced-repetition student dashboard, and printable colour-coded Vocabulary Review PDFs at a flat ${priceText} with unlimited students.`,
  ],
  verdict: {
    heading: 'PlanWise ESL vs. edio.ai: Which fits your teaching workflow?',
    text: `**Choose ${brand}** (${priceText} Unlimited after a ${trialText}, no card, unlimited students) if you already teach over Zoom, Preply, italki, or Teams and want deep 8-stage CEFR A1–C2 conversation lessons, automatic cross-lesson vocabulary memory ([live 4-lesson audit](/compare/student-memory-proof)), zero-login spaced flashcards, printable colour-coded study PDFs, and 200+ free public lessons to inspect right away. **Choose edio.ai** if you specifically want an integrated virtual LMS with student scheduling and real-time collaborative exercise typing inside the platform itself.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. edio.ai',
      table: {
        headers: ['', 'edio.ai', brand],
        rows: [
          ['Primary strength', 'Interactive digital lessons + live LMS & school scheduling tools', `Deep SLA conversation lessons in ${generationTime} + longitudinal per-student vocabulary memory`],
          ['Teaching environment', 'Built around students joining its own interactive classroom interface', 'Screen-share cleanly anywhere (Preply, italki, Zoom, Google Meet, Teams or in person) + one-click full-screen mode'],
          ['Free public preview library', 'Account/platform-oriented onboarding', '[200+ complete CEFR A1–C2 lessons](/esl-lessons) across 17 curated themes free with zero login'],
          ['Vocabulary acquisition depth', 'Interactive lesson vocabulary & self-checking exercises', '5 illustrated 8-layer words: pronunciation, levelled definition, 4 examples, word family, collocations, usage notes & 5-part semantic map'],
          ['Per-student vocabulary recycling', 'Student tracking inside course/LMS environment', 'Avoids words the student has already learned and reuses familiar ones where they fit ([a real 4-lesson example](/compare/student-memory-proof))'],
          ['Take-home PDF & zero-login dashboard', 'Interactive platform access', 'Printable colour-coded Vocabulary Review PDF + zero-login spaced flashcard dashboard (no student passwords needed)'],
          ['Pricing model', 'Tiered/seat-oriented plans depending on academy scale', `Flat ${priceText} Unlimited lessons & unlimited students after a ${trialText} (no credit card); email dave@planwiseesl.com for school teams`],
        ],
      },
    },
    {
      heading: 'Real-World Workflow: Teaching regular 1-on-1 students across platforms',
      paragraphs: [
        'Compare daily preparation and student retention for an independent tutor teaching students on existing video platforms:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (${generationTime})`,
        planwiseSteps: [
          'Pick your student and CEFR level (A1–C2) with any custom topic—or open one of 200+ free zero-login lessons across 17 themes.',
          'Screen-share the verified 8-stage lesson inside your existing classroom window (Preply, italki, Zoom, or Meet) in clean full-screen mode—no asking students to switch apps or create accounts.',
          'Click "We did this" after class so PlanWise updates the student’s learned word bank, avoids repeats next lesson, and schedules natural vocabulary recycling.',
          'Send the student’s single private flashcard dashboard link and printable colour-coded Vocabulary Review PDF in one click.',
        ],
        competitorTitle: 'Integrated LMS Classroom Workflow (edio.ai)',
        competitorSteps: [
          'Set up classes, scheduling, and student seats inside the integrated LMS platform.',
          'Build or adapt digital interactive lessons for students to complete inside the LMS interface.',
          'Ask learners on external tutoring marketplaces or video calls to log into an extra classroom environment rather than keeping everything inside screen-share + a single password-free link.',
          'Manage classroom software features when your main bottleneck is actually level-accurate lesson content and cross-lesson vocabulary retention.',
        ],
      },
    },
    {
      heading: 'When edio.ai is the better choice',
      bullets: [
        'You want an all-in-one interactive digital classroom and school-management system with live collaborative exercise typing built in.',
        'You are replacing both scheduling software and interactive homework boards under one roof.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You already teach on Preply, italki, Zoom, or in person and want **zero friction for students**—no student logins, no extra app installs, just clean screen-share plus a single private dashboard link and printable PDF.',
        'You care deeply about **second-language vocabulary depth and retention**: 96%-familiar readings, 5-part semantic maps, reading-sourced idioms with right/wrong notes, and 0-duplicate cross-lesson recycling.',
        'You want to **test real lessons with zero signup first** inside our [200+ free library](/esl-lessons) before starting a ${trialText}.',
      ],
    },
    {
      heading: 'Inspect the quality live (no account required)',
      bullets: [
        '**Live cross-lesson recycling audit:** [One Student, Four Lessons (36 items, 0 duplicates)](/compare/student-memory-proof).',
        '**CEFR benchmark & student portal:** [9-point CEFR Benchmark](/compare/cefr-benchmark) and [Student Experience & Vocabulary Review PDF excerpt](/student-experience).',
        '**Sample free A1–C1 lessons:** [A1 Workplace](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team), [B1 Hospitality](/esl-lessons/b1/handling-difficult-guests-like-a-pro), [C1 Business Risk](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty).',
      ],
    },
  ],
  faq: [
    {
      question: 'Do students need to create an account or pay for seats in PlanWise ESL?',
      answer: `No. Students never need a password or account—every student gets one private zero-login dashboard link included in your flat ${priceText} Unlimited plan (with unlimited students), and teachers can start with a ${trialText} without a credit card.`,
    },
    {
      question: 'Can small language schools use PlanWise ESL without changing their Zoom or Meet setup?',
      answer: 'Yes. Lessons open in one click inside full-screen teaching mode for any video tool or classroom screen, and schools can email dave@planwiseesl.com for straightforward multi-teacher setups.',
    },
    {
      question: 'How does PlanWise verify lesson quality before saving?',
      answer: 'Every generated lesson automatically checks that vocabulary cards, 3-tier speaking frames, comprehension, quiz, cloze answers, and discussion prompts are structurally valid before the teacher sees it—and automatically repairs or regenerates any broken section.',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by edio.ai. Product details are based on publicly available information and subject to change.',
  cta: {
    heading: 'Keep your classroom simple—upgrade your lesson pedagogy and memory',
    text: `Inspect 200+ free A1–C2 lessons at /esl-lessons, or test custom lessons and per-student vocabulary recycling with a ${trialText} (no credit card).`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-27',
};

export const compareImmerlyPage: MarketingPage = {
  path: '/compare/immerly',
  title: `${brand} vs Immerly: Free ESL Lessons & Custom Vocab Memory`,
  description:
    `Fair comparison of ${brand} vs Immerly: interactive free adult lessons vs. 200+ A1–C2 lessons, 17 themes, printable PDFs & custom vocab memory.`,
  navLabel: 'PlanWise vs Immerly',
  eyebrow: 'Comparison',
  h1: 'PlanWise ESL vs. Immerly for free & personalised adult ESL lessons',
  intro: [
    'Immerly has earned a good reputation among tutors because it gives teachers 100+ interactive ESL lessons across A1–C1 with no signup required, making it easy to screen-share speaking tasks and role-plays quickly.',
    `Teachers and self-study adult learners comparing **${brand}** with Immerly quickly notice three differences: PlanWise ESL offers **over 200 complete zero-login lessons spanning all six CEFR levels including C2 Proficient** (organised across [17 searchable themes](/esl-lessons)), adds a **one-click printable colour-coded 8-layer Vocabulary Review study PDF** at the top of every lesson, and lets teachers go beyond any static library by generating custom lessons in **${generationTime}** with **per-student vocabulary memory** and private learner dashboards.`,
  ],
  verdict: {
    heading: 'PlanWise ESL vs. Immerly: Which should ESL tutors choose?',
    text: `**Choose ${brand}** if you want **200+ free zero-login lessons covering A1 through C2** across 17 curated themes, printable colour-coded Vocabulary Review PDFs, explicit 8-stage vocabulary depth (word families, collocations, usage notes, 5-part semantic maps & reading-sourced idioms), *plus* the ability to build unlimited custom student lessons in ${generationTime} with cross-lesson vocabulary recycling (${trialText}, no card, then ${priceText} Unlimited). **Choose Immerly** if you specifically want an interactive role-play format from its existing A1–C1 catalogue.`,
  },
  sections: [
    {
      heading: 'Side by side: PlanWise ESL vs. Immerly',
      table: {
        headers: ['', 'Immerly', brand],
        rows: [
          ['Free zero-login library size & levels', '100+ interactive lessons (A1–C1)', '**200+ complete lessons across all six CEFR levels (A1–C2)** including C2 Proficient, with zero login'],
          ['Theme discovery & filtering', 'Topic browsing across static library', '**17 curated theme collections** (Work, Tech, AI, Health, Money, Culture, Holidays & Celebrations, Travel, etc.) + level & search filters'],
          ['Printable student takeaway PDF', 'Browser-centric interactive lessons', 'One-click **Vocabulary Review download** (print-ready colour-coded study sheet with phonetic guide, 4 examples, word family, collocations, usage notes & 5-part semantic map)'],
          ['Pedagogical structure per lesson', 'Speaking games, discussion & role-play flow', 'Fixed 8-stage SLA sequence + built-in 30/60-min teacher pacing guide ([see how it works](/how-it-works))'],
          ['Custom topic generation', 'Fixed lesson collection only', `Unlimited bespoke lessons on any student goal or niche industry in ${generationTime}`],
          ['Per-student vocabulary tracking & recycling', 'None — static collection', 'Remembers every student’s words, avoids repeats, and recycles earlier vocabulary naturally ([4-lesson proof](/compare/student-memory-proof))'],
          ['Zero-login student dashboard', 'None', 'Private student link with lesson history, next-lesson preview, word list & spaced-repetition flashcards'],
        ],
      },
    },
    {
      heading: 'Real-World Teaching Test: From free library into ongoing 1-on-1 retention',
      paragraphs: [
        'See how teachers use the free library on day one and expand into tailored student courses:',
      ],
      workflowProof: {
        planwiseTitle: `${brand} Workflow (Free Library + Optional Custom Tracking)`,
        planwiseSteps: [
          'Open any of 200+ free A1–C2 lessons across 17 themes with zero signup—complete with full-screen teaching mode and a 30/60-minute pacing guide.',
          'Pre-teach 5 illustrated words in depth (phonetics, levelled definition, 4 examples, word family, collocations, usage notes, semantic map), read a ~96%-familiar text, run flashcards/tiered frames/exercises, and spend the core of class talking.',
          'Click Download for PDF at the top of any free lesson to save/print the colour-coded study sheet for your student.',
          'When you add regular students on a free 14-day trial or Unlimited ($19.99/mo), build custom topics in 1–2 minutes without ever repeating previously learned vocabulary.',
        ],
        competitorTitle: 'Static No-Signup Library Workflow (Immerly)',
        competitorSteps: [
          'Pick a ready-made lesson from the existing A1–C1 interactive catalogue.',
          'Screen-share the lesson activities during class.',
          'Build your own separate word-family, collocation, or C2 material when an advanced student or niche professional asks for something specific.',
          'Track student vocabulary and send study summaries separately—no cross-lesson memory or student dashboard exists.',
        ],
      },
    },
    {
      heading: 'When Immerly is the better choice',
      bullets: [
        'You want a quick game/role-play style lesson from a fixed A1–C1 collection and never need C2 lessons, printable study PDFs, or custom topic creation.',
      ],
    },
    {
      heading: `When ${brand} is the better choice`,
      bullets: [
        'You want a larger free zero-login library (**200+ complete lessons**) that includes **C2 Proficient**, **17 clear theme collections**, and a built-in **30/60-minute teaching guide**.',
        'You want students to leave every free or custom class with a clean, printable **colour-coded Vocabulary Review PDF**.',
        'You teach regular students and want custom topics in 1–2 minutes, **zero accidental vocabulary repeats**, natural recycling across lessons, and **private zero-login learner dashboards**.',
      ],
    },
    {
      heading: 'Browse our free A1–C2 library & themes right now (zero login)',
      bullets: [
        '**Explore all 17 themes:** [Browse the full 200+ free library](/esl-lessons) or jump straight into [Holidays & Celebrations](/esl-lessons/topics/holidays), [Work & Careers](/esl-lessons/topics/work), or [Artificial Intelligence](/esl-lessons/topics/artificial-intelligence).',
        '**Inspect C2 Proficient & A1 Beginner side by side:** [Subtle Irony, Idiom and Nuance in Modern Media (C2)](/esl-lessons/c2/subtle-irony-idiom-and-nuance-in-modern-media) vs. [First Day at a New Job (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team).',
        '**See the study PDF & dashboard proof:** [Student Experience & PDF preview](/student-experience) and [Live 4-lesson Vocabulary Recycling Proof](/compare/student-memory-proof).',
      ],
    },
  ],
  faq: [
    {
      question: 'Are PlanWise ESL’s 200+ public lessons completely free without logging in like Immerly?',
      answer: 'Yes. Every lesson in /esl-lessons (over 200 lessons spanning A1 through C2 across 17 curated themes) opens immediately with zero login, includes full-screen teaching mode, and exports a printable Vocabulary Review PDF in one click.',
    },
    {
      question: 'Does PlanWise ESL cover C2 Proficient as well as A1–C1?',
      answer: 'Yes. Every CEFR band from A1 Beginner to C2 Proficient is supported in both the free public library and custom lesson generation—with C2 readings written at 180–250 words of native-grade, idiomatic prose and synonym-nuance usage notes.',
    },
    {
      question: 'Can adult English learners also study the free lessons independently?',
      answer: 'Yes. Learners can open any public lesson without an account to pre-learn the 5 target words, read the levelled passage, practise recall flashcards, quiz and cloze, download the study PDF, and use the discussion questions for speaking practice.',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by Immerly. Comparisons reflect publicly accessible product features and are subject to change.',
  cta: {
    heading: 'Explore 200+ free A1–C2 lessons—or personalise your next class in 1–2 minutes',
    text: `Browse all 17 curated themes with zero login at /esl-lessons, or start a ${trialText} (no credit card needed) for custom student memory.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-27',
};

export const sameLessonThreeToolsPage: MarketingPage = {
  path: '/compare/same-lesson-three-tools',
  title: `Same B1 Lesson in ${brand}, Twee and ESL Brains (2026 Test)`,
  description:
    'One B1 topic, three tools: what a teacher gets from PlanWise ESL, Twee and ESL Brains for "Can robots compete with humans at work?" Tested 28 Nov 2026.',
  navLabel: 'Same lesson, three tools',
  eyebrow: 'Side-by-side test',
  h1: 'One B1 topic in three tools: PlanWise ESL, Twee and ESL Brains',
  intro: [
    'A tutor asks: *"My B1 student works in a shop and is worried about robots taking jobs. What can I teach on Thursday?"* We took that topic, **"Can robots compete with humans at work?"**, to three tools on 28 November 2026 and wrote down what each one gave us, how long it took and what it costs.',
    `${brand} is our product, so we have kept to facts you can check: the lessons are linked, and we say where the other tools do better.`,
  ],
  verdict: {
    heading: 'The short answer',
    text: `**${brand}** made a complete B1 lesson on the exact topic in **41 seconds**, with pictures for all five words within 90 seconds, and you can [open the full lesson free](/esl-lessons/b1/robots-at-work-friends-or-rivals). **ESL Brains** had a ready-made, human-written B1 lesson the moment we opened it, free on its Basic plan, but it is about robots in **sports**, built around two videos and group debates, and was published in 2021. **Twee** has every building block (vocabulary list, text, questions, gap-fill), but you run one tool at a time and combine them yourself. We could not time Twee: our trial account showed "Your trial has ended".`,
  },
  sections: [
    {
      heading: 'What each tool gave us for the same topic',
      table: {
        headers: ['', brand, 'ESL Brains', 'Twee'],
        rows: [
          ['Topic you get', 'Exactly the requested topic: robots and jobs ("Robots at Work: Friends or Rivals?")', 'Closest free match: "Can robots compete with humans?", about robots in sports', 'Any topic you type into each tool'],
          ['Level', 'B1', 'B1', 'B1, chosen in each tool'],
          ['Time until ready to teach', '41 seconds for the full lesson; all word pictures within 90 seconds', 'Instant: the lesson already exists (you search the catalogue for it)', 'Not timed (trial ended). One run per tool, and a full lesson needs about 5–7 tools'],
          ['What is inside', 'Warm-up (5 questions), 230-word reading "The Cashier Who Lost Her Job", 5 key words (automate, replace, efficient, creativity, redundant) with pictures, vocabulary check, 3 phrasal verbs and expressions, speaking frames, gap-fill, sentence unscramble, 5 discussion questions and a 6-question quiz', 'Lead-in on types of robot, photo discussion, commonly confused sports words, a word cloud, two videos about sports robots, technology vocabulary matching and a debate, with an optional design-a-robot project. Student and teacher worksheets and a Google Slides e-lesson', 'Whatever you build, for example: Essential Vocabulary on a Topic, Create a Text with Your Vocabulary, Open Questions for a Text, Discussion Questions, Fill in the Gap and Word-Definition Matching. ABCD and true/false questions are Pro tools'],
          ['Class format', 'One-to-one or small group', 'Pairs and groups (discussion and debates)', 'Your choice; outputs go into a Twee lesson you can share as an interactive worksheet'],
          ['Made for one particular student', 'Yes: choose the student, and words they already know are not re-taught', 'No: the same lesson for every class', 'No per-student word memory'],
          ['Cost', `Free during the ${trialText}; then ${priceText} Unlimited`, 'This lesson is free (Basic plan, 38 free lessons); Premium $7/month, Unlimited $15/month', 'Trial: 5 runs in total; Basic $9/month (100 runs); Pro $15/month'],
          ['Open it yourself', '[Robots at Work: Friends or Rivals? (B1)](/esl-lessons/b1/robots-at-work-friends-or-rivals), free, no login', 'eslbrains.com/robots-b1-technology-lesson-plan (overview is public; worksheets need a free account)', 'twee.com (sign-up needed)'],
        ],
      },
    },
    {
      heading: 'How we ran the test',
      bullets: [
        'Same topic and level everywhere: "Can robots compete with humans at work?", B1, on 28 November 2026.',
        `${brand}: one click on Generate, with no student selected. We timed it from the click until the lesson was saved (41 seconds). Pictures load while the lesson is already open.`,
        'ESL Brains: we searched its free lessons for the closest B1 topic and opened it with a free account. We describe the lesson from its public overview and do not reproduce its worksheets.',
        'Twee: we opened its tools in a free account. The account showed "Your trial has ended", so we list the tools a teacher would combine (from Twee’s own tool list) instead of timing them.',
        'Prices come from each company’s pricing page on the same day and can change.',
      ],
    },
    {
      heading: 'Where each tool is the better choice',
      bullets: [
        '**ESL Brains** if you teach groups and want real video content and a human-written lesson that is ready the moment you open it, at a lower monthly price.',
        '**Twee** if you like building your own activities, want interactive worksheets students complete online, or need audio and video tools. It is also cheaper per month.',
        `**${brand}** if you teach one-to-one or small groups and want a finished lesson on your student’s exact topic in ${generationTime}, which remembers the words that student has already learned.`,
      ],
    },
    {
      heading: 'More comparisons',
      bullets: [
        '[PlanWise ESL vs. Twee](/compare/twee): complete lessons vs. activity generators, with prices and trial limits.',
        '[PlanWise ESL vs. ESL Brains](/compare/esl-brains): custom lessons for each student vs. a large pre-made video catalogue.',
        `[All ESL lesson tools compared](/compare) and the [free lesson library](/esl-lessons) (${freeLessonsText} complete lessons, no login).`,
      ],
    },
  ],
  faq: [
    {
      question: 'Which tool makes a complete ESL lesson fastest?',
      answer: `In our test, ${brand} made a complete B1 lesson in 41 seconds. A ready-made library lesson (ESL Brains) is instant when one exists on your topic, but you may not find your student’s exact topic. Twee needs one run per activity, which you then combine.`,
    },
    {
      question: 'Can I see the lessons from this test?',
      answer: `Yes. The ${brand} lesson is free with no login at /esl-lessons/b1/robots-at-work-friends-or-rivals. The ESL Brains lesson is on its free Basic plan (free account needed). Twee needs a sign-up.`,
    },
  ],
  disclaimer: `${brand} is not affiliated with Twee or ESL Brains. Tested on 28 November 2026; features, lessons and prices can change. If anything here is out of date or wrong, email ${siteFacts.email} and we will correct it.`,
  cta: {
    heading: 'Make this lesson for your own student',
    text: `Type your student’s topic and get a complete CEFR lesson in ${generationTime}. Your ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-28',
};

export const comparisonPages: MarketingPage[] = [
  compareHubPage,
  compareEngooPage,
  compareEslPalsPage,
  compareBreakingNewsEnglishPage,
  comparePrintDiscussPage,
  compareEdioPage,
  compareImmerlyPage,
  compareEslJoyPage,
  compareTweePage,
  sameLessonThreeToolsPage,
  compareMagicSchoolDiffitPage,
  compareEslBrainsPage,
  compareFluentizePage,
  compareLinguahousePage,
  compareOff2ClassPage,
  cefrBenchmarkPage,
  studentMemoryProofPage,
];
