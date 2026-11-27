import { createElement, Fragment } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

// Keep App's actual route table (including lazy pages and ProtectedRoute),
// Wouter's browser-history subscription, React Query, SEOHead and share controls.
// Only auth, unrelated layout and the expensive lesson activities are replaced.
const auth = vi.hoisted(() => ({ user: null as null | { id: number; isAdmin: boolean } }));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: auth.user, isLoading: false }),
  AuthProvider: ({ children }: any) => children,
}));
vi.mock("@/components/ui/toaster", () => ({ Toaster: () => null }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/components/layout/blog-header", () => ({ BlogHeader: () => null }));
vi.mock("@/pages/landing-page", () => ({ default: () => createElement("h1", null, "Home") }));
vi.mock("@/pages/auth-page", () => ({ default: () => createElement("h1", null, "Sign in") }));
vi.mock("@/components/lesson/lesson-design-panel", () => ({ LessonDesignPanel: () => null }));
vi.mock("@/components/lesson/lesson-content", () => ({
  LessonContent: ({ content }: any) => createElement("div", { "data-testid": "lesson-content" }, content.reading),
}));
import App from "@/App";

// Deliberately different from their first-published titles and CEFR levels:
// navigation and sharing must use the stored URL, not regenerate it.
const travel = {
  id: 41, teacherId: 7, title: "Travel plans, updated", cefrLevel: "C1",
  publicSlug: "planning-a-trip", publicLevel: "b1", isPublic: true, isShared: true,
  topic: "Travel plans, updated", publicCategory: "general-english", tags: ["travel"],
  content: { title: "Travel plans, updated", sections: [], reading: "Travel lesson body" },
};
const work = {
  ...travel, id: 42, title: "Working abroad", publicSlug: "working-abroad",
  content: { title: "Working abroad", sections: [], reading: "Work lesson body" },
};
const linkOnly = {
  ...travel, id: 43, title: "Unlisted lesson", isPublic: false, publicSlug: "unlisted-lesson",
  content: { title: "Unlisted lesson", sections: [], reading: "Unlisted lesson body" },
};
const legacy = {
  ...travel, id: 44, title: "Older shared lesson", isPublic: false,
  publicSlug: null, publicLevel: null,
  content: { title: "Older shared lesson", sections: [], reading: "Older lesson body" },
};
const travelPath = "/esl-lessons/b1/planning-a-trip";
const workPath = "/esl-lessons/b1/working-abroad";
const unlistedPath = "/esl-lessons/b1/unlisted-lesson";
const canonicalTravel = `https://planwiseesl.com${travelPath}`;
const records = [travel, work, linkOnly, legacy];
let fetchMock: ReturnType<typeof vi.fn>;
let writeText: ReturnType<typeof vi.fn>;

function Navigation({ links }: { links: Record<string, string> }) {
  const [location] = useLocation();
  return createElement("nav", { "aria-label": "Test navigation" },
    createElement("output", { "data-testid": "router-location" }, location),
    ...Object.entries(links).map(([label, href]) => createElement(Link, { key: label, href }, label)),
  );
}

function show(path: string, links: Record<string, string> = {}) {
  window.history.replaceState(null, "", path);
  return render(createElement(Fragment, null,
    createElement(Navigation, { links }),
    createElement(App),
  ));
}

async function expectLesson(lesson: typeof travel | typeof legacy, path: string) {
  await screen.findByRole("heading", { level: 1, name: lesson.title });
  await waitFor(() => {
    expect(screen.getByTestId("lesson-content").textContent).toBe(lesson.content.reading);
    expect(window.location.pathname).toBe(path);
    // A changed address bar alone is insufficient: the mounted router must
    // observe replaceState/popstate and use the same lesson URL.
    expect(screen.getByTestId("router-location").textContent).toBe(path);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href"))
      .toBe(`https://planwiseesl.com${path}`);
  });
}

function robots() {
  return document.querySelector('meta[name="robots"]')?.getAttribute("content");
}

beforeEach(() => {
  auth.user = null;
  queryClient.clear();
  document.head.innerHTML = "";
  writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", Object.assign(Object.create(window.navigator), {
    clipboard: { writeText },
  }));
  fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input), window.location.origin);
    if (url.pathname === "/api/public-lesson-index") {
      return { ok: true, status: 200, json: async () => ({ lessons: [travel, work] }) };
    }
    const lesson = records.find((record) =>
      url.pathname === `/api/lessons/${record.id}` ||
      (record.publicSlug && url.pathname === `/api/public-lessons/${record.publicSlug}`));
    if (!lesson) throw new Error(`Unexpected request: ${url.pathname}`);
    return { ok: true, status: 200, json: async () => lesson };
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
  document.head.innerHTML = "";
});

