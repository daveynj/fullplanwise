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
  subscriptions: {
    retrieve: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("./stripeClient", () => ({
  getUncachableStripeClient: vi.fn(async () => mockStripe),
  getStripePublishableKey: vi.fn(async () => "pk_test"),
  getStripeSecretKey: vi.fn(async () => "sk_test"),
  getStripeSync: vi.fn(async () => ({})),
}));

const mockStorage = {
  getUser: vi.fn(),
  updateUser: vi.fn(),
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
  pool: { query: vi.fn(), end: vi.fn() },
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
  mockStripe.subscriptions.retrieve.mockReset();
  mockStripe.subscriptions.update.mockReset();
  mockStorage.getUser.mockReset();
  mockStorage.updateUser.mockReset();

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

// --- Tests -------------------------------------------------------------

describe("POST /api/subscriptions/cancel", () => {
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
