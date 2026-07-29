// Guards against adding a page to the client router without registering it
// in the shared route list the server's 404 catch-all uses. If this test
// fails, add the new route path to shared/client-routes.ts.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { clientRoutePaths, validClientRoutes, routePathToRegex } from "@shared/client-routes";

function extractRouterRoutePaths(): string[] {
  const appTsx = fs.readFileSync(
    path.resolve(import.meta.dirname, "..", "..", "client", "src", "App.tsx"),
    "utf8",
  );
  // Match path="..." props on <Route>, <ProtectedRoute>, and similar
  // components inside the Router.
  const matches = appTsx.matchAll(/<\w+[^>]*\bpath="([^"]+)"/g);
  return Array.from(matches, (m) => m[1]);
}

/** Substitute a concrete value for each :param segment. */
function sampleUrlFor(routePath: string): string {
  return routePath
    .split("/")
    .map((seg) => (seg.startsWith(":") ? "sample-value" : seg))
    .join("/");
}

describe("client routes stay in sync with the server 404 catch-all", () => {
  const routerPaths = extractRouterRoutePaths();

  it("finds routes in App.tsx (sanity check on the parser)", () => {
    expect(routerPaths.length).toBeGreaterThanOrEqual(10);
    expect(routerPaths).toContain("/");
    expect(routerPaths).toContain("/dashboard");
  });

  it("every route in App.tsx is accepted by the server route list", () => {
    const missing = routerPaths.filter(
      (routePath) => !validClientRoutes.some((re) => re.test(sampleUrlFor(routePath))),
    );
    expect(
      missing,
      `These client routes from App.tsx are missing from shared/client-routes.ts and would return a 404 in production: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("shared list has no stale routes that no longer exist in App.tsx", () => {
    const routerRegexes = routerPaths.map(routePathToRegex);
    const stale = clientRoutePaths.filter(
      (routePath) => !routerRegexes.some((re) => re.test(sampleUrlFor(routePath))),
    );
    expect(
      stale,
      `These routes in shared/client-routes.ts no longer exist in App.tsx: ${stale.join(", ")}`,
    ).toEqual([]);
  });

  it("routePathToRegex anchors and matches params correctly", () => {
    const re = routePathToRegex("/students/:id");
    expect(re.test("/students/42")).toBe(true);
    expect(re.test("/students")).toBe(false);
    expect(re.test("/students/42/extra")).toBe(false);
    expect(routePathToRegex("/").test("/")).toBe(true);
    expect(routePathToRegex("/").test("/x")).toBe(false);
  });
});
