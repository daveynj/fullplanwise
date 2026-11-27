// @vitest-environment node
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { handleGatewayRequest, type CountryRequest } from "../cloudflare/signup-gateway/worker";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(), query: vi.fn(), release: vi.fn(), getUser: vi.fn(), save: vi.fn(),
  createSession: vi.fn(), customersList: vi.fn(), customersCreate: vi.fn(),
  subscriptionsList: vi.fn(), sessionsList: vi.fn(),
}));
vi.mock("./db", () => ({ pool: { connect: mocks.connect } }));
vi.mock("./storage", () => ({ storage: { getUser: mocks.getUser, updateUser: mocks.save } }));
vi.mock("./features", () => ({ isFreeTrialActive: () => false }));
vi.mock("./stripeClient", () => ({
  getStripeSecretKey: async () => "sk_test_synthetic_not_a_real_key",
  getLegacyStripeSecretKey: () => undefined,
}));
vi.mock("stripe", () => ({
  default: vi.fn(function () {
    return {
      customers: { list: mocks.customersList, create: mocks.customersCreate },
      subscriptions: { list: mocks.subscriptionsList },
      checkout: { sessions: { list: mocks.sessionsList, create: mocks.createSession } },
    };
  }),
}));
import { subscriptionCheckoutRoute } from "./subscription-checkout-route";

const publicOrigin = "https://staging.example.invalid";
const env = {
  ORIGIN_HOSTNAME: "test-origin.replit.app", PUBLIC_HOSTS: "staging.example.invalid",
  GATEWAY_AUDIENCE: "local-checkout", REGISTRATION_GATEWAY_SECRET: "local-test-only-gateway-secret-not-a-real-key",
};
let server: Server;
let base: string;
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    if (req.headers.cookie === "connect.sid=public-session") req.user = { id: 7 };
    next();
  });
  app.post("/api/subscriptions/create", subscriptionCheckoutRoute);
  app.get("/subscription-success", (req, res) => {
    res.status(req.user ? 200 : 401).json({ authenticated: Boolean(req.user) });
  });
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => {
  vi.unstubAllEnvs();
  return new Promise<void>((resolve) => server.close(() => resolve()));
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("REGISTRATION_GATEWAY_MODE", "enforce");
  vi.stubEnv("PUBLIC_APP_URL", publicOrigin);
  mocks.query.mockResolvedValue({ rows: [{ locked: true }] });
  mocks.connect.mockResolvedValue({ query: mocks.query, release: mocks.release });
  mocks.getUser.mockResolvedValue({
    id: 7, email: "teacher@example.invalid", username: "teacher",
    stripeCustomerId: null, stripeSubscriptionId: null, subscriptionTier: "free",
  });
  mocks.customersList.mockResolvedValue({ data: [], has_more: false });
  mocks.customersCreate.mockResolvedValue({ id: "cus_test" });
  mocks.subscriptionsList.mockResolvedValue({ data: [], has_more: false });
  mocks.sessionsList.mockResolvedValue({ data: [], has_more: false });
  mocks.createSession.mockResolvedValue({ id: "cs_test", url: "https://checkout.stripe.com/test-only" });
});
const localOrigin = (req: Request) => {
  const url = new URL(req.url);
  return fetch(new Request(`${base}${url.pathname}${url.search}`, req));
};
// A host-scoped session cookie is sent only to its public origin, just as a
// browser's cookie jar would behave. A .replit.app return would lose the cookie.
const cookieFor = (url: string) => new URL(url).origin === publicOrigin ? "connect.sid=public-session" : "";

describe("checkout through the gateway (all Stripe and storage operations mocked)", () => {
  it("gives Stripe public success/cancel URLs and preserves the authenticated return on that host", async () => {
    const request = new Request(`${publicOrigin}/api/subscriptions/create`, {
      method: "POST", headers: {
        "Content-Type": "application/json", cookie: cookieFor(publicOrigin),
        "X-Forwarded-Host": "attacker.example.invalid",
      },
      body: JSON.stringify({ planId: "unlimited_monthly", priceId: "price_unlimited_monthly" }),
    });
    Object.defineProperty(request, "cf", { value: { country: "IN" } });
    const response = await handleGatewayRequest(request as CountryRequest, env, localOrigin);
    expect(response.status).toBe(200);
    const params = mocks.createSession.mock.calls[0][0];
    expect(params.success_url).toBe(`${publicOrigin}/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=unlimited_monthly`);
    expect(params.cancel_url).toBe(`${publicOrigin}/buy-credits`);
    expect(params.success_url).not.toContain(env.ORIGIN_HOSTNAME);
    const returnUrl = params.success_url.replace("{CHECKOUT_SESSION_ID}", "cs_test");
    const returned = await handleGatewayRequest(new Request(returnUrl, {
      headers: { cookie: cookieFor(returnUrl) },
    }) as CountryRequest, env, localOrigin);
    expect(returned.status).toBe(200);
    expect((await returned.json()).authenticated).toBe(true);
  });
  it("ignores forged request Host and forwarding headers even on a direct-origin checkout", async () => {
    const res = await fetch(`${base}/api/subscriptions/create`, {
      method: "POST", headers: {
        "Content-Type": "application/json", cookie: "connect.sid=public-session",
        Host: "attacker.example.invalid", "X-Forwarded-Host": "other.example.invalid",
        "X-Forwarded-Proto": "http",
      },
      body: JSON.stringify({ planId: "unlimited_monthly", priceId: "price_unlimited_monthly" }),
    });
    expect(res.status).toBe(200);
    expect(mocks.createSession.mock.calls[0][0].success_url.startsWith(`${publicOrigin}/`)).toBe(true);
  });
  it("does not open checkout or create a customer if gateway public URL configuration is missing", async () => {
    vi.stubEnv("PUBLIC_APP_URL", "");
    const res = await fetch(`${base}/api/subscriptions/create`, {
      method: "POST", headers: { "Content-Type": "application/json", cookie: "connect.sid=public-session" },
      body: JSON.stringify({ planId: "unlimited_monthly", priceId: "price_unlimited_monthly" }),
    });
    expect(res.status).toBe(503);
    expect(mocks.connect).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
    expect(mocks.customersCreate).not.toHaveBeenCalled();
  });
});
