// @vitest-environment node
//
// Tests for POST /api/subscriptions/cancel guarding against Stripe
// subscriptions with a missing/invalid current_period_end (the "Invalid Date"
// bug), plus the happy path persisting the item-level period end.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";

const TEST_USER_ID = 1;

// --- Mocks -----------------------------------------------------------------

const mockStripe = {
  customers: { retrieve: vi.fn(), create: vi.fn(), list: vi.fn() },
  checkout: { sessions: { create: vi.fn(), list: vi.fn() } },
  subscriptions: {
    retrieve: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
  },
};
const mockLegacyStripe = {
  subscriptions: { retrieve: vi.fn(), update: vi.fn() },
};
const mockCancellationAccounts = vi.fn();

vi.mock("stripe", () => ({
  default: vi.fn(function () { return mockStripe; }),
}));

vi.mock("./stripeClient", () => ({
  getUncachableStripeClient: vi.fn(async () => mockStripe),
  getStripePublishableKey: vi.fn(async () => "pk_test"),
  getStripeSecretKey: vi.fn(async () => "sk_test"),
  getLegacyStripeSecretKey: vi.fn(() => undefined),
  getStripeSync: vi.fn(async () => ({})),
  getBillingHealthAccounts: () => mockCancellationAccounts(),
}));

const mockStorage = {
  getUser: vi.fn(),
  updateUser: vi.fn(),
  updateUserStripeInfo: vi.fn(),
};

vi.mock("./storage", () => ({
  storage: new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop in mockStorage) return (mockStorage as any)[prop];
        return vi.fn(async () => undefined);
      },
    },
  ),
}));

// Authenticate every request as the test user.
vi.mock("./auth", () => ({
  setupAuth: (app: express.Express) => {
    app.use((req: any, _res, next) => {
      req.isAuthenticated = () => true;
      req.user = { id: TEST_USER_ID };
      next();
    });
  },
  hashPassword: vi.fn(),
  comparePasswords: vi.fn(),
}));

vi.mock("./features", () => ({
  isFreeTrialActive: () => false,
  getFreeTrialEndDate: () => null,
}));

// Avoid touching the real database or third-party services at import time.
vi.mock("./db", () => ({
  db: { execute: vi.fn(), transaction: vi.fn() },
  pool: {
    query: vi.fn(), end: vi.fn(),
    connect: vi.fn(async () => ({
      query: vi.fn(async () => ({ rows: [{ locked: true }] })),
      release: vi.fn(),
    })),
  },
}));
vi.mock("./services/mailchimp.service", () => ({
  mailchimpService: {},
}));
vi.mock("./services/openRouter", () => ({
  testOpenRouterConnection: vi.fn(),
  openRouterService: {},
}));
vi.mock("./services/image-generation.service", () => ({
  testImageGeneration: vi.fn(),
}));

