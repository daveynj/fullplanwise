// @vitest-environment node
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { captureRegistrationBody, createRegistrationGatewayGuard } from "./registration-gateway";
import { gatewayHeaders, signGatewayRequest } from "../shared/registration-gateway";
import worker, { handleGatewayRequest, type CountryRequest } from "../cloudflare/signup-gateway/worker";

const secret = "local-test-only-signing-key-not-a-real-secret";
const audience = "local-staging";
const env = {
  ORIGIN_HOSTNAME: "test-origin.replit.app",
  PUBLIC_HOSTS: "staging.example.invalid,www.staging.example.invalid",
  GATEWAY_AUDIENCE: audience,
  REGISTRATION_GATEWAY_SECRET: secret,
};
const body = JSON.stringify({ username: "test", password: "never-a-real-account" });
const nonceSet = new Set<string>();
const consumeNonce = vi.fn(async (nonce: string) => {
  if (nonceSet.has(nonce)) return false;
  nonceSet.add(nonce);
  return true;
});
const createAccount = vi.fn();
let server: Server;
let base: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json({ verify: captureRegistrationBody }));
  app.use(express.urlencoded({ extended: false, verify: captureRegistrationBody }));
  const guard = createRegistrationGatewayGuard({
    config: () => ({ secret, audience }), consumeNonce, now: Date.now,
  });
  app.post("/api/register", guard, (_req, res) => {
    createAccount();
    res.status(201).json({ created: true });
  });
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
beforeEach(() => { nonceSet.clear(); vi.clearAllMocks(); });

async function signedHeaders(overrides: Record<string, string> = {}, raw = body) {
  return signGatewayRequest({
    audience, country: "GB", timestamp: String(Math.floor(Date.now() / 1000)),
    nonce: randomUUID(), method: "POST", target: "/api/register", ...overrides,
  }, new TextEncoder().encode(raw), secret);
}
const originRegister = (headers: Record<string, string>, raw = body, path = "/api/register") =>
  fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: raw });
