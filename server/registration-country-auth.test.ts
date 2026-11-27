// @vitest-environment node
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setupAuth } from "./auth";
import { captureRegistrationBody } from "./registration-gateway";
import { handleGatewayRequest, type CountryRequest } from "../cloudflare/signup-gateway/worker";

const mocks = vi.hoisted(() => ({
  getUsersByEmail: vi.fn(),
  getUserByUsername: vi.fn(),
  getUser: vi.fn(),
  createUser: vi.fn(),
  addMember: vi.fn(),
  updateLastLogin: vi.fn(),
  consumeRegistrationNonce: vi.fn(),
}));
vi.mock("./storage", () => ({ storage: mocks }));
vi.mock("./services/mailchimp.service", () => ({ mailchimpService: { addMember: mocks.addMember } }));
vi.mock("./registration-gateway-nonces", () => ({ consumeRegistrationNonce: mocks.consumeRegistrationNonce }));

let server: Server;
let base: string;
beforeAll(async () => {
  const app = express();
  app.use(express.json({ verify: captureRegistrationBody }));
  setupAuth(app);
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
  vi.stubEnv("ENABLE_REGISTRATION_COUNTRY_RESTRICTIONS", "true");
  vi.stubEnv("REGISTRATION_GATEWAY_MODE", "off");
  mocks.getUsersByEmail.mockResolvedValue([]);
  mocks.getUserByUsername.mockResolvedValue(undefined);
  mocks.addMember.mockResolvedValue({ success: true });
  mocks.updateLastLogin.mockResolvedValue(undefined);
  mocks.consumeRegistrationNonce.mockResolvedValue(true);
  // No database writes or external email requests occur in these tests.
  mocks.createUser.mockImplementation(async (input) => ({
    ...input, id: 999, subscriptionTier: "free", isAdmin: false,
    trialExpiresAt: new Date(Date.now() + 5 * 86400000),
  }));
});
const signup = (ip: string) => fetch(`${base}/api/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
  body: JSON.stringify({ username: "geotest", email: "geotest@example.invalid", password: "Test-password-42" }),
});

describe("country checks on the real authentication routes", () => {
  it("the default disabled configuration preserves signup without country headers", async () => {
    vi.stubEnv("ENABLE_REGISTRATION_COUNTRY_RESTRICTIONS", "");
    const res = await fetch(`${base}/api/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "normal-signup", email: "normal@example.invalid", password: "Test-password-42" }),
    });
    expect(res.status).toBe(201);
    expect(mocks.createUser).toHaveBeenCalledOnce();
    expect(mocks.consumeRegistrationNonce).not.toHaveBeenCalled();
  });

  it.each(["49.36.0.1", "103.4.144.1"])("does not create a trial, enroll in email or issue a session for %s", async (ip) => {
    const res = await signup(ip);
    expect(res.status).toBe(403);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(mocks.getUsersByEmail).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.addMember).not.toHaveBeenCalled();
  });

  it("allows eligible visitors through the real signup and login-session flow", async () => {
    const res = await signup("8.8.8.8");
    expect(res.status).toBe(201);
    const user = await res.json();
    expect(user.username).toBe("geotest");
    expect(user.trialExpiresAt).toBeTruthy();
    expect(user).not.toHaveProperty("password");
    expect(res.headers.get("set-cookie")).toContain("connect.sid=");
    expect(mocks.createUser).toHaveBeenCalledOnce();
    expect(mocks.addMember).toHaveBeenCalledOnce();
  });

  it("does not change existing accounts or prevent existing-member login from a blocked country", async () => {
    await signup("8.8.8.8");
    const existing = await mocks.createUser.mock.results[0].value;
    mocks.getUserByUsername.mockResolvedValue(existing);
    const res = await fetch(`${base}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "49.36.0.1" },
      body: JSON.stringify({ username: existing.username, password: "Test-password-42" }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(existing.id);
    expect(mocks.createUser).toHaveBeenCalledOnce(); // Only the initial signup.
  });
});

describe("gateway mode on real signup and trial creation", () => {
  const secret = "test-only-gateway-key-not-a-real-credential";
  const audience = "local-auth-staging";
  const environment = {
    ORIGIN_HOSTNAME: "test-origin.replit.app", PUBLIC_HOSTS: "staging.example.invalid",
    GATEWAY_AUDIENCE: audience, REGISTRATION_GATEWAY_SECRET: secret,
  };
  beforeEach(() => {
    vi.stubEnv("REGISTRATION_GATEWAY_MODE", "enforce");
    vi.stubEnv("REGISTRATION_GATEWAY_SECRET", secret);
    vi.stubEnv("REGISTRATION_GATEWAY_AUDIENCE", audience);
  });
  function gatewaySignup(country: string) {
    const req = new Request("https://staging.example.invalid/API/REGISTER/?ref=lesson", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "gateway-signup", email: "gateway@example.invalid", password: "Test-password-42" }),
    });
    Object.defineProperty(req, "cf", { value: { country } });
    return handleGatewayRequest(req as CountryRequest, environment, async (outgoing) => {
      const url = new URL(outgoing.url);
      return fetch(new Request(`${base}${url.pathname}${url.search}`, outgoing));
    });
  }
  it("creates an eligible account, trial and session without geolocating the gateway", async () => {
    const res = await gatewaySignup("GB");
    expect(res.status).toBe(201);
    expect((await res.json()).trialExpiresAt).toBeTruthy();
    expect(res.headers.get("set-cookie")).toContain("connect.sid=");
    expect(mocks.consumeRegistrationNonce).toHaveBeenCalledOnce();
    expect(mocks.createUser).toHaveBeenCalledOnce();
    expect(mocks.addMember).toHaveBeenCalledOnce();
  });
  it.each(["IN", "BD", "XX"])("denies %s before any account/trial/session/email is created", async (country) => {
    const res = await gatewaySignup(country);
    expect(res.status).toBe(country === "XX" ? 503 : 403);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.addMember).not.toHaveBeenCalled();
    expect(mocks.consumeRegistrationNonce).not.toHaveBeenCalled();
  });
  it("denies direct-origin registration before account creation in gateway mode", async () => {
    const res = await signup("8.8.8.8");
    expect(res.status).toBe(403);
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.addMember).not.toHaveBeenCalled();
  });
  it("does not apply the gateway requirement to an existing-member login", async () => {
    const registered = await gatewaySignup("US");
    expect(registered.status).toBe(201);
    const user = await mocks.createUser.mock.results[0].value;
    mocks.getUserByUsername.mockResolvedValue(user);
    const res = await fetch(`${base}/api/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user.username, password: "Test-password-42" }),
    });
    expect(res.status).toBe(200);
    expect(mocks.createUser).toHaveBeenCalledOnce();
  });
});
