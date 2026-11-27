/**
 * "How this lesson is built": the teaching purpose of each part of a public
 * lesson, in the order the lesson has them.
 *
 * Shown on public lesson pages to people (client/src/pages/full-screen-lesson-page.tsx)
 * and to crawlers and AI assistants (server/lesson-prerender.ts), so both read
 * the same words. Only parts the lesson actually contains are listed, with
 * counts taken from the lesson itself; the research behind each step is on
 * /how-it-works. Never uses the lesson's private topic field.
 */
import { tryDecodeLessonContent } from './lesson-content';

export interface LessonStage {
  /** Section type the stage was built from. */
  type: string;
  /** Short name of the stage. */
  name: string;
  /** What it does for the student, with counts from this lesson. */
  purpose: string;
}

const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Current (tiered) sentence frames that have words in at least one level, as the lesson page shows them. */
function usableTieredFrames(section: any): any[] {
  if (section?.version !== 'v2_pedagogical') return [];
  return arr(section.pedagogicalFrames).filter((f) =>
    ['emerging', 'developing', 'expanding'].some((tier) => str(f?.tieredFrames?.[tier]?.frame)),
  );
}

function stageFor(section: any): LessonStage | null {
  switch (section?.type) {
    case 'warmup':
    case 'warm-up':
      return { type: 'warmup', name: 'Warm-up', purpose: 'Discussion questions that connect the topic to the student’s own life and recall vocabulary they already know about the subject.' };
    case 'vocabulary': {
      const words = arr(section.words).filter((w) => str(w?.term) || str(w?.word));
      const n = words.length;
      if (!n) return null;
      const extras: string[] = [];
      if (words.some((w) => Array.isArray(w?.wordFamily?.words) && w.wordFamily.words.length > 0)) extras.push('word families');
      if (words.some((w) => str(w?.usageNotes))) extras.push('usage notes');
      if (words.some((w) => w?.semanticMap && (w.semanticMap.synonyms?.length || w.semanticMap.antonyms?.length))) {
        extras.push('recall flashcards and synonyms/antonyms');
      }
      const extraText = extras.length ? `, plus ${extras.join(', ')}` : '';
      return { type: 'vocabulary', name: 'Key vocabulary', purpose: `${plural(n, 'new word', 'new words')}, pre-taught before the reading with a definition, pronunciation guide, example sentences and a picture${extraText}, giving a solid grounding before reading.` };
    }
    case 'reading':
      if (!arr(section.paragraphs).some((p) => str(p))) return null;
      return { type: 'reading', name: 'Reading', purpose: 'A text written for this CEFR level that uses each new word two or three times in context, giving the student something meaningful to react to.' };
    case 'comprehension': {
      const n = arr(section.questions).length;
      return { type: 'comprehension', name: 'Comprehension', purpose: n ? `${plural(n, 'question', 'questions')} that check the new words: retrieval practice, not rereading.` : 'Questions that check the new words: retrieval practice, not rereading.' };
    }
    case 'sentenceFrames':
    case 'grammar': {
      const tiered = usableTieredFrames(section).length;
      if (tiered) {
        return { type: 'sentenceFrames', name: 'Sentence frames', purpose: `${plural(tiered, 'speaking pattern', 'speaking patterns')}, each at three levels of support (emerging, developing, expanding) with model answers—especially helpful scaffolding for beginners and less confident speakers.` };
      }
      return { type: 'sentenceFrames', name: 'Sentence frames', purpose: 'Useful speaking patterns for the topic, so the student knows how to start an answer.' };
    }
    case 'expressions':
      return { type: 'expressions', name: 'Idioms and phrasal verbs', purpose: 'Expressions taken from the reading, each with its meaning, an example and a speaking question.' };
    case 'cloze':
      return { type: 'cloze', name: 'Gap-fill', purpose: 'The new words again, in a shuffled order, so the student recalls them by meaning in context.' };
    case 'sentenceUnscramble':
      return { type: 'sentenceUnscramble', name: 'Sentence unscramble', purpose: 'Natural sentences with the new words to put back in order, reinforcing grammar and collocation.' };
    case 'discussion':
    case 'speaking': {
      const n = arr(section.questions).length;
      return { type: 'discussion', name: 'Discussion', purpose: n ? `${plural(n, 'open question', 'open questions')} designed to talk deeply about the subject while actively using the lesson’s target vocabulary: the heart of a conversation lesson.` : 'Open questions designed to talk deeply about the subject while actively using the lesson’s target vocabulary: the heart of a conversation lesson.' };
    }
    case 'quiz':
    case 'assessment':
      return { type: 'quiz', name: 'Quiz', purpose: 'A short retrieval check that brings every new word back once more.' };
    default:
      return null;
  }
}

