import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: any) => createElement("a", { href, ...props }, children),
  useRoute: () => [false, undefined],
}));
vi.mock("@/components/SEOHead", () => ({ SEOHead: () => null }));
vi.mock("@/components/layout/blog-header", () => ({ BlogHeader: () => null }));
import PublicLessonsIndexPage from "./public-lessons-index-page";

const lessons = [
  { id: 1, title: "Planning a trip with artificial intelligence", cefrLevel: "B1", publicCategory: "general-english", tags: ["travel", "artificial-intelligence"] },
  { id: 2, title: "Technology at work", cefrLevel: "B2", publicCategory: "business-english", tags: ["technology", "work"] },
  { id: 3, title: "A weekend in the city", cefrLevel: "A2", publicCategory: "general-english", tags: null },
];

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { ...render(createElement(QueryClientProvider, { client }, createElement(PublicLessonsIndexPage))), client };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ lessons }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("public lesson topic tags", () => {
  it("updates topic counts and matches after reviewed corrections and clearing are refreshed", async () => {
    const { client } = show();
    await screen.findByRole("button", { name: "Travel (1)" });
    // The admin save invalidates this same query family, fetching fresh summaries.
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true, json: async () => ({ lessons: lessons.map((lesson) => lesson.id === 1 ? { ...lesson, tags: ["technology"] } : lesson) }),
    } as Response);
    await client.invalidateQueries({ queryKey: ["public-lesson-index"] });
    await screen.findByRole("button", { name: "Technology (2)" });
    expect(screen.queryByRole("button", { name: "Travel (1)" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Technology (2)" }));
    expect(screen.getByText(lessons[0].title)).toBeTruthy();
    expect(screen.getByText(lessons[1].title)).toBeTruthy();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true, json: async () => ({ lessons: lessons.map((lesson) => lesson.id === 1 ? { ...lesson, tags: [] } : lesson) }),
    } as Response);
    await client.invalidateQueries({ queryKey: ["public-lesson-index"] });
    await screen.findByRole("button", { name: "Technology (1)" });
    expect(screen.queryByText(lessons[0].title)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "All tags" }));
    expect(screen.getByText(lessons[0].title)).toBeTruthy();
    expect(screen.getByText(lessons[2].title)).toBeTruthy();
  });

  it("shows curated tags, counts them, and combines selected topic tag with search labels", async () => {
    show();
    await screen.findByText("Planning a trip with artificial intelligence");
    expect(screen.getAllByText("Travel").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Technology (1)" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Artificial intelligence (1)" }));
    expect(screen.getByText("Planning a trip with artificial intelligence")).toBeTruthy();
    expect(screen.queryByText("Technology at work")).toBeNull();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search free ESL lessons" }), { target: { value: "travel" } });
    expect(screen.getByText("Planning a trip with artificial intelligence")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search free ESL lessons" }), { target: { value: "work" } });
    expect(screen.getByText(/No public lessons match/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "All tags" }).getAttribute("aria-pressed")).toBe("true"));
    expect(screen.getByText("Technology at work")).toBeTruthy();
  });

  it("shows request failures with a retry action", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: "Unavailable" }));
    show();
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
