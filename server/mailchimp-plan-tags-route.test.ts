// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { registerMailchimpPlanTagsRoute } from "./mailchimp-plan-tags-route";

let server: Server;
let base: string;
let authenticated = false;
const getUser = vi.fn();
const isConnected = vi.fn();
const sync = vi.fn();
const url = () => `${base}/api/admin/mailchimp/sync-plan-tags`;

beforeAll(async () => {
  const app = express();
  app.use((req: any, _res, next) => {
    req.isAuthenticated = () => authenticated;
    req.user = authenticated ? { id: 42, isAdmin: true } : undefined;
    next();
  });
  registerMailchimpPlanTagsRoute(app, getUser, isConnected, sync);
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
  isConnected.mockReturnValue(true);
  sync.mockResolvedValue({ unlimited: 3, tagged: 2, untagged: 1, notOnList: 1, failed: 0 });
});

describe("admin Mailchimp tag sync endpoint", () => {
  it("rejects anonymous callers without syncing", async () => {
    const res = await fetch(url(), { method: "POST" });
    expect(res.status).toBe(401);
    expect(sync).not.toHaveBeenCalled();
  });

  it.each([{ isAdmin: false }, undefined])("rejects non-admin or deleted accounts even with a stale admin session", async (user) => {
    authenticated = true;
    getUser.mockResolvedValue(user);
    const res = await fetch(url(), { method: "POST" });
    expect(res.status).toBe(403);
    expect(sync).not.toHaveBeenCalled();
  });

  it("doesn't respond to GET, so visiting or prefetching the URL can't trigger it", async () => {
    authenticated = true;
    const res = await fetch(url());
    expect(res.status).toBe(404);
    expect(sync).not.toHaveBeenCalled();
  });

  it("runs the sync for a current admin and returns the counts", async () => {
    authenticated = true;
    const res = await fetch(url(), { method: "POST" });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(await res.json()).toEqual({ unlimited: 3, tagged: 2, untagged: 1, notOnList: 1, failed: 0 });
    expect(getUser).toHaveBeenCalledWith(42);
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it("says when Mailchimp isn't connected instead of reporting zero tags", async () => {
    authenticated = true;
    isConnected.mockReturnValue(false);
    const res = await fetch(url(), { method: "POST" });
    expect(res.status).toBe(503);
    expect((await res.json()).message).toMatch(/isn't connected/);
    expect(sync).not.toHaveBeenCalled();
  });

  it.each([
    ["returns nothing", () => sync.mockResolvedValue(null)],
    ["throws", () => sync.mockRejectedValue(new Error("SECRET_MUST_NOT_ESCAPE"))],
  ])("reports a failure without leaking details when the sync %s", async (_label, setup) => {
    authenticated = true;
    setup();
    const res = await fetch(url(), { method: "POST" });
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain("SECRET_MUST_NOT_ESCAPE");
  });
});
