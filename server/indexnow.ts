/**
 * IndexNow: tells Bing (and other participating search engines) that pages
 * changed, so new public lessons and blog posts are crawled within minutes.
 * https://www.indexnow.org/documentation
 *
 * The key is public by design: search engines verify ownership by fetching
 * https://planwiseesl.com/{INDEXNOW_KEY}.txt and checking the body equals the key.
 */

export const INDEXNOW_HOST = "planwiseesl.com";
export const INDEXNOW_SITE = `https://${INDEXNOW_HOST}`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
/** IndexNow accepts at most 10,000 URLs per request. */
const MAX_URLS_PER_REQUEST = 10_000;
const REQUEST_TIMEOUT_MS = 15_000;

const KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;

export function getIndexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key && KEY_PATTERN.test(key) ? key : null;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Turns site paths ("/lessons/42") into absolute planwiseesl.com URLs and removes duplicates. */
export function toIndexNowUrls(pathsOrUrls: string[]): string[] {
  const out = new Set<string>();
  for (const value of pathsOrUrls) {
    if (!value) continue;
    const url = value.startsWith("http") ? value : `${INDEXNOW_SITE}${value.startsWith("/") ? "" : "/"}${value}`;
    try {
      // IndexNow rejects URLs whose host doesn't match the submitted host.
      if (new URL(url).host === INDEXNOW_HOST) out.add(url);
    } catch {
      // skip malformed values
    }
  }
  return Array.from(out);
}

/** Pages that change when a lesson becomes public: the lesson and the browse pages that list it. */
export function lessonIndexNowPaths(lesson: { id: number; cefrLevel?: string | null }): string[] {
  const paths = [`/lessons/${lesson.id}`, "/esl-lessons"];
  if (lesson.cefrLevel) paths.push(`/esl-lessons/${lesson.cefrLevel.toLowerCase()}`);
  return paths;
}

/** Pages that change when a blog post is published. */
export function blogIndexNowPaths(post: { slug: string }): string[] {
  return [`/blog/${post.slug}`, "/blog"];
}

export type IndexNowResult =
  | { ok: true; submitted: number }
  | { ok: false; submitted: 0; error: string };

/**
 * Submits URLs and reports the outcome. Never throws. Used directly by the admin
 * "resubmit" action, which needs the result; request handlers should use
 * notifyIndexNow instead so they never wait on a third-party API.
 */
export async function submitToIndexNow(pathsOrUrls: string[]): Promise<IndexNowResult> {
  try {
    if (!isProduction()) {
      return { ok: false, submitted: 0, error: "IndexNow only runs in production." };
    }
    const key = getIndexNowKey();
    if (!key) {
      return { ok: false, submitted: 0, error: "INDEXNOW_KEY is missing or invalid." };
    }
    const urls = toIndexNowUrls(pathsOrUrls);
    if (!urls.length) return { ok: true, submitted: 0 };

    for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
      const urlList = urls.slice(i, i + MAX_URLS_PER_REQUEST);
      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: INDEXNOW_HOST,
          key,
          keyLocation: `${INDEXNOW_SITE}/${key}.txt`,
          urlList,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      // 200 = submitted, 202 = accepted (key validation pending).
      if (res.status !== 200 && res.status !== 202) {
        const body = (await res.text().catch(() => "")).slice(0, 300);
        return {
          ok: false,
          submitted: 0,
          error: `IndexNow responded ${res.status}${body ? `: ${body}` : ""}`,
        };
      }
    }

    console.log(`[IndexNow] Submitted ${urls.length} URL(s)`);
    return { ok: true, submitted: urls.length };
  } catch (error: any) {
    return { ok: false, submitted: 0, error: `IndexNow request failed: ${error?.message || String(error)}` };
  }
}

/**
 * Fire-and-forget notification for request handlers. Returns immediately,
 * never throws, and only logs failures. No-op outside production.
 */
export function notifyIndexNow(pathsOrUrls: string[]): void {
  if (!isProduction()) return;
  void submitToIndexNow(pathsOrUrls)
    .then((result) => {
      if (!result.ok) console.warn(`[IndexNow] Notification failed: ${result.error}`);
    })
    .catch((error) => console.warn("[IndexNow] Notification failed:", error));
}
