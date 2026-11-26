import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const mocks = vi.hoisted(() => ({
  user: { id: 1, subscriptionTier: "free" } as any,
  trial: { isInTrial: false, isPersonalTrial: false, isGlobalTrial: false, trialDaysRemaining: 0, freeCreditsRemaining: 0 },
  toast: vi.fn(),
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/hooks/use-trial-status", () => ({
  useTrialStatus: () => mocks.trial,
}));
vi.mock("@/components/layout/sidebar", () => ({ Sidebar: () => null }));
vi.mock("@/components/layout/header", () => ({ Header: () => null }));
import BuyCreditsPage from "./buy-credits-page";

function show() {
  return render(createElement(QueryClientProvider, {
    client: new QueryClient({ defaultOptions: { mutations: { retry: false } } }),
  }, createElement(BuyCreditsPage)));
}
beforeEach(() => {
  mocks.user = { id: 1, subscriptionTier: "free" };
  mocks.trial = { isInTrial: false, isPersonalTrial: false, isGlobalTrial: false, trialDaysRemaining: 0, freeCreditsRemaining: 0 };
  mocks.toast.mockReset();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("subscription action", () => {
  it("sends paid subscribers to settings rather than offering another purchase", () => {
    mocks.user.subscriptionTier = "unlimited";
    show();
    expect(screen.queryByRole("button", { name: /Subscribe Now/i })).toBeNull();
    expect(screen.getByRole("link", { name: /Manage subscription/i }).getAttribute("href")).toBe("/settings");
  });

  it("allows users in a personal 5-day trial to subscribe immediately without Fair use or Credits copy", () => {
    mocks.trial = { isInTrial: true, isPersonalTrial: true, isGlobalTrial: false, trialDaysRemaining: 3, freeCreditsRemaining: 0 };
    show();
    expect(screen.getByRole("button", { name: /Subscribe Now/i })).toBeTruthy();
    expect(document.body.textContent).toContain("3 days left in your free trial");
    expect(document.body.textContent).not.toMatch(/fair use/i);
    expect(document.body.textContent).not.toMatch(/credits/i);
  });

  it("sends one request for repeated clicks and stays disabled while checkout is pending", async () => {
    const fetchMock = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    show();
    const button = screen.getByRole("button", { name: /Subscribe Now/i });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the server's safe message without automatically retrying a rejected checkout", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 409,
      json: async () => ({ code: "ALREADY_SUBSCRIBED", message: "You already have a subscription." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    show();
    fireEvent.click(screen.getByRole("button", { name: /Subscribe Now/i }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      description: "You already have a subscription.",
    })));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
