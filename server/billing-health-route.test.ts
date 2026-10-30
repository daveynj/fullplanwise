// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { registerBillingHealthRoute } from "./billing-health-route";

let server: Server;
let base: string;
let authenticated = false;
const getUser = vi.fn();
const check = vi.fn();

beforeAll(async () => {
  const app = express();
  app.use((req: any, _res, next) => {
    req.isAuthenticated = () => authenticated;
    req.user = authenticated ? { id: 42, isAdmin: true } : undefined;
    next();
  });
  registerBillingHealthRoute(app, getUser, check);
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
beforeEach(() => {
  vi.resetAllMocks();
  authenticated = false;
  getUser.mockResolvedValue({ isAdmin: true });
  check.mockResolvedValue({
    healthy: false, checkedAt: "2026-10-30T12:00:00Z",
    accounts: [{ account: "primary", status: "invalid_credentials" }],
  });
});

describe("private billing health endpoint", () => {
  it("rejects anonymous callers without checking Stripe", async () => {
    const res = await fetch(`${base}/api/admin/billing-health`);
    expect(res.status).toBe(401);
    expect(getUser).not.toHaveBeenCalled();
    expect(check).not.toHaveBeenCalled();
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it.each([{ isAdmin: false }, undefined])("rejects non-admin/deleted accounts even with stale session admin status", async (user) => {
    authenticated = true;
    getUser.mockResolvedValue(user);
    const res = await fetch(`${base}/api/admin/billing-health`);
    expect(res.status).toBe(403);
    expect(check).not.toHaveBeenCalled();
  });

  it("shows the warning only to a current admin with no-store headers", async () => {
    authenticated = true;
    const res = await fetch(`${base}/api/admin/billing-health`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(res.headers.get("vary")).toContain("Cookie");
    expect((await res.json()).accounts[0].status).toBe("invalid_credentials");
    expect(getUser).toHaveBeenCalledWith(42);
  });

  it("sanitizes unexpected failures instead of returning provider errors", async () => {
    authenticated = true;
    check.mockRejectedValue(new Error("SECRET_MUST_NOT_ESCAPE"));
    const res = await fetch(`${base}/api/admin/billing-health`);
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain("SECRET_MUST_NOT_ESCAPE");
  });
});
