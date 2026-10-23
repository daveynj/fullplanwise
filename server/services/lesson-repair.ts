import type { LessonGenerateParams } from '@shared/schema';
import {
  checkLessonSection,
  findSection,
  fixLessonInPlace,
  fixSection,
  isMoreUsable,
  lessonSectionContext,
  type SectionCheck,
} from './lesson-check';
import {
  LESSON_SECTION_NAMES,
  LESSON_SECTION_TYPES,
  type LessonSectionContext,
  type LessonSectionType,
} from './lesson-prompt';

/**
 * Repairs a newly generated lesson before it is saved, one section at a time.
 *
 * Slips with one clear fix are fixed in place (see lesson-check.ts). A section
 * that is still missing, broken or short of items is requested again on its
 * own, once, like the grammar spotlight retry; the whole lesson is never
 * regenerated. When the retry doesn't produce a complete section, the lesson
 * keeps whichever version is more complete if it is usable, and otherwise
 * leaves the section out, so teachers never get an empty or broken section.
 * Every failed repair is logged with console.error.
 */

/** The part of the OpenRouter service this needs; kept narrow so tests can pass a stub. */
export interface LessonSectionRegenerator {
  regenerateLessonSection(
    type: LessonSectionType,
    params: LessonGenerateParams,
    lesson: LessonSectionContext,
    studentVocabulary?: string[],
    model?: string,
  ): Promise<unknown>;
}

export interface LessonRepairOptions {
  params: LessonGenerateParams;
  regenerator: LessonSectionRegenerator;
  studentVocabulary?: string[];
  model?: string;
  /** Start of each log line, e.g. "[Job 1a2b]". */
  logPrefix?: string;
}

export interface FailedRepair {
  type: LessonSectionType;
  /** What the lesson has now: the more complete of the two versions, or no section. */
  outcome: 'kept original' | 'kept retry' | 'left out';
  detail: string;
}

export interface LessonRepairReport {
  fixedInPlace: string[];
  /** Sections that were missing, broken or incomplete after the fixes in place. */
  problems: SectionCheck[];
  repaired: LessonSectionType[];
  failed: FailedRepair[];
}

type Section = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Parses the model's reply to a section request: a JSON object, possibly
 * inside a markdown code fence or with a line of text before or after it.
 */
export function parseSectionJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('The reply contains no JSON object');
  return JSON.parse(text.slice(start, end + 1));
}

/**
 * The section in a reply: the section object itself, or the section wrapped in
 * {"section": ...}, {"<type>": ...} or a lesson-style {"sections": [...]}.
 */
export function sectionFromReply(reply: unknown, type: LessonSectionType): Section | undefined {
  if (!isRecord(reply)) return undefined;
  let section: unknown = reply;
  if (Array.isArray(reply.sections)) {
    section = reply.sections.find((item) => isRecord(item) && item.type === type);
  } else if (reply.type !== type && isRecord(reply.section)) {
    section = reply.section;
  } else if (reply.type !== type && isRecord(reply[type])) {
    section = reply[type];
  }
  if (!isRecord(section)) return undefined;
  const { type: _ignored, ...rest } = section;
  return { type, ...rest };
}

/** Puts a section in place of the lesson's section of that type, or adds it in the usual position. */
function putSection(content: { sections: unknown[] }, type: LessonSectionType, section: Section): void {
  const existing = content.sections.findIndex((item) => isRecord(item) && item.type === type);
  if (existing !== -1) {
    content.sections[existing] = section;
    return;
  }
  const order = LESSON_SECTION_TYPES.indexOf(type);
  const next = content.sections.findIndex(
    (item) => isRecord(item) && LESSON_SECTION_TYPES.indexOf(item.type as LessonSectionType) > order,
  );
  content.sections.splice(next === -1 ? content.sections.length : next, 0, section);
}

function removeSection(content: { sections: unknown[] }, type: LessonSectionType): void {
  const existing = content.sections.findIndex((item) => isRecord(item) && item.type === type);
  if (existing !== -1) content.sections.splice(existing, 1);
}

/**
 * Checks the lesson and repairs it in place. Never throws for a failed
 * section request; the outcome is logged and returned.
 */
