import { sql } from "drizzle-orm";
import { db } from "./db";
import { ensureUserSignupDate } from "./user-signup-date-schema";

/**
 * How far teachers get towards PlanWise's main benefit: a second lesson for
 * the same student that builds on that student's word list. Counts only, for
 * the admin dashboard; no names or emails.
 */

export const ACTIVATION_STEPS = [
  { key: "signed_up", label: "Signed up" },
  { key: "made_lesson", label: "Made any lesson" },
  { key: "added_student", label: "Added a student" },
  { key: "student_lesson", label: "Made a lesson for a student" },
  { key: "marked_taught", label: "Marked a lesson \"We did this\"" },
  { key: "second_same_student", label: "Made a 2nd lesson for the same student" },
  { key: "memory_lesson", label: "Made a lesson after marking one taught (memory used)" },
  { key: "student_page", label: "Turned on a student page" },
  { key: "paid", label: "Paying (Unlimited)" },
] as const;

export type ActivationStepKey = (typeof ACTIVATION_STEPS)[number]["key"];

export const ACTIVATION_COHORTS = [
  { key: "all", label: "All accounts" },
  { key: "last_30_days", label: "Signed up in the last 30 days" },
  { key: "since_checklist", label: "Signed up since 25 Nov 2026 (checklist)" },
] as const;

export type ActivationCohortKey = (typeof ACTIVATION_COHORTS)[number]["key"];

export interface ActivationReport {
  cohorts: Array<{
    key: ActivationCohortKey;
    label: string;
    steps: Array<{ key: ActivationStepKey; label: string; count: number; percent: number }>;
  }>;
  /** True when some sign-up dates are estimated (accounts older than the created_at column). */
  signupDatesEstimated: boolean;
}

type Row = Record<ActivationStepKey | "cohort", unknown> & { cohort: string };

/** Puts raw counts in step order with a percentage of sign-ups (pure, tested). */
export function shapeActivationReport(rows: Row[], signupDatesEstimated: boolean): ActivationReport {
  return {
    signupDatesEstimated,
    cohorts: ACTIVATION_COHORTS.map((cohort) => {
      const row = rows.find((r) => r.cohort === cohort.key);
      const signedUp = Number(row?.signed_up ?? 0);
      return {
        key: cohort.key,
        label: cohort.label,
        steps: ACTIVATION_STEPS.map((step) => {
          const count = Number(row?.[step.key] ?? 0);
          return {
            key: step.key,
            label: step.label,
            count,
            percent: signedUp > 0 ? Math.round((count / signedUp) * 100) : 0,
          };
        }),
      };
    }),
  };
}

export async function getActivationReport(): Promise<ActivationReport> {
  await ensureUserSignupDate();
  // Sign-up date: the real one where recorded, otherwise trial end minus the
  // 5-day trial every older account had. Accounts with neither are counted in
  // "All accounts" only.
  const result = await db.execute(sql`
    WITH u AS (
      SELECT id, subscription_tier, stripe_subscription_id,
        COALESCE(created_at, trial_expires_at - interval '5 days') AS signed_up_at
      FROM users WHERE NOT COALESCE(is_admin, false)
    ),
    per_student AS (
      SELECT teacher_id, student_id, count(*) AS lessons
      FROM lessons WHERE student_id IS NOT NULL GROUP BY teacher_id, student_id
    ),
    c AS (
      SELECT 'all' AS cohort, u.* FROM u
      UNION ALL SELECT 'last_30_days', u.* FROM u WHERE signed_up_at >= now() - interval '30 days'
      UNION ALL SELECT 'since_checklist', u.* FROM u WHERE signed_up_at >= '2026-11-25'
    )
    SELECT cohort,
      count(*) AS signed_up,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM lessons l WHERE l.teacher_id = c.id)) AS made_lesson,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM students s WHERE s.teacher_id = c.id)) AS added_student,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM per_student p WHERE p.teacher_id = c.id)) AS student_lesson,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM student_lessons x
        WHERE x.teacher_id = c.id AND x.completed_at IS NOT NULL AND NOT COALESCE(x.made_by_student, false)
      )) AS marked_taught,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM per_student p WHERE p.teacher_id = c.id AND p.lessons >= 2)) AS second_same_student,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM student_lessons x
        JOIN lessons l2 ON l2.student_id = x.student_id AND l2.teacher_id = x.teacher_id AND l2.created_at > x.completed_at
        WHERE x.teacher_id = c.id AND x.completed_at IS NOT NULL
      )) AS memory_lesson,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM students s WHERE s.teacher_id = c.id AND s.page_enabled)) AS student_page,
      count(*) FILTER (WHERE c.subscription_tier = 'unlimited') AS paid
    FROM c GROUP BY cohort
  `);
  const estimated = await db.execute(sql`
    SELECT EXISTS (SELECT 1 FROM users WHERE created_at IS NULL AND NOT COALESCE(is_admin, false)) AS estimated
  `);
  return shapeActivationReport(
    result.rows as Row[],
    Boolean((estimated.rows[0] as { estimated?: boolean } | undefined)?.estimated),
  );
}
