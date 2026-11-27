// @vitest-environment node
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import geoip from "geoip-country";
import { restrictRegistrationCountry } from "./registration-country";
import { readFileSync } from "node:fs";

let server: Server;
let base: string;
const createAccountAndTrial = vi.fn();

beforeAll(async () => {
  const app = express();
  app.set("trust proxy", 1); // Same policy as setupAuth.
  app.use(express.json());
  app.post("/api/register", restrictRegistrationCountry, (_req, res) => {
    createAccountAndTrial();
    res.status(201).json({ created: true });
  });
  app.get("/esl-lessons", (_req, res) => res.sendStatus(200));
  app.post("/api/login", (_req, res) => res.sendStatus(200));
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
  vi.restoreAllMocks();
  vi.stubEnv("ENABLE_REGISTRATION_COUNTRY_RESTRICTIONS", "true");
  createAccountAndTrial.mockClear();
});

const register = (ip?: string, extraHeaders: Record<string, string> = {}) => fetch(`${base}/api/register`, {
  method: "POST",
  headers: { ...(ip ? { "X-Forwarded-For": ip } : {}), ...extraHeaders },
});

describe("new registration and automatic trial country restriction", () => {
  it("is safely inactive until a trusted client-address source has been verified", async () => {
    vi.stubEnv("ENABLE_REGISTRATION_COUNTRY_RESTRICTIONS", "");
    const res = await register();
    expect(res.status).toBe(201);
    expect(createAccountAndTrial).toHaveBeenCalledOnce();
  });

  it.each([
    ["49.36.0.1", "IN"], ["103.4.144.1", "BD"],
    ["2409:40f0::1", "IN"], ["2400:c600::1", "BD"],
    ["::ffff:49.36.0.1", "IN"],
  ])("blocks %s (%s) before creating an account or trial", async (ip, country) => {
    expect(geoip.lookup(ip)?.country).toBe(country);
    const res = await register(ip);
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("REGISTRATION_REGION_RESTRICTED");
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(createAccountAndTrial).not.toHaveBeenCalled();
  });

  it.each(["8.8.8.8", "2001:4860:4860::8888"])("permits an eligible country (%s)", async (ip) => {
    const res = await register(ip);
    expect(res.status).toBe(201);
    expect(createAccountAndTrial).toHaveBeenCalledOnce();
  });

  it("ignores forged country headers and leftmost forwarded IPs", async () => {
    const res = await register("8.8.8.8, 49.36.0.1", { "CF-IPCountry": "US", "X-Country": "US" });
    expect(res.status).toBe(403);
    expect(createAccountAndTrial).not.toHaveBeenCalled();
  });

  it("resolves the visitor behind multiple internal proxy hops", async () => {
    const res = await register("8.8.8.8, 49.36.0.1, 10.0.0.1, 127.0.0.1");
    expect(res.status).toBe(403);
    expect(createAccountAndTrial).not.toHaveBeenCalled();
  });

  it("does not trust a forwarded country or IP past a public client address", async () => {
    const res = await register("49.36.0.1, 8.8.8.8, 10.0.0.1", { "CF-IPCountry": "IN" });
    expect(res.status).toBe(201);
  });

  it.each([undefined, "not-an-ip", "192.168.1.1"])("does not issue trials when location is unknown (%s)", async (ip) => {
    const res = await register(ip);
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("REGISTRATION_LOCATION_UNAVAILABLE");
    expect(res.headers.get("retry-after")).toBe("300");
    expect(createAccountAndTrial).not.toHaveBeenCalled();
  });

  it("handles lookup failure without granting a trial or leaking internal errors", async () => {
    vi.spyOn(geoip, "lookup").mockImplementation(() => { throw new Error("internal lookup details"); });
    const res = await register("8.8.8.8");
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain("internal lookup details");
    expect(createAccountAndTrial).not.toHaveBeenCalled();
  });

  it("keeps public browsing and existing-member login outside the restriction", async () => {
    const headers = { "X-Forwarded-For": "49.36.0.1" };
    expect((await fetch(`${base}/esl-lessons`, { headers })).status).toBe(200);
    expect((await fetch(`${base}/api/login`, { method: "POST", headers })).status).toBe(200);
  });

  it("guards the real registration route before its account-creation handler", () => {
    const auth = readFileSync("server/auth.ts", "utf8");
    expect(auth).toContain('app.post("/api/register", restrictRegistrationCountry, async');
    expect(auth).not.toContain('app.post("/api/login", restrictRegistrationCountry');
  });
});
