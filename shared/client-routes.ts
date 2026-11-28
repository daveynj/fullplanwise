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
  "/esl-lessons",
  "/esl-lessons/topics/:tag", // curated theme validity checked by the /esl-lessons/topics/:tag server route
  "/esl-lessons/:level", // level validity checked by the /esl-lessons/:level server route
  "/esl-lessons/:level/:slug", // public slug visibility checked by the server
  // Public information pages (shared/marketing-pages.ts)
  "/how-it-works",
  "/about",
  "/pricing",
  "/student-experience",
  "/for/online-tutors",
  "/for/preply-tutors",
  "/for/italki-tutors",
  "/for/freelance-esl-teachers",
  "/for/language-schools",
  "/for/new-esl-teachers",
  "/for/experienced-esl-teachers",
  "/compare",
  "/compare/engoo",
  "/compare/esl-pals",
  "/compare/breaking-news-english",
  "/compare/printdiscuss",
  "/compare/edio",
  "/compare/immerly",
  "/compare/esl-joy",
  "/compare/twee",
  "/compare/magicschool-diffit",
  "/compare/esl-brains",
  "/compare/fluentize",
  "/compare/linguahouse",
  "/compare/off2class",
  "/compare/chatgpt",
  "/compare/cefr-benchmark",
  "/compare/student-memory-proof",
  "/guides",
  "/guides/how-to-plan-an-esl-conversation-lesson",
  "/guides/esl-conversation-topics-by-level",
  "/guides/cefr-levels-explained",
  "/guides/personalise-esl-lessons",
  "/guides/free-esl-conversation-lessons-for-adults",
  "/guides/free-b1-esl-conversation-lessons",
  "/guides/christmas-and-new-year-esl-lessons-for-adults",
  "/guides/30-minute-online-esl-conversation-lesson",
  "/forgot-password",
  "/reset-password/:token",
  "/twitter-card",
  // A student's own page; an unknown or switched-off code shows "not available"
  "/s/:token",
  "/s/:token/words",
  "/s/:token/flashcards",
  "/s/:token/lessons/:lessonId",
  "/s/:token/next",
];

/**
 * Pages that were taken down, and where their old address now sends people
 * (a permanent 301, so links and search results keep working).
 */
export const retiredPageRedirects: Record<string, string> = {
  // Removed 26 Nov 2026: PlanWise no longer mentions Cambly.
  "/guides/cambly-feedback-score-super-tutor": "/guides",
};

/** RegExps the server's 404 catch-all uses to recognize valid client pages. */
export const validClientRoutes: RegExp[] = clientRoutePaths.map(routePathToRegex);
