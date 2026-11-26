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
