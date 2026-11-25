/**
 * A signed-out teacher who opens a page that needs an account (e.g. /generate
 * from the win-back email) signs in and lands back on that page, query
 * included, instead of the dashboard. The redirect only ever stays on this site.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { createElement as h } from "react";
import { safeRedirectPath, afterSignInPath, signInPathFor } from "@shared/auth-redirect";

const auth = vi.hoisted(() => ({ user: null as null | { id: number; isAdmin: boolean } }));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: auth.user,
    isLoading: false,
    loginMutation: { mutate: vi.fn(), isPending: false },
    registerMutation: { mutate: vi.fn(), isPending: false },
  }),
}));

import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";

afterEach(() => {
  cleanup();
  auth.user = null;
  window.history.replaceState(null, "", "/");
});

describe("safeRedirectPath", () => {
  it.each([
    ["/generate", "/generate"],
    ["/generate?topic=Travel&level=B1&ideaId=4", "/generate?topic=Travel&level=B1&ideaId=4"],
    ["/students/12", "/students/12"],
  ])("keeps the same-site path %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    null,
    "",
    "generate",
    "//evil.example/x",
    "/\\evil.example",
    "https://evil.example/generate",
    "javascript:alert(1)",
    "/auth",
    "/auth?redirect=%2Fgenerate",
    "/gen\nerate",
  ])("rejects %j", (input) => {
    expect(safeRedirectPath(input as string | null)).toBeNull();
  });
});

describe("after sign-in destination", () => {
  it("is the requested page, or the dashboard when there is none or it is unsafe", () => {
    expect(afterSignInPath("?redirect=%2Fgenerate")).toBe("/generate");
    expect(afterSignInPath("?register=true&redirect=%2Fgenerate%3Ftopic%3DTravel")).toBe("/generate?topic=Travel");
    expect(afterSignInPath("")).toBe("/dashboard");
    expect(afterSignInPath("?redirect=https%3A%2F%2Fevil.example")).toBe("/dashboard");
  });

  it("round-trips through the sign-in address", () => {
    const signIn = signInPathFor("/generate?topic=Life experiences&level=B1");
    expect(signIn.startsWith("/auth?redirect=")).toBe(true);
    expect(afterSignInPath(signIn.slice("/auth".length))).toBe("/generate?topic=Life%20experiences&level=B1");
    expect(signInPathFor("/dashboard")).toBe("/auth");
  });
});

describe("signed-out teacher opening /generate", () => {
  it("is sent to sign in with the page remembered", async () => {
    window.history.replaceState(null, "", "/generate?topic=Travel&level=B1");
    render(h(ProtectedRoute, { path: "/generate", component: () => h("p", null, "generator") }));
    await waitFor(() => expect(window.location.pathname).toBe("/auth"));
    expect(new URLSearchParams(window.location.search).get("redirect")).toBe("/generate?topic=Travel&level=B1");
  });

  it("comes back to that page after signing in", async () => {
    window.history.replaceState(null, "", "/auth?redirect=%2Fgenerate%3Ftopic%3DTravel%26level%3DB1");
    auth.user = { id: 1, isAdmin: false };
    render(h(AuthPage));
    await waitFor(() => expect(window.location.pathname).toBe("/generate"));
    expect(window.location.search).toBe("?topic=Travel&level=B1");
  });

  it("goes to the dashboard after signing in without a remembered page", async () => {
    window.history.replaceState(null, "", "/auth");
    auth.user = { id: 1, isAdmin: false };
    render(h(AuthPage));
    await waitFor(() => expect(window.location.pathname).toBe("/dashboard"));
  });

  it("never follows a redirect to another site", async () => {
    window.history.replaceState(null, "", "/auth?redirect=%2F%2Fevil.example%2Fx");
    auth.user = { id: 1, isAdmin: false };
    render(h(AuthPage));
    await waitFor(() => expect(window.location.pathname).toBe("/dashboard"));
    expect(window.location.host).not.toBe("evil.example");
  });
});
