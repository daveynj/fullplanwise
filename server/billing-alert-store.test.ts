// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ query: vi.fn(), release: vi.fn(), connect: vi.fn() }));
vi.mock("./db", () => ({ pool: { connect: mocks.connect } }));
import { billingAlertStore } from "./billing-alert-store";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.connect.mockResolvedValue({ query: mocks.query, release: mocks.release });
  mocks.query.mockImplementation(async (sql: string) => {
    if (sql.includes("pg_try_advisory_lock")) return { rows: [{ locked: true }] };
    if (sql.includes("clock_timestamp")) return { rows: [{ now: "123456789" }] };
    return { rows: [] };
  });
});

describe("shared PostgreSQL billing alert store", () => {
  it("locks, initializes, reads and atomically persists the queue using the database clock", async () => {
    await billingAlertStore.exclusive(async (session) => {
      expect(session.now).toBe(123456789);
      const state = await session.read();
      expect(state).toEqual({ accounts: {}, pending: [] });
      state.observedAt = session.now;
      await session.write(state);
    });
    expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining("ON CONFLICT"), [
      "billing-health-alerts-v1", JSON.stringify({ accounts: {}, pending: [], observedAt: 123456789 }),
    ]);
    expect(mocks.query).toHaveBeenLastCalledWith(expect.stringContaining("pg_advisory_unlock"), ["billing-health-alerts-v1"]);
    expect(mocks.release).toHaveBeenCalledWith(false);
  });

  it("skips work held by another instance and releases its connection", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ locked: false }] });
    const work = vi.fn();
    await billingAlertStore.exclusive(work);
    expect(work).not.toHaveBeenCalled();
    expect(mocks.query).toHaveBeenCalledTimes(1);
    expect(mocks.release).toHaveBeenCalledWith(false);
  });

  it("unlocks after processing failure", async () => {
    await expect(billingAlertStore.exclusive(async () => { throw new Error("failed"); })).rejects.toThrow("failed");
    expect(mocks.query).toHaveBeenLastCalledWith(expect.stringContaining("pg_advisory_unlock"), expect.any(Array));
    expect(mocks.release).toHaveBeenCalledWith(false);
  });

  it("destroys the connection if unlock fails", async () => {
    await billingAlertStore.exclusive(async () => {
      mocks.query.mockRejectedValueOnce(new Error("lost connection"));
    });
    expect(mocks.release).toHaveBeenCalledWith(true);
  });
});
