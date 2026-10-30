import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BillingHealthCard } from "./billing-health-card";

const state = vi.hoisted(() => ({ value: {} as any }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => state.value }));
afterEach(cleanup);

describe("admin billing health card", () => {
  it("shows separate credential and outage warnings without key material", () => {
    state.value = {
      data: {
        healthy: false, checkedAt: "2026-10-30T12:00:00Z",
        accounts: [
          { account: "primary", status: "invalid_credentials" },
          { account: "legacy", status: "provider_unavailable" },
        ],
      }, refetch: vi.fn(),
    };
    render(createElement(BillingHealthCard));
    expect(screen.getByRole("alert").textContent).toContain("Stripe rejected");
    expect(screen.getByRole("alert").textContent).toContain("temporarily unavailable");
    expect(screen.getByText("Main account (new checkouts):")).toBeTruthy();
    expect(screen.getByText("Legacy account (existing subscribers):")).toBeTruthy();
  });

  it("replaces the warning with a success status after recovery", () => {
    state.value = { data: {
      healthy: false, checkedAt: "2026-10-30T12:00:00Z",
      accounts: [{ account: "primary", status: "invalid_credentials" }],
    }, refetch: vi.fn() };
    const view = render(createElement(BillingHealthCard));
    expect(screen.getByRole("alert")).toBeTruthy();
    state.value.data = {
      healthy: true, checkedAt: "2026-10-30T12:01:00Z",
      accounts: [{ account: "primary", status: "healthy" }, { account: "legacy", status: "healthy" }],
    };
    view.rerender(createElement(BillingHealthCard));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Billing checks passed");
  });

  it("never shows stale success when the endpoint fails", () => {
    state.value = {
      isError: true, data: { healthy: true }, refetch: vi.fn(),
    };
    render(createElement(BillingHealthCard));
    expect(screen.getByRole("alert").textContent).toContain("current status is unknown");
    expect(screen.queryByText("Billing checks passed")).toBeNull();
  });

  it("explains a wrong legacy merchant and the production-safe setting", () => {
    state.value = { data: {
      healthy: false, checkedAt: "2026-10-30T12:00:00Z",
      accounts: [{ account: "legacy", status: "account_mismatch" }],
    }, refetch: vi.fn() };
    render(createElement(BillingHealthCard));
    expect(screen.getByRole("alert").textContent).toContain("different merchant account");
    expect(screen.getByText(/PLANWISE_STRIPE_LEGACY_SECRET/)).toBeTruthy();
  });
});