/** The lesson's stages in its own order, each type once. */
export function lessonStages(content: unknown): LessonStage[] {
  const decoded = tryDecodeLessonContent(content);
  const seen = new Set<string>();
  const stages: LessonStage[] = [];
  for (const section of arr(decoded?.sections)) {
    const stage = stageFor(section);
    if (!stage || seen.has(stage.type)) continue;
    seen.add(stage.type);
    stages.push(stage);
  }
  return stages;
}

/** What the lesson teaches, for structured data: its new words and speaking functions. */
export function lessonTeaches(content: unknown): string[] {
  const sections = arr(tryDecodeLessonContent(content)?.sections);
  const words = sections
    .filter((s) => s?.type === 'vocabulary')
    .flatMap((s) => arr(s.words).map((w) => str(w?.term)))
    .filter(Boolean);
  const functions = sections
    .filter((s) => s?.type === 'sentenceFrames')
    .flatMap((s) => usableTieredFrames(s).map((f) => str(f?.languageFunction)))
    .filter(Boolean);
  return [...new Set([...words.map((w) => `Vocabulary: ${w}`), ...functions.map((f) => `Speaking: ${f}`)])];
}

/** What every library lesson shares, for the browse pages (the details are on each lesson and /how-it-works). */
export const libraryDesign =
  'Each is a complete conversation lesson built in the same scientific pedagogical sequence: warm-up vocabulary recall, pre-taught key words (with pronunciation, word families and usage notes), a levelled reading, recall flashcards and synonyms/antonyms, targeted practice (quiz, sentence frames, gap-fill and sentence unscramble), and deep discussion using the target vocabulary.';

export const lessonDesign = {
  heading: 'How this lesson is built',
  intro:
    'This is a complete conversation lesson built on a scientific pedagogical formula, not a generic worksheet: recall prior topic vocabulary, pre-teach the new words in depth, read in context, practise active recall with flashcards and synonyms/antonyms, build accuracy with exercises, and finish with deep discussion.',
  tracking:
    'Teachers who use PlanWise ESL also get per-student vocabulary tracking (recycling earlier words into future readings and questions), a private learner dashboard with flashcards and custom lesson creation, and a downloadable study PDF.',
  linkLabel: 'The research behind each step',
  href: '/how-it-works',
};

/**
 * One sentence on what sets this lesson apart from a generic worksheet,
 * claiming only what its own stages show; null when it shows none of it.
 */
export function lessonDifference(stages: LessonStage[], content: unknown): string | null {
  const has = (t: string) => stages.some((s) => s.type === t);
  const sections = arr(tryDecodeLessonContent(content)?.sections);
  const tiered = sections.some((s) => s?.type === 'sentenceFrames' && usableTieredFrames(s).length);
  const points: string[] = [];
  if (has('vocabulary') && has('reading')) {
    points.push(has('comprehension') || has('cloze') || has('quiz')
      ? 'the new words are taught before the reading and met again in the activities'
      : 'the new words are taught before the reading');
  }
  if (tiered) points.push('the speaking is supported at three levels');
  if (has('discussion')) points.push('most of the time goes on the student talking');
  if (!points.length) return null;
  const list = points.length === 1 ? points[0] : `${points.slice(0, -1).join(', ')} and ${points.at(-1)}`;
  return `Unlike a generic worksheet, ${list}.`;
}

