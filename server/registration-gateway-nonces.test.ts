// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), transaction: vi.fn() }));
vi.mock("./db", () => ({ db: mocks }));
const dialect = new PgDialect();

beforeEach(() => { vi.resetModules(); vi.resetAllMocks(); });

describe("shared registration nonce storage", () => {
  it("uses one schema setup and database uniqueness across concurrent callers", async () => {
    const nonces = new Set<string>();
    mocks.execute.mockResolvedValue({ rows: [] });
    mocks.transaction.mockImplementation(async (callback) => callback({
      execute: async (query: any) => {
        const compiled = dialect.sqlToQuery(query);
        if (compiled.sql.includes("INSERT INTO")) {
          expect(compiled.sql).toContain("ON CONFLICT (nonce_hash) DO NOTHING RETURNING nonce_hash");
          const nonce = compiled.params[0] as string;
          if (nonces.has(nonce)) return { rows: [] };
          nonces.add(nonce);
          return { rows: [{ nonce_hash: nonce }] };
        }
        expect(compiled.sql).toContain("expires_at < now()");
        return { rows: [] };
      },
    }));
    const { consumeRegistrationNonce } = await import("./registration-gateway-nonces");
    const responses = await Promise.all(Array.from({ length: 12 }, () =>
      consumeRegistrationNonce("hashed-nonce-only", new Date(Date.now() + 90000)),
    ));
    expect(responses.filter(Boolean)).toHaveLength(1);
    expect(mocks.execute).toHaveBeenCalledOnce();
    expect(mocks.transaction).toHaveBeenCalledTimes(12);
  });
  it("retries a failed schema initialization instead of retaining a rejected promise", async () => {
    mocks.execute.mockRejectedValueOnce(new Error("not ready")).mockResolvedValueOnce({ rows: [] });
    mocks.transaction.mockImplementation(async (callback) => callback({ execute: vi.fn().mockResolvedValue({ rows: [{}] }) }));
    const { consumeRegistrationNonce } = await import("./registration-gateway-nonces");
    await expect(consumeRegistrationNonce("hash", new Date())).rejects.toThrow("not ready");
    expect(await consumeRegistrationNonce("hash", new Date())).toBe(true);
    expect(mocks.execute).toHaveBeenCalledTimes(2);
  });
});
