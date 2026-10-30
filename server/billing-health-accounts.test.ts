// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getBillingHealthAccounts, getLegacyStripeSecretKey } from "./stripeClient";

afterEach(() => vi.unstubAllEnvs());

describe("health check account selection", () => {
  it("does not silently substitute the legacy account when primary credentials are missing", () => {
    vi.stubEnv("PLANWISE_STRIPE_LEGACY_SECRET", "");
    vi.stubEnv("PLANWISE_STRIPE_SECRET", "");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake_legacy");
    const [primary, legacy] = getBillingHealthAccounts();
    expect(primary.client).toBeNull();
    expect(legacy.client).not.toBeNull();
  });

  it("does not hide a missing legacy account when primary works", () => {
    vi.stubEnv("PLANWISE_STRIPE_LEGACY_SECRET", "");
    vi.stubEnv("PLANWISE_STRIPE_SECRET", "sk_test_fake_primary");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const [primary, legacy] = getBillingHealthAccounts();
    expect(primary.client).not.toBeNull();
    expect(legacy.client).toBeNull();
  });

  it("creates new clients when a credential is replaced", () => {
    vi.stubEnv("PLANWISE_STRIPE_LEGACY_SECRET", "");
    vi.stubEnv("PLANWISE_STRIPE_SECRET", "sk_test_fake_old");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake_legacy");
    const before = getBillingHealthAccounts();
    vi.stubEnv("PLANWISE_STRIPE_SECRET", "sk_test_fake_new");
    const after = getBillingHealthAccounts();
    expect(after[0].client).not.toBe(before[0].client);
    expect(after.map((a) => a.account)).toEqual(["primary", "legacy"]);
  });

  it("supports an independently named production-safe legacy key without integration injection", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PLANWISE_STRIPE_SECRET", "sk_test_fake_primary");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("PLANWISE_STRIPE_LEGACY_SECRET", "");
    expect(getBillingHealthAccounts()[1].client).toBeNull();
    vi.stubEnv("PLANWISE_STRIPE_LEGACY_SECRET", "sk_test_fake_legacy");
    expect(getLegacyStripeSecretKey()).toBe("sk_test_fake_legacy");
    expect(getBillingHealthAccounts()[1].client).not.toBeNull();
  });

  it("prefers the user-owned legacy credential and refreshes its client on replacement", () => {
    vi.stubEnv("PLANWISE_STRIPE_LEGACY_SECRET", "sk_test_fake_legacy");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake_unrelated");
    expect(getLegacyStripeSecretKey()).toBe("sk_test_fake_legacy");
    const before = getBillingHealthAccounts()[1].client;
    vi.stubEnv("PLANWISE_STRIPE_LEGACY_SECRET", "sk_test_fake_replacement");
    expect(getLegacyStripeSecretKey()).toBe("sk_test_fake_replacement");
    expect(getBillingHealthAccounts()[1].client).not.toBe(before);
  });
});