describe("hydrated public lesson navigation", () => {
  it("replaces a numeric SPA link with the stored URL, retaining query/hash and history position", async () => {
    const suffix = "?utm_source=teacher&tag=a%2Bb&tag=c#vocabulary";
    show("/esl-lessons", { "Old share": `/lessons/41${suffix}` });
    await screen.findByRole("heading", { name: "Travel plans, updated" });
    const historyLength = window.history.length;
    fireEvent.click(screen.getByRole("link", { name: "Old share" }));
    await expectLesson(travel, travelPath);
    expect(window.location.search + window.location.hash).toBe(suffix);
    expect(window.history.length).toBe(historyLength + 1);
    expect(fetchMock).toHaveBeenCalledWith("/api/lessons/41", { credentials: "include" });
    expect(fetchMock).toHaveBeenCalledWith("/api/public-lessons/planning-a-trip", { credentials: "include" });

    act(() => window.history.back());
    await screen.findByRole("searchbox", { name: "Search free ESL lessons" });
    expect(window.location.pathname).toBe("/esl-lessons");
    act(() => window.history.forward());
    await expectLesson(travel, travelPath);
    expect(window.location.search + window.location.hash).toBe(suffix);
  });

  it("fetches the second slug on the same route and restores each lesson with back/forward", async () => {
    show(travelPath, { "Next lesson": `${workPath}?source=next#reading` });
    await expectLesson(travel, travelPath);
    fireEvent.click(screen.getByRole("link", { name: "Next lesson" }));
    await expectLesson(work, workPath);
    expect(screen.queryByText("Travel lesson body")).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/public-lessons/working-abroad", { credentials: "include" });
    expect(fetchMock.mock.calls.map(([url]) => url)).not.toContain("/api/lessons/undefined");
    act(() => window.history.back());
    await expectLesson(travel, travelPath);
    act(() => window.history.forward());
    await expectLesson(work, workPath);
    expect(window.location.search + window.location.hash).toBe("?source=next#reading");
  });

  it.each(["/esl-lessons", "/esl-lessons/b1"])(
    "opens stored slug links from the real %s browse page without a document reload",
    async (indexPath) => {
      show(indexPath);
      const link = await screen.findByRole("link", { name: /Travel plans, updated/ });
      expect(link.getAttribute("href")).toBe(travelPath);
      fireEvent.click(link);
      await expectLesson(travel, travelPath);
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/public-lesson-index${indexPath.endsWith("/b1") ? "?level=B1" : ""}`,
      );
    },
  );

  it.each(["/history/41", "/fullscreen/41"])(
    "keeps the authenticated %s route and its query intact",
    async (path) => {
      auth.user = { id: 7, isAdmin: false };
      show("/esl-lessons", { "My lesson": `${path}?from=library#reading` });
      fireEvent.click(screen.getByRole("link", { name: "My lesson" }));
      await screen.findByRole("heading", { level: 1, name: travel.title });
      await waitFor(() => expect(screen.getByTestId("lesson-content").textContent).toBe(travel.content.reading));
      expect(window.location.pathname + window.location.search + window.location.hash)
        .toBe(`${path}?from=library#reading`);
      expect(screen.getByTestId("router-location").textContent).toBe(path);
      expect(fetchMock).toHaveBeenCalledWith("/api/lessons/41", { credentials: "include" });
      expect(fetchMock.mock.calls.some(([url]) => String(url).startsWith("/api/public-lessons/"))).toBe(false);
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(canonicalTravel);
    },
  );

  it.each(["/history/41", "/fullscreen/41"])(
    "still requires sign-in for %s instead of turning it into a public route",
    async (path) => {
      show(`${path}?from=library`);
      await screen.findByRole("heading", { name: "Sign in" });
      expect(window.location.pathname).toBe("/auth");
      expect(new URLSearchParams(window.location.search).get("redirect")).toBe(`${path}?from=library`);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});

describe("canonical sharing and indexing after navigation", () => {
  it("copies and shares only the stored public URL, then updates all links for another slug", async () => {
    show("/esl-lessons", {
      "Numeric share": "/lessons/41?utm_source=private#reading",
      "Next share": `${workPath}?utm_source=another#vocabulary`,
    });
    fireEvent.click(screen.getByRole("link", { name: "Numeric share" }));
    await expectLesson(travel, travelPath);

    async function expectShares(url: string, lesson: typeof travel) {
      fireEvent.click(screen.getByRole("button", { name: /Copy link|Copied/ }));
      await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(url));
      const whatsapp = new URL(screen.getByRole("link", { name: "WhatsApp" }).getAttribute("href")!);
      expect(whatsapp.origin + whatsapp.pathname).toBe("https://wa.me/");
      expect(whatsapp.searchParams.get("text"))
        .toBe(`Free ${lesson.cefrLevel} ESL lesson (${lesson.title}) — no login required: ${url}`);
      const linkedin = new URL(screen.getByRole("link", { name: "LinkedIn" }).getAttribute("href")!);
      expect(linkedin.origin + linkedin.pathname).toBe("https://www.linkedin.com/sharing/share-offsite/");
      expect(linkedin.searchParams.get("url")).toBe(url);
      expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(url);
    }

    await expectShares(canonicalTravel, travel);
    fireEvent.click(screen.getByRole("link", { name: "Next share" }));
    await expectLesson(work, workPath);
    await expectShares(`https://planwiseesl.com${workPath}`, work);
  });

  it("retains noindex for an unpublished slug and resets it when returning to a public lesson", async () => {
    show(travelPath, { "Unlisted": `${unlistedPath}?from=share#reading` });
    await expectLesson(travel, travelPath);
    expect(robots()).toContain("index, follow");
    fireEvent.click(screen.getByRole("link", { name: "Unlisted" }));
    await expectLesson(linkOnly, unlistedPath);
    expect(robots()).toBe("noindex, nofollow");
    expect(window.location.search + window.location.hash).toBe("?from=share#reading");
    expect(screen.queryByRole("button", { name: "Copy link" })).toBeNull();
    act(() => window.history.back());
    await expectLesson(travel, travelPath);
    expect(robots()).toContain("index, follow");
    act(() => window.history.forward());
    await expectLesson(linkOnly, unlistedPath);
    expect(robots()).toBe("noindex, nofollow");
  });

  it("does not rewrite a link-only numeric share even when it has a stored slug", async () => {
    show("/esl-lessons", { "Unlisted": "/lessons/43?from=share#reading" });
    fireEvent.click(screen.getByRole("link", { name: "Unlisted" }));
    await screen.findByRole("heading", { level: 1, name: linkOnly.title });
    await waitFor(() => expect(robots()).toBe("noindex, nofollow"));
    expect(window.location.pathname + window.location.search + window.location.hash)
      .toBe("/lessons/43?from=share#reading");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href"))
      .toBe(`https://planwiseesl.com${unlistedPath}`);
  });

  it("keeps older link-only lessons without slug fields available and noindex", async () => {
    show("/esl-lessons", { "Older share": "/lessons/44" });
    fireEvent.click(screen.getByRole("link", { name: "Older share" }));
    await expectLesson(legacy, "/lessons/44");
    expect(robots()).toBe("noindex, nofollow");
  });
});
