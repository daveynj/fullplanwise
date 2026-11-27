import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mocks = vi.hoisted(() => ({ user: { isAdmin: true } as any }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: mocks.user }) }));
import { AdminPublicTagBackfill } from "./admin-public-tag-backfill";

const batch = {
  reviewToken: "a".repeat(48),
  expiresAt: Date.now() + 60_000,
  nextAfterId: 22,
  lessons: [
    { id: 21, title: "Travel and local culture", cefrLevel: "B1", publicExcerpt: "Reading about travel and culture.", suggestedTags: ["travel"], evidence: [{ tag: "travel", source: "title", terms: ["travel"] }] },
    { id: 22, title: "Healthy food choices", cefrLevel: "A2", publicExcerpt: "A short public reading.", suggestedTags: ["food"], evidence: [{ tag: "food", source: "reading", terms: ["food"] }] },
  ],
};

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(createElement(QueryClientProvider, { client }, createElement(AdminPublicTagBackfill)));
}
function okJson(data: unknown) {
  return { ok: true, status: 200, json: async () => data };
}

beforeEach(() => {
  mocks.user = { isAdmin: true };
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(okJson(batch))
    .mockResolvedValueOnce(okJson({ updated: 1 })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("admin public tag review", () => {
  it("previews evidence, allows tag edits, saves only explicitly approved lessons, then offers cursor batch", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Start a fresh preview" }));
    await screen.findByText("Travel and local culture");
    const firstLesson = screen.getByTestId("tag-review-21");
    const first = within(firstLesson);
    expect(screen.getByText(/title:/)).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Review full public lesson" })[0].getAttribute("href")).toBe("/lessons/21");

    fireEvent.click(first.getByRole("checkbox", { name: "Travel" }));
    fireEvent.click(first.getByRole("checkbox", { name: "Culture" }));
    fireEvent.click(first.getByRole("checkbox", { name: "Approve tags for Travel and local culture" }));
    expect((screen.getByRole("button", { name: /Save 1 approved lesson/ }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /Save 1 approved lesson/ }));
    await screen.findByText(/Saved tags for 1 lesson/);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/public-lesson-tags/preview");
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body).toEqual({ reviewToken: batch.reviewToken, approvals: [{ id: 21, reviewed: true, tags: ["culture"] }] });
    fireEvent.click(screen.getByRole("button", { name: "Load next batch" }));
    await waitFor(() => expect(fetchMock.mock.calls[2][1].body).toBe(JSON.stringify({ afterId: 22 })));
  });

  it("supports skipping unchecked lessons and prevents empty saves", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Start a fresh preview" }));
    await screen.findByText("Travel and local culture");
    expect((screen.getByRole("button", { name: /Save 0 approved lessons/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Skip this batch and load next" }));
    await waitFor(() => expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1][0]).toBe("/api/admin/public-lesson-tags/preview"));
  });

  it("requires a new preview after a stale conflict", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(okJson(batch))
      .mockResolvedValueOnce({ ok: false, status: 409, statusText: "Conflict", text: async () => "stale review token" }));
    show();
    fireEvent.click(screen.getByRole("button", { name: "Start a fresh preview" }));
    await screen.findByText("Travel and local culture");
    fireEvent.click(within(screen.getByTestId("tag-review-21")).getByRole("checkbox", { name: "Approve tags for Travel and local culture" }));
    fireEvent.click(screen.getByRole("button", { name: /Save 1 approved lesson/ }));
    expect(await screen.findByText(/stale or expired/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create a new preview" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Save 1 approved lesson/ })).toBeNull();
  });

  it("requires renewed approval after editing an approved selection", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Start a fresh preview" }));
    await screen.findByText("Travel and local culture");
    const first = within(screen.getByTestId("tag-review-21"));
    fireEvent.click(first.getByRole("checkbox", { name: "Approve tags for Travel and local culture" }));
    fireEvent.click(first.getByRole("checkbox", { name: "Culture" }));
    expect((first.getByRole("checkbox", { name: "Approve tags for Travel and local culture" }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("button", { name: /Save 0 approved lessons/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("blocks expired approvals and limits selections to four tags", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(okJson({ ...batch, expiresAt: Date.now() - 1 })));
    show();
    fireEvent.click(screen.getByRole("button", { name: "Start a fresh preview" }));
    await screen.findByText("Travel and local culture");
    const first = within(screen.getByTestId("tag-review-21"));
    for (const name of ["Culture", "Money", "Health"]) fireEvent.click(first.getByRole("checkbox", { name }));
    expect((first.getByRole("checkbox", { name: "Technology" }) as HTMLInputElement).disabled).toBe(true);
    expect((first.getByRole("checkbox", { name: "Approve tags for Travel and local culture" }) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /Save 0 approved lessons/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("does not expose admin controls to a teacher", () => {
    mocks.user = { isAdmin: false };
    show();
    expect(screen.queryByTestId("public-tag-backfill")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
