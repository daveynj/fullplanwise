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
    'See dedicated workflow guides for [Preply tutors](/for/preply-tutors) and [italki tutors & teachers](/for/italki-tutors).',
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

export const preplyTutorsPage: MarketingPage = {
  path: '/for/preply-tutors',
  title: `AI ESL Lesson Planner for Preply Tutors | ${brand}`,
  description:
    `Build CEFR A1–C2 ESL lessons for Preply students in ${generationTime}: 8-stage pedagogy, natural vocab recycling, zero-login student hub & study PDFs.`,
  navLabel: 'For Preply Tutors',
  eyebrow: 'For Preply tutors',
  h1: 'The AI ESL lesson planner built for Preply tutors',
  intro: [
    'Teaching weekly 1-on-1 students on Preply means balancing two realities: unpaid trial prep and platform commissions eat into your hourly rate, while keeping regular subscribers renewing month after month depends on giving every student genuinely personalised, structured classes.',
    `${brand} turns that prep bottleneck into a **${generationTime}** workflow: pick your Preply student, choose their CEFR level (A1–C2) and any topic they care about, and open a complete 8-stage teacher-led lesson ready to screen-share—with automatic per-student vocabulary memory, a zero-login learner dashboard, and a printable color-coded Vocabulary Review PDF you can drop straight into Preply chat.`,
  ],
  sections: [
    {
      heading: 'Why Preply tutors outgrow platform slides and static PDF libraries',
      bullets: [
        '**Unpaid trial prep hurts your real hourly rate:** Spending 30–45 minutes preparing a bespoke trial lesson for a new Preply student before they subscribe cuts deeply into your income.',
        '**Students recognise recycled library PDFs:** Regular adult learners on Preply have often seen the same generic static worksheets from previous tutors—and static catalogues rarely cover a student’s specific job interview, industry, or hobby.',
        '**Weekly subscriptions need real continuity:** When a student books 2–3 lessons a week with you, they notice immediately whether you remember what they learned last Tuesday or treat every class like day one.',
        '**Homework friction kills review:** Sending extra logins or messy raw documents means busy adult students never revise between classes.',
      ],
    },
    {
      heading: 'Built for weekly Preply schedules and trial-to-subscriber conversions',
      paragraphs: [
        'Every PlanWise ESL lesson follows the same [8-stage research-backed sequence](/how-it-works) and is verified section by section before class:',
      ],
      bullets: [
        `**Zero unpaid prep panic:** Enter any topic and CEFR level (A1–C2) and open a full screen-shareable lesson in ${generationTime}—even minutes before a trial call.`,
        '**Deep 8-stage structure every class:** Warm-up recall → 5 illustrated pre-taught words (phonetic pronunciation, levelled definition, 4 examples, word families, collocations, usage notes) → ~96%-familiar reading & comprehension → recall flashcards & 5-part semantic maps → quiz, 3-tier sentence frames, shuffled gap-fill & sentence unscramble → deep target-vocab discussion.',
        '**Memory between lessons:** Mark a class "We did this" and its words join the student’s list. Later lessons avoid words the student already knows and reuse familiar ones where they fit.',
        '**Zero-login student dashboard & printable Vocabulary Review PDF:** Share one private link inside Preply chat (no extra student login) for past lessons, spaced flashcards and topic requests—or download the color-coded Vocabulary Review PDF in one click.',
      ],
    },
    {
      heading: 'Side by side for Preply tutors',
      table: {
        headers: ['What matters on Preply', 'Preply library / static PDFs', 'General chatbot (ChatGPT)', brand],
        rows: [
          ['Custom trial lesson on student’s niche topic', 'Limited to fixed catalogue', '20–45 min prompting & fixing', `Ready in ${generationTime}`],
          ['CEFR A1–C2 calibration', 'Varies by worksheet', 'Often drifts above target level', 'Fixed CEFR rules per level, checked automatically'],
          ['Per-student vocabulary tracking across weeks', 'None', 'Resets every chat', 'Keeps each student’s word list, avoids words they already know and reuses familiar ones where they fit'],
          ['Student review between weekly classes', 'Static PDF or none', 'None unless formatted manually', 'Zero-login private learner dashboard + color-coded printable Vocabulary Review PDF'],
          ['Student-requested custom lessons', 'None', 'None', 'Students suggest topics or create custom lessons on Unlimited'],
          ['Cost for full-time tutors', 'Per-library subscriptions', 'Time spent editing raw text', `Flat ${priceText} Unlimited lessons & students (${trialText}, no card)`],
        ],
      },
    },
    {
      heading: 'Inspect free teacher-led lessons before signing up',
      paragraphs: [
        'Want to see exactly what a Preply student sees on screen? Open any lesson in our [free public A1–C2 ESL lesson library](/esl-lessons) with **no login required**, download its color-coded Vocabulary Review PDF, or preview the [Student Experience](/student-experience) and [tool comparisons](/compare).',
      ],
    },
  ],
  faq: [
    {
      question: 'How fast can I prepare a personalised Preply trial lesson with PlanWise ESL?',
      answer: `In ${generationTime}. As soon as a prospective Preply student tells you their level and goals, enter the topic and CEFR level (A1–C2) to get a complete 8-stage screen-shareable lesson—plus a color-coded Vocabulary Review PDF to send right after the trial.`,
    },
    {
      question: 'Do my Preply students need to create an account to use the learner dashboard?',
      answer: 'No. Every student gets a private zero-login dashboard link you can paste straight into Preply messages, giving them access to past lessons, their cumulative word list, spaced flashcards, topic ideas, and (on Unlimited) custom lesson creation.',
    },
    {
      question: 'Does PlanWise ESL limit how many Preply students I can track?',
      answer: `No. Your ${trialText} (no credit card) and the flat ${priceText} Unlimited plan include unlimited lessons and unlimited students, cancel anytime.`,
    },
    {
      question: 'Can I also use PlanWise ESL if I teach another language on Preply?',
      answer: `${brand} is built specifically for ESL and EFL tutors, though tutors teaching another language can specify that target language in the topic box to generate structured lessons in that language as well.`,
    },
    {
      question: 'My Preply student just wants to chat. Is a full lesson too much?',
      answer: 'No, if you let the conversation lead. Many adults on Preply learn English as a hobby: for travel, films, books or talking to people. Use the warm-up and the five words as a starting point, skip the extra exercises, and give most of the lesson to the discussion questions, which move the topic into the student’s own life. The free library has lessons on cooking, sport, films, music, travel and the outdoors, and the paid plan writes one on the student’s own hobby: see the guide to [teaching adults who learn English as a hobby](/guides/esl-lessons-for-adults-learning-english-as-a-hobby).',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by Preply. Preply is a trademark of its respective owner.',
  cta: {
    heading: 'Eliminate unpaid Preply lesson prep this week',
    text: `Generate a complete CEFR A1–C2 lesson for your next Preply student in ${generationTime}. Your ${trialText} requires no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};

export const italkiTutorsPage: MarketingPage = {
  path: '/for/italki-tutors',
  title: `AI ESL Lesson Planner for italki Tutors & Teachers | ${brand}`,
  description:
    `Generate CEFR A1–C2 ESL lessons for italki packages in ${generationTime}: 8-stage pedagogy, natural vocab recycling, zero-login student hub & study PDFs.`,
  navLabel: 'For italki Tutors',
  eyebrow: 'For italki tutors & teachers',
  h1: 'The AI ESL lesson planner built for italki tutors and teachers',
  intro: [
    'On italki, both Community Tutors and Professional Teachers win repeat 5-lesson and 10-lesson packages by delivering engaging, structured classes tailored to each learner’s exact goals—without burning hours of unpaid evenings writing materials from scratch.',
    `${brand} gives independent italki tutors a repeatable **${generationTime}** system: pick your student, enter any topic and CEFR level (A1–C2), and teach from a complete 8-stage screen-shareable lesson backed by per-student vocabulary memory, a zero-login student dashboard, and a printable color-coded Vocabulary Review PDF.`,
  ],
  sections: [
    {
      heading: 'Built for 5-lesson and 10-lesson italki packages—not one-off worksheets',
      bullets: [
        '**Turn single bookings into multi-lesson packages:** Give every learner a visible sense of progression from Lesson 1 to Lesson 10 with tracked vocabulary and a personal online review hub.',
        '**Zero unpaid prep between back-to-back calls:** Generate a complete, verified CEFR A1–C2 lesson on any niche subject (job interviews, tech stand-ups, IELTS speaking, travel, hobbies) in 1–2 minutes.',
        '**No awkward student logins:** Paste your student’s private learner dashboard link straight into italki chat so they can revise flashcards, review past lessons, and suggest next week’s topic with one tap.',
        '**Polished post-lesson PDF takeaway:** Download the color-coded Vocabulary Review study PDF—complete with pronunciation, 4 real-world examples, word families, collocations, usage notes, and 5-part semantic maps—and send it after class.',
      ],
    },
    {
      heading: 'What is inside every italki lesson you generate',
      paragraphs: [
        'Instead of raw chatbot text or disconnected single-task worksheets, every lesson follows PlanWise ESL’s [8-stage pedagogical sequence](/how-it-works):',
      ],
      bullets: [
        '**Warm-up vocabulary recall** to get your italki student talking immediately.',
        '**5 illustrated pre-taught target words** with phonetic pronunciation, CEFR-levelled definition, 4 real-world examples, word families + explanation, common collocations, and usage notes.',
        '**5-paragraph CEFR reading (~96% familiar text) & comprehension** calibrated strictly from A1 to C2.',
        '**In-lesson recall flashcards & 5-part semantic maps** (synonyms, antonyms, related concepts, contexts, associated words).',
        '**Guided speaking & accuracy practice:** quiz, 3-tier sentence frames (emerging/developing/expanding—ideal for nervous beginners), shuffled fill-in-the-blanks, and sentence unscramble.',
        '**Deep discussion** built around the target vocabulary, plus optional idioms and phrasal verbs from A2 up.',
      ],
    },
    {
      heading: 'Side by side for independent italki teachers',
      table: {
        headers: ['What keeps italki students rebooking', 'Static ESL PDF libraries', 'DIY / ChatGPT prep', brand],
        rows: [
          ['Tailored to any niche student interest', 'Catalogue topics only', '20–60 min prompting & editing', `Any topic in ${generationTime}`],
          ['Vocabulary memory across a 10-lesson package', 'None', 'Manual notes / spreadsheets', 'Keeps the student’s word list automatically, avoids words they already know and reuses familiar ones where they fit'],
          ['Between-class student self-study', 'None or paid add-on', 'None', 'Zero-login student dashboard (past lessons, flashcards, topic ideas & custom lessons on Unlimited)'],
          ['Take-home review sheet', 'Static worksheet PDF', 'Manual formatting', 'Color-coded printable Vocabulary Review PDF ready in one click'],
          ['Pricing for active tutors', 'Per-library subscription', 'Unpaid evening prep hours', `Flat ${priceText} Unlimited lessons & students (${trialText}, no card)`],
        ],
      },
    },
    {
      heading: 'Preview real lessons free with zero signup',
      paragraphs: [
        'Open any complete A1–C2 lesson in our [public free ESL lesson library](/esl-lessons) right now (zero login required), download the color-coded Vocabulary Review PDF at the top, or see how PlanWise ESL compares against [ESL Joy](/compare/esl-joy), [Fluentize](/compare/fluentize), [Twee](/compare/twee), [ESL Brains](/compare/esl-brains), and [Linguahouse](/compare/linguahouse).',
      ],
    },
  ],
  faq: [
    {
      question: 'Is PlanWise ESL good for both italki Community Tutors and Professional Teachers?',
      answer: 'Yes. Community Tutors get a structured, research-backed 8-stage conversation flow with teacher notes and tiered speaking frames ready out of the box, while Professional Teachers save hours of weekly prep on niche adult, business, medical, and IELTS topics without sacrificing CEFR rigour.',
    },
    {
      question: 'How does PlanWise ESL help me keep italki students across multi-lesson packages?',
      answer: 'When you mark a lesson "We did this", its words join that student’s list. Later lessons avoid words the student already knows and reuse familiar ones where they fit, and the student’s zero-login flashcard dashboard updates automatically.',
    },
    {
      question: 'How do I share homework or review sheets with my italki students?',
      answer: 'Share their zero-login learner dashboard link directly in italki chat for interactive flashcards and past lessons, or download the color-coded Vocabulary Review PDF in one click and attach it as their post-class takeaway.',
    },
    {
      question: 'Can I test PlanWise ESL with my current italki students before paying?',
      answer: `Yes. Every new account gets a ${trialText} with unlimited lesson generation and no credit card needed, followed by ${priceText} Unlimited, cancel anytime.`,
    },
    {
      question: 'My italki student just wants to talk, not study. Does PlanWise still help?',
      answer: 'Yes. Students who learn English for pleasure still want new words and something to react to; what they do not want is an exam. Pick a lesson on their interest, teach the five words quickly, skip the extra exercises and let the discussion run. On the paid plan you can make the lesson about their actual hobby, such as their allotment or their football team. There is a guide to [teaching adults who learn English as a hobby](/guides/esl-lessons-for-adults-learning-english-as-a-hobby).',
    },
  ],
  disclaimer: 'PlanWise ESL is not affiliated with or endorsed by italki. italki is a trademark of its respective owner.',
  cta: {
    heading: 'Plan your next italki package in minutes',
    text: `Build a tailored CEFR A1–C2 lesson in ${generationTime} with zero-login student review included. Your ${trialText} needs no credit card.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated,
};

export const newEslTeachersPage: MarketingPage = {
  path: '/for/new-esl-teachers',
  title: `Best ESL Lesson Planner for New Teachers & First-Time Tutors | ${brand}`,
  description:
    `New ESL teacher guide: start with 180+ free CEFR A1–C2 lessons, built-in teacher notes, beginner speaking frames & 1–2 min custom prep.`,
  navLabel: 'For New ESL Teachers',
  eyebrow: 'For new ESL teachers & newly certified tutors',
  h1: 'The ESL lesson planner built to give new teachers confidence from lesson one',
  intro: [
    'Your first months teaching ESL—whether you have just earned your TEFL or CELTA certificate or taken on your first online tutoring students—bring two big hurdles: figuring out how to pace a 45–60 minute conversation class without awkward silence, and creating material at the right CEFR level without spending two hours preparing for every one-hour class.',
    `${brand} removes both hurdles. Every lesson follows the same **8-stage second-language pedagogy** ([see the research](/how-it-works)), comes with **teacher notes**, **3-tier beginner-safe speaking frames** so A1–A2 learners never freeze, and a **30- and 60-minute pacing guide**—starting with [over 180 complete zero-login lessons](/esl-lessons) you can teach today before ever starting a paid plan.`,
  ],
  verdict: {
    heading: 'Why new ESL teachers choose PlanWise ESL',
    text: `New teachers don’t just need a pile of worksheets—they need a repeatable, research-backed lesson structure that keeps students talking cleanly for 30 or 60 minutes. **${brand}** gives new tutors [180+ free zero-login A1–C2 lessons](/esl-lessons), step-by-step teaching flow, beginner scaffolding (A1 definitions restricted to the 500 most common words + 3-tier speaking frames), one-click printable study PDFs, and **${generationTime} custom lesson creation** (${trialText}, no card, then ${priceText} Unlimited).`,
  },
  sections: [
    {
      heading: 'How PlanWise ESL solves first-year teaching challenges',
      bullets: [
        '**No guesswork on lesson structure:** Every class moves naturally from warm-up recall → 5 deeply pre-taught illustrated words → a ~96%-familiar levelled reading → recall flashcards → semantic maps → quiz, tiered sentence frames, cloze & unscramble → deep discussion.',
        '**Built-in 30- & 60-minute pacing:** Our [Teacher Guide on /esl-lessons](/esl-lessons#how-to-teach-free-lessons) shows exact minute-by-minute timing so you never run out of material after 20 minutes or rush through the discussion.',
        '**True beginner scaffolding (A1–A2):** Every lesson includes 3-tier speaking frames (Emerging, Developing, Expanding with model answers) so nervous beginners always have natural phrasing to build on instead of silent stares.',
        '**Strict CEFR levelling checked before saving:** You choose A1–C2 and PlanWise enforces reading length, vocabulary ceiling, and definition simplicity automatically—no accidentally handing a B2 text to an A2 student.',
        '**Look polished to every new student:** Send students a clean colour-coded Vocabulary Review PDF after class and their own zero-login learner dashboard—turning one-off trial lessons into long-term packages.',
      ],
    },
    {
      heading: 'What a new teacher gets out of the box vs. winging it with raw AI',
      table: {
        headers: ['First-year challenge', 'Prompting ChatGPT or generic sites', `${brand}`],
        rows: [
          ['Lesson structure & timing', 'Must prompt every stage yourself and invent transitions', 'Complete 8-stage SLA lesson sequence + [30/60-min pacing guide](/esl-lessons#how-to-teach-free-lessons) every time'],
          ['CEFR accuracy for beginners', 'Often writes definitions harder than the target word', 'A1 definitions capped to the 500 most common words (<8 words), checked automatically'],
          ['Student freezing in conversation', 'Open questions alone can stall shy learners', '3-tier sentence frames with model answers support speaking step by step'],
          ['Free material to practise right now', 'Must write prompts before seeing any lesson', '[180+ complete A1–C2 lessons free with zero login](/esl-lessons) + printable PDFs'],
          ['Tracking regular students', 'No student profiles or word history', 'Free student profiles remember taught words & sync with a zero-login student flashcard dashboard'],
        ],
      },
    },
    {
      heading: 'Start teaching today with zero login: free lessons & guides for new teachers',
      bullets: [
        '**Open & teach free A1–C2 lessons:** Browse [180+ ready-to-teach lessons](/esl-lessons), seasonal [Holidays & Celebrations](/esl-lessons/topics/holidays), or [Culture](/esl-lessons/topics/culture)—including [First Day at a New Job (A1)](/esl-lessons/a1/first-day-at-a-new-job-meeting-your-team) and [Making Small Talk with New People (A2)](/esl-lessons/a2/making-small-talk-with-new-people).',
        '**Learn the method in 5 minutes:** Read [How to plan an ESL conversation lesson](/guides/how-to-plan-an-esl-conversation-lesson), [CEFR levels A1–C2 explained](/guides/cefr-levels-explained), and [How PlanWise ESL works](/how-it-works).',
        '**Try custom lessons free:** When you’re ready to build bespoke lessons for a specific student, start a ${trialText} (unlimited lessons, no credit card required).',
      ],
    },
  ],
  faq: [
    {
      question: 'Can a brand-new TEFL teacher use PlanWise ESL without paying first?',
      answer: `Yes. Over 180 complete A1–C2 conversation lessons at /esl-lessons—plus full-screen teaching mode, the built-in 30/60-minute pacing guide, and printable Vocabulary Review PDFs—are 100% free with zero signup required. When you want custom lessons and student profiles, every new account gets a ${trialText} with no credit card.`,
    },
    {
      question: 'What stops a beginner lesson from being too difficult?',
      answer: 'At A1 Beginner, readings are kept to 80–120 clear sentences, target-word definitions use only the 500 most common English words in under 8 words, ~96% of reading vocabulary stays familiar, and 3-tier speaking frames give nervous students scaffolded starting phrases with model answers.',
    },
    {
      question: 'How much does PlanWise ESL cost after the trial?',
      answer: `${priceText} Unlimited—including unlimited custom lessons across A1–C2, unlimited student profiles, cross-lesson vocabulary tracking, zero-login student flashcard dashboards and printable study PDFs, cancel anytime.`,
    },
  ],
  cta: {
    heading: 'Teach your next class with complete confidence',
    text: `Explore 180+ free A1–C2 lessons right now—or build your first custom lesson in ${generationTime} on a ${trialText} (no credit card required).`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-27',
};

export const experiencedEslTeachersPage: MarketingPage = {
  path: '/for/experienced-esl-teachers',
  title: `Best ESL Lesson Planner for Experienced Teachers & Tutors | ${brand}`,
  description:
    `Built by a 10+ year ESL teacher for veteran tutors: replace Drive PDF chaos with 1–2 min custom A1–C2 lessons & cross-lesson vocab memory.`,
  navLabel: 'For Experienced ESL Teachers',
  eyebrow: 'For experienced ESL teachers & veteran tutors',
  h1: 'Built by a working 11-year ESL teacher for experienced tutors who refuse to hand out generic worksheets',
  intro: [
    'Once you have taught for several years, your bottleneck is rarely "how do I run a class?"—it is **time and continuity across dozens of regular students**. Digging through years of Google Drive PDFs, finding static library articles your B2–C2 professionals have outgrown, or spending 30–60 minutes adapting ChatGPT prompts so the reading stays at the right CEFR band quietly eats your evenings.',
    `${brand} was built by [Dave Jackson](/about)—a working British ESL teacher since 2015 with over 2,000 students taught who still plans his own students’ lessons with it. It gives experienced teachers a repeatable, research-grounded architecture ([Nation’s Four Strands](/how-it-works)) that creates bespoke lessons in **${generationTime}**, tracks every student’s vocabulary across months without accidental repeats, and gives learners a private zero-login dashboard that keeps them rebooking.`,
  ],
  verdict: {
    heading: 'Why experienced ESL teachers upgrade to PlanWise ESL',
    text: `Veteran teachers stay with **${brand}** because it protects teaching quality while slashing prep time from 30–60 minutes to **${generationTime}**: true **B2–C2 & niche industry customization** (supply chain, SaaS, medical, finance, leadership), **per-student vocabulary memory** with 0 duplicate target words and natural recycling ([inspect our live 4-lesson proof](/compare/student-memory-proof)), **verified CEFR rules** ([9-point CEFR audit](/compare/cefr-benchmark)), zero-login student flashcard dashboards, and printable 8-layer study PDFs (${trialText}, then ${priceText} Unlimited).`,
  },
  sections: [
    {
      heading: 'Why veteran tutors outgrow static libraries and manual prompting',
      bullets: [
        '**Stop hunting through 500 unsorted Drive PDFs:** Generate the exact lesson your C1 product manager or B2 hospitality director needs today in 1–2 minutes—or bring in your own 5 target words for the class.',
        '**True cross-lesson memory (not one-off worksheets):** When you click *"We did this"*, PlanWise records taught vocabulary on that student’s profile, strictly excludes learned words from being re-taught as new, and passes earlier words back so they resurface naturally in future readings and quizzes.',
        '**Depth worthy of advanced learners (B2, C1, C2):** Words include phonetic pronunciation, 4 nuanced examples, word families, collocations, register/usage notes, 5-part semantic maps, and reading-sourced idioms with right-vs.-wrong comparisons.',
        '**Automated quality gate before you open the tab:** Every lesson checks that the cloze, comprehension, quiz, flashcards, semantic maps and 3-tier speaking frames are valid before saving—no mid-class broken gap-fills.',
        '**Stronger student retention & perceived value:** Giving every regular student their own zero-login dashboard (past lessons, next-lesson preview, spaced flashcards, topic ideas & custom lesson creation on Unlimited) plus colour-coded Vocabulary Review PDFs makes private packages feel like a tailored executive course.',
      ],
    },
    {
      heading: 'Real courses built for working professionals (from Dave’s own teaching)',
      bullets: [
        '**Tailored C1 Business & Industry track:** *The Rise of Luxury Chinese Fashion Brands*; *Swipe, Stream, Sell: Live Commerce vs Traditional Retail*; *The Evolution of Chinese Workplace Culture: "Quiet Quitting" vs. Extreme Ambition*.',
        '**Inspect live public C1–C2 examples right now (zero login):** [Delivering the Numbers: Talking About Risk and Uncertainty (C1)](/esl-lessons/c1/delivering-the-numbers-talking-about-risk-and-uncertainty), [The Price of Doing Right: Ethics in the Boardroom (C1)](/esl-lessons/c1/the-price-of-doing-right-ethics-in-the-modern-boardroom), [Founders, Failures and Pivots (C1)](/esl-lessons/c1/founders-failures-and-pivots-the-new-face-of-entrepreneurship), and [Subtle Irony, Idiom and Nuance in Modern Media (C2)](/esl-lessons/c2/subtle-irony-idiom-and-nuance-in-modern-media).',
        '**Verify the pedagogy & recycling data yourself:** [One Student, Four Lessons: 36 taught items, 0 duplicates](/compare/student-memory-proof), [CEFR Benchmark: PlanWise vs. raw AI](/compare/cefr-benchmark), and [Student Experience & Vocabulary Review PDF excerpt](/student-experience).',
      ],
    },
  ],
  faq: [
    {
      question: 'As an experienced teacher with custom vocab lists, can I supply my own target words?',
      answer: 'Yes. You can either let PlanWise select 5 CEFR-appropriate target words around your topic (excluding words the student already knows) or type your own specific target words so the reading, exercises, flashcards and study PDF are built directly around them.',
    },
    {
      question: 'Does it actually hold up for advanced B2, C1 and C2 professionals?',
      answer: 'Yes. At C1–C2, readings run 180–250 words of natural magazine-grade prose with implied meaning and nuance, usage notes distinguish close synonyms (for example assimilate vs. integrate), and idioms are extracted straight from the reading with explicit right-vs.-wrong comparisons. Judge our live C1 and C2 lessons at /esl-lessons with zero login.',
    },
    {
      question: 'How does per-student vocabulary recycling work over months of 1-on-1 classes?',
      answer: 'Marking a lesson "We did this" stores its words on that student’s profile. Future lessons strictly skip already-taught target words so you never repeat words accidentally, while passing earlier vocabulary to lesson generation so past words reappear in readings and questions only when they fit naturally.',
    },
  ],
  cta: {
    heading: 'Keep your teaching craft—reclaim 10+ hours of prep a month',
    text: `Test PlanWise ESL on your toughest returning B2 or C1 student with a ${trialText} (unlimited lessons, no credit card), then ${priceText} Unlimited.`,
    ...trialCta,
  },
  schemaType: 'WebPage',
  updated: '2026-11-27',
};

export const icpPages: MarketingPage[] = [
  onlineTutorsPage,
  preplyTutorsPage,
  italkiTutorsPage,
  freelanceTeachersPage,
  languageSchoolsPage,
  newEslTeachersPage,
  experiencedEslTeachersPage,
];
