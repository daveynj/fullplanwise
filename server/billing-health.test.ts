// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  billingFailureStatus,
  BILLING_HEALTH_CACHE_MS,
  BILLING_HEALTH_INTERVAL_MS,
  createBillingHealthMonitor,
  startBillingHealthChecks,
} from "./billing-health";
import { CHECKOUT_PRICES, LEGACY_STRIPE_ACCOUNT_ID } from "./billing-config";

function client() {
  return {
    accounts: { retrieve: vi.fn().mockResolvedValue({ id: LEGACY_STRIPE_ACCOUNT_ID }) },
    prices: {
      retrieve: vi.fn().mockResolvedValue({
        active: true, livemode: true, type: "recurring",
        recurring: { interval: "month" }, product: { active: true },
      }),
    },
  };
}

function fixture() {
  const primary = client();
  const legacy = client();
  let time = Date.parse("2026-10-30T12:00:00Z");
  const monitor = createBillingHealthMonitor(() => [
    { account: "primary", client: primary as any },
    { account: "legacy", client: legacy as any },
  ], () => time);
  return { primary, legacy, monitor, advance: () => { time += BILLING_HEALTH_CACHE_MS; } };
}

afterEach(() => vi.useRealTimers());

describe("read-only billing health", () => {
  it("checks both merchants but only retrieves configured checkout prices on primary", async () => {
    const f = fixture();
    expect((await f.monitor.check()).healthy).toBe(true);
    expect(f.primary.accounts.retrieve).toHaveBeenCalledOnce();
    expect(f.legacy.accounts.retrieve).toHaveBeenCalledOnce();
    expect(f.primary.prices.retrieve).toHaveBeenCalledWith(
      CHECKOUT_PRICES.price_unlimited_monthly, { expand: ["product"] },
    );
    expect(f.legacy.prices.retrieve).not.toHaveBeenCalled();
  });

  it.each(["primary", "legacy"] as const)("reports %s auth failure independently and detects recovery", async (account) => {
    const f = fixture();
    f[account].accounts.retrieve.mockRejectedValue(Object.assign(
      new Error("Invalid API Key provided: SECRET_MUST_NOT_ESCAPE"),
      { type: "StripeAuthenticationError", statusCode: 401 },
    ));
    const failed = await f.monitor.check();
    expect(failed.healthy).toBe(false);
    expect(failed.accounts.find((a) => a.account === account)?.status).toBe("invalid_credentials");
    expect(failed.accounts.find((a) => a.account !== account)?.status).toBe("healthy");
    expect(JSON.stringify(failed)).not.toContain("SECRET_MUST_NOT_ESCAPE");
    f[account].accounts.retrieve.mockResolvedValue({ id: LEGACY_STRIPE_ACCOUNT_ID });
    f.advance();
    expect((await f.monitor.check()).healthy).toBe(true);
  });

  it("classifies a credential revoked during price retrieval as authentication failure", async () => {
    const f = fixture();
    f.primary.prices.retrieve.mockRejectedValue({ statusCode: 401 });
    expect((await f.monitor.check()).accounts[0].status).toBe("invalid_credentials");
    f.primary.prices.retrieve.mockResolvedValue({
      active: true, livemode: true, type: "recurring", recurring: { interval: "month" }, product: { active: true },
    });
    f.advance();
    expect((await f.monitor.check()).healthy).toBe(true);
  });

  it.each([
    [{ statusCode: 401 }, "invalid_credentials"],
    [{ code: "api_key_expired" }, "invalid_credentials"],
    [{ statusCode: 403 }, "permission_denied"],
    [{ statusCode: 429 }, "provider_unavailable"],
    [{ statusCode: 503 }, "provider_unavailable"],
    [{ type: "StripeConnectionError" }, "provider_unavailable"],
    [{ type: "StripeAPIError" }, "provider_unavailable"],
    [{ statusCode: 404, code: "resource_missing" }, "price_invalid"],
    [new Error("do not expose this"), "check_failed"],
  ])("sanitizes and distinguishes provider errors: %j", (error, status) => {
    expect(billingFailureStatus(error, true)).toBe(status);
  });

  it("does not declare an outage to be an invalid key", async () => {
    const f = fixture();
    f.primary.accounts.retrieve.mockRejectedValue({ statusCode: 503 });
    expect((await f.monitor.check()).accounts[0].status).toBe("provider_unavailable");
  });

  it.each([
    { active: false },
    { livemode: false },
    { type: "one_time" },
    { recurring: { interval: "year" } },
    { product: { deleted: true } },
    { product: { active: false } },
    { product: "prod_unexpanded" },
  ])("rejects unusable prices or products: %j", async (override) => {
    const f = fixture();
    f.primary.prices.retrieve.mockResolvedValue({
      active: true, livemode: true, type: "recurring", recurring: { interval: "month" },
      product: { active: true }, ...override,
    });
    expect((await f.monitor.check()).accounts[0].status).toBe("price_invalid");
  });

  it("treats a price in the wrong merchant account as a configuration issue, not bad credentials", async () => {
    const f = fixture();
    f.primary.prices.retrieve.mockRejectedValue({ code: "resource_missing", statusCode: 404 });
    expect((await f.monitor.check()).accounts[0].status).toBe("price_invalid");
    expect(f.legacy.prices.retrieve).not.toHaveBeenCalled();
  });

  it("reports missing credentials without substituting the working merchant", async () => {
    const legacy = client();
    const monitor = createBillingHealthMonitor(() => [
      { account: "primary", client: null }, { account: "legacy", client: legacy as any },
    ]);
    expect((await monitor.check()).accounts).toEqual([
      { account: "primary", status: "not_configured" }, { account: "legacy", status: "healthy" },
    ]);
  });

  it("rejects a valid key for the wrong legacy merchant and recovers with the original merchant", async () => {
    const f = fixture();
    f.primary.accounts.retrieve.mockResolvedValue({ id: "acct_main" });
    f.legacy.accounts.retrieve.mockResolvedValue({ id: "acct_main" });
    const result = await f.monitor.check();
    expect(result.healthy).toBe(false);
    expect(result.accounts).toEqual([
      { account: "primary", status: "healthy" },
      { account: "legacy", status: "account_mismatch" },
    ]);
    f.legacy.accounts.retrieve.mockResolvedValue({ id: LEGACY_STRIPE_ACCOUNT_ID });
    f.advance();
    expect((await f.monitor.check()).healthy).toBe(true);
  });

  it("bounds repeated/concurrent checks, then reads fresh clients after the cache expires", async () => {
    const f = fixture();
    await Promise.all([f.monitor.check(), f.monitor.check(), f.monitor.check()]);
    await f.monitor.check();
    expect(f.primary.accounts.retrieve).toHaveBeenCalledTimes(1);
    f.advance();
    await f.monitor.check();
    expect(f.primary.accounts.retrieve).toHaveBeenCalledTimes(2);
  });

  it("runs independently of checkout and logs safe state transitions including recovery", async () => {
    vi.useFakeTimers();
    const f = fixture();
    f.primary.accounts.retrieve.mockRejectedValue({
      statusCode: 401, message: "SECRET_MUST_NOT_ESCAPE", raw: { apiKey: "SECRET_MUST_NOT_ESCAPE" },
    });
    const report = vi.fn();
    const stop = startBillingHealthChecks(f.monitor, report);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(report).toHaveBeenCalledWith("[BillingHealth] primary=invalid_credentials, legacy=healthy");
    await vi.advanceTimersByTimeAsync(BILLING_HEALTH_INTERVAL_MS);
    expect(report).toHaveBeenCalledTimes(1);
    f.primary.accounts.retrieve.mockResolvedValue({ id: "acct_example" });
    f.advance();
    await vi.advanceTimersByTimeAsync(BILLING_HEALTH_INTERVAL_MS);
    expect(report).toHaveBeenLastCalledWith("[BillingHealth] primary=healthy, legacy=healthy");
    expect(JSON.stringify(report.mock.calls)).not.toContain("SECRET_MUST_NOT_ESCAPE");
    stop();
    await vi.advanceTimersByTimeAsync(BILLING_HEALTH_INTERVAL_MS);
    expect(report).toHaveBeenCalledTimes(2);
  });
});
