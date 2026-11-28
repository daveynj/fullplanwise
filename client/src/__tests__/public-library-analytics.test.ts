import { createElement, StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicLessonsIndexPage from "@/pages/public-lessons-index-page";
import { trackPublicLibraryEvent } from "@/lib/public-library-analytics";
import { trackProjectEvent } from "@/lib/project-analytics";

const query = vi.hoisted(() => ({
  data: undefined as any, isLoading: false, isFetching: false,
  isSuccess: true, isError: false, error: null, refetch: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => query }));
vi.mock("@/components/SEOHead", () => ({ SEOHead: () => null }));
vi.mock("@/components/layout/blog-header", () => ({ BlogHeader: () => null }));

const lessons = [
  { id: 41, title: "Public travel title", cefrLevel: "B1", publicSlug: "travel", publicLevel: "b1",
    publicCategory: "general-english", tags: ["travel", "private-student-detail"],
    topic: "PRIVATE ORIGINAL REQUEST", studentId: 789, content: "PRIVATE READING" },
  { id: 42, title: "Public work title", cefrLevel: "B2", publicSlug: "work", publicLevel: "b2",
    publicCategory: "business-english", tags: ["work"] },
];
let track: ReturnType<typeof vi.fn>;
const show = () => render(createElement(StrictMode, null, createElement(PublicLessonsIndexPage)));
const advance = (ms = 1000) => act(() => vi.advanceTimersByTime(ms));
const search = (text: string) => fireEvent.change(screen.getByRole("searchbox"), { target: { value: text } });
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const events = (name: string) => track.mock.calls.filter(([event]) => event === name);

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(query, { data: { lessons }, isLoading: false, isFetching: false, isSuccess: true, isError: false });
  window.history.replaceState(null, "", "/esl-lessons");
  track = vi.fn();
  window.umami = { track };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  delete window.umami;
  delete (window as { gtag?: unknown }).gtag;
  window.history.replaceState(null, "", "/");
});