// --- Test server -----------------------------------------------------------

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const { registerRoutes } = await import("./routes");
  const app = express();
  app.use(express.json());
  server = await registerRoutes(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

beforeEach(() => {
  mockCancellationAccounts.mockReturnValue([
    { account: "primary", client: mockStripe },
    { account: "legacy", client: mockLegacyStripe },
  ]);
  mockLegacyStripe.subscriptions.retrieve.mockReset();
  mockLegacyStripe.subscriptions.retrieve.mockRejectedValue({ code: "resource_missing", statusCode: 404 });
  mockLegacyStripe.subscriptions.update.mockReset();
  mockStripe.customers.retrieve.mockReset();
  mockStripe.customers.create.mockReset();
  mockStripe.checkout.sessions.create.mockReset();
  mockStorage.updateUserStripeInfo.mockReset();
  mockStripe.subscriptions.retrieve.mockReset();
  mockStripe.subscriptions.update.mockReset();
  mockStorage.getUser.mockReset();
  mockStorage.updateUser.mockReset();
  mockStripe.customers.list.mockResolvedValue({ data: [], has_more: false });
  mockStripe.subscriptions.list.mockResolvedValue({ data: [], has_more: false });
  mockStripe.checkout.sessions.list.mockResolvedValue({ data: [], has_more: false });

  mockStorage.getUser.mockResolvedValue({
    id: TEST_USER_ID,
    stripeSubscriptionId: "sub_test_123",
  });
  mockStorage.updateUser.mockResolvedValue({ id: TEST_USER_ID });
});

async function cancel() {
  const res = await fetch(`${baseUrl}/api/subscriptions/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return { status: res.status, body: await res.json() };
}

describe("POST /api/subscriptions/create", () => {
  async function create() {
    const response = await fetch(`${baseUrl}/api/subscriptions/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "unlimited_monthly", priceId: "price_unlimited_monthly" }),
    });
    return { status: response.status, body: await response.json() };
  }

  it("does not change the customer or subscription on expired credentials and keeps provider details private", async () => {
    mockStorage.getUser.mockResolvedValue({
      id: TEST_USER_ID, stripeCustomerId: "cus_existing", stripeSubscriptionId: "sub_canceled", subscriptionTier: "free",
    });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    mockStripe.customers.retrieve.mockRejectedValue({
      type: "StripeAuthenticationError", statusCode: 401,
      message: "Expired API Key provided: secret-must-not-appear",
    });
    try {
      const result = await create();
      expect(result.status).toBe(503);
      expect(result.body.code).toBe("BILLING_UNAVAILABLE");
      expect(result.body.message).toMatch(/contact support/i);
      expect(JSON.stringify(result)).not.toContain("secret-must-not-appear");
      expect(JSON.stringify(logger.mock.calls)).not.toContain("secret-must-not-appear");
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
      expect(mockStorage.updateUserStripeInfo).not.toHaveBeenCalled();
      expect(mockStorage.updateUser).not.toHaveBeenCalled();
    } finally {
      logger.mockRestore();
    }
  });

  it("opens checkout for a returning unsubscribed customer using their existing customer ID", async () => {
    mockStorage.getUser.mockResolvedValue({
      id: TEST_USER_ID, stripeCustomerId: "cus_existing", stripeSubscriptionId: "sub_canceled", subscriptionTier: "free",
    });
    mockStripe.customers.retrieve.mockResolvedValue({ id: "cus_existing" });
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_canceled", customer: "cus_existing", status: "canceled",
    });
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: "cs_mock", url: "https://checkout.stripe.com/mock" });
    const result = await create();
    expect(result.status).toBe(200);
    expect(result.body.url).toBe("https://checkout.stripe.com/mock");
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      customer: "cus_existing", mode: "subscription",
      line_items: [{ price: "price_1Timp4Bnt8Mku7BYBMYUVYrF", quantity: 1 }],
      payment_method_types: ["card"],
    }), expect.objectContaining({ idempotencyKey: expect.any(String) }));
    expect(mockStripe.customers.create).not.toHaveBeenCalled();
    expect(mockStorage.updateUserStripeInfo).not.toHaveBeenCalled();
    expect(mockStorage.updateUser).not.toHaveBeenCalled();
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
  });
});

// --- Tests -------------------------------------------------------------

