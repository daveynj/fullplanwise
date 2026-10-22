// @vitest-environment node
//
// Logins must live in Postgres, not server memory: autoscale restarts servers
// and runs several at once. These tests check the store talks to the shared
// pool and the `session` table, and that storage wires it in.
import { describe, it, expect, vi } from "vitest";

vi.mock("./db", () => ({ db: {}, pool: { query: vi.fn() } }));

import { createSessionStore } from "./session-store";

function fakePool() {
  const calls: string[] = [];
  const query = vi.fn(async (text: string, _params?: unknown[]) => {
    calls.push(text);
    if (text.includes("to_regclass")) return { rows: [{ reg: "session" }] };
    if (text.startsWith("SELECT sess")) {
      return { rows: [{ sess: { cookie: { maxAge: 1000 }, passport: { user: 7 } } }] };
    }
    return { rows: [] };
  });
  return { pool: { query } as any, calls };
}

function promisify<T>(fn: (cb: (err: any, value?: T) => void) => void): Promise<T | undefined> {
  return new Promise((resolve, reject) => fn((err, value) => (err ? reject(err) : resolve(value))));
}

describe("createSessionStore", () => {
  it("saves a login to the session table through the shared pool", async () => {
    const { pool, calls } = fakePool();
    const store = createSessionStore(pool);

    await promisify((cb) => store.set("sid-1", { cookie: { maxAge: 1000 } as any, passport: { user: 7 } } as any, cb));

    expect(calls.some((q) => q.includes('INSERT INTO "session"'))).toBe(true);
  });

  it("reads a login back from the database (works on any server)", async () => {
    const { pool, calls } = fakePool();
    const store = createSessionStore(pool);

    const sess: any = await promisify((cb) => store.get("sid-1", cb));

    expect(sess?.passport?.user).toBe(7);
    expect(calls.some((q) => q.startsWith("SELECT sess") && q.includes('"session"'))).toBe(true);
  });

  it("removes a session on logout", async () => {
    const { pool, calls } = fakePool();
    const store = createSessionStore(pool);

    await promisify((cb) => store.destroy("sid-1", cb));

    expect(calls.some((q) => q.startsWith('DELETE FROM "session"'))).toBe(true);
  });

  it("does not write to the database on every request just to extend expiry", async () => {
    const { pool, calls } = fakePool();
    const store = createSessionStore(pool);

    await promisify((cb) => store.touch!("sid-1", { cookie: { maxAge: 1000 } } as any, cb as any));

    expect(calls.some((q) => q.startsWith("UPDATE"))).toBe(false);
  });
});

describe("session table check failures", () => {
  it("retries the table check on the next request instead of breaking logins until restart", async () => {
    const { pool } = fakePool();
    const realQuery = pool.query;
    let failNext = true;
    pool.query = vi.fn(async (text: string, params?: unknown[]) => {
      if (text.includes("to_regclass") && failNext) {
        failNext = false;
        throw new Error("database briefly unreachable");
      }
      return realQuery(text, params);
    });
    const store = createSessionStore(pool);

    await expect(promisify((cb) => store.get("sid-1", cb))).rejects.toThrow("briefly unreachable");
    const sess: any = await promisify((cb) => store.get("sid-1", cb));
    expect(sess?.passport?.user).toBe(7);
  });
});

describe("storage session store", () => {
  it("uses the Postgres-backed store, not memory", async () => {
    const { storage } = await import("./storage");
    expect(storage.sessionStore.constructor.name).toBe("PGStore");
  });
});
