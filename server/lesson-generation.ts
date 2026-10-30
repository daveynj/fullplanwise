import type { LessonGenerateParams, User } from "@shared/schema";
import { DEFAULT_MODEL_ID, isSelectableModel } from "@shared/aiModels";
import type { GrammarSpotlight } from "../types/lessonContentTypes";
import { storage } from "./storage";
import { resolveGrammarSpotlight } from "./grammarSpotlightRetry";
import { stripBackedUpBase64 } from "./services/image-storage";

/**
 * The steps of making a lesson that a teacher's request (server/routes.ts)
 * and a student's (server/student-lesson-making.ts) share. `openRouter` is
 * the lesson AI service (server/services/openRouter.ts).
 */

/**
 * Words a new lesson for this student shouldn't teach again: the newest words
 * in their list, and the words of lessons planned but not done yet.
 */
export async function wordsToAvoid(studentId: number, logPrefix: string): Promise<string[]> {
  let words: string[] = [];
  try {
    const vocabRecords = await storage.getStudentVocabulary(studentId, 50);
    words = vocabRecords.map(v => v.word).filter(Boolean);
    if (words.length > 0) {
      console.log(`${logPrefix} Found ${words.length} learned vocabulary words`);
    }
  } catch (vocabError) {
    console.error(`${logPrefix} Error fetching student vocabulary:`, vocabError);
  }
  // Words in lessons planned but not done yet aren't in the list, but a new
  // lesson shouldn't teach them again either.
  try {
    const known = new Set(words.map((word) => word.toLowerCase()));
    const planned = (await storage.getPlannedLessonWords(studentId))
      .filter((word) => !known.has(word.toLowerCase()));
    if (planned.length > 0) {
      console.log(`${logPrefix} Also avoiding ${planned.length} words from planned lessons`);
      words = [...words, ...planned];
    }
  } catch (plannedError) {
    console.error(`${logPrefix} Error fetching planned lesson words:`, plannedError);
  }
  return words;
}

/**
 * The text model for a lesson its teacher owns. Admin accounts may override
 * it; everyone else always uses the server default. The allowlist is checked
 * again so a stored preference for a since-removed model falls back to the
 * default instead of calling a retired model.
 */
export function lessonModelFor(teacher: Pick<User, "isAdmin" | "preferredAiModel">): string {
  return teacher.isAdmin && isSelectableModel(teacher.preferredAiModel)
    ? teacher.preferredAiModel!
    : DEFAULT_MODEL_ID;
}

/**
 * Writes the lesson's text. A grammar spotlight in the output is checked
 * (retried once if malformed) and kept only when valid.
 */
export async function writeLessonText(
  openRouter: any,
  params: LessonGenerateParams,
  avoidWords: string[],
  model: string,
  jobId: string,
): Promise<{ content: any; grammarSpotlight: GrammarSpotlight | null }> {
  const content = await openRouter.generateLesson(params, avoidWords, model, {
    logPrefix: `[Job ${jobId}]`,
  });

  let grammarSpotlight: GrammarSpotlight | null = null;
  if (content.grammarSpotlight) {
    const resolvedSpotlight = await resolveGrammarSpotlight(
      content.grammarSpotlight,
      openRouter,
      jobId,
      params.topic,
      params.cefrLevel,
      model,
    );
    if (resolvedSpotlight) {
      grammarSpotlight = resolvedSpotlight;
      // Keep the stored lesson content consistent with the validated payload
      content.grammarSpotlight = resolvedSpotlight;
    } else {
      delete content.grammarSpotlight;
    }
  }
  return { content, grammarSpotlight };
}

/** Makes the lesson's pictures in the background and saves them into the lesson when they're ready. */
export function addLessonPictures(openRouter: any, content: any, lessonId: number, jobId: string): void {
  openRouter.generateImagesForLesson(content, lessonId)
    .then(async () => {
      console.log(`[Job ${jobId}] Image generation complete — updating lesson in DB`);
      try {
        // Store URLs only — Base64 stays out of the database.
        await storage.updateLesson(lessonId, {
          content: stripBackedUpBase64(content)
        });
        console.log(`[Job ${jobId}] Lesson updated with images`);
      } catch (updateErr) {
        // Never lose generated images: if the small write fails, fall
        // back to the in-memory content that still carries Base64.
        console.error(`[Job ${jobId}] URL-only lesson update failed, retrying with inline image fallback:`, updateErr);
        try {
          await storage.updateLesson(lessonId, {
            content
          });
          console.log(`[Job ${jobId}] Lesson updated with inline image fallback`);
        } catch (finalErr) {
          console.error(`[Job ${jobId}] Failed to update lesson with images:`, finalErr);
        }
      }
    })
    .catch((imgError: any) => {
      console.error(`[Job ${jobId}] Image generation error:`, imgError);
    });
}
