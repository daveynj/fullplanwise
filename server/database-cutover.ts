import { createHash } from "node:crypto";
import type { Pool } from "pg";
import type { DatabaseConfig } from "./database-url";

type Queryable = Pick<Pool, "query">;

export interface CutoverSnapshot {
  users_count: string;
  users_signature: string;
  lessons_count: string;
  lessons_signature: string;
  students_count: string;
  students_signature: string;
  assignments_count: string;
  assignments_signature: string;
  vocabulary_count: string;
  vocabulary_signature: string;
  jobs_count: string;
  jobs_signature: string;
  stripe_subscriptions_count: string;
  stripe_subscriptions_signature: string;
}

const CUTOVER_SNAPSHOT_QUERY = `
  SELECT
    (SELECT count(*)::text FROM public.users) AS users_count,
    (SELECT md5(COALESCE(string_agg(
      id::text || ':' ||
      md5(password) || ':' ||
      lower(email) || ':' ||
      COALESCE(stripe_customer_id, '') || ':' ||
      COALESCE(stripe_subscription_id, '') || ':' ||
      COALESCE(subscription_tier, '') || ':' ||
      COALESCE(free_credits_remaining::text, '') || ':' ||
      COALESCE(subscription_cancel_at_period_end::text, '') || ':' ||
      COALESCE(subscription_current_period_end::text, ''),
      '|' ORDER BY id
    ), '')) FROM public.users) AS users_signature,

    (SELECT count(*)::text FROM public.lessons) AS lessons_count,
    (SELECT md5(COALESCE(string_agg(
      id::text || ':' || teacher_id::text || ':' ||
      COALESCE(student_id::text, '') || ':' ||
      md5(title) || ':' || md5(topic),
      '|' ORDER BY id
    ), '')) FROM public.lessons) AS lessons_signature,

    (SELECT count(*)::text FROM public.students) AS students_count,
    (SELECT md5(COALESCE(string_agg(
      id::text || ':' || teacher_id::text || ':' || md5(name),
      '|' ORDER BY id
    ), '')) FROM public.students) AS students_signature,

    (SELECT count(*)::text FROM public.student_lessons) AS assignments_count,
    (SELECT md5(COALESCE(string_agg(
      id::text || ':' || student_id::text || ':' ||
      lesson_id::text || ':' || teacher_id::text,
      '|' ORDER BY id
    ), '')) FROM public.student_lessons) AS assignments_signature,

    (SELECT count(*)::text FROM public.student_vocabulary) AS vocabulary_count,
    (SELECT md5(COALESCE(string_agg(
      id::text || ':' || student_id::text || ':' ||
      COALESCE(lesson_id::text, '') || ':' || md5(word),
      '|' ORDER BY id
    ), '')) FROM public.student_vocabulary) AS vocabulary_signature,

    (SELECT count(*)::text FROM public.lesson_generation_jobs) AS jobs_count,
    (SELECT md5(COALESCE(string_agg(
      id || ':' || teacher_id::text || ':' || status || ':' ||
      COALESCE(lesson_id::text, '') || ':' || credit_spent::text || ':' ||
      refund_applied::text,
      '|' ORDER BY id
    ), '')) FROM public.lesson_generation_jobs) AS jobs_signature,

    (SELECT count(*)::text FROM stripe.subscriptions) AS stripe_subscriptions_count,
    (SELECT md5(COALESCE(string_agg(
      id || ':' || COALESCE(customer, '') || ':' || COALESCE(status, ''),
      '|' ORDER BY id
    ), '')) FROM stripe.subscriptions) AS stripe_subscriptions_signature
`;

export function hashCutoverSnapshot(snapshot: CutoverSnapshot): string {
  const canonical = Object.keys(snapshot)
    .sort()
    .map((key) => `${key}=${snapshot[key as keyof CutoverSnapshot]}`)
    .join("\n");

  return createHash("sha256").update(canonical).digest("hex");
}

export async function getDatabaseCutoverSignature(
  database: Queryable,
): Promise<string> {
  const result = await database.query<CutoverSnapshot>(CUTOVER_SNAPSHOT_QUERY);
  const snapshot = result.rows[0];

  if (!snapshot) {
    throw new Error("Database cutover snapshot query returned no result.");
  }

  return hashCutoverSnapshot(snapshot);
}

export async function verifyManagedDatabaseCutover(
  database: Queryable,
  config: DatabaseConfig,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  if (config.source !== "managed") {
    return;
  }

  const expected = env.PLANWISE_MANAGED_DATABASE_SIGNATURE;
  if (!expected || !/^[a-f0-9]{64}$/.test(expected)) {
    throw new Error(
      "Managed database cutover is blocked: PLANWISE_MANAGED_DATABASE_SIGNATURE is missing or invalid.",
    );
  }

  const actual = await getDatabaseCutoverSignature(database);
  if (actual !== expected) {
    throw new Error(
      "Managed database cutover is blocked: destination data does not match the verified source signature.",
    );
  }

  console.log("Managed database cutover signature verified");
}