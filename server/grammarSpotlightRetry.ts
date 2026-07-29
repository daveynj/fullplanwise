import { validateGrammarSpotlightForStorage, type GrammarSpotlight } from "../types/lessonContentTypes";

/**
 * Minimal interface for the OpenRouter service pieces this helper needs —
 * kept narrow so tests can pass a simple stub.
 */
export interface GrammarSpotlightRegenerator {
  regenerateGrammarSpotlight(topic: string, cefrLevel: string): Promise<unknown>;
}

/**
 * Validates the AI-generated grammar spotlight for storage. If the initial
 * payload fails validation, retries generation exactly once via
 * `regenerateGrammarSpotlight` and validates the retry result. Returns the
 * validated spotlight, or null when both the original and the retry are
 * unusable (in which case a warning is logged and the section should be
 * omitted from the lesson).
 */
export async function resolveGrammarSpotlight(
  rawSpotlight: unknown,
  openRouter: GrammarSpotlightRegenerator,
  jobId: string,
  topic: string,
  cefrLevel: string,
): Promise<GrammarSpotlight | null> {
  const validated = validateGrammarSpotlightForStorage(rawSpotlight);
  if (validated) return validated;

  console.warn(`[Job ${jobId}] Malformed grammarSpotlight from AI output — retrying grammar spotlight generation once`);
  let retriedSpotlight: GrammarSpotlight | null = null;
  try {
    const regenerated = await openRouter.regenerateGrammarSpotlight(topic, cefrLevel);
    retriedSpotlight = validateGrammarSpotlightForStorage(regenerated) ?? null;
  } catch (retryError) {
    console.error(`[Job ${jobId}] Grammar spotlight retry failed:`, retryError);
  }

  if (retriedSpotlight) {
    console.log(`[Job ${jobId}] Grammar spotlight retry succeeded — using regenerated spotlight`);
    return retriedSpotlight;
  }

  console.warn(`[Job ${jobId}] Dropping malformed grammarSpotlight from AI output — retry also failed validation`);
  return null;
}
