import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminPublicTagEditor } from "./admin-public-tag-editor";

const mocks = vi.hoisted(() => ({ user: { isAdmin: true } as any }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: mocks.user }) }));
const lesson = { id: 21, title: "A new tool", cefrLevel: "B1", tags: ["travel"] };
const preview = {
  ...lesson, publicExcerpt: "Public reading about a computer.",
  hasOtherTags: false, reviewToken: "a".repeat(48), expiresAt: Date.now() + 60_000,
};
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data });
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(createElement(QueryClientProvider, { client }, createElement(AdminPublicTagEditor)));
  return { invalidate };
}
async function openReview() {
  fireEvent.change(screen.getByRole("textbox", { name: "Public title or lesson ID" }), { target: { value: "21" } });
  fireEvent.click(screen.getByRole("button", { name: "Find public lessons" }));
  fireEvent.click(await screen.findByRole("button", { name: "Review tags for A new tool" }));
  return within(await screen.findByTestId("tag-edit-review"));
}
beforeEach(() => {
  mocks.user = { isAdmin: true };
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(ok({ lessons: [lesson], nextAfterId: null }))
    .mockResolvedValueOnce(ok(preview))
    .mockResolvedValueOnce(ok({ id: 21, tags: ["technology"] })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("reviewed public tag corrections", () => {
  it("finds an already-tagged lesson, shows current labels, requires approval and confirms replacement", async () => {
    const { invalidate } = show();
    const editor = await openReview();
    expect(editor.getByText(/Public reading about a computer/)).toBeTruthy();
    expect(editor.getByRole("link", { name: "Review full public lesson" }).getAttribute("href")).toBe("/lessons/21");
    expect(editor.getByText(/Current public tags/).parentElement?.textContent).toContain("Travel");
    const save = editor.getByRole("button", { name: "Save reviewed tag changes" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.click(editor.getByRole("checkbox", { name: "Travel" }));
    fireEvent.click(editor.getByRole("checkbox", { name: "Technology" }));
    expect(save.disabled).toBe(true);
    fireEvent.click(editor.getByRole("checkbox", { name: /I reviewed/ }));
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    expect(await screen.findByText('Saved public tags for "A new tool": Technology.')).toBeTruthy();
    expect(screen.getByText("Current public tags: Technology")).toBeTruthy();
    expect(screen.queryByTestId("tag-edit-review")).toBeNull();
    const calls = vi.mocked(fetch).mock.calls;
    expect(JSON.parse(calls[0][1]!.body as string)).toEqual({ search: "21", afterId: 0 });
    expect(JSON.parse(calls[2][1]!.body as string)).toEqual({
      id: 21, reviewToken: preview.reviewToken, reviewed: true, tags: ["technology"],
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["public-lesson-index"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["/api/public-lessons"] });
  });

  it("clears all tags only after explicit clearing approval and confirms that the lesson remains public", async () => {
    show();
    const editor = await openReview();
    fireEvent.click(editor.getByRole("button", { name: "Clear all tags" }));
    const save = editor.getByRole("button", { name: "Save and clear all tags" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.click(editor.getByRole("checkbox", { name: /approve clearing all its tags/ }));
    fireEvent.click(save);
    expect(await screen.findByText('Cleared all public tags for "A new tool". The lesson remains public.')).toBeTruthy();
    expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as string).tags).toEqual([]);
    expect(screen.getByText(/Clearing tags removes topic-filter matches/)).toBeTruthy();
  });

  it("resets approval whenever choices change and enforces four tags", async () => {
    show();
    const editor = await openReview();
    fireEvent.click(editor.getByRole("checkbox", { name: "Technology" }));
    const approval = editor.getByRole("checkbox", { name: /I reviewed/ }) as HTMLInputElement;
    fireEvent.click(approval);
    fireEvent.click(editor.getByRole("checkbox", { name: "Culture" }));
    expect(approval.checked).toBe(false);
    fireEvent.click(editor.getByRole("checkbox", { name: "Food & cooking" }));
    expect((editor.getByRole("checkbox", { name: "Money" }) as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(editor.getByRole("button", { name: "Cancel editing" }));
    expect(screen.queryByTestId("tag-edit-review")).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("requires reloading current tags after a conflict and never claims a save", async () => {
    vi.mocked(fetch).mockReset()
      .mockResolvedValueOnce(ok({ lessons: [lesson], nextAfterId: null }) as Response)
      .mockResolvedValueOnce(ok(preview) as Response)
      .mockResolvedValueOnce({ ok: false, status: 409, text: async () => "Tags changed; review again." } as Response)
      .mockResolvedValueOnce(ok({ ...preview, tags: ["food"] }) as Response);
    show();
    const editor = await openReview();
    fireEvent.click(editor.getByRole("button", { name: "Clear all tags" }));
    fireEvent.click(editor.getByRole("checkbox", { name: /approve clearing/ }));
    fireEvent.click(editor.getByRole("button", { name: "Save and clear all tags" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reload current tags" }));
    await waitFor(() => expect((screen.getByRole("checkbox", { name: "Food & cooking" }) as HTMLInputElement).checked).toBe(true));
    expect(screen.queryByRole("status")).toBeNull();
    expect((screen.getByRole("checkbox", { name: /I reviewed/ }) as HTMLInputElement).checked).toBe(false);
  });

  it("blocks expired reviews without a write", async () => {
    vi.mocked(fetch).mockReset()
      .mockResolvedValueOnce(ok({ lessons: [lesson], nextAfterId: null }) as Response)
      .mockResolvedValueOnce(ok({ ...preview, expiresAt: Date.now() - 1 }) as Response);
    show();
    const editor = await openReview();
    expect(editor.getByRole("button", { name: "Reload current tags" })).toBeTruthy();
    expect((editor.getByRole("checkbox", { name: /I reviewed/ }) as HTMLInputElement).disabled).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not show the editor or fetch for non-admins", () => {
    mocks.user = { isAdmin: false };
    show();
    expect(screen.queryByTestId("public-tag-editor")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
