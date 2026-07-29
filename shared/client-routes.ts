// Single source of truth for the client page routes the server must accept.
//
// The server's catch-all 404 handler (server/routes.ts) uses this list to
// decide whether a GET path is a real client page (serve the SPA shell) or an
// unknown URL (return a real HTTP 404 for SEO).
//
// A test (server/__tests__/client-routes-sync.test.ts) parses the client
// router in client/src/App.tsx and fails if any route defined there is not
// matched by these patterns — so adding a page without updating this file
// breaks the build instead of the live page.

/**
 * Converts a wouter-style route path (e.g. "/students/:id") into a RegExp
 * that matches concrete URLs for that route.
 */
export function routePathToRegex(routePath: string): RegExp {
  const pattern = routePath
    .split("/")
    .map((segment) => (segment.startsWith(":") ? "[^/]+" : escapeRegex(segment)))
    .join("/");
  return new RegExp(`^${pattern}$`);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * All page routes defined in the client router (client/src/App.tsx),
 * excluding the catch-all NotFound route.
 */
export const clientRoutePaths: string[] = [
  "/",
  "/dashboard",
  "/generate",
  "/students",
  "/students/:id",
  "/history",
  "/history/:id",
  "/lessons/:id", // existence check handled by the /lessons/:id server route
  "/fullscreen/:id",
  "/public-library",
  "/buy-credits",
  "/subscription-success",
  "/settings",
  "/admin",
  "/admin/lessons",
  "/admin/blog",
  "/grammar-test",
  "/grammar-showcase",
  "/auth",
  "/blog",
  "/blog/:slug", // existence check handled by the /blog/:slug server route
  "/forgot-password",
  "/reset-password/:token",
  "/twitter-card",
];

/** RegExps the server's 404 catch-all uses to recognize valid client pages. */
export const validClientRoutes: RegExp[] = clientRoutePaths.map(routePathToRegex);