function request(country?: string | null, path = "/api/register", options: RequestInit = {}): CountryRequest {
  const req = new Request(`https://staging.example.invalid${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body, ...options,
  });
  Object.defineProperty(req, "cf", { value: { country } });
  return req as CountryRequest;
}
const localOrigin = async (req: Request) => {
  const url = new URL(req.url);
  expect(url.hostname).toBe(env.ORIGIN_HOSTNAME);
  return fetch(new Request(`${base}${url.pathname}${url.search}`, req));
};

describe("origin attestation verification", () => {
  it("accepts an eligible signed request with exact bytes", async () => {
    expect((await originRegister(await signedHeaders())).status).toBe(201);
    expect(createAccount).toHaveBeenCalledOnce();
    expect(consumeNonce).toHaveBeenCalledOnce();
  });
  it("rejects direct origin and forged country headers", async () => {
    const res = await originRegister({ "CF-IPCountry": "GB", "X-Country": "GB" });
    expect(res.status).toBe(403);
    expect(createAccount).not.toHaveBeenCalled();
    expect(consumeNonce).not.toHaveBeenCalled();
  });
  it.each(["IN", "BD"])("rejects restricted %s even with a valid signature", async (country) => {
    const res = await originRegister(await signedHeaders({ country }));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("REGISTRATION_REGION_RESTRICTED");
    expect(createAccount).not.toHaveBeenCalled();
  });
  it.each(["XX", "T1", "ZZ"])("treats unknown country %s as unavailable", async (country) => {
    const res = await originRegister(await signedHeaders({ country }));
    expect(res.status).toBe(503);
    expect(createAccount).not.toHaveBeenCalled();
  });
  it.each([
    { audience: "wrong-audience" },
    { method: "GET" },
    { target: "/api/register?different=yes" },
    { timestamp: String(Math.floor(Date.now() / 1000) - 100) },
    { timestamp: String(Math.floor(Date.now() / 1000) + 100) },
  ])("rejects incorrect binding or freshness: %j", async (overrides) => {
    expect((await originRegister(await signedHeaders(overrides))).status).toBe(403);
    expect(createAccount).not.toHaveBeenCalled();
  });
  it("rejects body tampering, signature tampering, and country-header tampering", async () => {
    const headers = await signedHeaders();
    expect((await originRegister(headers, `${body} `)).status).toBe(403);
    expect((await originRegister({ ...headers, [gatewayHeaders.signature]: "0".repeat(64) })).status).toBe(403);
    expect((await originRegister({ ...headers, [gatewayHeaders.country]: "US" })).status).toBe(403);
    expect(createAccount).not.toHaveBeenCalled();
  });
  it("consumes a nonce atomically before account creation under concurrent replay", async () => {
    const headers = await signedHeaders();
    const responses = await Promise.all(Array.from({ length: 8 }, () => originRegister(headers)));
    expect(responses.filter((r) => r.status === 201)).toHaveLength(1);
    expect(responses.filter((r) => r.status === 403)).toHaveLength(7);
    expect(createAccount).toHaveBeenCalledOnce();
  });
  it("binds form-encoded requests to their original bytes too", async () => {
    const raw = "username=trial&fullName=Example+Teacher";
    const headers = await signedHeaders({}, raw);
    const res = await fetch(`${base}/api/register`, {
      method: "POST", body: raw,
      headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
    });
    expect(res.status).toBe(201);
  });
  it("fails safely if shared replay storage is unavailable", async () => {
    consumeNonce.mockRejectedValueOnce(new Error("internal database details"));
    const res = await originRegister(await signedHeaders());
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain("internal database details");
    expect(createAccount).not.toHaveBeenCalled();
  });
  it("fails safely if the signing configuration is missing", async () => {
    const guard = createRegistrationGatewayGuard({ config: () => ({ secret: "", audience }), consumeNonce, now: Date.now });
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    await guard({} as any, { setHeader: vi.fn(), status, json } as any, vi.fn());
    expect(status).toHaveBeenCalledWith(503);
  });
});

describe("Cloudflare gateway", () => {
  it.each(["IN", "BD"])("rejects %s before calling the origin", async (country) => {
    const origin = vi.fn();
    const res = await handleGatewayRequest(request(country), env, origin);
    expect(res.status).toBe(403);
    expect((await res.json()).message).toContain("Existing members can still sign in");
    expect(origin).not.toHaveBeenCalled();
  });
  it.each([undefined, null, "", "XX", "T1"])("rejects unknown metadata %s without trusting browser headers", async (country) => {
    const origin = vi.fn();
    const res = await handleGatewayRequest(request(country, "/api/register", {
      headers: { "CF-IPCountry": "US", "X-Country": "US" },
    }), env, origin);
    expect(res.status).toBe(503);
    expect(origin).not.toHaveBeenCalled();
  });
  it.each(["/api/register", "/API/REGISTER", "/api/register/", "/aPi/ReGiStEr/?ref=lesson"])(
    "signs an eligible request through to the real Express gate (%s)", async (path) => {
      const res = await handleGatewayRequest(request("GB", path), env, localOrigin);
      expect(res.status).toBe(201);
      expect(createAccount).toHaveBeenCalledOnce();
    },
  );
  it("ignores spoofed forwarding and attestation headers and uses provider metadata", async () => {
    const origin = vi.fn(async (req: Request) => {
      expect(req.headers.get("CF-IPCountry")).toBeNull();
      expect(req.headers.get("X-Forwarded-For")).toBeNull();
      expect(req.headers.get(gatewayHeaders.country)).toBe("GB");
      expect(req.headers.get(gatewayHeaders.nonce)).not.toBe("forged");
      return localOrigin(req);
    });
    const res = await handleGatewayRequest(request("GB", "/api/register", {
      headers: { "Content-Type": "application/json", "CF-IPCountry": "IN",
        "X-Forwarded-For": "49.36.0.1", [gatewayHeaders.nonce]: "forged" },
    }), env, origin);
    expect(res.status).toBe(201);
  });
  it.each([
    ["/esl-lessons", "GET"], ["/s/private-code", "GET"], ["/api/login", "POST"],
    ["/api/create-portal-session", "POST"], ["/api/user", "GET"],
  ])(
    "does not restrict non-signup traffic from India (%s %s)", async (path, method) => {
      const origin = vi.fn(async () => new Response("passthrough", { status: 200 }));
      const res = await handleGatewayRequest(request("IN", path, {
        method, ...(method === "GET" ? { body: undefined } : {}),
      }), env, origin);
      expect(res.status).toBe(200);
      expect(origin).toHaveBeenCalledOnce();
    },
  );
  it("preserves Stripe webhook bytes, signature, status and cookies without caching", async () => {
    const raw = '{"id":"evt_test_only", "data": { "text":"é" }}\n';
    const origin = vi.fn(async (req: Request) => {
      expect(await req.text()).toBe(raw);
      expect(req.headers.get("stripe-signature")).toBe("test-signature-not-real");
      expect(req.headers.get("cookie")).toBe("connect.sid=test-cookie");
      expect(req.cache).toBe("no-store");
      const headers = new Headers({ "Cache-Control": "public, max-age=3600" });
      headers.append("Set-Cookie", "first=one; HttpOnly; Path=/");
      headers.append("Set-Cookie", "second=two; Secure; Path=/");
      return new Response("accepted", { status: 202, headers });
    });
    const res = await handleGatewayRequest(request("BD", "/api/stripe/webhook", {
      body: raw, headers: { "Content-Type": "application/json",
        "stripe-signature": "test-signature-not-real", cookie: "connect.sid=test-cookie" },
    }), env, origin);
    expect(res.status).toBe(202);
    expect(await res.text()).toBe("accepted");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(res.headers.getSetCookie()).toHaveLength(2);
  });
  it("rewrites origin redirects to the public hostname but preserves external checkout redirects", async () => {
    for (const [location, expected] of [
      [`https://${env.ORIGIN_HOSTNAME}/dashboard?x=1`, "https://staging.example.invalid/dashboard?x=1"],
      ["https://checkout.stripe.com/example", "https://checkout.stripe.com/example"],
    ]) {
      const origin = vi.fn(async () => new Response(null, { status: 302, headers: { Location: location } }));
      const res = await handleGatewayRequest(request("US", "/api/login"), env, origin);
      expect(res.headers.get("Location")).toBe(expected);
      expect(origin).toHaveBeenCalledOnce();
      expect((origin.mock.calls[0] as any)[0].redirect).toBe("manual");
    }
  });
  it("does not forward oversized signup bodies", async () => {
    const origin = vi.fn();
    const res = await handleGatewayRequest(request("GB", "/api/register", { body: "x".repeat(65537) }), env, origin);
    expect(res.status).toBe(413);
    expect(origin).not.toHaveBeenCalled();
  });
  it("cannot be used as an open proxy to an arbitrary hostname", async () => {
    const origin = vi.fn();
    const res = await handleGatewayRequest(request("GB"), { ...env, ORIGIN_HOSTNAME: "attacker.example.invalid" }, origin);
    expect(res.status).toBe(503);
    expect(origin).not.toHaveBeenCalled();
  });
  it("fails closed for a missing signing key or unapproved public host", async () => {
    for (const changed of [{ REGISTRATION_GATEWAY_SECRET: "" }, { PUBLIC_HOSTS: "other.example.invalid" }]) {
      const origin = vi.fn();
      const res = await handleGatewayRequest(request("GB"), { ...env, ...changed }, origin);
      expect(res.status).toBe(503);
      expect(origin).not.toHaveBeenCalled();
    }
  });
  it("preserves existing-member access if signup signing configuration is unavailable", async () => {
    const origin = vi.fn(async () => new Response("login still available"));
    const res = await handleGatewayRequest(request("IN", "/api/login"), {
      ...env, GATEWAY_AUDIENCE: "", REGISTRATION_GATEWAY_SECRET: "",
    }, origin);
    expect(res.status).toBe(200);
    expect(origin).toHaveBeenCalledOnce();
  });
  it("returns a readable, non-cached error when the origin cannot be reached", async () => {
    const res = await handleGatewayRequest(request("GB", "/api/login"), env, async () => {
      throw new Error("internal transport details");
    });
    expect(res.status).toBe(502);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(await res.text()).not.toContain("internal transport details");
  });
  it("the default entry point accepts Cloudflare's execution context as a third argument", () => {
    // The adapter must not accidentally pass the context object as originFetch.
    expect(worker.fetch.length).toBe(2);
  });
});
