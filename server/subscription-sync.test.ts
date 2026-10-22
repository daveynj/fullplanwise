// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

vi.mock("./db", () => ({ db: {}, pool: {} }));
vi.mock("./storage", () => ({ storage: { updateUser: vi.fn() } }));
vi.mock("./stripeClient", () => ({ getStripeSecretKey: vi.fn(async () => "sk_test") }));

import {
  runScheduledSubscriptionSync,
  startScheduledSubscriptionSync,
  SCHEDULED_SYNC_LOCK_KEY,
  SCHEDULED_SYNC_MIN_GAP_MS,
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

describe("runScheduledSubscriptionSync", () => {
  const HOUR = 60 * 60 * 1000;
  const syncResult = { checked: 8, updated: [], unknown: [] };

  /**
   * In-memory stand-in for the shared database: one advisory lock and the
   * scheduled_job_runs table, shared by every "server" (pool) made from it.
   */
  function fakeDatabase(opts: { lastCompletedAt?: number } = {}) {
    const state = { lockHolder: null as object | null, lastCompletedAt: opts.lastCompletedAt ?? null as number | null };
    function makePool() {
      const client: any = {
        query: vi.fn(async (text: string) => {
          if (text.includes("pg_try_advisory_lock")) {
            if (state.lockHolder && state.lockHolder !== client) return { rows: [{ locked: false }] };
            state.lockHolder = client;
            return { rows: [{ locked: true }] };
          }
          if (text.includes("pg_advisory_unlock")) {
            if (state.lockHolder === client) state.lockHolder = null;
            return { rows: [{ pg_advisory_unlock: true }] };
          }
          if (text.includes("elapsed_ms")) {
            return { rows: state.lastCompletedAt === null ? [] : [{ elapsed_ms: String(Date.now() - state.lastCompletedAt) }] };
          }
          if (text.includes("INSERT INTO scheduled_job_runs")) {
            state.lastCompletedAt = Date.now();
            return { rows: [] };
          }
          return { rows: [] }; // CREATE TABLE
        }),
        release: vi.fn(),
      };
      return { client, pool: { connect: vi.fn(async () => client) } };
    }
    return { state, makePool };
  }

  it("runs the sync, records it and releases the lock when this server gets it", async () => {
    const db = fakeDatabase();
    const { client, pool } = db.makePool();
    const sync = vi.fn(async () => syncResult);
    await expect(runScheduledSubscriptionSync({ pool, sync, minGapMs: SCHEDULED_SYNC_MIN_GAP_MS })).resolves.toBe(syncResult);
    expect(sync).toHaveBeenCalledOnce();
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining("pg_try_advisory_lock"), [SCHEDULED_SYNC_LOCK_KEY]);
    expect(client.query).toHaveBeenLastCalledWith(expect.stringContaining("pg_advisory_unlock"), [SCHEDULED_SYNC_LOCK_KEY]);
    expect(db.state.lastCompletedAt).not.toBeNull();
    expect(db.state.lockHolder).toBeNull();
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("skips quietly when another server is running it right now", async () => {
    const db = fakeDatabase();
    db.state.lockHolder = {};
    const { client, pool } = db.makePool();
    const sync = vi.fn(async () => syncResult);
    const log = vi.spyOn(console, "log");
    await expect(runScheduledSubscriptionSync({ pool, sync, minGapMs: SCHEDULED_SYNC_MIN_GAP_MS })).resolves.toBeNull();
    expect(sync).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.release).toHaveBeenCalledOnce();
    log.mockRestore();
  });

  it("skips when another server completed a run recently", async () => {
    const db = fakeDatabase({ lastCompletedAt: Date.now() - 20 * 60 * 1000 });
    const { pool } = db.makePool();
    const sync = vi.fn(async () => syncResult);
    await expect(runScheduledSubscriptionSync({ pool, sync, minGapMs: SCHEDULED_SYNC_MIN_GAP_MS })).resolves.toBeNull();
    expect(sync).not.toHaveBeenCalled();
    expect(db.state.lockHolder).toBeNull();
  });

  it("releases the lock and records nothing when the sync fails, so the next server retries", async () => {
    const db = fakeDatabase();
    const { client, pool } = db.makePool();
    const sync = vi.fn(async () => {
      throw new Error("Stripe down");
    });
    await expect(runScheduledSubscriptionSync({ pool, sync, minGapMs: SCHEDULED_SYNC_MIN_GAP_MS })).rejects.toThrow("Stripe down");
    expect(db.state.lastCompletedAt).toBeNull();
    expect(db.state.lockHolder).toBeNull();
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("runs once per cycle across servers whose schedules are staggered, including after a restart", async () => {
    vi.useFakeTimers();
    try {
      const db = fakeDatabase();
      const sync = vi.fn(async () => syncResult);
      const stops: Array<() => void> = [];
      const startServer = () =>
        stops.push(startScheduledSubscriptionSync({ pool: db.makePool().pool, sync, minGapMs: SCHEDULED_SYNC_MIN_GAP_MS }));

      startServer(); // server A: runs at 1 min, then every 6 h
      await vi.advanceTimersByTimeAsync(20 * 60 * 1000);
      startServer(); // server B: 20 minutes behind A
      await vi.advanceTimersByTimeAsync(2 * HOUR);
      startServer(); // server C: e.g. a restart 2 h 20 min in

      // Three full cycles.
      await vi.advanceTimersByTimeAsync(18 * HOUR);
      expect(sync).toHaveBeenCalledTimes(4); // start-up run + one per 6-hour cycle
      stops.forEach((stop) => stop());
    } finally {
      vi.useRealTimers();
    }
  });
});
