/**
 * Keeps the "Unlimited" tag in Mailchimp in step with each account's plan.
 *
 * The Mailchimp welcome flow sends trial emails ("your trial ends tomorrow",
 * "your trial has ended"). Anyone who has upgraded must leave that flow, and
 * campaigns that pitch Unlimited must be able to leave paying users out. Both
 * rely on this tag, so it must follow users.subscription_tier:
 *
 * - "unlimited" (paid, or granted by hand) -> tag active
 * - anything else -> tag removed (for example after a cancelled subscription)
 *
 * Runs for one customer after each Stripe subscription webhook, for one user
 * after checkout confirmation, and for every paying or previously-paying
 * account with the scheduled subscription sync. That sync runs at most once
 * every few hours across all servers and can be skipped at start-up (and its
 * timers don't fire while autoscale has the app scaled down), so after a
 * deploy an admin can run it at once with POST /api/admin/mailchimp/sync-plan-tags.
 *
 * Best effort: Mailchimp problems are logged and never affect billing or
 * access. Members are never created here; people not on the list are skipped.
 */
import { eq, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { mailchimpService } from "./services/mailchimp.service";

export const UNLIMITED_TAG = "Unlimited";

export interface PlanTagTarget {
  id: number;
  email: string | null;
  subscriptionTier: string | null;
}

export interface PlanTagResult {
  /** Accounts (with an email) that should carry the tag. */
  unlimited: number;
  tagged: number;
  untagged: number;
  notOnList: number;
  failed: number;
}

type TagService = Pick<typeof mailchimpService, "isInitialized" | "setMemberTag">;

/** Whether an account on this tier should carry the Unlimited tag. */
export function shouldHaveUnlimitedTag(tier: string | null | undefined): boolean {
  return tier === "unlimited";
}

/** Sets or removes the tag for each account. Never throws. */
export async function applyPlanTags(rows: PlanTagTarget[], service: TagService = mailchimpService): Promise<PlanTagResult> {
  const result: PlanTagResult = { unlimited: 0, tagged: 0, untagged: 0, notOnList: 0, failed: 0 };
  try {
    if (!rows.length || !service.isInitialized()) return result;
  } catch {
    return result;
  }

  for (const row of rows) {
    if (!row.email) continue;
    const active = shouldHaveUnlimitedTag(row.subscriptionTier);
    if (active) result.unlimited++;
    try {
      const outcome = await service.setMemberTag(row.email, UNLIMITED_TAG, active);
      if (outcome.notOnList) result.notOnList++;
      else if (!outcome.success) {
        result.failed++;
        console.error(`[MailchimpPlanTags] User ${row.id}: could not update tag (${outcome.error ?? "unknown error"})`);
      } else if (active) result.tagged++;
      else result.untagged++;
    } catch (error: any) {
      result.failed++;
      console.error(`[MailchimpPlanTags] User ${row.id}: could not update tag (${error?.message ?? "unknown error"})`);
    }
  }
  return result;
}

const tagColumns = { id: users.id, email: users.email, subscriptionTier: users.subscriptionTier };

/** Re-reads the given accounts' current tier and updates their tag. Never throws. */
export async function syncMailchimpPlanTagsForUsers(userIds: number[]): Promise<PlanTagResult | null> {
  try {
    if (!userIds.length || !mailchimpService.isInitialized()) return null;
    const rows = await db.select(tagColumns).from(users).where(inArray(users.id, userIds));
    return await applyPlanTags(rows);
  } catch (error: any) {
    console.error("[MailchimpPlanTags] Sync for users failed:", error?.message ?? error);
    return null;
  }
}

/**
 * Every account that has Unlimited now or is linked to Stripe (so it may have
 * had Unlimited before). Accounts that never paid are left alone.
 */
export async function syncAllMailchimpPlanTags(): Promise<PlanTagResult | null> {
  try {
    if (!mailchimpService.isInitialized()) return null;
    const rows = await db
      .select(tagColumns)
      .from(users)
      .where(or(eq(users.subscriptionTier, "unlimited"), isNotNull(users.stripeSubscriptionId), isNotNull(users.stripeCustomerId)));
    const result = await applyPlanTags(rows);
    console.log(
      `[MailchimpPlanTags] ${UNLIMITED_TAG} tag: ${result.unlimited} Unlimited accounts, ${result.tagged} on, ${result.untagged} off, ` +
        `${result.notOnList} not on the list, ${result.failed} failed`,
    );
    return result;
  } catch (error: any) {
    console.error("[MailchimpPlanTags] Full sync failed:", error?.message ?? error);
    return null;
  }
}
