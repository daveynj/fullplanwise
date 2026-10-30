// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { AddressInfo } from "net";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), save: vi.fn(), secret: vi.fn(), checkout: vi.fn(),
  connect: vi.fn(), release: vi.fn(), query: vi.fn(),
  trial: false,
}));
vi.mock("./db", () => ({ pool: { connect: mocks.connect } }));
vi.mock("./storage", () => ({ storage: { getUser: mocks.getUser, updateUser: mocks.save } }));
vi.mock("./stripeClient", () => ({
  getStripeSecretKey: mocks.secret, getLegacyStripeSecretKey: () => undefined,
}));
vi.mock("./features", () => ({ isFreeTrialActive: () => mocks.trial }));
vi.mock("stripe", () => ({ default: vi.fn(function () { return {}; }) }));
vi.mock("./subscription-checkout", async (original) => ({
  ...await original<typeof import("./subscription-checkout")>(),
  createGuardedCheckout: mocks.checkout,
}));
import { subscriptionCheckoutRoute } from "./subscription-checkout-route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.trial = false;
  mocks.getUser.mockResolvedValue({ id: 7 });
  mocks.secret.mockResolvedValue("sk_mock_only");
  mocks.checkout.mockResolvedValue({ sessionId: "cs_mock", url: "https://checkout.example/mock" });
  mocks.query.mockResolvedValue({ rows: [{ locked: true }] });
  mocks.connect.mockResolvedValue({ query: mocks.query, release: mocks.release });
});

async function withServer(run: (post: (body?: unknown) => Promise<{ status: number; body: any }>) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => { req.user = { id: 7 }; next(); });
  app.post("/api/subscriptions/create", subscriptionCheckoutRoute);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    await run(async (body = { planId: "unlimited_monthly", priceId: "price_unlimited_monthly" }) => {
      const res = await fetch(`http://127.0.0.1:${port}/api/subscriptions/create`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      return { status: res.status, body: await res.json() };
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("checkout request serialization", () => {
  it("refuses concurrent requests across shared database connections; only one opens checkout", async () => {
    let held = false;
    mocks.connect.mockImplementation(async () => ({
      query: vi.fn(async (sql: string) => {
        if (sql.includes("pg_try_advisory_lock")) {
          if (held) return { rows: [{ locked: false }] };
          held = true;
          return { rows: [{ locked: true }] };
        }
        held = false;
        return { rows: [] };
      }),
      release: mocks.release,
    }));
    let finish!: () => void;
    let started!: () => void;
    const entered = new Promise<void>((resolve) => { started = resolve; });
    mocks.checkout.mockImplementationOnce(async () => {
      started();
      await new Promise<void>((resolve) => { finish = resolve; });
      return { sessionId: "cs_mock", url: "https://checkout.example/mock" };
    });
    await withServer(async (post) => {
      const first = post();
      await entered;
      const second = await post();
      expect(second).toMatchObject({ status: 409, body: { code: "CHECKOUT_IN_PROGRESS" } });
      finish();
      expect((await first).status).toBe(200);
      expect(mocks.checkout).toHaveBeenCalledTimes(1);
      expect(mocks.release).toHaveBeenCalledTimes(2);
      expect(held).toBe(false);
    });
  });

  it("releases the lock and keeps secret fragments out of responses on API failure", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.checkout.mockRejectedValueOnce({ type: "StripeAuthenticationError", message: "secret-fragment" });
    try {
      await withServer(async (post) => {
        const result = await post();
        expect(result).toMatchObject({ status: 503, body: { code: "BILLING_UNAVAILABLE" } });
        expect(JSON.stringify(result)).not.toContain("secret-fragment");
        expect(JSON.stringify(logger.mock.calls)).not.toContain("secret-fragment");
        expect(mocks.query).toHaveBeenLastCalledWith(expect.stringContaining("pg_advisory_unlock"), [7]);
        expect(mocks.release).toHaveBeenCalledWith(false);
        expect(mocks.save).not.toHaveBeenCalled();
      });
    } finally { logger.mockRestore(); }
  });

  it("destroys the connection if releasing the advisory lock fails", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ locked: true }] }).mockRejectedValueOnce(new Error("lost connection"));
    await withServer(async (post) => {
      expect((await post()).status).toBe(200);
      expect(mocks.release).toHaveBeenCalledWith(true);
    });
  });

  it("rejects arbitrary Stripe prices before any billing request", async () => {
    await withServer(async (post) => {
      expect((await post({ planId: "unlimited_monthly", priceId: "price_untrusted" })).status).toBe(400);
      expect(mocks.connect).not.toHaveBeenCalled();
      expect(mocks.checkout).not.toHaveBeenCalled();
    });
  });

  it("preserves the trial checkout restriction", async () => {
    mocks.trial = true;
    await withServer(async (post) => {
      expect((await post()).status).toBe(403);
      expect(mocks.connect).not.toHaveBeenCalled();
    });
  });
});
