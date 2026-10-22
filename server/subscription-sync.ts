/**
 * Keeps each PlanWise account's subscription tier in step with Stripe.
 *
 * Checkout grants "unlimited" immediately, but nothing used to take it away
 * when a subscription ended, so cancelled or unpaid customers kept access.
 * This module looks every Stripe-linked account up in Stripe and corrects it.
 * It runs on Stripe subscription webhooks, at production start-up and every
 * few hours.
 *
 * Safety rules:
 * - An account is only switched to free when Stripe positively reports its
 *   subscription in an ended state. "Not found" or an API error leaves the
 *   account unchanged, so a lookup problem never cuts off a paying customer.
 * - Older subscriptions may live in the second ("legacy") Stripe account that
 *   is connected through the Replit Stripe integration, so lookups try that
 *   account too when its key is available.
 * - Accounts with "unlimited" but no Stripe link (granted by hand) are skipped.
 */
import Stripe from "stripe";
import { and, eq, isNotNull, or } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { getStripeSecretKey } from "./stripeClient";
import { storage } from "./storage";

/** Statuses where the customer still has a live, paying (or retrying) subscription. */
const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);
/** Statuses where the subscription is over and access should end. */
const ENDED_STATUSES = new Set(["canceled", "unpaid", "incomplete_expired", "paused"]);

const STRIPE_API_VERSION = "2025-08-27.basil" as any;

export interface SubscriptionSnapshot {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
}

export type StripeLookup =
  /** Found a paying subscription for this customer. */
  | { kind: "paid"; subscription: SubscriptionSnapshot }
  /** Stripe confirms the linked subscription has ended and the customer has no other paying one. */
  | { kind: "ended"; subscription: SubscriptionSnapshot }
  /** Could not establish the state (not found, still incomplete, API error). */
  | { kind: "unknown"; reason: string };

export interface SyncUser {
  id: number;
  subscriptionTier: string | null;
  stripeSubscriptionId: string | null;
  subscriptionCancelAtPeriodEnd: boolean;
  subscriptionCurrentPeriodEnd: Date | null;
}

export type SyncChanges = Partial<
  Pick<SyncUser, "subscriptionTier" | "stripeSubscriptionId" | "subscriptionCancelAtPeriodEnd" | "subscriptionCurrentPeriodEnd">
>;

function sameDate(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return a === b;
  return new Date(a).getTime() === new Date(b).getTime();
}

/** Pure decision: which fields (if any) must change for the account to match Stripe. */
export function decideSubscriptionChanges(user: SyncUser, lookup: StripeLookup): SyncChanges | null {
  if (lookup.kind === "unknown") return null;

  const target: Required<SyncChanges> =
    lookup.kind === "paid"
      ? {
          subscriptionTier: "unlimited",
          stripeSubscriptionId: lookup.subscription.id,
          subscriptionCancelAtPeriodEnd: lookup.subscription.cancelAtPeriodEnd,
          subscriptionCurrentPeriodEnd: lookup.subscription.currentPeriodEnd,
        }
      : {
          subscriptionTier: "free",
          // Keep the link to the ended subscription for reference.
          stripeSubscriptionId: user.stripeSubscriptionId,
          subscriptionCancelAtPeriodEnd: false,
          subscriptionCurrentPeriodEnd: null,
        };

  const changes: SyncChanges = {};
  if ((user.subscriptionTier ?? "free") !== target.subscriptionTier) changes.subscriptionTier = target.subscriptionTier;
  if (user.stripeSubscriptionId !== target.stripeSubscriptionId) changes.stripeSubscriptionId = target.stripeSubscriptionId;
  if (user.subscriptionCancelAtPeriodEnd !== target.subscriptionCancelAtPeriodEnd) {
    changes.subscriptionCancelAtPeriodEnd = target.subscriptionCancelAtPeriodEnd;
  }
  if (!sameDate(user.subscriptionCurrentPeriodEnd, target.subscriptionCurrentPeriodEnd)) {
    changes.subscriptionCurrentPeriodEnd = target.subscriptionCurrentPeriodEnd;
  }
  return Object.keys(changes).length ? changes : null;
}

export function toSnapshot(sub: Stripe.Subscription): SubscriptionSnapshot {
  // Newer API versions expose the period end on the subscription item.
  const periodEnd = sub.items?.data?.[0]?.current_period_end ?? (sub as any).current_period_end;
  return {
    id: sub.id,
    status: sub.status,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    currentPeriodEnd: typeof periodEnd === "number" ? new Date(periodEnd * 1000) : null,
  };
}

function isMissing(error: any): boolean {
  return error?.statusCode === 404 || error?.code === "resource_missing";
}

/** Stripe clients to search: the app's account first, then the legacy integration account. */
async function stripeAccounts(): Promise<Stripe[]> {
  const primaryKey = await getStripeSecretKey();
  const clients = [new Stripe(primaryKey, { apiVersion: STRIPE_API_VERSION })];
  const legacyKey = process.env.STRIPE_SECRET_KEY;
  if (legacyKey && legacyKey !== primaryKey) {
    clients.push(new Stripe(legacyKey, { apiVersion: STRIPE_API_VERSION }));
  }
  return clients;
}

