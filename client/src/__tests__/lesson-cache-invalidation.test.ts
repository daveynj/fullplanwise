/**
 * Verifies cross-page React Query cache invalidation for lessons:
 * after a delete/assign/generate action invalidates the base
 * ["/api/lessons"] key, BOTH the dashboard query (["/api/lessons"]) and
 * the history query (["/api/lessons", {filters}]) refetch fresh data,
 * so the dashboard "Total Lessons" stat and the history list stay in sync
 * without a manual refresh.
 *
 * Uses the app's real query function (getQueryFn) and the exact query keys /
 * invalidation calls used by dashboard-page, lesson-history-page and
 * lesson-generator-page.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import fs from "fs";
import path from "path";
import { createElement as h } from "react";
import { getQueryFn } from "@/lib/queryClient";

interface Lesson {
  id: number;
  title: string;
}
interface PaginatedLessons {
  lessons: Lesson[];
  total: number;
}

// ---- fake server state -----------------------------------------------------
let serverLessons: Lesson[];

function paginatedResponse(): PaginatedLessons {
  return { lessons: [...serverLessons], total: serverLessons.length };
}

let fetchSpy: ReturnType<typeof vi.fn>;

function installFetchMock() {
  fetchSpy = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url);
    const method = init?.method ?? "GET";
    if (/^\/api\/lessons\/\d+$/.test(u) && method === "DELETE") {
      const id = Number(u.split("/").pop());
      serverLessons = serverLessons.filter((l) => l.id !== id);
      return new Response(null, { status: 204 });
    }
    if (u.startsWith("/api/lessons") && method === "GET") {
      return new Response(JSON.stringify(paginatedResponse()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ message: "not found" }), { status: 404 });
  });
  vi.stubGlobal("fetch", fetchSpy);
}

// ---- harness components using the REAL page query keys ---------------------

// Same query as client/src/pages/dashboard-page.tsx
function DashboardStats() {
  const { data } = useQuery<PaginatedLessons>({ queryKey: ["/api/lessons"], retry: false });
  const totalLessons = data?.total ?? 0;
  return h("div", { "data-testid": "total-lessons" }, String(totalLessons));
}

// Same query shape as client/src/pages/lesson-history-page.tsx
const HISTORY_KEY = [
  "/api/lessons",
  {
    page: 1,
    search: "",
    cefrLevel: "all",
    dateFilter: "all",
    category: "all",
    teacherId: 1,
  },
];

function HistoryList() {
  const { data } = useQuery<PaginatedLessons>({
    queryKey: HISTORY_KEY,
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  return h(
    "ul",
    { "data-testid": "history-list" },
    (data?.lessons ?? []).map((l) => h("li", { key: l.id }, l.title)),
  );
}

function makeQueryClient() {
  // Mirrors client/src/lib/queryClient.ts defaults, minus window-focus refetch noise
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: getQueryFn({ on401: "throw" }),
        refetchInterval: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        retry: false,
      },
      mutations: { retry: false },
    },
  });
}

describe("lesson cache invalidation across dashboard and history", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    serverLessons = [
      { id: 1, title: "Lesson One" },
      { id: 2, title: "Lesson Two" },
      { id: 3, title: "Lesson Three" },
    ];
    installFetchMock();
    queryClient = makeQueryClient();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    queryClient.clear();
  });

  function renderBothPages() {
    return render(
      h(QueryClientProvider, { client: queryClient }, h(DashboardStats), h(HistoryList)),
    );
  }

  async function waitForInitialLoad() {
    await waitFor(() => {
      expect(screen.getByTestId("total-lessons").textContent).toBe("3");
      expect(screen.getByTestId("history-list").children.length).toBe(3);
    });
  }

  it("delete: invalidating the base key refreshes dashboard count AND history list", async () => {
    renderBothPages();
    await waitForInitialLoad();

    // Perform the delete exactly like deleteLessonMutation's mutationFn + onSuccess
    await act(async () => {
      const res = await fetch("/api/lessons/2", { method: "DELETE", credentials: "include" });
      expect(res.ok).toBe(true);
      await queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
    });

    await waitFor(() => {
      // Dashboard "Total Lessons" stat updated without manual refresh
      expect(screen.getByTestId("total-lessons").textContent).toBe("2");
      // History list no longer shows the deleted lesson
      expect(screen.queryByText("Lesson Two")).toBeNull();
      expect(screen.getByTestId("history-list").children.length).toBe(2);
    });
  });

  it("generate: invalidating the base key increments the dashboard Total Lessons stat", async () => {
    renderBothPages();
    await waitForInitialLoad();

    // Simulate lesson generation completing (handleJobComplete invalidation)
    await act(async () => {
      serverLessons.push({ id: 4, title: "Brand New Lesson" });
      await queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
    });

    await waitFor(() => {
      expect(screen.getByTestId("total-lessons").textContent).toBe("4");
      expect(screen.getByText("Brand New Lesson")).toBeTruthy();
      expect(screen.getByTestId("history-list").children.length).toBe(4);
    });
  });

  it("assign: base-key invalidation marks both queries stale (prefix matching works with filtered keys)", async () => {
    renderBothPages();
    await waitForInitialLoad();
    const callsBefore = fetchSpy.mock.calls.filter((c) => String(c[0]).startsWith("/api/lessons")).length;

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
    });

    await waitFor(() => {
      const callsAfter = fetchSpy.mock.calls.filter((c) => String(c[0]).startsWith("/api/lessons")).length;
      // Both the dashboard query and the filtered history query refetched
      expect(callsAfter).toBe(callsBefore + 2);
    });
  });
});

// ---- source-level regression guard -----------------------------------------
// Ensures the pages keep invalidating the BASE ["/api/lessons"] key so the
// prefix match above continues to cover both pages in the real app.
describe("pages invalidate the base /api/lessons key", () => {
  const read = (p: string) =>
    fs.readFileSync(path.resolve(__dirname, "..", "pages", p), "utf8");

  it("lesson-history-page delete/assign onSuccess use the base key", () => {
    const src = read("lesson-history-page.tsx");
    const matches = src.match(/invalidateQueries\(\{\s*queryKey:\s*\["\/api\/lessons"\]\s*\}\)/g) ?? [];
    // deleteLessonMutation.onSuccess + assignLessonMutation.onSuccess
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("lesson-generator-page invalidates the base key after generation", () => {
    const src = read("lesson-generator-page.tsx");
    const matches = src.match(/invalidateQueries\(\{\s*queryKey:\s*\["\/api\/lessons"\]\s*\}\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("dashboard-page reads lessons via the bare base key", () => {
    const src = read("dashboard-page.tsx");
    expect(src).toMatch(/queryKey:\s*\["\/api\/lessons"\]/);
  });
});
