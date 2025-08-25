
import { z } from 'zod';

// Define the schema for the environment variable
const freeTrialEndDateSchema = z.string().datetime({ offset: true }).optional();

const freeTrialEndDateStr = process.env.FREE_TRIAL_END_DATE;
let freeTrialEndDate: Date | null = null;
let parseError = false;

if (freeTrialEndDateStr) {
  try {
    freeTrialEndDateSchema.parse(freeTrialEndDateStr);
    freeTrialEndDate = new Date(freeTrialEndDateStr);
    console.log(`[Features] FREE_TRIAL_END_DATE successfully read from environment: ${freeTrialEndDateStr}`);
    console.log(`[Features] Free trial mode is configured to end on: ${freeTrialEndDate.toISOString()}`);
  } catch (error) {
    parseError = true;
    console.error(`[Features] Invalid FREE_TRIAL_END_DATE format: ${freeTrialEndDateStr}. It must be a valid ISO 8601 datetime string. Free trial mode is disabled.`);
  }
} else {
    console.log("[Features] FREE_TRIAL_END_DATE is not set. Free trial mode is disabled.");
}

/**
 * Checks if the free trial period is currently active.
 * The free trial is active if the FREE_TRIAL_END_DATE environment variable
 * is set and the current date is before the specified end date.
 * @returns {boolean} True if the free trial is active, false otherwise.
 */
export function isFreeTrialActive(): boolean {
  if (parseError || !freeTrialEndDate) {
    return false;
  }
  return new Date() < freeTrialEndDate;
}

/**
 * Gets the end date of the free trial.
 * @returns {Date | null} The end date of the free trial, or null if not set or invalid.
 */
export function getFreeTrialEndDate(): Date | null {
    if (parseError) {
        return null;
    }
    return freeTrialEndDate;
}