describe("public library analytics", () => {
  it("tracks changed curated selections once, not repeated clicks, renders or initial loading", () => {
    const view = show();
    advance();
    expect(track).not.toHaveBeenCalled();
    click("Travel (1)");
    click("Travel (1)");
    view.rerender(createElement(StrictMode, null, createElement(PublicLessonsIndexPage)));
    advance();
    expect(track.mock.calls).toEqual([["public_library_tag_selected", { tag: "travel", result_count: 1 }]]);
    click("Business English (1)");
    advance();
    expect(events("public_library_category_selected")).toEqual([
      ["public_library_category_selected", { tag: "travel", category: "business-english", result_count: 0 }],
    ]);
    expect(events("public_library_zero_results")).toHaveLength(1);
    click("Business English (1)");
    advance();
    expect(events("public_library_category_selected")).toHaveLength(1);
    expect(events("public_library_zero_results")).toHaveLength(1);
  });

  it("debounces a deliberate zero-result search, without sending text or duplicating on refetch", () => {
    const view = show();
    search("private name");
    advance(300);
    search("private name and request");
    advance(499);
    expect(track).not.toHaveBeenCalled();
    advance(1);
    expect(track.mock.calls).toEqual([["public_library_zero_results", { result_count: 0 }]]);
    query.data = { lessons: [...lessons] };
    view.rerender(createElement(StrictMode, null, createElement(PublicLessonsIndexPage)));
    advance();
    expect(track).toHaveBeenCalledTimes(1);
    search("another private search");
    advance();
    expect(events("public_library_zero_results")).toHaveLength(2);
    expect(JSON.stringify(track.mock.calls)).not.toContain("private");
  });

  it("counts each deliberate empty filter selection, even without a timer tick between clicks", () => {
    show();
    search("missing");
    click("Travel (1)");
    click("Work & careers (1)");
    click("Work & careers (1)");
    expect(events("public_library_tag_selected")).toHaveLength(2);
    expect(events("public_library_zero_results")).toHaveLength(2);
    advance();
    expect(events("public_library_zero_results")).toHaveLength(2);
  });

  it("cancels unfinished searches on clear, reset, a successful search or unmount", () => {
    const view = show();
    search("nonexistent");
    click("Clear search");
    advance();
    expect(events("public_library_zero_results")).toHaveLength(0);
    expect(events("public_library_filters_reset")).toHaveLength(1);
    search("nonexistent");
    search("travel");
    advance();
    expect(events("public_library_zero_results")).toHaveLength(0);
    search("nonexistent");
    click("Reset filters");
    advance();
    expect(events("public_library_filters_reset")).toHaveLength(2);
    expect(events("public_library_zero_results")).toHaveLength(0);
    search("nonexistent");
    view.unmount();
    advance();
    expect(events("public_library_zero_results")).toHaveLength(0);
  });

  it("records partial resets once with the cleared filter context", () => {
    show();
    click("All tags");
    click("All topics");
    expect(track).not.toHaveBeenCalled();
    click("Travel (1)");
    click("All tags");
    click("All tags");
    click("Business English (1)");
    click("All topics");
    click("All topics");
    expect(events("public_library_filters_reset")).toEqual([
      ["public_library_filters_reset", { tag: "travel", result_count: 2 }],
      ["public_library_filters_reset", { category: "business-english", result_count: 2 }],
    ]);
  });

  it("tracks one lesson open with selected context and the lesson CEFR, without card text", () => {
    show();
    click("Travel (1)");
    fireEvent.click(screen.getAllByRole("link", { name: /Public travel title/ })[0]);
    expect(events("public_library_lesson_opened")).toEqual([
      ["public_library_lesson_opened", { tag: "travel", cefr_level: "B1", result_count: 1, lesson_id: 41 }],
    ]);
    expect(window.location.pathname).toBe("/esl-lessons/b1/travel");
    const payloads = JSON.stringify(track.mock.calls);
    for (const forbidden of ["Public travel title", "PRIVATE", "studentId", "789", "private-student-detail", "travel?"]) {
      expect(payloads).not.toContain(forbidden);
    }
  });

  it("includes the browse level on filtered outcomes", () => {
    window.history.replaceState(null, "", "/esl-lessons/b1");
    show();
    click("Travel (1)");
    search("not found");
    advance();
    expect(events("public_library_zero_results")).toEqual([
      ["public_library_zero_results", { tag: "travel", cefr_level: "B1", result_count: 0 }],
    ]);
  });

  it("never reports initial empty data, failed data, or a route change as a filtered zero", () => {
    query.data = { lessons: [] };
    const view = show();
    advance();
    expect(track).not.toHaveBeenCalled();
    Object.assign(query, { isSuccess: false, isError: true });
    search("not found");
    advance();
    expect(track).not.toHaveBeenCalled();
    act(() => window.history.pushState(null, "", "/esl-lessons/b2"));
    Object.assign(query, { isSuccess: true, isError: false });
    view.rerender(createElement(StrictMode, null, createElement(PublicLessonsIndexPage)));
    advance();
    expect(track).not.toHaveBeenCalled();
  });

  it("waits for successful data rather than counting a pending fetch as empty", () => {
    Object.assign(query, { data: undefined, isSuccess: false, isLoading: true, isFetching: true });
    const view = show();
    search("travel");
    advance();
    expect(track).not.toHaveBeenCalled();
    Object.assign(query, { data: { lessons }, isSuccess: true, isLoading: false, isFetching: false });
    view.rerender(createElement(StrictMode, null, createElement(PublicLessonsIndexPage)));
    advance();
    expect(track).not.toHaveBeenCalled();
    expect(screen.getAllByTestId("card-lesson-41")[0]).toBeTruthy();
  });

  it.each(["absent", "throwing", "rejecting"])("keeps filtering, resetting and opening lessons working with %s analytics", async (mode) => {
    if (mode === "absent") delete window.umami;
    if (mode === "throwing") track.mockImplementation(() => { throw new Error("blocked"); });
    if (mode === "rejecting") track.mockImplementation(() => Promise.reject(new Error("offline")));
    show();
    click("Travel (1)");
    expect(screen.queryByTestId("card-lesson-42")).toBeNull();
    search("missing");
    advance();
    click("Reset filters");
    expect(screen.getAllByTestId("card-lesson-42")[0]).toBeTruthy();
    fireEvent.click(screen.getAllByRole("link", { name: /Public travel title/ })[0]);
    expect(window.location.pathname).toBe("/esl-lessons/b1/travel");
    await act(async () => { await Promise.resolve(); });
  });

  it("rebuilds payloads from an allowlist even if passed unexpected runtime fields", () => {
    trackPublicLibraryEvent("public_library_lesson_opened", {
      tag: "private request", category: "__proto__", level: "student details", resultCount: 2,
      lessonId: 41, title: "DO NOT SEND", search: "DO NOT SEND", topic: "DO NOT SEND",
    } as any);
    expect(track).toHaveBeenCalledWith("public_library_lesson_opened", { result_count: 2, lesson_id: 41 });
    trackPublicLibraryEvent("public_library_zero_results", {
      tag: "constructor", category: "unknown", level: "B1-extra", resultCount: NaN, lessonId: -1,
    });
    expect(track).toHaveBeenLastCalledWith("public_library_zero_results", {});
  });

  it("forwards allowlisted library and theme events to Google Analytics (gtag) safely", () => {
    const gtag = vi.fn();
    (window as { gtag?: typeof gtag }).gtag = gtag;

    trackPublicLibraryEvent("public_library_lesson_opened", {
      tag: "", category: "", resultCount: 2, lessonId: 41, title: "DO NOT SEND",
    } as any);
    trackPublicLibraryEvent("public_library_theme_clicked", {
      tag: "travel", category: "", resultCount: 3,
    });

    expect(gtag).toHaveBeenNthCalledWith(1, "event", "public_library_lesson_opened", { result_count: 2, lesson_id: 41 });
    expect(gtag).toHaveBeenNthCalledWith(2, "event", "public_library_theme_clicked", { tag: "travel", result_count: 3 });

    gtag.mockImplementation(() => { throw new Error("ga blocked"); });
    expect(() => trackPublicLibraryEvent("public_library_theme_clicked", { tag: "work", category: "", resultCount: 1 })).not.toThrow();

    delete (window as { gtag?: unknown }).gtag;
    expect(() => trackPublicLibraryEvent("public_library_pdf_downloaded", { tag: "", category: "", resultCount: 0, lessonId: 41 })).not.toThrow();
  });
});

describe("optional project tracker without a browser", () => {
  it("does nothing during server-side rendering", () => {
    vi.stubGlobal("window", undefined);
    try {
      expect(() => trackProjectEvent("public_library_zero_results", { result_count: 0 })).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