export const freeLibraryTeachingGuide = {
  heading: 'How to Teach Any Free PlanWise ESL Lesson (30-Min & 60-Min Guide)',
  intro:
    'Every free lesson on PlanWise ESL opens with zero login in full-screen teaching mode for Preply, italki, Zoom, or in-person whiteboards, and includes a one-click printable Vocabulary Review PDF. Follow this six-stage timing plan to keep your student speaking for most of the class.',
  stages: [
    {
      stage: '1. Warm-up recall',
      min30: '3–4 mins',
      min60: '5–7 mins',
      howToTeach:
        'Ask the opening questions before showing new vocabulary so the student switches on words and ideas they already know.',
    },
    {
      stage: '2. Pre-teach 5 key words',
      min30: '5–6 mins',
      min60: '8–10 mins',
      howToTeach:
        'Walk through pronunciation, the levelled definition, example sentences, word families, collocations, usage notes, and the visual card for each of the five words.',
    },
    {
      stage: '3. Levelled reading + check',
      min30: '6–7 mins',
      min60: '10–12 mins',
      howToTeach:
        'Read the short CEFR-calibrated passage aloud or together—where each target word appears two or three times in context—then run the comprehension questions.',
    },
    {
      stage: '4. Recall & guided practice',
      min30: '5–6 mins',
      min60: '10–12 mins',
      howToTeach:
        'Use recall flashcards (say the meaning and an original sentence before flipping), synonyms/antonyms, tiered sentence frames (emerging, developing, expanding), gap-fill, unscramble, and the quiz.',
    },
    {
      stage: '5. Deep target-vocab discussion',
      min30: '8–10 mins',
      min60: '15–20 mins',
      howToTeach:
        'Spend the largest share of class on the open discussion prompts and real-world scenarios, nudging the student gently to use today’s five words.',
    },
    {
      stage: '6. Recap & printable PDF',
      min30: '1–2 mins',
      min60: '2–3 mins',
      howToTeach:
        'Highlight two phrases the student used well and click the download button at the top of the lesson to send the colour-coded Vocabulary Review PDF in chat.',
    },
  ],
};

export const freeLibraryFaq = [
  {
    question: 'Are these ESL conversation lessons completely free with no login?',
    answer:
      'Yes. Over 160 complete CEFR A1–C2 adult conversation lessons at planwiseesl.com/esl-lessons are 100% free to open, screen-share in full-screen mode, and download as printable Vocabulary Review PDFs with zero account or signup required.',
  },
  {
    question: 'How do I teach a free PlanWise ESL lesson in a 30-minute or 60-minute class?',
    answer:
      'Follow the built-in six-stage sequence: spend 3–7 minutes on warm-up recall, 5–10 minutes pre-teaching the five target words, 6–12 minutes on the levelled reading and comprehension check, 5–12 minutes on recall flashcards, tiered sentence frames and practice exercises, 8–20 minutes in deep discussion, and 1–3 minutes sending the Vocabulary Review PDF.',
  },
  {
    question: 'Can I screen-share these lessons on Preply, italki, or Zoom and print handouts?',
    answer:
      'Yes. Every lesson includes a clean full-screen teaching view built for video classrooms and interactive whiteboards, plus a one-click print-ready Vocabulary Review sheet formatted to save as PDF or print cleanly to paper.',
  },
  {
    question: 'What CEFR levels and adult topics are included in the free library?',
    answer:
      'Lessons cover every CEFR band from A1 Beginner to C2 Proficiency across practical adult topics—including workplace communication, tech, healthcare, hospitality, finance, travel, expat life, and everyday conversation—without childish worksheets.',
  },
  {
    question: 'What if my student wants a lesson on a specific job or topic not in the free library?',
    answer:
      'You can create a student profile in PlanWise ESL (5-day unlimited free trial, no credit card) to generate a complete CEFR A1–C2 lesson on any topic in 1–2 minutes, with automatic per-student vocabulary tracking, cross-lesson recycling, and a password-free learner flashcard dashboard.',
  },
];