/** Looks a user's subscription state up across the configured Stripe accounts. */
export async function lookupStripeState(
  user: { stripeCustomerId: string | null; stripeSubscriptionId: string | null },
  clients: Stripe[],
): Promise<StripeLookup> {
  let linked: SubscriptionSnapshot | null = null;
  let linkedAccount = -1;
  // Accounts whose lookups failed for a reason other than "not found".
  const failedAccounts = new Set<number>();

  for (const [index, stripe] of clients.entries()) {
    // 1. The subscription the account is linked to.
    if (user.stripeSubscriptionId && !linked) {
      try {
        const snapshot = toSnapshot(await stripe.subscriptions.retrieve(user.stripeSubscriptionId));
        if (PAID_STATUSES.has(snapshot.status)) return { kind: "paid", subscription: snapshot };
        linked = snapshot;
        linkedAccount = index;
      } catch (error) {
        if (!isMissing(error)) failedAccounts.add(index);
      }
    }

    // 2. Any other paying subscription for the same customer (e.g. re-subscribed).
    if (user.stripeCustomerId) {
      try {
        const list = await stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "all", limit: 20 });
        const paying = list.data.find((s) => PAID_STATUSES.has(s.status));
        if (paying) return { kind: "paid", subscription: toSnapshot(paying) };
      } catch (error) {
        if (!isMissing(error)) failedAccounts.add(index);
      }
    }
  }

  // Stripe IDs belong to a single account, so only failures in the account
  // that holds the linked subscription can hide a paying subscription.
  if (linked && ENDED_STATUSES.has(linked.status) && !failedAccounts.has(linkedAccount)) {
    return { kind: "ended", subscription: linked };
  }
  if (failedAccounts.size) return { kind: "unknown", reason: "Stripe lookup failed" };
  if (linked) return { kind: "unknown", reason: `subscription status is ${linked.status}` };
  return { kind: "unknown", reason: "no subscription found in Stripe" };
}

export interface SyncResult {
  checked: number;
  updated: Array<{ userId: number; changes: SyncChanges }>;
  unknown: Array<{ userId: number; reason: string }>;
}

async function syncUsers(rows: Array<SyncUser & { stripeCustomerId: string | null }>): Promise<SyncResult> {
  const result: SyncResult = { checked: 0, updated: [], unknown: [] };
  if (!rows.length) return result;
  const clients = await stripeAccounts();

  for (const user of rows) {
    result.checked++;
    try {
      const lookup = await lookupStripeState(user, clients);
      if (lookup.kind === "unknown") {
        // Only worth reporting when the account currently has paid access.
        if (user.subscriptionTier === "unlimited") result.unknown.push({ userId: user.id, reason: lookup.reason });
        continue;
      }
      const changes = decideSubscriptionChanges(user, lookup);
      if (!changes) continue;
      await storage.updateUser(user.id, changes);
      result.updated.push({ userId: user.id, changes });
      console.log(
        `[SubscriptionSync] User ${user.id}: Stripe ${lookup.subscription.status} -> ${JSON.stringify(changes)}`,
      );
    } catch (error: any) {
      result.unknown.push({ userId: user.id, reason: error?.message || String(error) });
    }
  }
  return result;
}

const syncColumns = {
  id: users.id,
  subscriptionTier: users.subscriptionTier,
  stripeCustomerId: users.stripeCustomerId,
  stripeSubscriptionId: users.stripeSubscriptionId,
  subscriptionCancelAtPeriodEnd: users.subscriptionCancelAtPeriodEnd,
  subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
};

/** Checks every account linked to Stripe. */
export async function syncAllSubscriptions(): Promise<SyncResult> {
  const rows = await db
    .select(syncColumns)
    .from(users)
    .where(or(isNotNull(users.stripeSubscriptionId), isNotNull(users.stripeCustomerId)));
  const result = await syncUsers(rows);
  console.log(
    `[SubscriptionSync] Checked ${result.checked} account(s), updated ${result.updated.length}` +
      (result.unknown.length
        ? `, could not confirm ${result.unknown.length}: ${result.unknown.map((u) => `user ${u.userId} (${u.reason})`).join(", ")}`
        : ""),
  );
  return result;
}

/** Checks the account(s) for one Stripe customer, e.g. after a subscription webhook. */
export async function syncSubscriptionsForCustomer(customerId: string): Promise<SyncResult> {
  const rows = await db
    .select(syncColumns)
    .from(users)
    .where(and(isNotNull(users.stripeCustomerId), eq(users.stripeCustomerId, customerId)));
  return syncUsers(rows);
}

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

/**
 * Called after a webhook passed signature verification. Never throws: the
 * scheduled full sync is the fallback if this fails.
 */
export async function handleSubscriptionWebhookEvent(event: { type?: string; data?: any }): Promise<void> {
  try {
    if (!event?.type || !SUBSCRIPTION_EVENTS.has(event.type)) return;
    const customer = event.data?.object?.customer;
    const customerId = typeof customer === "string" ? customer : customer?.id;
    if (customerId) await syncSubscriptionsForCustomer(customerId);
  } catch (error) {
    console.error("[SubscriptionSync] Webhook sync failed:", error);
  }
}

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Production only: full sync shortly after start-up, then every 6 hours. */
export function scheduleSubscriptionSync(): void {
  if (process.env.NODE_ENV !== "production") return;
  const run = () => syncAllSubscriptions().catch((error) => console.error("[SubscriptionSync] Sync failed:", error));
  setTimeout(run, 60_000).unref();
  setInterval(run, SYNC_INTERVAL_MS).unref();
}
