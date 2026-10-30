// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

// Exercise the real route, guard AND storage methods. Only the external
// database transport, session store and Stripe SDK are replaced.
const state = vi.hoisted(() => ({
  row: {} as any,
  patches: [] as any[],
  primary: {} as any,
  legacy: {} as any,
}));
vi.mock("./db", () => ({
  pool: {
    connect: vi.fn(async () => ({
      query: vi.fn(async () => ({ rows: [{ locked: true }] })),
      release: vi.fn(),
    })),
  },
  db: {
    select: () => ({ from: () => ({ where: async () => [{ ...state.row }] }) }),
    update: () => ({
      set: (patch: any) => {
        state.patches.push(patch);
        return { where: () => ({ returning: async () => {
          Object.assign(state.row, patch);
          return [{ ...state.row }];
        } }) };
      },
    }),
  },
}));
vi.mock("./session-store", () => ({ createSessionStore: vi.fn(() => ({})) }));
vi.mock("./features", () => ({ isFreeTrialActive: () => false }));
vi.mock("./stripeClient", () => ({
  getStripeSecretKey: async () => "mock-primary",
  getLegacyStripeSecretKey: () => "mock-legacy",
}));
vi.mock("stripe", () => ({
  default: vi.fn(function (key: string) {
    return key === "mock-primary" ? state.primary : state.legacy;
  }),
}));
import { subscriptionCheckoutRoute } from "./subscription-checkout-route";

const missing = { code: "resource_missing" };
function account() {
  return {
    customers: {
      retrieve: vi.fn().mockRejectedValue(missing),
      list: vi.fn().mockResolvedValue({ data: [], has_more: false }),
      create: vi.fn().mockResolvedValue({ id: "cus_primary_new" }),
    },
    subscriptions: {
      retrieve: vi.fn().mockRejectedValue(missing),
      list: vi.fn().mockResolvedValue({ data: [], has_more: false }),
    },
    checkout: { sessions: {
      list: vi.fn().mockResolvedValue({ data: [], has_more: false }),
      create: vi.fn().mockResolvedValue({ id: "cs_mock", url: "https://checkout.example/mock" }),
    } },
  };
}

beforeEach(() => {
  state.row = {
    id: 7, username: "teacher", email: "teacher@example.test",
    subscriptionTier: "free", stripeCustomerId: "cus_legacy", stripeSubscriptionId: "sub_canceled_legacy",
  };
  state.patches = [];
  state.primary = account();
  state.legacy = account();
  state.legacy.customers.retrieve.mockResolvedValue({ id: "cus_legacy" });
  state.legacy.subscriptions.retrieve.mockResolvedValue({
    id: "sub_canceled_legacy", status: "canceled", customer: "cus_legacy",
  });
});

describe("opening checkout never activates a returning subscriber", () => {
  it.each([false, true])("keeps a canceled legacy subscriber free when checkout failure=%s", async (fails) => {
    if (fails) state.primary.checkout.sessions.create.mockRejectedValue(new Error("mock checkout failure"));
    let status = 200;
    let body: any;
    const req = {
      user: { id: 7 }, body: { planId: "unlimited_monthly", priceId: "price_unlimited_monthly" },
      protocol: "https", get: (name: string) => name === "host" ? "app.example" : undefined,
    } as unknown as Request;
    const res = {
      status(code: number) { status = code; return this; },
      json(value: unknown) { body = value; return this; },
    } as unknown as Response;
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await subscriptionCheckoutRoute(req, res);
      expect(status).toBe(fails ? 503 : 200);
      expect(body).toBeDefined();
      expect(state.patches).toEqual([{ stripeCustomerId: "cus_primary_new" }]);
      expect(state.row).toMatchObject({
        subscriptionTier: "free",
        stripeCustomerId: "cus_primary_new",
        stripeSubscriptionId: "sub_canceled_legacy",
      });
      expect(state.primary.checkout.sessions.create).toHaveBeenCalledTimes(1);
    } finally { logger.mockRestore(); }
  });
});