describe("POST /api/subscriptions/cancel", () => {
  const subscription = {
    id: "sub_test_123", customer: "cus_owner", status: "active",
    items: { data: [{ current_period_end: 1795000000 }] },
  };
  function expectNoChanges() {
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
    expect(mockLegacyStripe.subscriptions.update).not.toHaveBeenCalled();
    expect(mockStorage.updateUser).not.toHaveBeenCalled();
    expect(mockStorage.updateUserStripeInfo).not.toHaveBeenCalled();
  }

  it("cancels a legacy subscription only in its owning merchant and keeps access and links", async () => {
    mockStripe.subscriptions.retrieve.mockRejectedValue({ code: "resource_missing", statusCode: 404 });
    mockLegacyStripe.subscriptions.retrieve.mockResolvedValue(subscription);
    const result = await cancel();
    expect(result).toMatchObject({ status: 200, body: { endTimestamp: 1795000000 } });
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
    expect(mockLegacyStripe.subscriptions.update).toHaveBeenCalledExactlyOnceWith("sub_test_123", { cancel_at_period_end: true });
    expect(mockStorage.updateUser).toHaveBeenCalledExactlyOnceWith(TEST_USER_ID, {
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: new Date(1795000000000),
    });
    expect(mockStorage.updateUserStripeInfo).not.toHaveBeenCalled();
  });

  it("does not cancel when neither merchant contains the linked subscription", async () => {
    mockStripe.subscriptions.retrieve.mockRejectedValue({ code: "resource_missing", statusCode: 404 });
    expect(await cancel()).toMatchObject({ status: 404, body: { code: "SUBSCRIPTION_NOT_FOUND" } });
    expectNoChanges();
  });

  it("does not cancel when both clients find a subscription (including duplicate merchant credentials)", async () => {
    mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
    mockLegacyStripe.subscriptions.retrieve.mockResolvedValue(subscription);
    expect(await cancel()).toMatchObject({ status: 409, body: { code: "CANCELLATION_AMBIGUOUS" } });
    expectNoChanges();
  });

  it.each(["primary", "legacy"])("fails closed when the %s credential is unavailable", async (account) => {
    mockCancellationAccounts.mockReturnValue([
      { account: "primary", client: account === "primary" ? null : mockStripe },
      { account: "legacy", client: account === "legacy" ? null : mockLegacyStripe },
    ]);
    expect(await cancel()).toMatchObject({ status: 503, body: { code: "CANCELLATION_UNAVAILABLE" } });
    expectNoChanges();
  });

  it.each([
    { statusCode: 401, type: "StripeAuthenticationError" },
    { statusCode: 403, type: "StripePermissionError" },
    { statusCode: 429 },
    { statusCode: 500 },
    { type: "StripeConnectionError" },
    { statusCode: 404 }, // A generic 404 alone is not proof of a missing subscription.
  ])("never mutates or exposes provider errors on lookup failure: %j", async (error) => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
    mockLegacyStripe.subscriptions.retrieve.mockRejectedValue({ ...error, message: "sk_mock_sensitive_fragment" });
    try {
      const result = await cancel();
      expect(result.status).toBe(503);
      expect(JSON.stringify(result)).not.toContain("sk_mock_sensitive_fragment");
      expect(JSON.stringify(logger.mock.calls)).not.toContain("sk_mock_sensitive_fragment");
      expectNoChanges();
    } finally {
      logger.mockRestore();
    }
  });

  it("does not use legacy after a main-account lookup error", async () => {
    mockStripe.subscriptions.retrieve.mockRejectedValue({ statusCode: 401 });
    mockLegacyStripe.subscriptions.retrieve.mockResolvedValue(subscription);
    expect((await cancel()).status).toBe(503);
    expectNoChanges();
  });

  it("rejects a linked subscription belonging to another customer", async () => {
    mockStorage.getUser.mockResolvedValue({ id: TEST_USER_ID, stripeSubscriptionId: subscription.id, stripeCustomerId: "cus_other" });
    mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
    expect((await cancel()).status).toBe(409);
    expectNoChanges();
  });

  it("retries an already scheduled cancellation without another Stripe mutation", async () => {
    mockStripe.subscriptions.retrieve.mockResolvedValue({ ...subscription, cancel_at_period_end: true });
    expect((await cancel()).status).toBe(200);
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
    expect(mockStorage.updateUser).toHaveBeenCalledTimes(1);
  });

  it.each(["update", "save"])("explains an uncertain %s safely without claiming cancellation failed", async (phase) => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
    const error = new Error("sk_mock_sensitive_fragment");
    if (phase === "update") mockStripe.subscriptions.update.mockRejectedValue(error);
    else mockStorage.updateUser.mockRejectedValue(error);
    try {
      const result = await cancel();
      expect(result).toMatchObject({ status: 503, body: { code: "CANCELLATION_UNCONFIRMED" } });
      expect(result.body.message).toMatch(/confirm whether your subscription will renew/);
      expect(JSON.stringify(result)).not.toContain(error.message);
      expect(JSON.stringify(logger.mock.calls)).not.toContain(error.message);
      if (phase === "update") expect(mockStorage.updateUser).not.toHaveBeenCalled();
    } finally {
      logger.mockRestore();
    }
  });

  it.each(["canceled", "incomplete_expired"])("does not mutate an ended %s subscription", async (status) => {
    mockStripe.subscriptions.retrieve.mockResolvedValue({ ...subscription, status });
    expect((await cancel()).status).toBe(409);
    expectNoChanges();
  });

  it.each([Infinity, -1, 1e100])("rejects an invalid period end %s before mutation", async (periodEnd) => {
    mockStripe.subscriptions.retrieve.mockResolvedValue({ ...subscription, current_period_end: periodEnd, items: { data: [] } });
    expect((await cancel()).status).toBe(500);
    expectNoChanges();
  });

  it("returns 500 with a clear message and does not cancel when current_period_end is missing", async () => {
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_test_123",
      items: { data: [{ id: "si_1" }] }, // no current_period_end anywhere
    });

    const { status, body } = await cancel();

    expect(status).toBe(500);
    expect(body.message).toMatch(/could not determine the billing period end/i);
    expect(body.message).toMatch(/was not cancelled/i);
    // The subscription must NOT be cancelled or persisted as cancelled.
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
    expect(mockStorage.updateUser).not.toHaveBeenCalled();
  });

  it("returns 500 and does not cancel when current_period_end is not a finite number", async () => {
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_test_123",
      items: { data: [{ id: "si_1", current_period_end: "not-a-number" }] },
      current_period_end: NaN,
    });

    const { status, body } = await cancel();

    expect(status).toBe(500);
    expect(body.message).toMatch(/could not determine the billing period end/i);
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
    expect(mockStorage.updateUser).not.toHaveBeenCalled();
  });

  it("happy path: persists subscriptionCurrentPeriodEnd from the item-level timestamp", async () => {
    const itemPeriodEnd = 1790000000; // item-level value must win
    const topLevelPeriodEnd = 1700000000;
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_test_123",
      items: { data: [{ id: "si_1", current_period_end: itemPeriodEnd }] },
      current_period_end: topLevelPeriodEnd,
    });
    mockStripe.subscriptions.update.mockResolvedValue({ id: "sub_test_123" });

    const { status, body } = await cancel();

    expect(status).toBe(200);
    expect(body.endTimestamp).toBe(itemPeriodEnd);
    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith("sub_test_123", {
      cancel_at_period_end: true,
    });
    expect(mockLegacyStripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_test_123");
    expect(mockLegacyStripe.subscriptions.update).not.toHaveBeenCalled();
    expect(mockStorage.updateUser).toHaveBeenCalledTimes(1);
    const [userId, update] = mockStorage.updateUser.mock.calls[0];
    expect(userId).toBe(TEST_USER_ID);
    expect(update.subscriptionCancelAtPeriodEnd).toBe(true);
    expect(update.subscriptionCurrentPeriodEnd).toBeInstanceOf(Date);
    expect(update.subscriptionCurrentPeriodEnd.getTime()).toBe(itemPeriodEnd * 1000);
  });

  it("falls back to the top-level current_period_end when item-level is missing", async () => {
    const topLevelPeriodEnd = 1795000000;
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_test_123",
      items: { data: [{ id: "si_1" }] },
      current_period_end: topLevelPeriodEnd,
    });
    mockStripe.subscriptions.update.mockResolvedValue({ id: "sub_test_123" });

    const { status, body } = await cancel();

    expect(status).toBe(200);
    expect(body.endTimestamp).toBe(topLevelPeriodEnd);
    const [, update] = mockStorage.updateUser.mock.calls[0];
    expect(update.subscriptionCurrentPeriodEnd.getTime()).toBe(topLevelPeriodEnd * 1000);
  });
});
