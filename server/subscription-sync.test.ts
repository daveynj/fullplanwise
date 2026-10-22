// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

vi.mock("./db", () => ({ db: {}, pool: {} }));
vi.mock("./storage", () => ({ storage: { updateUser: vi.fn() } }));
vi.mock("./stripeClient", () => ({ getStripeSecretKey: vi.fn(async () => "sk_test") }));

import {
  decideSubscriptionChanges,
  lookupStripeState,
  type SyncUser,
  type SubscriptionSnapshot,
} from "./subscription-sync";

const periodEnd = new Date("2026-11-03T00:00:00Z");

function user(overrides: Partial<SyncUser> = {}): SyncUser {
  return {
    id: 1,
    subscriptionTier: "unlimited",
    stripeSubscriptionId: "sub_1",
    subscriptionCancelAtPeriodEnd: false,
    subscriptionCurrentPeriodEnd: periodEnd,
    ...overrides,
  };
}

function snap(status: string, overrides: Partial<SubscriptionSnapshot> = {}): SubscriptionSnapshot {
  return { id: "sub_1", status, cancelAtPeriodEnd: false, currentPeriodEnd: periodEnd, ...overrides };
}

function stripeSub(id: string, status: string) {
  return { id, status, cancel_at_period_end: false, items: { data: [{ current_period_end: periodEnd.getTime() / 1000 }] } };
}

const missing = Object.assign(new Error("No such subscription"), { statusCode: 404, code: "resource_missing" });

function fakeStripe(opts: { subs?: Record<string, any>; customerSubs?: any[]; retrieveError?: any; listError?: any }) {
  return {
    subscriptions: {
      retrieve: vi.fn(async (id: string) => {
        if (opts.retrieveError) throw opts.retrieveError;
        if (opts.subs?.[id]) return opts.subs[id];
        throw missing;
      }),
      list: vi.fn(async () => {
        if (opts.listError) throw opts.listError;
        if (!opts.customerSubs) throw Object.assign(new Error("No such customer"), { statusCode: 404, code: "resource_missing" });
        return { data: opts.customerSubs };
      }),
    },
  } as any;
}

describe("decideSubscriptionChanges", () => {
  it("downgrades an unlimited account whose subscription ended", () => {
    expect(decideSubscriptionChanges(user(), { kind: "ended", subscription: snap("canceled") })).toEqual({
      subscriptionTier: "free",
      subscriptionCurrentPeriodEnd: null,
    });
  });

  it("changes nothing when the account already matches Stripe", () => {
    expect(decideSubscriptionChanges(user(), { kind: "paid", subscription: snap("active") })).toBeNull();
  });

  it("never changes anything when the Stripe state is unknown", () => {
    expect(decideSubscriptionChanges(user(), { kind: "unknown", reason: "x" })).toBeNull();
  });

  it("upgrades and relinks a free account that has a paying subscription", () => {
    const changes = decideSubscriptionChanges(
      user({ subscriptionTier: "free", stripeSubscriptionId: "sub_old", subscriptionCurrentPeriodEnd: null }),
      { kind: "paid", subscription: snap("active", { id: "sub_new" }) },
    );
    expect(changes).toEqual({ subscriptionTier: "unlimited", stripeSubscriptionId: "sub_new", subscriptionCurrentPeriodEnd: periodEnd });
  });

  it("records a pending cancellation made in Stripe", () => {
    expect(
      decideSubscriptionChanges(user(), { kind: "paid", subscription: snap("active", { cancelAtPeriodEnd: true }) }),
    ).toEqual({ subscriptionCancelAtPeriodEnd: true });
  });
});

describe("lookupStripeState", () => {
  const linked = { stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1" };

  it("reports paid for an active subscription", async () => {
    const result = await lookupStripeState(linked, [fakeStripe({ subs: { sub_1: stripeSub("sub_1", "active") } })]);
    expect(result).toMatchObject({ kind: "paid", subscription: { id: "sub_1", status: "active" } });
  });

  it("treats past_due as still paying while Stripe retries the card", async () => {
    const result = await lookupStripeState(linked, [fakeStripe({ subs: { sub_1: stripeSub("sub_1", "past_due") } })]);
    expect(result.kind).toBe("paid");
  });

  it("reports ended for a cancelled subscription with no other paying one", async () => {
    const result = await lookupStripeState(linked, [
      fakeStripe({ subs: { sub_1: stripeSub("sub_1", "canceled") }, customerSubs: [stripeSub("sub_1", "canceled")] }),
    ]);
    expect(result.kind).toBe("ended");
  });

  it("finds a newer paying subscription for the same customer", async () => {
    const result = await lookupStripeState(linked, [
      fakeStripe({
        subs: { sub_1: stripeSub("sub_1", "canceled") },
        customerSubs: [stripeSub("sub_2", "active"), stripeSub("sub_1", "canceled")],
      }),
    ]);
    expect(result).toMatchObject({ kind: "paid", subscription: { id: "sub_2" } });
  });

  it("finds a subscription that lives in the legacy Stripe account", async () => {
    const result = await lookupStripeState(linked, [
      fakeStripe({}),
      fakeStripe({ subs: { sub_1: stripeSub("sub_1", "active") } }),
    ]);
    expect(result.kind).toBe("paid");
  });

  it("is unknown (no downgrade) when the subscription isn't found anywhere", async () => {
    const result = await lookupStripeState(linked, [fakeStripe({}), fakeStripe({})]);
    expect(result.kind).toBe("unknown");
  });

  it("is unknown (no downgrade) when Stripe errors", async () => {
    const outage = Object.assign(new Error("connection reset"), { statusCode: 500 });
    const result = await lookupStripeState(linked, [fakeStripe({ retrieveError: outage, listError: outage })]);
    expect(result.kind).toBe("unknown");
  });

  it("ignores a failing legacy account when the ended subscription was found in the main one", async () => {
    const authError = Object.assign(new Error("Invalid API key"), { statusCode: 401 });
    const result = await lookupStripeState(linked, [
      fakeStripe({ subs: { sub_1: stripeSub("sub_1", "canceled") }, customerSubs: [] }),
      fakeStripe({ retrieveError: authError, listError: authError }),
    ]);
    expect(result.kind).toBe("ended");
  });

  it("is unknown while the first payment is still incomplete", async () => {
    const result = await lookupStripeState(linked, [
      fakeStripe({ subs: { sub_1: stripeSub("sub_1", "incomplete") }, customerSubs: [] }),
    ]);
    expect(result.kind).toBe("unknown");
  });
});