export async function repairLesson(
  content: { sections: unknown[]; [key: string]: unknown },
  options: LessonRepairOptions,
): Promise<LessonRepairReport> {
  const { params, regenerator, studentVocabulary = [], model } = options;
  const prefix = options.logPrefix ? `${options.logPrefix} ` : '';
  const report: LessonRepairReport = { fixedInPlace: [], problems: [], repaired: [], failed: [] };

  // Read before the fixes in place, which can remove unusable items.
  const context = lessonSectionContext(content);

  report.fixedInPlace = fixLessonInPlace(content);
  for (const fix of report.fixedInPlace) console.log(`${prefix}Lesson check: fixed in place: ${fix}`);

  report.problems = LESSON_SECTION_TYPES.map((type) => checkLessonSection(type, findSection(content, type))).filter(
    (check) => check.status !== 'ok',
  );
  if (!report.problems.length) {
    console.log(`${prefix}Lesson check passed: all ${LESSON_SECTION_TYPES.length} sections are complete`);
    return report;
  }

  for (const problem of report.problems) {
    const state = problem.status === 'missing' ? 'missing' : `${problem.status} (${problem.detail})`;
    console.warn(`${prefix}Lesson check: ${LESSON_SECTION_NAMES[problem.type]} section is ${state} — requesting this section again`);
  }

  const repairSection = async (problem: SectionCheck, lesson: LessonSectionContext): Promise<void> => {
    const { type } = problem;
    const name = LESSON_SECTION_NAMES[type];

    let retry: Section | undefined;
    let retryCheck: SectionCheck | undefined;
    let retryProblem = 'the retry reply had no section';
    try {
      const reply = await regenerator.regenerateLessonSection(type, params, lesson, studentVocabulary, model);
      retry = sectionFromReply(reply, type);
      if (retry) {
        for (const fix of fixSection(type, retry)) console.log(`${prefix}Lesson check: fixed in place (retry): ${fix}`);
        retryCheck = checkLessonSection(type, retry);
        retryProblem = `the retry was ${retryCheck.status}: ${retryCheck.detail}`;
      }
    } catch (error) {
      retryProblem = `the retry request failed: ${error instanceof Error ? error.message : String(error)}`;
    }

    const original = findSection(content, type);
    const useSection = (section: Section) => {
      if (typeof original?.title === 'string' && typeof section.title !== 'string') section.title = original.title;
      putSection(content, type, section);
    };

    if (retry && retryCheck?.status === 'ok') {
      useSection(retry);
      report.repaired.push(type);
      console.log(`${prefix}Lesson check: ${name} section repaired with a retry (${retryCheck.detail})`);
      return;
    }

    // The retry didn't give a complete section: keep the more usable version, if it is usable at all.
    const originalCheck = checkLessonSection(type, original);
    const useRetry = retry !== undefined && retryCheck !== undefined && isMoreUsable(retryCheck, originalCheck);
    const best = useRetry && retryCheck ? retryCheck : originalCheck;

    let failure: FailedRepair;
    if (best.status === 'incomplete') {
      if (useRetry && retry) useSection(retry);
      failure = { type, outcome: useRetry ? 'kept retry' : 'kept original', detail: best.detail };
      console.error(
        `${prefix}Lesson repair FAILED for the ${name} section: ${retryProblem}. Keeping the ${useRetry ? 'retry' : 'original'} section, which has ${best.detail}.`,
      );
    } else {
      removeSection(content, type);
      failure = { type, outcome: 'left out', detail: originalCheck.detail };
      const originalNote = originalCheck.status === 'missing' ? '' : ` (the original was ${originalCheck.status}: ${originalCheck.detail})`;
      console.error(
        `${prefix}Lesson repair FAILED for the ${name} section: ${retryProblem}. The lesson is saved without this section${originalNote}.`,
      );
    }
    report.failed.push(failure);
  };

  // Every other section is written around the target words, so when no
  // section names them the vocabulary is written first.
  const vocabularyFirst = context.targetWords.length === 0
    ? report.problems.find((problem) => problem.type === 'vocabulary')
    : undefined;
  if (vocabularyFirst) {
    await repairSection(vocabularyFirst, context);
    context.targetWords = lessonSectionContext(content).targetWords;
  }
  await Promise.all(
    report.problems.filter((problem) => problem !== vocabularyFirst).map((problem) => repairSection(problem, context)),
  );

  return report;
}
